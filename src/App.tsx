/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "./components/Sidebar";
import { CommandBar } from "./components/CommandBar";
import { ResearchNodeCard } from "./components/ResearchNodeCard";
import { CanvasView } from "./components/CanvasView";
import { Project, ResearchNode, Priority } from "./types";
import { generateResearchResponse } from "./lib/gemini";
import { Toaster, toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, LayoutList, LayoutGrid, Check, Loader2 } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [viewMode, setViewMode] = useState<'list' | 'canvas'>('list');
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      localStorage.setItem("radial_projects", JSON.stringify(projects));
      setSaveStatus('saved');
    }, 500);
    return () => clearTimeout(timer);
  }, [projects]);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId), 
    [projects, activeProjectId]
  );

  const filteredNodes = useMemo(() => {
    if (!activeProject) return [];
    if (!chatSearchQuery.trim()) return activeProject.nodes;
    return activeProject.nodes.filter(n => 
      n.content.toLowerCase().includes(chatSearchQuery.toLowerCase())
    );
  }, [activeProject, chatSearchQuery]);

  const handleSend = async (query: string) => {
    if (!activeProject) return;

      const userNode: ResearchNode = {
        id: Math.random().toString(36).substring(7),
        type: 'query',
        content: query,
        timestamp: Date.now(),
        priority: 'medium',
        position: { x: 100, y: 100 + activeProject.nodes.length * 150 }
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
        position: { x: 500, y: 100 + activeProject.nodes.length * 150 }
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
        position: { x: 300, y: 50 }
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

  const handleUpdatePriority = (nodeId: string, priority: Priority) => {
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

  const handleDeleteNode = (nodeId: string) => {
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId 
        ? { ...p, nodes: p.nodes.filter(n => n.id !== nodeId) }
        : p
    ));
    toast.success("Node deleted");
  };

  const handleEditNode = (nodeId: string, content: string) => {
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId 
        ? { 
            ...p, 
            nodes: p.nodes.map(n => n.id === nodeId ? { ...n, content, updatedAt: Date.now() } : n) 
          }
        : p
    ));
    toast.success("Node updated");
  };

  const handleUpdatePosition = (nodeId: string, x: number, y: number) => {
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId 
        ? { 
            ...p, 
            nodes: p.nodes.map(n => n.id === nodeId ? { ...n, position: { x, y } } : n) 
          }
        : p
    ));
  };

  const handleAddConnection = (fromId: string, toId: string) => {
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId 
        ? { 
            ...p, 
            connections: [...(p.connections || []), { id: Math.random().toString(36).substring(7), fromId, toId }] 
          }
        : p
    ));
    toast.success("Connection added");
  };

  const handleDeleteConnection = (connectionId: string) => {
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId 
        ? { 
            ...p, 
            connections: (p.connections || []).filter(c => c.id !== connectionId) 
          }
        : p
    ));
    toast.success("Connection removed");
  };

  const handleRenameProject = (projectId: string, name: string) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, name } : p
    ));
    toast.success("Project renamed");
  };

  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) {
      toast.error("Cannot delete the only project");
      return;
    }
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(projects.find(p => p.id !== projectId)?.id || "default");
    }
    toast.success("Project deleted");
  };

  const handleExportMarkdown = () => {
    if (!activeProject) return;
    
    const content = activeProject.nodes.map(node => {
      const date = new Date(node.timestamp).toLocaleString();
      const priority = node.priority ? ` [Priority: ${node.priority.toUpperCase()}]` : '';
      const sources = node.sources?.map(s => `- [${s.title}](${s.url})`).join('\n') || '';
      
      return `### ${node.type.toUpperCase()} (${date})${priority}\n\n${node.content}\n\n${sources ? `**Sources:**\n${sources}\n` : ''}\n---`;
    }).join('\n\n');

    const blob = new Blob([`# ${activeProject.name}\n\n${content}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name.replace(/\s+/g, '_')}_research.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Research exported to Markdown");
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
          onRenameProject={handleRenameProject}
          onDeleteProject={handleDeleteProject}
          onExport={handleExportMarkdown}
          chatSearchQuery={chatSearchQuery}
          onChatSearchChange={setChatSearchQuery}
        />
        
        <main className="flex-1 relative flex flex-col overflow-hidden">
          <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-md z-10">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-medium text-zinc-400">
                Projects / <span className="text-zinc-100">{activeProject?.name}</span>
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800/50 text-[10px] font-medium text-zinc-500 outline-none hover:bg-zinc-900 transition-colors">
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                      <span className="uppercase tracking-wider">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="uppercase tracking-wider">Autosaved</span>
                    </>
                  )}
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-400">
                  Your changes are automatically saved to local storage
                </TooltipContent>
              </Tooltip>

              <div className="flex items-center bg-zinc-900 rounded-lg p-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setViewMode('list')}
                  className={cn("h-7 px-3 text-xs rounded-md", viewMode === 'list' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <LayoutList className="mr-2 h-3.5 w-3.5" /> List
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setViewMode('canvas')}
                  className={cn("h-7 px-3 text-xs rounded-md", viewMode === 'canvas' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <LayoutGrid className="mr-2 h-3.5 w-3.5" /> Canvas
                </Button>
              </div>
              <div className="h-4 w-px bg-zinc-800" />
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-zinc-500 font-mono uppercase">Gemini 3.1 Pro</span>
              </div>
            </div>
          </header>

          <div className="flex-1 relative">
            {viewMode === 'list' ? (
              <ScrollArea className="h-full px-8 py-12">
                <div className="max-w-3xl mx-auto">
                  <AnimatePresence mode="popLayout">
                    {filteredNodes.length === 0 ? (
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
                        <h3 className="text-xl font-semibold text-zinc-200">
                          {chatSearchQuery ? "No matching nodes" : "Start your research"}
                        </h3>
                        <p className="text-zinc-500 max-w-sm">
                          {chatSearchQuery 
                            ? `No results found for "${chatSearchQuery}" in this project.`
                            : "Ask a complex question or provide a topic to begin synthesizing information with AI."}
                        </p>
                      </motion.div>
                    ) : (
                      filteredNodes.map((node: ResearchNode) => (
                        <div key={node.id}>
                          <ResearchNodeCard 
                            node={node} 
                            onUpdatePriority={(priority) => handleUpdatePriority(node.id, priority)}
                            onDelete={() => handleDeleteNode(node.id)}
                            onEdit={(content) => handleEditNode(node.id, content)}
                          />
                        </div>
                      ))
                    )}
                  </AnimatePresence>
                  <div className="h-32" /> {/* Spacer for command bar */}
                </div>
              </ScrollArea>
            ) : (
              <CanvasView 
                nodes={filteredNodes}
                connections={activeProject?.connections || []}
                onUpdatePriority={handleUpdatePriority}
                onDelete={handleDeleteNode}
                onEdit={handleEditNode}
                onUpdatePosition={handleUpdatePosition}
                onAddConnection={handleAddConnection}
                onDeleteConnection={handleDeleteConnection}
              />
            )}
          </div>

          <CommandBar onSend={handleSend} isLoading={isLoading} />
        </main>

        <Toaster position="top-right" theme="dark" />
      </div>
    </TooltipProvider>
  );
}

