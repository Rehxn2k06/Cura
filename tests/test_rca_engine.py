"""
test_rca_engine.py
Unit tests for the RCA engine and dependency graph.
"""

import pytest
from graph.dependency_graph import ServiceDependencyGraph
from rca.rca_engine import RCAEngine


SERVICES_CONFIG = [
    {"name": "auth-service", "dependencies": ["payment-service"]},
    {"name": "payment-service", "dependencies": ["database-service"]},
    {"name": "database-service", "dependencies": []},
]


def make_graph():
    g = ServiceDependencyGraph()
    g.build_from_config(SERVICES_CONFIG)
    return g


def make_engine(graph=None, decay=0.8):
    g = graph or make_graph()
    return RCAEngine(g, weight_decay=decay), g


class TestDependencyGraph:
    def test_nodes_present(self):
        g = make_graph()
        nodes = g.get_all_services()
        assert "auth-service" in nodes
        assert "payment-service" in nodes
        assert "database-service" in nodes

    def test_edges_correct(self):
        g = make_graph()
        assert g.get_dependency_weight("auth-service", "payment-service") > 0
        assert g.get_dependency_weight("payment-service", "database-service") > 0
        assert g.get_dependency_weight("database-service", "auth-service") == 0.0

    def test_root_services(self):
        g = make_graph()
        roots = g.get_root_services()
        assert "database-service" in roots
        assert "auth-service" not in roots

    def test_upstream_services(self):
        g = make_graph()
        # Who is AFFECTED when database fails?
        affected = g.get_upstream_services("database-service")
        assert "payment-service" in affected
        assert "auth-service" in affected

    def test_as_dict_structure(self):
        g = make_graph()
        d = g.as_dict()
        assert "nodes" in d and "edges" in d
        assert len(d["nodes"]) == 3
        assert len(d["edges"]) >= 2


class TestRCAEngine:
    def test_no_anomalies_returns_none(self):
        engine, _ = make_engine()
        result = engine.analyze({"auth-service": {"is_anomaly": False, "anomaly_score": 0.1}})
        assert result["root_cause"] is None
        assert result["confidence"] == 0.0

    def test_single_anomaly_identified(self):
        engine, _ = make_engine()
        anomalies = {
            "database-service": {"is_anomaly": True, "anomaly_score": 0.9},
            "payment-service": {"is_anomaly": False, "anomaly_score": 0.1},
            "auth-service": {"is_anomaly": False, "anomaly_score": 0.05},
        }
        result = engine.analyze(anomalies)
        assert result["root_cause"] == "database-service"
        assert result["confidence"] > 0

    def test_db_failure_propagation(self):
        """Classic scenario: all services anomalous due to DB failure."""
        engine, _ = make_engine()
        anomalies = {
            "database-service": {"is_anomaly": True, "anomaly_score": 0.92},
            "payment-service": {"is_anomaly": True, "anomaly_score": 0.65},
            "auth-service": {"is_anomaly": True, "anomaly_score": 0.45},
        }
        result = engine.analyze(anomalies)
        # DB should be root cause because it has highest score and no upstream dependencies
        assert result["root_cause"] == "database-service"
        assert result["confidence"] >= 0.5

    def test_explanation_present(self):
        engine, _ = make_engine()
        anomalies = {
            "database-service": {"is_anomaly": True, "anomaly_score": 0.88},
        }
        result = engine.analyze(anomalies)
        assert isinstance(result["explanation"], str)
        assert len(result["explanation"]) > 10

    def test_anomalous_services_list(self):
        engine, _ = make_engine()
        anomalies = {
            "database-service": {"is_anomaly": True, "anomaly_score": 0.9},
            "auth-service": {"is_anomaly": True, "anomaly_score": 0.4},
            "payment-service": {"is_anomaly": False, "anomaly_score": 0.1},
        }
        result = engine.analyze(anomalies)
        assert "database-service" in result["anomalous_services"]
        assert "auth-service" in result["anomalous_services"]
        assert "payment-service" not in result["anomalous_services"]

    def test_scores_normalized(self):
        engine, _ = make_engine()
        anomalies = {
            "database-service": {"is_anomaly": True, "anomaly_score": 0.9},
            "payment-service": {"is_anomaly": True, "anomaly_score": 0.6},
        }
        result = engine.analyze(anomalies)
        for score in result["scores"].values():
            assert 0.0 <= score <= 1.0
