import time
import smtplib
from email.message import EmailMessage
from datetime import datetime

class EmailNotifier:
    def __init__(self, config: dict):
        self.config = config.get("alerting", {})
        self.enabled = self.config.get("enabled", True)
        self.registered_email = self.config.get("registered_email", "admin@localhost")
        self.smtp_server = self.config.get("smtp_server", "localhost")
        self.smtp_port = self.config.get("smtp_port", 1025)
        self.smtp_user = self.config.get("smtp_user", "")
        self.smtp_password = self.config.get("smtp_password", "")
        self.last_sent_time = 0

    def check_and_send_alert(self, anomaly_results: dict):
        if not self.enabled or not self.registered_email:
            return

        active_anomalies = {
            svc: res for svc, res in anomaly_results.items() if res.get("is_anomaly")
        }

        # Check if more than 2 anomalies detected at the same time
        if len(active_anomalies) > 2:
            current_time = time.time()
            # Cooldown of 60 seconds to avoid spamming the registered email
            if current_time - self.last_sent_time < 60:
                print("[EmailNotifier] Multiple anomalies detected, but email is on cooldown.")
                return

            timing = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"[EmailNotifier] Sending email to {self.registered_email} regarding {len(active_anomalies)} anomalies...")
            
            msg = EmailMessage()
            msg["Subject"] = f"CRITICAL: {len(active_anomalies)} Anomalies Detected!"
            msg["From"] = self.smtp_user if self.smtp_user else "aiops-noreply@cura.local"
            msg["To"] = self.registered_email
            
            content = f"More than 2 anomalies detected at the same time.\nTiming: {timing}\n\n"
            content += "Anomaly Details:\n"
            content += "-" * 40 + "\n"
            for svc, res in active_anomalies.items():
                content += f"Service: {svc}\n"
                content += f"  IF Score: {res.get('if_score')}\n"
                content += f"  LSTM Score: {res.get('lstm_score')}\n"
                content += f"  Overall Anomaly Score: {res.get('anomaly_score')}\n"
                content += "-" * 40 + "\n"
                
            msg.set_content(content)
            
            try:
                # Basic SMTP setup
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as smtp:
                    # Optional TLS if configured with a real server like smtp.gmail.com
                    if self.smtp_user and self.smtp_password:
                        smtp.starttls()
                        smtp.login(self.smtp_user, self.smtp_password)
                    smtp.send_message(msg)
                
                print(f"[EmailNotifier] Alert email sent successfully to {self.registered_email}")
                self.last_sent_time = current_time
            except Exception as e:
                print(f"[EmailNotifier] Failed to send email alert: {e}")

