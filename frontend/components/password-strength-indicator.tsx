'use client';

import { motion } from 'framer-motion';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const calculateStrength = (pass: string): { strength: number; level: string; color: string } => {
    let strength = 0;
    
    if (pass.length >= 8) strength++;
    if (pass.length >= 12) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;

    if (strength < 2) return { strength: 1, level: 'Weak', color: 'from-red-500 to-red-400' };
    if (strength < 3) return { strength: 2, level: 'Fair', color: 'from-yellow-500 to-yellow-400' };
    if (strength < 4) return { strength: 3, level: 'Good', color: 'from-blue-500 to-blue-400' };
    return { strength: 4, level: 'Strong', color: 'from-emerald-500 to-emerald-400' };
  };

  if (!password) return null;

  const { strength, level, color } = calculateStrength(password);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Password Strength</p>
        <motion.span
          key={level}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-xs font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}
        >
          {level}
        </motion.span>
      </div>

      {/* Strength Bar */}
      <div className="relative h-2 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden border border-gray-300 dark:border-white/10">
        <motion.div
          className={`h-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${(strength / 4) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Requirements */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <Requirement met={password.length >= 8} text="8+ characters" />
        <Requirement met={/[A-Z]/.test(password)} text="Uppercase" />
        <Requirement met={/[0-9]/.test(password)} text="Number" />
        <Requirement met={/[^a-zA-Z0-9]/.test(password)} text="Special char" />
      </div>
    </motion.div>
  );
}

function Requirement({ met, text }: { met: boolean; text: string }) {
  return (
    <motion.div
      className={`flex items-center gap-2 text-xs px-2 py-1 rounded-lg transition-colors ${
        met ? 'bg-emerald-500/10 text-emerald-300' : 'bg-gray-100 dark:bg-white/5 text-muted-foreground'
      }`}
      animate={met ? { scale: 1.05 } : { scale: 1 }}
    >
      <div className={`w-3 h-3 rounded-full ${met ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'} flex-shrink-0`} />
      <span>{text}</span>
    </motion.div>
  );
}
