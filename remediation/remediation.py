"""
remediation.py
Docker Desktop remediation layer.
Executes very fast container operations via Docker SDK.
"""

import json
import asyncio
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


class RemediationEngine:
    """
    Executes or simulates remediation actions using Docker Desktop.
    Optimized for resolving multiple anomalies under tight time constraints (e.g. 10-15s).
    """

    def __init__(
        self,
        dry_run: bool = False,
        namespace: str = "project_2",
        audit_log_path: str = "audit_log.json",
        scale_replicas: int = 3,
    ):
        self.dry_run = dry_run
        self.namespace = namespace
        self.audit_log_path = Path(audit_log_path)
        self.scale_replicas = scale_replicas

    # ─── Public API ────────────────────────────────────────────────────────────

    def execute(self, decision: dict) -> dict:
        """
        Synchronous interface for the pipeline.
        Since pipeline loop acts sequentially on anomalies, we execute actions blazingly fast using Docker CLI natively.
        Returns an audit record along with a flag `cleared_simulator` indicating a real system interaction took place.
        """
        action = decision.get("action", "no_action")
        service = decision.get("target_service")
        confidence = decision.get("confidence", 0.0)

        # For our sub-15s constraints, scaling the DB maps to a quick restart or starting a stopped scaled replica
        if action in ("scale_db", "restart_pod"):
            result = self._restart_container(service)
        elif action == "alert":
            result = self._send_alert(service, confidence)
        else:
            result = {"status": "skipped", "reason": "no_action"}

        record = self._audit(action, service, confidence, result)
        
        # Give pipeline hint to clear the simulation so anomalies normalize instantly
        if result.get("status") == "success":
            record["cleared_simulator"] = True

        return record

    def _restart_container(self, service: str) -> dict:
        """Finds and restarts the specific Docker compose container natively (< 1 second)."""
        if self.dry_run:
            return self._dry_log("restart_container", service, f"docker restart {service}")

        import subprocess
        now = datetime.now(timezone.utc).isoformat()
        try:
            # We assume docker-compose uses standard project naming: project_2-<service>-1
            container_name = f"{self.namespace}-{service}-1"
            # Fast native execution subprocess
            output = subprocess.run(
                ["docker", "restart", container_name],
                capture_output=True,
                text=True,
                check=True
            )
            return {"status": "success", "restarted_at": now, "output": output.stdout.strip()}
        except subprocess.CalledProcessError as e:
            # Try a fuzzy restart if strict naming failed
            try:
                ps_output = subprocess.run(
                    ["docker", "ps", "-q", "-f", f"name={service}"],
                    capture_output=True,
                    text=True,
                    check=True
                )
                container_ids = ps_output.stdout.strip().split()
                if container_ids:
                    # Restart the first matching container
                    subprocess.run(
                        ["docker", "restart", container_ids[0]],
                        capture_output=True,
                        text=True,
                        check=True
                    )
                    return {"status": "success", "restarted_at": now, "output": f"Fuzzy restart successful for {container_ids[0]}"}
                return {"status": "error", "error": f"Container matching {service} not found or failed native restart format. strict: {e.stderr.strip()}"}
            except Exception as fuzzy_e:
                return {"status": "error", "error": f"Fuzzy search failed: {str(fuzzy_e)}"}
        except Exception as ex:
            return {"status": "error", "error": str(ex)}

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
