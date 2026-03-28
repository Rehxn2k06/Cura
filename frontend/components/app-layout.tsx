'use client';

import { motion } from 'framer-motion';
import { TopNav } from '@/components/sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#05070D] relative">
      <TopNav />
      
      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 pt-16"
      >
        <div className="max-w-6xl mx-auto px-6 py-10">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
