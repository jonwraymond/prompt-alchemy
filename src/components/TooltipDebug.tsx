import React, { useState } from 'react';

export const TooltipDebug: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    console.log('[TooltipDebug] Mouse enter');
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({ x: rect.right + 10, y: rect.top });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    console.log('[TooltipDebug] Mouse leave');
    setShowTooltip(false);
  };

  return (
    <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 10000 }}>
      <h3 style={{ color: 'white', marginBottom: '10px' }}>Tooltip Debug Test</h3>
      
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: '20px',
          height: '20px',
          backgroundColor: '#10b981',
          borderRadius: '50%',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      />
      
      {showTooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            zIndex: 99999,
            pointerEvents: 'none'
          }}
        >
          Test Tooltip - Working!
        </div>
      )}
      
      <div style={{ color: 'white', fontSize: '12px' }}>
        <p>Tooltip visible: {showTooltip ? 'YES' : 'NO'}</p>
        <p>Position: {tooltipPosition.x}, {tooltipPosition.y}</p>
      </div>
    </div>
  );
};