'use client';

import { motion } from 'framer-motion';
import { useDashboardStore } from '@/lib/store';
import { Zap, Brain, CheckCircle } from 'lucide-react';

export function ModeSelection() {
  const { agentState, updateAgentMode } = useDashboardStore();

  const modes = [
    {
      id: 'yolo',
      label: 'YOLO Mode',
      description: 'Auto-fix everything',
      icon: Zap,
    },
    {
      id: 'plan',
      label: 'Plan Mode',
      description: 'Suggest & plan',
      icon: Brain,
    },
    {
      id: 'approval',
      label: 'Approval Mode',
      description: 'Manual control',
      icon: CheckCircle,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:gradient-text">Operation Mode</h2>
        <p className="text-sm text-gray-600 dark:text-muted-foreground mt-2">Select how your AI agent handles incidents</p>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {modes.map((mode, idx) => {
          const Icon = mode.icon;
          const isSelected = agentState.mode === mode.id;

          return (
            <motion.button
              key={mode.id}
              variants={itemVariants}
              onClick={() => updateAgentMode(mode.id as any)}
              className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
                isSelected
                  ? 'glass glow-blue'
                  : 'glass glass-hover'
              }`}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Animated background gradient for selected state */}
              {isSelected && (
                <motion.div
                  layoutId="selectedMode"
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              <div className="relative z-10 space-y-3">
                <motion.div
                  animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Icon className={`w-6 h-6 ${
                    isSelected
                      ? 'text-blue-400'
                      : 'text-muted-foreground group-hover:text-blue-400'
                  } transition-colors`} />
                </motion.div>

                <div className="text-left">
                  <h3 className="font-semibold text-foreground text-sm">{mode.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full"
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
