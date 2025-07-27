import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HexNode from './HexNode';
import ConnectionPath from './ConnectionPath';
import PhaseTooltip from './PhaseTooltip';
import ZoomControls from './ZoomControls';
import { usePhaseUpdates } from './usePhaseUpdates';
import { 
  AlchemyHexGridProps, 
  HexGridState, 
  PhaseNode, 
  Connection,
  HexPosition,
  HexMetrics,
  TooltipData,
  Phase
} from './types';
import './AlchemyHexGrid.css';

// Default hex metrics
const DEFAULT_HEX_METRICS: HexMetrics = {
  size: 50,
  width: 100,
  height: 86.6,
  verticalSpacing: 75,
  horizontalSpacing: 87
};

// Calculate hex position from cube coordinates
const cubeToPixel = (q: number, r: number, metrics: HexMetrics): { x: number; y: number } => {
  const x = metrics.size * (3/2 * q);
  const y = metrics.size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
  return { x, y };
};

// Create default nodes for the alchemy process
const createDefaultNodes = (metrics: HexMetrics): PhaseNode[] => {
  const nodes: PhaseNode[] = [
    // Input node (left)
    {
      id: 'input',
      type: 'input',
      label: 'Input',
      status: 'ready',
      position: { q: -2, r: 0, s: 2, ...cubeToPixel(-2, 0, metrics) }
    },
    // Hub node (center)
    {
      id: 'hub',
      type: 'hub',
      label: 'Alchemy Engine',
      status: 'ready',
      position: { q: 0, r: 0, s: 0, ...cubeToPixel(0, 0, metrics) }
    },
    // Prima Materia (top)
    {
      id: 'prima-materia',
      type: 'phase',
      phase: 'prima-materia',
      label: 'Prima Materia',
      status: 'inactive',
      position: { q: 0, r: -1, s: 1, ...cubeToPixel(0, -1, metrics) }
    },
    // Solutio (bottom left)
    {
      id: 'solutio',
      type: 'phase',
      phase: 'solutio',
      label: 'Solutio',
      status: 'inactive',
      position: { q: -1, r: 1, s: 0, ...cubeToPixel(-1, 1, metrics) }
    },
    // Coagulatio (bottom right)
    {
      id: 'coagulatio',
      type: 'phase',
      phase: 'coagulatio',
      label: 'Coagulatio',
      status: 'inactive',
      position: { q: 1, r: 1, s: -2, ...cubeToPixel(1, 1, metrics) }
    },
    // Output node (right)
    {
      id: 'output',
      type: 'output',
      label: 'Output',
      status: 'inactive',
      position: { q: 2, r: 0, s: -2, ...cubeToPixel(2, 0, metrics) }
    }
  ];
  
  return nodes;
};

// Create default connections
const createDefaultConnections = (): Connection[] => {
  return [
    { id: 'input-hub', source: 'input', target: 'hub', active: false, animated: false },
    { id: 'hub-prima', source: 'hub', target: 'prima-materia', active: false, animated: false },
    { id: 'prima-solutio', source: 'prima-materia', target: 'solutio', active: false, animated: false },
    { id: 'solutio-coagulatio', source: 'solutio', target: 'coagulatio', active: false, animated: false },
    { id: 'coagulatio-output', source: 'coagulatio', target: 'output', active: false, animated: false },
  ];
};

const AlchemyHexGrid: React.FC<AlchemyHexGridProps> = ({
  width = 800,
  height = 600,
  onNodeClick,
  onNodeHover,
  animationSpeed = 1,
  initialZoom = 1,
  enableZoomControls = true,
  enablePan = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [metrics] = useState<HexMetrics>(DEFAULT_HEX_METRICS);
  
  const [state, setState] = useState<HexGridState>({
    nodes: createDefaultNodes(metrics),
    connections: createDefaultConnections(),
    activePhase: null,
    focusedNode: null,
    zoomLevel: initialZoom,
    panOffset: { x: width / 2, y: height / 2 },
    animationSpeed
  });

  const [tooltip, setTooltip] = useState<TooltipData>({
    node: null as any,
    position: { x: 0, y: 0 },
    visible: false
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setState(prev => ({
      ...prev,
      zoomLevel: Math.max(0.5, Math.min(3, prev.zoomLevel + delta))
    }));
  }, []);

  // Handle pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enablePan) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - state.panOffset.x, y: e.clientY - state.panOffset.y });
  }, [enablePan, state.panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setState(prev => ({
      ...prev,
      panOffset: {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }
    }));
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle node interactions
  const handleNodeClick = useCallback((node: PhaseNode) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
    
    // Focus on clicked node
    setState(prev => ({
      ...prev,
      focusedNode: prev.focusedNode === node.id ? null : node.id
    }));
  }, [onNodeClick]);

  const handleNodeHover = useCallback((node: PhaseNode | null, event?: React.MouseEvent) => {
    if (onNodeHover) {
      onNodeHover(node);
    }
    
    if (node && event) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltip({
          node,
          position: {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
          },
          visible: true
        });
      }
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  }, [onNodeHover]);

  // Simulate phase progression (replace with actual API integration)
  const simulatePhaseProgression = useCallback((phase: Phase) => {
    // Update node status
    setState(prev => {
      const newNodes = prev.nodes.map(node => {
        if (node.phase === phase) {
          return { ...node, status: 'active' as const };
        } else if (node.id === 'hub' && phase === 'prima-materia') {
          return { ...node, status: 'active' as const };
        } else if (node.id === 'input' && phase === 'prima-materia') {
          return { ...node, status: 'complete' as const };
        }
        return node;
      });

      // Update connections
      const newConnections = prev.connections.map(conn => {
        if (
          (phase === 'prima-materia' && (conn.id === 'input-hub' || conn.id === 'hub-prima')) ||
          (phase === 'solutio' && conn.id === 'prima-solutio') ||
          (phase === 'coagulatio' && conn.id === 'solutio-coagulatio')
        ) {
          return { ...conn, active: true, animated: true };
        }
        return conn;
      });

      return {
        ...prev,
        nodes: newNodes,
        connections: newConnections,
        activePhase: phase,
        focusedNode: phase
      };
    });

    // Complete phase after delay
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        nodes: prev.nodes.map(node => 
          node.phase === phase ? { ...node, status: 'complete' as const } : node
        )
      }));
    }, 3000 * animationSpeed);
  }, [animationSpeed]);

  // Transform for zoom and pan
  const transform = `translate(${state.panOffset.x}, ${state.panOffset.y}) scale(${state.zoomLevel})`;

  return (
    <div className="alchemy-hex-grid-container">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="alchemy-hex-grid"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          {/* Define gradients and filters for visual effects */}
          <radialGradient id="phase-glow">
            <stop offset="0%" stopColor="#9333ea" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#9333ea" stopOpacity="0" />
          </radialGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <g transform={transform}>
          {/* Render connections */}
          <g className="connections-layer">
            <AnimatePresence>
              {state.connections.map(connection => (
                <ConnectionPath
                  key={connection.id}
                  connection={connection}
                  sourceNode={state.nodes.find(n => n.id === connection.source)!}
                  targetNode={state.nodes.find(n => n.id === connection.target)!}
                  animationSpeed={state.animationSpeed}
                />
              ))}
            </AnimatePresence>
          </g>

          {/* Render nodes */}
          <g className="nodes-layer">
            <AnimatePresence>
              {state.nodes.map(node => (
                <HexNode
                  key={node.id}
                  node={node}
                  metrics={metrics}
                  focused={state.focusedNode === node.id}
                  onClick={handleNodeClick}
                  onHover={handleNodeHover}
                  animationSpeed={state.animationSpeed}
                />
              ))}
            </AnimatePresence>
          </g>
        </g>
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip.visible && (
          <PhaseTooltip
            node={tooltip.node}
            position={tooltip.position}
            onClose={() => setTooltip(prev => ({ ...prev, visible: false }))}
          />
        )}
      </AnimatePresence>

      {/* Zoom controls */}
      {enableZoomControls && (
        <ZoomControls
          zoomLevel={state.zoomLevel}
          onZoomIn={() => handleZoom(0.1)}
          onZoomOut={() => handleZoom(-0.1)}
          onReset={() => setState(prev => ({ ...prev, zoomLevel: initialZoom, panOffset: { x: width / 2, y: height / 2 } }))}
        />
      )}

      {/* Demo controls - Remove in production */}
      <div className="demo-controls">
        <button onClick={() => simulatePhaseProgression('prima-materia')}>Start Prima Materia</button>
        <button onClick={() => simulatePhaseProgression('solutio')}>Start Solutio</button>
        <button onClick={() => simulatePhaseProgression('coagulatio')}>Start Coagulatio</button>
      </div>
    </div>
  );
};

export default AlchemyHexGrid;