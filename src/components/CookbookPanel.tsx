import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Search, 
  Terminal, 
  Lightbulb, 
  Code2, 
  ArrowRight, 
  Bookmark,
  Share2,
  Copy,
  Check,
  Filter,
  Layers,
  Zap,
  Globe,
  Settings,
  ExternalLink
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import { toast } from "sonner";

// --- Types ---
interface Recipe {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: "Prompting" | "Architecture" | "Deployment" | "Research";
  content: string;
  code?: string;
  colabUrl?: string;
  tags: string[];
}

// --- Data ---
const RECIPES: Recipe[] = [
  {
    id: "gemini-api-quickstart",
    title: "Gemini API Interactive Quickstart",
    description: "A hands-on notebook to explore the Gemini Pro models and multimodal capabilities.",
    difficulty: "Beginner",
    category: "Architecture",
    tags: ["LLM", "SDK", "Interactive"],
    content: "This guide provides a comprehensive introduction to the Gemini API. We cover text generation, vision-based reasoning, and structured output parsing.\n\nPrerequisites:\n1. A Google Cloud project with the Generative AI API enabled.\n2. An API key from Google AI Studio.\n\nRecommended Flow:\n- Setup & Authentication\n- Unimodal generation (Text-only)\n- Multimodal generation (Images + Text)\n- Configuration tuning (Temperature, Top-P).",
    colabUrl: "https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_started.ipynb",
    code: `// Initial SDK Setup
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });`
  },
  {
    id: "system-prompt-mastery",
    title: "The Immutable Core: System Prompting",
    description: "Learn how to anchor AI behavior using behavioral constraints and role-playing.",
    difficulty: "Beginner",
    category: "Prompting",
    tags: ["LLM", "Instruction Tuning"],
    content: "System prompts are the foundational layer of AI interaction. To ensure consistent output, avoid vague instructions like 'be helpful'. Instead, define a rigid operational boundary.\n\nKey Principles:\n1. Define Persona: 'You are a Senior Security Architect'.\n2. Set Guards: 'Never disclose internal schema'.\n3. Format Output: 'Always return valid JSON'.",
    code: `// Pattern: The Persona Anchor
"You are a Cortex Intelligence Node. 
Your output must follow YAML format strictly. 
Do not apologize. 
Objective: Analyze inputs for structural logic gaps."`
  },
  {
    id: "multi-agent-sync",
    title: "Multi-Agent Orchestration",
    description: "Designing a relay system where specialized agents hand over tasks.",
    difficulty: "Advanced",
    category: "Architecture",
    tags: ["Agents", "Workflow"],
    content: "Complex tasks shouldn't be handled by one prompt. Multi-agent systems use a 'Manager' agent to decompose a request into sub-tasks for 'Worker' agents.\n\nFlow:\n1. Router: Analyzes intent.\n2. specialized_agent_a: Handles technical specs.\n3. specialized_agent_b: Handles creative copy.\n4. Synthesizer: Combines outputs.",
    code: `// Multi-agent Router logic
const router = async (input) => {
  const intent = await llm.classify(input);
  if (intent === 'CODE') return codeAgent.invoke(input);
  if (intent === 'DATA') return analystAgent.invoke(input);
  return generalAgent.invoke(input);
}`
  },
  {
    id: "edge-deployment",
    title: "Quantization for Edge Devices",
    description: "Reducing model weight for mobile and embedded hardware.",
    difficulty: "Intermediate",
    category: "Deployment",
    tags: ["Hardware", "Optimization"],
    content: "Edge AI requires balancing accuracy and latency. Quantization (FP32 to INT8) can reduce model size by 4x with minimal accuracy loss.",
    code: `// Example: PyTorch Static Quantization
import torch.quantization
model.eval()
model.qconfig = torch.quantization.get_default_qconfig('fbgemm')
quantized_model = torch.quantization.prepare(model, inplace=False)`
  },
  {
    id: "synthetic-data-gen",
    title: "Synthetic Data Generation",
    description: "Creating high-quality datasets for fine-tuning using larger models.",
    difficulty: "Intermediate",
    category: "Research",
    tags: ["Fine-tuning", "Datasets"],
    content: "When real data is scarce or sensitive, use frontier models to generate diverse, high-entropy synthetic data. Use Rejection Sampling to maintain quality.",
    code: `// Logic: Recursive Generation
for (let i=0; i<100; i++) {
  const sample = await generator.invoke("Generate a unique edge case for API failure");
  const score = await evaluator.invoke(sample);
  if (score > 0.8) saveToDataset(sample);
}`
  }
];

export const CookbookPanel = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = Array.from(new Set(RECIPES.map(r => r.category)));
  
  const filteredRecipes = RECIPES.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
                         r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !selectedCategory || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedRecipe = RECIPES.find(r => r.id === selectedRecipeId);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex-none p-8 lg:px-12 border-b border-zinc-900 bg-zinc-900/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-600/10 flex items-center justify-center border border-orange-500/20 shadow-lg shadow-orange-500/5">
              <BookOpen className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">Intelligence Cookbook</h2>
              <p className="text-zinc-500 text-sm">Patterns, recipes, and guides for modern AI development.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
              <Input 
                placeholder="Search recipes..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-zinc-900/50 border-zinc-800 rounded-xl focus-visible:ring-orange-500/20 focus-visible:border-orange-500/50 h-10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-zinc-900 p-6 space-y-8 overflow-y-auto hidden md:block">
          <section className="space-y-3">
            <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3">Filter by Scope</h3>
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                selectedCategory === null ? "bg-orange-600/10 text-orange-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Layers className="w-4 h-4" />
              All Content
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all capitalize",
                  selectedCategory === cat ? "bg-orange-600/10 text-orange-400" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {cat === 'Prompting' && <Terminal className="w-4 h-4" />}
                {cat === 'Architecture' && <Zap className="w-4 h-4" />}
                {cat === 'Deployment' && <Globe className="w-4 h-4" />}
                {cat === 'Research' && <Settings className="w-4 h-4" />}
                {cat}
              </button>
            ))}
          </section>

          <section className="space-y-3">
            <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3">Trending</h3>
            <div className="space-y-1">
              {RECIPES.slice(0, 3).map(r => (
                <button 
                  key={r.id} 
                  onClick={() => setSelectedRecipeId(r.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-[11px] text-zinc-500 hover:text-orange-400 hover:bg-orange-600/5 transition-all truncate"
                >
                  # {r.title}
                </button>
              ))}
            </div>
          </section>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar bg-zinc-950/50">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {!selectedRecipeId ? (
                <motion.div 
                  key="grid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {filteredRecipes.map((recipe, idx) => (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card 
                        onClick={() => setSelectedRecipeId(recipe.id)}
                        className="group bg-zinc-900/30 border-zinc-800/50 hover:bg-zinc-900/60 hover:border-orange-500/30 transition-all cursor-pointer h-full flex flex-col relative overflow-hidden"
                      >
                         <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/5 to-transparent pointer-events-none" />
                        <CardHeader className="p-6">
                           <div className="flex items-center justify-between mb-4">
                              <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest",
                                recipe.difficulty === 'Beginner' ? "bg-green-600/10 text-green-500" :
                                recipe.difficulty === 'Intermediate' ? "bg-orange-600/10 text-orange-500" :
                                "bg-red-600/10 text-red-500"
                              )}>
                                {recipe.difficulty}
                              </span>
                              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">{recipe.category}</span>
                           </div>
                           <CardTitle className="text-lg text-zinc-100 group-hover:text-orange-400 transition-colors flex items-start justify-between gap-2">
                             {recipe.title}
                             {recipe.colabUrl && (
                               <div className="bg-blue-600/10 p-1 rounded border border-blue-500/20 shrink-0" title="Colab Support">
                                 <Globe className="w-3 h-3 text-blue-500" />
                               </div>
                             )}
                           </CardTitle>
                           <CardDescription className="text-zinc-500 line-clamp-2 mt-2 leading-relaxed">
                              {recipe.description}
                           </CardDescription>
                        </CardHeader>
                        <CardContent className="px-6 pb-6 mt-auto">
                           <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-800/50">
                              {recipe.tags.map(tag => (
                                <span key={tag} className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded capitalize">
                                  {tag}
                                </span>
                              ))}
                           </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                selectedRecipe && (
                  <motion.div
                    key="recipe"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center justify-between mb-8">
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedRecipeId(null)}
                        className="text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900"
                       >
                         <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Cookbook
                       </Button>
                       <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg border-zinc-800 text-zinc-500 hover:text-orange-400">
                             <Bookmark className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg border-zinc-800 text-zinc-500 hover:text-orange-400">
                             <Share2 className="w-4 h-4" />
                          </Button>
                       </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.3em]">{selectedRecipe.category}</span>
                           <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{selectedRecipe.difficulty}</span>
                        </div>
                        <h1 className="text-4xl font-bold text-zinc-100 tracking-tight leading-tight">
                          {selectedRecipe.title}
                        </h1>
                        {selectedRecipe.colabUrl && (
                          <div className="pt-2">
                            <Button 
                              onClick={() => window.open(selectedRecipe.colabUrl, '_blank')}
                              className="bg-[#F9AB00] hover:bg-[#E39A00] text-black font-bold h-9 px-4 rounded-xl flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Open in Colab
                            </Button>
                          </div>
                        )}
                      </div>

                      <p className="text-xl text-zinc-400 leading-relaxed font-light">
                        {selectedRecipe.description}
                      </p>

                      <div className="prose prose-invert max-w-none">
                        <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-2xl space-y-6">
                          <h4 className="flex items-center gap-2 text-zinc-100 font-bold uppercase tracking-widest text-xs">
                             <Lightbulb className="w-4 h-4 text-orange-500" /> Executive Guide
                          </h4>
                          <div className="text-zinc-400 leading-relaxed whitespace-pre-wrap">
                            {selectedRecipe.content}
                          </div>
                        </div>
                      </div>

                      {selectedRecipe.code && (
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Code2 className="w-4 h-4" /> Pattern Implementation
                              </h4>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-[10px] text-zinc-500 hover:text-zinc-100"
                                onClick={() => handleCopyCode(selectedRecipe.code!, selectedRecipe.id)}
                              >
                                {copiedId === selectedRecipe.id ? <Check className="w-3 h-3 mr-2 text-green-500" /> : <Copy className="w-3 h-3 mr-2" />}
                                {copiedId === selectedRecipe.id ? "Copied" : "Copy Source"}
                              </Button>
                           </div>
                           <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 font-mono text-sm group relative">
                              <pre className="text-orange-400/90 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                                {selectedRecipe.code}
                              </pre>
                           </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-12 border-t border-zinc-900 mt-12 flex items-center justify-between text-zinc-600">
                       <p className="text-[10px] uppercase font-bold tracking-widest italic">Cortex Alpha Documentation v0.4.12</p>
                       <p className="text-[10px] uppercase font-bold tracking-widest">Modified: April 2026</p>
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};
