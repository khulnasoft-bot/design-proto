import React from "react";
import { ResearchNode, Priority, NodeType } from "../types";
import { X, Trash2, Tag, Clock, Hash, AlignLeft, Info, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface NodeEditPanelProps {
  node: ResearchNode;
  onUpdate: (updatedNode: ResearchNode) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

export function NodeEditPanel({ node, onUpdate, onDelete, onClose }: NodeEditPanelProps) {
  const handleContentChange = (content: string) => {
    onUpdate({ ...node, content, updatedAt: Date.now() });
  };

  const handlePriorityChange = (priority: Priority) => {
    onUpdate({ ...node, priority, updatedAt: Date.now() });
  };

  const handleTypeChange = (type: NodeType) => {
    onUpdate({ ...node, type, updatedAt: Date.now() });
  };

  const handleMetadataChange = (key: string, value: string) => {
    const metadata = { ...node.metadata, [key]: value };
    onUpdate({ ...node, metadata, updatedAt: Date.now() });
  };

  const nodeTypes: NodeType[] = ['query', 'fact', 'synthesis', 'thought', 'business_memory', 'site_page'];
  const priorities: Priority[] = ['low', 'medium', 'high'];

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="absolute right-0 top-0 bottom-0 w-80 bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col z-50"
    >
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Node Properties</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-zinc-500 hover:text-zinc-100">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8 pb-12">
          {/* Node ID & Stats */}
          <section className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest">
              <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> Node Reference</span>
              <span>v1.0</span>
            </div>
            <code className="block p-2 bg-zinc-950 border border-zinc-800 rounded text-[10px] font-mono text-zinc-400 break-all">
              {node.id}
            </code>
          </section>

          {/* Content Editor */}
          <section className="space-y-3">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <AlignLeft className="w-3 h-3" /> Core Content
            </Label>
            <Textarea
              value={node.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="min-h-[120px] bg-zinc-950 border-zinc-800 text-sm leading-relaxed focus:border-blue-500/50 transition-colors custom-scrollbar"
              placeholder="Enter node intelligence..."
            />
          </section>

          {/* Node Type */}
          <section className="space-y-3">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-3 h-3" /> Intelligence Type
            </Label>
            <div className="flex flex-wrap gap-2">
              {nodeTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all border",
                    node.type === type 
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" 
                      : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </section>

          {/* Priority */}
          <section className="space-y-3">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3 h-3" /> Priority Tier
            </Label>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p}
                  onClick={() => handlePriorityChange(p)}
                  className={cn(
                    "flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all border",
                    node.priority === p 
                      ? p === 'high' ? "bg-red-600 border-red-500 text-white" :
                        p === 'medium' ? "bg-orange-600 border-orange-500 text-white" :
                        "bg-green-600 border-green-500 text-white"
                      : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          {/* Metadata */}
          <section className="space-y-3">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-3 h-3" /> Extended Metadata
            </Label>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-zinc-500 uppercase tracking-widest pl-1">Source Context</Label>
                <Input
                  value={node.metadata?.source || ""}
                  onChange={(e) => handleMetadataChange('source', e.target.value)}
                  className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-300"
                  placeholder="Primary data source..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-zinc-500 uppercase tracking-widest pl-1">Confidence Score</Label>
                <Input
                  value={node.metadata?.confidence || ""}
                  onChange={(e) => handleMetadataChange('confidence', e.target.value)}
                  className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-300"
                  placeholder="0.0 - 1.0"
                />
              </div>
            </div>
          </section>

          {/* Timestamp */}
          <section className="pt-4 border-t border-zinc-800 flex items-center justify-between text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
            <div className="flex items-center gap-1.5">
               <Clock className="w-3 h-3" />
               Last Synced: {node.updatedAt ? new Date(node.updatedAt).toLocaleTimeString() : 'N/A'}
            </div>
          </section>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
        <Button 
          variant="ghost" 
          onClick={() => onDelete(node.id)}
          className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10 justify-start gap-2"
        >
          <Trash2 className="w-4 h-4" /> Purge Intelligence
        </Button>
      </div>
    </motion.div>
  );
}
