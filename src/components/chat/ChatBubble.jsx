import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Scale, User, Info, Trash2 } from 'lucide-react';

export default function ChatBubble({ id, role, content, timestamp, onDelete }) {
  const isAI = role === 'assistant';
  const isSystem = role === 'system';

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="flex w-full mb-10 justify-center group"
      >
        <div className="bg-void border-2 border-white/10 px-6 py-2 rounded-sm shadow-hard flex items-center justify-center gap-3 relative">
          <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-[10px] text-text-tertiary uppercase tracking-[0.2em] font-extrabold italic">
            {content}
          </span>
          <button 
            onClick={() => onDelete?.(id)}
            className="absolute -right-10 opacity-0 group-hover:opacity-40 hover:opacity-100 text-red hover:text-red transition-all p-2"
            title="PURGE_SYSTEM_LOG"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`flex w-full mb-12 group ${isAI ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`flex max-w-[90%] md:max-w-[85%] gap-5 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}
      >
        <div
          className={`flex-shrink-0 w-11 h-11 rounded-sm border-2 flex items-center justify-center transition-all duration-300 shadow-hard ${
            isAI ? 'bg-gold/10 border-gold/40' : 'bg-void border-white/10'
          }`}
        >
          {isAI ? (
            <Scale className="w-5 h-5 text-gold" />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </div>

        <div className={`space-y-3 flex flex-col relative ${isAI ? 'items-start text-left' : 'items-end text-right'}`}>
          <div
            className={`px-7 py-5 rounded-sm font-body text-[15px] leading-relaxed relative ${
              isAI
                ? 'bg-void border-2 border-white/5 text-white shadow-hard'
                : 'bg-gold text-midnight border-2 border-gold-light/20 shadow-hard'
            }`}
          >
            <div
              className={`prose max-w-none ${isAI ? 'prose-invert prose-gold' : 'prose-midnight'}`}
            >
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
            
            {/* Delete/Purge Button */}
            <button 
              onClick={() => onDelete?.(id)}
              className={`absolute top-0 ${isAI ? '-right-10' : '-left-10'} opacity-0 group-hover:opacity-100 transition-all p-2 text-text-tertiary hover:text-red`}
              title="PURGE_RECORD"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div
            className={`px-3 text-[9px] uppercase font-bold tracking-widest text-text-tertiary flex items-center gap-2 ${
              isAI ? 'flex-row' : 'flex-row-reverse'
            }`}
          >
            <span className={isAI ? 'text-gold' : 'text-white/40'}>
              {isAI ? 'STATUTORY_INTELLIGENCE' : 'USER_PROCURAL'}
            </span>
            <span className="opacity-30">•</span>
            <span>
              {new Date(timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
