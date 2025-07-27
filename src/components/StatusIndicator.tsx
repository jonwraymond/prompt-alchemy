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
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  const checkSystemHealth = async () => {
    const updatedSystems: SystemStatus[] = [...systems];
    let healthCheckError: string | null = null;
    
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
          const responseData = providersResponse.data;
          
          if (responseData && 'total_providers' in responseData) {
            // New backend response format with summary data
            const totalProviders = responseData.total_providers || 0;
            const availableProviders = responseData.available_providers || 0;
            const embeddingProviders = responseData.embedding_providers || 0;
            
            let providerStatus: StatusType = 'operational';
            let statusDetails = '';
            
            if (totalProviders === 0) {
              providerStatus = 'down';
              statusDetails = 'No providers configured';
            } else if (availableProviders === 0) {
              providerStatus = 'degraded';
              statusDetails = `${totalProviders} providers configured, but none available (check API keys)`;
            } else if (availableProviders < totalProviders) {
              providerStatus = 'degraded';
              statusDetails = `${availableProviders}/${totalProviders} providers available`;
              if (embeddingProviders > 0) {
                statusDetails += `, ${embeddingProviders} support embeddings`;
              }
            } else {
              providerStatus = 'operational';
              statusDetails = `All ${totalProviders} providers available`;
              if (embeddingProviders > 0) {
                statusDetails += `, ${embeddingProviders} support embeddings`;
              }
            }

            updatedSystems[2] = {
              ...updatedSystems[2],
              status: providerStatus,
              lastCheck: new Date(),
              details: statusDetails
            };
          } else {
            // Legacy response format fallback
            const providerCount = responseData?.providers?.length || 0;
            const availableProviders = responseData?.providers?.filter(p => p.available).length || 0;
            
            let providerStatus: StatusType = 'operational';
            if (availableProviders === 0 && providerCount > 0) {
              providerStatus = 'degraded';
            } else if (availableProviders < providerCount) {
              providerStatus = 'degraded';
            }

            updatedSystems[2] = {
              ...updatedSystems[2],
              status: providerStatus,
              lastCheck: new Date(),
              details: providerCount === 0 
                ? 'No providers configured' 
                : `${availableProviders}/${providerCount} providers available (check configuration)`
            };
          }
        } catch (error) {
          updatedSystems[2] = {
            ...updatedSystems[2],
            status: 'down',
            lastCheck: new Date(),
            details: 'Unable to check provider status - API connection failed'
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
      healthCheckError = error instanceof Error ? error.message : 'Unknown error occurred';
      updatedSystems.forEach((system, index) => {
        updatedSystems[index] = {
          ...system,
          status: 'down',
          lastCheck: new Date(),
          details: `System check failed: ${healthCheckError}`
        };
      });
    }

    setSystems(updatedSystems);
    
    // Calculate overall status with more nuanced logic
    const statuses = updatedSystems.map(s => s.status);
    const apiStatus = updatedSystems[0].status;
    const engineStatus = updatedSystems[1].status;
    const providersStatus = updatedSystems[2].status;
    const databaseStatus = updatedSystems[3].status;
    
    // If core services (API, Engine, Database) are operational, overall status is at least degraded
    if (apiStatus === 'operational' && engineStatus === 'operational' && databaseStatus === 'operational') {
      if (providersStatus === 'operational') {
        setOverallStatus('operational');
      } else {
        // Core system works, but providers need configuration
        setOverallStatus('degraded');
      }
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
      case 'operational': return '#10b981'; // Enhanced green for better visibility
      case 'degraded': return '#f59e0b';    // Amber yellow  
      case 'down': return '#ef4444';        // Clear red
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

  const calculateTooltipPosition = (element: HTMLElement, tooltipEl?: HTMLElement | null): { x: number; y: number } => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = tooltipEl?.offsetWidth || 250; // Use actual width if available
    const tooltipHeight = tooltipEl?.offsetHeight || 150; // Use actual height if available
    const margin = 10;
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate center of the element
    const elementCenterX = rect.left + rect.width / 2;
    const elementCenterY = rect.top + rect.height / 2;

    // Default position: to the right of the element
    let x = rect.right + margin;
    let y = rect.top;

    // Try right side first
    if (x + tooltipWidth + margin > viewportWidth) {
      // Try left side
      x = rect.left - tooltipWidth - margin;
      
      if (x < margin) {
        // If both sides don't fit, position based on available space
        const spaceRight = viewportWidth - rect.right - margin;
        const spaceLeft = rect.left - margin;
        
        if (spaceRight > spaceLeft) {
          // More space on the right
          x = rect.right + margin;
          // But constrain to viewport
          x = Math.min(x, viewportWidth - tooltipWidth - margin);
        } else {
          // More space on the left
          x = Math.max(margin, rect.left - tooltipWidth - margin);
        }
      }
    }

    // Vertical positioning
    if (y + tooltipHeight > viewportHeight - margin) {
      // Try to position above the element center
      y = rect.bottom - tooltipHeight;
      
      if (y < margin) {
        // Center vertically in viewport if it doesn't fit
        y = Math.max(margin, Math.min(elementCenterY - tooltipHeight / 2, viewportHeight - tooltipHeight - margin));
      }
    }

    // Final boundary checks
    x = Math.max(margin, Math.min(x, viewportWidth - tooltipWidth - margin));
    y = Math.max(margin, Math.min(y, viewportHeight - tooltipHeight - margin));

    return { x, y };
  };

  const handleDotMouseEnter = (systemId: string, event: React.MouseEvent) => {
    if (showTooltips) {
      // Clear any existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      // Show tooltip after a short delay
      hoverTimeoutRef.current = setTimeout(() => {
        setActiveTooltip(systemId);
        setHoveredSystem(systemId);
        if (event.currentTarget) {
          const position = calculateTooltipPosition(event.currentTarget as HTMLElement);
          setTooltipPosition(position);
          
          // Recalculate position after DOM update
          setTimeout(() => {
            if (tooltipRef.current && event.currentTarget) {
              const newPosition = calculateTooltipPosition(event.currentTarget as HTMLElement, tooltipRef.current);
              setTooltipPosition(newPosition);
            }
          }, 10);
        }
      }, 200); // 200ms delay to prevent accidental hovers
    }
  };

  const handleDotMouseLeave = (systemId: string) => {
    // Clear hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Only hide tooltip if it's from hover (not click)
    if (hoveredSystem === systemId && activeTooltip === systemId) {
      setActiveTooltip(null);
      setTooltipPosition(null);
      setHoveredSystem(null);
    }
  };

  const handleDotClick = (systemId: string, event?: React.MouseEvent) => {
    if (showTooltips) {
      // Clear hover state
      setHoveredSystem(null);
      
      if (activeTooltip === systemId) {
        setActiveTooltip(null);
        setTooltipPosition(null);
      } else {
        setActiveTooltip(systemId);
        if (event?.currentTarget) {
          const position = calculateTooltipPosition(event.currentTarget as HTMLElement);
          setTooltipPosition(position);
          
          // Recalculate position after DOM update
          setTimeout(() => {
            if (tooltipRef.current && event.currentTarget) {
              const newPosition = calculateTooltipPosition(event.currentTarget as HTMLElement, tooltipRef.current);
              setTooltipPosition(newPosition);
            }
          }, 10);
        }
      }
    }
  };

  const handleOverallClick = () => {
    setIsExpanded(!isExpanded);
    setActiveTooltip(null);
    setTooltipPosition(null);
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
                onClick={(e) => handleDotClick(system.id, e)}
                onMouseEnter={(e) => handleDotMouseEnter(system.id, e)}
                onMouseLeave={() => handleDotMouseLeave(system.id)}
                style={{ backgroundColor: getStatusColor(system.status) }}
                role="button"
                tabIndex={0}
                aria-label={`${system.name}: ${getStatusText(system.status)}`}
                aria-describedby={activeTooltip === system.id ? `tooltip-${system.id}` : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleDotClick(system.id, e as any);
                  }
                }}
              >
                <div className="status-pulse" style={{ backgroundColor: getStatusColor(system.status) }} />
              </div>
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

      {/* Portal-based tooltip for better positioning */}
      {activeTooltip && showTooltips && tooltipPosition && (
        <div 
          className="status-tooltip-portal"
          ref={tooltipRef}
          style={{
            position: 'fixed',
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
          role="tooltip"
          id={`tooltip-${activeTooltip}`}
        >
          {(() => {
            const system = systems.find(s => s.id === activeTooltip);
            if (!system) return null;
            
            return (
              <div className="status-tooltip enhanced">
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
                  {system.details && <p className="tooltip-primary">{system.details}</p>}
                  {system.responseTime && (
                    <p className="tooltip-performance">
                      Response time: <span className={system.responseTime > 1000 ? 'slow' : system.responseTime > 500 ? 'medium' : 'fast'}>
                        {system.responseTime}ms
                      </span>
                    </p>
                  )}
                  {system.status === 'degraded' && system.id === 'providers' && (
                    <p className="tooltip-help">
                      💡 Configure API keys in settings to enable providers
                    </p>
                  )}
                  {system.status === 'down' && system.id === 'api' && (
                    <p className="tooltip-help">
                      ⚠️ Check if the backend server is running on port 8080
                    </p>
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
                    setTooltipPosition(null);
                  }}
                >
                  Refresh Status
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default StatusIndicator;