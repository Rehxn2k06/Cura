"""
anomaly_detector.py  (v2 — IF + LSTM ensemble)
Combines IsolationForest (point anomalies) with LSTM (degradation trends).

Ensemble: score = IF_weight * IF_score + LSTM_weight * LSTM_score
- IF:   fast, reliable, detects sudden spikes
- LSTM: slow to warm up, detects creeping degradation IF misses
"""

import numpy as np
import joblib
from pathlib import Path
from typing import Dict, Optional, Tuple
from sklearn.ensemble import IsolationForest

from features.feature_extractor import FeatureExtractor
from detection.lstm_detector import LSTMServiceDetector

MODEL_DIR = Path(__file__).parent / "model_store"
MODEL_DIR.mkdir(exist_ok=True)


# ── IsolationForest wrapper (unchanged from v1) ───────────────────────────────

class ServiceAnomalyDetector:
    def __init__(self, service: str, contamination: float = 0.05):
        self.service = service
        self.contamination = contamination
        self._model: Optional[IsolationForest] = None
        self._trained = False
        self._model_path = MODEL_DIR / f"if_{service.replace('-', '_')}.pkl"

    def train(self, feature_matrix: np.ndarray) -> None:
        self._model = IsolationForest(
            contamination=self.contamination,
            n_estimators=100,
            random_state=42,
        )
        self._model.fit(feature_matrix)
        self._trained = True
        joblib.dump(self._model, self._model_path)

    def load(self) -> bool:
        if self._model_path.exists():
            try:
                self._model = joblib.load(self._model_path)
                self._trained = True
                return True
            except Exception:
                pass
        return False

    def predict(self, feature_vector: np.ndarray) -> float:
        """Returns IF anomaly score in [0, 1]. Higher = more anomalous."""
        if not self._trained or self._model is None:
            return 0.0
        vec = feature_vector.reshape(1, -1)
        raw_score = float(self._model.decision_function(vec)[0])
        return float(np.clip(0.5 - raw_score, 0, 1))


# ── Ensemble Detection Engine ─────────────────────────────────────────────────

class AnomalyDetectionEngine:
    """
    Manages both IsolationForest and LSTM detectors per service.
    Returns individual scores + ensemble decision.
    """

    def __init__(
        self,
        services: list,
        contamination: float = 0.05,
        anomaly_threshold: float = 0.55,
        if_weight: float = 0.6,
        lstm_weight: float = 0.4,
        lstm_seq_len: int = 10,
        lstm_hidden: int = 8,
        lstm_epochs: int = 40,
    ):
        self.services = services
        self.anomaly_threshold = anomaly_threshold
        self.if_weight = if_weight
        self.lstm_weight = lstm_weight

        self._if_detectors: Dict[str, ServiceAnomalyDetector] = {
            svc: ServiceAnomalyDetector(svc, contamination) for svc in services
        }
        self._lstm_detectors: Dict[str, LSTMServiceDetector] = {
            svc: LSTMServiceDetector(svc, seq_len=lstm_seq_len,
                                     hidden_size=lstm_hidden,
                                     epochs=lstm_epochs)
            for svc in services
        }

    def load_or_train(self, extractor: FeatureExtractor,
                      n_normal_samples: int = 250) -> None:
        """
        Load persisted models or train from scratch on synthetic normal data.
        IF and LSTM are trained independently.
        """
        from ingestion.metrics_simulator import generate_snapshot

        for svc in self.services:
            if_det = self._if_detectors[svc]
            lstm_det = self._lstm_detectors[svc]

            if_loaded = if_det.load()
            lstm_loaded = lstm_det.load()

            if if_loaded and lstm_loaded:
                print(f"[ADE] Loaded persisted models for {svc}")
                continue

            print(f"[ADE] Training models for {svc}...")
            ext = FeatureExtractor(window=10)
            if_vectors = []
            raw_records = []

            for _ in range(n_normal_samples + 15):
                for record in generate_snapshot():
                    ext.ingest(record)
                    if record["service"] == svc:
                        raw_records.append(record)
                        lstm_det.push(record)
                vec = ext.to_feature_vector(svc)
                if vec is not None:
                    if_vectors.append(vec)
                if len(if_vectors) >= n_normal_samples:
                    break

            # Train IF
            if not if_loaded and if_vectors:
                matrix = np.vstack(if_vectors)
                if_det.train(matrix)
                print(f"[ADE] IF trained {svc}: {matrix.shape}")

            # Train LSTM
            if not lstm_loaded and len(raw_records) >= 20:
                lstm_det.train(raw_records)

    def push_raw(self, record: dict) -> None:
        """Feed raw record to LSTM buffer for the appropriate service."""
        svc = record.get("service")
        if svc and svc in self._lstm_detectors:
            self._lstm_detectors[svc].push(record)

    def detect(self, extractor: FeatureExtractor) -> Dict[str, dict]:
        """
        Run ensemble detection.

        Returns:
        {
          service: {
            if_score: float,
            lstm_score: float,
            anomaly_score: float,   # ensemble
            is_anomaly: bool,
          }
        }
        """
        results = {}
        for svc in self.services:
            vec = extractor.to_feature_vector(svc)

            if_score = self._if_detectors[svc].predict(vec) if vec is not None else 0.0
            lstm_score = self._lstm_detectors[svc].score()

            ensemble = self.if_weight * if_score + self.lstm_weight * lstm_score
            ensemble = float(np.clip(ensemble, 0, 1))
            is_anomaly = ensemble >= self.anomaly_threshold

            results[svc] = {
                "if_score":      round(if_score, 4),
                "lstm_score":    round(lstm_score, 4),
                "anomaly_score": round(ensemble, 4),
                "is_anomaly":    is_anomaly,
            }
        return results
