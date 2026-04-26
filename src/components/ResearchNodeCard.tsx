import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ResearchNode, Priority } from "../types";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ExternalLink, Search, Lightbulb, FileText, Brain, Flag, Copy, Trash2, Edit2, Check, X, ChartLine } from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import { VegaVisualizer } from "./VegaVisualizer";

const icons = {
  query: Search,
  fact: Lightbulb,
  synthesis: FileText,
  thought: Brain,
};

const priorityColors = {
  low: "text-blue-400 border-blue-400/20 bg-blue-400/10",
  medium: "text-yellow-400 border-yellow-400/20 bg-yellow-400/10",
  high: "text-red-400 border-red-400/20 bg-red-400/10",
};

export function ResearchNodeCard({ 
  node, 
  isSelected,
  onSelect,
  onUpdatePriority,
  onDelete,
  onEdit
}: { 
  node: ResearchNode;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdatePriority?: (priority: Priority) => void;
  onDelete?: () => void;
  onEdit?: (content: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(node.content);
  const Icon = icons[node.type];

  const handleCopy = () => {
    navigator.clipboard.writeText(node.content);
    toast.success("Content copied to clipboard");
  };

  const handleSave = () => {
    if (editContent.trim() && editContent !== node.content) {
      onEdit?.(editContent);
    }
    setIsEditing(false);
  };

  const parsedContent = useMemo(() => {
    const vegaRegex = /```vega-lite\n([\s\S]*?)\n```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = vegaRegex.exec(node.content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: node.content.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'vega', spec: match[1] });
      lastIndex = vegaRegex.lastIndex;
    }

    if (lastIndex < node.content.length) {
      parts.push({ type: 'text', content: node.content.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: node.content }];
  }, [node.content]);

  return (
    <Card 
      onClick={(e) => {
        // Only trigger onSelect if not clicking a button or link
        if (!(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('a') && !(e.target as HTMLElement).closest('textarea')) {
          onSelect?.();
        }
      }}
      className={cn(
        "border-zinc-800 bg-zinc-900/50 backdrop-blur-sm group transition-all cursor-pointer relative overflow-hidden",
        isSelected && "ring-2 ring-blue-500 border-transparent bg-zinc-900 shadow-lg shadow-blue-500/10"
      )}
    >
      {isSelected && (
        <div className="absolute top-0 right-0 p-1">
          <div className="bg-blue-600 rounded-bl-lg p-1 shadow-lg">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-zinc-800 p-2">
            <Icon className="h-4 w-4 text-zinc-400" />
          </div>
          <Badge variant="outline" className="capitalize text-zinc-400 border-zinc-800">
            {node.type}
          </Badge>
          {node.priority && (
            <Badge variant="outline" className={cn("capitalize", priorityColors[node.priority])}>
              {node.priority}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full text-zinc-600 hover:text-zinc-400"
              onClick={handleCopy}
              title="Copy"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full text-zinc-600 hover:text-zinc-400"
              onClick={() => setIsEditing(true)}
              title="Edit"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full text-zinc-600 hover:text-red-400"
              onClick={() => onDelete?.()}
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <div className="w-px h-3 bg-zinc-800 mx-1" />
            {(['low', 'medium', 'high'] as Priority[]).map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6 rounded-full",
                  node.priority === p ? priorityColors[p] : "text-zinc-600 hover:text-zinc-400"
                )}
                onClick={() => onUpdatePriority?.(p)}
                title={`Set ${p} priority`}
              >
                <Flag className="h-3 w-3" />
              </Button>
            ))}
          </div>
          <span className="text-xs text-zinc-500">
            {new Date(node.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              autoFocus
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[100px] bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(node.content);
                }}
                className="h-8 text-xs text-zinc-500"
              >
                <X className="mr-1 h-3 w-3" /> Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-500 text-white"
              >
                <Check className="mr-1 h-3 w-3" /> Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {parsedContent.map((part, idx) => (
              part.type === 'vega' ? (
                <div key={idx} className="my-2">
                  <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <ChartLine className="w-3 h-3" /> Data Visualization
                  </div>
                  <VegaVisualizer spec={part.spec} />
                </div>
              ) : (
                <div key={idx} className="prose prose-invert max-w-none text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {part.content}
                </div>
              )
            ))}
          </div>
        )}
        {node.sources && node.sources.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {node.sources.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-zinc-800/50 px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                {source.title}
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
