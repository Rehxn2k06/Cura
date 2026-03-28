'use client';

import { TopNav } from '@/components/sidebar';
import { PageHeader } from '@/components/navbar';
import { IntegrationsContent } from '@/components/integrations/integrations-content';

export default function IntegrationsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#05070D] relative z-10">
      <TopNav />
      <div className="pt-16 relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
          <div>
            <PageHeader title="Integrations" />
            <p className="text-gray-600 dark:text-white/70 text-sm mt-2">
              Connect and manage third-party services
            </p>
          </div>

          <IntegrationsContent />
        </div>
      </div>
    </main>
  );
}
