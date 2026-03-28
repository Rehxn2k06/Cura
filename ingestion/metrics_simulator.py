"""
metrics_simulator.py  (v2 — 6 services)
Simulates Prometheus-style metrics for 6 microservices.

Topology:
  frontend-service
      ├──→ catalogue-service ──→ database-service
      └──→ cart-service ──→ order-service ──→ payment-service ──→ database-service

Failure injection: database fails → cascades upstream with decaying severity.
"""

import time
import random
from dataclasses import dataclass, asdict
from typing import Optional


@dataclass
class ServiceMetrics:
    service: str
    timestamp: float
    cpu: float          # 0–100 %
    memory: float       # 0–100 %
    latency: float      # ms
    error_rate: float   # 0.0–1.0
    throughput: float   # req/s


# ── Normal baseline profiles (mean, std) ──────────────────────────────────────
_PROFILES = {
    "frontend-service": {
        "cpu": (25, 5),
        "memory": (35, 4),
        "latency": (60, 8),
        "error_rate": (0.008, 0.003),
        "throughput": (600, 40),
    },
    "catalogue-service": {
        "cpu": (35, 5),
        "memory": (45, 4),
        "latency": (50, 6),
        "error_rate": (0.005, 0.002),
        "throughput": (400, 25),
    },
    "cart-service": {
        "cpu": (30, 5),
        "memory": (40, 4),
        "latency": (70, 8),
        "error_rate": (0.008, 0.003),
        "throughput": (350, 20),
    },
    "order-service": {
        "cpu": (40, 6),
        "memory": (50, 5),
        "latency": (100, 12),
        "error_rate": (0.012, 0.004),
        "throughput": (250, 15),
    },
    "payment-service": {
        "cpu": (45, 6),
        "memory": (55, 5),
        "latency": (120, 15),
        "error_rate": (0.015, 0.005),
        "throughput": (200, 15),
    },
    "database-service": {
        "cpu": (60, 8),
        "memory": (70, 5),
        "latency": (20, 4),
        "error_rate": (0.003, 0.001),
        "throughput": (1000, 60),
    },
}

# ── Failure effects per service (added on top of normal baseline) ─────────────
# Capture real-world cascade: higher severity = direct DB dependency
_FAILURE_EFFECTS = {
    "database-service": {
        "latency_delta":      (400, 800),   # big spike
        "error_rate_delta":   (0.20, 0.40),
        "cpu_delta":          (20, 35),
        "memory_delta":       (15, 25),
        "throughput_drop":    0.60,         # throughput *= (1 - severity * drop)
    },
    "payment-service": {          # direct DB caller
        "latency_delta":      (150, 300),
        "error_rate_delta":   (0.10, 0.20),
        "cpu_delta":          (10, 20),
        "memory_delta":       (5, 10),
        "throughput_drop":    0.35,
    },
    "catalogue-service": {        # also direct DB caller
        "latency_delta":      (120, 250),
        "error_rate_delta":   (0.08, 0.16),
        "cpu_delta":          (8, 16),
        "memory_delta":       (4, 8),
        "throughput_drop":    0.30,
    },
    "order-service": {            # payment dependent
        "latency_delta":      (100, 200),
        "error_rate_delta":   (0.06, 0.14),
        "cpu_delta":          (6, 14),
        "memory_delta":       (3, 7),
        "throughput_drop":    0.25,
    },
    "cart-service": {             # order dependent
        "latency_delta":      (70, 150),
        "error_rate_delta":   (0.04, 0.09),
        "cpu_delta":          (4, 10),
        "memory_delta":       (2, 5),
        "throughput_drop":    0.20,
    },
    "frontend-service": {         # furthest from DB
        "latency_delta":      (40, 90),
        "error_rate_delta":   (0.02, 0.06),
        "cpu_delta":          (3, 7),
        "memory_delta":       (1, 4),
        "throughput_drop":    0.12,
    },
}


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def generate_normal(service: str, ts: Optional[float] = None) -> ServiceMetrics:
    p = _PROFILES[service]
    return ServiceMetrics(
        service=service,
        timestamp=ts or time.time(),
        cpu=_clamp(random.gauss(*p["cpu"]), 0, 100),
        memory=_clamp(random.gauss(*p["memory"]), 0, 100),
        latency=_clamp(random.gauss(*p["latency"]), 1, 5000),
        error_rate=_clamp(random.gauss(*p["error_rate"]), 0, 1),
        throughput=_clamp(random.gauss(*p["throughput"]), 1, 10000),
    )


def generate_failure(service: str, severity: float = 1.0, ts: Optional[float] = None) -> ServiceMetrics:
    """
    Generate a failure-mode snapshot for a single service.
    severity: 0.0 (mild) → 1.0 (full cascade)
    """
    base = generate_normal(service, ts)
    fx = _FAILURE_EFFECTS.get(service)
    if fx is None:
        return base

    base.latency += severity * random.uniform(*fx["latency_delta"])
    base.error_rate = _clamp(base.error_rate + severity * random.uniform(*fx["error_rate_delta"]), 0, 1)
    base.cpu = _clamp(base.cpu + severity * random.uniform(*fx["cpu_delta"]), 0, 100)
    base.memory = _clamp(base.memory + severity * random.uniform(*fx["memory_delta"]), 0, 100)
    base.throughput *= max(0.1, 1 - severity * fx["throughput_drop"])
    return base


def generate_snapshot(failure_services: Optional[list] = None, severity: float = 1.0) -> list:
    """
    Generate one full snapshot across all 6 services.
    failure_services: list of service names to inject failure into.
    """
    ts = time.time()
    failure_services = failure_services or []
    snapshots = []
    for svc in _PROFILES:
        if svc in failure_services:
            snapshots.append(generate_failure(svc, severity=severity, ts=ts))
        else:
            snapshots.append(generate_normal(svc, ts=ts))
    return [asdict(s) for s in snapshots]


def all_services() -> list:
    return list(_PROFILES.keys())


if __name__ == "__main__":
    print("=== Normal Snapshot ===")
    for m in generate_snapshot():
        print(f"  {m['service']:20s} lat={m['latency']:.0f}ms  err={m['error_rate']:.3f}  cpu={m['cpu']:.1f}%")

    print("\n=== Full Failure Snapshot (DB root) ===")
    for m in generate_snapshot(failure_services=all_services()):
        print(f"  {m['service']:20s} lat={m['latency']:.0f}ms  err={m['error_rate']:.3f}  cpu={m['cpu']:.1f}%")
