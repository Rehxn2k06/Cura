'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, CheckCircle, AlertCircle, Clock, Zap, Shield, Activity, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDashboardStore, serviceLabel } from '@/lib/store';
import { api } from '@/lib/api';
import type { AuditEntry } from '@/lib/store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Incident {
  id: string;
  service: string;         // display label
  backendId: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved';
  timestamp: Date;
  title: string;
  description: string;
  aiAnalysis: string;
  anomalyScore?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function auditToIncident(entry: AuditEntry, idx: number): Incident {
  const svc = entry.targetServiceLabel ?? 'Unknown Service';
  const action = entry.action.replace(/_/g, ' ');
  const isDryRun = entry.dryRun;

  return {
    id: `audit-${idx}`,
    service: svc,
    backendId: entry.targetService,
    severity: isDryRun ? 'low' : 'high',
    status: 'resolved',
    timestamp: new Date(entry.ts),
    title: `${action.charAt(0).toUpperCase() + action.slice(1)}${isDryRun ? ' (Dry Run)' : ''}`,
    description: `AI action executed on ${svc}`,
    aiAnalysis: `Action: ${action}. Target: ${svc}. ${isDryRun ? 'This was a dry-run — no real changes were made.' : 'Action was applied to the live system.'}`,
  };
}

function anomalyToIncident(service: ReturnType<typeof useDashboardStore.getState>['services'][0], idx: number): Incident {
  const score = service.anomalyScore;
  const severity: Incident['severity'] =
    score > 0.8 ? 'critical' : score > 0.6 ? 'high' : score > 0.4 ? 'medium' : 'low';

  return {
    id: `anomaly-${service.id}`,
    service: service.name,
    backendId: service.backendId,
    severity,
    status: 'active',
    timestamp: new Date(),
    title: `Anomaly Detected — ${service.name}`,
    description: `Ensemble anomaly score: ${score.toFixed(3)} (IF: ${service.ifScore.toFixed(3)}, LSTM: ${service.lstmScore.toFixed(3)})`,
    aiAnalysis: `${service.name} is exhibiting anomalous behaviour. CPU: ${service.cpuUsage}%, Latency: ${service.latency}ms, Error Rate: ${service.errorRate}%. IF score: ${service.ifScore.toFixed(3)}, LSTM score: ${service.lstmScore.toFixed(3)}.`,
    anomalyScore: score,
  };
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10';
    case 'high':     return 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/10';
    case 'medium':   return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10';
    default:         return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10';
  }
};

const getStatusColor = (status: string) =>
  status === 'resolved'
    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10'
    : 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/10';

// ─── Component ───────────────────────────────────────────────────────────────

export function IncidentsContent() {
  const { services, auditLog, pipelineStatus } = useDashboardStore();
  const executeDecision = useDashboardStore((s) => s.executeDecision);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [executing, setExecuting] = useState(false);
  const [clearingAudit, setClearingAudit] = useState(false);

  // Build incidents list from live data
  const incidents = useMemo<Incident[]>(() => {
    const activeAnomalies: Incident[] =
      services.filter((s) => s.isAnomaly).map((s, i) => anomalyToIncident(s, i));
    const auditIncidents: Incident[] = auditLog.map((e, i) => auditToIncident(e, i));
    return [...activeAnomalies, ...auditIncidents];
  }, [services, auditLog]);

  const filtered = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || inc.severity === severityFilter;
    const matchesStatus   = statusFilter   === 'all' || inc.status   === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  /**
   * Execute the current RCA decision via the backend remediation engine.
   * This is the correct "AI Fix" — NOT re-injecting a failure.
   */
  const handleExecuteDecision = async () => {
    setExecuting(true);
    try {
      const res = await executeDecision();
      if (res?.status === 'executed') {
        toast.success('🤖 Decision executed — check audit log for details', { duration: 4000 });
      } else {
        toast.error('No actionable decision available — wait for anomaly detection or inject a failure first');
      }
    } catch {
      toast.error('Execution failed');
    } finally {
      setExecuting(false);
    }
  };

  /** Inject a failure for the anomalous service to showcase detection → decision flow */
  const handleInjectForService = async (inc: Incident) => {
    if (!inc.backendId) {
      toast.info('No specific service target');
      return;
    }
    const res = await api.simulate([inc.backendId], 60);
    if (res) toast.success(`⚡ Failure injected into ${inc.service}`);
    else     toast.error('Backend unreachable');
  };

  const handleClearFailure = async () => {
    const res = await api.clearFailure();
    if (res) toast.success('✅ Failure cleared — system recovering');
  };

  const handleClearAudit = async () => {
    setClearingAudit(true);
    const res = await api.clearAudit();
    setClearingAudit(false);
    if (res) toast.success('Audit log cleared');
    else toast.error('Backend unreachable');
  };

  return (
    <div className="space-y-6">
      {/* Pipeline status banner */}
      {pipelineStatus.failureActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border border-orange-400/50 dark:border-orange-500/50 bg-orange-50/50 dark:bg-orange-500/10 p-4 rounded-2xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400 animate-pulse" />
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
              ⚠️ Active failure simulation — {pipelineStatus.failureServices.map(serviceLabel).join(', ')}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExecuteDecision}
              disabled={executing}
              className="flex items-center gap-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {executing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Execute Decision
            </button>
            <button
              onClick={handleClearFailure}
              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Clear Failure
            </button>
          </div>
        </motion.div>
      )}

      {/* Search & Filter Bar */}
      <div className="glass card-glow border border-gray-300 dark:border-white/10 p-4 rounded-2xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-white/40 font-medium">
              {filtered.length} incident{filtered.length !== 1 ? 's' : ''}
            </span>
            {auditLog.length > 0 && (
              <button
                onClick={handleClearAudit}
                disabled={clearingAudit}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {clearingAudit ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Reset log
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-600 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search incidents…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-400"
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-400"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-400"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="glass card-glow border border-gray-300 dark:border-white/10 p-8 rounded-2xl text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-white/70 font-semibold">All clear — no incidents found</p>
              <p className="text-xs text-gray-500 dark:text-white/40 mt-1">System is operating normally</p>
            </div>
          ) : (
            filtered.map((incident) => (
              <motion.div
                key={incident.id}
                onClick={() => setSelectedIncident(incident)}
                className="glass card-glow border border-gray-300 dark:border-white/10 p-4 rounded-2xl cursor-pointer hover:border-gray-400 dark:hover:border-white/20 transition-all"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{incident.title}</h3>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-white/70 mb-2">{incident.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-white/70">
                      <span>Service: {incident.service}</span>
                      <span>{new Date(incident.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(incident.status)}`}>
                    {incident.status === 'resolved' ? 'RESOLVED' : 'ACTIVE'}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedIncident && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass card-glow border border-gray-300 dark:border-white/10 p-6 rounded-2xl space-y-6 sticky top-24"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-bold text-gray-900 dark:text-white text-lg">{selectedIncident.title}</h2>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getSeverityColor(selectedIncident.severity)}`}>
                  {selectedIncident.severity.toUpperCase()}
                </span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(selectedIncident.status)}`}>
                  {selectedIncident.status === 'resolved' ? 'RESOLVED' : 'ACTIVE'}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-600 dark:text-white/70 font-semibold mb-1">SERVICE AFFECTED</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedIncident.service}</p>
              </div>

              {selectedIncident.anomalyScore !== undefined && (
                <div>
                  <p className="text-xs text-gray-600 dark:text-white/70 font-semibold mb-2">ANOMALY SCORE</p>
                  <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full"
                      style={{ width: `${(selectedIncident.anomalyScore * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-bold">
                    {(selectedIncident.anomalyScore * 100).toFixed(1)}%
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-600 dark:text-white/70 font-semibold mb-2">AI ANALYSIS</p>
                <p className="text-sm text-gray-700 dark:text-white/80 leading-relaxed">{selectedIncident.aiAnalysis}</p>
              </div>

              {selectedIncident.status === 'active' && (
                <div className="pt-4 space-y-2 border-t border-gray-300 dark:border-white/10">
                  {/* Execute the RCA engine's current decision (scale_db / restart_pod / alert) */}
                  <button
                    id="execute-rca-decision-btn"
                    onClick={handleExecuteDecision}
                    disabled={executing}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-all"
                  >
                    {executing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {executing ? 'Executing…' : 'Execute RCA Decision'}
                  </button>
                  {/* Inject failure for THIS specific service to trigger cascade detection */}
                  <button
                    id="inject-service-failure-btn"
                    onClick={() => handleInjectForService(selectedIncident)}
                    className="w-full flex items-center justify-center gap-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 font-semibold py-2 rounded-xl transition-colors text-sm"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Inject Failure for {selectedIncident.service}
                  </button>
                  <button
                    onClick={handleClearFailure}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-xl transition-colors text-sm"
                  >
                    Clear & Resolve
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
