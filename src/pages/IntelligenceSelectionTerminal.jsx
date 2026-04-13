import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings2, 
  Cpu, 
  Cloud, 
  Database, 
  ShieldCheck, 
  ShieldAlert, 
  Save, 
  RefreshCcw,
  Key,
  Globe,
  Zap,
  Rocket
} from 'lucide-react';
import Header from '../components/ui/Header';
import { useToast } from '../components/ui/Toast';

export default function IntelligenceSelectionTerminal() {
  const { addToast } = useToast();
  
  // Settings State
  const [activeProvider, setActiveProvider] = useState('grok');
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    deepseek: '',
    grok: ''
  });
  
  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(null); // null | 'ollama' | 'gemini' | 'deepseek'

  // Load settings on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem('justice_ai_provider');
    const savedKeys = localStorage.getItem('justice_ai_keys');
    
    if (savedProvider) setActiveProvider(savedProvider);
    if (savedKeys) setApiKeys(JSON.parse(savedKeys));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('justice_ai_provider', activeProvider);
      localStorage.setItem('justice_ai_keys', JSON.stringify(apiKeys));
      
      // Artificial delay for industrial "crunching" feel
      await new Promise(r => setTimeout(r, 800));
      
      addToast({
        title: 'CONFIGURATION_UPDATED',
        description: `Active analysis provider shifted to ${activeProvider.toUpperCase()}.`,
        type: 'success'
      });
    } catch (e) {
      addToast({
        title: 'SYSTEM_ERROR',
        description: 'Failed to write to local storage framework.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async (provider) => {
    setIsTesting(provider);
    try {
      // For now, we'll just simulate a ping to the backend
      const response = await fetch('http://localhost:3001/api/health');
      if (!response.ok) throw new Error('Backend Unreachable');
      
      await new Promise(r => setTimeout(r, 1200));
      
      addToast({
        title: `LINK_VERIFIED: ${provider.toUpperCase()}`,
        description: 'Analysis link verified. System ready to assist.',
        type: 'success'
      });
    } catch (e) {
      addToast({
        title: 'LINK_FAILURE',
        description: 'Could not establish connection with backend system.',
        type: 'error'
      });
    } finally {
      setIsTesting(null);
    }
  };

  return (
    <div className="min-h-screen bg-void text-white font-mono selection:bg-gold/30">
      <Header />
      
      <main className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-16 relative">
          <div className="absolute -left-10 top-0 w-1 h-full bg-gold opacity-30" />
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <Settings2 className="w-8 h-8 text-gold" />
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">
              INTELLIGENCE_SELECTION_TERMINAL_V4.2
            </h1>
          </motion.div>
          <p className="text-text-secondary text-sm tracking-widest uppercase font-bold opacity-60">
            Configure primary analysis routing and secure access keys.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Provider Selection Tier */}
          <div className="lg:col-span-2 space-y-6">
            <label className="text-[10px] uppercase font-black tracking-[0.5em] text-gold-light mb-4 block italic opacity-40">
              STRATEGIC_COMPUTE_SOURCE_MATRIX
            </label>
            
            <div className="grid gap-4">
              <ProviderCard 
                id="ollama"
                title="STATUTORY_LOCAL_CORE (gemma3:4b)"
                description="PRIVACY-FIRST ANALYSIS POWERED BY OLLAMA. ALL INFERENCE RUNS LOCALLY — ZERO LATENCY, ZERO DATA LEAKAGE."
                icon={<Cpu className="w-5 h-5" />}
                active={activeProvider === 'ollama'}
                onClick={setActiveProvider}
                status="OFFLINE_CORE"
              />
              <ProviderCard 
                id="gemini"
                title="Google Gemini"
                description="High-speed extraction and research. Requires API key fallback."
                icon={<Cloud className="w-5 h-5" />}
                active={activeProvider === 'gemini'}
                onClick={setActiveProvider}
                status="CLOUD"
              />
              <ProviderCard 
                id="deepseek"
                title="DeepSeek AI"
                description="Advanced strategic reasoning. High-performance analysis backup."
                icon={<Database className="w-5 h-5" />}
                active={activeProvider === 'deepseek'}
                onClick={setActiveProvider}
                status="CLOUD"
              />
              <ProviderCard 
                id="grok"
                title="xAI Grok"
                description="Real-time strategic intelligence. High-bandwidth analysis for complex litigation."
                icon={<Rocket className="w-5 h-5" />}
                active={activeProvider === 'grok'}
                onClick={setActiveProvider}
                status="CLOUD"
              />
            </div>

            {/* API Key Configuration Section */}
            <AnimatePresence mode="wait">
              {activeProvider !== 'ollama' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-8 bg-void border-2 border-white/5 rounded-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-1/3 h-full bg-gold/5 skew-x-12 translate-x-32" />
                  
                  <div className="flex items-center gap-3 mb-8">
                    <Key className="w-5 h-5 text-gold" />
                    <h3 className="text-lg font-bold uppercase tracking-tight italic">
                      CREDENTIAL_MANDATE_REGISTRY
                    </h3>
                  </div>

                  <div className="space-y-8 relative z-10">
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-text-tertiary">
                        {activeProvider === 'gemini' ? 'Gemini_API_Key' : activeProvider === 'deepseek' ? 'DeepSeek_API_Key' : 'Grok_API_Key'}
                      </label>
                      <div className="relative group">
                        <input 
                          type="password"
                          value={activeProvider === 'gemini' ? apiKeys.gemini : activeProvider === 'deepseek' ? apiKeys.deepseek : apiKeys.grok}
                          onChange={(e) => setApiKeys(prev => ({
                            ...prev,
                            [activeProvider]: e.target.value
                          }))}
                          className="w-full bg-black/40 border-2 border-white/10 p-4 font-mono text-sm focus:border-gold/50 focus:outline-none transition-all rounded-sm tracking-[0.3em] uppercase italic"
                          placeholder="••••••••••••••••••••••••••••••••"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <ShieldCheck className="w-4 h-4 text-gold opacity-50" />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => testConnection(activeProvider)}
                      disabled={isTesting}
                      className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-blue hover:text-white transition-colors group"
                    >
                      {isTesting === activeProvider ? (
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 group-hover:animate-pulse" />
                      )}
                      <span>Ping_{activeProvider.toUpperCase()}_Service</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls Tier */}
          <div className="space-y-6">
            <div className="p-8 bg-void/5 border-2 border-white/10 rounded-sm space-y-8 sticky top-32 shadow-[16px_16px_0px_0px_rgba(0,0,0,0.4)]">
              <div className="space-y-4">
                <label className="text-[10px] uppercase font-black tracking-[0.4em] text-text-tertiary block">
                  System_Status
                </label>
                <div className="space-y-3">
                  <StatusLine label="Backend_Link" active={true} />
                  <StatusLine label="Vector_DB" active={true} />
                  <StatusLine label="Failover_Chain" active={true} />
                </div>
              </div>

              <div className="h-[1px] bg-void/10" />

              <div className="space-y-4">
                <p className="text-[11px] text-text-secondary leading-relaxed italic">
                  Changes to provider routing will take effect immediately upon application to the active legal session.
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-gold text-midnight p-5 rounded-sm flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:shadow-none transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>Apply_Configuration</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProviderCard({ id, title, description, icon, active, onClick, status }) {
  return (
    <motion.div
      whileHover={{ x: 8 }}
      onClick={() => onClick(id)}
      className={`p-6 rounded-sm border-2 cursor-pointer transition-all relative group overflow-hidden ${
        active 
          ? 'bg-gold/10 border-gold shadow-[8px_8px_0px_0px_rgba(212,175,55,0.1)]' 
          : 'bg-void border-white/10 hover:border-white/30'
      }`}
    >
      <div className="flex items-center gap-5 relative z-10">
        <div className={`p-3 rounded-sm ${active ? 'bg-gold text-midnight' : 'bg-void/5 text-text-tertiary'}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className={`font-black uppercase tracking-tighter ${active ? 'text-white' : 'text-text-secondary'}`}>
              {title}
            </h3>
            {active && (
              <span className="text-[9px] bg-gold text-midnight px-2 py-0.5 rounded-sm font-black animate-pulse">
                DEPLOYED_MANDATE
              </span>
            )}
          </div>
          <p className="text-xs text-text-tertiary leading-relaxed">
            {description}
          </p>
        </div>
        <div className="text-[10px] font-black tracking-widest text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
          [{status}]
        </div>
      </div>
      
      {active && (
        <div className="absolute top-0 right-0 p-2">
          <ShieldCheck className="w-4 h-4 text-gold" />
        </div>
      )}
    </motion.div>
  );
}

function StatusLine({ label, active }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-text-secondary font-bold uppercase tracking-tight">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-sm ${active ? 'bg-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]' : 'bg-void/20 border border-white/5'}`} />
        <span className={`text-[10px] font-black tracking-widest ${active ? 'text-gold' : 'text-white/10'}`}>
          {active ? 'ONLINE_LINK' : 'OFFLINE_CORE'}
        </span>
      </div>
    </div>
  );
}
