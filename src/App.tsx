/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "./components/Sidebar";
import { CommandBar } from "./components/CommandBar";
import { ResearchNodeCard } from "./components/ResearchNodeCard";
import { CanvasView } from "./components/CanvasView";
import { BusinessMemoryPanel } from "./components/BusinessMemoryPanel";
import { SiteGeneratorPanel } from "./components/SiteGeneratorPanel";
import { Project, ResearchNode, Priority, BusinessMemory, SitePage, Connection } from "./types";
import { generateResearchResponse } from "./lib/gemini";
import { Toaster, toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, LayoutList, LayoutGrid, Check, Loader2, LogIn, User as UserIcon } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Brain, Globe } from "lucide-react";
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  where,
  deleteDoc,
  handleFirestoreError,
  OperationType,
  User
} from "./lib/firebase";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'canvas' | 'memory' | 'site'>('list');
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Projects Listener
  useEffect(() => {
    if (!user || !isAuthReady) {
      setProjects([]);
      return;
    }

    const q = query(collection(db, "projects"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      
      setProjects(projectsData);
      
      // Select first project if none selected
      if (projectsData.length > 0 && !activeProjectId) {
        setActiveProjectId(projectsData[0].id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "projects");
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId), 
    [projects, activeProjectId]
  );

  const filteredNodes = useMemo(() => {
    if (!activeProject) return [];
    const nodes = activeProject.nodes || [];
    if (!chatSearchQuery.trim()) return nodes;
    return nodes.filter(n => 
      n.content.toLowerCase().includes(chatSearchQuery.toLowerCase())
    );
  }, [activeProject, chatSearchQuery]);

  const saveProject = async (project: Project) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const projectRef = doc(db, "projects", project.id);
      await setDoc(projectRef, {
        ...project,
        userId: user.uid,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${project.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Successfully logged in");
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error?.code === 'auth/cancelled-popup-request') {
        toast.info("Login already in progress...");
      } else if (error?.code === 'auth/popup-closed-by-user') {
        toast.error("Login window was closed.");
      } else {
        toast.error("Failed to login with Google");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSend = async (query: string) => {
    if (!activeProject || !user) return;

    const userNode: ResearchNode = {
      id: Math.random().toString(36).substring(7),
      type: 'query',
      content: query,
      timestamp: Date.now(),
      priority: 'medium',
      position: { x: 100, y: 100 + (activeProject.nodes?.length || 0) * 150 }
    };

    const updatedProject = {
      ...activeProject,
      nodes: [...(activeProject.nodes || []), userNode]
    };
    
    await saveProject(updatedProject);

    setIsLoading(true);
    try {
      const history = (activeProject.nodes || []).map(n => ({
        role: n.type === 'query' ? 'user' : 'model',
        parts: [{ text: n.content }]
      }));

      const response = await generateResearchResponse(
      query, 
      history, 
      activeProject.businessMemory,
      query.length > 100 // Auto-enable thinking for long queries
    );
      
      const aiNode: ResearchNode = {
        id: Math.random().toString(36).substring(7),
        type: 'synthesis',
        content: response.text,
        timestamp: Date.now(),
        sources: response.sources,
        priority: 'medium',
        position: { x: 500, y: 100 + updatedProject.nodes.length * 150 }
      };

      await saveProject({
        ...updatedProject,
        nodes: [...updatedProject.nodes, aiNode]
      });
    } catch (error) {
      console.error("Research Error:", error);
      toast.error("Failed to generate research response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewProject = async () => {
    if (!user) return;
    const newId = Math.random().toString(36).substring(7);
    const newProject: Project = {
      id: newId,
      name: `New Research ${projects.length + 1}`,
      createdAt: Date.now(),
      nodes: []
    };
    
    try {
      await saveProject(newProject);
      setActiveProjectId(newId);
      toast.success("New project created");
    } catch (e) {
      toast.error("Failed to create project");
    }
  };

  const handleSummarize = async (project: Project) => {
    if (!project.nodes || project.nodes.length === 0) return;
    
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

      await saveProject({
        ...project,
        nodes: [...project.nodes, summaryNode]
      });
      
      setActiveProjectId(project.id);
      toast.success("Summary generated");
    } catch (error) {
      console.error("Summary Error:", error);
      toast.error("Failed to generate summary.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePriority = async (nodeId: string, priority: Priority) => {
    if (!activeProject) return;
    const updatedProject = {
      ...activeProject,
      nodes: activeProject.nodes.map(n => n.id === nodeId ? { ...n, priority } : n)
    };
    await saveProject(updatedProject);
    toast.success(`Priority updated to ${priority}`);
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!activeProject) return;
    const updatedProject = {
      ...activeProject,
      nodes: activeProject.nodes.filter(n => n.id !== nodeId)
    };
    await saveProject(updatedProject);
    toast.success("Node deleted");
  };

  const handleDeleteNodes = async (nodeIds: string[]) => {
    if (!activeProject || nodeIds.length === 0) return;
    const updatedProject = {
      ...activeProject,
      nodes: activeProject.nodes.filter(n => !nodeIds.includes(n.id)),
      // Also clean up connections associated with these nodes
      connections: (activeProject.connections || []).filter(c => 
        !nodeIds.includes(c.fromId) && !nodeIds.includes(c.toId)
      )
    };
    await saveProject(updatedProject);
    toast.success(`${nodeIds.length} nodes deleted`);
  };

  const handleEditNode = async (nodeId: string, content: string) => {
    if (!activeProject) return;
    const updatedProject = {
      ...activeProject,
      nodes: activeProject.nodes.map(n => n.id === nodeId ? { ...n, content, updatedAt: Date.now() } : n)
    };
    await saveProject(updatedProject);
    toast.success("Node updated");
  };

  const handleUpdatePosition = async (nodeId: string, x: number, y: number) => {
    if (!activeProject) return;
    const updatedProject = {
      ...activeProject,
      nodes: (activeProject.nodes || []).map(n => n.id === nodeId ? { ...n, position: { x, y } } : n)
    };
    await saveProject(updatedProject);
  };

  const handleUpdateNodes = async (updatedNodes: ResearchNode[]) => {
    if (!activeProject) return;
    const updatedProject = {
      ...activeProject,
      nodes: (activeProject.nodes || []).map(n => {
        const updated = updatedNodes.find(un => un.id === n.id);
        return updated ? updated : n;
      })
    };
    await saveProject(updatedProject);
  };

  const handleSaveBusinessMemory = async (memory: BusinessMemory) => {
    if (!activeProject) return;
    await saveProject({
      ...activeProject,
      businessMemory: memory
    });
  };

  const handleSaveSitePage = async (page: SitePage) => {
    if (!activeProject) return;
    const existingPages = activeProject.sitePages || [];
    const updatedPages = existingPages.find(p => p.type === page.type)
      ? existingPages.map(p => p.type === page.type ? page : p)
      : [...existingPages, page];
    
    await saveProject({
      ...activeProject,
      sitePages: updatedPages
    });
  };

  const handleAddConnection = async (fromId: string, toId: string) => {
    if (!activeProject) return;
    const updatedProject = {
      ...activeProject,
      connections: [...(activeProject.connections || []), { id: Math.random().toString(36).substring(7), fromId, toId }]
    };
    await saveProject(updatedProject);
    toast.success("Connection added");
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!activeProject) return;
    const updatedProject = {
      ...activeProject,
      connections: (activeProject.connections || []).filter(c => c.id !== connectionId)
    };
    await saveProject(updatedProject);
    toast.success("Connection removed");
  };

  const handleUpdateConnection = async (connectionId: string, updates: Partial<Connection>) => {
    if (!activeProject) return;
    const updatedProject = {
      ...activeProject,
      connections: (activeProject.connections || []).map(c => 
        c.id === connectionId ? { ...c, ...updates } : c
      )
    };
    await saveProject(updatedProject);
  };

  const handleRenameProject = async (projectId: string, name: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      await saveProject({ ...project, name });
      toast.success("Project renamed");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (projects.length <= 1) {
      toast.error("Cannot delete the only project");
      return;
    }
    
    try {
      await deleteDoc(doc(db, "projects", projectId));
      if (activeProjectId === projectId) {
        setActiveProjectId(projects.find(p => p.id !== projectId)?.id || null);
      }
      toast.success("Project deleted");
    } catch (e) {
      toast.error("Failed to delete project");
    }
  };

  const handleExportMarkdown = () => {
    if (!activeProject) return;
    
    const content = (activeProject.nodes || []).map(node => {
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

  const handleCanvasAddNode = async (x: number, y: number) => {
    if (!activeProject || !user) return;
    const newNode: ResearchNode = {
      id: Math.random().toString(36).substring(7),
      type: 'thought',
      content: "New idea...",
      timestamp: Date.now(),
      priority: 'low',
      position: { x, y }
    };
    await saveProject({
      ...activeProject,
      nodes: [...(activeProject.nodes || []), newNode]
    });
    toast.success("New node added");
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Initialising Workspace...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8">
          <div className="h-20 w-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20 rotate-12">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white">Radial Research</h1>
            <p className="text-zinc-500">Sign in to sync your research across devices and access production-grade AI tools.</p>
          </div>
          <Button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl h-14 text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoggingIn ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-5 w-5" />
            )}
            {isLoggingIn ? "Connecting..." : "Sign in with Google"}
          </Button>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">
            Powered by Gemini 3.1 & Firebase Cloud
          </p>
        </div>
      </div>
    );
  }

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
                Projects / <span className="text-zinc-100">{activeProject?.name || "No Project Selected"}</span>
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pr-4 border-r border-zinc-900">
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500 font-medium truncate max-w-[120px] leading-tight">
                    {user.displayName || user.email}
                  </p>
                  <button 
                    onClick={() => auth.signOut()}
                    className="text-[9px] text-zinc-600 hover:text-zinc-400 uppercase tracking-tighter"
                  >
                    Log Out
                  </button>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="h-8 w-8 rounded-full border border-zinc-800" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <UserIcon className="h-4 w-4 text-zinc-600" />
                  </div>
                )}
              </div>

              <Tooltip>
                <TooltipTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800/50 text-[10px] font-medium text-zinc-500 outline-none hover:bg-zinc-900 transition-colors">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                      <span className="uppercase tracking-wider">Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="uppercase tracking-wider">Cloud Synced</span>
                    </>
                  )}
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-400">
                  Your changes are automatically synced to Firebase Cloud
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setViewMode('memory')}
                  className={cn("h-7 px-3 text-xs rounded-md", viewMode === 'memory' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <Brain className="mr-2 h-3.5 w-3.5" /> Identity
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setViewMode('site')}
                  className={cn("h-7 px-3 text-xs rounded-md", viewMode === 'site' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <Globe className="mr-2 h-3.5 w-3.5" /> Site
                </Button>
              </div>
              <div className="h-4 w-px bg-zinc-800" />
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-zinc-500 font-mono uppercase">Gemini 3.1 Pro</span>
              </div>
            </div>
          </header>

          <div className="flex-1 relative overflow-hidden">
            {viewMode === 'list' && (
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
                          {chatSearchQuery ? "No matching nodes" : (activeProject ? "Start your research" : "Select or create a project")}
                        </h3>
                        <p className="text-zinc-500 max-w-sm">
                          {!activeProject 
                            ? "Navigate to the sidebar to choose a workspace or create a new one to begin."
                            : chatSearchQuery 
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
            )}

            {viewMode === 'canvas' && (
              <CanvasView 
                nodes={filteredNodes}
                connections={activeProject?.connections || []}
                onUpdatePriority={handleUpdatePriority}
                onDelete={handleDeleteNode}
                onDeleteNodes={handleDeleteNodes}
                onEdit={handleEditNode}
                onUpdatePosition={handleUpdatePosition}
                onUpdateNodes={handleUpdateNodes}
                onAddConnection={handleAddConnection}
                onDeleteConnection={handleDeleteConnection}
                onUpdateConnection={handleUpdateConnection}
                onBrainstorm={handleSend}
                onSummarize={() => activeProject && handleSummarize(activeProject)}
                onAddNode={handleCanvasAddNode}
              />
            )}

            {viewMode === 'memory' && activeProject && (
              <BusinessMemoryPanel 
                project={activeProject}
                onSave={handleSaveBusinessMemory}
              />
            )}

            {viewMode === 'site' && activeProject && (
              <SiteGeneratorPanel 
                project={activeProject}
                onSavePage={handleSaveSitePage}
              />
            )}
          </div>

          {(viewMode === 'list' || viewMode === 'canvas') && (
            <CommandBar onSend={handleSend} isLoading={isLoading || isSaving} />
          )}
        </main>

        <Toaster position="top-right" theme="dark" />
      </div>
    </TooltipProvider>
  );
}

