'use client';

import { useDashboardStore } from '@/lib/store';
import { AlertCircle, CheckCircle2, Server, Zap } from 'lucide-react';

export function MetricCards() {
  const metrics = useDashboardStore((state) => state.metrics);

  const cards = [
    {
      label: 'Active Incidents',
      value: metrics.activeIncidents,
      icon: AlertCircle,
      color: 'from-red-50 to-orange-50 dark:from-red-500/10 dark:to-red-500/5',
      borderColor: 'border-red-300 dark:border-red-500/20',
    },
    {
      label: 'Resolved Today',
      value: metrics.resolvedToday,
      icon: CheckCircle2,
      color: 'from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-emerald-500/5',
      borderColor: 'border-emerald-300 dark:border-emerald-500/20',
    },
    {
      label: 'Total Services',
      value: metrics.totalServices,
      icon: Server,
      color: 'from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-blue-500/5',
      borderColor: 'border-blue-300 dark:border-blue-500/20',
    },
    {
      label: 'AI Actions',
      value: metrics.aiActionsExecuted,
      icon: Zap,
      color: 'from-purple-50 to-indigo-50 dark:from-purple-500/10 dark:to-purple-500/5',
      borderColor: 'border-purple-300 dark:border-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`glass card-glow bg-gradient-to-br ${card.color} border ${card.borderColor} p-6 rounded-2xl`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-muted-foreground mb-2">
                  {card.label}
                </p>
                <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </h3>
              </div>
              <Icon className="w-8 h-8 text-gray-700 dark:text-muted-foreground opacity-75" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
