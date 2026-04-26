import React, { useEffect, useState, useRef } from 'react';
import { logger, LogEntry } from '../../lib/multimodal-live-api/logger';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, User, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LiveConversationViewer() {
  const [messages, setMessages] = useState<{ id: string, role: 'user' | 'model', text: string, timestamp: Date }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleLog = (entry: LogEntry) => {
      if (entry.type === 'Transcription') {
        const role = entry.source === 'client' ? 'user' : 'model';
        setMessages(prev => [...prev, { 
          id: entry.id, 
          role, 
          text: entry.message, 
          timestamp: entry.timestamp 
        }]);
      }
    };
    
    // Load initial transcriptions if any
    const initialTranscriptions = logger.getLogs()
      .filter(l => l.type === 'Transcription')
      .map(l => ({
        id: l.id,
        role: (l.source === 'client' ? 'user' : 'model') as 'user' | 'model',
        text: l.message,
        timestamp: l.timestamp
      }));
    setMessages(initialTranscriptions);

    logger.on('log', handleLog);
    return () => {
      logger.off('log', handleLog);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="h-40 flex flex-col items-center justify-center text-zinc-600 bg-zinc-950/50 rounded-xl border border-dashed border-zinc-900">
        <MessageSquare className="w-5 h-5 mb-2 opacity-20" />
        <p className="text-[10px] uppercase tracking-widest font-bold">Transcription active</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-900 bg-zinc-900/50">
        <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400">Live Transcription</span>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex flex-col gap-1.5",
                msg.role === 'user' ? "items-end" : "items-start"
              )}
            >
              <div className={cn(
                "flex items-center gap-2 text-[9px] uppercase font-bold tracking-tighter",
                msg.role === 'user' ? "text-emerald-500" : "text-blue-500"
              )}>
                {msg.role === 'user' ? (
                  <>USER <User className="w-2.5 h-2.5" /></>
                ) : (
                  <><Bot className="w-2.5 h-2.5" /> AGENT</>
                )}
              </div>
              <div className={cn(
                "max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-sm",
                msg.role === 'user' 
                  ? "bg-zinc-800 text-zinc-100 rounded-tr-none" 
                  : "bg-blue-600/10 text-blue-100 border border-blue-500/10 rounded-tl-none"
              )}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
