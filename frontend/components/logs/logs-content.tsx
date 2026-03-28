'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: string;
  message: string;
}

const LOG_TEMPLATES = [
  { level: 'INFO' as const, service: 'API Gateway', messages: ['Request received from client', 'Response sent successfully', 'Database query completed in 45ms', 'Cache hit ratio: 92%'] },
  { level: 'INFO' as const, service: 'Auth Service', messages: ['User authenticated successfully', 'Token generated', 'Session created'] },
  { level: 'WARN' as const, service: 'Database', messages: ['Connection pool utilization: 78%', 'Query execution time exceeds threshold', 'Slow query detected'] },
  { level: 'WARN' as const, service: 'API Gateway', messages: ['High latency detected', 'Response time: 1200ms', 'Rate limit warning'] },
  { level: 'ERROR' as const, service: 'Payment Service', messages: ['Transaction failed: timeout', 'External API unavailable', 'Payment validation error'] },
  { level: 'ERROR' as const, service: 'User Service', messages: ['Database connection lost', 'Memory threshold exceeded', 'Service restart initiated'] },
  { level: 'DEBUG' as const, service: 'Internal', messages: ['Cache invalidated', 'Background job completed', 'Scheduled task executed'] },
];

const generateRandomLog = (): LogEntry => {
  const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
  const message = template.messages[Math.floor(Math.random() * template.messages.length)];

  return {
    id: `${Date.now()}-${Math.random()}`,
    timestamp: new Date(),
    level: template.level,
    service: template.service,
    message,
  };
};

const getLevelColor = (level: string) => {
  switch (level) {
    case 'ERROR':
      return 'text-red-400';
    case 'WARN':
      return 'text-yellow-400';
    case 'DEBUG':
      return 'text-blue-400';
    default:
      return 'text-green-400';
  }
};

export function LogsContent() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Initialize with some logs
  useEffect(() => {
    const initialLogs = Array.from({ length: 10 }, generateRandomLog);
    setLogs(initialLogs);
  }, []);

  // Auto-add logs
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setLogs((prev) => {
        const newLogs = [...prev, generateRandomLog()];
        // Keep only last 100 logs
        return newLogs.slice(-100);
      });
    }, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Auto-scroll
  useEffect(() => {
    if (isRunning && scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [logs, isRunning]);

  const handleClear = () => {
    setLogs([]);
    toast.success('Logs cleared');
  };

  const filtered = logs.filter((log) =>
    log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="glass card-glow border border-gray-300 dark:border-white/10 p-4 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          {/* Search */}
          <div className="flex-1 relative w-full md:w-auto">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-600 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-black/40 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-green-400 placeholder-gray-600 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 font-mono text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 dark:bg-green-500 hover:bg-blue-700 dark:hover:bg-green-600 text-white font-semibold transition-colors text-sm"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Pause' : 'Resume'}
            </button>

            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white font-semibold transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-3">
          {isRunning ? '● Live streaming' : '● Paused'} · {filtered.length} logs shown
        </div>
      </div>

      {/* Terminal */}
      <div
        ref={scrollRef}
        className="h-96 overflow-y-auto bg-black rounded-2xl border border-gray-800 p-4 space-y-1 font-mono text-sm"
      >
        {filtered.length === 0 ? (
          <div className="text-gray-600 py-8 text-center">No logs to display</div>
        ) : (
          filtered.map((log, idx) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gray-400 hover:bg-white/5 px-2 py-1 rounded transition-colors"
            >
              <span className="text-gray-600">[{log.timestamp.toLocaleTimeString()}]</span>
              {' '}
              <span className={`font-semibold ${getLevelColor(log.level)}`}>[{log.level}]</span>
              {' '}
              <span className="text-cyan-400">[{log.service}]</span>
              {' '}
              <span className="text-green-400">{log.message}</span>
            </motion.div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="glass card-glow border border-gray-300 dark:border-white/10 p-4 rounded-2xl">
        <p className="text-sm text-gray-700 dark:text-white/70">
          <span className="font-semibold">Total logs:</span> {logs.length} | 
          <span className="font-semibold ml-2">Displayed:</span> {filtered.length}
        </p>
      </div>
    </div>
  );
}
