import { TopNav } from '@/components/sidebar';
import { PageHeader } from '@/components/navbar';
import { AgentControlPanel } from '@/components/agent-control-panel';

export const metadata = {
  title: 'AI Agents - Null Pointer',
  description: 'AI Agent Control Panel',
};

export default function AgentsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#05070D] relative z-10">
      <TopNav />
      <div className="pt-16 relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
          <div className="mb-4">
            <PageHeader title="AI Agents Control Panel" />
            <p className="text-gray-600 dark:text-white/70 text-sm mt-2">
              Enterprise-grade real-time control and monitoring with multiple safety layers
            </p>
          </div>

          <AgentControlPanel />
        </div>
      </div>
    </main>
  );
}
