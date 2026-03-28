"""
main.py
FastAPI application — REST API for the AIOps platform.
Also serves the web dashboard at /dashboard.
"""

import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from api.models import (
    AnomalyResult, RCAResult, Decision, AuditRecord,
    SimulateRequest, PipelineStatus,
)
from pipeline.pipeline import AIOPipeline

# ─── Global pipeline instance ────────────────────────────────────────────────
pipeline: Optional[AIOPipeline] = None
_pipeline_task: Optional[asyncio.Task] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start pipeline on startup, shut it down on shutdown."""
    global pipeline, _pipeline_task
    pipeline = AIOPipeline()
    _pipeline_task = asyncio.create_task(pipeline.run())
    yield
    if pipeline:
        pipeline.stop()
    if _pipeline_task:
        _pipeline_task.cancel()


app = FastAPI(
    title="AIOps Observability Platform",
    description="Real-time anomaly detection, RCA, and automated remediation for distributed systems.",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS (allow Next.js frontend) ───────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve dashboard static files
DASHBOARD_DIR = Path(__file__).parent.parent / "dashboard"
if DASHBOARD_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(DASHBOARD_DIR)), name="static")


# ─── Dashboard ────────────────────────────────────────────────────────────────
@app.get("/dashboard", response_class=HTMLResponse, include_in_schema=False)
async def serve_dashboard():
    index = DASHBOARD_DIR / "index.html"
    if index.exists():
        return HTMLResponse(content=index.read_text(encoding="utf-8"))
    raise HTTPException(status_code=404, detail="Dashboard not found")


# ─── Status ──────────────────────────────────────────────────────────────────
@app.get("/status", response_model=PipelineStatus, tags=["Pipeline"])
async def get_status():
    """Pipeline health and run state."""
    s = pipeline.state
    return PipelineStatus(
        running=s.pipeline_running,
        cycle_count=s.cycle_count,
        last_cycle_ts=s.last_cycle_ts,
        failure_active=s.failure_active,
        failure_services=s.failure_services,
    )


# ─── Metrics ─────────────────────────────────────────────────────────────────
@app.get("/metrics", tags=["Data"])
async def get_metrics():
    """Latest raw metrics snapshot from all services."""
    return {"metrics": pipeline.state.latest_metrics}


# ─── Anomalies ───────────────────────────────────────────────────────────────
@app.get("/anomalies", tags=["Detection"])
async def get_anomalies():
    """Current anomaly detection results per service."""
    return {"anomalies": pipeline.state.anomaly_results}


# ─── RCA ─────────────────────────────────────────────────────────────────────
@app.get("/rca", tags=["RCA"])
async def get_rca():
    """Current root cause analysis result."""
    return pipeline.state.rca_result


# ─── Decision ────────────────────────────────────────────────────────────────
@app.get("/decision", tags=["Decision"])
async def get_decision():
    """Current remediation decision."""
    return pipeline.state.decision


# ─── Audit Log ───────────────────────────────────────────────────────────────
@app.get("/audit", tags=["Remediation"])
async def get_audit():
    """Remediation audit log (all actions taken)."""
    return {"audit_log": pipeline.remediation.get_audit_log()}


# ─── Dependency Graph ─────────────────────────────────────────────────────────
@app.get("/graph", tags=["Graph"])
async def get_graph():
    """Service dependency graph as JSON (nodes + edges)."""
    return pipeline.graph.as_dict()


# ─── Simulate Failure ─────────────────────────────────────────────────────────
@app.post("/simulate", tags=["Simulation"])
async def simulate_failure(request: SimulateRequest, background_tasks: BackgroundTasks):
    """
    Inject a failure scenario into the pipeline.
    Automatically clears after `duration_s` seconds.
    """
    pipeline.inject_failure(request.services)
    duration = request.duration_s or 30.0

    async def _auto_clear():
        await asyncio.sleep(duration)
        pipeline.clear_failure()

    background_tasks.add_task(_auto_clear)
    return {
        "status": "failure_injected",
        "services": pipeline.state.failure_services,
        "clears_in_s": duration,
    }


@app.post("/clear", tags=["Simulation"])
async def clear_failure():
    """Clear any active failure simulation."""
    pipeline.clear_failure()
    return {"status": "cleared"}


# ─── Execute current decision manually ───────────────────────────────────────
@app.post("/execute", tags=["Remediation"])
async def execute_decision():
    """
    Manually execute the current pipeline decision via the remediation engine.
    Returns the resulting audit record. Works in dry_run mode.
    """
    decision = pipeline.state.decision
    if not decision or decision.get("action") == "no_action":
        raise HTTPException(status_code=400, detail="No actionable decision available.")
    record = pipeline.remediation.execute(decision)
    pipeline.state.audit_log = pipeline.remediation.get_audit_log()
    return {"status": "executed", "record": record}


# ─── Clear audit log ──────────────────────────────────────────────────────────
@app.post("/audit/clear", tags=["Remediation"])
async def clear_audit_log():
    """Wipe the audit log (useful to reset 'Resolved Today' counter)."""
    import json
    from pathlib import Path
    log_path = Path(pipeline.remediation.audit_log_path)
    try:
        with open(log_path, "w") as f:
            json.dump([], f)
        pipeline.state.audit_log = []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"status": "cleared"}


# ─── Full state (for dashboard polling) ──────────────────────────────────────
@app.get("/state", tags=["Dashboard"])
async def get_full_state():
    """Single endpoint returning all current state for dashboard polling."""
    s = pipeline.state
    return {
        "status": {
            "running": s.pipeline_running,
            "cycle_count": s.cycle_count,
            "failure_active": s.failure_active,
            "failure_services": s.failure_services,
        },
        "metrics": s.latest_metrics,
        "anomalies": s.anomaly_results,
        "rca": s.rca_result,
        "decision": s.decision,
        "graph": pipeline.graph.as_dict(),
    }
