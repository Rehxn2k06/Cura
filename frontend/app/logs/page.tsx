'use client';

import { TopNav } from '@/components/sidebar';
import { PageHeader } from '@/components/navbar';
import { LogsContent } from '@/components/logs/logs-content';

export default function LogsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#05070D] relative z-10">
      <TopNav />
      <div className="pt-16 relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
          <div>
            <PageHeader title="Logs" />
            <p className="text-gray-600 dark:text-white/70 text-sm mt-2">
              Real-time system and application logs
            </p>
          </div>

          <LogsContent />
        </div>
      </div>
    </main>
  );
}
