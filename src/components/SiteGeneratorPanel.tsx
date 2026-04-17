import { useState } from "react";
import { Project, SitePage } from "../types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Sparkles, 
  ExternalLink, 
  Loader2, 
  Home, 
  Users, 
  CreditCard, 
  LayoutDashboard,
  Code
} from "lucide-react";
import { generateSiteContent } from "../lib/gemini";
import Markdown from "react-markdown";
import { toast } from "sonner";

export function SiteGeneratorPanel({ 
  project, 
  onSavePage 
}: { 
  project: Project, 
  onSavePage: (page: SitePage) => void 
}) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<SitePage | null>(null);

  const pageTypes: SitePage['type'][] = ['home', 'about', 'pricing', 'dashboard'];

  const getIcon = (type: string) => {
    switch(type) {
      case 'home': return <Home className="h-4 w-4" />;
      case 'about': return <Users className="h-4 w-4" />;
      case 'pricing': return <CreditCard className="h-4 w-4" />;
      case 'dashboard': return <LayoutDashboard className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleGenerate = async (type: SitePage['type']) => {
    if (!project.businessMemory?.businessName) {
      toast.error("Please configure Business Memory first!");
      return;
    }

    setIsGenerating(type);
    try {
      const content = await generateSiteContent(type, project.businessMemory);
      const newPage: SitePage = {
        id: Math.random().toString(36).substring(7),
        type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Page`,
        content,
        status: 'draft'
      };
      onSavePage(newPage);
      setSelectedPage(newPage);
      toast.success(`${type} page generated and saved to memory.`);
    } catch (e) {
      toast.error("Failed to generate page content.");
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="flex h-full gap-6 p-6 overflow-hidden">
      {/* Left Column: Page Selection */}
      <div className="w-64 space-y-4 shrink-0 overflow-y-auto">
        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          <Code className="h-5 w-5 text-blue-400" /> Site Blueprint
        </h2>
        <div className="space-y-2">
          {pageTypes.map((type) => {
            const existingPage = project.sitePages?.find(p => p.type === type);
            return (
              <Card 
                key={type}
                className={`p-4 cursor-pointer transition-all hover:border-blue-500/50 bg-zinc-900 border-zinc-800 ${selectedPage?.type === type ? 'ring-2 ring-blue-500/30 border-blue-500/50' : ''}`}
                onClick={() => existingPage && setSelectedPage(existingPage)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-zinc-300 font-medium capitalize">
                    {getIcon(type)} {type}
                  </div>
                  {existingPage ? (
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Saved</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-zinc-800 text-zinc-500 border-zinc-700">Empty</Badge>
                  )}
                </div>
                
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerate(type);
                  }}
                  disabled={!!isGenerating}
                  variant={existingPage ? "outline" : "default"}
                  className={`w-full h-8 text-xs ${!existingPage ? 'bg-blue-600 hover:bg-blue-500' : ''}`}
                >
                  {isGenerating === type ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <><Sparkles className="h-3 w-3 mr-2" /> {existingPage ? "Regenerate" : "Generate"}</>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Right Column: Preview Area */}
      <div className="flex-1 bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col">
        {selectedPage ? (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <h3 className="font-medium text-zinc-200">{selectedPage.title}</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs gap-2">
                   <ExternalLink className="h-3 w-3" /> Preview Live
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 selection:bg-blue-500/20">
              <div className="max-w-3xl mx-auto prose prose-invert prose-blue">
                <Markdown>{selectedPage.content}</Markdown>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
            <div className="p-4 bg-zinc-800/50 rounded-full">
              <Sparkles className="h-8 w-8 text-zinc-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-zinc-300">No Content Selected</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                Generate a page blueprint using our high-thinking AI mode, aware of your business memory.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
