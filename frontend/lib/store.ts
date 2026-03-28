/**
 * lib/store.ts
 * Zustand global store for the AIOps dashboard.
 * All data is sourced live from the FastAPI backend via lib/api.ts.
 * Mock data has been replaced with real polling.
 */

import { create } from 'zustand';
import { api, BackendState, BackendAuditEntry } from './api';

// ─── Public Types ────────────────────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;          // Display label shown in UI
  backendId: string;     // Matches backend service key (e.g. 'database-service')
  status: 'online' | 'warning' | 'offline';
  cpuUsage: number;
  uptime: string;
  latency: number;
  errorRate: number;
  throughput: number;
  memoryUsage: number;
  isAnomaly: boolean;
  anomalyScore: number;
  ifScore: number;
  lstmScore: number;
}

export interface DashboardMetrics {
  activeIncidents: number;
  resolvedToday: number;
  totalServices: number;
  aiActionsExecuted: number;
}

export interface RCAState {
  rootCause: string | null;         // backend service id
  rootCauseLabel: string | null;    // human-readable
  confidence: number;
  explanation: string;
  anomalousServices: string[];
}

export interface PipelineStatus {
  running: boolean;
  cycleCount: number;
  failureActive: boolean;
  failureServices: string[];
}

export interface AuditEntry {
  ts: string;
  action: string;
  targetService: string | null;
  targetServiceLabel: string | null;
  dryRun: boolean;
}

export type AgentMode = 'yolo' | 'plan' | 'approval';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface AIAgentState {
  mode: AgentMode;
  confidence: number;
  autoRemediation: boolean;
  dryRun: boolean;
  riskLevel: RiskLevel;
  lastAction: string;
  actionTime: string;
}

// ─── Service Name Mapping ────────────────────────────────────────────────────
// Maps backend service IDs → human-readable display labels used by the frontend

export const SERVICE_LABEL_MAP: Record<string, string> = {
  'frontend-service':  'Frontend Service',
  'catalogue-service': 'Catalogue Service',
  'cart-service':      'Cart Service',
  'order-service':     'Order Service',
  'payment-service':   'Payment Service',
  'database-service':  'Database Service',
};

export const SERVICE_IDS = Object.keys(SERVICE_LABEL_MAP);

export function serviceLabel(backendId: string): string {
  return SERVICE_LABEL_MAP[backendId] ?? backendId;
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface DashboardStore {
  // Live data
  metrics: DashboardMetrics;
  services: Service[];
  rca: RCAState;
  pipelineStatus: PipelineStatus;
  auditLog: AuditEntry[];
  lastUpdated: Date | null;
  isConnected: boolean;

  // Chart data (derived from latest metrics)
  cpuData: Array<{ name: string; [key: string]: string | number }>;
  latencyData: Array<{ name: string; [key: string]: string | number }>;
  errorRateData: Array<{ name: string; [key: string]: string | number }>;

  // Agent controls (local UI state)
  agentState: AIAgentState;

  // Actions — live data
  syncFromBackend: (state: BackendState) => void;
  syncAuditLog: (entries: BackendAuditEntry[]) => void;
  setConnected: (v: boolean) => void;

  // Actions — agent controls
  updateMetrics: (metrics: Partial<DashboardMetrics>) => void;
  updateAgentMode: (mode: AgentMode) => void;
  updateConfidence: (confidence: number) => void;
  updateAutoRemediation: (enabled: boolean) => void;
  updateDryRun: (enabled: boolean) => void;
  updateRiskLevel: (risk: RiskLevel) => void;
  recordAction: (action: string) => void;
  emergencyStop: () => void;
}

// ─── Initial / Fallback Values ────────────────────────────────────────────────

const INITIAL_SERVICES: Service[] = SERVICE_IDS.map((id, i) => ({
  id: String(i + 1),
  name: SERVICE_LABEL_MAP[id],
  backendId: id,
  status: 'online',
  cpuUsage: 0,
  uptime: '—',
  latency: 0,
  errorRate: 0,
  throughput: 0,
  memoryUsage: 0,
  isAnomaly: false,
  anomalyScore: 0,
  ifScore: 0,
  lstmScore: 0,
}));

// ─── Helper: Backend → Store mapping ─────────────────────────────────────────

function mapBackendState(data: BackendState, prev: DashboardStore): Partial<DashboardStore> {
  const { status, metrics: rawMetrics, anomalies, rca, decision } = data;

  // Index metrics by service id
  const metricsByService: Record<string, (typeof rawMetrics)[0]> = {};
  rawMetrics.forEach((m) => { metricsByService[m.service] = m; });

  // Build services array
  const services: Service[] = SERVICE_IDS.map((id, i) => {
    const m = metricsByService[id] ?? {};
    const a = anomalies[id] ?? { is_anomaly: false, anomaly_score: 0, if_score: 0, lstm_score: 0 };
    const cpu = m.cpu ?? 0;
    const err = m.error_rate ?? 0;
    const lat = m.latency ?? 0;

    const status: Service['status'] =
      a.is_anomaly ? 'warning' :
      cpu > 85 || err > 0.15 || lat > 500 ? 'warning' : 'online';

    return {
      id: String(i + 1),
      name: SERVICE_LABEL_MAP[id],
      backendId: id,
      status,
      cpuUsage: parseFloat(cpu.toFixed(1)),
      uptime: '99.9%',   // backend doesn't expose uptime — cosmetic placeholder
      latency: parseFloat(lat.toFixed(0)),
      errorRate: parseFloat((err * 100).toFixed(2)),
      throughput: parseFloat((m.throughput ?? 0).toFixed(0)),
      memoryUsage: parseFloat((m.memory ?? 0).toFixed(1)),
      isAnomaly: a.is_anomaly,
      anomalyScore: a.anomaly_score,
      ifScore: a.if_score,
      lstmScore: a.lstm_score,
    };
  });

  // Metrics cards
  const activeIncidents = services.filter((s) => s.isAnomaly).length;
  const aiActionsExecuted = prev.metrics.aiActionsExecuted; // incremented via audit log sync

  // RCA
  const rcaState: RCAState = {
    rootCause: rca.root_cause,
    rootCauseLabel: rca.root_cause ? serviceLabel(rca.root_cause) : null,
    confidence: rca.confidence ?? 0,
    explanation: rca.explanation ?? '',
    anomalousServices: rca.anomalous_services ?? [],
  };

  // Last action from decision
  let lastAction = prev.agentState.lastAction;
  let actionTime = prev.agentState.actionTime;
  if (decision?.action && decision.action !== 'no_action') {
    lastAction = `${decision.action.replace(/_/g, ' ')} — ${serviceLabel(decision.target_service ?? '')}`;
    actionTime = 'just now';
  }

  // CPU chart — one bar per service
  const cpuData = services.map((s) => ({ name: s.name.replace(' Service', ''), cpu: s.cpuUsage, limit: 100 }));

  // Latency line chart — snapshot points (append to existing history, cap at 20)
  const now = new Date();
  const timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const newLatencyPoint: Record<string, string | number> = { name: timeLabel };
  services.forEach((s) => { newLatencyPoint[s.name.replace(' Service', '')] = s.latency; });
  const latencyHistory = [...prev.latencyData, newLatencyPoint].slice(-20);

  // Error rate chart — one bar per service
  const errorRateData = services.map((s) => ({ name: s.name.replace(' Service', ''), errors: s.errorRate, limit: 100 }));

  // Pipeline status
  const pipelineStatus: PipelineStatus = {
    running: status.running,
    cycleCount: status.cycle_count,
    failureActive: status.failure_active,
    failureServices: status.failure_services,
  };

  return {
    services,
    rca: rcaState,
    pipelineStatus,
    cpuData,
    latencyData: latencyHistory,
    errorRateData,
    lastUpdated: now,
    isConnected: true,
    metrics: {
      activeIncidents,
      resolvedToday: prev.metrics.resolvedToday,
      totalServices: SERVICE_IDS.length,
      aiActionsExecuted,
    },
    agentState: {
      ...prev.agentState,
      lastAction,
      actionTime,
      confidence: rca.confidence != null ? Math.round(rca.confidence * 100) : prev.agentState.confidence,
    },
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  metrics: {
    activeIncidents: 0,
    resolvedToday: 0,
    totalServices: SERVICE_IDS.length,
    aiActionsExecuted: 0,
  },
  services: INITIAL_SERVICES,
  rca: {
    rootCause: null,
    rootCauseLabel: null,
    confidence: 0,
    explanation: '',
    anomalousServices: [],
  },
  pipelineStatus: {
    running: false,
    cycleCount: 0,
    failureActive: false,
    failureServices: [],
  },
  auditLog: [],
  lastUpdated: null,
  isConnected: false,
  cpuData: INITIAL_SERVICES.map((s) => ({ name: s.name.replace(' Service', ''), cpu: 0, limit: 100 })),
  latencyData: [],
  errorRateData: INITIAL_SERVICES.map((s) => ({ name: s.name.replace(' Service', ''), errors: 0, limit: 100 })),
  agentState: {
    mode: 'plan',
    confidence: 0,
    autoRemediation: false,
    dryRun: true,
    riskLevel: 'medium',
    lastAction: 'Awaiting live data…',
    actionTime: '',
  },

  // ── Live data actions ──────────────────────────────────────────────────────
  syncFromBackend: (data) => set((prev) => mapBackendState(data, prev)),

  syncAuditLog: (entries) => {
    const mapped: AuditEntry[] = [...entries].reverse().slice(0, 30).map((e) => ({
      ts: e.ts,
      action: e.action,
      targetService: e.target_service,
      targetServiceLabel: e.target_service ? serviceLabel(e.target_service) : null,
      dryRun: e.dry_run,
    }));
    set((prev) => ({
      auditLog: mapped,
      metrics: {
        ...prev.metrics,
        aiActionsExecuted: entries.length,
        resolvedToday: entries.filter((e) => e.action !== 'no_action').length,
      },
    }));
  },

  setConnected: (v) => set({ isConnected: v }),

  // ── Agent control actions (UI-only state) ─────────────────────────────────
  updateMetrics: (m) => set((prev) => ({ metrics: { ...prev.metrics, ...m } })),

  updateAgentMode: (mode) =>
    set((prev) => ({ agentState: { ...prev.agentState, mode } })),

  updateConfidence: (confidence) =>
    set((prev) => ({ agentState: { ...prev.agentState, confidence: Math.min(100, Math.max(0, confidence)) } })),

  updateAutoRemediation: (autoRemediation) =>
    set((prev) => ({ agentState: { ...prev.agentState, autoRemediation } })),

  updateDryRun: (dryRun) =>
    set((prev) => ({ agentState: { ...prev.agentState, dryRun } })),

  updateRiskLevel: (riskLevel) =>
    set((prev) => ({ agentState: { ...prev.agentState, riskLevel } })),

  recordAction: (action) =>
    set((prev) => ({ agentState: { ...prev.agentState, lastAction: action, actionTime: 'just now' } })),

  emergencyStop: () =>
    set((prev) => ({
      agentState: {
        ...prev.agentState,
        mode: 'plan',
        autoRemediation: false,
        dryRun: true,
        lastAction: '🛑 Emergency stop activated',
        actionTime: 'just now',
      },
    })),
}));

// ─── Polling ──────────────────────────────────────────────────────────────────

let _stateInterval: ReturnType<typeof setInterval> | null = null;
let _auditInterval: ReturnType<typeof setInterval> | null = null;

export function startPolling(intervalMs = 3000) {
  if (_stateInterval) return;

  const { syncFromBackend, syncAuditLog, setConnected } = useDashboardStore.getState();

  async function pollState() {
    const data = await api.getState();
    if (data) {
      syncFromBackend(data);
      setConnected(true);
    } else {
      setConnected(false);
    }
  }

  async function pollAudit() {
    const data = await api.getAudit();
    if (data?.audit_log) {
      syncAuditLog(data.audit_log);
    }
  }

  pollState();
  pollAudit();
  _stateInterval = setInterval(pollState, intervalMs);
  _auditInterval = setInterval(pollAudit, intervalMs + 500);
}

export function stopPolling() {
  if (_stateInterval) { clearInterval(_stateInterval); _stateInterval = null; }
  if (_auditInterval) { clearInterval(_auditInterval); _auditInterval = null; }
}
