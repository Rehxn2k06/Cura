import time
import smtplib
import threading
from email.message import EmailMessage
from datetime import datetime

class EmailNotifier:
    def __init__(self, config: dict):
        self.config = config.get("alerting", {})
        self.enabled = self.config.get("enabled", True)
        self.unresolved_duration_threshold_s = self.config.get("unresolved_duration_threshold_s", 90)
        self.cooldown_s = self.config.get("cooldown_s", 180)
        self.registered_email = self.config.get("registered_email", "admin@localhost")
        self.smtp_server = self.config.get("smtp_server", "localhost")
        self.smtp_port = self.config.get("smtp_port", 1025)
        self.smtp_user = self.config.get("smtp_user", "")
        self.smtp_password = self.config.get("smtp_password", "")
        
        self.last_sent_time = 0
        self.anomaly_start_times = {}  # Tracks {service_name: timestamp}

    def check_and_send_alert(self, state):
        """
        Receives the entire AIOps state object (includes `anomaly_results` and `audit_log`).
        Checks if any anomaly has persisted past the unresolved duration threshold.
        If yes, it dispatches an email cleanly inside a background thread to prevent pipeline blocking.
        """
        if not self.enabled or not self.registered_email:
            return

        current_time = time.time()
        anomaly_results = getattr(state, "anomaly_results", {})
        audit_log = getattr(state, "audit_log", [])

        # 1. Update active anomaly durations
        for svc, res in anomaly_results.items():
            if res.get("is_anomaly"):
                if svc not in self.anomaly_start_times:
                    self.anomaly_start_times[svc] = current_time
            else:
                self.anomaly_start_times.pop(svc, None)

        # 2. Extract anomalies that breached our 'unresolved' threshold
        unresolved_anomalies = {}
        for svc, start_time in self.anomaly_start_times.items():
            duration = current_time - start_time
            if duration >= self.unresolved_duration_threshold_s:
                unresolved_anomalies[svc] = duration

        if not unresolved_anomalies:
            return

        # 3. Check hard cooldown so we don't spam the inbox
        if current_time - self.last_sent_time < self.cooldown_s:
            return

        self.last_sent_time = current_time
        
        # 4. Offload email generation + network dispatching to a background thread
        # This completely guarantees the 15-second tracking and 3-second processing limitations are unaffected.
        threading.Thread(
            target=self._build_and_send_email,
            args=(unresolved_anomalies, audit_log, current_time),
            daemon=True
        ).start()

    def _build_and_send_email(self, unresolved_anomalies, audit_log, current_time):
        timing = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[EmailNotifier] Dispatching background email to {self.registered_email} regarding {len(unresolved_anomalies)} unresolved anomalies...")
        
        msg = EmailMessage()
        msg["Subject"] = f"CRITICAL: System Failed to Autonomously Optimize {len(unresolved_anomalies)} Services"
        msg["From"] = self.smtp_user if self.smtp_user else "aiops-noreply@cura.local"
        msg["To"] = self.registered_email
        
        content = f"AIOps System requires human intervention.\nTiming: {timing}\n\n"
        content += f"The following services have remained anomalous for over {self.unresolved_duration_threshold_s} seconds, meaning autonomous remediation has failed to catch up:\n"
        content += "-" * 60 + "\n"
        
        for svc, duration in unresolved_anomalies.items():
            content += f"- {svc} | Persisted: {duration:.1f} seconds\n"
            
        content += "\nAI Remediation Audit Trail (Recent Actions):\n"
        content += "-" * 60 + "\n"
        
        # Filter audit log for the actions performed within the last ~3-4 minutes to provide recent context
        recent_logs = []
        for entry in audit_log:
            try:
                entry_dt = datetime.strptime(entry.get('ts', ''), "%Y-%m-%d %H:%M:%S")
                # Check if it was within the last 240 seconds
                if (datetime.now() - entry_dt).total_seconds() <= 240:
                    recent_logs.append(entry)
            except Exception:
                # If parsing fails on old timestamp format, just append it if recent anyway
                pass
                
        if not recent_logs:
            content += "The Decision Engine took NO actions recently (likely missing dependencies or failed RCA).\n"
        else:
            # Output the last 10 entries as a structured stack trace for the human
            for log in recent_logs[-10:]: 
                svc = log.get('target_service') or 'Global'
                action = log.get('action')
                desc = log.get('description', '')
                ts = log.get('ts', '')
                content += f"[{ts}] Action: '{action}' on {svc}\n"
                content += f"    Result: {desc}\n"
                
        content += "-" * 60 + "\n"
        content += "\nAdvise manually inspecting Kubernetes pod health or backend metrics."
        
        msg.set_content(content)
        
        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as smtp:
                if self.smtp_user and self.smtp_password:
                    smtp.starttls()
                    smtp.login(self.smtp_user, self.smtp_password)
                smtp.send_message(msg)
            
            print(f"[EmailNotifier] Alert email sent successfully to {self.registered_email}")
        except Exception as e:
            print(f"[EmailNotifier] Failed to send email alert: {e}")
