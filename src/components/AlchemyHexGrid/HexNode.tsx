import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PhaseNode, HexMetrics } from './types';

interface HexNodeProps {
  node: PhaseNode;
  metrics: HexMetrics;
  focused: boolean;
  onClick: (node: PhaseNode) => void;
  onHover: (node: PhaseNode | null, event?: React.MouseEvent) => void;
  animationSpeed: number;
}

const HexNode: React.FC<HexNodeProps> = ({
  node,
  metrics,
  focused,
  onClick,
  onHover,
  animationSpeed
}) => {
  // Generate hexagon path
  const hexPath = useMemo(() => {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = metrics.size * Math.cos(angle);
      const y = metrics.size * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return `M${points.join(' L')} Z`;
  }, [metrics.size]);

  // Node colors based on type and status
  const getNodeColor = () => {
    if (node.status === 'error') return '#ef4444';
    if (node.status === 'inactive') return '#374151';
    
    switch (node.type) {
      case 'hub':
        return node.status === 'active' ? '#8b5cf6' : '#6b21a8';
      case 'input':
        return node.status === 'complete' ? '#10b981' : '#3b82f6';
      case 'output':
        return node.status === 'complete' ? '#fbbf24' : '#374151';
      case 'phase':
        switch (node.phase) {
          case 'prima-materia':
            return node.status === 'active' ? '#dc2626' : node.status === 'complete' ? '#b91c1c' : '#7f1d1d';
          case 'solutio':
            return node.status === 'active' ? '#3b82f6' : node.status === 'complete' ? '#2563eb' : '#1e3a8a';
          case 'coagulatio':
            return node.status === 'active' ? '#f59e0b' : node.status === 'complete' ? '#d97706' : '#92400e';
          default:
            return '#6b7280';
        }
      default:
        return '#6b7280';
    }
  };

  // Animation variants
  const nodeVariants = {
    initial: {
      scale: 0,
      opacity: 0,
      rotate: -180
    },
    animate: {
      scale: focused ? 1.2 : 1,
      opacity: 1,
      rotate: 0,
      transition: {
        duration: 0.5 * animationSpeed,
        ease: 'easeOut'
      }
    },
    hover: {
      scale: 1.1,
      transition: {
        duration: 0.2 * animationSpeed
      }
    },
    active: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1 * animationSpeed,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  const glowVariants = {
    active: {
      opacity: [0.3, 0.8, 0.3],
      scale: [1, 1.3, 1],
      transition: {
        duration: 2 * animationSpeed,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    },
    inactive: {
      opacity: 0,
      scale: 1
    }
  };

  return (
    <motion.g
      className={`hex-node hex-node-${node.type} hex-node-${node.status}`}
      transform={`translate(${node.position.x}, ${node.position.y})`}
      initial="initial"
      animate={node.status === 'active' ? 'active' : 'animate'}
      whileHover="hover"
      variants={nodeVariants}
      onClick={() => onClick(node)}
      onMouseEnter={(e) => onHover(node, e)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'pointer' }}
    >
      {/* Glow effect for active nodes */}
      {node.status === 'active' && (
        <motion.path
          d={hexPath}
          fill={getNodeColor()}
          opacity={0.3}
          filter="url(#glow)"
          variants={glowVariants}
          animate="active"
          initial="inactive"
        />
      )}

      {/* Main hexagon */}
      <path
        d={hexPath}
        fill={getNodeColor()}
        stroke="#fff"
        strokeWidth="2"
        opacity={node.status === 'inactive' ? 0.5 : 1}
      />

      {/* Inner decoration for phase nodes */}
      {node.type === 'phase' && (
        <path
          d={hexPath}
          fill="none"
          stroke="#fff"
          strokeWidth="1"
          opacity={0.3}
          transform="scale(0.8)"
        />
      )}

      {/* Node icon/symbol */}
      <g className="node-icon">
        {node.type === 'hub' && (
          <circle r="15" fill="#fff" opacity={0.8} />
        )}
        {node.type === 'input' && (
          <path
            d="M -15,-10 L 15,0 L -15,10 Z"
            fill="#fff"
            opacity={0.8}
          />
        )}
        {node.type === 'output' && (
          <path
            d="M -15,-10 L 15,-10 L 15,10 L -15,10 Z"
            fill="#fff"
            opacity={0.8}
          />
        )}
        {node.type === 'phase' && (
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize="24"
            fontWeight="bold"
            opacity={0.8}
          >
            {node.phase === 'prima-materia' && '🜍'}
            {node.phase === 'solutio' && '🜄'}
            {node.phase === 'coagulatio' && '🜘'}
          </text>
        )}
      </g>

      {/* Label */}
      <text
        y={metrics.size + 20}
        textAnchor="middle"
        fill="#fff"
        fontSize="14"
        fontWeight="500"
        className="node-label"
      >
        {node.label}
      </text>

      {/* Progress indicator for active nodes */}
      {node.status === 'active' && node.progress !== undefined && (
        <g transform={`translate(0, ${-metrics.size - 10})`}>
          <rect
            x="-30"
            y="-4"
            width="60"
            height="8"
            fill="#1f2937"
            rx="4"
          />
          <motion.rect
            x="-30"
            y="-4"
            width="60"
            height="8"
            fill="#10b981"
            rx="4"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: node.progress / 100 }}
            style={{ transformOrigin: 'left center' }}
            transition={{ duration: 0.3 * animationSpeed }}
          />
        </g>
      )}
    </motion.g>
  );
};

export default HexNode;