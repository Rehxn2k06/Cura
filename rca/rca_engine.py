"""
rca_engine.py
Root Cause Analysis engine.
Propagates anomaly scores upstream through the dependency graph
to identify the originating service of a failure.
"""

from typing import Dict, List, Optional, Tuple
from graph.dependency_graph import ServiceDependencyGraph


class RCAEngine:
    """
    Correlates anomaly scores with the service dependency graph
    to compute root cause confidence scores.

    Algorithm:
    1. For each anomalous service, score = anomaly_score
    2. Propagate score DOWNSTREAM: upstream services inherit
       reduced score from dependencies they triggered.
    3. Root cause = service with highest net causal score
       (high anomaly but not triggered by upstream).
    """

    def __init__(self, graph: ServiceDependencyGraph, weight_decay: float = 0.8):
        self.graph = graph
        self.weight_decay = weight_decay

    def analyze(self, anomaly_results: Dict[str, dict]) -> dict:
        """
        Perform RCA given anomaly detection results.

        Args:
            anomaly_results: {service: {anomaly_score, is_anomaly}}

        Returns:
            {
              root_cause: str,
              confidence: float,
              scores: {service: score},
              anomalous_services: [str],
              explanation: str,
            }
        """
        anomalous = [
            svc for svc, res in anomaly_results.items() if res.get("is_anomaly", False)
        ]

        if not anomalous:
            return {
                "root_cause": None,
                "confidence": 0.0,
                "scores": {},
                "anomalous_services": [],
                "explanation": "No anomalies detected.",
            }

        # Raw anomaly scores
        scores = {svc: anomaly_results[svc]["anomaly_score"] for svc in anomalous}

        # Compute causal attribution scores
        causal_scores = self._compute_causal_scores(scores)

        # Root = service with highest causal score
        root = max(causal_scores, key=causal_scores.get)
        confidence = causal_scores[root]

        # Build explanation
        explanation = self._explain(root, anomalous, causal_scores)

        return {
            "root_cause": root,
            "confidence": round(confidence, 4),
            "scores": {k: round(v, 4) for k, v in causal_scores.items()},
            "anomalous_services": anomalous,
            "explanation": explanation,
        }

    def _compute_causal_scores(self, anomaly_scores: Dict[str, float]) -> Dict[str, float]:
        """
        For each anomalous service, compute a causal score:
        causal_score(A) = anomaly_score(A)
                        - sum over A's dependencies B of:
                            (dependency_weight(A→B) * anomaly_score(B)) * decay

        If B is anomalous and A depends on B, then A's anomaly is
        partially "explained" by B → lower causal score for A.
        """
        causal: Dict[str, float] = {}
        all_services = self.graph.get_all_services()

        for svc in anomaly_scores:
            base_score = anomaly_scores[svc]
            # Subtract contribution explained by dependencies
            explained_by_deps = 0.0
            for dep in all_services:
                w = self.graph.get_dependency_weight(svc, dep)
                if w > 0 and dep in anomaly_scores:
                    explained_by_deps += w * anomaly_scores[dep] * self.weight_decay

            causal[svc] = max(0.0, base_score - explained_by_deps)

        # Normalize to [0, 1]
        max_score = max(causal.values(), default=1.0)
        if max_score > 0:
            causal = {k: v / max_score for k, v in causal.items()}

        return causal

    def _explain(self, root: str, anomalous: List[str], scores: Dict[str, float]) -> str:
        affected = [s for s in anomalous if s != root]
        chain = " → ".join([root] + affected) if affected else root
        score_str = f"{scores.get(root, 0):.2f}"
        return (
            f"Root cause identified as '{root}' (causal score: {score_str}). "
            f"Failure propagation chain: {chain}."
        )


def run_rca(
    anomaly_results: Dict[str, dict],
    services_config: list,
    weight_decay: float = 0.8,
) -> dict:
    """Convenience function: build graph and run RCA in one call."""
    graph = ServiceDependencyGraph()
    graph.build_from_config(services_config)
    engine = RCAEngine(graph, weight_decay=weight_decay)
    return engine.analyze(anomaly_results)
