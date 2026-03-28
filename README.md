# AIOps Observability Platform

Real-time, end-to-end AIOps system for distributed microservices — anomaly detection, root cause analysis, and automated Kubernetes remediation, all within ~15 seconds.

## 🏗 Architecture

```
Metrics/Logs/Traces → Kafka (in-memory) → Feature Engineering
→ IsolationForest → Dependency Graph → RCA Engine
→ Decision Engine → Kubernetes Remediation
```

## 📁 Project Structure

```
project_2/
├── config.yaml           # Central configuration
├── requirements.txt
├── ingestion/            # Simulate Prometheus/Loki/Jaeger
├── streaming/            # In-memory Kafka-compatible bus
├── features/             # Rolling stats, z-scores, cross-service correlation
├── detection/            # IsolationForest anomaly detection
├── graph/                # NetworkX service dependency graph
├── rca/                  # Root cause analysis engine
├── decision/             # Rule-based action mapper
├── remediation/          # Kubernetes client (dry-run by default)
├── pipeline/             # End-to-end orchestrator
├── api/                  # FastAPI REST endpoints
├── dashboard/            # Real-time web UI
└── tests/                # Unit + integration tests
```

## 🚀 Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the platform
```bash
uvicorn api.main:app --reload --port 8000
```

### 3. Open Dashboard
```
http://localhost:8000/dashboard
```

### 4. Inject a failure scenario
Click **💥 Inject DB Failure** in the dashboard, or:
```bash
curl -X POST http://localhost:8000/simulate \
  -H "Content-Type: application/json" \
  -d '{"services": ["database-service", "payment-service", "auth-service"], "duration_s": 60}'
```

## 🧪 Run Tests
```bash
pytest tests/ -v
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/dashboard` | GET | Web dashboard |
| `/status` | GET | Pipeline health |
| `/metrics` | GET | Latest raw metrics |
| `/anomalies` | GET | Anomaly scores per service |
| `/rca` | GET | Root cause result |
| `/decision` | GET | Recommended action |
| `/audit` | GET | Remediation audit log |
| `/graph` | GET | Service dependency graph |
| `/simulate` | POST | Inject failure scenario |
| `/clear` | POST | Clear active failure |
| `/state` | GET | Full state (dashboard polling) |

## ⚙️ Configuration (`config.yaml`)

| Key | Default | Description |
|---|---|---|
| `remediation.dry_run` | `true` | Set `false` for real K8s actions |
| `detection.anomaly_threshold` | `0.6` | Score cutoff for anomaly flag |
| `rca.confidence_threshold` | `0.5` | Min confidence for auto-remediation |
| `features.rolling_window` | `10` | Sliding window size for features |

## 🔄 Pipeline Timing

| Step | Time |
|---|---|
| Ingestion | ~1–2s |
| Feature extraction | ~1s |
| ML inference | ~1–2s |
| RCA | ~1s |
| Decision + remediation | ~1s |
| **Total** | **~7–10s** ✅ |

## 🧠 Key Design Decisions

- **No Docker required**: uses in-memory streaming queue (Kafka-compatible interface)
- **Dry-run by default**: K8s remediation is simulated safely without a cluster
- **Causal attribution RCA**: scores services by anomaly contribution minus what's explained by their dependencies
- **Auto-training**: models train on synthetic normal data if no persisted model found
