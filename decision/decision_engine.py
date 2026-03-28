"""
decision_engine.py
Maps RCA results to concrete remediation actions using a rule-based policy.
"""

from typing import Dict, Optional


# Action catalogue
ACTIONS = {
    "scale_db": {
        "description": "Scale the database deployment to more replicas.",
        "severity": "high",
    },
    "restart_pod": {
        "description": "Restart the service pod to recover from crash/leak.",
        "severity": "medium",
    },
    "alert": {
        "description": "Send an alert to on-call team (no automated action).",
        "severity": "low",
    },
    "no_action": {
        "description": "No action required.",
        "severity": "none",
    },
}


class DecisionEngine:
    """
    Rule-based action selector.
    Maps (root_cause_service, confidence) → action.
    """

    def __init__(self, rules: Dict[str, str], confidence_threshold: float = 0.5):
        """
        Args:
            rules: {service_name: action_key}, e.g. {"database-service": "scale_db"}
            confidence_threshold: Minimum confidence to trigger an automated action.
        """
        self.rules = rules
        self.confidence_threshold = confidence_threshold

    def decide(self, rca_result: dict) -> dict:
        """
        Given an RCA result, decide the next action.

        Returns:
            {
              action: str,
              service: str | None,
              confidence: float,
              description: str,
              auto_remediate: bool,
            }
        """
        root = rca_result.get("root_cause")
        confidence = rca_result.get("confidence", 0.0)

        if root is None or confidence == 0.0:
            return self._build_decision("no_action", None, confidence, auto=False)

        if confidence < self.confidence_threshold:
            # Low confidence → only alert, don't act
            return self._build_decision("alert", root, confidence, auto=False,
                                        note="Confidence below threshold — alerting only.")

        # Look up rule for this service
        action = self.rules.get(root, self.rules.get("default", "alert"))
        auto = action in ("scale_db", "restart_pod")  # Automated for known actions

        return self._build_decision(action, root, confidence, auto=auto)

    def _build_decision(
        self,
        action: str,
        service: Optional[str],
        confidence: float,
        auto: bool,
        note: str = "",
    ) -> dict:
        action_info = ACTIONS.get(action, ACTIONS["alert"])
        return {
            "action": action,
            "target_service": service,
            "confidence": round(confidence, 4),
            "description": action_info["description"] + (f" [{note}]" if note else ""),
            "severity": action_info["severity"],
            "auto_remediate": auto,
        }
