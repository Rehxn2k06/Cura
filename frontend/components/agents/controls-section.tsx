'use client';

import { motion } from 'framer-motion';
import { useDashboardStore } from '@/lib/store';
import { Gauge, AlertTriangle } from 'lucide-react';

export function ControlsSection() {
  const {
    agentState,
    updateConfidence,
    updateRiskLevel,
  } = useDashboardStore();

  const riskConfig = {
    low: { bg: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/30', text: 'text-emerald-400', hover: 'hover:border-emerald-500/50' },
    medium: { bg: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/30', text: 'text-amber-400', hover: 'hover:border-amber-500/50' },
    high: { bg: 'from-red-500/20 to-red-500/5', border: 'border-red-500/30', text: 'text-red-400', hover: 'hover:border-red-500/50' },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Confidence Threshold */}
      <motion.div
        variants={itemVariants}
        className="glass glow-purple p-8 space-y-6"
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">Confidence</h3>
            </div>
            <p className="text-xs text-gray-700 dark:text-muted-foreground">Minimum threshold for auto-actions</p>
          </div>
          <motion.span
            className="text-3xl font-bold gradient-text"
            key={agentState.confidence}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {agentState.confidence}%
          </motion.span>
        </div>

        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="100"
            value={agentState.confidence}
            onChange={(e) => updateConfidence(parseInt(e.target.value))}
            className="w-full h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg appearance-none cursor-pointer accent-blue-400"
          />
          <div className="flex justify-between text-xs text-gray-700 dark:text-muted-foreground font-medium">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <p className="text-xs text-gray-700 dark:text-muted-foreground leading-relaxed">
          Lower values allow more automated actions. Higher values require manual approval.
        </p>
      </motion.div>

      {/* Risk Level */}
      <motion.div
        variants={itemVariants}
        className="glass glow-purple p-8 space-y-6"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">Risk Level</h3>
          </div>
          <p className="text-xs text-gray-700 dark:text-muted-foreground">Controls automation aggressiveness</p>
        </div>

        <div className="flex flex-col gap-2">
          {(['low', 'medium', 'high'] as const).map((level) => {
            const config = riskConfig[level];
            const isSelected = agentState.riskLevel === level;

            return (
              <motion.button
                key={level}
                onClick={() => updateRiskLevel(level)}
                className={`relative overflow-hidden rounded-lg border px-4 py-2 capitalize font-bold text-sm transition-all ${
                  config.border
                } ${isSelected ? `bg-gradient-to-r ${config.bg} ${config.text} shadow-lg shadow-current/20` : `bg-gray-200 dark:bg-white/5 text-gray-800 dark:text-muted-foreground ${config.hover}`}`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative z-10">{level}</div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
