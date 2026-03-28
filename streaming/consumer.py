"""
consumer.py
Streaming consumer — reads from the shared in-memory queue
and yields parsed metric records for downstream processing.
"""

import asyncio
import json
from typing import AsyncIterator, Optional

from streaming.producer import subscribe, unsubscribe


async def stream_records(
    timeout: float = 5.0,
    max_records: Optional[int] = None,
) -> AsyncIterator[dict]:
    """
    Async generator that yields metric records from the stream.

    Args:
        timeout: Max seconds to wait for the next record.
        max_records: If set, stop after this many records.
    """
    q = subscribe()
    count = 0
    try:
        while True:
            try:
                record = await asyncio.wait_for(q.get(), timeout=timeout)
                yield record
                count += 1
                if max_records is not None and count >= max_records:
                    break
            except asyncio.TimeoutError:
                break
    finally:
        unsubscribe(q)


class BatchConsumer:
    """
    Collects records into fixed-size windows for batch processing.
    """

    def __init__(self, window_size: int = 10):
        self.window_size = window_size
        self._buffer: list = []
        self._q = subscribe()

    async def next_window(self, timeout: float = 10.0) -> list:
        """Wait until window_size records are available, then return them."""
        self._buffer.clear()
        deadline = asyncio.get_event_loop().time() + timeout
        while len(self._buffer) < self.window_size:
            remaining = deadline - asyncio.get_event_loop().time()
            if remaining <= 0:
                break
            try:
                record = await asyncio.wait_for(self._q.get(), timeout=min(remaining, 1.0))
                self._buffer.append(record)
            except asyncio.TimeoutError:
                continue
        return list(self._buffer)

    def close(self):
        unsubscribe(self._q)
