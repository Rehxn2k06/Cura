'use client';

import { motion } from 'framer-motion';
import { useDashboardStore } from '@/lib/store';
import { Zap, TestTube } from 'lucide-react';

export function SettingsToggles() {
  const {
    agentState,
    updateAutoRemediation,
    updateDryRun,
  } = useDashboardStore();

  const toggles = [
    {
      key: 'autoRemediation',
      label: 'Auto-Remediation',
      description: 'Automatically apply fixes without waiting',
      value: agentState.autoRemediation,
      onChange: updateAutoRemediation,
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      key: 'dryRun',
      label: 'Dry-Run Mode',
      description: 'Test actions without applying changes',
      value: agentState.dryRun,
      onChange: updateDryRun,
      icon: TestTube,
      color: 'from-purple-500 to-blue-500',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.35,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      className="glass glow-purple p-8 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h3 className="font-semibold text-foreground">Advanced Settings</h3>

      <div className="space-y-4">
        {toggles.map((toggle) => {
          const Icon = toggle.icon;

          return (
            <motion.div
              key={toggle.key}
              variants={itemVariants}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/8 transition-colors border border-gray-300 dark:border-white/5"
            >
              <div className="flex items-start gap-3 flex-1">
                <motion.div
                  className={`p-2 rounded-lg bg-gradient-to-br ${toggle.color} opacity-20 dark:opacity-30`}
                >
                  <Icon className="w-4 h-4 text-gray-700 dark:text-foreground" />
                </motion.div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-foreground text-sm">{toggle.label}</p>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground mt-0.5">{toggle.description}</p>
                </div>
              </div>

              <motion.button
                onClick={() => toggle.onChange(!toggle.value)}
                className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-all ${
                  toggle.value
                    ? 'bg-gradient-to-r from-blue-500/80 to-blue-400/80 shadow-lg shadow-blue-500/30'
                    : 'bg-gray-200 dark:bg-white/10'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-white rounded-full shadow-md"
                  animate={{
                    x: toggle.value ? 18 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
