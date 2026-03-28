'use client';

import { useDashboardStore } from '@/lib/store';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function DashboardCharts() {
  const cpuData = useDashboardStore((state) => state.cpuData);
  const latencyData = useDashboardStore((state) => state.latencyData);
  const errorRateData = useDashboardStore((state) => state.errorRateData);

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg p-3 border border-gray-300 dark:border-white/10">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-semibold">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* CPU Usage Chart */}
      <div className="glass card-glow border border-gray-200 dark:border-white/10 p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-foreground mb-4">CPU Usage by Service</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cpuData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(209, 213, 219) / 0.5" opacity={0.5} />
            <XAxis dataKey="name" stroke="rgb(107, 114, 128)" style={{ fontSize: '12px' }} />
            <YAxis stroke="rgb(107, 114, 128)" style={{ fontSize: '12px' }} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="cpu" fill="#2563eb" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Request Latency Chart */}
      <div className="glass card-glow border border-gray-200 dark:border-white/10 p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-foreground mb-4">Request Latency (ms)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={latencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(209, 213, 219)" opacity={0.5} />
            <XAxis dataKey="name" stroke="rgb(107, 114, 128)" style={{ fontSize: '12px' }} />
            <YAxis stroke="rgb(107, 114, 128)" style={{ fontSize: '12px' }} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="Frontend" stroke="#2563eb" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Catalogue" stroke="#7c3aed" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Cart" stroke="#db2777" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Order" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Payment" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Database" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Error Rate Chart */}
      <div className="glass card-glow border border-gray-200 dark:border-white/10 p-6 rounded-2xl lg:col-span-2">
        <h3 className="text-lg font-semibold text-foreground mb-4">Error Rate Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={errorRateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(209, 213, 219)" opacity={0.5} />
            <XAxis dataKey="name" stroke="rgb(107, 114, 128)" style={{ fontSize: '12px' }} />
            <YAxis stroke="rgb(107, 114, 128)" style={{ fontSize: '12px' }} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="errors" fill="#dc2626" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
