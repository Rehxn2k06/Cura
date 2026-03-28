'use client';

import { motion } from 'framer-motion';
import { useDashboardStore } from '@/lib/store';
import { Activity, WifiOff } from 'lucide-react';

export function StatusPanel() {
  const { agentState, rca, pipelineStatus, isConnected } = useDashboardStore();

  const riskColors = {
    low:    { bg: 'from-emerald-50 to-green-50 dark:from-emerald-500/20 dark:to-emerald-500/5', border: 'border-emerald-300 dark:border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300' },
    medium: { bg: 'from-amber-50 to-orange-50 dark:from-amber-500/20 dark:to-amber-500/5',     border: 'border-amber-300 dark:border-amber-500/30',   text: 'text-amber-700 dark:text-amber-300' },
    high:   { bg: 'from-red-50 to-orange-50 dark:from-red-500/20 dark:to-red-500/5',           border: 'border-red-300 dark:border-red-500/30',         text: 'text-red-700 dark:text-red-300' },
  };

  const modeColors = {
    yolo:     'text-red-700 dark:text-red-400',
    plan:     'text-blue-700 dark:text-blue-400',
    approval: 'text-emerald-700 dark:text-emerald-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass glow-purple p-8 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-foreground">Live Status</h3>
        </div>
        {/* Connection indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          {isConnected ? (
            <><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-emerald-600 dark:text-emerald-400 font-medium">Connected</span></>
          ) : (
            <><WifiOff className="w-3.5 h-3.5 text-red-500" /><span className="text-red-500">Offline</span></>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {/* Pipeline & Mode */}
        <div className="rounded-lg bg-gray-100 dark:bg-white/5 p-4 border border-gray-300 dark:border-white/5">
          <p className="text-xs text-gray-700 dark:text-muted-foreground uppercase tracking-widest font-semibold mb-2">
            Pipeline
          </p>
          <div className="flex items-center justify-between">
            <motion.p
              className={`text-lg font-bold capitalize ${modeColors[agentState.mode as keyof typeof modeColors]}`}
              key={agentState.mode}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {agentState.mode} Mode
            </motion.p>
            <span className="text-xs text-gray-600 dark:text-muted-foreground">
              Cycle #{pipelineStatus.cycleCount}
            </span>
          </div>
          {pipelineStatus.failureActive && (
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1">
              ⚠️ Failure Active: {pipelineStatus.failureServices.join(', ')}
            </p>
          )}
        </div>

        {/* RCA Root Cause */}
        {rca.rootCauseLabel && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 p-4 border border-amber-300 dark:border-amber-500/30">
            <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-widest font-semibold mb-1">Root Cause</p>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">{rca.rootCauseLabel}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-amber-200 dark:bg-amber-900/40 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(rca.confidence * 100).toFixed(0)}%` }} />
              </div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                {(rca.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-2 leading-relaxed line-clamp-2">
              {rca.explanation}
            </p>
          </div>
        )}

        {/* Confidence Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-700 dark:text-muted-foreground uppercase tracking-widest font-semibold">
              Confidence Threshold
            </p>
            <motion.span
              className="text-sm font-bold gradient-text"
              key={agentState.confidence}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              {agentState.confidence}%
            </motion.span>
          </div>
          <div className="relative h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden border border-gray-300 dark:border-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-400 shadow-lg shadow-blue-500/50"
              initial={{ width: 0 }}
              animate={{ width: `${agentState.confidence}%` }}
              transition={{ duration: 0.8, type: 'spring' }}
            />
          </div>
        </div>

        {/* Last Action */}
        <div className="rounded-lg bg-gray-100 dark:bg-white/5 p-4 border border-gray-300 dark:border-white/5">
          <p className="text-xs text-gray-700 dark:text-muted-foreground uppercase tracking-widest font-semibold mb-2">
            Last Action
          </p>
          <p className="text-sm text-foreground font-medium">{agentState.lastAction}</p>
          {agentState.actionTime && (
            <p className="text-xs text-muted-foreground mt-2">{agentState.actionTime}</p>
          )}
        </div>

        {/* Active Settings */}
        <div>
          <p className="text-xs text-gray-700 dark:text-muted-foreground uppercase tracking-widest font-semibold mb-3">
            Active Configuration
          </p>
          <div className="flex flex-wrap gap-2">
            {agentState.autoRemediation && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-gradient-to-r dark:from-emerald-500/30 dark:to-emerald-500/10 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
              >
                Auto-Fix
              </motion.span>
            )}
            {agentState.dryRun && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-gradient-to-r dark:from-blue-500/30 dark:to-blue-500/10 border border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300"
              >
                Dry-Run
              </motion.span>
            )}
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${riskColors[agentState.riskLevel].bg} border ${riskColors[agentState.riskLevel].border} ${riskColors[agentState.riskLevel].text}`}
            >
              {agentState.riskLevel} Risk
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
