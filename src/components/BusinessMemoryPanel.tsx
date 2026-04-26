import { useState } from "react";
import { BusinessMemory, Project } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Brain, Save, Sparkles, Building2, Target, Heart } from "lucide-react";
import { toast } from "sonner";

export function BusinessMemoryPanel({ 
  project, 
  onSave 
}: { 
  project: Project; 
  onSave: (memory: BusinessMemory) => void 
}) {
  const [memory, setMemory] = useState<BusinessMemory>(project.businessMemory || {
    businessName: "",
    industry: "",
    targetAudience: "",
    coreValues: [],
    keyOfferings: [],
    brandVoice: "",
    internalLegacy: ""
  });

  const [coreValueInput, setCoreValueInput] = useState("");
  const [offeringInput, setOfferingInput] = useState("");

  const handleUpdate = (updates: Partial<BusinessMemory>) => {
    setMemory(prev => ({ ...prev, ...updates }));
  };

  const addCoreValue = () => {
    if (coreValueInput.trim()) {
      handleUpdate({ coreValues: [...memory.coreValues, coreValueInput.trim()] });
      setCoreValueInput("");
    }
  };

  const addOffering = () => {
    if (offeringInput.trim()) {
      handleUpdate({ keyOfferings: [...memory.keyOfferings, offeringInput.trim()] });
      setOfferingInput("");
    }
  };

  return (
    <div className="space-y-6 p-6 overflow-y-auto max-h-[80vh]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Brain className="h-5 w-5 text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-100 italic">Business Identity</h2>
        </div>
        <Button 
          onClick={() => {
            onSave(memory);
            toast.success("Business context embedded in AI memory");
          }}
          className="bg-purple-600 hover:bg-purple-500 text-white gap-2"
        >
          <Save className="h-4 w-4" /> Save Identity
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-400 flex items-center gap-2">
              <Building2 className="h-3 w-3" /> Business Name
            </Label>
            <Input 
              value={memory.businessName}
              onChange={(e) => handleUpdate({ businessName: e.target.value })}
              placeholder="e.g. Acme Strategics"
              className="bg-zinc-900/50 border-zinc-800"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Industry Sector</Label>
            <Input 
              value={memory.industry}
              onChange={(e) => handleUpdate({ industry: e.target.value })}
              placeholder="e.g. Fintech, SaaS, E-commerce"
              className="bg-zinc-900/50 border-zinc-800"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400 flex items-center gap-2">
              <Target className="h-3 w-3" /> Target Audience
            </Label>
            <Textarea 
              value={memory.targetAudience}
              onChange={(e) => handleUpdate({ targetAudience: e.target.value })}
              placeholder="Who are your ideal customers?"
              className="bg-zinc-900/50 border-zinc-800 min-h-[100px]"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-400">Brand Voice & Tone</Label>
            <Input 
              value={memory.brandVoice}
              onChange={(e) => handleUpdate({ brandVoice: e.target.value })}
              placeholder="e.g. Professional, Bold, Playful"
              className="bg-zinc-900/50 border-zinc-800"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400 flex items-center gap-2">
              <Heart className="h-3 w-3" /> Core Values
            </Label>
            <div className="flex gap-2">
              <Input 
                value={coreValueInput}
                onChange={(e) => setCoreValueInput(e.target.value)}
                placeholder="Add value..."
                onKeyDown={(e) => e.key === 'Enter' && addCoreValue()}
                className="bg-zinc-900/50 border-zinc-800"
              />
              <Button onClick={addCoreValue} variant="outline" size="icon">+</Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {memory.coreValues.map((v, i) => (
                <Card key={i} className="px-3 py-1 bg-zinc-800 border-zinc-700 text-xs text-zinc-300">
                  {v}
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400 flex items-center gap-2">
              <Sparkles className="h-3 w-3" /> Primary Offerings
            </Label>
            <div className="flex gap-2">
              <Input 
                value={offeringInput}
                onChange={(e) => setOfferingInput(e.target.value)}
                placeholder="Add product/service..."
                onKeyDown={(e) => e.key === 'Enter' && addOffering()}
                className="bg-zinc-900/50 border-zinc-800"
              />
              <Button onClick={addOffering} variant="outline" size="icon">+</Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {memory.keyOfferings.map((o, i) => (
                <Card key={i} className="px-3 py-1 bg-zinc-800 border-zinc-700 text-xs text-zinc-300">
                  {o}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono mb-2">Memory Architecture</p>
        <p className="text-sm text-zinc-400 leading-relaxed">
          These fields populate the <span className="text-purple-400">AI Context Builder</span>. 
          All future agents will be aware of your brand voice and target audience, 
          ensuring generated sites and strategies are consistent.
        </p>
      </div>
    </div>
  );
}
