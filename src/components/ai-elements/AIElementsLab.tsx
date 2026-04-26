import React from "react";
import { motion } from "motion/react";
import { 
  Component, 
  Eye, 
  Smartphone, 
  Monitor, 
  Code2, 
  Cpu, 
  Zap, 
  Braces, 
  MessageSquare, 
  Search,
  Box,
  Layers,
  Palette
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Message, Reasoning, CodeBlock, ThoughtRelay } from "./Elements";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";

export const AIElementsLab = () => {
  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex-none p-10 lg:px-16 border-b border-zinc-900 bg-zinc-900/5">
        <div className="max-w-7xl mx-auto flex items-end justify-between">
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <Box className="w-10 h-10 text-blue-500" />
                <h2 className="text-4xl font-bold text-zinc-100 tracking-tighter">AI Elements Laboratory</h2>
             </div>
             <p className="text-zinc-500 text-lg max-w-2xl font-light">
                A design system for modular, intelligence-first applications. 
                Pre-built components optimized for token streaming, agentic workflows, and chain-of-thought visualization.
             </p>
          </div>
          <div className="flex gap-4">
             <Button variant="outline" className="border-zinc-800 h-10 px-6 rounded-xl hover:bg-zinc-900 transition-all font-bold text-[11px] uppercase tracking-widest">
                <Code2 className="w-4 h-4 mr-2" /> Documentation
             </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-7xl mx-auto p-10 lg:p-16 space-y-24">
          
          {/* Section: Chat Mechanics */}
          <section className="space-y-12">
            <div className="space-y-2">
               <span className="text-xs font-bold text-blue-500 uppercase tracking-[0.3em]">Module 01</span>
               <h3 className="text-3xl font-bold text-zinc-100 tracking-tight">Conversational Primitives</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
               <div className="space-y-6">
                  <Message 
                    role="user" 
                    content="Can you analyze the structural integrity of the bridge design? Focus on tensile strength and potential fatigue over a 50-year horizon." 
                    timestamp={Date.now() - 3600000}
                  />
                  <div className="space-y-0 relative">
                     <div className="absolute left-10 top-0 bottom-0 w-px bg-zinc-900" />
                     <Message 
                        role="assistant" 
                        status="thinking"
                        content="Initiating structural simulation. Analyzing node geometry and material coefficients..." 
                        isStreaming={true}
                     />
                  </div>
               </div>
               <div className="bg-zinc-900/20 border border-zinc-800/50 p-8 rounded-3xl space-y-6">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                     <Palette className="w-4 h-4" /> Component Logic
                  </h4>
                  <ul className="space-y-4">
                    {[
                      "Reactive bubble sizing based on content density",
                      "Persona-specific iconography and border weighting",
                      "Integrated streaming cursor with pulse animation",
                      "Automatic timestamp normalization (UTC)"
                    ].map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-zinc-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
               </div>
            </div>
          </section>

          {/* Section: Reasoning & Logic */}
          <section className="space-y-12">
            <div className="space-y-2 text-right">
               <span className="text-xs font-bold text-blue-500 uppercase tracking-[0.3em]">Module 02</span>
               <h3 className="text-3xl font-bold text-zinc-100 tracking-tight">Intelligence Transparency</h3>
            </div>
            
            <div className="flex flex-col gap-12">
               <div className="bg-zinc-900/30 border border-zinc-800 p-10 rounded-[2.5rem] space-y-8">
                  <Reasoning 
                    isExpanded={true}
                    thoughts={[
                      "Parsing user request for 'bridge structural integrity'.",
                      "Accessing historical fatigue data for reinforced steel (ASTM A615).",
                      "Cross-referencing tensile strength charts against variable load factors.",
                      "Identifying critical weakness at the pylon-to-deck connection points.",
                      "Formulating JSON response with stress-point coordinates."
                    ]} 
                  />
                  <ThoughtRelay 
                    steps={[
                      { id: '1', label: 'Parse Intent', status: 'complete', duration: '12ms' },
                      { id: '2', label: 'RAG Retrieval', status: 'complete', duration: '450ms' },
                      { id: '3', label: 'Vector Search', status: 'active' },
                      { id: '4', label: 'Synthesis', status: 'pending' },
                      { id: '5', label: 'Validation', status: 'pending' }
                    ]}
                  />
               </div>
            </div>
          </section>

          {/* Section: Code & Data */}
          <section className="space-y-12">
            <div className="space-y-2">
               <span className="text-xs font-bold text-blue-500 uppercase tracking-[0.3em]">Module 03</span>
               <h3 className="text-3xl font-bold text-zinc-100 tracking-tight">Structured Code Transfer</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <CodeBlock 
                 language="typescript"
                 title="Simulation Core"
                 code={`export async function validateBridge(nodes: BridgeNode[]) {
  const tensileLimit = 420; // MPa for Grade 60 steel
  const fatigueMap = nodes.map(n => ({
    id: n.id,
    stressFactor: n.load / n.area,
    isCritical: (n.load / n.area) > tensileLimit * 0.8
  }));

  return await ai.classify(fatigueMap);
}`}
               />
               <CodeBlock 
                 language="python"
                 title="ML Inference"
                 code={`def assess_fatigue(data):
    results = model.predict(data)
    threshold = 0.85
    return [r for r in results if r['confidence'] > threshold]`}
               />
            </div>
          </section>

          {/* Laboratory Footer */}
          <div className="pt-20 border-t border-zinc-900 flex justify-between items-center text-zinc-600">
             <div className="flex items-center gap-6">
                <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                   <Monitor className="w-3 h-3" /> Adaptive Layout
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                   <Zap className="w-3 h-3" /> Token Optimized
                </span>
             </div>
             <p className="text-[10px] uppercase font-bold tracking-widest italic">AI Elements Library v1.4.0 • Built for Gemini 1.5</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
