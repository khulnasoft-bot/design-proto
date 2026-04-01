import * as React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Send } from "lucide-react";
import { motion } from "motion/react";

export function CommandBar({ onSend, isLoading }: { onSend: (query: string) => void; isLoading: boolean }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSend(query);
      setQuery("");
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 w-full max-w-2xl -translate-x-1/2 px-4 z-50">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
        className="relative group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center bg-zinc-950 border border-zinc-800 rounded-2xl p-2 shadow-2xl">
          <div className="pl-3 pr-2">
            <Sparkles className="h-5 w-5 text-blue-400" />
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything or research a topic..."
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-zinc-200 placeholder:text-zinc-600 h-12"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!query.trim() || isLoading}
            className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
