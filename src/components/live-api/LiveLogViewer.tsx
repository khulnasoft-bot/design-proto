import React, { useEffect, useState, useRef } from 'react';
import { logger, LogEntry } from '../../lib/multimodal-live-api/logger';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Copy, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LiveLogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    setLogs(logger.getLogs());
    const handleLog = (entry: LogEntry) => {
      setLogs(prev => [...prev.slice(-499), entry]);
    };
    logger.on('log', handleLog);
    return () => {
      logger.off('log', handleLog);
    };
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden font-mono text-[11px]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-900 bg-zinc-900/50">
        <div className="flex items-center gap-2 text-zinc-400">
          <Terminal className="w-3.5 h-3.5" />
          <span className="uppercase tracking-widest font-semibold">Live System Logs</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setAutoScroll(!autoScroll)}
            className={cn(
              "px-1.5 py-0.5 rounded transition-colors",
              autoScroll ? "text-blue-400 bg-blue-500/10" : "text-zinc-500 bg-zinc-800"
            )}
          >
            {autoScroll ? 'AUTO-SCROLL' : 'MANUAL'}
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="group flex gap-2 py-0.5 border-b border-zinc-900/50 last:border-0 hover:bg-zinc-900/30 transition-colors"
            >
              <span className="text-zinc-600 shrink-0">
                {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={cn(
                "shrink-0 font-bold",
                log.source === 'client' ? "text-emerald-500" : "text-blue-500"
              )}>
                [{log.source.toUpperCase()}]
              </span>
              <span className="text-zinc-400 font-medium shrink-0">
                {log.type}:
              </span>
              <span className="text-zinc-200 break-all">
                {log.message}
              </span>
              
              {log.data && (
                <div className="hidden group-hover:block ml-auto overflow-hidden">
                   <pre className="text-[9px] text-zinc-500 bg-black/50 p-1 rounded max-w-xs truncate">
                    {JSON.stringify(log.data)}
                   </pre>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
