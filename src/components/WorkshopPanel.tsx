import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Gamepad2, 
  FileText, 
  Cpu, 
  ChevronRight, 
  Box, 
  Zap, 
  Play, 
  RotateCcw,
  Bot,
  Layers,
  Sparkles,
  Info
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { cn } from "../lib/utils";

// --- Types ---
interface Workshop {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: "Gaming" | "Content" | "Edge AI";
  component: React.ReactNode;
}

// --- Specific Workshop Components ---

/**
 * 1. Intelligent Agent Workshop: Grid Navigator
 * A simple agent that uses a heuristic to find a goal.
 */
const AgentWorkshop = () => {
  const [gridSize] = useState(8);
  const [agentPos, setAgentPos] = useState({ x: 0, y: 0 });
  const [goalPos] = useState({ x: 7, y: 7 });
  const [obstacles] = useState([{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 4 }, { x: 4, y: 5 }]);
  const [steps, setSteps] = useState(0);
  const [isMoving, setIsMoving] = useState(false);

  const reset = () => {
    setAgentPos({ x: 0, y: 0 });
    setSteps(0);
    setIsMoving(false);
  };

  const moveAgent = () => {
    if (agentPos.x === goalPos.x && agentPos.y === goalPos.y) {
      setIsMoving(false);
      return;
    }

    setAgentPos(prev => {
      const dx = goalPos.x - prev.x;
      const dy = goalPos.y - prev.y;

      let nextX = prev.x;
      let nextY = prev.y;

      // Simple greedy logic with obstacle avoidance attempt
      if (Math.abs(dx) > Math.abs(dy)) {
        nextX += dx > 0 ? 1 : -1;
      } else {
        nextY += dy > 0 ? 1 : -1;
      }

      // If next is obstacle, try the other direction
      if (obstacles.some(o => o.x === nextX && o.y === nextY)) {
        if (Math.abs(dx) > Math.abs(dy)) {
          nextX = prev.x;
          nextY += dy > 0 ? 1 : -1;
          if (dy === 0) nextY += 1; // force move if equal
        } else {
          nextY = prev.y;
          nextX += dx > 0 ? 1 : -1;
          if (dx === 0) nextX += 1;
        }
      }
      
      // Boundary checks
      nextX = Math.max(0, Math.min(gridSize - 1, nextX));
      nextY = Math.max(0, Math.min(gridSize - 1, nextY));

      return { x: nextX, y: nextY };
    });
    setSteps(s => s + 1);
  };

  React.useEffect(() => {
    let interval: any;
    if (isMoving) {
      interval = setInterval(moveAgent, 300);
    }
    return () => clearInterval(interval);
  }, [isMoving, agentPos]);

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Autonomous Agent Simulation</h4>
            <p className="text-xs text-zinc-500">Visualizing pathfinding and obstacle avoidance.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={reset}>
               <RotateCcw className="w-3.5 h-3.5 mr-2" /> Reset
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500" onClick={() => setIsMoving(!isMoving)}>
               {isMoving ? <RotateCcw className="w-3.5 h-3.5 mr-2" /> : <Play className="w-3.5 h-3.5 mr-2" />}
               {isMoving ? "Pause" : "Start Agent"}
            </Button>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="grid grid-cols-8 gap-1 bg-zinc-950 p-2 rounded-lg border border-zinc-800 shadow-inner">
            {Array.from({ length: gridSize * gridSize }).map((_, i) => {
              const x = i % gridSize;
              const y = Math.floor(i / gridSize);
              const isAgent = agentPos.x === x && agentPos.y === y;
              const isGoal = goalPos.x === x && goalPos.y === y;
              const isObstacle = obstacles.some(o => o.x === x && o.y === y);

              return (
                <div 
                  key={i} 
                  className={cn(
                    "w-10 h-10 rounded shadow-sm transition-all duration-300 flex items-center justify-center",
                    isAgent ? "bg-blue-600 scale-110 shadow-lg shadow-blue-500/20" : 
                    isGoal ? "bg-green-600 animate-pulse" : 
                    isObstacle ? "bg-zinc-800" : "bg-zinc-900/30"
                  )}
                >
                  {isAgent && <Bot className="w-5 h-5 text-white" />}
                  {isGoal && <Box className="w-5 h-5 text-white" />}
                </div>
              );
            })}
          </div>

          <div className="flex-1 space-y-4">
            <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current Action</span>
                <span className="text-[10px] text-blue-400 font-mono tracking-tighter">
                  {isMoving ? "REPLANNING" : (agentPos.x === goalPos.x && agentPos.y === goalPos.y ? "GOAL REACHED" : "IDLE")}
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-600" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(steps / 20) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                   <p className="text-[10px] text-zinc-500 uppercase font-bold">Steps Taken</p>
                   <p className="text-xl font-bold text-zinc-100">{steps}</p>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                   <p className="text-[10px] text-zinc-500 uppercase font-bold">Distance to Goal</p>
                   <p className="text-xl font-bold text-zinc-100">{Math.abs(goalPos.x - agentPos.x) + Math.abs(goalPos.y - agentPos.y)}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl flex gap-3">
              <Layers className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-400">Heuristic Engine Active</p>
                <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">
                  The agent uses Manhattan distance to calculate cost and adapts its path based on dynamic environmental constraints.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 2. Content Generation Workshop
 */
const ContentWorkshop = () => {
  const [contentType, setContentType] = useState<'Article' | 'Code' | 'Creative'>('Article');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState("");

  const generateContent = () => {
    setIsGenerating(true);
    setOutput("");
    
    const demos = {
      Article: "## The Future of Decentralised Intelligence\n\nAI is no longer a cloud-bound monolith. We are entering the era of localized, resilient agents that interact without central oversight...",
      Code: "async function optimizeWeights(layer: NeuralLayer) {\n  const gradient = await layer.computeGradient();\n  return layer.update(gradient.scale(0.01));\n}",
      Creative: "The neon rain slicked the circuits of Old Town. In the shadows, a rogue subnet pulsed with the rhythm of forgotten dreams..."
    };

    setTimeout(() => {
      setOutput(demos[contentType]);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {(['Article', 'Code', 'Creative'] as const).map(type => (
          <button
            key={type}
            onClick={() => setContentType(type)}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all",
              contentType === type 
                ? "bg-blue-600/10 border-blue-500/50 text-blue-400 ring-2 ring-blue-500/20" 
                : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
            )}
          >
            <Zap className={cn("w-5 h-5 mb-2", contentType === type ? "text-blue-400" : "text-zinc-600")} />
            <p className="text-xs font-bold uppercase tracking-widest">{type}</p>
          </button>
        ))}
      </div>

      <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Diffusion Output Generator</h4>
          <Button size="sm" onClick={generateContent} disabled={isGenerating}>
             {isGenerating ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
             {isGenerating ? "Synthesizing..." : "Generate Example"}
          </Button>
        </div>

        <div className="min-h-[200px] bg-zinc-950 rounded-xl border border-zinc-800 p-6 font-mono text-sm overflow-hidden relative">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center absolute inset-0 text-zinc-600"
              >
                <div className="flex gap-1 mb-2">
                  {[0, 1, 2].map(i => (
                    <motion.div 
                      key={i}
                      className="w-1 h-1 bg-blue-500 rounded-full"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <p className="text-[10px] uppercase tracking-widest">Sampling latent space...</p>
              </motion.div>
            ) : output ? (
              <motion.pre 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-zinc-400 whitespace-pre-wrap"
              >
                {output}
              </motion.pre>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-700 uppercase text-[10px] tracking-[0.2em]">
                Ready for input
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

/**
 * 3. Edge AI Workshop
 */
const EdgeAIWorkshop = () => {
  const [quantization, setQuantization] = useState<'FP32' | 'INT8' | 'INT4'>('FP32');

  const stats = {
    FP32: { size: "450MB", latency: "120ms", accuracy: "99.2%" },
    INT8: { size: "112MB", latency: "45ms", accuracy: "98.5%" },
    INT4: { size: "56MB", latency: "18ms", accuracy: "94.1%" }
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20">
            <Cpu className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Edge Deployment Monitor</h4>
            <p className="text-xs text-zinc-500">Quantization impacts on performance and size.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {(['FP32', 'INT8', 'INT4'] as const).map(type => (
            <button
              key={type}
              onClick={() => setQuantization(type)}
              className={cn(
                "p-4 rounded-xl border text-center transition-all",
                quantization === type 
                  ? "bg-blue-600 border-transparent text-white shadow-lg shadow-blue-500/20" 
                  : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
              )}
            >
              <p className="text-lg font-bold">{type}</p>
              <p className="text-[10px] uppercase font-medium opacity-70">Precision</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Model Size</p>
            <p className="text-xl font-bold text-zinc-100 tracking-tight">{stats[quantization].size}</p>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Inference Latency</p>
            <p className="text-xl font-bold text-zinc-100 tracking-tight">{stats[quantization].latency}</p>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Relative Accuracy</p>
            <p className="text-xl font-bold text-zinc-100 tracking-tight">{stats[quantization].accuracy}</p>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Power Draw</p>
            <p className="text-xl font-bold text-blue-400 tracking-tight">
              {quantization === 'FP32' ? 'High' : quantization === 'INT8' ? 'Balanced' : 'Ultra Low'}
            </p>
          </div>
        </div>

        <div className="mt-8 bg-zinc-950/50 border border-zinc-900 rounded-xl p-6 relative overflow-hidden">
           <div className="flex items-start gap-4">
             <Info className="w-5 h-5 text-zinc-600 shrink-0 mt-1" />
             <div className="space-y-4">
               <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Why Edge AI?</h5>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <p className="text-[11px] font-bold text-zinc-100">Zero Latency</p>
                   <p className="text-[10px] text-zinc-500 leading-relaxed">Processing on-device bypasses network roundtrips, critical for robotics and AR.</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[11px] font-bold text-zinc-100">Privacy First</p>
                   <p className="text-[10px] text-zinc-500 leading-relaxed">User data never leaves the device, ensuring hardware-level compliance.</p>
                 </div>
               </div>
             </div>
           </div>

           {/* Decorative visual */}
           <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-600/5 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
};


// --- Main Workshop Panel ---

export const WorkshopPanel = () => {
  const [selectedWorkshop, setSelectedWorkshop] = useState<string | null>(null);

  const workshops: Workshop[] = [
    {
      id: "agent",
      title: "Intelligent Agents",
      description: "Simulation of autonomous navigation in hazardous environments.",
      icon: <Gamepad2 className="w-6 h-6" />,
      category: "Gaming",
      component: <AgentWorkshop />
    },
    {
      id: "content",
      title: "Content Diffusion",
      description: "Generative AI applications for text and technical documentation.",
      icon: <FileText className="w-6 h-6" />,
      category: "Content",
      component: <ContentWorkshop />
    },
    {
      id: "edge",
      title: "Edge Intelligence",
      description: "Visualizing model optimization for embedded and mobile devices.",
      icon: <Cpu className="w-6 h-6" />,
      category: "Edge AI",
      component: <EdgeAIWorkshop />
    }
  ];

  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden">
      <div className="flex-none p-8 lg:px-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
           <div className="space-y-1">
              <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">AI Workshops</h2>
              <p className="text-zinc-500">Interactive demonstrations of cutting-edge neural applications.</p>
           </div>
           {selectedWorkshop && (
             <Button variant="ghost" onClick={() => setSelectedWorkshop(null)} className="text-zinc-400 hover:text-zinc-100">
                <ChevronRight className="w-4 h-4 mr-2 rotate-180" /> Back to Workshops
             </Button>
           )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-8 lg:px-12 pb-20">
        <div className="max-w-6xl mx-auto">
          {!selectedWorkshop ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {workshops.map(workshop => (
                <motion.div
                  key={workshop.id}
                  layoutId={workshop.id}
                  onClick={() => setSelectedWorkshop(workshop.id)}
                  className="cursor-pointer group"
                >
                  <Card className="h-full bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/80 hover:border-blue-500/30 transition-all duration-300 overflow-hidden">
                    <div className="h-2 w-full bg-blue-600/20 group-hover:bg-blue-600 transition-colors duration-500" />
                    <CardHeader className="p-8">
                       <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                          <div className="text-zinc-500 group-hover:text-white transition-colors">
                            {workshop.icon}
                          </div>
                       </div>
                       <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">{workshop.category}</span>
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-500 translate-x-0 group-hover:translate-x-1 transition-all" />
                         </div>
                         <CardTitle className="text-xl text-zinc-100">{workshop.title}</CardTitle>
                         <CardDescription className="text-zinc-500 leading-relaxed">
                           {workshop.description}
                         </CardDescription>
                       </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {workshops.find(w => w.id === selectedWorkshop)?.component}
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const ScrollArea = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("overflow-y-auto custom-scrollbar", className)}>
    {children}
  </div>
);

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={cn("animate-spin", className)} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
