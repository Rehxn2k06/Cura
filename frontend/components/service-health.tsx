'use client';

import { useDashboardStore } from '@/lib/store';
import { Circle, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export function ServiceHealth() {
  const services = useDashboardStore((state) => state.services);
  const isConnected = useDashboardStore((state) => state.isConnected);

  const statusColors = {
    online:  { dot: 'bg-emerald-500', text: 'text-emerald-500', label: 'Online' },
    warning: { dot: 'bg-amber-500',   text: 'text-amber-500',   label: 'Warning' },
    offline: { dot: 'bg-red-500',     text: 'text-red-500',     label: 'Offline' },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Service Health</h2>
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-gray-600 dark:text-muted-foreground">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service, i) => {
          const status = statusColors[service.status];
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass card-glow border p-5 rounded-2xl hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300 ${
                service.isAnomaly
                  ? 'border-amber-400/50 dark:border-amber-500/50 bg-amber-50/30 dark:bg-amber-500/5'
                  : 'border-gray-200 dark:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`relative w-3 h-3 rounded-full ${status.dot}`}>
                    {service.status === 'online' && (
                      <div className="absolute inset-0 rounded-full bg-current opacity-75 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {service.name}
                    </h3>
                    <p className={`text-xs font-medium ${status.text}`}>{status.label}</p>
                  </div>
                </div>
                {service.isAnomaly && (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
              </div>

              <div className="space-y-2 text-xs">
                {/* CPU */}
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-muted-foreground font-medium">CPU Usage</span>
                  <span className="text-gray-900 dark:text-white font-bold">{service.cpuUsage}%</span>
                </div>
                <div className="w-full bg-gray-300 dark:bg-muted rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      service.cpuUsage > 70 ? 'bg-red-500' : service.cpuUsage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(service.cpuUsage, 100)}%` }}
                  />
                </div>

                {/* Latency */}
                <div className="flex justify-between pt-1">
                  <span className="text-gray-700 dark:text-muted-foreground font-medium">Latency</span>
                  <span className={`font-bold ${service.latency > 200 ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>
                    {service.latency}ms
                  </span>
                </div>

                {/* Error Rate */}
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-muted-foreground font-medium">Error Rate</span>
                  <span className={`font-bold ${service.errorRate > 10 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    {service.errorRate}%
                  </span>
                </div>

                {/* Anomaly Score (shown only when anomalous) */}
                {service.isAnomaly && (
                  <div className="pt-1 border-t border-amber-400/30 dark:border-amber-500/20">
                    <div className="flex justify-between">
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">Anomaly Score</span>
                      <span className="text-amber-700 dark:text-amber-300 font-bold">{service.anomalyScore.toFixed(3)}</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-600 dark:text-muted-foreground">
                      <span>IF: {service.ifScore.toFixed(3)}</span>
                      <span>LSTM: {service.lstmScore.toFixed(3)}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
