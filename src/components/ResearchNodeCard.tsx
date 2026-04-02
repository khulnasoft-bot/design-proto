import { useState } from "react";
import { motion } from "motion/react";
import { ResearchNode, Priority } from "@/src/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, Lightbulb, FileText, Brain, Flag, Copy, Trash2, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  onUpdatePriority,
  onDelete,
  onEdit
}: { 
  node: ResearchNode;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mb-6"
    >
      <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm group">
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
                onClick={() => confirm("Delete this node?") && onDelete?.()}
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
            <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {node.content}
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
    </motion.div>
  );
}
