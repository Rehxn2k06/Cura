/**
 * lib/api.ts
 * API client for the AIOps FastAPI backend.
 * Base URL is configurable via NEXT_PUBLIC_API_URL env var.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ─── Types matching FastAPI response shapes ───────────────────────────────────

export interface BackendMetric {
  service: string;
  cpu: number;
  memory: number;
  latency: number;
  error_rate: number;
  throughput: number;
  timestamp?: string;
}

export interface BackendAnomaly {
  is_anomaly: boolean;
  anomaly_score: number;
  if_score: number;
  lstm_score: number;
}

export interface BackendRCA {
  root_cause: string | null;
  confidence: number;
  explanation: string;
  anomalous_services: string[];
}

export interface BackendDecision {
  action: string;
  description: string;
  target_service?: string;
}

export interface BackendStatus {
  running: boolean;
  cycle_count: number;
  failure_active: boolean;
  failure_services: string[];
}

export interface BackendGraph {
  nodes: { id: string; label: string }[];
  edges: { source: string; target: string }[];
}

export interface BackendAuditEntry {
  ts: string;
  action: string;
  target_service: string | null;
  dry_run: boolean;
  description?: string;
}

export interface BackendState {
  status: BackendStatus;
  metrics: BackendMetric[];
  anomalies: Record<string, BackendAnomaly>;
  rca: BackendRCA;
  decision: BackendDecision;
  graph: BackendGraph;
}

// ─── API Client ───────────────────────────────────────────────────────────────

async function safeFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export const api = {
  /** Full dashboard state — used for polling */
  getState: () => safeFetch<BackendState>(`${BASE}/state`),

  /** Pipeline health */
  getStatus: () => safeFetch<BackendStatus>(`${BASE}/status`),

  /** Remediation audit log */
  getAudit: () => safeFetch<{ audit_log: BackendAuditEntry[] }>(`${BASE}/audit`),

  /** Service dependency graph */
  getGraph: () => safeFetch<BackendGraph>(`${BASE}/graph`),

  /** Inject a failure scenario */
  simulate: (services: string[], duration_s = 60) =>
    safeFetch<{ status: string }>(`${BASE}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services, duration_s }),
    }),

  /** Clear active failure simulation */
  clearFailure: () =>
    safeFetch<{ status: string }>(`${BASE}/clear`, { method: 'POST' }),

  /** Clear the audit log */
  clearAudit: () =>
    safeFetch<{ status: string }>(`${BASE}/audit/clear`, { method: 'POST' }),

  /** Manually execute the current pipeline decision */
  executeDecision: () =>
    safeFetch<{ status: string; record: Record<string, unknown> }>(`${BASE}/execute`, { method: 'POST' }),
};
