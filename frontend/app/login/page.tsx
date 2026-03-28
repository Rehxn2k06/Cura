"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore, initializeAuth } from '@/lib/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@nullpointer.com');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const { login, isLoading, error, isAuthenticated, clearError } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login(email, password);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background */}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
        variants={containerVariants}
      >

        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Null Pointer
          </h1>
          <p className="text-gray-800 dark:text-muted-foreground text-sm font-semibold">
            AI Observability Platform
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          variants={itemVariants}
          className="glass border border-gray-300 dark:border-white/10 p-8 rounded-2xl dark:backdrop-blur-xl"
        >

          {/* Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back
            </h2>
            <p className="text-sm text-gray-800 dark:text-muted-foreground font-medium">
              Sign in to your account
            </p>
          </div>

          {/* Demo box */}
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-500/30 rounded-xl"
          >
            <p className="text-xs text-blue-900 dark:text-blue-200 font-bold">
              Demo credentials:
            </p>
            <p className="text-xs text-blue-800 dark:text-white mt-1 font-semibold">
              demo@nullpointer.com / demo123
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <motion.div variants={itemVariants}>
              <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-2">
                Email
              </label>
              <motion.input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-muted-foreground focus:outline-none focus:border-blue-500 transition-all duration-300"
                disabled={isLoading}
                animate={emailFocus ? { boxShadow: '0 0 20px rgba(59,130,246,0.3)' } : {}}
                required
              />
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants}>
              <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-2">
                Password
              </label>
              <div className="relative">
                <motion.input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocus(true)}
                  onBlur={() => setPasswordFocus(false)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-muted-foreground focus:outline-none focus:border-purple-500 transition-all duration-300 pr-10"
                  disabled={isLoading}
                  animate={passwordFocus ? { boxShadow: '0 0 20px rgba(168,85,247,0.3)' } : {}}
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
            </motion.div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-3 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300 font-semibold">{error}</p>
              </motion.div>
            )}

            {/* Button */}
            <motion.button
              variants={itemVariants}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Signup */}
          <motion.div variants={itemVariants} className="mt-6 text-center">
            <p className="text-gray-800 dark:text-muted-foreground text-sm font-medium">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
                Create one
              </Link>
            </p>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.p variants={itemVariants} className="text-center text-xs text-gray-800 dark:text-muted-foreground mt-8 font-medium">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  );
}