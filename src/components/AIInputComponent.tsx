import React, { useState, useRef, useEffect, useCallback } from 'react';
import './AIInputComponent.css';

// Types
export interface Suggestion {
  id: string;
  text: string;
  description: string;
  action: string;
}

export interface AIInputComponentProps {
  initialValue?: string;
  placeholder?: string;
  maxLength?: number;
  enableSuggestions?: boolean;
  enableThinking?: boolean;
  onSubmit?: (value: string, options?: any) => void;
  onValueChange?: (value: string) => void;
  className?: string;
}

// Suggestion actions
const suggestions: Suggestion[] = [
  {
    id: 'enhance-detail',
    text: '✨ Enhance this prompt with more detail',
    description: 'Add depth and specificity to your prompt',
    action: 'enhance-detail'
  },
  {
    id: 'add-technical',
    text: '🔧 Add technical specifications',
    description: 'Include technical details and requirements',
    action: 'add-technical'
  },
  {
    id: 'make-creative',
    text: '🎨 Make it more creative',
    description: 'Boost creativity and imaginative elements',
    action: 'make-creative'
  },
  {
    id: 'optimize-clarity',
    text: '💡 Optimize for clarity',
    description: 'Improve readability and understanding',
    action: 'optimize-clarity'
  }
];

const AIInputComponent: React.FC<AIInputComponentProps> = ({
  initialValue = '',
  placeholder = 'Describe your prompt...',
  maxLength = 5000,
  enableSuggestions = true,
  enableThinking = true,
  onSubmit,
  onValueChange,
  className = ''
}) => {
  // State
  const [value, setValue] = useState(initialValue);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [showProfilesMenu, setShowProfilesMenu] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setValue(newValue);
      onValueChange?.(newValue);
      updateTextareaHeight();
    }
  }, [maxLength, onValueChange, updateTextareaHeight]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsExpanded(true);
  }, []);

  // Handle blur
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsExpanded(false);
        setShowProfilesMenu(false);
        setShowPresetMenu(false);
      }
    }, 100);
  }, []);

  // Handle key down
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (showProfilesMenu) {
        e.preventDefault();
        const direction = e.key === 'ArrowDown' ? 1 : -1;
        const newIndex = Math.max(-1, Math.min(suggestions.length - 1, selectedSuggestionIndex + direction));
        setSelectedSuggestionIndex(newIndex);
      }
    } else if (e.key === 'Enter' && showProfilesMenu && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionAction(suggestions[selectedSuggestionIndex].action);
    } else if (e.key === 'Escape') {
      setShowProfilesMenu(false);
      setShowPresetMenu(false);
      setShowConfigPanel(false);
    }
  }, [showProfilesMenu, selectedSuggestionIndex]);

  // Handle submit
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim()) {
      setIsLoading(true);
      onSubmit?.(value);
      
      // Simulate loading
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
  }, [value, onSubmit]);

  // Handle suggestion actions
  const handleSuggestionAction = useCallback((action: string) => {
    let enhancement = '';
    
    switch (action) {
      case 'enhance-detail':
        enhancement = '\n\nPlease provide more specific details and context for this request.';
        break;
      case 'add-technical':
        enhancement = '\n\nInclude technical specifications, requirements, and implementation details.';
        break;
      case 'make-creative':
        enhancement = '\n\nMake this more creative and imaginative, thinking outside the box.';
        break;
      case 'optimize-clarity':
        enhancement = '\n\nOptimize for clarity and readability, making the instructions crystal clear.';
        break;
    }
    
    setValue(prev => prev + enhancement);
    setShowProfilesMenu(false);
    
    // Show feedback
    setShowThinking(true);
    setTimeout(() => setShowThinking(false), 1500);
  }, []);

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

  // Right-click preset menu
  const handleGenerateRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowPresetMenu(true);
    setShowProfilesMenu(false);
  }, []);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowProfilesMenu(false);
        setShowPresetMenu(false);
        setShowConfigPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize on value change
  useEffect(() => {
    updateTextareaHeight();
  }, [value, updateTextareaHeight]);

  return (
    <div className={`ai-input-container ${className}`} ref={containerRef}>
      <div className={`ai-input-wrapper ${isExpanded ? 'expanded' : ''} ${isLoading ? 'loading' : ''}`}>
        {/* Main Input Area */}
        <div className="ai-input-main">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`ai-input ${isExpanded ? 'expanded' : ''}`}
            maxLength={maxLength}
            rows={1}
          />
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="ai-input-loading">
              <div className="ai-thinking-dots">
                <div className="ai-dot"></div>
                <div className="ai-dot"></div>
                <div className="ai-dot"></div>
              </div>
            </div>
          )}
          
          {/* Thinking Overlay */}
          {showThinking && (
            <div className="ai-thinking-overlay">
              <span>✨ Enhancing...</span>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="ai-input-controls">
          {/* Attachment Area */}
          <div className="ai-attachment-area">
            <button
              type="button"
              className="ai-attachment-btn"
              onClick={handleAttachmentClick}
              title="Add files & attachments"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v10m-5-5h10"/>
              </svg>
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
              <div className="ai-attachment-list">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="ai-attachment-item">
                    <span>{file.name}</span>
                    <button onClick={() => removeAttachment(index)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Character Counter */}
          <div className="ai-input-counter">
            {value.length}/{maxLength}
          </div>

          {/* Right Controls */}
          <div className="ai-input-controls-right">
            {/* Config Button */}
            <button
              type="button"
              className="ai-config-btn"
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              title="Advanced Options"
            >
              <svg className="gear-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>

            {/* Generate Button Group */}
            <div className="ai-generate-btn-container">
              <button
                type="submit"
                className="ai-generate-btn"
                onClick={handleSubmit}
                onContextMenu={handleGenerateRightClick}
                title="Generate (Enter) | Right-click for presets"
                disabled={isLoading || !value.trim()}
              >
                <svg className="btn-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.5 8.5L22 12L15.5 15.5L12 22L8.5 15.5L2 12L8.5 8.5L12 2Z"/>
                  <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1"/>
                </svg>
                {isLoading ? 'Generating...' : 'Generate'}
              </button>
              
              <div
                className="ai-generate-dropdown"
                onClick={() => setShowProfilesMenu(!showProfilesMenu)}
                title="Generation Profiles"
              >
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 6L8 12L12 18L16 12L12 6Z"/>
                  <circle cx="12" cy="12" r="1.5"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profiles Dropdown */}
      {showProfilesMenu && (
        <div className="ai-dropdown-menu ai-profiles-menu visible">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`ai-profile-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
              onClick={() => handleSuggestionAction(suggestion.action)}
            >
              <div className="profile-name">{suggestion.text}</div>
              <div className="profile-desc">{suggestion.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Preset Menu */}
      {showPresetMenu && (
        <div className="ai-dropdown-menu ai-preset-menu visible">
          <div className="ai-dropdown-item" onClick={() => setValue('Write a detailed analysis of...')}>
            📊 Analysis Template
          </div>
          <div className="ai-dropdown-item" onClick={() => setValue('Create a step-by-step guide for...')}>
            📋 Tutorial Template
          </div>
          <div className="ai-dropdown-item" onClick={() => setValue('Generate creative ideas for...')}>
            💡 Brainstorm Template
          </div>
        </div>
      )}

      {/* Config Panel */}
      {showConfigPanel && (
        <div className="ai-config-panel">
          <h3>Advanced Options</h3>
          <div className="config-option">
            <label>
              <input type="checkbox" defaultChecked={enableSuggestions} />
              Enable Smart Suggestions
            </label>
          </div>
          <div className="config-option">
            <label>
              <input type="checkbox" defaultChecked={enableThinking} />
              Show Thinking Process
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInputComponent; 