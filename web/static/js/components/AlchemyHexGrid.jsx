import React, { useState, useEffect, useRef, useCallback } from 'react';

// Icon mapping for modern SVG icons
const getModernIcon = (iconName) => {
  // Access the global ModernIcons system loaded by modern-icons.js
  if (typeof window !== 'undefined' && window.getIcon) {
    return window.getIcon(iconName, 'modern-hex-icon', 20);
  }
  return null;
};

// Alchemy-specific node configuration with modern SVG icons
const ALCHEMY_NODES = [
  { id: 'hub', x: 500, y: 350, icon: 'transmutationCore', title: 'Transmutation Core', description: 'The heart of alchemical transformation', color: '#ff6b35', type: 'core', phase: 2 },
  { id: 'input', x: 150, y: 350, icon: 'inputGateway', title: 'Input Gateway', description: 'Where raw ideas enter', color: '#00ff88', type: 'gateway' },
  { id: 'output', x: 850, y: 350, icon: 'outputGateway', title: 'Output Portal', description: 'Refined prompts emerge', color: '#ffd700', type: 'gateway' },
  { id: 'prima', x: 350, y: 200, icon: 'primaMateriaLab', title: 'Prima Materia', description: 'First Matter - Raw essence extraction', color: '#ff6b6b', type: 'phase-prima', phase: 1 },
  { id: 'solutio', x: 650, y: 200, icon: 'solutioDrop', title: 'Solutio', description: 'Dissolution - Breaking down and refining', color: '#4ecdc4', type: 'phase-solutio', phase: 3 },
  { id: 'coagulatio', x: 500, y: 500, icon: 'coagulatioCrystal', title: 'Coagulatio', description: 'Crystallization - Final form', color: '#45b7d1', type: 'phase-coagulatio', phase: 4 },
  { id: 'parse', x: 250, y: 150, icon: 'parseStructure', title: 'Parse', color: '#95a5a6', type: 'process' },
  { id: 'extract', x: 300, y: 100, icon: 'extractConcepts', title: 'Extract', color: '#95a5a6', type: 'process' },
  { id: 'validate', x: 400, y: 100, icon: 'qualityCheck', title: 'Validate', color: '#95a5a6', type: 'process' },
  { id: 'refine', x: 750, y: 150, icon: 'refineStyle', title: 'Refine', color: '#95a5a6', type: 'process' },
  { id: 'flow', x: 700, y: 100, icon: 'languageFlow', title: 'Flow', color: '#95a5a6', type: 'process' },
  { id: 'finalize', x: 600, y: 100, icon: 'finalize', title: 'Finalize', color: '#95a5a6', type: 'process' },
  { id: 'optimize', x: 400, y: 580, icon: 'multiPhaseOptimizer', title: 'Optimize', color: '#95a5a6', type: 'feature' },
  { id: 'judge', x: 500, y: 620, icon: 'aiJudge', title: 'Judge', color: '#95a5a6', type: 'feature' },
  { id: 'database', x: 600, y: 580, icon: 'vectorStorage', title: 'Database', color: '#95a5a6', type: 'feature' },
  { id: 'openai', x: 150, y: 150, icon: 'openAI', title: 'OpenAI', color: '#10a37f', type: 'provider' },
  { id: 'anthropic', x: 850, y: 150, icon: 'anthropic', title: 'Anthropic', color: '#7c3aed', type: 'provider' },
  { id: 'google', x: 150, y: 550, icon: 'google', title: 'Google', color: '#4285f4', type: 'provider' },
  { id: 'ollama', x: 850, y: 550, icon: 'ollama', title: 'Ollama', color: '#000000', type: 'provider' },
];

const CONNECTIONS = [
  { from: 'input', to: 'prima', type: 'flow', animated: true },
  { from: 'prima', to: 'hub', type: 'phase' },
  { from: 'hub', to: 'solutio', type: 'phase' },
  { from: 'solutio', to: 'coagulatio', type: 'phase' },
  { from: 'coagulatio', to: 'output', type: 'flow', animated: true },
  { from: 'prima', to: 'parse', type: 'support' },
  { from: 'prima', to: 'extract', type: 'support' },
  { from: 'solutio', to: 'flow', type: 'support' },
  { from: 'solutio', to: 'refine', type: 'support' },
  { from: 'coagulatio', to: 'validate', type: 'support' },
  { from: 'coagulatio', to: 'finalize', type: 'support' },
];

// Hexagon path generator
const createHexPath = (size = 40) => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = size * Math.cos(angle);
    const y = size * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
};

// Individual hex node component
const AlchemyHexNode = ({ node, isHovered, onHover, onTooltipShow, onTooltipHide }) => {
  const hexSize = 40;
  const hexPath = createHexPath(hexSize);
  
  // Debug positioning
  console.log(`🎯 Rendering node ${node.id} at position (${node.x}, ${node.y})`);
  
  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onMouseEnter={(e) => {
        onHover(node.id);
        onTooltipShow(node, e);
      }}
      onMouseLeave={() => {
        onHover(null);
        onTooltipHide();
      }}
      style={{ 
        cursor: 'pointer',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.3s ease-out'
      }}
      className="alchemy-hex-node"
    >
      {/* Shadow */}
      <polygon
        points={hexPath}
        fill="#000000"
        opacity="0.3"
        transform="translate(2, 2)"
      />
      
      {/* Gradient and glow definitions */}
      <defs>
        <linearGradient id={`gradient-${node.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={node.color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={node.color} stopOpacity="0.4" />
        </linearGradient>
        
        {/* Alchemy glow filter */}
        <filter id={`alchemy-glow-${node.id}`}>
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Main hexagon with alchemy glow effect */}
      <polygon
        points={hexPath}
        fill={`url(#gradient-${node.id})`}
        stroke={node.color}
        strokeWidth={isHovered ? "3" : "2"}
        className="hex-shape"
        style={{
          filter: isHovered 
            ? `url(#alchemy-glow-${node.id}) drop-shadow(0 0 20px ${node.color}) brightness(1.3) saturate(1.2)`
            : 'brightness(1) saturate(1)',
          transition: 'all 0.3s ease-out',
          animation: isHovered ? 'alchemyGlow 2s ease-in-out infinite alternate' : 'none'
        }}
      />
      
      {/* Modern SVG Icon */}
      <foreignObject
        x="-12"
        y="-12"
        width="24"
        height="24"
        className="hex-icon"
        style={{
          transform: isHovered ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.3s ease-out',
          filter: isHovered ? `drop-shadow(0 0 10px ${node.color})` : 'none'
        }}
      >
        <div 
          style={{ 
            width: '24px', 
            height: '24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white'
          }}
          dangerouslySetInnerHTML={{ 
            __html: getModernIcon(node.icon) || '●' 
          }}
        />
      </foreignObject>
      
      {/* Hover border with alchemy pulse animation */}
      {isHovered && (
        <polygon
          points={createHexPath(44)}
          fill="none"
          stroke={node.color}
          strokeWidth="3"
          opacity="0"
          className="hex-hover-border"
          style={{
            animation: 'alchemyPulse 2s ease-in-out infinite'
          }}
        />
      )}
    </g>
  );
};

// Curved connection component - arched lines as requested
const AlchemyConnection = ({ from, to, type, animated }) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Create curved/arched path
  const curvature = Math.min(distance * 0.3, 80);
  const midX = from.x + dx / 2;
  const midY = from.y + dy / 2;
  
  // Perpendicular offset for curve
  const angle = Math.atan2(dy, dx) + Math.PI / 2;
  const ctrlX = midX + Math.cos(angle) * curvature;
  const ctrlY = midY + Math.sin(angle) * curvature;
  
  const pathData = `M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}`;
  
  const strokeColor = type === 'phase' ? '#3498db' : 
                     type === 'flow' ? '#00ff88' : 
                     '#95a5a6';
  const strokeWidth = type === 'phase' ? 3 : 2;
  
  return (
    <g className="connection-group">
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity="0.6"
        strokeDasharray={type === 'flow' ? '5,5' : undefined}
        className="connection-path"
        style={{
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        }}
      />
      
      {animated && (
        <circle r="4" fill={strokeColor} className="flow-particle" style={{filter: `drop-shadow(0 0 4px ${strokeColor})`}}>
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

// Diablo-style tooltip component
const AlchemyTooltip = ({ node, position }) => {
  if (!node) return null;
  
  const rarityColors = {
    'core': { bg: '#8B4513', text: '#FFD700', rarity: 'Legendary' },
    'phase-prima': { bg: '#8B0000', text: '#FF6B6B', rarity: 'Epic' },
    'phase-solutio': { bg: '#008B8B', text: '#4ECDC4', rarity: 'Epic' },
    'phase-coagulatio': { bg: '#00008B', text: '#45B7D1', rarity: 'Epic' },
    'gateway': { bg: '#228B22', text: '#00FF88', rarity: 'Rare' },
    'process': { bg: '#696969', text: '#D3D3D3', rarity: 'Common' },
    'feature': { bg: '#4B0082', text: '#9370DB', rarity: 'Uncommon' },
    'provider': { bg: '#FF8C00', text: '#FFA500', rarity: 'Unique' }
  };
  
  const style = rarityColors[node.type] || rarityColors['process'];
  
  return (
    <div
      className="alchemy-tooltip"
      style={{
        position: 'fixed',
        left: position.x + 15,
        top: position.y - 10,
        background: style.bg,
        border: `2px solid ${style.text}`,
        color: style.text,
        padding: '12px 16px',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 1000,
        pointerEvents: 'none',
        minWidth: '200px',
        opacity: 1,
        transform: 'translateY(0)',
        transition: 'all 0.3s ease-out'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{node.title}</div>
      <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px' }}>{style.rarity}</div>
      {node.description && (
        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>{node.description}</div>
      )}
      {node.phase && (
        <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
          Phase {node.phase}
        </div>
      )}
    </div>
  );
};

// Main Alchemy Hex Grid Component - React-based replacement for legacy system
const AlchemyHexGrid = () => {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showConnections, setShowConnections] = useState(false);
  const tooltipTimeout = useRef(null);
  
  // Cleanup legacy systems and setup generate button listener
  useEffect(() => {
    console.log('🗑️ React AlchemyHexGrid: Destroying legacy systems...');
    
    // Remove legacy elements
    const legacySelectors = [
      '.hex-node:not(.alchemy-hex-node)',
      '.enhanced-hex-node',
      '.unified-hex-flow'
    ];
    
    legacySelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        console.log(`🗑️ Removing legacy element: ${selector}`);
        el.remove();
      });
    });
    
    // Setup generate button listener to show connections
    const generateBtn = document.getElementById('central-send');
    if (generateBtn) {
      const handleGenerate = () => {
        console.log('🔗 Generate button clicked - showing connections');
        setShowConnections(true);
      };
      
      generateBtn.addEventListener('click', handleGenerate);
      
      // Cleanup listener on unmount
      return () => {
        generateBtn.removeEventListener('click', handleGenerate);
      };
    }
    
    console.log('✅ Legacy cleanup complete, React system active');
  }, []);
  
  const handleNodeHover = useCallback((nodeId) => {
    setHoveredNode(nodeId);
  }, []);
  
  const handleTooltipShow = useCallback((node, event) => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }
    
    tooltipTimeout.current = setTimeout(() => {
      setTooltip(node);
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }, 500);
  }, []);
  
  const handleTooltipHide = useCallback(() => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }
    setTooltip(null);
  }, []);
  
  const getNode = (id) => ALCHEMY_NODES.find(n => n.id === id);
  
  return (
    <div className="alchemy-hex-grid-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        width="1000"
        height="700"
        viewBox="0 0 1000 700"
        className="alchemy-hex-grid"
        style={{
          background: 'transparent',
          width: '100%',
          height: '100%'
        }}
      >
        {/* Connections layer - arched lines (hidden by default, shown after generate) */}
        {showConnections && (
          <g className="connections-layer">
            {CONNECTIONS.map((conn, idx) => {
              const fromNode = getNode(conn.from);
              const toNode = getNode(conn.to);
              if (!fromNode || !toNode) return null;
              
              return (
                <AlchemyConnection
                  key={idx}
                  from={fromNode}
                  to={toNode}
                  type={conn.type}
                  animated={conn.animated}
                />
              );
            })}
          </g>
        )}
        
        {/* Nodes layer - icon only with alchemy glow */}
        <g className="nodes-layer">
          {ALCHEMY_NODES.map(node => (
            <AlchemyHexNode
              key={node.id}
              node={node}
              isHovered={hoveredNode === node.id}
              onHover={handleNodeHover}
              onTooltipShow={handleTooltipShow}
              onTooltipHide={handleTooltipHide}
            />
          ))}
        </g>
      </svg>
      
      {/* Diablo-style tooltip */}
      {tooltip && (
        <AlchemyTooltip node={tooltip} position={tooltipPosition} />
      )}
      
      <style jsx>{`
        @keyframes alchemyPulse {
          0% {
            opacity: 0;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          100% {
            opacity: 0;
            transform: scale(1.1);
          }
        }
        
        @keyframes alchemyGlow {
          0% {
            filter: brightness(1.3) saturate(1.2) drop-shadow(0 0 15px currentColor);
          }
          100% {
            filter: brightness(1.5) saturate(1.4) drop-shadow(0 0 25px currentColor) drop-shadow(0 0 35px currentColor);
          }
        }
        
        .alchemy-hex-node {
          transition: transform 0.2s ease-out;
        }
        
        .alchemy-hex-node:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default AlchemyHexGrid;