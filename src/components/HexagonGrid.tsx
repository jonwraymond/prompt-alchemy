import React from 'react';
import './HexagonGrid.css';

export const HexagonGrid: React.FC = () => {
  return (
    <div className="hexagon-grid">
      {/* Simple hexagon grid background */}
      <div className="hexagon-container">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="hexagon" />
        ))}
      </div>
    </div>
  );
};