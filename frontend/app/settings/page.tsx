'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TopNav } from '@/components/sidebar';
import { PageHeader } from '@/components/navbar';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#05070D] relative z-10">
      <TopNav />
      <div className="pt-16 relative z-10">
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <PageHeader title="Settings" />
            <p className="text-gray-600 dark:text-white/70 text-sm mt-2">
              Configure your workspace preferences and integrations
            </p>
          </motion.div>

          {/* Settings Sections */}
          <div className="space-y-6">
            {/* Account Settings */}
            <motion.div variants={cardVariants} initial="hidden" whileInView="visible" className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg p-6 dark:backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Name</label>
                  <input type="text" defaultValue="Demo User" className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Email</label>
                  <input type="email" defaultValue="demo@nullpointer.com" className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500" />
                </div>
                <button className="px-4 py-2 bg-blue-600 dark:bg-green-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-green-700 transition-colors">Save Changes</button>
              </div>
            </motion.div>

            {/* AI Configuration */}
            <motion.div variants={cardVariants} initial="hidden" whileInView="visible" className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg p-6 dark:backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🧠 AI Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Model</label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500">
                    <option>GPT-4</option>
                    <option>GPT-3.5</option>
                    <option>Claude 3 Opus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">System Prompt</label>
                  <textarea rows={4} defaultValue="You are an AI assistant..." className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">Temperature: <span className="text-blue-600 dark:text-green-400">0.7</span></label>
                  <input type="range" min="0" max="2" step="0.1" defaultValue="0.7" className="w-full" />
                </div>
              </div>
            </motion.div>

            {/* Incident Settings */}
            <motion.div variants={cardVariants} initial="hidden" whileInView="visible" className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg p-6 dark:backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🚨 Incident Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">Confidence Threshold: <span className="text-blue-600 dark:text-green-400">75%</span></label>
                  <input type="range" min="0" max="100" step="1" defaultValue="75" className="w-full" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-gray-700 dark:text-white/80">Auto-detect Incidents</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Escalation Delay (minutes)</label>
                  <input type="number" defaultValue="5" className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500" />
                </div>
              </div>
            </motion.div>

            {/* Safety & Automation */}
            <motion.div variants={cardVariants} initial="hidden" whileInView="visible" className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg p-6 dark:backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔒 Safety & Automation</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-gray-700 dark:text-white/80">Enable Dry-Run Mode</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm text-gray-700 dark:text-white/80">Auto-Execute Actions</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">Safety Threshold: <span className="text-blue-600 dark:text-green-400">85%</span></label>
                  <input type="range" min="0" max="100" step="1" defaultValue="85" className="w-full" />
                </div>
              </div>
            </motion.div>

            {/* Execution Settings */}
            <motion.div variants={cardVariants} initial="hidden" whileInView="visible" className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg p-6 dark:backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔁 Execution Settings</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-gray-700 dark:text-white/80">Parallel Execution</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm text-gray-700 dark:text-white/80">Batch Actions</span>
                </label>
              </div>
            </motion.div>

            {/* API Configuration */}
            <motion.div variants={cardVariants} initial="hidden" whileInView="visible" className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg p-6 dark:backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔑 API Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">API Key</label>
                  <div className="flex gap-2">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      defaultValue="sk_live_abc123def456"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                    />
                    <button onClick={() => setShowApiKey(!showApiKey)} className="px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Base URL</label>
                  <input type="url" defaultValue="https://api.nullpointer.com" className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Secret Key</label>
                  <div className="flex gap-2">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      defaultValue="secret_xyz789uvw"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                    />
                    <button onClick={() => setShowSecret(!showSecret)} className="px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Security */}
            <motion.div variants={cardVariants} initial="hidden" whileInView="visible" className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg p-6 dark:backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🛡️ Security</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Log Retention (days)</label>
                  <input type="number" defaultValue="90" className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Session Timeout (minutes)</label>
                  <input type="number" defaultValue="30" className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm text-gray-700 dark:text-white/80">Enable Two-Factor Authentication</span>
                </label>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
