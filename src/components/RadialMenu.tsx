import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Brain, 
  Plus, 
  Layout, 
  Trash2, 
  Globe, 
  FileText,
  X,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RadialMenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
  action: () => void;
}

interface RadialMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  items: RadialMenuItem[];
}

export function RadialMenu({ x, y, isOpen, onClose, items }: RadialMenuProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const radius = 100;
  const itemSize = 48;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] pointer-events-auto"
          onClick={onClose}
          onContextMenu={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
          />
          
          <div 
            className="absolute"
            style={{ left: x, top: y }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Center Hub */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative z-10 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl shadow-blue-500/20 group cursor-pointer hover:border-blue-500/50 transition-colors">
                <Zap className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                
                {/* Pulse Ring */}
                <motion.div 
                  className="absolute inset-0 rounded-full border border-blue-500/30"
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </div>
            </motion.div>

            {/* Menu Items */}
            {items.map((item, index) => {
              const angle = (index / items.length) * 2 * Math.PI - Math.PI / 2;
              const ix = Math.cos(angle) * radius;
              const iy = Math.sin(angle) * radius;
              const isHovered = hoveredId === item.id;

              return (
                <motion.div
                  key={item.id}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{ x: ix, y: iy, opacity: 1, scale: 1 }}
                  exit={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  transition={{ 
                    delay: index * 0.05,
                    type: "spring",
                    damping: 15,
                    stiffness: 200
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="relative group">
                    <button
                      onMouseEnter={() => setHoveredId(item.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        item.action();
                        onClose();
                      }}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl",
                        "bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800",
                        isHovered && "scale-125 z-20"
                      )}
                      style={{ 
                        boxShadow: isHovered ? `0 0 20px ${item.color}40` : undefined,
                        borderColor: isHovered ? item.color : undefined
                      }}
                    >
                      <item.icon 
                        className="w-5 h-5 transition-colors" 
                        style={{ color: isHovered ? item.color : '#a1a1aa' }}
                      />
                    </button>

                    {/* Label */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-mono uppercase tracking-wider text-white whitespace-nowrap pointer-events-none shadow-2xl"
                        >
                          {item.label}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
