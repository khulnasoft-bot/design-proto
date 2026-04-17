import React, { useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ResearchNode, Priority, Connection } from "@/src/types";
import { ResearchNodeCard } from "./ResearchNodeCard";
import { cn } from "@/lib/utils";
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  MousePointer2, 
  Grab, 
  Link2, 
  X, 
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
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface CanvasViewProps {
  nodes: ResearchNode[];
  connections: Connection[];
  onUpdatePriority: (nodeId: string, priority: Priority) => void;
  onDelete: (nodeId: string) => void;
  onEdit: (nodeId: string, content: string) => void;
  onUpdatePosition: (nodeId: string, x: number, y: number) => void;
  onUpdateNodes: (updatedNodes: ResearchNode[]) => void;
  onAddConnection: (fromId: string, toId: string) => void;
  onDeleteConnection: (connectionId: string) => void;
  onUpdateConnection: (connectionId: string, updates: Partial<Connection>) => void;
}

export function CanvasView({ 
  nodes, 
  connections,
  onUpdatePriority, 
  onDelete, 
  onEdit,
  onUpdatePosition,
  onUpdateNodes,
  onAddConnection,
  onDeleteConnection,
  onUpdateConnection
}: CanvasViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSnapping, setIsSnapping] = useState(true);
  const [activeDrag, setActiveDrag] = useState<{ id: string; currentX: number; currentY: number; deltaX: number; deltaY: number } | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [connectionStartNode, setConnectionStartNode] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [pendingConnection, setPendingConnection] = useState<{ fromId: string; mouseX: number; mouseY: number } | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [potentialTargetId, setPotentialTargetId] = useState<string | null>(null);

  const GRID_SIZE = 40;

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
      setSelectedNodeIds(prev => 
        prev.includes(nodeId) 
          ? prev.filter(id => id !== nodeId) 
          : [...prev, nodeId]
      );
    } else {
      setSelectedNodeIds([nodeId]);
    }
  };

  const handleBgClick = () => {
    setSelectedNodeIds([]);
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
    
    const newlySelected = nodes.filter(node => {
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
    
    setSelectedNodeIds(newlySelected);
  };

  const handleMouseUp = () => {
    if (pendingConnection) {
      setPendingConnection(null);
      setPotentialTargetId(null);
      document.body.style.cursor = 'default';
    }
    setMarquee(null);
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden bg-zinc-950/50 select-none" 
      onClick={handleBgClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
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

      {/* Selection Bar */}
      {selectedNodeIds.length > 1 && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 px-2 py-1.5 rounded-xl flex items-center gap-1 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-1 pr-2 border-r border-zinc-800 mr-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">
                {selectedNodeIds.length} selected
              </span>
            </div>
            
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); alignNodes('top'); }} className="h-8 w-8 text-zinc-400 hover:text-zinc-100" title="Align Top">
              <AlignVerticalJustifyStart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); alignNodes('bottom'); }} className="h-8 w-8 text-zinc-400 hover:text-zinc-100" title="Align Bottom">
              <AlignVerticalJustifyEnd className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); alignNodes('left'); }} className="h-8 w-8 text-zinc-400 hover:text-zinc-100" title="Align Left">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); alignNodes('right'); }} className="h-8 w-8 text-zinc-400 hover:text-zinc-100" title="Align Right">
              <AlignRight className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); distributeNodes('horizontal'); }} className="h-8 w-8 text-zinc-400 hover:text-zinc-100" title="Distribute Horizontally">
              <SeparatorVertical className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); distributeNodes('vertical'); }} className="h-8 w-8 text-zinc-400 hover:text-zinc-100" title="Distribute Vertically">
              <SeparatorHorizontal className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleBgClick(); }} className="h-8 w-8 text-zinc-400 hover:text-red-400" title="Clear Selection">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
          </defs>

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
            <path
              d={`M ${nodePositions[pendingConnection.fromId].x + 350} ${nodePositions[pendingConnection.fromId].y + 90} 
                 C ${nodePositions[pendingConnection.fromId].x + 450} ${nodePositions[pendingConnection.fromId].y + 90},
                   ${pendingConnection.mouseX - 100} ${pendingConnection.mouseY},
                   ${pendingConnection.mouseX} ${pendingConnection.mouseY}`}
              fill="none"
              stroke="rgba(168, 85, 247, 0.5)"
              strokeWidth="2"
              strokeDasharray="4 2"
              markerEnd="url(#arrowhead)"
            />
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
              if (conn.style === 'dashed') return "8 4";
              if (conn.style === 'dotted') return "2 4";
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
                                <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg">
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
                                      { style: 'solid', icon: <Minus className="h-3 w-3" /> },
                                      { style: 'dashed', icon: <MoreHorizontal className="h-3 w-3" /> },
                                      { style: 'dotted', icon: <Baseline className="h-3 w-3" /> }
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
                                        <TooltipContent side="top" className="capitalize">{item.style} Style</TooltipContent>
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
          
          // Calculate snapped position for the ghost indicator (only for primary drag)
          const snappedX = activeDrag && isSnapping ? Math.round((pos.x + activeDrag.deltaX) / GRID_SIZE) * GRID_SIZE : 0;
          const snappedY = activeDrag && isSnapping ? Math.round((pos.y + activeDrag.deltaY) / GRID_SIZE) * GRID_SIZE : 0;

          // Apply drag delta if this node is selected or is the primary drag
          let displayX = pos.x;
          let displayY = pos.y;
          
          if (activeDrag && (isSelected || isPrimaryDrag)) {
            displayX += activeDrag.deltaX;
            displayY += activeDrag.deltaY;
          }

          const isPerfectlySnapped = activeDrag && isSnapping && 
            Math.abs(displayX - snappedX) < 10 && 
            Math.abs(displayY - snappedY) < 10;

          return (
            <React.Fragment key={node.id}>
              {/* Snapping Visual Guidance */}
              {isPrimaryDrag && isSnapping && (
                <>
                  {/* Grid Axis Guides */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.15 }}
                    className="absolute bg-blue-500 pointer-events-none"
                    style={{ 
                      left: 0, 
                      top: snappedY + 90, // Center of card height (180/2)
                      width: '10000%', 
                      height: 1,
                      transform: 'translateX(-50%)'
                    }}
                  />
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.15 }}
                    className="absolute bg-blue-500 pointer-events-none"
                    style={{ 
                      left: snappedX + 175, // Center of card width (350/2)
                      top: 0, 
                      width: 1, 
                      height: '10000%',
                      transform: 'translateY(-50%)'
                    }}
                  />

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
                    // If the node being dragged isn't selected, select only it
                    if (!selectedNodeIds.includes(node.id)) {
                      setSelectedNodeIds([node.id]);
                    }
                  }
                }}
                onDrag={(_, info) => {
                  if (!isPanning && !isConnecting) {
                    setActiveDrag(prev => prev ? { ...prev, deltaX: info.offset.x, deltaY: info.offset.y } : null);
                  }
                }}
                onDragEnd={(_, info) => {
                  setIsDragging(false);
                  setActiveDrag(null);
                  if (!isPanning && !isConnecting) {
                    // Update all selected nodes (which includes the one being dragged)
                    const updatedNodes: ResearchNode[] = nodes
                      .filter(n => selectedNodeIds.includes(n.id) || n.id === node.id)
                      .map(n => {
                        const originalPos = nodePositions[n.id];
                        let newX = originalPos.x + info.offset.x;
                        let newY = originalPos.y + info.offset.y;

                        if (isSnapping) {
                          newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
                          newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
                        }
                        
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
                    "connection-port absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center cursor-crosshair z-20 transition-all opacity-0 group-hover:opacity-100",
                    potentialTargetId === node.id && "border-blue-500 scale-125 opacity-100 bg-zinc-800 shadow-[0_0_15px_rgba(59,130,246,0.5)]",
                    pendingConnection && "opacity-100 border-zinc-700"
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
                    "w-1.5 h-1.5 rounded-full bg-zinc-600 transition-colors",
                    potentialTargetId === node.id && "bg-blue-500"
                  )} />
                </div>
                
                <div 
                  className="connection-port absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center cursor-crosshair z-20 hover:border-purple-500 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const startX = (e.clientX - rect.left - offset.x) / scale;
                    const startY = (e.clientY - rect.top - offset.y) / scale;
                    setPendingConnection({ fromId: node.id, mouseX: startX, mouseY: startY });
                    document.body.style.cursor = 'crosshair';
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
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

            <div className="flex items-center gap-1 mr-2 px-1 border-r border-zinc-800">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100" onClick={() => alignNodes('left')}>
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Align Left</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100" onClick={() => alignNodes('center-h')}>
                      <AlignHorizontalJustifyCenter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Align Center Horizontal</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100" onClick={() => alignNodes('right')}>
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Align Right</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center gap-1 mr-2 px-1 border-r border-zinc-800">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100" onClick={() => alignNodes('top')}>
                      <AlignVerticalJustifyStart className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Align Top</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100" onClick={() => alignNodes('center-v')}>
                      <AlignVerticalJustifyCenter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Align Center Vertical</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100" onClick={() => alignNodes('bottom')}>
                      <AlignVerticalJustifyEnd className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Align Bottom</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-zinc-400 hover:text-zinc-100" 
                      onClick={() => distributeNodes('horizontal')}
                      disabled={selectedNodeIds.length < 3}
                    >
                      <SeparatorVertical className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Distribute Horizontally</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-zinc-400 hover:text-zinc-100" 
                      onClick={() => distributeNodes('vertical')}
                      disabled={selectedNodeIds.length < 3}
                    >
                      <SeparatorHorizontal className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Distribute Vertically</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="w-px h-6 bg-zinc-800 mx-2" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-zinc-500 hover:text-red-500" 
                    onClick={() => {
                      setSelectedNodeIds([]);
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
    </div>
  );
}

