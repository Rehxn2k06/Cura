"""
trace_generator.py  (v2 — 6 services)
Generates distributed trace spans for the 6-service e-commerce topology.

Two request types:
  A (Catalogue path):  frontend → catalogue → database
  B (Order path):      frontend → cart → order → payment → database

Dependency graph inferred from these traces matches config.yaml.
"""

import time
import random
import uuid
from typing import Optional

# Base latencies per service (normal operation)
_BASE_LATENCIES = {
    "frontend-service":  60,
    "catalogue-service": 50,
    "cart-service":      70,
    "order-service":     100,
    "payment-service":   120,
    "database-service":  20,
}

# Two call chains
_CHAIN_CATALOGUE = ["frontend-service", "catalogue-service", "database-service"]
_CHAIN_ORDER     = ["frontend-service", "cart-service", "order-service",
                    "payment-service", "database-service"]


def _make_span(service: str, trace_id: str, parent_id: Optional[str],
               ts: float, failure_services: list) -> dict:
    base = _BASE_LATENCIES[service]
    if service in failure_services:
        if service == "database-service":
            latency = base + random.uniform(400, 900)
            status, error = "ERROR", "DB connection timeout"
        elif service in ("payment-service", "catalogue-service"):
            latency = base + random.uniform(150, 350)
            status, error = "ERROR", "Upstream database-service timeout"
        else:
            latency = base + random.uniform(80, 200)
            status, error = "ERROR", "Dependent service unavailable"
    else:
        latency = base + random.gauss(0, base * 0.1)
        status, error = "OK", None

    return {
        "trace_id": trace_id,
        "span_id": uuid.uuid4().hex[:16],
        "parent_span_id": parent_id,
        "service": service,
        "operation": f"{service}/handle_request",
        "start_time": ts,
        "duration_ms": max(1.0, latency),
        "status": status,
        "error": error,
    }


def generate_trace(failure_services: Optional[list] = None,
                   ts: Optional[float] = None,
                   chain_type: Optional[str] = None) -> list:
    """
    Generate a full distributed trace.

    chain_type: "catalogue" | "order" | None (random 50/50)
    Returns list of spans (caller first, callee last).
    """
    failure_services = failure_services or []
    ts = ts or time.time()
    chain_type = chain_type or random.choice(["catalogue", "order"])
    chain = _CHAIN_CATALOGUE if chain_type == "catalogue" else _CHAIN_ORDER

    trace_id = uuid.uuid4().hex
    spans = []
    parent_id = None

    for svc in chain:
        span = _make_span(svc, trace_id, parent_id, ts, failure_services)
        spans.append(span)
        parent_id = span["span_id"]
        ts += span["duration_ms"] / 1000

    return spans


def extract_dependency_graph(traces: list) -> dict:
    """Infer {caller: [callee, ...]} from a list of trace lists."""
    graph: dict = {}
    for trace in traces:
        for i in range(len(trace) - 1):
            caller = trace[i]["service"]
            callee = trace[i + 1]["service"]
            graph.setdefault(caller, [])
            if callee not in graph[caller]:
                graph[caller].append(callee)
    return graph


if __name__ == "__main__":
    import json
    print("=== Catalogue trace ===")
    for s in generate_trace(chain_type="catalogue"):
        print(f"  {s['service']:20s} {s['duration_ms']:.0f}ms  {s['status']}")

    print("\n=== Order trace (DB failure) ===")
    fsvcs = ["database-service", "payment-service", "order-service",
             "cart-service", "catalogue-service", "frontend-service"]
    for s in generate_trace(failure_services=fsvcs, chain_type="order"):
        print(f"  {s['service']:20s} {s['duration_ms']:.0f}ms  {s['status']}")

    print("\n=== Inferred graph ===")
    traces = [generate_trace() for _ in range(10)]
    print(extract_dependency_graph(traces))
