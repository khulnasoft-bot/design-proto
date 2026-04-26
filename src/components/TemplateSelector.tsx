import React from "react";
import { PROJECT_TEMPLATES } from "../constants/templates";
import { ProjectTemplate } from "../types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Search, Rocket, Compass, Cpu, MessageCircle, X, ChevronRight, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface TemplateSelectorProps {
  onSelect: (template: ProjectTemplate | null) => void;
  onClose: () => void;
}

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [filter, setFilter] = React.useState<string | null>(null);
  const categories = Array.from(new Set(PROJECT_TEMPLATES.map(t => t.category)));

  const filteredTemplates = filter 
    ? PROJECT_TEMPLATES.filter(t => t.category === filter)
    : PROJECT_TEMPLATES;

  const getIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'operations': return <Rocket className="w-4 h-4" />;
      case 'research': return <Compass className="w-4 h-4" />;
      case 'engineering': return <Cpu className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="p-8 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/20">
          <div>
            <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">Create New Project</h2>
            <p className="text-zinc-500 mt-1">Start from scratch or use a pre-defined template to jumpstart your research.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-zinc-900">
            <X className="w-5 h-5 text-zinc-500" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Categories Sidebar */}
          <div className="w-48 border-r border-zinc-900 p-6 space-y-2">
            <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-4">Categories</h3>
            <button
              onClick={() => setFilter(null)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                filter === null ? "bg-blue-600/10 text-blue-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              All Templates
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2",
                  filter === cat ? "bg-blue-600/10 text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {getIcon(cat)}
                {cat}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Blank Template */}
              <button
                onClick={() => onSelect(null)}
                className="group text-left"
              >
                <Card className="h-full border-dashed border-zinc-800 bg-transparent hover:border-zinc-700 hover:bg-zinc-900/30 transition-all duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Plus className="w-6 h-6 text-zinc-600" />
                    </div>
                    <CardTitle className="text-zinc-100">Blank Research</CardTitle>
                    <CardDescription className="text-zinc-500 mt-2">Start with a clean canvas and build your own structure from the ground up.</CardDescription>
                  </CardHeader>
                </Card>
              </button>

              {filteredTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => onSelect(template)}
                  className="group text-left"
                >
                  <Card className="h-full bg-zinc-900/50 border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-900/80 transition-all duration-300">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <div className="text-blue-400">
                          {getIcon(template.category)}
                        </div>
                      </div>
                      <CardTitle className="text-zinc-100">{template.name}</CardTitle>
                      <CardDescription className="text-zinc-500 mt-2">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">
                        <span className="px-2 py-0.5 bg-zinc-800 rounded">{template.nodes.length} Nodes</span>
                        {template.tasks && <span className="px-2 py-0.5 bg-zinc-800 rounded">{template.tasks.length} Tasks</span>}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-900 flex justify-end gap-3 bg-zinc-900/10">
          <Button variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-zinc-300">Cancel</Button>
          <Button onClick={() => onSelect(null)} className="bg-zinc-100 text-zinc-900 hover:bg-white">Start Blank Project</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
