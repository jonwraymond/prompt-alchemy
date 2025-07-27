import React, { useState, useRef, useEffect, useCallback } from 'react';
import './AlchemyInputComponent.css';

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
    </div>
  );
};

export default AlchemyInputComponent;