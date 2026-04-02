import React, { useRef, useState, useMemo } from "react";
import { motion } from "motion/react";
import { ResearchNode, Priority, Connection } from "@/src/types";
import { ResearchNodeCard } from "./ResearchNodeCard";
import { cn } from "@/lib/utils";
import { ZoomIn, ZoomOut, Maximize2, MousePointer2, Grab, Link2, X, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CanvasViewProps {
  nodes: ResearchNode[];
  connections: Connection[];
  onUpdatePriority: (nodeId: string, priority: Priority) => void;
  onDelete: (nodeId: string) => void;
  onEdit: (nodeId: string, content: string) => void;
  onUpdatePosition: (nodeId: string, x: number, y: number) => void;
  onAddConnection: (fromId: string, toId: string) => void;
  onDeleteConnection: (connectionId: string) => void;
}

export function CanvasView({ 
  nodes, 
  connections,
  onUpdatePriority, 
  onDelete, 
  onEdit,
  onUpdatePosition,
  onAddConnection,
  onDeleteConnection
}: CanvasViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSnapping, setIsSnapping] = useState(true);
  const [connectionStartNode, setConnectionStartNode] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const GRID_SIZE = 40;

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(prev + delta, 0.2), 2));
  };

  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleNodeClick = (nodeId: string) => {
    if (isConnecting) {
      if (!connectionStartNode) {
        setConnectionStartNode(nodeId);
      } else if (connectionStartNode !== nodeId) {
        // Check if connection already exists
        const exists = connections.some(c => 
          (c.fromId === connectionStartNode && c.toId === nodeId) ||
          (c.fromId === nodeId && c.toId === connectionStartNode)
        );
        if (!exists) {
          onAddConnection(connectionStartNode, nodeId);
        }
        setConnectionStartNode(null);
      } else {
        setConnectionStartNode(null);
      }
    }
  };

  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number, y: number }> = {};
    nodes.forEach((node, index) => {
      const defaultX = 100 + (index % 3) * 400;
      const defaultY = 100 + Math.floor(index / 3) * 300;
      positions[node.id] = {
        x: node.position?.x ?? defaultX,
        y: node.position?.y ?? defaultY
      };
    });
    return positions;
  }, [nodes]);

  // Mini-map calculations
  const miniMapScale = 0.05;
  const miniMapWidth = 200;
  const miniMapHeight = 150;

  const getCursor = () => {
    if (isPanning) return isDragging ? 'grabbing' : 'grab';
    if (isConnecting) return 'crosshair';
    return 'default';
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-950/50 select-none">
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
          backgroundSize: `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`
        }}
      />

      {/* Mini-map */}
      <div className="absolute bottom-8 left-8 w-[200px] h-[150px] bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-20 pointer-events-none">
        <div className="absolute inset-0 opacity-20">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle, #fff 0.5px, transparent 0.5px)`,
              backgroundSize: `10px 10px`,
            }}
          />
        </div>
        <div className="relative w-full h-full">
          {nodes.map(node => {
            const pos = nodePositions[node.id];
            return (
              <div 
                key={`mini-${node.id}`}
                className="absolute bg-zinc-700 rounded-sm"
                style={{
                  left: (pos.x * miniMapScale) + 50,
                  top: (pos.y * miniMapScale) + 40,
                  width: 350 * miniMapScale,
                  height: 200 * miniMapScale,
                }}
              />
            );
          })}
          {/* Viewport indicator */}
          <div 
            className="absolute border border-blue-500/50 bg-blue-500/5"
            style={{
              left: (-offset.x / scale * miniMapScale) + 50,
              top: (-offset.y / scale * miniMapScale) + 40,
              width: (miniMapWidth / scale) * miniMapScale * 5, // Approximate
              height: (miniMapHeight / scale) * miniMapScale * 5,
            }}
          />
        </div>
        <div className="absolute bottom-2 left-3 text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
          Research Map Overview
        </div>
      </div>

      {/* Canvas Controls */}
      <div className="absolute bottom-24 right-8 flex flex-col gap-2 z-20">
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-1 flex flex-col gap-1 shadow-2xl">
          <Button variant="ghost" size="icon" onClick={() => handleZoom(0.1)} className="h-8 w-8 text-zinc-400 hover:text-zinc-100">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleZoom(-0.1)} className="h-8 w-8 text-zinc-400 hover:text-zinc-100">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="h-px bg-zinc-800 mx-1" />
          <Button variant="ghost" size="icon" onClick={handleReset} className="h-8 w-8 text-zinc-400 hover:text-zinc-100">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-1 flex flex-col gap-1 shadow-2xl">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setIsPanning(!isPanning);
              setIsConnecting(false);
              setConnectionStartNode(null);
            }} 
            className={cn("h-8 w-8 transition-colors", isPanning ? "text-blue-400 bg-blue-400/10" : "text-zinc-400 hover:text-zinc-100")}
          >
            {isPanning ? <Grab className="h-4 w-4" /> : <MousePointer2 className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setIsConnecting(!isConnecting);
              setIsPanning(false);
              setConnectionStartNode(null);
            }} 
            className={cn("h-8 w-8 transition-colors", isConnecting ? "text-purple-400 bg-purple-400/10" : "text-zinc-400 hover:text-zinc-100")}
          >
            <Link2 className="h-4 w-4" />
          </Button>
          <div className="h-px bg-zinc-800 mx-1" />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSnapping(!isSnapping)} 
            className={cn("h-8 w-8 transition-colors", isSnapping ? "text-green-400 bg-green-400/10" : "text-zinc-400 hover:text-zinc-100")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Connection Mode Indicator */}
      {isConnecting && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-purple-500/10 backdrop-blur-md border border-purple-500/20 px-4 py-2 rounded-full flex items-center gap-3 shadow-xl shadow-purple-500/5">
            <Link2 className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-medium text-purple-200">
              {connectionStartNode 
                ? "Select target node to connect" 
                : "Select first node to connect"}
            </span>
            <button 
              onClick={() => {
                setIsConnecting(false);
                setConnectionStartNode(null);
              }}
              className="p-1 hover:bg-purple-500/20 rounded-md transition-colors"
            >
              <X className="h-3 w-3 text-purple-400" />
            </button>
          </div>
        </div>
      )}

      {/* Nodes Layer */}
      <motion.div
        ref={containerRef}
        className="absolute inset-0"
        style={{ 
          scale,
          x: offset.x,
          y: offset.y,
          cursor: getCursor()
        }}
        drag={isPanning}
        dragConstraints={containerRef}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          if (isPanning) {
            setOffset(prev => ({
              x: prev.x + info.offset.x,
              y: prev.y + info.offset.y
            }));
          }
        }}
      >
        {/* SVG Connections Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#3f3f46" />
            </marker>
          </defs>
          {connections.map((conn) => {
            const from = nodePositions[conn.fromId];
            const to = nodePositions[conn.toId];
            if (!from || !to) return null;

            // Calculate center points of nodes
            const fromX = from.x + 175; // 350 / 2
            const fromY = from.y + 100; // Approximate center height
            const toX = to.x + 175;
            const toY = to.y + 100;

            return (
              <g key={conn.id} className="group pointer-events-auto">
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke="#3f3f46"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                  className="transition-colors group-hover:stroke-purple-500/50"
                />
                {/* Invisible wider line for easier clicking to delete */}
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke="transparent"
                  strokeWidth="20"
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Remove this connection?")) {
                      onDeleteConnection(conn.id);
                    }
                  }}
                />
              </g>
            );
          })}
        </svg>

        {nodes.map((node) => {
          const pos = nodePositions[node.id];
          const x = pos.x;
          const y = pos.y;

          return (
            <motion.div
              key={node.id}
              drag={!isPanning && !isConnecting}
              dragMomentum={false}
              initial={false}
              animate={{ x, y }}
              onDragEnd={(_, info) => {
                if (!isPanning && !isConnecting) {
                  let newX = x + info.offset.x;
                  let newY = y + info.offset.y;

                  if (isSnapping) {
                    newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
                    newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
                  }

                  onUpdatePosition(node.id, newX, newY);
                }
              }}
              onClick={() => handleNodeClick(node.id)}
              className={cn(
                "absolute w-[350px] z-10 transition-shadow",
                connectionStartNode === node.id && "ring-2 ring-purple-500 shadow-2xl shadow-purple-500/20",
                isConnecting && "hover:ring-2 hover:ring-purple-500/50 cursor-crosshair"
              )}
              style={{ top: 0, left: 0 }}
            >
              <ResearchNodeCard 
                node={node}
                onUpdatePriority={(p) => onUpdatePriority(node.id, p)}
                onDelete={() => onDelete(node.id)}
                onEdit={(c) => onEdit(node.id, c)}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

