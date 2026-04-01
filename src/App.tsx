/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "./components/Sidebar";
import { CommandBar } from "./components/CommandBar";
import { ResearchNodeCard } from "./components/ResearchNodeCard";
import { Project, ResearchNode } from "./types";
import { generateResearchResponse } from "./lib/gemini";
import { Toaster, toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem("radial_projects");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved projects", e);
      }
    }
    return [{
      id: "default",
      name: "General Research",
      createdAt: Date.now(),
      nodes: []
    }];
  });
  
  const [activeProjectId, setActiveProjectId] = useState<string>("default");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("radial_projects", JSON.stringify(projects));
  }, [projects]);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId), 
    [projects, activeProjectId]
  );

  const handleSend = async (query: string) => {
    if (!activeProject) return;

    const userNode: ResearchNode = {
      id: Math.random().toString(36).substring(7),
      type: 'query',
      content: query,
      timestamp: Date.now(),
      priority: 'medium',
    };

    setProjects(prev => prev.map(p => 
      p.id === activeProjectId 
        ? { ...p, nodes: [...p.nodes, userNode] }
        : p
    ));

    setIsLoading(true);
    try {
      const history = activeProject.nodes.map(n => ({
        role: n.type === 'query' ? 'user' : 'model',
        parts: [{ text: n.content }]
      }));

      const response = await generateResearchResponse(query, history);
      
      const aiNode: ResearchNode = {
        id: Math.random().toString(36).substring(7),
        type: 'synthesis',
        content: response.text,
        timestamp: Date.now(),
        sources: response.sources,
        priority: 'medium',
      };

      setProjects(prev => prev.map(p => 
        p.id === activeProjectId 
          ? { ...p, nodes: [...p.nodes, aiNode] }
          : p
      ));
    } catch (error) {
      console.error("Research Error:", error);
      toast.error("Failed to generate research response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewProject = () => {
    const newProject: Project = {
      id: Math.random().toString(36).substring(7),
      name: `New Research ${projects.length + 1}`,
      createdAt: Date.now(),
      nodes: []
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    toast.success("New project created");
  };

  const handleSummarize = async (project: Project) => {
    if (project.nodes.length === 0) return;
    
    setIsLoading(true);
    toast.info(`Summarizing ${project.name}...`);
    
    try {
      const history = project.nodes.map(n => ({
        role: n.type === 'query' ? 'user' : 'model',
        parts: [{ text: n.content }]
      }));

      const prompt = "Please provide a concise executive summary of this research project so far. Highlight key findings and remaining questions.";
      const response = await generateResearchResponse(prompt, history);
      
      const summaryNode: ResearchNode = {
        id: Math.random().toString(36).substring(7),
        type: 'thought',
        content: `EXECUTIVE SUMMARY:\n\n${response.text}`,
        timestamp: Date.now(),
        sources: response.sources,
        priority: 'high',
      };

      setProjects(prev => prev.map(p => 
        p.id === project.id 
          ? { ...p, nodes: [...p.nodes, summaryNode] }
          : p
      ));
      
      setActiveProjectId(project.id);
      toast.success("Summary generated");
    } catch (error) {
      console.error("Summary Error:", error);
      toast.error("Failed to generate summary.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePriority = (nodeId: string, priority: 'low' | 'medium' | 'high') => {
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId 
        ? { 
            ...p, 
            nodes: p.nodes.map(n => n.id === nodeId ? { ...n, priority } : n) 
          }
        : p
    ));
    toast.success(`Priority updated to ${priority}`);
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
        <Sidebar 
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={setActiveProjectId}
          onNewProject={handleNewProject}
          onSummarize={handleSummarize}
        />
        
        <main className="flex-1 relative flex flex-col overflow-hidden">
          <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-md z-10">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-medium text-zinc-400">
                Projects / <span className="text-zinc-100">{activeProject?.name}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-zinc-500 font-mono">GEMINI-3.1-PRO</span>
            </div>
          </header>

          <ScrollArea className="flex-1 px-8 py-12">
            <div className="max-w-3xl mx-auto">
              <AnimatePresence mode="popLayout">
                {!activeProject || activeProject.nodes.length === 0 ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <div className="h-16 w-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4">
                      <Sparkles className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-200">Start your research</h3>
                    <p className="text-zinc-500 max-w-sm">
                      Ask a complex question or provide a topic to begin synthesizing information with AI.
                    </p>
                  </motion.div>
                ) : (
                  activeProject.nodes.map((node: ResearchNode) => (
                    <div key={node.id}>
                      <ResearchNodeCard 
                        node={node} 
                        onUpdatePriority={(priority) => handleUpdatePriority(node.id, priority)}
                      />
                    </div>
                  ))
                )}
              </AnimatePresence>
              <div className="h-32" /> {/* Spacer for command bar */}
            </div>
          </ScrollArea>

          <CommandBar onSend={handleSend} isLoading={isLoading} />
        </main>

        <Toaster position="top-right" theme="dark" />
      </div>
    </TooltipProvider>
  );
}

