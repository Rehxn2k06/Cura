"""
lstm_detector.py
Pure-NumPy LSTM for time-series degradation detection.

Design:
  - Per-service LSTM predictor (input_size=3: latency, error_rate, cpu)
  - Trained ONCE on normal sequences; frozen after that
  - Anomaly score = normalised MSE(prediction, actual)
  - Catches slow degradation trends that IsolationForest misses

Architecture:
  Input → LSTM(hidden=8) → Linear → next-step prediction
  Loss = MSE(y_pred, y_actual)
  Optimizer = Adam with gradient clipping
"""

import numpy as np
import joblib
from pathlib import Path
from collections import deque
from typing import Optional, Tuple

MODEL_DIR = Path(__file__).parent / "model_store"
MODEL_DIR.mkdir(exist_ok=True)

# Raw features used by the LSTM (subset of all metrics)
LSTM_FEATURES = ["latency", "error_rate", "cpu"]
INPUT_SIZE = len(LSTM_FEATURES)


# ── NumPy LSTM Cell ───────────────────────────────────────────────────────────

class _NumpyLSTM:
    """
    Single-layer LSTM with concatenated gate matrix for efficiency.
    Gates are stacked as [forget | input | cell | output].
    """

    def __init__(self, input_size: int, hidden_size: int, output_size: int, seed: int = 42):
        rng = np.random.default_rng(seed)
        n, m, o = hidden_size, input_size, output_size
        nm = n + m
        scale = np.sqrt(2.0 / nm)

        # Combined gate matrix: shape (4n, n+m)
        self.W = rng.normal(0, scale, (4 * n, nm))
        self.b = np.zeros(4 * n)

        # Output projection
        self.Wy = rng.normal(0, scale, (o, n))
        self.by = np.zeros(o)

        self.n = n
        self.m = m
        self.o = o

        # Adam moments
        self._t = 0
        self._init_adam()

    def _init_adam(self):
        self.mW  = np.zeros_like(self.W)
        self.vW  = np.zeros_like(self.W)
        self.mb  = np.zeros_like(self.b)
        self.vb  = np.zeros_like(self.b)
        self.mWy = np.zeros_like(self.Wy)
        self.vWy = np.zeros_like(self.Wy)
        self.mby = np.zeros_like(self.by)
        self.vby = np.zeros_like(self.by)

    @staticmethod
    def _sigmoid(x):
        # Numerically stable sigmoid
        return np.where(x >= 0,
                        1 / (1 + np.exp(-x)),
                        np.exp(x) / (1 + np.exp(x)))

    def _forward(self, X: np.ndarray) -> Tuple[np.ndarray, tuple]:
        """
        Forward pass over a sequence.
        X: (T, input_size)
        Returns (y_pred, cache) where y_pred is the prediction after the last step.
        """
        T = len(X)
        n = self.n

        H = np.zeros((T + 1, n))
        C = np.zeros((T + 1, n))
        F = np.zeros((T, n))
        I = np.zeros((T, n))
        G = np.zeros((T, n))
        O = np.zeros((T, n))
        HX = np.zeros((T, n + self.m))

        for t in range(T):
            hx = np.concatenate([H[t], X[t]])
            HX[t] = hx
            gates = self.W @ hx + self.b   # (4n,)

            f = self._sigmoid(gates[:n])
            i = self._sigmoid(gates[n:2*n])
            g = np.tanh(gates[2*n:3*n])
            o = self._sigmoid(gates[3*n:])

            C[t+1] = f * C[t] + i * g
            H[t+1] = o * np.tanh(C[t+1])
            F[t], I[t], G[t], O[t] = f, i, g, o

        y_pred = self.Wy @ H[T] + self.by
        return y_pred, (H, C, F, I, G, O, HX)

    def predict(self, X: np.ndarray) -> np.ndarray:
        y_pred, _ = self._forward(X)
        return y_pred

    def _backward_and_update(self, X: np.ndarray, y_true: np.ndarray,
                              y_pred: np.ndarray, cache: tuple,
                              lr: float = 5e-3, clip: float = 5.0) -> float:
        """BPTT through the sequence, Adam update. Returns scalar loss."""
        H, C, F, I, G, O, HX = cache
        T = len(X)
        n = self.n

        dy = y_pred - y_true                               # (output_size,)
        loss = 0.5 * float(np.dot(dy, dy))

        dWy = np.outer(dy, H[T])
        dby = dy.copy()

        dh_next = self.Wy.T @ dy                           # gradient at H[T]
        dc_next = np.zeros(n)

        dW = np.zeros_like(self.W)
        db = np.zeros_like(self.b)

        for t in reversed(range(T)):
            dh = dh_next
            dc = dh * O[t] * (1.0 - np.tanh(C[t+1])**2) + dc_next

            df = dc * C[t]  * F[t] * (1.0 - F[t])
            di = dc * G[t]  * I[t] * (1.0 - I[t])
            dg = dc * I[t]  * (1.0 - G[t]**2)
            do = dh * np.tanh(C[t+1]) * O[t] * (1.0 - O[t])

            dgate = np.concatenate([df, di, dg, do])
            # Gradient clipping
            dgate = np.clip(dgate, -clip, clip)

            dW += np.outer(dgate, HX[t])
            db += dgate

            dhx = self.W.T @ dgate
            dh_next = dhx[:n]
            dc_next = dc * F[t]

        # Adam update
        self._t += 1
        beta1, beta2, eps = 0.9, 0.999, 1e-8
        t_step = self._t

        for param, grad, mmt, vel in [
            (self.W,  dW,  self.mW,  self.vW),
            (self.b,  db,  self.mb,  self.vb),
            (self.Wy, dWy, self.mWy, self.vWy),
            (self.by, dby, self.mby, self.vby),
        ]:
            mmt[:] = beta1 * mmt + (1 - beta1) * grad
            vel[:] = beta2 * vel + (1 - beta2) * grad**2
            m_hat = mmt / (1 - beta1**t_step)
            v_hat = vel / (1 - beta2**t_step)
            param -= lr * m_hat / (np.sqrt(v_hat) + eps)

        return loss

    def train_epoch(self, sequences: list, lr: float = 5e-3) -> float:
        """One training epoch over (X, y) pairs. Returns mean loss."""
        np.random.shuffle(sequences)
        total = 0.0
        for X, y in sequences:
            y_pred, cache = self._forward(X)
            total += self._backward_and_update(X, y, y_pred, cache, lr=lr)
        return total / max(len(sequences), 1)


# ── Service LSTM Detector ─────────────────────────────────────────────────────

class LSTMServiceDetector:
    """
    Maintains a rolling raw-metric buffer and a trained LSTM predictor
    for one service. Anomaly score = normalised prediction MSE.
    """

    def __init__(self, service: str, seq_len: int = 10,
                 hidden_size: int = 8, epochs: int = 40):
        self.service = service
        self.seq_len = seq_len
        self.hidden_size = hidden_size
        self.epochs = epochs

        self._lstm: Optional[_NumpyLSTM] = None
        self._trained = False

        # Rolling raw-metric buffer: stores (latency, error_rate, cpu) tuples
        self._buffer: deque = deque(maxlen=seq_len + 1)

        # Normalisation stats (set during training)
        self._mu: Optional[np.ndarray] = None
        self._sigma: Optional[np.ndarray] = None

        # 95th-percentile training error (used to normalise anomaly score)
        self._error_p95: float = 1.0

        self._model_path = MODEL_DIR / f"lstm_{service.replace('-', '_')}.pkl"

    def _extract_raw(self, record: dict) -> np.ndarray:
        return np.array([
            record.get("latency", 0.0),
            record.get("error_rate", 0.0),
            record.get("cpu", 0.0),
        ], dtype=float)

    def push(self, record: dict) -> None:
        self._buffer.append(self._extract_raw(record))

    def _normalise(self, arr: np.ndarray) -> np.ndarray:
        return (arr - self._mu) / (self._sigma + 1e-9)

    def _make_seq_target(self) -> Optional[Tuple[np.ndarray, np.ndarray]]:
        """Return (X, y) where X is the first seq_len steps, y is the last."""
        if len(self._buffer) < self.seq_len + 1:
            return None
        raw = np.array(list(self._buffer), dtype=float)   # (seq_len+1, 3)
        norm = self._normalise(raw)
        return norm[:self.seq_len], norm[self.seq_len]

    # ── Training ──────────────────────────────────────────────────────────────

    def train(self, normal_records: list) -> None:
        """Train LSTM on a list of raw metric records (normal data only)."""
        raw = np.array([self._extract_raw(r) for r in normal_records], dtype=float)

        self._mu = raw.mean(axis=0)
        self._sigma = raw.std(axis=0)
        norm = self._normalise(raw)

        # Build sliding-window (X, y) pairs
        sequences = []
        for i in range(len(norm) - self.seq_len):
            X = norm[i:i + self.seq_len]            # (seq_len, 3)
            y = norm[i + self.seq_len]              # (3,)
            sequences.append((X, y))

        if len(sequences) < 10:
            return   # not enough data

        self._lstm = _NumpyLSTM(INPUT_SIZE, self.hidden_size, INPUT_SIZE)

        # Warmup pass: higher LR first, then decay
        for epoch in range(self.epochs):
            lr = 1e-2 if epoch < 10 else 5e-3
            loss = self._lstm.train_epoch(sequences, lr=lr)

        # Compute training errors to calibrate the anomaly score normaliser
        errors = []
        for X, y in sequences:
            y_pred = self._lstm.predict(X)
            errors.append(float(np.mean((y_pred - y)**2)))

        # Calibrate: use 99th-percentile training error * 3x safety margin.
        # The 3x means live error must be 3× the worst training error before
        # the score reaches 1.0. Without this, any natural live variance
        # immediately clips to 1.0 (the false-positive problem).
        self._error_p95 = float(np.percentile(errors, 99)) * 3.0 if errors else 1.0
        self._trained = True
        self._save()
        print(f"[LSTM] Trained {self.service}: {len(sequences)} sequences, "
              f"p95_error={self._error_p95:.4f}")

    def _save(self):
        payload = {
            "lstm": self._lstm,
            "mu": self._mu,
            "sigma": self._sigma,
            "error_p95": self._error_p95,
        }
        joblib.dump(payload, self._model_path)

    def load(self) -> bool:
        if not self._model_path.exists():
            return False
        try:
            d = joblib.load(self._model_path)
            self._lstm = d["lstm"]
            self._mu = d["mu"]
            self._sigma = d["sigma"]
            self._error_p95 = d["error_p95"]
            self._trained = True
            return True
        except Exception:
            return False

    # ── Inference ─────────────────────────────────────────────────────────────

    def score(self) -> float:
        """
        Return LSTM anomaly score in [0, 1].
        0 = predicted well (normal), 1 = high prediction error (degradation detected).
        """
        if not self._trained or self._lstm is None:
            return 0.0
        pair = self._make_seq_target()
        if pair is None:
            return 0.0

        X, y_actual = pair
        y_pred = self._lstm.predict(X)
        mse = float(np.mean((y_pred - y_actual)**2))
        # Normalise: score of 1 = error at 95th-percentile training level
        return float(np.clip(mse / (self._error_p95 + 1e-9), 0, 1))
