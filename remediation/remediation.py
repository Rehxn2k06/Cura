"""
remediation.py
Kubernetes remediation layer with dry-run simulation mode.
All actions are logged to an audit file.
"""

import json
import time
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


class RemediationEngine:
    """
    Executes or simulates Kubernetes remediation actions.
    Dry-run mode (default): logs actions without calling K8s API.
    """

    def __init__(
        self,
        dry_run: bool = True,
        namespace: str = "default",
        audit_log_path: str = "audit_log.json",
        scale_replicas: int = 3,
    ):
        self.dry_run = dry_run
        self.namespace = namespace
        self.audit_log_path = Path(audit_log_path)
        self.scale_replicas = scale_replicas
        self._k8s_client = None

        if not dry_run:
            self._init_k8s()

    def _init_k8s(self):
        try:
            from kubernetes import client, config as k8s_config
            try:
                k8s_config.load_incluster_config()
            except Exception:
                k8s_config.load_kube_config()
            self._k8s_client = client.AppsV1Api()
        except Exception as e:
            print(f"[Remediation] WARNING: K8s client init failed: {e}. Falling back to dry_run.")
            self.dry_run = True

    # ─── Public API ────────────────────────────────────────────────────────────

    def execute(self, decision: dict) -> dict:
        """
        Execute a remediation action from a decision engine result.
        Returns an audit record.
        """
        action = decision.get("action", "no_action")
        service = decision.get("target_service")
        confidence = decision.get("confidence", 0.0)

        if action == "scale_db":
            result = self.scale_deployment(service, self.scale_replicas)
        elif action == "restart_pod":
            result = self.restart_pod(service)
        elif action == "alert":
            result = self._send_alert(service, confidence)
        else:
            result = {"status": "skipped", "reason": "no_action"}

        record = self._audit(action, service, confidence, result)
        return record

    def scale_deployment(self, service: str, replicas: int) -> dict:
        """Scale a Kubernetes deployment horizontally."""
        if self.dry_run:
            return self._dry_log("scale_deployment", service,
                                 f"kubectl scale deployment {service} --replicas={replicas}")

        try:
            body = {"spec": {"replicas": replicas}}
            self._k8s_client.patch_namespaced_deployment_scale(
                name=service, namespace=self.namespace, body=body
            )
            return {"status": "success", "replicas": replicas}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def restart_pod(self, service: str) -> dict:
        """Restart pods for a Kubernetes deployment by patching the deployment."""
        if self.dry_run:
            return self._dry_log("restart_pod", service,
                                 f"kubectl rollout restart deployment/{service}")

        try:
            from kubernetes import client
            now = datetime.now(timezone.utc).isoformat()
            body = {
                "spec": {
                    "template": {
                        "metadata": {
                            "annotations": {"kubectl.kubernetes.io/restartedAt": now}
                        }
                    }
                }
            }
            apps_v1 = client.AppsV1Api()
            apps_v1.patch_namespaced_deployment(
                name=service, namespace=self.namespace, body=body
            )
            return {"status": "success", "restarted_at": now}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _send_alert(self, service: Optional[str], confidence: float) -> dict:
        msg = f"[ALERT] Anomaly detected in {service} (confidence={confidence:.2f})"
        print(msg)
        return {"status": "alert_sent", "message": msg}

    @staticmethod
    def _dry_log(action: str, service: Optional[str], cmd: str) -> dict:
        print(f"[DRY-RUN] Would execute: {cmd}")
        return {"status": "dry_run", "action": action, "service": service, "command": cmd}

    def _audit(self, action: str, service: Optional[str], confidence: float, result: dict) -> dict:
        record = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "action": action,
            "target_service": service,
            "confidence": confidence,
            "dry_run": self.dry_run,
            "result": result,
        }
        self._append_audit(record)
        return record

    def _append_audit(self, record: dict) -> None:
        try:
            if self.audit_log_path.exists():
                with open(self.audit_log_path) as f:
                    logs = json.load(f)
            else:
                logs = []
            logs.append(record)
            with open(self.audit_log_path, "w") as f:
                json.dump(logs, f, indent=2)
        except Exception as e:
            print(f"[Remediation] Audit log write failed: {e}")

    def get_audit_log(self) -> list:
        try:
            if self.audit_log_path.exists():
                with open(self.audit_log_path) as f:
                    return json.load(f)
        except Exception:
            pass
        return []
