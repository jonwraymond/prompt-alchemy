import React from 'react';
import { motion } from 'framer-motion';
import { PhaseNode } from './types';

interface PhaseTooltipProps {
  node: PhaseNode;
  position: { x: number; y: number };
  onClose: () => void;
}

const PhaseTooltip: React.FC<PhaseTooltipProps> = ({ node, position, onClose }) => {
  // Format processing time
  const formatTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Get status color
  const getStatusColor = () => {
    switch (node.status) {
      case 'active': return '#8b5cf6';
      case 'complete': return '#10b981';
      case 'error': return '#ef4444';
      case 'ready': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  // Get phase description
  const getPhaseDescription = () => {
    switch (node.phase) {
      case 'prima-materia':
        return 'Extracting and structuring the raw essence of your input';
      case 'solutio':
        return 'Dissolving into natural language form, finding clarity';
      case 'coagulatio':
        return 'Crystallizing into the final, optimized prompt';
      default:
        return node.type === 'hub' 
          ? 'The central alchemical engine orchestrating the transformation'
          : node.type === 'input'
          ? 'Your original prompt enters the alchemical process here'
          : node.type === 'output'
          ? 'The refined result of the alchemical transformation'
          : '';
    }
  };

  const tooltipVariants = {
    initial: {
      opacity: 0,
      scale: 0.8,
      y: 10
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 10,
      transition: {
        duration: 0.15
      }
    }
  };

  // Calculate position to keep tooltip on screen
  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x + 20,
    top: position.y - 10,
    transform: 'translateY(-100%)',
    zIndex: 1000
  };

  return (
    <motion.div
      className="phase-tooltip"
      style={tooltipStyle}
      variants={tooltipVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onMouseLeave={onClose}
    >
      <div className="tooltip-content">
        <div className="tooltip-header">
          <h3>{node.label}</h3>
          <span 
            className="tooltip-status"
            style={{ color: getStatusColor() }}
          >
            {node.status.toUpperCase()}
          </span>
        </div>

        <p className="tooltip-description">
          {getPhaseDescription()}
        </p>

        {node.type === 'phase' && (
          <div className="tooltip-stats">
            <div className="stat">
              <span className="stat-label">Processing Time:</span>
              <span className="stat-value">{formatTime(node.processingTime)}</span>
            </div>
            {node.promptCount !== undefined && (
              <div className="stat">
                <span className="stat-label">Prompts Generated:</span>
                <span className="stat-value">{node.promptCount}</span>
              </div>
            )}
            {node.progress !== undefined && (
              <div className="stat">
                <span className="stat-label">Progress:</span>
                <span className="stat-value">{node.progress}%</span>
              </div>
            )}
          </div>
        )}

        {node.currentPrompt && (
          <div className="tooltip-prompt">
            <span className="prompt-label">Current Output:</span>
            <p className="prompt-preview">{node.currentPrompt}</p>
          </div>
        )}

        {node.type === 'phase' && (
          <div className="tooltip-alchemical">
            <span className="alchemical-symbol">
              {node.phase === 'prima-materia' && '🜍'}
              {node.phase === 'solutio' && '🜄'}
              {node.phase === 'coagulatio' && '🜘'}
            </span>
          </div>
        )}
      </div>

      <div className="tooltip-arrow" />
    </motion.div>
  );
};

export default PhaseTooltip;