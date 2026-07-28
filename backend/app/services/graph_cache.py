"""
graph_cache.py — Thread-safe in-process cache for OSMnx road graphs.

Stores downloaded NetworkX road graphs keyed on a rounded bounding-box
string so repeated route requests for the same area skip the OSM download.
Entries expire after CACHE_TTL_SECONDS (600 s = 10 minutes).
"""

from __future__ import annotations

import threading
import time
from typing import Optional

import networkx as nx

CACHE_TTL_SECONDS: int = 600  # 10 minutes


class _GraphCache:
    """Singleton in-process cache for OSMnx MultiDiGraph objects."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        # key → (graph, stored_at_epoch)
        self._store: dict[str, tuple[nx.MultiDiGraph, float]] = {}

    # ── public API ────────────────────────────────────────────────────────────

    def get(self, key: str) -> Optional[nx.MultiDiGraph]:
        """Return cached graph if it exists and has not expired, else None."""
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            graph, stored_at = entry
            if time.monotonic() - stored_at > CACHE_TTL_SECONDS:
                del self._store[key]
                return None
            return graph

    def set(self, key: str, graph: nx.MultiDiGraph) -> None:
        """Store graph under key with the current timestamp."""
        with self._lock:
            self._store[key] = (graph, time.monotonic())

    def invalidate(self, key: str) -> None:
        """Remove a single entry (useful in tests)."""
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        """Wipe the entire cache."""
        with self._lock:
            self._store.clear()

    @staticmethod
    def make_key(north: float, south: float, east: float, west: float) -> str:
        """
        Produce a stable string key from a bounding box.
        Coordinates are rounded to 2 decimal places (~1.1 km grid) so that
        nearby origins/destinations reuse the same cached graph.
        """
        return f"{round(north,2)}_{round(south,2)}_{round(east,2)}_{round(west,2)}"


# Module-level singleton — import and use directly.
graph_cache = _GraphCache()
