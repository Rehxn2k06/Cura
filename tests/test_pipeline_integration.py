"""
test_pipeline_integration.py  (v2 — 6 services + LSTM ensemble)
End-to-end integration test with the full 6-service topology.
"""

import pytest
from features.feature_extractor import FeatureExtractor
from detection.anomaly_detector import AnomalyDetectionEngine
from graph.dependency_graph import ServiceDependencyGraph
from rca.rca_engine import RCAEngine
from decision.decision_engine import DecisionEngine
from ingestion.metrics_simulator import generate_snapshot, all_services


SERVICES_CONFIG = [
    {"name": "frontend-service",  "dependencies": ["catalogue-service", "cart-service"]},
    {"name": "catalogue-service", "dependencies": ["database-service"]},
    {"name": "cart-service",      "dependencies": ["order-service"]},
    {"name": "order-service",     "dependencies": ["payment-service"]},
    {"name": "payment-service",   "dependencies": ["database-service"]},
    {"name": "database-service",  "dependencies": []},
]
SERVICE_NAMES = [s["name"] for s in SERVICES_CONFIG]


@pytest.fixture(scope="module")
def trained_detector():
    det = AnomalyDetectionEngine(
        SERVICE_NAMES,
        contamination=0.05,
        anomaly_threshold=0.55,
        if_weight=0.6,
        lstm_weight=0.4,
        lstm_seq_len=10,
        lstm_hidden=8,
        lstm_epochs=20,   # fewer epochs for test speed
    )
    ext = FeatureExtractor(window=10)
    det.load_or_train(ext, n_normal_samples=150)
    return det


@pytest.fixture(scope="module")
def graph():
    g = ServiceDependencyGraph()
    g.build_from_config(SERVICES_CONFIG)
    return g


@pytest.fixture(scope="module")
def rca_engine(graph):
    return RCAEngine(graph, weight_decay=0.8)


@pytest.fixture(scope="module")
def decision_engine():
    rules = {
        "database-service":  "scale_db",
        "payment-service":   "restart_pod",
        "order-service":     "restart_pod",
        "cart-service":      "restart_pod",
        "catalogue-service": "restart_pod",
        "frontend-service":  "alert",
        "default":           "alert",
    }
    return DecisionEngine(rules=rules, confidence_threshold=0.5)


def build_extractor_with_failures() -> tuple:
    """Returns (extractor, detector) primed with DB failure data."""
    ext = FeatureExtractor(window=10)
    det = AnomalyDetectionEngine(
        SERVICE_NAMES, contamination=0.05,
        anomaly_threshold=0.55, lstm_hidden=8, lstm_epochs=10
    )
    det.load_or_train(ext, n_normal_samples=100)

    for _ in range(20):
        for record in generate_snapshot(failure_services=all_services(), severity=1.0):
            ext.ingest(record)
            det.push_raw(record)
    return ext, det


class TestSixServiceTopology:
    def test_all_6_services_present(self, trained_detector):
        results = trained_detector.detect(FeatureExtractor(window=10))
        # Before any features: returns 0 for all (no crash)
        assert len(results) == 6

    def test_all_services_have_ensemble_fields(self, trained_detector):
        ext, det = build_extractor_with_failures()
        results = det.detect(ext)
        for svc in SERVICE_NAMES:
            assert svc in results
            r = results[svc]
            assert "if_score"      in r, f"Missing if_score for {svc}"
            assert "lstm_score"    in r, f"Missing lstm_score for {svc}"
            assert "anomaly_score" in r, f"Missing anomaly_score for {svc}"
            assert "is_anomaly"    in r

    def test_ensemble_score_bounded(self, trained_detector):
        ext, det = build_extractor_with_failures()
        results = det.detect(ext)
        for svc, r in results.items():
            assert 0.0 <= r["anomaly_score"] <= 1.0, f"{svc} score out of range"
            assert 0.0 <= r["if_score"]      <= 1.0
            assert 0.0 <= r["lstm_score"]    <= 1.0


class TestRCAWithSixServices:
    def test_db_root_cause_identified(self, rca_engine):
        """DB failure with cascade → RCA should identify database-service."""
        anomalies = {
            "database-service":  {"is_anomaly": True,  "anomaly_score": 0.92},
            "payment-service":   {"is_anomaly": True,  "anomaly_score": 0.68},
            "catalogue-service": {"is_anomaly": True,  "anomaly_score": 0.60},
            "order-service":     {"is_anomaly": True,  "anomaly_score": 0.50},
            "cart-service":      {"is_anomaly": True,  "anomaly_score": 0.40},
            "frontend-service":  {"is_anomaly": True,  "anomaly_score": 0.25},
        }
        result = rca_engine.analyze(anomalies)
        assert result["root_cause"] == "database-service"
        assert result["confidence"] > 0.5

    def test_rca_no_anomalies(self, rca_engine):
        clean = {svc: {"is_anomaly": False, "anomaly_score": 0.05}
                 for svc in SERVICE_NAMES}
        result = rca_engine.analyze(clean)
        assert result["root_cause"] is None

    def test_partial_cascade(self, rca_engine):
        """Only DB and payment fail — DB should still be root."""
        anomalies = {
            "database-service": {"is_anomaly": True,  "anomaly_score": 0.88},
            "payment-service":  {"is_anomaly": True,  "anomaly_score": 0.55},
            "order-service":    {"is_anomaly": False, "anomaly_score": 0.1},
            "cart-service":     {"is_anomaly": False, "anomaly_score": 0.1},
            "catalogue-service":{"is_anomaly": False, "anomaly_score": 0.1},
            "frontend-service": {"is_anomaly": False, "anomaly_score": 0.05},
        }
        result = rca_engine.analyze(anomalies)
        assert result["root_cause"] == "database-service"


class TestDecisionEngine:
    def test_db_maps_to_scale(self, decision_engine):
        dec = decision_engine.decide({"root_cause": "database-service", "confidence": 0.91})
        assert dec["action"] == "scale_db"
        assert dec["auto_remediate"] is True

    def test_payment_maps_to_restart(self, decision_engine):
        dec = decision_engine.decide({"root_cause": "payment-service", "confidence": 0.75})
        assert dec["action"] == "restart_pod"

    def test_frontend_maps_to_alert(self, decision_engine):
        dec = decision_engine.decide({"root_cause": "frontend-service", "confidence": 0.80})
        assert dec["action"] == "alert"

    def test_low_confidence_no_auto(self, decision_engine):
        dec = decision_engine.decide({"root_cause": "database-service", "confidence": 0.3})
        assert dec["auto_remediate"] is False

    def test_no_root_no_action(self, decision_engine):
        dec = decision_engine.decide({"root_cause": None, "confidence": 0.0})
        assert dec["action"] == "no_action"
