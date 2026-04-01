import { motion } from "motion/react";
import { ResearchNode, Priority } from "@/src/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, Lightbulb, FileText, Brain, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

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
  onUpdatePriority 
}: { 
  node: ResearchNode;
  onUpdatePriority?: (priority: Priority) => void;
}) {
  const Icon = icons[node.type];
  
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
          <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {node.content}
          </div>
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
