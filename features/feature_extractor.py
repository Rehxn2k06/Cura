"""
feature_extractor.py
Converts raw metric streams into ML-ready feature vectors.

Features produced per service window:
  - rolling_mean / rolling_std for each metric
  - delta (first difference) for each metric
  - z_score for each metric vs. rolling baseline
  - cross-service latency correlation (between services)
"""

import numpy as np
from collections import defaultdict, deque
from typing import Dict, List, Optional


METRIC_KEYS = ["cpu", "memory", "latency", "error_rate", "throughput"]


class ServiceFeatureBuffer:
    """Rolling buffer for one service's metrics."""

    def __init__(self, window: int = 10):
        self.window = window
        self._buffers: Dict[str, deque] = {k: deque(maxlen=window) for k in METRIC_KEYS}
        self._prev: Dict[str, Optional[float]] = {k: None for k in METRIC_KEYS}

    def push(self, record: dict) -> None:
        for k in METRIC_KEYS:
            v = record.get(k, 0.0)
            self._buffers[k].append(v)
            self._prev[k] = v

    def ready(self) -> bool:
        return all(len(self._buffers[k]) >= 2 for k in METRIC_KEYS)

    def extract(self) -> Dict[str, float]:
        features = {}
        for k in METRIC_KEYS:
            arr = np.array(self._buffers[k], dtype=float)
            mean = float(np.mean(arr))
            std = float(np.std(arr)) if len(arr) > 1 else 0.0
            last = float(arr[-1]) if len(arr) > 0 else 0.0
            prev = float(arr[-2]) if len(arr) > 1 else last
            delta = last - prev
            z = (last - mean) / (std + 1e-9)

            features[f"{k}_mean"] = mean
            features[f"{k}_std"] = std
            features[f"{k}_delta"] = delta
            features[f"{k}_z"] = z
            features[f"{k}_last"] = last

        return features


class FeatureExtractor:
    """
    Maintains per-service rolling buffers and computes feature vectors.
    Also computes cross-service latency correlation.
    """

    def __init__(self, window: int = 10):
        self.window = window
        self._buffers: Dict[str, ServiceFeatureBuffer] = {}
        # Cross-service latency history
        self._latency_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=window))

    def _ensure_service(self, service: str) -> None:
        if service not in self._buffers:
            self._buffers[service] = ServiceFeatureBuffer(self.window)

    def ingest(self, record: dict) -> None:
        """Push a raw metric record into the extractor."""
        svc = record["service"]
        self._ensure_service(svc)
        self._buffers[svc].push(record)
        self._latency_history[svc].append(record.get("latency", 0.0))

    def extract_all(self) -> Dict[str, dict]:
        """
        Return feature dicts for all services that have enough data.
        Also appends cross-service latency correlation.
        """
        result = {}
        for svc, buf in self._buffers.items():
            if buf.ready():
                features = buf.extract()
                # Append cross-service latency correlation vs other services
                for other_svc, hist in self._latency_history.items():
                    if other_svc == svc or len(hist) < 2:
                        continue
                    my_hist = np.array(self._latency_history[svc], dtype=float)
                    ot_hist = np.array(hist, dtype=float)
                    min_len = min(len(my_hist), len(ot_hist))
                    if min_len >= 2:
                        corr = float(np.corrcoef(my_hist[-min_len:], ot_hist[-min_len:])[0, 1])
                    else:
                        corr = 0.0
                    features[f"latency_corr_{other_svc.replace('-','_')}"] = corr
                result[svc] = features
        return result

    def to_feature_vector(self, service: str) -> Optional[np.ndarray]:
        """Return a flat numpy feature vector for a single service."""
        all_feats = self.extract_all()
        if service not in all_feats:
            return None
        return np.array(list(all_feats[service].values()), dtype=float)

    def feature_names(self, service: str) -> Optional[List[str]]:
        all_feats = self.extract_all()
        if service not in all_feats:
            return None
        return list(all_feats[service].keys())


# ── Stateless helper functions ────────────────────────────────────────────────

def rolling_mean(series: list, window: int = 10) -> float:
    arr = np.array(series[-window:], dtype=float)
    return float(np.mean(arr))


def rolling_std(series: list, window: int = 10) -> float:
    arr = np.array(series[-window:], dtype=float)
    return float(np.std(arr))


def delta(series: list) -> float:
    if len(series) < 2:
        return 0.0
    return float(series[-1] - series[-2])


def z_score(value: float, series: list) -> float:
    arr = np.array(series, dtype=float)
    mean = float(np.mean(arr))
    std = float(np.std(arr))
    return float((value - mean) / (std + 1e-9))
