import React, { useRef, useEffect } from 'react';
import ChatBubble from './ChatBubble';

export default function ChatPanel({ messages, isLoading, onDelete }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-midnight relative">
      <div className="absolute inset-0 bg-gold/5 blur-[120px] pointer-events-none opacity-10" />
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-8 scroll-smooth relative z-10"
      >
        <div className="max-w-4xl mx-auto space-y-10">
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              id={msg.id}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
              onDelete={onDelete}
            />
          ))}
          {isLoading && <TypingIndicator />}
          
          {/* Institutional Buffer for Sticky Input Bar */}
          <div className="h-24 md:h-12" />
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex w-full justify-start mb-12">
      <div className="flex items-start gap-5">
        <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20 shadow-luxe">
          <div className="w-5 h-5 rounded-lg bg-gold/40 animate-pulse" />
        </div>
        <div className="bg-midnight border border-white/10 px-8 py-5 rounded-2xl shadow-premium flex gap-2 items-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
