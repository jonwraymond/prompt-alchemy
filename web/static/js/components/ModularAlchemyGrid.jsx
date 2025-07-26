"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';

// Alchemy-specific node configuration - proper hexagonal grid layout (no overlaps)
const ALCHEMY_NODES = [
  // Center core
  { id: 'hub', x: 0, y: 0, icon: '⚛', title: 'Transmutation Core', description: 'The heart of alchemical transformation', color: '#ff6b35', type: 'core', phase: 2 },
  
  // Main gateways (horizontal axis)
  { id: 'input', x: -240, y: 0, icon: '📥', title: 'Input Gateway', description: 'Where raw ideas enter', color: '#00ff88', type: 'gateway' },
  { id: 'output', x: 240, y: 0, icon: '✨', title: 'Output Portal', description: 'Refined prompts emerge', color: '#ffd700', type: 'gateway' },
  
  // Main phases (triangular formation around core)
  { id: 'prima', x: -120, y: -100, icon: '🔬', title: 'Prima Materia', description: 'First Matter - Raw essence extraction', color: '#ff6b6b', type: 'phase-prima', phase: 1 },
  { id: 'solutio', x: 120, y: -100, icon: '💧', title: 'Solutio', description: 'Dissolution - Breaking down and refining', color: '#4ecdc4', type: 'phase-solutio', phase: 3 },
  { id: 'coagulatio', x: 0, y: 140, icon: '💎', title: 'Coagulatio', description: 'Crystallization - Final form', color: '#45b7d1', type: 'phase-coagulatio', phase: 4 },
  
  // Process nodes (top row - proper hexagonal spacing)
  { id: 'parse', x: -180, y: -200, icon: '📝', title: 'Parse', color: '#95a5a6', type: 'process' },
  { id: 'extract', x: -60, y: -200, icon: '⚗️', title: 'Extract', color: '#95a5a6', type: 'process' },
  { id: 'validate', x: 60, y: -200, icon: '✓', title: 'Validate', color: '#95a5a6', type: 'process' },
  { id: 'refine', x: 180, y: -200, icon: '🔄', title: 'Refine', color: '#95a5a6', type: 'process' },
  { id: 'flow', x: 300, y: -100, icon: '〰', title: 'Flow', color: '#95a5a6', type: 'process' },
  { id: 'finalize', x: 300, y: 100, icon: '🎯', title: 'Finalize', color: '#95a5a6', type: 'process' },
  
  // Feature nodes (bottom row - proper hexagonal spacing)
  { id: 'optimize', x: -120, y: 240, icon: '⚡', title: 'Optimize', color: '#95a5a6', type: 'feature' },
  { id: 'judge', x: 0, y: 280, icon: '⚖️', title: 'Judge', color: '#95a5a6', type: 'feature' },
  { id: 'database', x: 120, y: 240, icon: '💾', title: 'Database', color: '#95a5a6', type: 'feature' },
  
  // Provider nodes (left column - proper vertical spacing)
  { id: 'openai', x: -360, y: -100, icon: '🤖', title: 'OpenAI', color: '#10a37f', type: 'provider' },
  { id: 'anthropic', x: -360, y: -40, icon: '🧠', title: 'Anthropic', color: '#ff6b35', type: 'provider' },
  { id: 'google', x: -360, y: 20, icon: '🔍', title: 'Google', color: '#4285f4', type: 'provider' },
  { id: 'ollama', x: -360, y: 80, icon: '🦙', title: 'Ollama', color: '#ff9500', type: 'provider' }
];

/**
 * @typedef {Object} AlchemyNode
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {string} icon
 * @property {string} title
 * @property {string} [description]
 * @property {string} color
 * @property {string} type
 * @property {number} [phase]
 * @property {boolean} [isActive]
 * @property {boolean} [isVisible]
 * @property {number} [opacity]
 */

/**
 * @typedef {Object} Connection
 * @property {string} id
 * @property {string} fromId
 * @property {string} toId
 * @property {boolean} isActive
 * @property {string} color
 * @property {number} opacity
 */

/**
 * @typedef {Object} TooltipData
 * @property {string} nodeId
 * @property {{x: number, y: number}} position
 * @property {AlchemyNode} node
 */

/**
 * @typedef {Object} GridState
 * @property {Map<string, AlchemyNode>} nodes
 * @property {Map<string, Connection>} connections
 * @property {string|null} hoveredNode
 * @property {Set<string>} selectedNodes
 * @property {TooltipData|null} tooltip
 * @property {boolean} showNodes
 * @property {boolean} showConnections
 * @property {{x: number, y: number, scale: number}} transform
 * @property {boolean} isDragging
 * @property {{x: number, y: number}|null} lastMousePos
 */

// Hook for managing grid state
const useAlchemyGridState = () => {
  const [state, setState] = useState({
    nodes: new Map(),
    connections: new Map(),
    hoveredNode: null,
    selectedNodes: new Set(),
    tooltip: null,
    showNodes: true,
    showConnections: false, // Hidden by default as requested
    transform: {
      x: 0,
      y: 0,
      scale: 1
    },
    isDragging: false,
    lastMousePos: null
  });

  const initializeNodes = useCallback(() => {
    const nodes = new Map();
    
    ALCHEMY_NODES.forEach(nodeData => {
      nodes.set(nodeData.id, {
        ...nodeData,
        isActive: Math.random() > 0.7,
        isVisible: true,
        opacity: 0.8 + Math.random() * 0.2
      });
    });
    
    setState(prev => ({ ...prev, nodes }));
    console.log('✅ Alchemy grid initialized with modular architecture');
  }, []);

  const addConnection = useCallback((fromId, toId) => {
    const id = `${fromId}-${toId}`;
    const connection = {
      id,
      fromId,
      toId,
      isActive: true,
      color: '#0CF2A0',
      opacity: 0.7
    };
    
    setState(prev => {
      const newConnections = new Map(prev.connections);
      newConnections.set(id, connection);
      return { ...prev, connections: newConnections };
    });
  }, []);

  const setHoveredNode = useCallback((nodeId) => {
    setState(prev => ({ ...prev, hoveredNode: nodeId }));
  }, []);

  const setTooltip = useCallback((tooltip) => {
    setState(prev => ({ ...prev, tooltip }));
  }, []);

  const toggleConnectionsVisibility = useCallback(() => {
    setState(prev => ({ ...prev, showConnections: !prev.showConnections }));
  }, []);

  const startDrag = useCallback((mousePos) => {
    setState(prev => ({
      ...prev,
      isDragging: true,
      lastMousePos: mousePos
    }));
  }, []);

  const updateDrag = useCallback((mousePos) => {
    setState(prev => {
      if (!prev.isDragging || !prev.lastMousePos) return prev;
      
      const dx = mousePos.x - prev.lastMousePos.x;
      const dy = mousePos.y - prev.lastMousePos.y;
      
      return {
        ...prev,
        transform: {
          ...prev.transform,
          x: prev.transform.x + dx,
          y: prev.transform.y + dy
        },
        lastMousePos: mousePos
      };
    });
  }, []);

  const stopDrag = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDragging: false,
      lastMousePos: null
    }));
  }, []);

  const zoom = useCallback((delta, centerX, centerY) => {
    setState(prev => {
      const zoomFactor = delta > 0 ? 1.1 : 0.9;
      const newScale = Math.max(0.5, Math.min(3, prev.transform.scale * zoomFactor));
      
      const scaleChange = newScale / prev.transform.scale;
      const newX = centerX - (centerX - prev.transform.x) * scaleChange;
      const newY = centerY - (centerY - prev.transform.y) * scaleChange;
      
      return {
        ...prev,
        transform: {
          x: newX,
          y: newY,
          scale: newScale
        }
      };
    });
  }, []);

  return {
    state,
    initializeNodes,
    addConnection,
    setHoveredNode,
    setTooltip,
    toggleConnectionsVisibility,
    startDrag,
    updateDrag,
    stopDrag,
    zoom
  };
};

// Connection line component
const ConnectionLine = ({ connection, fromNode, toNode, isVisible }) => {
  if (!isVisible || !fromNode || !toNode) return null;

  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Create smooth curved path
  const midX = (fromNode.x + toNode.x) / 2;
  const midY = (fromNode.y + toNode.y) / 2;
  const controlOffset = length * 0.2;
  const perpX = -dy / length * controlOffset;
  const perpY = dx / length * controlOffset;
  
  const path = `M ${fromNode.x} ${fromNode.y} Q ${midX + perpX} ${midY + perpY} ${toNode.x} ${toNode.y}`;

  return (
    <g>
      <path
        d={path}
        stroke={connection.color}
        strokeWidth="2"
        fill="none"
        opacity={connection.opacity}
        strokeDasharray="5,5"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="0;10;0"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
    </g>
  );
};

// Diablo-style tooltip component with glassy transparent design
const NodeTooltip = ({ tooltip }) => {
  if (!tooltip) return null;
  
  // Alchemy-style rarity colors with transparent glass effect
  const rarityColors = {
    'core': { bg: 'rgba(255, 215, 0, 0.15)', text: '#FFD700', border: '#FFD700', glow: 'rgba(255, 215, 0, 0.4)', rarity: 'Legendary' },
    'phase-prima': { bg: 'rgba(255, 107, 107, 0.15)', text: '#FF6B6B', border: '#FF6B6B', glow: 'rgba(255, 107, 107, 0.4)', rarity: 'Epic' },
    'phase-solutio': { bg: 'rgba(78, 205, 196, 0.15)', text: '#4ECDC4', border: '#4ECDC4', glow: 'rgba(78, 205, 196, 0.4)', rarity: 'Epic' },
    'phase-coagulatio': { bg: 'rgba(69, 183, 209, 0.15)', text: '#45B7D1', border: '#45B7D1', glow: 'rgba(69, 183, 209, 0.4)', rarity: 'Epic' },
    'gateway': { bg: 'rgba(0, 255, 136, 0.15)', text: '#00FF88', border: '#00FF88', glow: 'rgba(0, 255, 136, 0.4)', rarity: 'Rare' },
    'process': { bg: 'rgba(211, 211, 211, 0.15)', text: '#D3D3D3', border: '#D3D3D3', glow: 'rgba(211, 211, 211, 0.4)', rarity: 'Common' },
    'feature': { bg: 'rgba(147, 112, 219, 0.15)', text: '#9370DB', border: '#9370DB', glow: 'rgba(147, 112, 219, 0.4)', rarity: 'Uncommon' },
    'provider': { bg: 'rgba(255, 165, 0, 0.15)', text: '#FFA500', border: '#FFA500', glow: 'rgba(255, 165, 0, 0.4)', rarity: 'Unique' }
  };
  
  const style = rarityColors[tooltip.node.type] || rarityColors['process'];
  
  return (
    <div
      style={{
        position: 'fixed',
        left: tooltip.position.x + 40, // Offset more to the right to avoid hexagon overlap
        top: tooltip.position.y - 20,  // Position slightly above cursor
        background: `linear-gradient(135deg, ${style.bg} 0%, rgba(255,255,255,0.05) 50%, ${style.bg} 100%)`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1px solid ${style.border}`,
        borderImage: `linear-gradient(135deg, ${style.border} 0%, transparent 50%, ${style.border} 100%) 1`,
        color: '#ffffff',
        padding: '16px 20px',
        borderRadius: '8px',
        boxShadow: `
          0 8px 32px rgba(0,0,0,0.3), 
          0 0 40px ${style.glow},
          inset 0 0 20px rgba(255,255,255,0.1),
          inset 0 1px 0 rgba(255,255,255,0.2)
        `,
        fontFamily: '"Cinzel", "Georgia", serif',
        fontSize: '14px',
        zIndex: 10000,
        pointerEvents: 'none',
        minWidth: '220px',
        maxWidth: '320px',
        opacity: 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'translateZ(0)', // Hardware acceleration
      }}
    >
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '8px', 
        color: style.text,
        fontSize: '16px',
        textShadow: `0 0 10px ${style.glow}, 0 0 20px ${style.glow}`,
        display: 'flex',
        alignItems: 'center',
        paddingBottom: '8px',
        borderBottom: `1px solid rgba(255,255,255,0.1)`
      }}>
        <span style={{ 
          marginRight: '10px', 
          fontSize: '20px',
          filter: `drop-shadow(0 0 8px ${style.glow})`
        }}>{tooltip.node.icon}</span>
        {tooltip.node.title}
      </div>
      
      <div style={{ 
        fontSize: '13px', 
        opacity: 0.9, 
        marginBottom: '12px',
        color: style.border,
        fontWeight: 'bold',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        textShadow: `0 0 5px ${style.glow}`
      }}>
        {style.rarity}
      </div>
      
      {tooltip.node.description && (
        <>
          <div style={{ 
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${style.border}40, transparent)`,
            margin: '12px 0'
          }} />
          <div style={{ 
            fontSize: '13px', 
            lineHeight: '1.6',
            color: 'rgba(255,255,255,0.9)',
            fontStyle: 'italic',
            marginBottom: '12px'
          }}>
            "{tooltip.node.description}"
          </div>
        </>
      )}
      
      <div style={{ 
        fontSize: '11px', 
        marginTop: '8px', 
        opacity: 0.7,
        color: 'rgba(255,255,255,0.8)',
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: '8px',
        borderTop: `1px solid rgba(255,255,255,0.1)`
      }}>
        <div>
          <span style={{ color: style.text, fontWeight: 'bold' }}>Type:</span> {tooltip.node.type}
        </div>
        {tooltip.node.phase && (
          <div>
            <span style={{ color: style.text, fontWeight: 'bold' }}>Phase:</span> {tooltip.node.phase}
          </div>
        )}
      </div>
    </div>
  );
};

// Main grid renderer
const AlchemyGridRenderer = ({ 
  nodes, 
  connections, 
  onNodeClick, 
  onNodeHover, 
  hoveredNode, 
  showNodes, 
  showConnections, 
  transform,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  isDragging
}) => {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current?.parentElement) {
        const rect = svgRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  return (
    <svg
      ref={svgRef}
      width={dimensions.width}
      height={dimensions.height}
      style={{ 
        background: 'transparent',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      <g transform={`translate(${centerX + transform.x}, ${centerY + transform.y}) scale(${transform.scale})`}>
        {/* Render connections first (behind nodes) */}
        {showConnections && Array.from(connections.entries()).map(([connectionId, connection]) => {
          const fromNode = nodes.get(connection.fromId);
          const toNode = nodes.get(connection.toId);
          
          return (
            <ConnectionLine
              key={connectionId}
              connection={connection}
              fromNode={fromNode}
              toNode={toNode}
              isVisible={showConnections && fromNode?.isVisible && toNode?.isVisible}
            />
          );
        })}
        
        {/* Render nodes */}
        {showNodes && Array.from(nodes.entries()).map(([nodeId, node]) => {
          if (!node.isVisible) return null;
          
          const isHovered = hoveredNode === nodeId;
          const scale = isHovered ? 1.05 : 1;
          const opacity = isHovered ? 1 : node.opacity;
          
          // Hexagon path generator
          const createHexPath = (size = 30) => {
            const points = [];
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i - Math.PI / 2;
              const x = size * Math.cos(angle);
              const y = size * Math.sin(angle);
              points.push(`${x},${y}`);
            }
            return points.join(' ');
          };
          
          const hexPath = createHexPath(30);
          const hoverHexPath = createHexPath(35);
          
          return (
            <g
              key={nodeId}
              transform={`translate(${node.x}, ${node.y}) scale(${scale})`}
              style={{ cursor: 'pointer', pointerEvents: 'all' }}
            >
              {/* Shadow */}
              <polygon
                points={hexPath}
                fill="#000000"
                opacity="0.3"
                transform="translate(2, 2)"
              />
              
              {/* Gradient definition */}
              <defs>
                <linearGradient id={`gradient-${nodeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={node.color} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={node.color} stopOpacity="0.4" />
                </linearGradient>
              </defs>
              
              {/* Main hexagon */}
              <polygon
                points={hexPath}
                fill={`url(#gradient-${nodeId})`}
                stroke={node.color}
                strokeWidth={isHovered ? 3 : 2}
                filter={isHovered ? "url(#glow)" : "url(#shadow)"}
                style={{
                  transition: 'all 0.3s ease-out',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  onNodeHover(nodeId, e);
                }}
                onMouseLeave={(e) => {
                  e.stopPropagation();
                  onNodeHover(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeClick(nodeId);
                }}
              />
              
              {/* Active indicator */}
              {node.isActive && (
                <polygon
                  points={hoverHexPath}
                  fill="none"
                  stroke="#0CF2A0"
                  strokeWidth="2"
                  opacity="0.6"
                >
                  <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    type="scale"
                    values="1;1.1;1"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.6;0.2;0.6"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </polygon>
              )}
              
              {/* Hover border */}
              {isHovered && (
                <polygon
                  points={createHexPath(34)}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  opacity="0.8"
                />
              )}
              
              {/* Node icon */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="20"
                fill="white"
                opacity={opacity}
                style={{
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.3s ease-out',
                  filter: isHovered ? `drop-shadow(0 0 8px ${node.color})` : 'none',
                  fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
                }}
              >
                {node.icon}
              </text>
              
              {/* Node title */}
              <text
                x="0"
                y="45"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                fill="white"
                fontFamily="monospace"
                opacity={isHovered ? 1 : 0.7}
                style={{
                  transition: 'opacity 0.3s ease-out'
                }}
              >
                {node.title}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// Main component
const ModularAlchemyGrid = () => {
  const {
    state,
    initializeNodes,
    addConnection,
    setHoveredNode,
    setTooltip,
    toggleConnectionsVisibility,
    startDrag,
    updateDrag,
    stopDrag,
    zoom
  } = useAlchemyGridState();

  const tooltipTimeoutRef = useRef(null);

  // Initialize nodes on mount
  useEffect(() => {
    initializeNodes();
    console.log('✅ Alchemy grid initialized with modular architecture');
  }, [initializeNodes]);

  // Add some example connections when component mounts
  useEffect(() => {
    if (state.nodes.size > 0) {
      setTimeout(() => {
        // Connect input to prima materia
        addConnection('input', 'prima');
        // Connect prima to hub
        addConnection('prima', 'hub');
        // Connect hub to solutio
        addConnection('hub', 'solutio');
        // Connect solutio to coagulatio
        addConnection('solutio', 'coagulatio');
        // Connect coagulatio to output
        addConnection('coagulatio', 'output');
      }, 1000);
    }
  }, [state.nodes.size, addConnection]);

  const handleNodeHover = useCallback((nodeId, event) => {
    if (nodeId) {
      setHoveredNode(nodeId);
      
      // Set tooltip with delay for better UX
      setTimeout(() => {
        const node = state.nodes.find(n => n.id === nodeId);
        if (node) {
          // Get the SVG element to calculate proper screen coordinates
          const svgElement = event.target.closest('svg');
          if (svgElement) {
            const svgRect = svgElement.getBoundingClientRect();
            const centerX = svgRect.width / 2;
            const centerY = svgRect.height / 2;
            
            // Calculate the actual screen position of the node
            const screenX = svgRect.left + centerX + (node.x * state.transform.scale) + state.transform.x;
            const screenY = svgRect.top + centerY + (node.y * state.transform.scale) + state.transform.y;
            
            setTooltip({
              nodeId,
              position: { x: screenX, y: screenY },
              node
            });
          } else {
            // Fallback to mouse position
            const tooltipX = event.clientX;
            const tooltipY = event.clientY;
            
            setTooltip({
              nodeId,
              position: { x: tooltipX, y: tooltipY },
              node
            });
          }
        }
      }, 50); // Reduced timeout for faster tooltip appearance
    } else {
      setTooltip(null);
    }
  }, [setHoveredNode, setTooltip, state.nodes, state.transform]);

  const handleNodeClick = useCallback((nodeId) => {
    // Add your node click logic here
  }, []);

  const handlePolygonHoverEnter = useCallback((nodeId) => {
    handleNodeHover(nodeId);
  }, [handleNodeHover]);

  const handlePolygonHoverLeave = useCallback(() => {
    handleNodeHover(null);
  }, [handleNodeHover]);

  const handleMouseDown = useCallback((event) => {
    if (event.button === 0 && event.target.tagName === 'svg') {
      startDrag({ x: event.clientX, y: event.clientY });
    }
  }, [startDrag]);

  const handleMouseMove = useCallback((event) => {
    if (state.isDragging && event.target.tagName === 'svg') {
      updateDrag({ x: event.clientX, y: event.clientY });
    }
  }, [state.isDragging, updateDrag]);

  const handleMouseUp = useCallback(() => {
    if (state.isDragging) {
      stopDrag();
    }
  }, [state.isDragging, stopDrag]);

  const handleWheel = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = event.clientX - rect.left;
    const centerY = event.clientY - rect.top;
    zoom(-event.deltaY, centerX, centerY);
  }, [zoom]);

  const handleGenerateClick = useCallback(() => {
    toggleConnectionsVisibility();
  }, [toggleConnectionsVisibility]);

  // Make generate button function available globally and provide SVG reference
  useEffect(() => {
    window.showAlchemyConnections = handleGenerateClick;
    // Make the SVG available for legacy animation systems
    const svgElement = document.querySelector('.modular-alchemy-grid svg');
    if (svgElement) {
      window.alchemySVGBoard = svgElement;
    }
    return () => {
      delete window.showAlchemyConnections;
      delete window.alchemySVGBoard;
    };
  }, [handleGenerateClick]);

  return (
    <div className="w-full h-full relative modular-alchemy-grid" style={{ background: 'transparent' }}>
      {/* Main Grid */}
      <AlchemyGridRenderer
        nodes={state.nodes}
        connections={state.connections}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        hoveredNode={state.hoveredNode}
        showNodes={state.showNodes}
        showConnections={state.showConnections}
        transform={state.transform}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        isDragging={state.isDragging}
      />
      
      {/* Tooltip */}
      {state.tooltip && (
        <NodeTooltip tooltip={state.tooltip} />
      )}
      
      {/* Debug info */}
      <div className="absolute top-4 left-4 text-white text-sm font-mono bg-black bg-opacity-50 p-2 rounded">
        Nodes: {state.nodes.size} | Connections: {state.showConnections ? 'Visible' : 'Hidden'} | Scale: {Math.round(state.transform.scale * 100)}%
      </div>
    </div>
  );
};

export default ModularAlchemyGrid;