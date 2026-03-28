'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TopNav } from '@/components/sidebar';
import { PageHeader } from '@/components/navbar';
import { MetricCards } from '@/components/metric-cards';
import { DashboardCharts } from '@/components/charts';
import { ServiceHealth } from '@/components/service-health';
import { ControlPanel } from '@/components/control-panel';
import { useAuthStore } from '@/lib/auth-store';
import { startPolling, stopPolling } from '@/lib/store';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Start live data polling when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      startPolling();
      return () => stopPolling();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#05070D] flex items-center justify-center relative z-10">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 dark:text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-white/70">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#05070D] relative z-10">
      <TopNav />
      <div className="pt-16 relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PageHeader title="Dashboard" />
            <p className="text-gray-600 dark:text-white/70 text-sm mt-2">
              Real-time monitoring and AI-powered incident management
            </p>
          </motion.div>

          {/* Metric Cards */}
          <MetricCards />

          {/* Charts */}
          <DashboardCharts />

          {/* Control Panel: Inject Failure + RCA Decision */}
          <ControlPanel />

          {/* Service Health */}
          <ServiceHealth />
        </div>
      </div>
    </main>
  );
}
