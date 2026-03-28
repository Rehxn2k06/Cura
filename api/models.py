"""
models.py
Pydantic schemas for FastAPI request/response models.
"""

from pydantic import BaseModel
from typing import Optional, Dict, List, Any


class AnomalyResult(BaseModel):
    service: str
    anomaly_score: float
    is_anomaly: bool


class RCAResult(BaseModel):
    root_cause: Optional[str]
    confidence: float
    scores: Dict[str, float]
    anomalous_services: List[str]
    explanation: str


class Decision(BaseModel):
    action: str
    target_service: Optional[str]
    confidence: float
    description: str
    severity: str
    auto_remediate: bool


class AuditRecord(BaseModel):
    ts: str
    action: str
    target_service: Optional[str]
    confidence: float
    dry_run: bool
    result: Dict[str, Any]


class SimulateRequest(BaseModel):
    services: Optional[List[str]] = None  # None = all services
    duration_s: Optional[float] = 30.0


class PipelineStatus(BaseModel):
    running: bool
    cycle_count: int
    last_cycle_ts: float
    failure_active: bool
    failure_services: List[str]
