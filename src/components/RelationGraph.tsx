"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Network, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Fragment } from "@/types";
import { FragmentRelation } from "@/lib/supabase";

interface RelationGraphProps {
  relations: FragmentRelation[];
  fragments: Fragment[];
}

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  content: string;
  color: string;
}

interface Edge {
  source: string;
  target: string;
  type: string;
  strength: number;
}

const relationColors: Record<string, string> = {
  similar: "#3b82f6",
  contrast: "#f59e0b",
  sequence: "#10b981",
  causal: "#ef4444",
  thematic: "#8b5cf6",
  emotional: "#ec4899",
  reference: "#6b7280",
  custom: "#171717",
};

export function RelationGraph({ relations, fragments }: RelationGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // 初始化节点和边
  useEffect(() => {
    if (fragments.length === 0) return;

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    // 创建节点
    const newNodes: Node[] = fragments.map((f, i) => ({
      id: f.id,
      x: width / 2 + Math.cos((i / fragments.length) * Math.PI * 2) * 200,
      y: height / 2 + Math.sin((i / fragments.length) * Math.PI * 2) * 200,
      vx: 0,
      vy: 0,
      content: f.content.slice(0, 50),
      color: f.story?.color || "#171717",
    }));

    // 创建边
    const newEdges: Edge[] = relations.map(r => ({
      source: r.source_fragment_id,
      target: r.target_fragment_id,
      type: r.relation_type,
      strength: r.strength,
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [fragments, relations]);

  // 力导向模拟
  useEffect(() => {
    if (nodes.length === 0) return;

    const interval = setInterval(() => {
      setNodes(prevNodes => {
        const newNodes = [...prevNodes];
        const width = containerRef.current?.clientWidth || 800;
        const height = containerRef.current?.clientHeight || 600;

        // 斥力
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[j].x - newNodes[i].x;
            const dy = newNodes[j].y - newNodes[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 5000 / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            newNodes[i].vx -= fx;
            newNodes[i].vy -= fy;
            newNodes[j].vx += fx;
            newNodes[j].vy += fy;
          }
        }

        // 引力（边）
        edges.forEach(edge => {
          const source = newNodes.find(n => n.id === edge.source);
          const target = newNodes.find(n => n.id === edge.target);
          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist - 150) * 0.01 * edge.strength;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
          }
        });

        // 中心引力
        newNodes.forEach(node => {
          const dx = width / 2 - node.x;
          const dy = height / 2 - node.y;
          node.vx += dx * 0.001;
          node.vy += dy * 0.001;
        });

        // 更新位置
        newNodes.forEach(node => {
          if (draggedNode === node.id) return;
          
          node.vx *= 0.9; // 阻尼
          node.vy *= 0.9;
          node.x += node.vx;
          node.y += node.vy;

          // 边界限制
          node.x = Math.max(50, Math.min(width - 50, node.x));
          node.y = Math.max(50, Math.min(height - 50, node.y));
        });

        return newNodes;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [edges, draggedNode]);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggedNode(nodeId);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNode || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;

    setNodes(prev => prev.map(node => 
      node.id === draggedNode ? { ...node, x, y, vx: 0, vy: 0 } : node
    ));
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  if (fragments.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted">
        <Network className="w-12 h-12 mb-4 opacity-30" />
        <p>没有碎片数据</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full relative overflow-hidden bg-foreground/[0.02]"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={() => handleZoom(0.1)}
          className="p-2 bg-background rounded-lg shadow border border-border/50 hover:bg-foreground/5"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.1)}
          className="p-2 bg-background rounded-lg shadow border border-border/50 hover:bg-foreground/5"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
          className="p-2 bg-background rounded-lg shadow border border-border/50 hover:bg-foreground/5"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 rounded-lg p-3 shadow border border-border/50">
        <div className="text-xs font-medium mb-2">关联类型</div>
        <div className="space-y-1">
          {Object.entries(relationColors).slice(0, 5).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Graph */}
      <svg 
        className="w-full h-full"
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        {/* Edges */}
        {edges.map((edge, i) => {
          const source = nodes.find(n => n.id === edge.source);
          const target = nodes.find(n => n.id === edge.target);
          if (!source || !target) return null;

          return (
            <line
              key={i}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={relationColors[edge.type] || "#ccc"}
              strokeWidth={edge.strength * 3}
              strokeOpacity={0.6}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            style={{ cursor: 'pointer' }}
          >
            <circle
              r={hoveredNode === node.id ? 35 : 30}
              fill={node.color}
              stroke="white"
              strokeWidth={2}
              className="transition-all duration-200"
            />
            {hoveredNode === node.id && (
              <foreignObject x={40} y={-30} width={200} height={100}>
                <div className="bg-background p-2 rounded-lg shadow-lg border border-border text-xs">
                  {node.content}
                </div>
              </foreignObject>
            )}
          </g>
        ))}
      </svg>

      {/* Stats */}
      <div className="absolute top-4 left-4 text-xs text-muted">
        {nodes.length} 节点 · {edges.length} 关联
      </div>
    </div>
  );
}
