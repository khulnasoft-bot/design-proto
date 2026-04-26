import React, { useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ResearchNode, Priority, Connection } from "../types";
import { ResearchNodeCard } from "./ResearchNodeCard";
import { cn } from "../lib/utils";
import { RadialMenu, RadialMenuItem } from "./RadialMenu";
import { 
  Sparkles, 
  Brain, 
  Plus, 
  Layout, 
  Trash2, 
  Globe, 
  FileText,
  Zap,
  MousePointer2,
  Grab,
  Link2,
  X,
  Undo2,
  Redo2,
  LayoutGrid,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  SeparatorHorizontal,
  SeparatorVertical,
  Type,
  Baseline,
  Minus,
  MoreHorizontal,
  Palette,
  Settings2,
  ZoomIn,
  ZoomOut,
  Maximize2
} from "lucide-react";
import { Button } from "./ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "./ui/tooltip";
import { toast } from "sonner";
import { NodeEditPanel } from "./NodeEditPanel";

interface CanvasViewProps {
  nodes: ResearchNode[];
  connections: Connection[];
  selectedNodeIds: string[];
  onSelectNodeIds: (ids: string[]) => void;
  onUpdatePriority: (nodeId: string, priority: Priority) => void;
  onDelete: (nodeId: string) => void;
  onDeleteNodes?: (nodeIds: string[]) => void;
  onEdit: (nodeId: string, content: string) => void;
  onUpdatePosition: (nodeId: string, x: number, y: number) => void;
  onUpdateNodes: (updatedNodes: ResearchNode[]) => void;
  onAddConnection: (fromId: string, toId: string) => void;
  onDeleteConnection: (connectionId: string) => void;
  onUpdateConnection: (connectionId: string, updates: Partial<Connection>) => void;
  onBrainstorm?: (query: string) => void;
  onSummarize?: () => void;
  onAddNode?: (x: number, y: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function CanvasView({ 
  nodes, 
  connections,
  selectedNodeIds,
  onSelectNodeIds,
  onUpdatePriority, 
  onDelete, 
  onDeleteNodes,
  onEdit,
  onUpdatePosition,
  onUpdateNodes,
  onAddConnection,
  onDeleteConnection,
  onUpdateConnection,
  onBrainstorm,
  onSummarize,
  onAddNode,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}: CanvasViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSnapping, setIsSnapping] = useState(true);
  const [activeDrag, setActiveDrag] = useState<{ id: string; currentX: number; currentY: number; deltaX: number; deltaY: number } | null>(null);
  const [connectionStartNode, setConnectionStartNode] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [pendingConnection, setPendingConnection] = useState<{ fromId: string; mouseX: number; mouseY: number } | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [potentialTargetId, setPotentialTargetId] = useState<string | null>(null);
  const [radialMenu, setRadialMenu] = useState<{ x: number, y: number, isOpen: boolean } | null>(null);
  const [showArrangeMenu, setShowArrangeMenu] = useState(false);
  const [snapLines, setSnapLines] = useState<{ x?: number, y?: number }[]>([]);

  const GRID_SIZE = 40;
  const SNAP_THRESHOLD = 5;
  const CARD_WIDTH = 350;
  const CARD_HEIGHT = 180;

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(prev + delta, 0.2), 2));
  };

  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    
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
      return;
    }

    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      onSelectNodeIds(
        selectedNodeIds.includes(nodeId) 
          ? selectedNodeIds.filter(id => id !== nodeId) 
          : [...selectedNodeIds, nodeId]
      );
    } else {
      onSelectNodeIds([nodeId]);
    }
  };

  const handleBgClick = (e: React.MouseEvent) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) return;
    
    onSelectNodeIds([]);
    setConnectionStartNode(null);
    setSelectedConnectionId(null);
    setEditingLabelId(null);
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

  const alignNodes = (direction: 'top' | 'bottom' | 'left' | 'right' | 'center-h' | 'center-v') => {
    if (selectedNodeIds.length < 2) return;

    const CARD_WIDTH = 350;
    const CARD_HEIGHT = 180;

    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    const positions = selectedNodes.map(n => nodePositions[n.id]);

    let targetValue: number;
    let updatedNodes: ResearchNode[] = [];

    if (direction === 'top') {
      targetValue = Math.min(...positions.map(p => p.y));
      if (isSnapping) targetValue = Math.round(targetValue / GRID_SIZE) * GRID_SIZE;
      updatedNodes = selectedNodes.map(n => ({ ...n, position: { x: nodePositions[n.id].x, y: targetValue } }));
    } else if (direction === 'bottom') {
      const bottomEdges = positions.map(p => p.y + CARD_HEIGHT);
      targetValue = Math.max(...bottomEdges) - CARD_HEIGHT;
      if (isSnapping) targetValue = Math.round(targetValue / GRID_SIZE) * GRID_SIZE;
      updatedNodes = selectedNodes.map(n => ({ ...n, position: { x: nodePositions[n.id].x, y: targetValue } }));
    } else if (direction === 'left') {
      targetValue = Math.min(...positions.map(p => p.x));
      if (isSnapping) targetValue = Math.round(targetValue / GRID_SIZE) * GRID_SIZE;
      updatedNodes = selectedNodes.map(n => ({ ...n, position: { x: targetValue, y: nodePositions[n.id].y } }));
    } else if (direction === 'right') {
      const rightEdges = positions.map(p => p.x + CARD_WIDTH);
      targetValue = Math.max(...rightEdges) - CARD_WIDTH;
      if (isSnapping) targetValue = Math.round(targetValue / GRID_SIZE) * GRID_SIZE;
      updatedNodes = selectedNodes.map(n => ({ ...n, position: { x: targetValue, y: nodePositions[n.id].y } }));
    } else if (direction === 'center-h') {
      const midpointX = positions.reduce((acc, p) => acc + p.x + CARD_WIDTH / 2, 0) / positions.length;
      targetValue = midpointX - CARD_WIDTH / 2;
      if (isSnapping) targetValue = Math.round(targetValue / GRID_SIZE) * GRID_SIZE;
      updatedNodes = selectedNodes.map(n => ({ ...n, position: { x: targetValue, y: nodePositions[n.id].y } }));
    } else if (direction === 'center-v') {
      const midpointY = positions.reduce((acc, p) => acc + p.y + CARD_HEIGHT / 2, 0) / positions.length;
      targetValue = midpointY - CARD_HEIGHT / 2;
      if (isSnapping) targetValue = Math.round(targetValue / GRID_SIZE) * GRID_SIZE;
      updatedNodes = selectedNodes.map(n => ({ ...n, position: { x: nodePositions[n.id].x, y: targetValue } }));
    }

    if (updatedNodes.length > 0) {
      onUpdateNodes(updatedNodes);
    }
  };

  const distributeNodes = (axis: 'horizontal' | 'vertical') => {
    if (selectedNodeIds.length < 3) return;

    const selectedNodes = [...nodes]
      .filter(n => selectedNodeIds.includes(n.id))
      .sort((a, b) => {
        if (axis === 'horizontal') return nodePositions[a.id].x - nodePositions[b.id].x;
        return nodePositions[a.id].y - nodePositions[b.id].y;
      });

    const first = nodePositions[selectedNodes[0].id];
    const last = nodePositions[selectedNodes[selectedNodes.length - 1].id];
    let updatedNodes: ResearchNode[] = [];

    if (axis === 'horizontal') {
      const totalWidth = last.x - first.x;
      const step = totalWidth / (selectedNodes.length - 1);
      updatedNodes = selectedNodes.map((node, i) => {
        let newX = first.x + i * step;
        if (isSnapping) newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        return { ...node, position: { x: newX, y: nodePositions[node.id].y } };
      });
    } else {
      const totalHeight = last.y - first.y;
      const step = totalHeight / (selectedNodes.length - 1);
      updatedNodes = selectedNodes.map((node, i) => {
        let newY = first.y + i * step;
        if (isSnapping) newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
        return { ...node, position: { x: nodePositions[node.id].x, y: newY } };
      });
    }

    if (updatedNodes.length > 0) {
      onUpdateNodes(updatedNodes);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPanning || isConnecting || (e.target as HTMLElement).closest('.connection-port') || e.button !== 0) return;
    
    // Convert click coordinates to canvas space
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const startX = (e.clientX - rect.left - offset.x) / scale;
    const startY = (e.clientY - rect.top - offset.y) / scale;
    
    setMarquee({ startX, startY, endX: startX, endY: startY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (pendingConnection) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = (e.clientX - rect.left - offset.x) / scale;
      const mouseY = (e.clientY - rect.top - offset.y) / scale;
      setPendingConnection(prev => prev ? { ...prev, mouseX, mouseY } : null);
      
      // Update global cursor based on target
      const isOverPort = (e.target as HTMLElement).closest('.connection-port');
      if (isOverPort) {
        document.body.style.cursor = 'copy';
      } else {
        document.body.style.cursor = 'crosshair';
      }
      return;
    }

    if (!marquee || isPanning || isConnecting) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const endX = (e.clientX - rect.left - offset.x) / scale;
    const endY = (e.clientY - rect.top - offset.y) / scale;
    
    setMarquee(prev => prev ? { ...prev, endX, endY } : null);
    
    // Calculate selection
    const left = Math.min(marquee.startX, endX);
    const right = Math.max(marquee.startX, endX);
    const top = Math.min(marquee.startY, endY);
    const bottom = Math.max(marquee.startY, endY);
    
    const newlySelectedInMarquee = nodes.filter(node => {
      const pos = nodePositions[node.id];
      const nodeLeft = pos.x;
      const nodeTop = pos.y;
      const nodeRight = pos.x + 350; // Card width
      const nodeBottom = pos.y + 180; // Estimated card height
      
      return (
        nodeRight >= left &&
        nodeLeft <= right &&
        nodeBottom >= top &&
        nodeTop <= bottom
      );
    }).map(n => n.id);
    
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      // Additive selection: combine existing selected nodes with those in the marquee
      // (Using a Set to ensure unique IDs)
      const combined = new Set([...selectedNodeIds, ...newlySelectedInMarquee]);
      onSelectNodeIds(Array.from(combined));
    } else {
      onSelectNodeIds(newlySelectedInMarquee);
    }
  };

  const handleMouseUp = () => {
    if (pendingConnection) {
      setPendingConnection(null);
      setPotentialTargetId(null);
      document.body.style.cursor = 'default';
    }
    setMarquee(null);
  };

  const handleAutoLayout = (targetNodeIds?: string[]) => {
    const nodesToLayout = targetNodeIds 
      ? nodes.filter(n => targetNodeIds.includes(n.id))
      : nodes;
    
    if (nodesToLayout.length === 0) return;

    const cols = Math.ceil(Math.sqrt(nodesToLayout.length));
    const spacingX = 450;
    const spacingY = 350;

    const updatedNodes = nodesToLayout.map((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      return {
        ...node,
        position: {
          x: 100 + col * spacingX,
          y: 100 + row * spacingY
        }
      };
    });

    onUpdateNodes(updatedNodes);
    toast.success(`Arranged ${nodesToLayout.length} nodes into a grid`);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setRadialMenu({
      x: e.clientX,
      y: e.clientY,
      isOpen: true
    });
  };

  const radialItems: RadialMenuItem[] = [
    {
      id: 'brainstorm',
      icon: Brain,
      label: 'Brainstorm',
      color: '#3b82f6',
      action: () => onBrainstorm?.("Brainstorm related concepts based on the current workspace")
    },
    {
      id: 'summarize',
      icon: FileText,
      label: 'Summarize',
      color: '#a855f7',
      action: () => onSummarize?.()
    },
    {
      id: 'add-node',
      icon: Plus,
      label: 'New Node',
      color: '#10b981',
      action: () => {
        if (radialMenu) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const x = (radialMenu.x - rect.left - offset.x) / scale;
                const y = (radialMenu.y - rect.top - offset.y) / scale;
                onAddNode?.(x, y);
            }
        }
      }
    },
    {
        id: 'auto-layout',
        icon: Layout,
        label: 'Auto Layout',
        color: '#f59e0b',
        action: () => handleAutoLayout()
    },
    {
      id: 'delete',
      icon: Trash2,
      label: 'Delete Selected',
      color: '#ef4444',
      action: () => {
          if (selectedNodeIds.length > 0 && onDeleteNodes) {
              onDeleteNodes(selectedNodeIds);
              onSelectNodeIds([]);
          } else if (selectedNodeIds.length === 0) {
              toast.error("No nodes selected");
          }
      }
    },
    {
        id: 'site-gen',
        icon: Globe,
        label: 'Digital Agent',
        color: '#ec4899',
        action: () => {
            toast.success("AI Agent deployed to current workspace");
        }
    },
    {
      id: 'undo',
      icon: Undo2,
      label: 'Undo',
      color: '#a1a1aa',
      action: () => onUndo?.()
    }
  ];

  const selectedNode = useMemo(() => {
    if (selectedNodeIds.length === 1) {
      return nodes.find(n => n.id === selectedNodeIds[0]);
    }
    return null;
  }, [selectedNodeIds, nodes]);

  return (
    <div 
      className="relative w-full h-full overflow-hidden bg-zinc-950/50 select-none" 
      onClick={handleBgClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      {/* Radial Menu Integration */}
      <RadialMenu 
        x={radialMenu?.x || 0}
        y={radialMenu?.y || 0}
        isOpen={!!radialMenu?.isOpen}
        onClose={() => setRadialMenu(null)}
        items={radialItems}
      />
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

      {/* Nodes Layer */}
      <div className="absolute bottom-24 right-8 flex flex-col gap-2 z-20">
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-1 flex flex-col gap-1 shadow-2xl">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onUndo} 
                  disabled={!canUndo}
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Undo Action</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onRedo} 
                  disabled={!canRedo}
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Redo Action</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="h-px bg-zinc-800 mx-1" />
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
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
            <marker
              id="arrowhead-selected"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
            </marker>
            <linearGradient id="pendingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Snap Guides */}
          {snapLines.map((line, i) => (
            <line
              key={`snap-${i}`}
              x1={line.x !== undefined ? line.x : -10000}
              y1={line.y !== undefined ? line.y : -10000}
              x2={line.x !== undefined ? line.x : 10000}
              y2={line.y !== undefined ? line.y : 10000}
              stroke="#3b82f6"
              strokeWidth={1 / scale}
              strokeDasharray="4 2"
              className="opacity-50"
            />
          ))}

          {marquee && (
            <rect
              x={Math.min(marquee.startX, marquee.endX)}
              y={Math.min(marquee.startY, marquee.endY)}
              width={Math.abs(marquee.startX - marquee.endX)}
              height={Math.abs(marquee.startY - marquee.endY)}
              fill="rgba(59, 130, 246, 0.05)"
              stroke="rgba(59, 130, 246, 0.5)"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
          )}

          {pendingConnection && (
            <g>
              <motion.path
                d={(() => {
                  const fromPos = nodePositions[pendingConnection.fromId];
                  const startX = fromPos.x + 350;
                  const startY = fromPos.y + 90;
                  
                  let endX = pendingConnection.mouseX;
                  let endY = pendingConnection.mouseY;
                  
                  if (potentialTargetId && nodePositions[potentialTargetId]) {
                    const targetPos = nodePositions[potentialTargetId];
                    endX = targetPos.x;
                    endY = targetPos.y + 90;
                  }
                  
                  const dx = endX - startX;
                  const curve = Math.min(Math.abs(dx) * 0.5, 150);
                  
                  return `M ${startX} ${startY} 
                         C ${startX + curve} ${startY},
                           ${endX - curve} ${endY},
                           ${endX} ${endY}`;
                })()}
                fill="none"
                stroke="url(#pendingGradient)"
                strokeWidth="3"
                strokeDasharray="6 4"
                markerEnd="url(#arrowhead)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                style={{ filter: 'url(#glow)' }}
              />
              <motion.circle
                cx={potentialTargetId && nodePositions[potentialTargetId] ? nodePositions[potentialTargetId].x : pendingConnection.mouseX}
                cy={potentialTargetId && nodePositions[potentialTargetId] ? nodePositions[potentialTargetId].y + 90 : pendingConnection.mouseY}
                r={potentialTargetId ? 6 : 4}
                fill={potentialTargetId ? "#3b82f6" : "#a855f7"}
                animate={potentialTargetId ? { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] } : { scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: potentialTargetId ? 0.8 : 1 }}
              />
            </g>
          )}

          {connections.map((conn) => {
            const from = nodePositions[conn.fromId];
            const to = nodePositions[conn.toId];
            if (!from || !to) return null;

            const CARD_WIDTH = 350;
            const CARD_HEIGHT = 180;

            const fromCenterX = from.x + CARD_WIDTH / 2;
            const fromCenterY = from.y + CARD_HEIGHT / 2;
            const toCenterX = to.x + CARD_WIDTH / 2;
            const toCenterY = to.y + CARD_HEIGHT / 2;

            const dx = toCenterX - fromCenterX;
            const dy = toCenterY - fromCenterY;

            const fromX = dx > 0 ? from.x + CARD_WIDTH : from.x;
            const fromY = fromCenterY;
            const toX = dx > 0 ? to.x : to.x + CARD_WIDTH;
            const toY = toCenterY;
            
            const useVerticalEdges = Math.abs(dy) > Math.abs(dx) * 1.2;
            
            let finalFromX = fromX;
            let finalFromY = fromY;
            let finalToX = toX;
            let finalToY = toY;

            if (useVerticalEdges) {
              finalFromX = fromCenterX;
              finalFromY = dy > 0 ? from.y + CARD_HEIGHT : from.y;
              finalToX = toCenterX;
              finalToY = dy > 0 ? to.y : to.y + CARD_HEIGHT;
            }

            const distance = Math.sqrt(dx * dx + dy * dy);
            const curvature = Math.min(distance * 0.3, 150);
            
            let cp1x = finalFromX;
            let cp1y = finalFromY;
            let cp2x = finalToX;
            let cp2y = finalToY;

            if (useVerticalEdges) {
              cp1y += dy > 0 ? curvature : -curvature;
              cp2y -= dy > 0 ? curvature : -curvature;
            } else {
              cp1x += dx > 0 ? curvature : -curvature;
              cp2x -= dx > 0 ? curvature : -curvature;
            }

            const path = `M ${finalFromX} ${finalFromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${finalToX} ${finalToY}`;
            
            // Calculate midpoint for label
            const midX = 0.125 * finalFromX + 0.375 * cp1x + 0.375 * cp2x + 0.125 * finalToX;
            const midY = 0.125 * finalFromY + 0.375 * cp1y + 0.375 * cp2y + 0.125 * finalToY;

            const isSelected = selectedConnectionId === conn.id;
            const isHovered = hoveredConnectionId === conn.id;

            const getStrokeDashArray = () => {
              if (conn.style === 'dashed') return "10 5";
              if (conn.style === 'dotted') return "3 3";
              return "none";
            };

            const connectionColor = conn.color || (isSelected ? '#3b82f6' : isHovered ? '#a855f7' : '#27272a');

            return (
              <g 
                key={conn.id} 
                className="pointer-events-auto cursor-pointer"
                onMouseEnter={() => setHoveredConnectionId(conn.id)}
                onMouseLeave={() => setHoveredConnectionId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedConnectionId(conn.id === selectedConnectionId ? null : conn.id);
                }}
              >
                {/* Visual Path */}
                <path
                  d={path}
                  fill="none"
                  stroke={connectionColor}
                  strokeWidth={isSelected ? 3 : 2}
                  strokeDasharray={getStrokeDashArray()}
                  markerEnd={`url(#${isSelected ? 'arrowhead-selected' : 'arrowhead'})`}
                  className="transition-all duration-200"
                />

                {/* Interaction Hitbox */}
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="20"
                />

                {/* Connection Controls/Label */}
                <foreignObject
                  x={midX - 100}
                  y={midY - 40}
                  width="200"
                  height="80"
                  className="pointer-events-none"
                >
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <AnimatePresence>
                      {(isHovered || isSelected || conn.label) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="pointer-events-auto"
                        >
                          {editingLabelId === conn.id ? (
                            <input
                              autoFocus
                              className="bg-black/80 backdrop-blur-sm border border-zinc-700 text-zinc-100 text-[10px] px-2 py-1 rounded-md outline-none focus:border-blue-500 w-32 shadow-xl"
                              defaultValue={conn.label}
                              placeholder="Connection label..."
                              onBlur={(e) => {
                                onUpdateConnection(conn.id, { label: e.target.value });
                                setEditingLabelId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  onUpdateConnection(conn.id, { label: e.currentTarget.value });
                                  setEditingLabelId(null);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              {conn.label && (
                                <div 
                                  className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg cursor-pointer hover:bg-zinc-800 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingLabelId(conn.id);
                                  }}
                                >
                                  {conn.label}
                                </div>
                              )}
                              
                              {isSelected && (
                                <div className="flex bg-zinc-900/95 border border-zinc-800 p-1 rounded-lg shadow-2xl gap-0.5 items-center">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6 text-zinc-400 hover:text-zinc-100"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingLabelId(conn.id);
                                          }}
                                        >
                                          <Type className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">Edit Label</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <div className="w-px h-3 bg-zinc-800 mx-0.5" />
                                  
                                  <TooltipProvider>
                                    {[
                                      { style: 'solid', icon: <Minus className="h-3 w-3" />, label: 'Solid' },
                                      { style: 'dashed', icon: <SeparatorHorizontal className="h-3 w-3" />, label: 'Dashed' },
                                      { style: 'dotted', icon: <MoreHorizontal className="h-3 w-3" />, label: 'Dotted' }
                                    ].map((item) => (
                                      <Tooltip key={item.style}>
                                        <TooltipTrigger>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                              "h-6 w-6 text-zinc-400 hover:text-zinc-100",
                                              (conn.style || 'solid') === item.style && "bg-zinc-800 text-blue-400"
                                            )}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onUpdateConnection(conn.id, { style: item.style as any });
                                            }}
                                          >
                                            {item.icon}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">{item.label} Style</TooltipContent>
                                      </Tooltip>
                                    ))}
                                  </TooltipProvider>

                                  <div className="w-px h-3 bg-zinc-800 mx-0.5" />

                                  {[
                                    { color: '#3b82f6', name: 'Blue' },
                                    { color: '#ef4444', name: 'Red' },
                                    { color: '#10b981', name: 'Green' },
                                    { color: '#f59e0b', name: 'Amber' },
                                    { color: '', name: 'Default' }
                                  ].map((c) => (
                                    <TooltipProvider key={c.name}>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <button
                                            className={cn(
                                              "w-3 h-3 rounded-full border border-zinc-700 hover:scale-110 transition-transform mx-0.5",
                                              !c.color && "bg-zinc-600",
                                              conn.color === c.color && "ring-1 ring-white ring-offset-1 ring-offset-black"
                                            )}
                                            style={{ backgroundColor: c.color || undefined }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onUpdateConnection(conn.id, { color: c.color });
                                            }}
                                          />
                                        </TooltipTrigger>
                                        <TooltipContent side="top">{c.name}</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ))}

                                  <div className="w-px h-3 bg-zinc-800 mx-0.5" />

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6 text-zinc-500 hover:text-red-500"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteConnection(conn.id);
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">Delete Connection</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {nodes.map((node) => {
          const pos = nodePositions[node.id];
          const isSelected = selectedNodeIds.includes(node.id);
          const isPrimaryDrag = activeDrag?.id === node.id;
          
          // Apply drag delta if this node is selected or is the primary drag
          let displayX = pos.x;
          let displayY = pos.y;
          
          if (activeDrag && (isSelected || isPrimaryDrag)) {
            displayX += activeDrag.deltaX;
            displayY += activeDrag.deltaY;
          }

          // Calculate snapped position for the ghost indicator (only for primary drag)
          const snappedX = displayX;
          const snappedY = displayY;

          const isPerfectlySnapped = snapLines.length > 0;

          return (
            <React.Fragment key={node.id}>
              {/* Snapping Visual Guidance */}
              {isPrimaryDrag && isSnapping && (
                <>
                  {/* Snapping Ghost Indicator */}
                  <motion.div 
                    className={cn(
                      "absolute border-2 rounded-2xl pointer-events-none z-0 transition-colors duration-200",
                      isPerfectlySnapped 
                        ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]" 
                        : "border-dashed border-blue-500/30 bg-blue-500/5"
                    )}
                    style={{ 
                      left: 0, 
                      top: 0, 
                      width: 350, 
                      height: 180, 
                      transform: `translate(${snappedX}px, ${snappedY}px)`,
                    }}
                  >
                    {/* Snap Ping Animation */}
                    <AnimatePresence>
                      {isPerfectlySnapped && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1.1, opacity: 0.5 }}
                          exit={{ opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                          className="absolute inset-0 border-4 border-blue-500/20 rounded-2xl"
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                </>
              )}
              
              <motion.div
                drag={!isPanning && !isConnecting}
                dragMomentum={false}
                dragElastic={0}
                initial={false}
                animate={{ x: displayX, y: displayY }}
                onDragStart={() => {
                  setIsDragging(true);
                  if (!isPanning && !isConnecting) {
                    setActiveDrag({ id: node.id, currentX: pos.x, currentY: pos.y, deltaX: 0, deltaY: 0 });
                    setSnapLines([]);
                    // If the node being dragged isn't selected, select only it
                    if (!selectedNodeIds.includes(node.id)) {
                      onSelectNodeIds([node.id]);
                    }
                  }
                }}
                onDrag={(_, info) => {
                  if (!isPanning && !isConnecting) {
                    let dx = info.offset.x;
                    let dy = info.offset.y;
                    
                    const newSnapLines: { x?: number, y?: number }[] = [];
                    
                    if (isSnapping) {
                      const snapThreshold = SNAP_THRESHOLD / scale;
                      const draggedNodeX = pos.x + dx;
                      const draggedNodeY = pos.y + dy;
                      
                      const draggedCenters = [
                        { val: draggedNodeX, name: 'left' },
                        { val: draggedNodeX + CARD_WIDTH / 2, name: 'centerX' },
                        { val: draggedNodeX + CARD_WIDTH, name: 'right' }
                      ];
                      const draggedVerticals = [
                        { val: draggedNodeY, name: 'top' },
                        { val: draggedNodeY + CARD_HEIGHT / 2, name: 'centerY' },
                        { val: draggedNodeY + CARD_HEIGHT, name: 'bottom' }
                      ];

                      const otherNodes = nodes.filter(n => !selectedNodeIds.includes(n.id));
                      
                      let bestDx = Infinity;
                      let bestDy = Infinity;
                      let snapX: number | null = null;
                      let snapY: number | null = null;

                      otherNodes.forEach(other => {
                        const otherPos = nodePositions[other.id];
                        const otherXPoints = [otherPos.x, otherPos.x + CARD_WIDTH / 2, otherPos.x + CARD_WIDTH];
                        const otherYPoints = [otherPos.y, otherPos.y + CARD_HEIGHT / 2, otherPos.y + CARD_HEIGHT];

                        draggedCenters.forEach(dc => {
                          otherXPoints.forEach(ox => {
                            const diff = ox - dc.val;
                            if (Math.abs(diff) < snapThreshold && Math.abs(diff) < Math.abs(bestDx)) {
                              bestDx = diff;
                              snapX = ox;
                            }
                          });
                        });

                        draggedVerticals.forEach(dv => {
                          otherYPoints.forEach(oy => {
                            const diff = oy - dv.val;
                            if (Math.abs(diff) < snapThreshold && Math.abs(diff) < Math.abs(bestDy)) {
                              bestDy = diff;
                              snapY = oy;
                            }
                          });
                        });
                      });

                      // Also snap to grid if no node snap found
                      if (snapX !== null) {
                        dx += bestDx;
                        newSnapLines.push({ x: snapX });
                      } else {
                        const gridSnappedX = Math.round((pos.x + dx) / GRID_SIZE) * GRID_SIZE;
                        if (Math.abs(gridSnappedX - (pos.x + dx)) < snapThreshold) {
                          dx = gridSnappedX - pos.x;
                          newSnapLines.push({ x: gridSnappedX });
                        }
                      }

                      if (snapY !== null) {
                        dy += bestDy;
                        newSnapLines.push({ y: snapY });
                      } else {
                        const gridSnappedY = Math.round((pos.y + dy) / GRID_SIZE) * GRID_SIZE;
                        if (Math.abs(gridSnappedY - (pos.y + dy)) < snapThreshold) {
                          dy = gridSnappedY - pos.y;
                          newSnapLines.push({ y: gridSnappedY });
                        }
                      }
                    }

                    setActiveDrag(prev => prev ? { ...prev, deltaX: dx, deltaY: dy } : null);
                    setSnapLines(newSnapLines);
                  }
                }}
                onDragEnd={(_, info) => {
                  setIsDragging(false);
                  const finalDeltaX = activeDrag?.deltaX ?? info.offset.x;
                  const finalDeltaY = activeDrag?.deltaY ?? info.offset.y;
                  setActiveDrag(null);
                  setSnapLines([]);
                  
                  if (!isPanning && !isConnecting) {
                    // Update all selected nodes
                    const updatedNodes: ResearchNode[] = nodes
                      .filter(n => selectedNodeIds.includes(n.id) || n.id === node.id)
                      .map(n => {
                        const originalPos = nodePositions[n.id];
                        let newX = originalPos.x + finalDeltaX;
                        let newY = originalPos.y + finalDeltaY;
                        
                        return { ...n, position: { x: newX, y: newY } };
                      });

                    onUpdateNodes(updatedNodes);
                  }
                }}
                interaction-id={node.id}
                onClick={(e) => handleNodeClick(e, node.id)}
                className={cn(
                  "absolute w-[350px] z-10 transition-shadow outline-none",
                  isPrimaryDrag && "z-50 shadow-2xl scale-[1.01]",
                  isSelected && "ring-2 ring-blue-500 shadow-lg shadow-blue-500/10 z-20",
                  connectionStartNode === node.id && "ring-2 ring-purple-500 shadow-2xl shadow-purple-500/20",
                  isConnecting && "hover:ring-2 hover:ring-purple-500/50 cursor-crosshair"
                )}
                style={{ top: 0, left: 0 }}
              >
                {/* Connection Ports */}
                <div 
                  className={cn(
                    "connection-port absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center cursor-crosshair z-20 transition-all duration-200",
                    pendingConnection && pendingConnection.fromId !== node.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseEnter={() => {
                    if (pendingConnection && pendingConnection.fromId !== node.id) {
                      setPotentialTargetId(node.id);
                    }
                  }}
                  onMouseLeave={() => setPotentialTargetId(null)}
                  onMouseUp={(e) => {
                    e.stopPropagation();
                    if (pendingConnection && pendingConnection.fromId !== node.id) {
                      onAddConnection(pendingConnection.fromId, node.id);
                      setPendingConnection(null);
                      setPotentialTargetId(null);
                      document.body.style.cursor = 'default';
                    }
                  }}
                >
                  <div className={cn(
                    "w-3 h-3 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center transition-all duration-200",
                    potentialTargetId === node.id && "border-blue-500 scale-125 bg-zinc-800 shadow-[0_0_15px_rgba(59,130,246,0.5)]",
                    pendingConnection && pendingConnection.fromId !== node.id && "border-zinc-500"
                  )}>
                    <div className={cn(
                      "w-1 h-1 rounded-full bg-zinc-600 transition-colors",
                      potentialTargetId === node.id && "bg-blue-500"
                    )} />
                  </div>
                </div>
                
                <div 
                  className="connection-port absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center cursor-crosshair z-20 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    // Center of the output port in canvas space
                    const startX = pos.x + 350;
                    const startY = pos.y + 90;
                    setPendingConnection({ fromId: node.id, mouseX: startX, mouseY: startY });
                    document.body.style.cursor = 'crosshair';
                  }}
                >
                  <div className="w-3 h-3 rounded-full bg-zinc-900 border-2 border-zinc-700 hover:border-purple-500 hover:scale-125 flex items-center justify-center transition-all duration-200 group/port">
                    <div className="w-1 h-1 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50 group-hover/port:scale-125 transition-transform" />
                  </div>
                </div>

                <ResearchNodeCard 
                  node={node}
                  onUpdatePriority={(p) => onUpdatePriority(node.id, p)}
                  onDelete={() => onDelete(node.id)}
                  onEdit={(c) => onEdit(node.id, c)}
                />
              </motion.div>
            </React.Fragment>
          );
        })}
      </motion.div>

      {/* Multi-Selection Bar */}
      <AnimatePresence>
        {selectedNodeIds.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-2 rounded-2xl shadow-2xl z-[100]"
          >
            <div className="flex items-center gap-1.5 px-3 border-r border-zinc-800 mr-2">
              <span className="text-xs font-medium text-blue-400">{selectedNodeIds.length}</span>
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Selected</span>
            </div>

            <div className="relative flex items-center gap-1 mr-2 px-1 border-r border-zinc-800">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={cn(
                        "h-9 px-3 gap-2 text-zinc-400 hover:text-zinc-100",
                        showArrangeMenu && "bg-zinc-800 text-zinc-100"
                      )} 
                      onClick={() => setShowArrangeMenu(!showArrangeMenu)}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span className="text-xs font-medium">Arrange</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Alignment & Distribution</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-zinc-400 hover:text-zinc-100" 
                      onClick={() => handleAutoLayout(selectedNodeIds)}
                    >
                      <Layout className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Grid Layout Selected</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Arrange Sub-Menu */}
              <AnimatePresence>
                {showArrangeMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute bottom-full left-0 mb-3 bg-zinc-900 border border-zinc-800 rounded-xl p-2 shadow-2xl flex flex-col gap-1 min-w-[180px]"
                  >
                    <div className="px-2 py-1 mb-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
                      Alignment
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-full" onClick={() => { alignNodes('left'); setShowArrangeMenu(false); }} title="Align Left">
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-full" onClick={() => { alignNodes('center-h'); setShowArrangeMenu(false); }} title="Center Horizontal">
                        <AlignHorizontalJustifyCenter className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-full" onClick={() => { alignNodes('right'); setShowArrangeMenu(false); }} title="Align Right">
                        <AlignRight className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-full" onClick={() => { alignNodes('top'); setShowArrangeMenu(false); }} title="Align Top">
                        <AlignVerticalJustifyStart className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-full" onClick={() => { alignNodes('center-v'); setShowArrangeMenu(false); }} title="Center Vertical">
                        <AlignVerticalJustifyCenter className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-full" onClick={() => { alignNodes('bottom'); setShowArrangeMenu(false); }} title="Align Bottom">
                        <AlignVerticalJustifyEnd className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="px-2 py-1 mt-1 mb-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
                      Distribution
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 flex-1 gap-2" onClick={() => { distributeNodes('horizontal'); setShowArrangeMenu(false); }} disabled={selectedNodeIds.length < 3}>
                        <SeparatorVertical className="h-3 w-3" />
                        <span className="text-[10px]">Horizontal</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 flex-1 gap-2" onClick={() => { distributeNodes('vertical'); setShowArrangeMenu(false); }} disabled={selectedNodeIds.length < 3}>
                        <SeparatorHorizontal className="h-3 w-3" />
                        <span className="text-[10px]">Vertical</span>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-6 bg-zinc-800 mx-2" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-red-500/70 hover:text-red-500 hover:bg-red-500/10" 
                    onClick={() => {
                      if (onDeleteNodes) {
                        onDeleteNodes(selectedNodeIds);
                        onSelectNodeIds([]);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Selected Nodes</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="w-px h-6 bg-zinc-800 mx-2" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-zinc-500 hover:text-zinc-100" 
                    onClick={() => {
                      onSelectNodeIds([]);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Deselect All</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedNode && (
          <NodeEditPanel 
            node={selectedNode}
            onUpdate={(updatedNode) => onUpdateNodes([updatedNode])}
            onDelete={(id) => {
              onDelete(id);
              onSelectNodeIds([]);
            }}
            onClose={() => onSelectNodeIds([])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

