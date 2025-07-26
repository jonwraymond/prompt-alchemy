import React from 'react';
import ReactDOM from 'react-dom/client';
import ModularAlchemyGrid from './ModularAlchemyGrid.jsx';

// Export components for global access
window.React = React;
window.ReactDOM = ReactDOM;
window.ModularAlchemyGrid = ModularAlchemyGrid;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('hex-flow-container');
  if (container) {
    // Clear any existing content
    container.innerHTML = '<div id="react-hex-root" style="width: 100%; height: 100%;"></div>';
    
    const root = ReactDOM.createRoot(document.getElementById('react-hex-root'));
    root.render(<ModularAlchemyGrid />);
    
    console.log('✅ Modular Alchemy Grid initialized successfully');
  }
});

export { ModularAlchemyGrid };