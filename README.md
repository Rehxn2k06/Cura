<<<<<<< HEAD
# CURA : Real-Time AIOps for Detection, RCA & Autonomous Remediation

---

##  Overview

**CURA** is a real-time AIOps system designed to:
- detect anomalies before failures escalate
- identify true root causes using causal reasoning
- trigger automated remediation actions

> Detect → Diagnose → Act

---

##  Motivation

Traditional systems:
- react after failure
- ignore inter-service dependencies
- rely on brute-force restarts or alerts

CURA focuses on **causality, not correlation**.

---

##  System Architecture

```
            +----------------------+
            |  Metrics / Logs /   |
            |      Traces         |
            +----------+----------+
                       |
                       v
            +----------------------+
            |   Ingestion Layer    |
            | (Prometheus/Loki/    |
            |     Jaeger Sim)      |
            +----------+----------+
                       |
                       v
            +----------------------+
            |   Streaming Layer    |
            | (Kafka-like system)  |
            +----------+----------+
                       |
                       v
            +----------------------+
            | Feature Engineering  |
            +----------+----------+
                       |
                       v
            +----------------------+
            |  Anomaly Detection   |
            | (IF + LSTM)          |
            +----------+----------+
                       |
                       v
            +----------------------+
            | Dependency Graph     |
            | (NetworkX)           |
            +----------+----------+
                       |
                       v
            +----------------------+
            | RCA Engine           |
            +----------+----------+
                       |
                       v
            +----------------------+
            | Decision Engine      |
            +----------+----------+
                       |
                       v
            +----------------------+
            | Remediation Layer    |
            | (Kubernetes)         |
            +----------------------+
```

---

##  Pipeline Breakdown

### 1. Data Ingestion

Simulated observability stack:
- Prometheus → metrics
- Loki → logs
- Jaeger → traces

---

### 2. Streaming Layer

Kafka-like in-memory system:

- Producer → generates events  
- Stream → shared queue  
- Consumer → processes data  

✔ asynchronous  
✔ decoupled  
✔ real-time simulation  

---

### 3. Feature Engineering

We transform raw signals into meaningful features:

- rolling statistics
- z-score normalization
- cross-service correlation

---

### 4. Anomaly Detection

#### Isolation Forest
- fast, unsupervised
- detects point anomalies
- no temporal awareness

#### LSTM
- captures sequential behavior
- detects gradual degradation

#### Combined Approach
- IF → primary detector  
- LSTM → temporal context  

---

###  Baseline Drift Problem

When systems degrade over time:
- model may treat degraded state as normal

Solution:
- change detection
- regime-aware logic

---

##  Root Cause Analysis (Core)

### Problem

```
auth ↑
payment ↑
db ↑
```

Which one is the cause?

---

### Solution: Dependency Graph

```
auth → payment → database
```

---

### Causal Attribution

```
score(service) = anomaly_score - dependency_influence
```

Interpretation:
- anomaly + normal dependencies → root cause  
- anomaly + anomalous dependencies → propagated  

---

###  Key Insight

> “Which service cannot explain its anomaly?”

---

##  Decision & Remediation

### Decision Engine
- rule-based
- deterministic
- explainable

### Remediation Layer
- restart services
- scale deployments
- simulate recovery

---

### Why This Matters

Without CURA:
```
detect → alert → human → fix
```

With CURA:
```
detect → diagnose → act
```

---

##  Performance

- Initial: ~15s  
- Optimized: **<5s per anomaly**  
- ~66% improvement  

---

##  Key Features

- Real-time pipeline  
- Hybrid anomaly detection  
- Graph-based RCA  
- Automated remediation  
- Lightweight architecture  

---

##  Limitations

- static dependency graph  
- heuristic causality  
- limited production testing  

---

##  Future Work

- learn dependencies dynamically  
- probabilistic causality  
- temporal propagation modeling  
- confidence-based decisions  

---

##  Hackathon Experience

Built in **36 hours**:
- full system design
- ML + backend + frontend
- real-time debugging + optimization

🏆 Top 15 out of ~80 teams

---

##  Conclusion

> Observability alone is not enough.  
> Systems must **understand failures and act on them**.

---

=======
