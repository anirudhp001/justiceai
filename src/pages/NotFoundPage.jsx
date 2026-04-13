import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  Home,
  MessageSquare,
  BookOpen,
  ArrowLeft,
  Search,
  AlertTriangle,
  Terminal,
} from 'lucide-react';
import Header from '../components/ui/Header';

export default function NotFoundPage() {
  const navigate = useNavigate();

  const suggestions = [
    { icon: Home, label: 'BASE_TERMINAL', path: '/', color: 'text-gold' },
    { icon: MessageSquare, label: 'SYNC_AI_CHAT', path: '/chat', color: 'text-blue-400' },
    { icon: BookOpen, label: 'RIGHTS_STRATUM', path: '/rights', color: 'text-white' },
    { icon: Search, label: 'SEARCH_REGISTRY', path: null, color: 'text-gold-light' },
  ];

  return (
    <div className="min-h-screen bg-void font-mono">
      <Header />

      <main className="max-w-4xl mx-auto px-6 pt-48 pb-24 flex flex-col items-center text-center">
        {/* Animated Alert Symbol */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-12 relative"
        >
          <div className="absolute inset-0 bg-gold/10 blur-2xl rounded-sm" />
          <div className="w-32 h-32 rounded bg-void border-2 border-gold/40 flex items-center justify-center relative z-10 shadow-luxe">
            <AlertTriangle className="w-16 h-16 text-gold" />
          </div>
        </motion.div>

        {/* Error Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6 mb-16"
        >
          <h1 className="text-8xl md:text-9xl font-display font-bold text-white uppercase tracking-tighter italic">
            VOID_<span className="text-gold">404</span>
          </h1>
          <div className="flex items-center gap-4 justify-center px-6 py-2 bg-gold/10 border-2 border-gold/20 rounded-sm italic">
            <Terminal className="w-5 h-5 text-gold" />
            <p className="text-[12px] uppercase font-extrabold tracking-[0.4em] text-gold">
              PROTOCOL_ABORTED: CASE_RECORD_NULL
            </p>
          </div>
          <p className="text-sm text-text-tertiary font-body uppercase tracking-[0.15em] max-w-lg mx-auto leading-relaxed italic opacity-80">
            THE REQUESTED DATA STRATUM HAS BEEN ADJOURNED INDEFINITELY. SYSTEM REGISTRIES INDICATE NO ACTIVE PROXIES AT THIS COORDINATE.
          </p>
        </motion.div>

        {/* Suggestion Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full mb-16"
        >
          {suggestions.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={() => {
                  if (item.path) {
                    navigate(item.path);
                  } else {
                    document.dispatchEvent(
                      new KeyboardEvent('keydown', { key: 'k', metaKey: true }),
                    );
                  }
                }}
                className="group p-8 rounded-sm bg-void border-2 border-white/5 hover:border-gold/40 transition-all duration-300 flex flex-col items-center gap-4 shadow-hard hover:shadow-hard-gold/20 active:translate-y-[2px]"
              >
                <div className="w-12 h-12 rounded-sm bg-void border-2 border-white/10 flex items-center justify-center group-hover:border-gold/40 group-hover:scale-110 transition-all font-black">
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <span className="text-[10px] font-extrabold text-text-tertiary group-hover:text-white transition-colors uppercase tracking-widest italic">
                  {item.label}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-3 text-[10px] font-extrabold text-gold hover:text-white transition-all uppercase tracking-[0.4em] italic decoration-2 underline-offset-8 hover:underline"
        >
          <ArrowLeft className="w-5 h-5 font-black" />
          <span>REVERT_TO_PREVIOUS_STRATA</span>
        </motion.button>
      </main>
    </div>
  );
}
