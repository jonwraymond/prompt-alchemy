import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import './StatusIndicator.css';

export type StatusType = 'operational' | 'degraded' | 'down';

export interface SystemStatus {
  id: string;
  name: string;
  status: StatusType;
  lastCheck: Date;
  details?: string;
  responseTime?: number;
}

interface StatusIndicatorProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoRefresh?: boolean;
  refreshInterval?: number;
  showTooltips?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  position = 'bottom-right',
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  showTooltips = true
}) => {
  const [systems, setSystems] = useState<SystemStatus[]>([
    { id: 'api', name: 'API Server', status: 'down', lastCheck: new Date() },
    { id: 'engine', name: 'Alchemy Engine', status: 'down', lastCheck: new Date() },
    { id: 'providers', name: 'LLM Providers', status: 'down', lastCheck: new Date() },
    { id: 'database', name: 'Database', status: 'down', lastCheck: new Date() }
  ]);
  
  const [overallStatus, setOverallStatus] = useState<StatusType>('down');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const checkSystemHealth = async () => {
    const updatedSystems: SystemStatus[] = [...systems];
    
    try {
      // Check API Health
      const startTime = Date.now();
      const healthResponse = await api.health();
      const apiResponseTime = Date.now() - startTime;
      
      updatedSystems[0] = {
        ...updatedSystems[0],
        status: healthResponse.success ? 'operational' : 'down',
        lastCheck: new Date(),
        responseTime: apiResponseTime,
        details: healthResponse.success 
          ? `API responding in ${apiResponseTime}ms` 
          : healthResponse.error || 'API not responding'
      };

      if (healthResponse.success) {
        // Check Engine Status
        try {
          const statusResponse = await api.status();
          updatedSystems[1] = {
            ...updatedSystems[1],
            status: statusResponse.success ? 'operational' : 'degraded',
            lastCheck: new Date(),
            details: statusResponse.success 
              ? `Engine operational - Learning mode: ${statusResponse.data?.learning_mode ? 'enabled' : 'disabled'}`
              : 'Engine status unknown'
          };
        } catch {
          updatedSystems[1] = {
            ...updatedSystems[1],
            status: 'degraded',
            lastCheck: new Date(),
            details: 'Engine status check failed'
          };
        }

        // Check Providers
        try {
          const providersResponse = await api.getProviders();
          const providerCount = providersResponse.data?.providers?.length || 0;
          const availableProviders = providersResponse.data?.providers?.filter(p => p.available).length || 0;
          
          let providerStatus: StatusType = 'operational';
          if (availableProviders === 0) {
            providerStatus = 'down';
          } else if (availableProviders < providerCount) {
            providerStatus = 'degraded';
          }

          updatedSystems[2] = {
            ...updatedSystems[2],
            status: providerStatus,
            lastCheck: new Date(),
            details: `${availableProviders}/${providerCount} providers available`
          };
        } catch {
          updatedSystems[2] = {
            ...updatedSystems[2],
            status: 'down',
            lastCheck: new Date(),
            details: 'Provider check failed'
          };
        }

        // Database status (inferred from API health)
        updatedSystems[3] = {
          ...updatedSystems[3],
          status: 'operational',
          lastCheck: new Date(),
          details: 'Database accessible via API'
        };
      } else {
        // If API is down, mark dependent systems as unknown/degraded
        updatedSystems[1] = { ...updatedSystems[1], status: 'down', details: 'Cannot check - API down' };
        updatedSystems[2] = { ...updatedSystems[2], status: 'down', details: 'Cannot check - API down' };
        updatedSystems[3] = { ...updatedSystems[3], status: 'down', details: 'Cannot check - API down' };
      }

    } catch (error) {
      // Complete system failure
      updatedSystems.forEach((system, index) => {
        updatedSystems[index] = {
          ...system,
          status: 'down',
          lastCheck: new Date(),
          details: 'System check failed'
        };
      });
    }

    setSystems(updatedSystems);
    
    // Calculate overall status
    const statuses = updatedSystems.map(s => s.status);
    if (statuses.every(s => s === 'operational')) {
      setOverallStatus('operational');
    } else if (statuses.some(s => s === 'operational')) {
      setOverallStatus('degraded');
    } else {
      setOverallStatus('down');
    }
  };

  useEffect(() => {
    // Initial check
    checkSystemHealth();

    // Set up auto-refresh
    if (autoRefresh) {
      intervalRef.current = setInterval(checkSystemHealth, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  // Handle click outside tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setActiveTooltip(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (status: StatusType): string => {
    switch (status) {
      case 'operational': return '#22c55e'; // Subdued green
      case 'degraded': return '#f59e0b';    // Subdued yellow  
      case 'down': return '#ef4444';        // Subdued red
      default: return '#6b7280';            // Gray
    }
  };

  const getStatusText = (status: StatusType): string => {
    switch (status) {
      case 'operational': return 'Operational';
      case 'degraded': return 'Degraded';
      case 'down': return 'Down';
      default: return 'Unknown';
    }
  };

  const formatLastCheck = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    return `${Math.floor(diffSecs / 3600)}h ago`;
  };

  const handleDotClick = (systemId: string) => {
    if (showTooltips) {
      setActiveTooltip(activeTooltip === systemId ? null : systemId);
    }
  };

  const handleOverallClick = () => {
    setIsExpanded(!isExpanded);
    setActiveTooltip(null);
  };

  return (
    <div className={`status-indicator ${position}`}>
      {/* Overall Status Dot */}
      <div 
        className="status-dot overall"
        onClick={handleOverallClick}
        style={{ backgroundColor: getStatusColor(overallStatus) }}
        title={showTooltips ? `Overall Status: ${getStatusText(overallStatus)} (click for details)` : ''}
      >
        <div className="status-pulse" style={{ backgroundColor: getStatusColor(overallStatus) }} />
      </div>

      {/* Individual System Dots (shown when expanded) */}
      {isExpanded && (
        <div className="system-dots">
          {systems.map((system) => (
            <div key={system.id} className="system-dot-container">
              <div
                className={`status-dot system ${activeTooltip === system.id ? 'active' : ''}`}
                onClick={() => handleDotClick(system.id)}
                style={{ backgroundColor: getStatusColor(system.status) }}
                title={showTooltips ? `${system.name}: ${getStatusText(system.status)}` : ''}
              >
                <div className="status-pulse" style={{ backgroundColor: getStatusColor(system.status) }} />
              </div>

              {/* Tooltip */}
              {activeTooltip === system.id && showTooltips && (
                <div className="status-tooltip" ref={tooltipRef}>
                  <div className="tooltip-header">
                    <span className="tooltip-title">{system.name}</span>
                    <span 
                      className="tooltip-status"
                      style={{ color: getStatusColor(system.status) }}
                    >
                      {getStatusText(system.status)}
                    </span>
                  </div>
                  <div className="tooltip-details">
                    {system.details && <p>{system.details}</p>}
                    {system.responseTime && (
                      <p>Response time: {system.responseTime}ms</p>
                    )}
                    <p className="tooltip-timestamp">
                      Last checked: {formatLastCheck(system.lastCheck)}
                    </p>
                  </div>
                  <button 
                    className="tooltip-refresh"
                    onClick={(e) => {
                      e.stopPropagation();
                      checkSystemHealth();
                      setActiveTooltip(null);
                    }}
                  >
                    Refresh Status
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Collapse button when expanded */}
      {isExpanded && (
        <button 
          className="collapse-btn"
          onClick={handleOverallClick}
          title="Collapse status view"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default StatusIndicator;