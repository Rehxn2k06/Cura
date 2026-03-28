"""
producer.py
In-memory streaming producer (Kafka-compatible interface).
Pushes metric payloads to a shared asyncio queue.
Swap backend to "kafka" in config.yaml for production use.
"""

import json
import asyncio
from collections import deque
from typing import Optional

# Shared in-memory stream (acts as Kafka topic)
_STREAM: deque = deque(maxlen=1000)
_SUBSCRIBERS: list = []


def publish(record: dict) -> None:
    """Publish a single metric record to the stream."""
    _STREAM.append(json.dumps(record))
    for q in _SUBSCRIBERS:
        try:
            q.put_nowait(record)
        except asyncio.QueueFull:
            pass  # Drop oldest implicitly


def publish_batch(records: list) -> int:
    """Publish a batch of records. Returns count published."""
    for r in records:
        publish(r)
    return len(records)


def subscribe() -> asyncio.Queue:
    """Subscribe to incoming stream. Returns an asyncio Queue."""
    q: asyncio.Queue = asyncio.Queue(maxsize=500)
    _SUBSCRIBERS.append(q)
    return q


def unsubscribe(q: asyncio.Queue) -> None:
    """Remove a subscriber queue."""
    if q in _SUBSCRIBERS:
        _SUBSCRIBERS.remove(q)


def stream_size() -> int:
    return len(_STREAM)


# ── Kafka shim (used when backend="kafka") ──────────────────────────────────
class KafkaProducerShim:
    """Thin wrapper around confluent-kafka for production use."""

    def __init__(self, bootstrap: str, topic: str):
        try:
            from confluent_kafka import Producer
            self._producer = Producer({"bootstrap.servers": bootstrap})
            self._topic = topic
            self._available = True
        except ImportError:
            self._available = False

    def publish(self, record: dict) -> None:
        if self._available:
            self._producer.produce(self._topic, json.dumps(record).encode())
            self._producer.poll(0)
        else:
            publish(record)  # Fallback to in-memory

    def flush(self):
        if self._available:
            self._producer.flush()
