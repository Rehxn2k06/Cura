'use client';

import { motion } from 'framer-motion';
import { ModeSelection } from '@/components/agents/mode-selection';
import { ControlsSection } from '@/components/agents/controls-section';
import { SettingsToggles } from '@/components/agents/settings-toggles';
import { StatusPanel } from '@/components/agents/status-panel';
import { EmergencyStop } from '@/components/agents/emergency-stop';
import { InfoPanel } from '@/components/agents/info-panel';

export function AgentControlPanel() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <motion.div
      className="space-y-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Section 1: Mode Selection - Premium Floating Cards */}
      <motion.div variants={sectionVariants}>
        <ModeSelection />
      </motion.div>

      {/* Section 2: Controls - Dual Panel Layout */}
      <motion.div variants={sectionVariants}>
        <ControlsSection />
      </motion.div>

      {/* Section 3: Settings & Status - Balanced Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        variants={sectionVariants}
      >
        <div className="lg:col-span-2">
          <SettingsToggles />
        </div>
        <div>
          <StatusPanel />
        </div>
      </motion.div>

      {/* Section 4: Emergency & Info - Full Width with Emergency Priority */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        variants={sectionVariants}
      >
        <div>
          <EmergencyStop />
        </div>
        <div className="lg:col-span-2">
          <InfoPanel />
        </div>
      </motion.div>
    </motion.div>
  );
}
