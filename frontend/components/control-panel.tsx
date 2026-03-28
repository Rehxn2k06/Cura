'use client';

/**
 * control-panel.tsx
 * Combined dashboard control panel:
 *   - Inject Failure section (service selector + inject/clear buttons)
 *   - Live RCA result + confidence
 *   - Execute Decision button (calls POST /execute)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, ShieldAlert, Activity, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Play, X, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useDashboardStore, serviceLabel, SERVICE_IDS } from '@/lib/store';

// ─── Service selector checkbox list ──────────────────────────────────────────

const SERVICE_OPTIONS: { id: string; label: string; shortLabel: string }[] = [
  { id: 'database-service',  label: 'Database Service',  shortLabel: 'DB'       },
  { id: 'payment-service',   label: 'Payment Service',   shortLabel: 'Payment'  },
  { id: 'order-service',     label: 'Order Service',     shortLabel: 'Order'    },
  { id: 'cart-service',      label: 'Cart Service',      shortLabel: 'Cart'     },
  { id: 'catalogue-service', label: 'Catalogue Service', shortLabel: 'Catalogue'},
  { id: 'frontend-service',  label: 'Frontend Service',  shortLabel: 'Frontend' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ControlPanel() {
  const { pipelineStatus, rca, agentState } = useDashboardStore();
  const executeDecision = useDashboardStore((s) => s.executeDecision);

  const [selectedServices, setSelectedServices] = useState<string[]>(['database-service']);
  const [duration, setDuration]                 = useState(60);
  const [injecting, setInjecting]               = useState(false);
  const [executing, setExecuting]               = useState(false);
  const [clearing, setClearing]                 = useState(false);
  const [showAdvanced, setShowAdvanced]         = useState(false);
  const [clearingAudit, setClearingAudit]       = useState(false);

  const toggleService = (id: string) =>
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  // ── Inject Failure ────────────────────────────────────────────────────────
  const handleInject = async () => {
    if (!selectedServices.length) {
      toast.error('Select at least one service');
      return;
    }
    setInjecting(true);
    const res = await api.simulate(selectedServices, duration);
    setInjecting(false);
    if (res) {
      toast.success(
        `⚡ Failure injected into ${selectedServices.length} service(s) for ${duration}s`,
        { duration: 4000 }
      );
    } else {
      toast.error('Backend unreachable — is the FastAPI server running?');
    }
  };

  const handleInjectAll = async () => {
    setInjecting(true);
    const res = await api.simulate(SERVICE_IDS, duration);
    setInjecting(false);
    if (res) toast.success('⚡ Full cascade failure injected across all 6 services');
    else toast.error('Backend unreachable');
  };

  const handleClearFailure = async () => {
    setClearing(true);
    const res = await api.clearFailure();
    setClearing(false);
    if (res) toast.success('✅ Failure cleared — system recovering');
    else toast.error('Backend unreachable');
  };

  // ── Execute Decision ──────────────────────────────────────────────────────
  const handleExecute = async () => {
    setExecuting(true);
    try {
      const res = await executeDecision();
      if (res?.status === 'executed') {
        toast.success('🤖 Decision executed — audit log updated', { duration: 4000 });
      } else {
        toast.error('No actionable decision available yet — wait for anomaly detection');
      }
    } catch {
      toast.error('Execution failed');
    } finally {
      setExecuting(false);
    }
  };

  // ── Clear Audit ───────────────────────────────────────────────────────────
  const handleClearAudit = async () => {
    setClearingAudit(true);
    const res = await api.clearAudit();
    setClearingAudit(false);
    if (res) toast.success('Audit log cleared — "Resolved Today" reset to 0');
    else toast.error('Backend unreachable');
  };

  const confidencePct = Math.round((rca.confidence ?? 0) * 100);
  const hasRootCause  = !!rca.rootCause;
  const failureActive = pipelineStatus.failureActive;

  return (
    <div className="space-y-4">

      {/* ── Active Failure Banner ─────────────────────────────────────────── */}
      <AnimatePresence>
        {failureActive && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between gap-4 px-5 py-3 rounded-2xl
                       border border-orange-400/60 bg-orange-500/10 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-orange-400 animate-pulse shrink-0" />
              <span className="text-sm font-semibold text-orange-300">
                ⚠️ Active failure simulation —{' '}
                <span className="text-orange-200">
                  {pipelineStatus.failureServices.map((s) => serviceLabel(s)).join(', ')}
                </span>
              </span>
            </div>
            <button
              onClick={handleClearFailure}
              disabled={clearing}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold
                         bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50
                         text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {clearing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Inject Failure Panel ─────────────────────────────────────────── */}
        <div className="glass card-glow border border-gray-200 dark:border-white/10
                        p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Inject Failure</h3>
              <p className="text-xs text-gray-500 dark:text-white/40">Simulate service degradation</p>
            </div>
          </div>

          {/* Service selector grid */}
          <div className="grid grid-cols-2 gap-2">
            {SERVICE_OPTIONS.map((svc) => {
              const checked = selectedServices.includes(svc.id);
              return (
                <button
                  key={svc.id}
                  onClick={() => toggleService(svc.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold
                              border transition-all duration-200 text-left
                              ${checked
                                ? 'border-red-500/60 bg-red-500/15 text-red-300'
                                : 'border-gray-300 dark:border-white/10 text-gray-600 dark:text-white/50 hover:border-gray-400 dark:hover:border-white/20'
                              }`}
                >
                  <div className={`w-3 h-3 rounded border-2 flex items-center justify-center shrink-0
                                   ${checked ? 'border-red-400 bg-red-400' : 'border-gray-400 dark:border-white/30'}`}>
                    {checked && <CheckCircle2 className="w-2 h-2 text-white" />}
                  </div>
                  {svc.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Advanced: duration */}
          <div>
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-white/40
                         hover:text-gray-700 dark:hover:text-white/60 transition-colors"
            >
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Advanced options
            </button>
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 flex items-center gap-3">
                    <label className="text-xs text-gray-600 dark:text-white/50 shrink-0">
                      Duration (s)
                    </label>
                    <input
                      type="range"
                      min={15}
                      max={300}
                      step={15}
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs font-bold text-gray-900 dark:text-white w-8 text-right">
                      {duration}s
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              id="inject-failure-btn"
              onClick={handleInject}
              disabled={injecting || !selectedServices.length}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                         bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed
                         text-white text-xs font-bold transition-all duration-200"
            >
              {injecting
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <Zap className="w-3.5 h-3.5" />}
              {injecting ? 'Injecting…' : `Inject (${selectedServices.length})`}
            </button>
            <button
              id="inject-all-btn"
              onClick={handleInjectAll}
              disabled={injecting}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl
                         border border-red-500/50 text-red-400 hover:bg-red-500/10
                         disabled:opacity-50 text-xs font-bold transition-all duration-200"
            >
              All
            </button>
            <button
              id="clear-failure-btn"
              onClick={handleClearFailure}
              disabled={clearing || !failureActive}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl
                         border border-gray-300 dark:border-white/10 text-gray-500 dark:text-white/50
                         hover:border-gray-400 dark:hover:border-white/20 disabled:opacity-30
                         text-xs font-bold transition-all duration-200"
            >
              {clearing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              Clear
            </button>
          </div>
        </div>

        {/* ── RCA + Decision Panel ─────────────────────────────────────────── */}
        <div className="glass card-glow border border-gray-200 dark:border-white/10
                        p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">RCA + Decision Engine</h3>
              <p className="text-xs text-gray-500 dark:text-white/40">Live root-cause analysis</p>
            </div>
          </div>

          {/* Root cause */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                Root Cause
              </span>
              {hasRootCause && (
                <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  DETECTED
                </span>
              )}
            </div>
            <div className={`px-4 py-3 rounded-xl border text-sm font-semibold
              ${hasRootCause
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                : 'border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/30'
              }`}
            >
              {hasRootCause ? rca.rootCauseLabel : '— No anomaly detected —'}
            </div>
          </div>

          {/* Confidence bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-white/40 font-medium">Confidence</span>
              <span className={`text-xs font-bold ${confidencePct > 70 ? 'text-emerald-400' : confidencePct > 40 ? 'text-amber-400' : 'text-gray-400'}`}>
                {confidencePct}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  confidencePct > 70 ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                  : confidencePct > 40 ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                  : 'bg-gray-400'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${confidencePct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Explanation */}
          {rca.explanation && (
            <p className="text-xs text-gray-500 dark:text-white/40 leading-relaxed line-clamp-2">
              {rca.explanation}
            </p>
          )}

          {/* Anomalous services */}
          {rca.anomalousServices.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {rca.anomalousServices.map((s) => (
                <span key={s}
                  className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-medium">
                  {serviceLabel(s)}
                </span>
              ))}
            </div>
          )}

          {/* Execute button */}
          <button
            id="execute-decision-btn"
            onClick={handleExecute}
            disabled={executing || !hasRootCause}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                        text-sm font-bold transition-all duration-200
                        ${hasRootCause
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/20'
                          : 'bg-gray-200 dark:bg-white/5 text-gray-400 dark:text-white/20 cursor-not-allowed'
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {executing
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Play className="w-4 h-4" />}
            {executing ? 'Executing…' : hasRootCause ? `Execute: ${agentState.lastAction !== 'Awaiting live data…' ? agentState.lastAction : 'Remediation'}` : 'Awaiting anomaly…'}
          </button>

          {/* Clear audit log util */}
          <button
            id="clear-audit-btn"
            onClick={handleClearAudit}
            disabled={clearingAudit}
            className="w-full text-xs text-gray-400 dark:text-white/30 hover:text-gray-600
                       dark:hover:text-white/50 py-1 transition-colors disabled:opacity-50"
          >
            {clearingAudit ? 'Clearing…' : 'Reset audit log (clears "Resolved Today")'}
          </button>
        </div>
      </div>
    </div>
  );
}
