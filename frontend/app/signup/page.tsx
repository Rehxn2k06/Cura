"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertCircle, Loader2, Check, Eye, EyeOff } from 'lucide-react';
import { useAuthStore, initializeAuth } from '@/lib/auth-store';
import { PricingCards } from '@/components/pricing-cards';
import { PasswordStrengthIndicator } from '@/components/password-strength-indicator';

type SignupStep = 'plan' | 'details';
type SelectedPlan = 'free' | 'pro' | 'enterprise' | null;

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('details');
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>('free');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signup, isLoading, error, isAuthenticated, clearError } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handlePlanSelect = (plan: SelectedPlan) => {
    setSelectedPlan(plan);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (password !== confirmPassword) {
      useAuthStore.setState({ error: 'Passwords do not match' });
      return;
    }

    if (password.length < 6) {
      useAuthStore.setState({ error: 'Password must be at least 6 characters' });
      return;
    }

    if (!selectedPlan) {
      useAuthStore.setState({ error: 'Please select a plan' });
      return;
    }

    try {
      // ✅ FIXED HERE (NO EXTRA PARAMS)
      await signup(email, password);

      alert("Account created successfully!");
      router.push("/login");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* EVERYTHING BELOW IS SAME UI — NO CHANGE */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pt-8 pb-12"
        >
          <div className="max-w-4xl mx-auto px-4">
            <Link href="/login" className="text-gray-700 dark:text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-8 inline-block text-sm font-bold">
              ← Back to Login
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
              Create your Null Pointer account
            </h1>
            <p className="text-gray-700 dark:text-muted-foreground font-medium">
              Choose your plan and get started
            </p>
          </div>
        </motion.div>

        {step === 'plan' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-7xl mx-auto px-4">
              <PricingCards />

              {/* Plan Selection Notice */}
              {selectedPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-2xl mx-auto text-center mb-8 relative z-10"
                >
                  <div className="glass glow-purple border border-purple-500/50 p-6 rounded-2xl dark:backdrop-blur-xl">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', delay: 0.3 }}
                      >
                        <Check className="w-5 h-5 text-emerald-400" />
                      </motion.div>
                      <p className="text-gray-900 dark:text-white font-bold">
                        <span className="font-bold capitalize bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">{selectedPlan}</span> plan selected
                      </p>
                    </div>
                    <motion.button
                      onClick={() => setStep('details')}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Continue to Sign Up
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Plan Selection Instruction */}
              {!selectedPlan && (
                <div className="text-center mt-8 text-gray-700 dark:text-muted-foreground font-medium">
                  <p>Select a plan above to continue</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto px-4 relative z-10"
          >
            <div className="glass glow-blue border border-gray-200 dark:border-white/10 p-8 rounded-2xl mb-8 dark:backdrop-blur-xl">
              {/* Plan Badge */}
              <div className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-500/20 border border-purple-300 dark:border-purple-500/30 rounded-lg mb-6">
                <p className="text-sm font-bold text-purple-700 dark:text-purple-400 capitalize">
                  {selectedPlan} Plan
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-muted-foreground focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-blue-500 dark:focus:border-blue-500/50 transition-all"
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-muted-foreground focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-blue-500 dark:focus:border-blue-500/50 transition-all"
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-muted-foreground focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-purple-500 dark:focus:border-purple-500/50 transition-all pr-10"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 dark:text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={password} />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-muted-foreground focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-purple-500 dark:focus:border-purple-500/50 transition-all"
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </motion.button>

                {/* Back to Plan Selection */}
                <motion.button
                  type="button"
                  onClick={() => setStep('plan')}
                  disabled={isLoading}
                  className="w-full py-2 text-gray-700 dark:text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium"
                  whileHover={{ x: -4 }}
                >
                  ← Back to Plan Selection
                </motion.button>
              </form>

              {/* Sign In Link */}
              <div className="mt-6 text-center">
                <p className="text-gray-700 dark:text-muted-foreground text-sm font-medium">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-gray-700 dark:text-muted-foreground font-medium">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
