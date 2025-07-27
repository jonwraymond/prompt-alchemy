import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import './AlchemyInputComponent.css';
import { api } from '../utils/api';

interface GenerateOptions {
  persona: string;
  temperature: number;
  maxTokens: number;
  count: number;
  phases: string[];
  attachedFiles?: File[];
}

interface AlchemyInputProps {
  onSubmit?: (value: string, options?: GenerateOptions) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const AlchemyInputComponent: React.FC<AlchemyInputProps> = ({
  onSubmit,
  placeholder = "Generate your ideas into powerful prompts...",
  isLoading = false,
  disabled = false,
  className = ''
}) => {
  const [value, setValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [persona, setPersona] = useState('creative');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [count, setCount] = useState(1);
  const [phases, setPhases] = useState<string[]>(['prima-materia']);
  
  // Status indicator state
  const [systemStatus, setSystemStatus] = useState({
    api: 'down',
    engine: 'down',
    providers: 'down',
    database: 'down'
  });

  // Additional system details for rich tooltips
  const [systemDetails, setSystemDetails] = useState<{
    api: { details: string; responseTime: number };
    engine: { details: string; responseTime?: number };
    providers: { details: string; responseTime?: number };
    database: { details: string; responseTime?: number };
  }>({
    api: { details: '', responseTime: 0 },
    engine: { details: '', responseTime: undefined },
    providers: { details: '', responseTime: undefined },
    database: { details: '', responseTime: undefined }
  });

  // Tooltip state
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if device is touch-based
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Check system status
  const checkSystemStatus = useCallback(async () => {
    try {
      // Check API Health
      const startTime = Date.now();
      const healthResponse = await api.health();
      const apiResponseTime = Date.now() - startTime;
      
      const apiStatus = healthResponse.success ? 'operational' : 'down';
      
      let engineStatus = 'down';
      let providersStatus = 'down';
      let databaseStatus = 'down';
      let engineDetails = '';
      let providersDetails = '';
      let databaseDetails = '';

      if (healthResponse.success) {
        // Check Engine Status
        try {
          const statusResponse = await api.status();
          engineStatus = statusResponse.success ? 'operational' : 'degraded';
          engineDetails = statusResponse.success 
            ? `Engine operational - Learning mode: ${statusResponse.data?.learning_mode ? 'enabled' : 'disabled'}`
            : 'Engine status unknown';
        } catch {
          engineStatus = 'degraded';
          engineDetails = 'Engine status check failed';
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
            
            if (totalProviders === 0) {
              providersStatus = 'down';
              providersDetails = 'No providers configured';
            } else if (availableProviders === 0) {
              providersStatus = 'degraded';
              providersDetails = `${totalProviders} providers configured, but none available (check API keys)`;
            } else if (availableProviders < totalProviders) {
              providersStatus = 'degraded';
              providersDetails = `${availableProviders}/${totalProviders} providers available`;
              if (embeddingProviders > 0) {
                providersDetails += `, ${embeddingProviders} support embeddings`;
              }
            } else {
              providersStatus = 'operational';
              providersDetails = `All ${totalProviders} providers available`;
              if (embeddingProviders > 0) {
                providersDetails += `, ${embeddingProviders} support embeddings`;
              }
            }
          } else {
            // Legacy response format fallback
            const providerCount = responseData?.providers?.length || 0;
            const availableProviders = responseData?.providers?.filter(p => p.available).length || 0;
            
            if (availableProviders === 0 && providerCount > 0) {
              providersStatus = 'degraded';
            } else if (availableProviders < providerCount) {
              providersStatus = 'degraded';
            }

            providersDetails = providerCount === 0 
              ? 'No providers configured' 
              : `${availableProviders}/${providerCount} providers available (check configuration)`;
          }
        } catch {
          providersStatus = 'degraded';
          providersDetails = 'Unable to check provider status - API connection failed';
        }

        // Check Database (assume operational if API is working)
        databaseStatus = 'operational';
        databaseDetails = 'Database accessible via API';
      } else {
        // If API is down, mark dependent systems as down
        engineStatus = 'down';
        providersStatus = 'down';
        databaseStatus = 'down';
        engineDetails = 'Cannot check - API down';
        providersDetails = 'Cannot check - API down';
        databaseDetails = 'Cannot check - API down';
      }

      setSystemStatus({
        api: apiStatus,
        engine: engineStatus,
        providers: providersStatus,
        database: databaseStatus
      });

      // Store additional details for tooltips
      setSystemDetails({
        api: {
          details: healthResponse.success 
            ? `API responding in ${apiResponseTime}ms` 
            : healthResponse.error || 'API not responding',
          responseTime: apiResponseTime
        },
        engine: {
          details: engineDetails
        },
        providers: {
          details: providersDetails
        },
        database: {
          details: databaseDetails
        }
      });
    } catch {
      setSystemStatus({
        api: 'down',
        engine: 'down',
        providers: 'down',
        database: 'down'
      });
      setSystemDetails({
        api: { details: 'System check failed' },
        engine: { details: 'System check failed' },
        providers: { details: 'System check failed' },
        database: { details: 'System check failed' }
      });
    }
  }, []);

  // Check status on mount
  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, [checkSystemStatus]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'operational': return 'rgba(16, 185, 129, 1.0)'; // Green with 100% opacity
      case 'degraded': return 'rgba(245, 158, 11, 1.0)';    // Amber with 100% opacity  
      case 'down': return 'rgba(239, 68, 68, 1.0)';         // Red with 100% opacity
      default: return 'rgba(107, 114, 128, 1.0)';           // Gray with 100% opacity
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'operational': return 'Operational';
      case 'degraded': return 'Degraded';
      case 'down': return 'Down';
      default: return 'Unknown';
    }
  };

  const formatLastCheck = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const calculateTooltipPosition = (element: HTMLElement, tooltipEl?: HTMLElement | null): { x: number; y: number } => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = tooltipEl?.offsetWidth || 250;
    const tooltipHeight = tooltipEl?.offsetHeight || 150;
    const margin = 10;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const elementCenterY = rect.top + rect.height / 2;

    let x = rect.right + margin;
    let y = rect.top;

    if (x + tooltipWidth + margin > viewportWidth) {
      x = rect.left - tooltipWidth - margin;
      
      if (x < margin) {
        const spaceRight = viewportWidth - rect.right - margin;
        const spaceLeft = rect.left - margin;
        
        if (spaceRight > spaceLeft) {
          x = rect.right + margin;
          x = Math.min(x, viewportWidth - tooltipWidth - margin);
        } else {
          x = Math.max(margin, rect.left - tooltipWidth - margin);
        }
      }
    }

    if (y + tooltipHeight > viewportHeight - margin) {
      y = rect.bottom - tooltipHeight;
      
      if (y < margin) {
        y = Math.max(margin, Math.min(elementCenterY - tooltipHeight / 2, viewportHeight - tooltipHeight - margin));
      }
    }

    x = Math.max(margin, Math.min(x, viewportWidth - tooltipWidth - margin));
    y = Math.max(margin, Math.min(y, viewportHeight - tooltipHeight - margin));

    return { x, y };
  };

  const handleDotMouseEnter = (systemId: string, event: React.MouseEvent) => {
    if (!isTouchDevice) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      const targetElement = event.currentTarget as HTMLElement;
      
      hoverTimeoutRef.current = setTimeout(() => {
        setActiveTooltip(systemId);
        setHoveredSystem(systemId);
        if (targetElement) {
          const position = calculateTooltipPosition(targetElement);
          setTooltipPosition(position);
          
          setTimeout(() => {
            if (tooltipRef.current && targetElement) {
              const newPosition = calculateTooltipPosition(targetElement, tooltipRef.current);
              setTooltipPosition(newPosition);
            }
          }, 10);
        }
      }, 200);
    }
  };

  const handleDotMouseLeave = (systemId: string) => {
    if (!isTouchDevice) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      if (hoveredSystem === systemId && activeTooltip === systemId) {
        setActiveTooltip(null);
        setTooltipPosition(null);
        setHoveredSystem(null);
      }
    }
  };

  const handleDotFocus = (systemId: string, event: React.FocusEvent) => {
    if (!isTouchDevice) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      const targetElement = event.currentTarget as HTMLElement;
      
      setActiveTooltip(systemId);
      setHoveredSystem(systemId);
      if (targetElement) {
        const position = calculateTooltipPosition(targetElement);
        setTooltipPosition(position);
        
        setTimeout(() => {
          if (tooltipRef.current && targetElement) {
            const newPosition = calculateTooltipPosition(targetElement, tooltipRef.current);
            setTooltipPosition(newPosition);
          }
        }, 10);
      }
    }
  };

  const handleDotBlur = (systemId: string) => {
    if (!isTouchDevice) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      if (activeTooltip === systemId) {
        setActiveTooltip(null);
        setTooltipPosition(null);
        setHoveredSystem(null);
      }
    }
  };

  const handleDotClick = (systemId: string, event: React.MouseEvent) => {
    if (isTouchDevice) {
      if (activeTooltip === systemId) {
        setActiveTooltip(null);
        setTooltipPosition(null);
        setHoveredSystem(null);
      } else {
        const targetElement = event.currentTarget as HTMLElement;
        setActiveTooltip(systemId);
        setHoveredSystem(systemId);
        if (targetElement) {
          const position = calculateTooltipPosition(targetElement);
          setTooltipPosition(position);
          
          setTimeout(() => {
            if (tooltipRef.current && targetElement) {
              const newPosition = calculateTooltipPosition(targetElement, tooltipRef.current);
              setTooltipPosition(newPosition);
            }
          }, 10);
        }
      }
    }
  };

  // Auto-resize textarea
  const updateTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    updateTextareaHeight();
  }, [updateTextareaHeight]);

  // Handle submit
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit?.(value, {
        persona,
        temperature,
        maxTokens,
        count,
        phases,
        attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined
      });
    }
  }, [value, disabled, onSubmit, persona, temperature, maxTokens, count, phases, attachedFiles]);

  // Handle key down
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Handle file attachment
  const handleAttachmentClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Auto-resize on value change
  useEffect(() => {
    updateTextareaHeight();
  }, [value, updateTextareaHeight]);

  return (
    <div className={`alchemy-input-container ${className}`} ref={containerRef}>
      <div className={`alchemy-input-wrapper ${isExpanded ? 'expanded' : ''} ${isLoading ? 'loading' : ''}`}>
        
        {/* Status Indicators */}
        <div className="alchemy-icons">
          <div 
            className="status-dot" 
            title="API Server"
            style={{ backgroundColor: getStatusColor(systemStatus.api) }}
            onMouseEnter={(e) => handleDotMouseEnter('api', e)}
            onMouseLeave={() => handleDotMouseLeave('api')}
            onFocus={(e) => handleDotFocus('api', e)}
            onBlur={() => handleDotBlur('api')}
            onClick={(e) => handleDotClick('api', e)}
            tabIndex={0}
          />
          <div 
            className="status-dot" 
            title="Alchemy Engine"
            style={{ backgroundColor: getStatusColor(systemStatus.engine) }}
            onMouseEnter={(e) => handleDotMouseEnter('engine', e)}
            onMouseLeave={() => handleDotMouseLeave('engine')}
            onFocus={(e) => handleDotFocus('engine', e)}
            onBlur={() => handleDotBlur('engine')}
            onClick={(e) => handleDotClick('engine', e)}
            tabIndex={0}
          />
          <div 
            className="status-dot" 
            title="LLM Providers"
            style={{ backgroundColor: getStatusColor(systemStatus.providers) }}
            onMouseEnter={(e) => handleDotMouseEnter('providers', e)}
            onMouseLeave={() => handleDotMouseLeave('providers')}
            onFocus={(e) => handleDotFocus('providers', e)}
            onBlur={() => handleDotBlur('providers')}
            onClick={(e) => handleDotClick('providers', e)}
            tabIndex={0}
          />
          <div 
            className="status-dot" 
            title="Database"
            style={{ backgroundColor: getStatusColor(systemStatus.database) }}
            onMouseEnter={(e) => handleDotMouseEnter('database', e)}
            onMouseLeave={() => handleDotMouseLeave('database')}
            onFocus={(e) => handleDotFocus('database', e)}
            onBlur={() => handleDotBlur('database')}
            onClick={(e) => handleDotClick('database', e)}
            tabIndex={0}
          />
        </div>

        {/* Main Input Area */}
        <div className="alchemy-input-main">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsExpanded(true)}
            onBlur={() => setTimeout(() => setIsExpanded(false), 100)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`alchemy-input ${isExpanded ? 'expanded' : ''}`}
            disabled={disabled}
            rows={1}
          />
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="alchemy-loading">
              <div className="liquid-drops">
                <div className="drop gold"></div>
                <div className="drop emerald"></div>
                <div className="drop purple"></div>
              </div>
              <span className="loading-text">Transmuting...</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="alchemy-controls">
          
          {/* File Attachments */}
          <div className="attachment-area">
            <button
              type="button"
              className="alchemy-btn attachment-btn"
              onClick={handleAttachmentClick}
              title="Add Attachment"
              disabled={disabled}
            >
              📎
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              multiple
              accept="image/*,.pdf,.txt,.doc,.docx"
              style={{ display: 'none' }}
            />
            
            {attachedFiles.length > 0 && (
              <div className="attachment-list">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="attachment-item">
                    <span>{file.name}</span>
                    <button onClick={() => removeAttachment(index)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Character Counter */}
          <div className="character-counter">
            {value.length}/5000
          </div>

          {/* Generate Configuration */}
          <button
            type="button"
            className="alchemy-btn settings-btn"
            onClick={() => setShowAdvanced(!showAdvanced)}
            title="Generate Command Configuration"
            disabled={disabled}
          >
            ⚙️
          </button>

          {/* Generate Button */}
          <button
            type="submit"
            className="alchemy-btn generate-btn"
            onClick={handleSubmit}
            disabled={disabled || !value.trim() || isLoading}
            title="Transmute (Cmd+Enter)"
          >
            <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" opacity="0.3"/>
              <path d="M12 12L2 17L12 22L22 17L12 12Z" opacity="0.6"/>
              <path d="M12 7L2 12L12 17L22 12L12 7Z"/>
              <path d="M8 10L12 12L16 10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
            <span className="btn-text">
              {isLoading ? 'Transmuting' : 'Generate'}
            </span>
          </button>
        </div>

        {/* Generate Command Configuration Panel */}
        {showAdvanced && (
          <div className="advanced-options">
            <div className="option-group">
              <label>Persona:</label>
              <select 
                value={persona} 
                onChange={(e) => setPersona(e.target.value)}
                disabled={disabled}
              >
                <option value="code">Code</option>
                <option value="writing">Writing</option>
                <option value="analysis">Analysis</option>
                <option value="generic">Generic</option>
              </select>
            </div>
            
            <div className="option-group">
              <label>Temperature: {temperature}</label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                disabled={disabled}
              />
              <div className="option-description">Controls randomness: 0 = focused, 2 = creative</div>
            </div>

            <div className="option-group">
              <label>Max Tokens: {maxTokens}</label>
              <input
                type="range"
                min="500"
                max="4000"
                step="100"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                disabled={disabled}
              />
              <div className="option-description">Maximum length of generated output</div>
            </div>

            <div className="option-group">
              <label>Count: {count}</label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                disabled={disabled}
              />
              <div className="option-description">Number of prompt variants to generate</div>
            </div>

            <div className="option-group">
              <label>Alchemical Phases</label>
              <div className="phase-select">
                {['prima-materia', 'solutio', 'coagulatio'].map(phase => (
                  <button
                    key={phase}
                    type="button"
                    className={`phase-option ${phases.includes(phase) ? 'selected' : ''}`}
                    onClick={() => {
                      setPhases(prev => 
                        prev.includes(phase)
                          ? prev.filter(p => p !== phase)
                          : [...prev, phase]
                      );
                    }}
                    disabled={disabled}
                  >
                    {phase}
                  </button>
                ))}
              </div>
              <div className="option-description">Select which transformation phases to apply</div>
            </div>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {activeTooltip && tooltipPosition && ReactDOM.createPortal(
        <div
          ref={tooltipRef}
          className="status-tooltip-portal"
          style={{
            position: 'fixed',
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            zIndex: 99999,
            pointerEvents: 'auto',
            opacity: 1,
            visibility: 'visible',
            display: 'block'
          }}
          role="tooltip"
          id={`tooltip-${activeTooltip}`}
        >
          <div className="status-tooltip enhanced">
            <div className="tooltip-header">
              <span className="tooltip-title">
                {activeTooltip === 'api' && 'API Server'}
                {activeTooltip === 'engine' && 'Alchemy Engine'}
                {activeTooltip === 'providers' && 'LLM Providers'}
                {activeTooltip === 'database' && 'Database'}
              </span>
              <span 
                className="tooltip-status"
                style={{ color: getStatusColor(systemStatus[activeTooltip as keyof typeof systemStatus] || 'unknown') }}
              >
                {getStatusText(systemStatus[activeTooltip as keyof typeof systemStatus] || 'unknown')}
              </span>
            </div>
            <div className="tooltip-details">
              <p className="tooltip-primary">
                {activeTooltip === 'api' && 'Backend API server status'}
                {activeTooltip === 'engine' && 'Core alchemy processing engine'}
                {activeTooltip === 'providers' && 'Language model providers'}
                {activeTooltip === 'database' && 'Data storage system'}
              </p>
              {systemStatus[activeTooltip as keyof typeof systemStatus] === 'down' && activeTooltip === 'api' && (
                <p className="tooltip-help">
                  ⚠️ Check if the backend server is running on port 8080
                </p>
              )}
              <p className="tooltip-timestamp">
                Last checked: {formatLastCheck(new Date())}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AlchemyInputComponent;