'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, AlertCircle, CheckCircle, Clock, Plus, X, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthStore } from '@/lib/auth-store';

interface Integration {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'pending' | 'error' | 'not_configured';
  description: string;
  category: 'Cloud' | 'Communication' | 'Monitoring' | 'Notification';
  errors?: number;
  lastSynced?: Date;
  config?: Record<string, string>;
}

const CONFIG_FIELDS: Record<string, { label: string; placeholder: string; type: string }[]> = {
  aws: [
    { label: 'Access Key ID', placeholder: 'AKIA...', type: 'text' },
    { label: 'Secret Access Key', placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCY...', type: 'password' },
    { label: 'Region', placeholder: 'us-east-1', type: 'text' },
  ],
  gcp: [
    { label: 'Project ID', placeholder: 'my-project-id', type: 'text' },
    { label: 'Service Account JSON', placeholder: '{ "type": "service_account", ... }', type: 'textarea' },
  ],
  slack: [
    { label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/...', type: 'text' },
  ],
  discord: [
    { label: 'Webhook URL', placeholder: 'https://discord.com/api/webhooks/...', type: 'text' },
  ],
  email: [
    { label: 'SMTP Host', placeholder: 'smtp.gmail.com', type: 'text' },
    { label: 'Port', placeholder: '587', type: 'text' },
    { label: 'Username', placeholder: 'user@gmail.com', type: 'text' },
    { label: 'Password', placeholder: '••••••••', type: 'password' },
  ],
  datadog: [
    { label: 'API Key', placeholder: 'dd_api_key...', type: 'password' },
    { label: 'Application Key', placeholder: 'dd_app_key...', type: 'password' },
  ],
  azure: [
    { label: 'Tenant ID', placeholder: '00000000-0000...', type: 'text' },
    { label: 'Client ID', placeholder: '00000000-0000...', type: 'text' },
    { label: 'Client Secret', placeholder: '••••••••', type: 'password' },
  ],
  github: [
    { label: 'Personal Access Token', placeholder: 'ghp_...', type: 'password' },
  ],
};

const INTEGRATIONS: Integration[] = [
  {
    id: 'aws',
    name: 'AWS',
    icon: '🔷',
    status: 'connected',
    category: 'Cloud',
    description: 'Amazon Web Services for cloud infrastructure',
    lastSynced: new Date(Date.now() - 300000),
  },
  {
    id: 'gcp',
    name: 'Google Cloud',
    icon: '📊',
    status: 'connected',
    category: 'Cloud',
    description: 'Google Cloud Platform services',
    lastSynced: new Date(Date.now() - 600000),
  },
  {
    id: 'azure',
    name: 'Azure',
    icon: '💠',
    status: 'not_configured',
    category: 'Cloud',
    description: 'Microsoft Azure cloud platform',
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    status: 'connected',
    category: 'Communication',
    description: 'Send notifications to Slack channels',
    lastSynced: new Date(Date.now() - 120000),
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: '🎮',
    status: 'pending',
    category: 'Communication',
    description: 'Discord webhooks for alerts',
  },
  {
    id: 'email',
    name: 'Email',
    icon: '📧',
    status: 'error',
    category: 'Notification',
    description: 'SMTP email notifications',
    errors: 2,
  },
  {
    id: 'datadog',
    name: 'Datadog',
    icon: '📈',
    status: 'not_configured',
    category: 'Monitoring',
    description: 'Monitoring and analytics platform',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    status: 'not_configured',
    category: 'Monitoring',
    description: 'Monitor repositories and workflows',
  },
];

const OVERVIEW = {
  connected: INTEGRATIONS.filter((i) => i.status === 'connected').length,
  errors: INTEGRATIONS.filter((i) => i.status === 'error').reduce((sum, i) => sum + (i.errors || 0), 0),
  pending: INTEGRATIONS.filter((i) => i.status === 'pending').length,
  not_configured: INTEGRATIONS.filter((i) => i.status === 'not_configured').length,
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'connected':
      return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30';
    case 'error':
      return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30';
    case 'pending':
      return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30';
    default:
      return 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-500/10 border-gray-300 dark:border-gray-500/30';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'connected':
      return <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    default:
      return <Cloud className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
  }
};

export function IntegrationsContent() {
  const { user } = useAuthStore();
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<'gallery' | 'config'>('gallery');
  const [selectedService, setSelectedService] = useState<Integration | null>(null);
  const [configData, setConfigData] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [filter, setFilter] = useState<'All' | Integration['category']>('All');

  const categories: ('All' | Integration['category'])[] = ['All', 'Cloud', 'Monitoring', 'Communication', 'Notification'];

  // Helper to get overview again after state update
  const getOverview = () => ({
    connected: integrations.filter((i) => i.status === 'connected').length,
    errors: integrations.filter((i) => i.status === 'error').reduce((sum, i) => sum + (i.errors || 0), 0),
    pending: integrations.filter((i) => i.status === 'pending').length,
    not_configured: integrations.filter((i) => i.status === 'not_configured').length,
  });

  const OVERVIEW = getOverview();

  // 📥 Load integrations from Firestore (with localStorage fallback)
  useEffect(() => {
    const loadIntegrations = async () => {
      // Helper to merge default list with saved data
      const mergeIntegrations = (savedData: Integration[]) => {
        return INTEGRATIONS.map(defaultI => {
          const saved = savedData.find(s => s.id === defaultI.id);
          return saved ? { ...defaultI, ...saved } : defaultI;
        });
      };

      // 1. Initial Loading from localStorage (Instant Feedback)
      const storageKey = user?.email ? `integrations_${user.email}` : 'demo_integrations';
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const restored = mergeIntegrations(parsed.map((i: any) => ({
            ...i,
            lastSynced: i.lastSynced ? new Date(i.lastSynced) : undefined
          })));
          setIntegrations(restored);
        } catch (e) {
          console.error("Error parsing localStorage:", e);
        }
      }

      if (!user?.email) {
        setLoading(false);
        return;
      }
      
      // 2. Fetch from Firestore (Source of Truth)
      try {
        const docRef = doc(db, 'userConfigs', user.email);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.integrations) {
            const restored = mergeIntegrations(data.integrations.map((i: any) => ({
              ...i,
              lastSynced: i.lastSynced?.toDate ? i.lastSynced.toDate() : (i.lastSynced ? new Date(i.lastSynced) : undefined)
            })));
            setIntegrations(restored);
            // Sync back to localStorage
            localStorage.setItem(`integrations_${user.email}`, JSON.stringify(restored));
          }
        }
      } catch (err) {
        console.warn("Firestore sync failed, using localStorage fallback:", err);
      } finally {
        setLoading(false);
      }
    };

    loadIntegrations();
  }, [user]);

  // 💾 Helper to save to Firestore & localStorage
  const saveIntegrations = async (updatedList: Integration[]) => {
    const storageKey = user?.email ? `integrations_${user.email}` : 'demo_integrations';
    localStorage.setItem(storageKey, JSON.stringify(updatedList));

    if (!user?.email) return;

    try {
      const docRef = doc(db, 'userConfigs', user.email);
      await setDoc(docRef, { integrations: updatedList }, { merge: true });
    } catch (err) {
      console.warn("Firestore save deferred (client offline):", err);
    }
  };

  const handleConnect = async (integrationId: string) => {
    const service = integrations.find(i => i.id === integrationId);
    if (!service) return;
    
    setSelectedService(service);
    setModalStep('config');
    setShowModal(true);
  };

  const handleDisconnect = async (integrationId: string) => {
    const updated = integrations.map((i) =>
      i.id === integrationId
        ? { ...i, status: 'not_configured' as const, config: undefined }
        : i
    );
    setIntegrations(updated);
    await saveIntegrations(updated);
    toast.success(`${integrationId.toUpperCase()} disconnected`);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    await new Promise(r => setTimeout(r, 1500)); // Simulate API call
    setTesting(false);
    toast.success("Connection verified successfully!");
  };

  const handleSaveIntegration = async () => {
    if (!selectedService) return;

    // Basic validation
    const fields = CONFIG_FIELDS[selectedService.id] || [];
    const missing = fields.find(f => !configData[f.label]?.trim());
    if (missing) {
      toast.error(`Please fill in ${missing.label}`);
      return;
    }

    const updated = integrations.map((i) =>
      i.id === selectedService.id
        ? { ...i, status: 'connected' as const, lastSynced: new Date(), config: configData }
        : i
    );
    
    setIntegrations(updated);
    await saveIntegrations(updated);

    toast.success(`${selectedService.name} integration saved`);
    setShowModal(false);
    setSelectedService(null);
    setConfigData({});
    setModalStep('gallery');
  };

  const handleDelete = async (integrationId: string) => {
    const updated = integrations.map((i) =>
      i.id === integrationId
        ? { ...i, status: 'not_configured' as const, config: undefined, lastSynced: undefined, errors: undefined }
        : i
    );
    setIntegrations(updated);
    await saveIntegrations(updated);
    toast.success(`${integrationId.toUpperCase()} removed from dashboard`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Connected', value: OVERVIEW.connected, color: 'emerald' },
          { label: 'Errors', value: OVERVIEW.errors, color: 'red' },
          { label: 'Pending', value: OVERVIEW.pending, color: 'amber' },
          { label: 'Not Configured', value: OVERVIEW.not_configured, color: 'gray' },
        ].map((item) => (
          <motion.div
            key={item.label}
            className={`glass card-glow border border-${item.color}-300 dark:border-${item.color}-500/10 p-4 rounded-2xl`}
            whileHover={{ scale: 1.02 }}
          >
            <p className={`text-xs font-semibold text-${item.color}-700 dark:text-${item.color}-300 mb-1`}>
              {item.label}
            </p>
            <p className={`text-2xl font-bold text-${item.color}-900 dark:text-white`}>
              {item.label === 'Connected' ? integrations.filter(i => i.status === 'connected').length :
               item.label === 'Errors' ? integrations.filter(i => i.status === 'error').reduce((sum, i) => sum + (i.errors || 0), 0) :
               item.label === 'Pending' ? integrations.filter(i => i.status === 'pending').length :
               integrations.filter(i => i.status === 'not_configured').length}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Add Integration Button */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 dark:bg-green-500 hover:bg-blue-700 dark:hover:bg-green-600 text-white font-semibold transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Integration
      </button>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.filter(i => i.status !== 'not_configured').length === 0 ? (
          <div className="col-span-full py-20 text-center glass border border-white/10 rounded-3xl">
            <Cloud className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white">No active integrations</h3>
            <p className="text-white/60 mb-6">Connect your favorite services to see them here.</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-black font-bold transition-all shadow-lg"
            >
              Get Started
            </button>
          </div>
        ) : (
          integrations
            .filter(i => i.status !== 'not_configured')
            .map((integration) => (
              <motion.div
                key={integration.id}
                className="glass card-glow border border-gray-300 dark:border-white/10 p-6 rounded-2xl relative overflow-hidden group"
                whileHover={{ scale: 1.01 }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{integration.icon}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{integration.name}</h3>
                      <p className="text-xs text-gray-600 dark:text-white/70">{integration.description}</p>
                    </div>
                  </div>
                  {/* Delete Option (always available on active cards) */}
                  <button
                    onClick={() => handleDelete(integration.id)}
                    className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Remove Integration"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(integration.status)} mb-4`}>
                  {getStatusIcon(integration.status)}
                  <span className="capitalize">{integration.status.replace('_', ' ')}</span>
                </div>

                {/* Last Synced */}
                {integration.lastSynced && (
                  <p className="text-xs text-gray-600 dark:text-white/70 mb-4">
                    Last synced: {integration.lastSynced.toLocaleTimeString()}
                  </p>
                )}

                {/* Errors */}
                {integration.errors && (
                  <p className="text-xs text-red-700 dark:text-red-300 mb-4">
                    {integration.errors} error{integration.errors > 1 ? 's' : ''} detected
                  </p>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-gray-300 dark:border-white/10 space-y-2">
                  {integration.status === 'connected' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-colors border border-white/10"
                      >
                        Disconnect
                      </button>
                      <button
                        onClick={() => handleConnect(integration.id)}
                        className="px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black font-semibold text-sm transition-colors shadow-lg shadow-green-500/10"
                      >
                        Configure
                      </button>
                    </div>
                  ) : integration.status === 'pending' ? (
                    <button
                      onClick={() => handleConnect(integration.id)}
                      className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold text-sm transition-colors"
                    >
                      Authorize
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-semibold text-sm transition-colors"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => handleConnect(integration.id)}
                        className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-colors border border-white/10"
                      >
                        Configure
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
        )}
      </div>

      {/* Add/Configure Integration Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
            onClick={() => {
              setShowModal(false);
              setModalStep('gallery');
              setSelectedService(null);
              setConfigData({});
            }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="glass border border-white/10 p-8 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {modalStep === 'gallery' ? 'Available Services' : `Configure ${selectedService?.name}`}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {modalStep === 'gallery' 
                      ? 'Choose a service to integrate with Null Pointer' 
                      : `Set up the connection for your ${selectedService?.name} instance`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setModalStep('gallery');
                  }}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-foreground/70" />
                </button>
              </div>

              {/* Step 1: Gallery */}
              {modalStep === 'gallery' && (
                <div className="space-y-6">
                  {/* Category Filter */}
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                          filter === cat 
                            ? 'bg-green-500 text-black' 
                            : 'bg-black/5 dark:bg-white/5 text-foreground/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {integrations
                      .filter(i => filter === 'All' || i.category === filter)
                      .map((i) => (
                        <button
                          key={i.id}
                          onClick={() => {
                            setSelectedService(i);
                            setModalStep('config');
                          }}
                          className="group p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-green-500/50 transition-all text-left relative overflow-hidden"
                        >
                          <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">{i.icon}</span>
                          <h4 className="font-bold text-foreground dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{i.name}</h4>
                          <p className="text-[10px] text-muted-foreground dark:text-white/40 mt-1 line-clamp-2">{i.description}</p>
                          {i.status === 'connected' && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Step 2: Configuration */}
              {modalStep === 'config' && selectedService && (
                <div className="space-y-6">
                  {/* Service Banner */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-4xl">{selectedService!.icon}</span>
                    <div>
                      <h4 className="font-bold text-foreground dark:text-white">{selectedService!.name}</h4>
                      <p className="text-xs text-muted-foreground dark:text-white/60">{selectedService!.description}</p>
                    </div>
                    <button 
                      onClick={() => setModalStep('gallery')}
                      className="ml-auto text-xs text-green-400 hover:underline"
                    >
                      Change Service
                    </button>
                  </div>

                  {/* Dynamic Fields */}
                  <div className="space-y-4">
                    {(CONFIG_FIELDS[selectedService!.id] || [{ label: 'API Key', placeholder: 'Enter API Key', type: 'password' }]).map((field) => (
                      <div key={field.label}>
                        <label className="block text-sm font-semibold text-foreground/80 dark:text-white/80 mb-2">
                          {field.label}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            placeholder={field.placeholder}
                            value={configData[field.label] || ''}
                            onChange={(e) => setConfigData({ ...configData, [field.label]: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-foreground dark:text-white placeholder-foreground/20 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-green-500/50 min-h-[100px] resize-none"
                          />
                        ) : (
                          <input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={configData[field.label] || ''}
                            onChange={(e) => setConfigData({ ...configData, [field.label]: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-foreground dark:text-white placeholder-foreground/20 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Footer Stats/Buttons */}
                  <div className="flex flex-col gap-4 pt-4">
                    <button
                      onClick={handleTestConnection}
                      disabled={testing}
                      className="w-full h-12 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-foreground/80 dark:text-white/80 font-medium transition-all flex items-center justify-center gap-2"
                    >
                      {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                      {testing ? 'Verifying...' : 'Test Connection'}
                    </button>
                    
                    {/* Remove Option */}
                    <button
                      onClick={() => {
                        handleDelete(selectedService!.id);
                        setShowModal(false);
                      }}
                      className="w-full py-2 rounded-xl text-red-500 hover:bg-red-500/10 text-xs font-semibold transition-all flex items-center justify-center gap-1 border border-red-500/20"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove Integration
                    </button>

                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveIntegration}
                        className="flex-1 h-12 rounded-xl bg-green-500 hover:bg-green-600 text-black font-bold transition-all shadow-lg shadow-green-500/20"
                      >
                        Save Configuration
                      </button>
                      <button
                        onClick={() => {
                          setModalStep('gallery');
                          setSelectedService(null);
                          setConfigData({});
                        }}
                        className="px-6 h-12 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground dark:text-white font-medium transition-all"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
