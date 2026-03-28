"""
dependency_graph.py
NetworkX-based service dependency graph.
Built from trace data or config, used by the RCA engine.
"""

import networkx as nx
from typing import Dict, List, Optional, Tuple


class ServiceDependencyGraph:
    """
    Directed graph: edge A → B means A calls B (A depends on B).
    For RCA, we traverse UPSTREAM (B → A direction) to find roots.
    """

    def __init__(self):
        self._graph: nx.DiGraph = nx.DiGraph()

    def add_dependency(self, caller: str, callee: str, weight: float = 1.0) -> None:
        """Register that `caller` depends on `callee`."""
        self._graph.add_edge(caller, callee, weight=weight)

    def build_from_config(self, services: list) -> None:
        """
        Populate graph from config.yaml service list.
        Each service entry has {name, dependencies: [...]}.
        """
        for svc in services:
            name = svc["name"]
            self._graph.add_node(name)
            for dep in svc.get("dependencies", []):
                # caller=name depends on callee=dep
                self._graph.add_edge(name, dep, weight=1.0)

    def build_from_traces(self, traces: list, decay: float = 0.8) -> None:
        """
        Infer graph from trace spans.
        traces: list of trace lists (each trace is a list of spans).
        Edge weights are normalized by call frequency.
        """
        counts: Dict[Tuple[str, str], int] = {}
        for trace in traces:
            for i in range(len(trace) - 1):
                caller = trace[i]["service"]
                callee = trace[i + 1]["service"]
                counts[(caller, callee)] = counts.get((caller, callee), 0) + 1

        max_count = max(counts.values(), default=1)
        for (caller, callee), count in counts.items():
            weight = (count / max_count) * decay
            self.add_dependency(caller, callee, weight=weight)

    def get_upstream_services(self, service: str) -> List[str]:
        """
        Return all services that depend on `service` (directly or transitively).
        These are the services that could be AFFECTED by a failure in `service`.
        """
        # Reverse the graph: edges become B → A (who calls who)
        reversed_g = self._graph.reverse()
        if service not in reversed_g:
            return []
        return list(nx.descendants(reversed_g, service))

    def get_dependency_weight(self, caller: str, callee: str) -> float:
        """Weight of the edge caller → callee (0.0 if no edge)."""
        if self._graph.has_edge(caller, callee):
            return float(self._graph[caller][callee].get("weight", 1.0))
        return 0.0

    def get_all_services(self) -> List[str]:
        return list(self._graph.nodes())

    def get_root_services(self) -> List[str]:
        """Services with no dependencies (leaf nodes = deepest dependency)."""
        return [n for n in self._graph.nodes() if self._graph.out_degree(n) == 0]

    def as_dict(self) -> dict:
        """Serializable representation for API response."""
        return {
            "nodes": list(self._graph.nodes()),
            "edges": [
                {"from": u, "to": v, "weight": round(d.get("weight", 1.0), 3)}
                for u, v, d in self._graph.edges(data=True)
            ],
        }

    def __repr__(self) -> str:
        return f"ServiceDependencyGraph(nodes={list(self._graph.nodes())}, edges={list(self._graph.edges())})"
