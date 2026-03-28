"""
test_feature_extractor.py
Unit tests for the feature extraction layer.
"""

import pytest
import numpy as np
from features.feature_extractor import (
    FeatureExtractor,
    rolling_mean,
    rolling_std,
    delta,
    z_score,
)


class TestStatelessHelpers:
    def test_rolling_mean_basic(self):
        data = [1.0, 2.0, 3.0, 4.0, 5.0]
        assert rolling_mean(data, window=5) == pytest.approx(3.0)

    def test_rolling_mean_window_smaller(self):
        data = [1.0, 2.0, 10.0, 10.0, 10.0]
        # window=3 → uses last 3 values: [10, 10, 10]
        assert rolling_mean(data, window=3) == pytest.approx(10.0)

    def test_rolling_std_constant(self):
        data = [5.0] * 10
        assert rolling_std(data) == pytest.approx(0.0)

    def test_rolling_std_known(self):
        data = [2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0]
        result = rolling_std(data)
        assert result > 0

    def test_delta_basic(self):
        assert delta([10.0, 15.0]) == pytest.approx(5.0)
        assert delta([15.0, 10.0]) == pytest.approx(-5.0)

    def test_delta_single_element(self):
        assert delta([99.0]) == pytest.approx(0.0)

    def test_z_score_zero_for_mean(self):
        data = [1.0, 2.0, 3.0, 4.0, 5.0]
        mean = np.mean(data)
        result = z_score(mean, data)
        assert abs(result) < 0.01

    def test_z_score_large_outlier(self):
        data = [1.0] * 9 + [1.0]  # constant
        result = z_score(1000.0, data)
        assert result > 100  # huge outlier → high z


class TestFeatureExtractor:
    def _make_record(self, service, **overrides):
        base = {"service": service, "timestamp": 0.0, "cpu": 30.0, "memory": 40.0,
                "latency": 80.0, "error_rate": 0.01, "throughput": 500.0}
        base.update(overrides)
        return base

    def test_not_ready_before_data(self):
        ext = FeatureExtractor(window=5)
        result = ext.extract_all()
        assert result == {}

    def test_ready_after_window_data(self):
        ext = FeatureExtractor(window=5)
        for _ in range(6):
            ext.ingest(self._make_record("auth-service"))
        result = ext.extract_all()
        assert "auth-service" in result

    def test_feature_keys_present(self):
        ext = FeatureExtractor(window=5)
        for _ in range(10):
            ext.ingest(self._make_record("auth-service"))
        features = ext.extract_all()["auth-service"]
        for key in ["cpu_mean", "latency_z", "error_rate_delta", "memory_std"]:
            assert key in features, f"Missing key: {key}"

    def test_to_feature_vector_shape(self):
        ext = FeatureExtractor(window=5)
        for _ in range(12):
            ext.ingest(self._make_record("payment-service"))
        vec = ext.to_feature_vector("payment-service")
        assert vec is not None
        assert isinstance(vec, np.ndarray)
        assert vec.ndim == 1
        assert len(vec) > 0

    def test_high_latency_signal(self):
        ext = FeatureExtractor(window=5)
        # Push normal data
        for _ in range(8):
            ext.ingest(self._make_record("auth-service", latency=80.0))
        # Push spike
        ext.ingest(self._make_record("auth-service", latency=800.0))
        features = ext.extract_all()["auth-service"]
        # Delta should be positive and large
        assert features["latency_delta"] > 100
