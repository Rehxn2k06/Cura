"""
log_generator.py  (v2 — 6 services)
Generates structured JSON log entries for all 6 microservices.
"""

import time
import random
import json
from typing import Optional


_LOG_TEMPLATES = {
    "frontend-service": {
        "normal": [
            "GET /products 200 in {ms}ms",
            "GET /cart 200 in {ms}ms for user {uid}",
            "Rendered homepage in {ms}ms",
        ],
        "warning": [
            "Slow response from catalogue-service: {ms}ms",
            "Slow response from cart-service: {ms}ms",
            "Retrying downstream call, attempt #{n}",
        ],
        "error": [
            "503 Service Unavailable: catalogue-service timeout",
            "Failed to load cart for user {uid}: upstream error",
            "Stack trace: UpstreamTimeoutError at frontend/handler.py:78",
        ],
    },
    "catalogue-service": {
        "normal": [
            "Fetched {n} products from DB in {ms}ms",
            "Product search completed in {ms}ms",
            "Cache hit for category listing",
        ],
        "warning": [
            "DB query slow: {ms}ms (threshold 80ms)",
            "Product cache miss, querying DB",
        ],
        "error": [
            "DB connection timeout after {ms}ms",
            "Stack trace: DBTimeoutError at catalogue/db.py:54",
            "Failed to fetch product catalogue: database-service unreachable",
        ],
    },
    "cart-service": {
        "normal": [
            "Cart {pid} updated for user {uid}",
            "Cart checkout initiated in {ms}ms",
        ],
        "warning": [
            "Order-service slow response: {ms}ms",
            "Cart session {pid} expiry approaching",
        ],
        "error": [
            "Cart checkout failed: order-service unavailable",
            "Stack trace: CartCheckoutError at cart/controller.py:103",
        ],
    },
    "order-service": {
        "normal": [
            "Order {pid} created in {ms}ms",
            "Order {pid} status updated to CONFIRMED",
        ],
        "warning": [
            "Payment processing slow: {ms}ms",
            "Retrying payment for order {pid}, attempt #{n}",
        ],
        "error": [
            "Order {pid} failed: payment-service timeout",
            "Stack trace: PaymentException at order/processor.py:89",
            "Circuit breaker OPEN for payment-service",
        ],
    },
    "payment-service": {
        "normal": [
            "Payment {pid} processed in {ms}ms",
            "Transaction {pid} committed to ledger",
        ],
        "warning": [
            "DB response slow: {ms}ms (threshold: 100ms)",
            "Payment retry #{n} for transaction {pid}",
        ],
        "error": [
            "Payment {pid} failed: database connection timeout",
            "Stack trace: DBConnectionError at payment/db.py:89",
            "Circuit breaker OPEN for database-service",
        ],
    },
    "database-service": {
        "normal": [
            "Query executed in {ms}ms",
            "Index scan on products table: {n} rows",
        ],
        "warning": [
            "Slow query detected: {ms}ms",
            "Connection pool at {n}% capacity",
            "Disk I/O wait: {ms}ms",
        ],
        "error": [
            "FATAL: Out of memory — query aborted",
            "Stack trace: OOMError at db/query_executor.py:221",
            "Replication lag {n}ms exceeds threshold",
        ],
    },
}


def _render(template: str) -> str:
    return (template
            .replace("{uid}", str(random.randint(1000, 9999)))
            .replace("{pid}", f"txn_{random.randint(100000, 999999)}")
            .replace("{ms}", str(random.randint(50, 2000)))
            .replace("{n}", str(random.randint(1, 100))))


def generate_log(service: str, is_failure: bool = False, ts: Optional[float] = None) -> dict:
    templates = _LOG_TEMPLATES.get(service, _LOG_TEMPLATES["database-service"])

    if is_failure:
        if random.random() < 0.5:
            level, msg = "ERROR", random.choice(templates["error"])
        else:
            level, msg = "WARNING", random.choice(templates["warning"])
    else:
        if random.random() < 0.05:
            level, msg = "WARNING", random.choice(templates["warning"])
        else:
            level, msg = "INFO", random.choice(templates["normal"])

    return {
        "timestamp": ts or time.time(),
        "service": service,
        "level": level,
        "message": _render(msg),
        "trace_id": f"trace_{random.randint(100000, 999999)}",
    }


def generate_log_batch(failure_services: Optional[list] = None, count: int = 6) -> list:
    failure_services = failure_services or []
    services = list(_LOG_TEMPLATES.keys())
    return [
        generate_log(random.choice(services), is_failure=(random.choice(services) in failure_services))
        for _ in range(count)
    ]
