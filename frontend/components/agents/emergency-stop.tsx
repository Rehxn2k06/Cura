'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Power, Zap, XCircle } from 'lucide-react';
import { useDashboardStore, SERVICE_IDS, serviceLabel } from '@/lib/store';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function EmergencyStop() {
  const { emergencyStop, pipelineStatus, recordAction } = useDashboardStore();
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleEmergencyStop = async () => {
    setIsEmergencyActive(true);
    emergencyStop();
    // Clear any active failure simulation
    const res = await api.clearFailure();
    if (res) {
      recordAction('🛑 Emergency stop — simulation cleared');
      toast.success('Emergency stop activated — all simulations cleared');
    }
    setTimeout(() => setIsEmergencyActive(false), 2000);
  };

  const handleInjectFailure = async () => {
    setIsSimulating(true);
    const res = await api.simulate(SERVICE_IDS, 60);
    if (res) {
      recordAction(`💥 Failure injected across all services`);
      toast.warning('Failure scenario injected — watch anomaly scores rise!');
    } else {
      toast.error('Could not reach backend — is FastAPI running?');
    }
    setIsSimulating(false);
  };

  const handleClearFailure = async () => {
    const res = await api.clearFailure();
    if (res) {
      recordAction('✅ Failure simulation cleared');
      toast.success('Failure cleared — system returning to normal');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
      className="space-y-4"
    >
      {/* Emergency Stop */}
      <div className="relative overflow-hidden rounded-2xl p-8 glass neon-glow">
        <motion.div
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-red-500/30 to-transparent rounded-full blur-3xl"
          animate={{
            scale: isEmergencyActive ? [1, 1.3, 1] : 1,
            opacity: isEmergencyActive ? [0.5, 1, 0.5] : 0.3,
          }}
          transition={{ repeat: isEmergencyActive ? Infinity : 0, duration: 0.8 }}
        />

        <motion.button
          id="emergency-stop-btn"
          onClick={handleEmergencyStop}
          className="relative w-full group overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-red-500 border border-red-600 py-4 transition-all"
          whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-transparent"
            animate={{ opacity: isEmergencyActive ? [0.3, 0.8, 0.3] : [0.2, 0.4] }}
            transition={{ repeat: isEmergencyActive ? Infinity : 0, duration: 0.8 }}
          />
          <div className="relative z-10 flex flex-col items-center justify-center gap-2">
            <motion.div
              animate={isEmergencyActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: isEmergencyActive ? Infinity : 0, duration: 0.6 }}
            >
              <Power className="w-6 h-6 text-red-100" />
            </motion.div>
            <span className="text-sm font-bold text-red-100 tracking-wide">EMERGENCY STOP</span>
          </div>
        </motion.button>
      </div>

      {/* Simulate / Clear Failure */}
      <div className="glass p-6 rounded-2xl space-y-3 border border-gray-200 dark:border-white/10">
        <p className="text-xs text-gray-700 dark:text-muted-foreground uppercase tracking-widest font-semibold">
          Failure Simulation
        </p>

        {pipelineStatus.failureActive ? (
          <motion.button
            id="clear-failure-btn"
            onClick={handleClearFailure}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
            whileTap={{ scale: 0.97 }}
          >
            <XCircle className="w-4 h-4" />
            Clear Failure
          </motion.button>
        ) : (
          <motion.button
            id="inject-failure-btn"
            onClick={handleInjectFailure}
            disabled={isSimulating}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
            whileTap={{ scale: 0.97 }}
          >
            <Zap className="w-4 h-4" />
            {isSimulating ? 'Injecting…' : 'Inject Failure (60s)'}
          </motion.button>
        )}

        {pipelineStatus.failureActive && (
          <p className="text-xs text-orange-600 dark:text-orange-400 text-center font-medium animate-pulse">
            ⚠️ Failure active — {pipelineStatus.failureServices.length} services affected
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Emergency stop halts all automation and clears active simulations
      </p>
    </motion.div>
  );
}
