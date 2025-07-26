import React, { useState, useEffect } from 'react';

const ToolbarStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    const checkConnection = () => {
      // Check if we can detect VSCode connection
      const hasVSCodeConnection = window.location.hostname === 'localhost' && 
        (window.location.port === '5173' || window.location.port === '3000');
      
      // Check for 21st.dev toolbar presence
      const hasToolbar = document.querySelector('[data-21st-toolbar]') || 
        document.querySelector('.twenty-first-toolbar') ||
        document.querySelector('[class*="toolbar"]');
      
      if (hasToolbar) {
        setStatus('connected');
      } else {
        setStatus('disconnected');
      }
      
      setLastCheck(new Date());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return '#10b981';
      case 'disconnected': return '#ef4444';
      case 'checking': return '#f59e0b';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return '✅ Connected to VSCode';
      case 'disconnected': return '❌ VSCode Extension Not Active';
      case 'checking': return '🔄 Checking Connection...';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '60px',
      right: '10px',
      zIndex: 1000,
      padding: '12px',
      backgroundColor: '#1f2937',
      color: 'white',
      borderRadius: '8px',
      fontSize: '12px',
      minWidth: '200px',
      border: `2px solid ${getStatusColor()}`,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        🔧 21st.dev Toolbar Status
      </div>
      <div style={{ marginBottom: '8px' }}>
        {getStatusText()}
      </div>
      <div style={{ fontSize: '10px', opacity: 0.7 }}>
        Last check: {lastCheck.toLocaleTimeString()}
      </div>
      
      {status === 'disconnected' && (
        <div style={{ 
          marginTop: '8px', 
          padding: '8px', 
          backgroundColor: '#dc2626', 
          borderRadius: '4px',
          fontSize: '11px'
        }}>
          <strong>To activate:</strong>
          <br />1. Open VSCode with this project
          <br />2. Ensure 21st.21st-extension is enabled
          <br />3. Look for toolbar at bottom of page
        </div>
      )}
    </div>
  );
};

export default ToolbarStatus; 