'use client';

import { TopNav } from '@/components/sidebar';
import { PageHeader } from '@/components/navbar';
import { IncidentsContent } from '@/components/incidents/incidents-content';

export default function IncidentsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#05070D] relative z-10">
      <TopNav />
      <div className="pt-16 relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
          <div>
            <PageHeader title="Incidents" />
            <p className="text-gray-600 dark:text-white/70 text-sm mt-2">
              Track and manage all active and resolved incidents
            </p>
          </div>

          <IncidentsContent />
        </div>
      </div>
    </main>
  );
}
