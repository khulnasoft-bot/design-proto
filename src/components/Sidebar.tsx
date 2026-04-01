import { useState, useMemo } from "react";
import { Project } from "@/src/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Folder, Clock, Settings, Search, Sparkles, X } from "lucide-react";

export function Sidebar({ 
  projects, 
  activeProjectId, 
  onSelectProject, 
  onNewProject,
  onSummarize
}: { 
  projects: Project[]; 
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onSummarize: (project: Project) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  return (
    <div className="w-64 h-screen border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0">
      <div className="px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Search className="h-4 w-4 text-white" />
          </div>
          <h1 className="font-bold text-zinc-100 tracking-tight text-lg">RADIAL</h1>
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={onNewProject}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-none rounded-xl h-11 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="pl-9 pr-8 h-9 bg-zinc-900/50 border-zinc-800 focus:border-blue-500/50 focus:ring-0 text-xs rounded-lg placeholder:text-zinc-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-3 mb-4">
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Projects</h2>
            {searchQuery && (
              <span className="text-[10px] text-zinc-600 font-medium">
                {filteredProjects.length} found
              </span>
            )}
          </div>
          
          {filteredProjects.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-xs text-zinc-600">No projects found</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id} className="group relative">
                <button
                  onClick={() => onSelectProject(project.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    activeProjectId === project.id 
                      ? "bg-zinc-800 text-zinc-100 shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                  }`}
                >
                  <Folder className={`h-4 w-4 transition-colors ${activeProjectId === project.id ? "text-blue-400" : "group-hover:text-zinc-400"}`} />
                  <span className="truncate text-left font-medium flex-1">{project.name}</span>
                </button>
                {project.nodes.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSummarize(project);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-blue-400 transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="px-6 py-6 border-t border-zinc-900 space-y-1.5">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 transition-all group">
          <Clock className="h-4 w-4 group-hover:text-zinc-400 transition-colors" />
          <span className="font-medium">Recent</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 transition-all group">
          <Settings className="h-4 w-4 group-hover:text-zinc-400 transition-colors" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
