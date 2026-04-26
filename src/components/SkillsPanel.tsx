import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  Cpu, 
  Code2, 
  Bot, 
  ShieldCheck, 
  Layers, 
  Mic, 
  Eye, 
  Search,
  Binary,
  Terminal,
  Activity,
  ChevronRight,
  ArrowUpRight
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { cn } from "../lib/utils";

interface SkillItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: "SDK" | "Model" | "Agents";
  content: string;
  benefits: string[];
  codeSample: string;
}

const SKILLS: SkillItem[] = [
  {
    id: "sdk-optimization",
    title: "SDK Lifecycle Management",
    description: "Efficiently managing Google Generative AI SDK instances and stream handlers.",
    category: "SDK",
    icon: <Code2 className="w-6 h-6" />,
    content: "The SDK is the bridge between your logic and the model. Proper lifecycle management ensures low latency and reliable streaming. Use singleton patterns for the GoogleGenAI instance and handle partial responses to update UI in real-time.",
    benefits: [
      "Reduced cold-start latency",
      "Persistent configuration",
      "Robust error recovery"
    ],
    codeSample: `import { GoogleGenerativeAI } from "@google/genai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

async function streamResponse(prompt: string) {
  const result = await model.generateContentStream(prompt);
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    onUpdate(chunkText);
  }
}`
  },
  {
    id: "structured-output",
    title: "Structural Integrity (JSON)",
    description: "Enforcing strict schema adherence for downstream processing.",
    category: "Model",
    icon: <Binary className="w-6 h-6" />,
    content: "Modern agents require predictable outputs. By leveraging 'Response Schema' and specific system instructions, the model can act as a structured data generator for your backend APIs.",
    benefits: [
      "No parsing errors",
      "Type-safe integrations",
      "Simplified data pipelines"
    ],
    codeSample: `const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    intent: { type: SchemaType.STRING },
    confidence: { type: SchemaType.NUMBER },
    actions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
  },
  required: ["intent", "confidence"]
};

const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro",
  generationConfig: { responseMimeType: "application/json", responseSchema }
});`
  },
  {
    id: "tool-use",
    title: "Autonomous Tool Use",
    description: "Enabling models to execute code and call external APIs (Function Calling).",
    category: "Agents",
    icon: <Bot className="w-6 h-6" />,
    content: "Function calling allows the model to interact with the world. Instead of just talking, the model produces tool calls that your application executes, enabling a closed-loop agentic system.",
    benefits: [
      "External world interaction",
      "Complex problem solving",
      "Dynamic data fetching"
    ],
    codeSample: `const tools = [{
  functionDeclarations: [{
    name: "get_market_data",
    parameters: {
      type: "OBJECT",
      properties: { symbol: { type: "STRING" } }
    }
  }]
}];

const chat = model.startChat({ tools });
const result = await chat.sendMessage("What is the price of GOOGL?");
const call = result.response.candidates[0].content.parts[0].functionCall;`
  },
  {
    id: "multimodal-vision",
    title: "Multimodal Perception",
    description: "Analyzing images, video, and audio contexts natively.",
    category: "Model",
    icon: <Eye className="w-6 h-6" />,
    content: "Gemini models are natively multimodal. They don't just see pixels; they understand spatial relationships, motion in video, and pitch/tone in audio files.",
    benefits: [
      "Visual reasoning",
      "Spatial document analysis",
      "Temporal video understanding"
    ],
    codeSample: `const parts = [
  { text: "Describe the changes between these two screenshots." },
  { inlineData: { mimeType: "image/png", data: frameA } },
  { inlineData: { mimeType: "image/png", data: frameB } }
];

const result = await model.generateContent(parts);`
  }
];

export const SkillsPanel = () => {
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const filteredSkills = filter 
    ? SKILLS.filter(s => s.category === filter)
    : SKILLS;

  const selectedSkill = SKILLS.find(s => s.id === selectedSkillId);

  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex-none p-8 lg:px-12 bg-zinc-900/10 border-b border-zinc-900">
         <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="space-y-1">
               <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">Technical Skills</h2>
               <p className="text-zinc-500 text-sm">In-depth guides for API, SDK, and Agentic interaction patterns.</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFilter(null)}
                className={cn("h-8 rounded-full px-4 text-[10px] font-bold uppercase tracking-widest", !filter ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}
              >
                All
              </Button>
              {["SDK", "Model", "Agents"].map(cat => (
                <Button 
                  key={cat}
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFilter(cat)}
                  className={cn("h-8 rounded-full px-4 text-[10px] font-bold uppercase tracking-widest", filter === cat ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}
                >
                  {cat}
                </Button>
              ))}
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 lg:px-12 py-10 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          {!selectedSkillId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSkills.map(skill => (
                <motion.div
                  key={skill.id}
                  layoutId={skill.id}
                  onClick={() => setSelectedSkillId(skill.id)}
                  className="cursor-pointer group"
                >
                  <Card className="h-full bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/80 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/30 group-hover:bg-blue-600 transition-all duration-500" />
                    <CardHeader className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600/10 transition-all">
                        <div className="text-zinc-500 group-hover:text-blue-400 transition-colors">
                          {skill.icon}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{skill.category}</span>
                        <CardTitle className="text-lg text-zinc-100">{skill.title}</CardTitle>
                        <CardDescription className="text-zinc-500 line-clamp-2">
                          {skill.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0">
                       <div className="flex items-center text-[10px] text-zinc-600 font-bold uppercase tracking-tighter gap-2">
                          Explore Implementation <ArrowUpRight className="w-3 h-3" />
                       </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            selectedSkill && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Back button and Content */}
                <div className="lg:col-span-12">
                   <Button variant="ghost" onClick={() => setSelectedSkillId(null)} className="text-zinc-500 hover:text-zinc-100 mb-8">
                      <ArrowUpRight className="w-4 h-4 mr-2 rotate-180" /> Back to Skills
                   </Button>
                </div>

                <div className="lg:col-span-7 space-y-8">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-[0.3em]">{selectedSkill.category} Capability</span>
                        <div className="h-1 w-1 bg-zinc-800 rounded-full" />
                        <Activity className="w-4 h-4 text-zinc-600" />
                      </div>
                      <h1 className="text-4xl lg:text-5xl font-bold text-zinc-100 tracking-tight">{selectedSkill.title}</h1>
                      <p className="text-xl text-zinc-400 leading-relaxed font-light">{selectedSkill.description}</p>
                   </div>

                   <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl space-y-6">
                      <div className="flex items-center gap-3 border-b border-zinc-800/50 pb-4">
                         <Terminal className="w-5 h-5 text-blue-400" />
                         <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Theoretical Framework</h3>
                      </div>
                      <p className="text-zinc-400 leading-relaxed">{selectedSkill.content}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        {selectedSkill.benefits.map((benefit, i) => (
                           <div key={i} className="flex items-center gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                              <span className="text-xs text-zinc-300 font-medium">{benefit}</span>
                           </div>
                        ))}
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-5 space-y-8">
                   <div className="bg-zinc-950 rounded-3xl border border-zinc-900 overflow-hidden shadow-2xl">
                      <div className="bg-zinc-900/50 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                         <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                         </div>
                         <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Reference Implementation</span>
                      </div>
                      <div className="p-6 overflow-x-auto custom-scrollbar bg-[#09090b]">
                         <pre className="text-blue-400/90 text-sm font-mono leading-relaxed">
                            {selectedSkill.codeSample}
                         </pre>
                      </div>
                   </div>

                   <div className="bg-blue-600/5 border border-blue-500/10 p-6 rounded-3xl space-y-4">
                      <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Optimization Tip
                      </h4>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        When using this pattern, ensure that you implement robust error handling for API rate limits and network transient failures. Exponential backoff is the recommended strategy.
                      </p>
                   </div>
                </div>
              </motion.div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
