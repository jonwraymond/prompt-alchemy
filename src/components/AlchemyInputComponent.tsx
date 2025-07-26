import React, { useState, useRef, useEffect, useCallback } from 'react';
import './AlchemyInputComponent.css';

interface AlchemyInputProps {
  onSubmit?: (value: string, options?: any) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const AlchemyInputComponent: React.FC<AlchemyInputProps> = ({
  onSubmit,
  placeholder = "Transmute your ideas into powerful prompts...",
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
        attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined
      });
    }
  }, [value, disabled, onSubmit, persona, temperature, attachedFiles]);

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
        
        {/* Alchemy Icons */}
        <div className="alchemy-icons">
          <div className="alchemy-icon science-icon" title="Science">🧪</div>
          <div className="alchemy-icon crystal-icon" title="Crystal">💎</div>
          <div className="alchemy-icon sparkle-icon" title="Magic">✨</div>
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

          {/* Advanced Options */}
          <button
            type="button"
            className="alchemy-btn settings-btn"
            onClick={() => setShowAdvanced(!showAdvanced)}
            title="Advanced Options"
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
            <span className="btn-icon">⚗️</span>
            <span className="btn-text">
              {isLoading ? 'Transmuting...' : 'Transmute'}
            </span>
            <span className="btn-icon">🪄</span>
          </button>
        </div>

        {/* Advanced Options Panel */}
        {showAdvanced && (
          <div className="advanced-options">
            <div className="option-group">
              <label>Persona:</label>
              <select 
                value={persona} 
                onChange={(e) => setPersona(e.target.value)}
                disabled={disabled}
              >
                <option value="creative">Creative</option>
                <option value="technical">Technical</option>
                <option value="analytical">Analytical</option>
                <option value="conversational">Conversational</option>
              </select>
            </div>
            
            <div className="option-group">
              <label>Temperature: {temperature}</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                disabled={disabled}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlchemyInputComponent;