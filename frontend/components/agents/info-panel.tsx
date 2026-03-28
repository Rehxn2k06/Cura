'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export function InfoPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass glow-blue p-8 flex gap-4 items-start border-l-2 border-l-blue-400/50"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
      </motion.div>

      <div className="flex-1 space-y-2">
        <p className="font-bold text-gray-900 dark:text-white">Enterprise-Grade Safety</p>
        <p className="text-sm text-gray-700 dark:text-muted-foreground leading-relaxed">
          All actions logged in real-time. Multiple safety layers protect your infrastructure. Audit trail preserved forever.
        </p>
      </div>
    </motion.div>
  );
}
