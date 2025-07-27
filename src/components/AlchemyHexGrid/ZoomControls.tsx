import React from 'react';
import { motion } from 'framer-motion';

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onReset
}) => {
  const buttonVariants = {
    hover: {
      scale: 1.1,
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.95
    }
  };

  return (
    <div className="zoom-controls">
      <motion.button
        className="zoom-button"
        onClick={onZoomIn}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        disabled={zoomLevel >= 3}
        title="Zoom In"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 9V6a1 1 0 112 0v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3z" />
          <path fillRule="evenodd" d="M2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8zm6-4a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
        </svg>
      </motion.button>

      <div className="zoom-level">
        {Math.round(zoomLevel * 100)}%
      </div>

      <motion.button
        className="zoom-button"
        onClick={onZoomOut}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        disabled={zoomLevel <= 0.5}
        title="Zoom Out"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6 10a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" />
          <path fillRule="evenodd" d="M2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8zm6-4a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
        </svg>
      </motion.button>

      <motion.button
        className="zoom-button zoom-reset"
        onClick={onReset}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        title="Reset View"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
      </motion.button>
    </div>
  );
};

export default ZoomControls;