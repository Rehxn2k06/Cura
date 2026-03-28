"""
pipeline.py
End-to-end AIOps pipeline orchestrator.
Ties together: ingestion → streaming → features → detection → RCA → decision → remediation
Runs continuous loops and exposes state for the FastAPI layer.
"""

import asyncio
import time
import yaml
from pathlib import Path
from typing import Optional

from ingestion.metrics_simulator import generate_snapshot
from streaming.producer import publish_batch
from features.feature_extractor import FeatureExtractor
from detection.anomaly_detector import AnomalyDetectionEngine
from graph.dependency_graph import ServiceDependencyGraph
from rca.rca_engine import RCAEngine
from decision.decision_engine import DecisionEngine
from remediation.remediation import RemediationEngine


def load_config(path: str = "config.yaml") -> dict:
    with open(Path(path)) as f:
        return yaml.safe_load(f)


class AIOpsState:
    """Shared mutable state exposed to the API."""

    def __init__(self):
        self.latest_metrics: list = []
        self.anomaly_results: dict = {}
        self.rca_result: dict = {}
        self.decision: dict = {}
        self.audit_log: list = []
        self.failure_active: bool = False
        self.failure_services: list = []
        self.pipeline_running: bool = False
        self.cycle_count: int = 0
        self.last_cycle_ts: float = 0.0


class AIOPipeline:
    """
    Main pipeline orchestrator.
    Runs two async tasks:
      1. ingestion_loop — generates and publishes metrics
      2. processing_loop — reads, extracts, detects, RCAs, decides, remediates
    """

    def __init__(self, config_path: str = "config.yaml"):
        self.cfg = load_config(config_path)
        self.state = AIOpsState()
        self._init_components()

    def _init_components(self):
        cfg = self.cfg
        svc_names = [s["name"] for s in cfg["services"]]

        # Feature extractor
        self.extractor = FeatureExtractor(window=cfg["features"]["rolling_window"])

        # Anomaly detector — trains models on first run
        self.detector = AnomalyDetectionEngine(
            services=svc_names,
            contamination=cfg["detection"]["contamination"],
            anomaly_threshold=cfg["detection"]["anomaly_threshold"],
            if_weight=cfg["detection"].get("if_weight", 0.6),
            lstm_weight=cfg["detection"].get("lstm_weight", 0.4),
            lstm_seq_len=cfg["detection"].get("lstm_seq_len", 10),
            lstm_hidden=cfg["detection"].get("lstm_hidden", 8),
            lstm_epochs=cfg["detection"].get("lstm_epochs", 40),
        )
        self.detector.load_or_train(self.extractor)

        # Dependency graph
        self.graph = ServiceDependencyGraph()
        self.graph.build_from_config(cfg["services"])

        # RCA engine
        self.rca_engine = RCAEngine(self.graph, weight_decay=cfg["rca"]["dependency_weight_decay"])

        # Decision engine
        self.decision_engine = DecisionEngine(
            rules=cfg["decision"]["rules"],
            confidence_threshold=cfg["rca"]["confidence_threshold"],
        )

        # Remediation
        rem_cfg = cfg["remediation"]
        self.remediation = RemediationEngine(
            dry_run=rem_cfg["dry_run"],
            namespace=rem_cfg["namespace"],
            audit_log_path=rem_cfg["audit_log"],
            scale_replicas=rem_cfg["scale_replicas"],
        )

    # ─── Ingestion Loop ──────────────────────────────────────────────────────

    async def ingestion_loop(self, interval_s: float = 2.0):
        """Continuously generate and publish metrics."""
        self.state.pipeline_running = True
        while self.state.pipeline_running:
            failure_svcs = self.state.failure_services if self.state.failure_active else []
            metrics = generate_snapshot(failure_services=failure_svcs)
            publish_batch(metrics)
            self.state.latest_metrics = metrics
            await asyncio.sleep(interval_s)

    # ─── Processing Loop ─────────────────────────────────────────────────────

    async def processing_loop(self, interval_s: float = 3.0):
        """Continuously read metrics, extract features, detect, RCA, remediate."""
        await asyncio.sleep(5)  # Let ingestion_loop build up initial data
        while self.state.pipeline_running:
            # Ingest current metric batch into feature extractor + LSTM buffer
            for record in self.state.latest_metrics:
                self.extractor.ingest(record)
                self.detector.push_raw(record)  # feed raw signal to LSTM

            # Anomaly detection
            anomaly_results = self.detector.detect(self.extractor)
            self.state.anomaly_results = anomaly_results

            # RCA
            rca_result = self.rca_engine.analyze(anomaly_results)
            self.state.rca_result = rca_result

            # Decision
            decision = self.decision_engine.decide(rca_result)
            self.state.decision = decision

            # Remediation (only if auto_remediate and root identified)
            if decision.get("auto_remediate") and rca_result.get("root_cause"):
                audit_record = self.remediation.execute(decision)
                self.state.audit_log = self.remediation.get_audit_log()

            self.state.cycle_count += 1
            self.state.last_cycle_ts = time.time()

            await asyncio.sleep(interval_s)

    async def run(self):
        """Run ingestion and processing loops concurrently."""
        await asyncio.gather(
            self.ingestion_loop(self.cfg["simulation"]["normal_interval_s"]),
            self.processing_loop(),
        )

    def stop(self):
        self.state.pipeline_running = False

    def inject_failure(self, services: Optional[list] = None):
        """Activate failure mode for given services."""
        all_svcs = [s["name"] for s in self.cfg["services"]]
        self.state.failure_services = services or all_svcs
        self.state.failure_active = True

    def clear_failure(self):
        """Return to normal operation."""
        self.state.failure_active = False
        self.state.failure_services = []
