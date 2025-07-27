import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Connection, PhaseNode } from './types';

interface ConnectionPathProps {
  connection: Connection;
  sourceNode: PhaseNode;
  targetNode: PhaseNode;
  animationSpeed: number;
}

const ConnectionPath: React.FC<ConnectionPathProps> = ({
  connection,
  sourceNode,
  targetNode,
  animationSpeed
}) => {
  // Calculate path between nodes
  const pathData = useMemo(() => {
    const sx = sourceNode.position.x;
    const sy = sourceNode.position.y;
    const tx = targetNode.position.x;
    const ty = targetNode.position.y;
    
    // Calculate control points for a curved path
    const dx = tx - sx;
    const dy = ty - sy;
    const cx = sx + dx * 0.5;
    const cy = sy + dy * 0.5;
    
    // Add some curve based on the connection type
    let curveOffset = 0;
    if (connection.id.includes('hub')) {
      curveOffset = 30;
    } else if (connection.id.includes('prima-solutio') || connection.id.includes('solutio-coagulatio')) {
      curveOffset = -20;
    }
    
    const cx1 = cx - dy * 0.2 + curveOffset;
    const cy1 = cy + dx * 0.2;
    
    return `M ${sx},${sy} Q ${cx1},${cy1} ${tx},${ty}`;
  }, [sourceNode.position, targetNode.position, connection.id]);

  // Animation variants
  const pathVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: {
          duration: 1.5 * animationSpeed,
          ease: "easeInOut"
        },
        opacity: {
          duration: 0.3 * animationSpeed
        }
      }
    }
  };

  const glowVariants = {
    inactive: {
      opacity: 0
    },
    active: {
      opacity: [0, 0.8, 0],
      transition: {
        duration: 2 * animationSpeed,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const flowVariants = {
    inactive: {
      opacity: 0
    },
    active: {
      opacity: [0, 1, 1, 0],
      offset: [0, 0.2, 0.8, 1],
      transition: {
        duration: 2 * animationSpeed,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <g className={`connection connection-${connection.active ? 'active' : 'inactive'}`}>
      {/* Main connection path */}
      <motion.path
        d={pathData}
        fill="none"
        stroke={connection.active ? '#8b5cf6' : '#4b5563'}
        strokeWidth="2"
        opacity={connection.active ? 1 : 0.3}
        initial="hidden"
        animate="visible"
        variants={pathVariants}
      />

      {/* Glow effect for active connections */}
      {connection.active && (
        <motion.path
          d={pathData}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="8"
          opacity={0.5}
          filter="url(#glow)"
          variants={glowVariants}
          initial="inactive"
          animate="active"
        />
      )}

      {/* Animated flow particles */}
      {connection.animated && (
        <>
          <defs>
            <linearGradient id={`flow-gradient-${connection.id}`}>
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Flow particles */}
          {[0, 0.33, 0.66].map((delay, i) => (
            <motion.circle
              key={i}
              r="4"
              fill="#8b5cf6"
              filter="url(#glow)"
              initial={{ offsetDistance: "0%", opacity: 0 }}
              animate={{
                offsetDistance: ["0%", "100%"],
                opacity: [0, 1, 1, 0]
              }}
              transition={{
                duration: 3 * animationSpeed,
                repeat: Infinity,
                delay: delay * 3 * animationSpeed,
                ease: "linear"
              }}
              style={{
                offsetPath: `path('${pathData}')`,
                offsetRotate: "auto"
              }}
            >
              <animate
                attributeName="r"
                values="3;6;3"
                dur={`${2 * animationSpeed}s`}
                repeatCount="indefinite"
              />
            </motion.circle>
          ))}

          {/* Energy trail */}
          <motion.path
            d={pathData}
            fill="none"
            stroke={`url(#flow-gradient-${connection.id})`}
            strokeWidth="20"
            opacity={0.3}
            strokeDasharray="100 200"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -300 }}
            transition={{
              duration: 3 * animationSpeed,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </>
      )}

      {/* Connection label */}
      {connection.label && (
        <text
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="12"
          dy="-5"
        >
          <textPath href={`#path-${connection.id}`} startOffset="50%">
            {connection.label}
          </textPath>
        </text>
      )}

      {/* Hidden path for text */}
      <path
        id={`path-${connection.id}`}
        d={pathData}
        fill="none"
        stroke="none"
      />
    </g>
  );
};

export default ConnectionPath;