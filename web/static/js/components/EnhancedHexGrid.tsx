import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from './Tooltip';

interface HexNode {
  id: string;
  x: number;
  y: number;
  icon: string;
  title: string;
  description?: string;
  color: string;
  type: string;
  phase?: number;
}

interface Connection {
  from: string;
  to: string;
  type: string;
  animated?: boolean;
}

interface EnhancedHexGridProps {
  width?: number;
  height?: number;
  theme?: 'dark' | 'light' | 'alchemy';
}

const NODES: HexNode[] = [
  { id: 'hub', x: 500, y: 350, icon: '⚛', title: 'Transmutation Core', description: 'The heart of alchemical transformation', color: '#ff6b35', type: 'core', phase: 2 },
  { id: 'input', x: 150, y: 350, icon: '📥', title: 'Input Gateway', description: 'Where raw ideas enter', color: '#00ff88', type: 'gateway' },
  { id: 'output', x: 850, y: 350, icon: '✨', title: 'Output Portal', description: 'Refined prompts emerge', color: '#ffd700', type: 'gateway' },
  { id: 'prima', x: 350, y: 200, icon: '🔬', title: 'Prima Materia', description: 'First Matter - Raw essence extraction', color: '#ff6b6b', type: 'phase-prima', phase: 1 },
  { id: 'solutio', x: 650, y: 200, icon: '💧', title: 'Solutio', description: 'Dissolution - Breaking down and refining', color: '#4ecdc4', type: 'phase-solutio', phase: 3 },
  { id: 'coagulatio', x: 500, y: 500, icon: '💎', title: 'Coagulatio', description: 'Crystallization - Final form', color: '#45b7d1', type: 'phase-coagulatio', phase: 4 },
];

const CONNECTIONS: Connection[] = [
  { from: 'input', to: 'prima', type: 'flow', animated: true },
  { from: 'prima', to: 'hub', type: 'phase' },
  { from: 'hub', to: 'solutio', type: 'phase' },
  { from: 'solutio', to: 'coagulatio', type: 'phase' },
  { from: 'coagulatio', to: 'output', type: 'flow', animated: true },
];

const HexagonPath = ({ size = 40 }: { size?: number }) => {
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = size * Math.cos(angle);
    const y = size * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');
  
  return <polygon points={points} />;
};

const HexNode: React.FC<{ node: HexNode; isHovered: boolean; onHover: (id: string | null) => void }> = ({ 
  node, 
  isHovered, 
  onHover 
}) => {
  return (
    <motion.g
      transform={`translate(${node.x}, ${node.y})`}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'pointer' }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Shadow */}
      <motion.g
        initial={{ opacity: 0.3 }}
        animate={{ opacity: isHovered ? 0.5 : 0.3 }}
      >
        <HexagonPath size={42} />
        <animateTransform
          attributeName="transform"
          type="translate"
          values="2,2"
          dur="0s"
        />
      </motion.g>
      
      {/* Main hexagon with gradient */}
      <defs>
        <linearGradient id={`gradient-${node.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={node.color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={node.color} stopOpacity="0.4" />
        </linearGradient>
        
        {/* Glow filter */}
        <filter id={`glow-${node.id}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <motion.polygon
        points={HexagonPath({ size: 40 }).props.points}
        fill={`url(#gradient-${node.id})`}
        stroke={node.color}
        strokeWidth="2"
        filter={isHovered ? `url(#glow-${node.id})` : undefined}
        animate={{
          filter: isHovered ? `url(#glow-${node.id}) drop-shadow(0 0 20px ${node.color})` : 'none',
          strokeWidth: isHovered ? 3 : 2,
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Icon */}
      <motion.text
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        fill="white"
        animate={{
          scale: isHovered ? 1.2 : 1,
          textShadow: isHovered ? `0 0 10px ${node.color}` : 'none'
        }}
        transition={{ duration: 0.3 }}
      >
        {node.icon}
      </motion.text>
      
      {/* Hover border */}
      <motion.polygon
        points={HexagonPath({ size: 44 }).props.points}
        fill="none"
        stroke={node.color}
        strokeWidth="3"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          filter: `drop-shadow(0 0 10px ${node.color})`,
        }}
      />
    </motion.g>
  );
};

const CurvedConnection: React.FC<{ 
  from: HexNode; 
  to: HexNode; 
  type: string;
  animated?: boolean;
}> = ({ from, to, type, animated }) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate control points for smooth curves
  const curvature = Math.min(distance * 0.3, 80);
  const midX = from.x + dx / 2;
  const midY = from.y + dy / 2;
  
  // Offset control point perpendicular to the line
  const angle = Math.atan2(dy, dx) + Math.PI / 2;
  const ctrlX = midX + Math.cos(angle) * curvature;
  const ctrlY = midY + Math.sin(angle) * curvature;
  
  const pathData = `M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}`;
  
  const strokeColor = type === 'phase' ? '#3498db' : '#00ff88';
  const strokeWidth = type === 'phase' ? 3 : 2;
  
  return (
    <g>
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={0.6}
        strokeDasharray={type === 'flow' ? '5,5' : undefined}
      />
      
      {animated && (
        <circle r="4" fill={strokeColor}>
          <animateMotion dur="3s" repeatCount="indefinite">
            <mpath href={`#path-${from.id}-${to.id}`} />
          </animateMotion>
        </circle>
      )}
      
      <path
        id={`path-${from.id}-${to.id}`}
        d={pathData}
        fill="none"
        style={{ display: 'none' }}
      />
    </g>
  );
};

export const EnhancedHexGrid: React.FC<EnhancedHexGridProps> = ({
  width = 1000,
  height = 700,
  theme = 'alchemy'
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<HexNode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    const node = hoveredNode ? NODES.find(n => n.id === hoveredNode) : null;
    setActiveTooltip(node || null);
  }, [hoveredNode]);
  
  const getNode = (id: string) => NODES.find(n => n.id === id);
  
  return (
    <div className="enhanced-hex-grid-container" style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="enhanced-hex-grid"
        style={{
          background: theme === 'alchemy' 
            ? 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f1e 100%)' 
            : '#f8f9fa'
        }}
      >
        {/* Connections layer */}
        <g className="connections-layer">
          {CONNECTIONS.map((conn, idx) => {
            const fromNode = getNode(conn.from);
            const toNode = getNode(conn.to);
            if (!fromNode || !toNode) return null;
            
            return (
              <CurvedConnection
                key={idx}
                from={fromNode}
                to={toNode}
                type={conn.type}
                animated={conn.animated}
              />
            );
          })}
        </g>
        
        {/* Nodes layer */}
        <g className="nodes-layer">
          {NODES.map(node => (
            <HexNode
              key={node.id}
              node={node}
              isHovered={hoveredNode === node.id}
              onHover={setHoveredNode}
            />
          ))}
        </g>
      </svg>
      
      {/* Tooltip */}
      <AnimatePresence>
        {activeTooltip && (
          <Tooltip
            node={activeTooltip}
            position={{ x: activeTooltip.x, y: activeTooltip.y }}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedHexGrid;