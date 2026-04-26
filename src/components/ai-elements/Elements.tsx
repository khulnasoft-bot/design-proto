import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  RotateCcw, 
  ShieldCheck, 
  Clock,
  Sparkles,
  Terminal,
  Brain,
  ChevronDown,
  ExternalLink,
  Zap
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

// --- AI Message Component ---
interface MessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  isStreaming?: boolean;
  status?: "done" | "error" | "thinking";
}

export const Message = ({ role, content, timestamp, isStreaming, status }: MessageProps) => {
  const isAssistant = role === "assistant";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full gap-4 p-6 rounded-2xl transition-colors",
        isAssistant ? "bg-zinc-900/40 border border-zinc-800/50" : "bg-transparent"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
        isAssistant ? "bg-blue-600/10 border-blue-500/20 shadow-lg shadow-blue-500/5" : "bg-zinc-800 border-zinc-700"
      )}>
        {isAssistant ? <Bot className="w-5 h-5 text-blue-500" /> : <User className="w-5 h-5 text-zinc-400" />}
      </div>
      
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest",
            isAssistant ? "text-blue-500" : "text-zinc-500"
          )}>
            {role} {status === 'thinking' && "• thinking..."}
          </span>
          {timestamp && (
            <span className="text-[10px] text-zinc-600 font-mono">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className={cn(
          "text-sm leading-relaxed",
          isAssistant ? "text-zinc-200" : "text-zinc-400"
        )}>
          {content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-blue-500 animate-pulse align-middle" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- Reasoning / Chain-of-Thought Component ---
interface ReasoningProps {
  thoughts: string[];
  isExpanded?: boolean;
}

export const Reasoning = ({ thoughts, isExpanded: initialExpanded = false }: ReasoningProps) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  return (
    <div className="my-4 border border-zinc-800/50 bg-zinc-900/30 rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
           <Brain className="w-3.5 h-3.5 text-zinc-500" />
           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Model Reasoning</span>
        </div>
        <ChevronDown className={cn("w-3 h-3 text-zinc-500 transition-transform", isExpanded ? "rotate-180" : "")} />
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-zinc-800/50 space-y-3">
              {thoughts.map((thought, i) => (
                <div key={i} className="flex gap-3">
                  <div className="text-[10px] font-mono text-zinc-700 w-4 pt-0.5">{(i + 1).toString().padStart(2, '0')}</div>
                  <p className="text-xs text-zinc-500 leading-relaxed italic">{thought}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Code Block Component ---
interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
}

export const CodeBlock = ({ code, language, title }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 group">
      <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 border-x border-t border-zinc-800 rounded-t-xl">
        <div className="flex items-center gap-3">
          <Terminal className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {title || language}
          </span>
        </div>
        <button 
          onClick={handleCopy}
          className="text-zinc-600 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-b-xl overflow-x-auto custom-scrollbar">
        <pre className="font-mono text-xs text-blue-400/90 leading-relaxed">
          {code}
        </pre>
      </div>
    </div>
  );
};

// --- Thought Relay (Agentic Step) Component ---
interface RelayStep {
  id: string;
  label: string;
  status: "pending" | "active" | "complete" | "error";
  duration?: string;
}

export const ThoughtRelay = ({ steps }: { steps: RelayStep[] }) => {
  return (
    <div className="flex items-center gap-2 py-4 px-2 overflow-x-auto whitespace-nowrap custom-scrollbar no-scrollbar">
      {steps.map((step, i) => (
        <React.Fragment key={step.id}>
           <div className={cn(
             "px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all duration-500",
             step.status === 'active' ? "bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/5 scale-105" :
             step.status === 'complete' ? "bg-zinc-900 border-zinc-800 text-zinc-400" :
             "bg-zinc-950 border-zinc-900 text-zinc-700"
           )}>
             {step.status === 'active' && <RotateCcw className="w-3 h-3 text-blue-400 animate-spin" />}
             {step.status === 'complete' && <ShieldCheck className="w-3 h-3 text-green-500" />}
             <span className={cn(
               "text-[9px] font-bold uppercase tracking-widest",
               step.status === 'active' ? "text-blue-400" : "text-inherit"
             )}>
               {step.label}
             </span>
             {step.duration && <span className="text-[8px] opacity-50 font-mono">{step.duration}</span>}
           </div>
           {i < steps.length - 1 && (
             <div className="w-4 h-px bg-zinc-800 shrink-0" />
           )}
        </React.Fragment>
      ))}
    </div>
  );
};
