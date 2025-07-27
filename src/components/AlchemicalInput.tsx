import React, { useState, useRef, useEffect, useCallback } from 'react';
import './AlchemicalInput.css';

// Types
/* interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
  persona?: string;
  temperature?: number;
  maxTokens?: number;
}

interface Provider {
  name: string;
  available: boolean;
  supports_embeddings: boolean;
  models: string[];
  capabilities: string[];
} */

interface AdvancedOptions {
  persona: string;
  temperature: number;
  maxTokens: number;
  phases: string[];
  providers: Record<string, string>;
  useParallel: boolean;
  enableJudging: boolean;
  useOptimization: boolean;
}

interface AlchemicalInputProps {
  onSubmit: (input: string, options: AdvancedOptions, attachments?: File[]) => Promise<void>;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

// Available personas
const PERSONAS = [
  { id: 'code', name: 'Code Generation', icon: '💻', description: 'Optimized for programming tasks' },
  { id: 'writing', name: 'Creative Writing', icon: '✍️', description: 'For creative content and storytelling' },
  { id: 'analysis', name: 'Analysis', icon: '📊', description: 'Data analysis and insights' },
  { id: 'creative', name: 'Creative', icon: '🎨', description: 'Creative ideation and brainstorming' },
  { id: 'technical', name: 'Technical', icon: '🔧', description: 'Technical documentation' },
  { id: 'business', name: 'Business', icon: '💼', description: 'Business communication' },
  { id: 'research', name: 'Research', icon: '🔬', description: 'Academic and research content' },
  { id: 'generic', name: 'General', icon: '🌐', description: 'General purpose prompts' }
];

// Preset definitions
/* const PRESETS: Preset[] = [
  {
    id: 'code-generation',
    name: 'Code Generation',
    description: 'Generate clean, efficient code',
    icon: '⚡',
    prompt: 'Create a {language} function that {task}',
    persona: 'code',
    temperature: 0.3,
    maxTokens: 2000
  },
  {
    id: 'creative-writing',
    name: 'Creative Writing',
    description: 'Craft engaging creative content',
    icon: '✨',
    prompt: 'Write a {style} piece about {topic}',
    persona: 'creative',
    temperature: 0.8,
    maxTokens: 1500
  },
  {
    id: 'technical-docs',
    name: 'Technical Documentation',
    description: 'Create clear technical documentation',
    icon: '📚',
    prompt: 'Document the {system} with {requirements}',
    persona: 'technical',
    temperature: 0.4,
    maxTokens: 2500
  },
  {
    id: 'business-analysis',
    name: 'Business Analysis',
    description: 'Analyze business scenarios and data',
    icon: '📊',
    prompt: 'Analyze {business_scenario} and provide {insights}',
    persona: 'analysis',
    temperature: 0.6,
    maxTokens: 2000
  },
  {
    id: 'problem-solving',
    name: 'Problem Solving',
    description: 'Break down complex problems',
    icon: '🧩',
    prompt: 'Solve {problem} by {approach}',
    persona: 'analysis',
    temperature: 0.5,
    maxTokens: 2000
  }
]; */

const AlchemicalInput: React.FC<AlchemicalInputProps> = ({
  onSubmit,
  onValueChange,
  placeholder = "Describe what you want to create...",
  maxLength = 5000,
  className = ""
}) => {
  // State
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // const [showPresets, setShowPresets] = useState(false);
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  // const [providers, setProviders] = useState<Provider[]>([]);
  // const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [selectedPersona, setSelectedPersona] = useState('code');

  // Advanced options state
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptions>({
    persona: 'code',
    temperature: 0.7,
    maxTokens: 2000,
    phases: ['prima-materia', 'solutio', 'coagulatio'],
    providers: {},
    useParallel: true,
    enableJudging: false,
    useOptimization: false
  });

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load providers on mount
  useEffect(() => {
    // loadProviders();
  }, []);

  // Auto-resize textarea
  const updateTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, []);

  // Load available providers
  /* const loadProviders = async () => {
    try {
      const response = await fetch('/api/v1/providers');
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.warn('Failed to load providers:', error);
    }
  }; */

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setInput(newValue);
      onValueChange?.(newValue);
      updateTextareaHeight();
    }
  }, [maxLength, onValueChange, updateTextareaHeight]);

  // Handle preset selection
  /* const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset);
    setInput(preset.prompt);
    if (preset.persona) {
      setAdvancedOptions(prev => ({
        ...prev,
        persona: preset.persona!,
        temperature: preset.temperature ?? prev.temperature,
        maxTokens: preset.maxTokens ?? prev.maxTokens
      }));
    }
    setShowPresets(false);
    textareaRef.current?.focus();
  }; */

  // Handle persona selection
  const handlePersonaSelect = (personaId: string) => {
    setSelectedPersona(personaId);
    setAdvancedOptions(prev => ({ ...prev, persona: personaId }));
    setShowPersonaDropdown(false);
  };

  // Handle file attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (attachments.length + files.length > 5) {
      alert('Maximum 5 attachments allowed');
      return;
    }
    setAttachments(prev => [...prev, ...files.slice(0, 5 - prev.length)]);
  };

  // Handle file removal
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // Call the API endpoint
      const response = await fetch('/api/v1/prompts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input.trim(),
          persona: advancedOptions.persona,
          temperature: advancedOptions.temperature,
          max_tokens: advancedOptions.maxTokens,
          phases: advancedOptions.phases,
          providers: advancedOptions.providers,
          use_parallel: advancedOptions.useParallel,
          enable_judging: advancedOptions.enableJudging,
          use_optimization: advancedOptions.useOptimization,
          count: 3,
          save: true,
          // TODO: Handle attachments separately
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      // const result = await response.json();
      
      // Call the parent's onSubmit with the result
      await onSubmit(input, advancedOptions, attachments);
      
      // Clear input after successful submission
      setInput('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to generate prompts:', error);
      // You might want to show an error notification here
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  // Character count
  const charCount = input.length;
  const charPercentage = (charCount / maxLength) * 100;

  const selectedPersonaData = PERSONAS.find(p => p.id === selectedPersona) || PERSONAS[0];

  return (
    <div className={`alchemical-input-container ${className}`} ref={containerRef}>
      <form onSubmit={handleSubmit} className="alchemical-input-form">
        {/* Main Input Area */}
        <div className={`alchemical-input-wrapper ${isExpanded ? 'expanded' : ''} ${isLoading ? 'loading' : ''}`}>
          {/* Input Field */}
          <div className="alchemical-input-main">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onFocus={() => setIsExpanded(true)}
              onBlur={() => setTimeout(() => setIsExpanded(false), 100)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="alchemical-input"
              maxLength={maxLength}
              rows={1}
              disabled={isLoading}
            />
            
            {/* Loading Overlay */}
            {isLoading && (
              <div className="alchemical-loading-overlay">
                <div className="alchemical-loading-spinner">
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                </div>
                <span>Transmuting...</span>
              </div>
            )}
          </div>

          {/* Character Counter */}
          <div className="alchemical-char-counter">
            <div className="char-count-text">{charCount}/{maxLength}</div>
            <div className="char-count-bar">
              <div 
                className="char-count-fill"
                style={{ width: `${charPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Attachment Area */}
          {attachments.length > 0 && (
            <div className="alchemical-attachments">
              {attachments.map((file, index) => (
                <div key={index} className="attachment-item">
                  <span className="attachment-name">{file.name}</span>
                  <button
                    type="button"
                    className="attachment-remove"
                    onClick={() => removeAttachment(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="alchemical-controls">
          {/* Left Side Controls */}
          <div className="alchemical-controls-left">
            {/* Attachment Button */}
            <button
              type="button"
              className="alchemical-btn alchemical-btn-attach"
              onClick={() => fileInputRef.current?.click()}
              title="Attach files"
            >
              <svg className="btn-icon" viewBox="0 0 24 24">
                <path d="M16.5,6V17.5A4,4 0 0,1 12.5,21.5A4,4 0 0,1 8.5,17.5V5A2.5,2.5 0 0,1 11,2.5A2.5,2.5 0 0,1 13.5,5V15.5A1,1 0 0,1 12.5,16.5A1,1 0 0,1 11.5,15.5V6H10V15.5A2.5,2.5 0 0,0 12.5,18A2.5,2.5 0 0,0 15,15.5V5A4,4 0 0,0 11,1A4,4 0 0,0 7,5V17.5A5.5,5.5 0 0,0 12.5,23A5.5,5.5 0 0,0 18,17.5V6H16.5Z"/>
              </svg>
            </button>

            {/* Advanced Options Button */}
            <button
              type="button"
              className={`alchemical-btn alchemical-btn-advanced ${showOptionsModal ? 'active' : ''}`}
              onClick={() => setShowOptionsModal(!showOptionsModal)}
              title="Advanced options"
            >
              <svg className="btn-icon" viewBox="0 0 24 24">
                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5a3.5,3.5 0 0,1 3.5,3.5a3.5,3.5 0 0,1-3.5,3.5m7.43-2.53c0.04-0.32,0.07-0.64,0.07-0.97c0-0.33-0.03-0.66-0.07-1l1.86-1.41c0.17-0.13,0.22-0.36,0.12-0.55l-1.76-3.03a0.448,0.448 0 0,0-0.52-0.22l-2.19,0.91c-0.46-0.35-0.97-0.62-1.51-0.84L16.06,2.5c-0.03-0.23-0.21-0.4-0.45-0.4h-3.52c-0.24,0-0.42,0.17-0.45,0.4L11.27,4.95c-0.54,0.22-1.05,0.49-1.51,0.84l-2.19-0.91c-0.23-0.09-0.49,0-0.52,0.22L5.29,8.13c-0.1,0.19-0.05,0.42,0.12,0.55L7.27,10.09c-0.04,0.34-0.07,0.67-0.07,1c0,0.33,0.03,0.65,0.07,0.97l-1.86,1.41c-0.17,0.13-0.22,0.36-0.12,0.55l1.76,3.03c0.12,0.22,0.29,0.28,0.52,0.22l2.19-0.91c0.46,0.35,0.97,0.62,1.51,0.84l0.37,1.95c0.03,0.23,0.21,0.4,0.45,0.4h3.52c0.24,0,0.42-0.17,0.45-0.4l0.37-1.95c0.54-0.22,1.05-0.49,1.51-0.84l2.19,0.91c0.23,0.09,0.49,0,0.52-0.22l1.76-3.03c0.1-0.19,0.05-0.42-0.12-0.55l-1.86-1.41Z"/>
              </svg>
            </button>
          </div>

          {/* Right Side Controls */}
          <div className="alchemical-controls-right">
            {/* Generate Button with Preset Dropdown */}
            <div className="alchemical-generate-container">
              <button
                type="submit"
                className="alchemical-btn alchemical-btn-generate"
                disabled={!input.trim() || isLoading}
                title="Generate (Cmd/Ctrl + Enter)"
              >
                <svg className="btn-icon" viewBox="0 0 24 24">
                  <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
                </svg>
                {isLoading ? 'Transmuting...' : 'Generate'}
              </button>
              
              {/* Persona Dropdown */}
              <div className="alchemical-persona-dropdown">
                <button
                  type="button"
                  className="alchemical-persona-toggle"
                  onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
                  title="Choose persona"
                >
                  <span className="persona-icon-small">{selectedPersonaData.icon}</span>
                  <svg className="btn-icon dropdown-arrow" viewBox="0 0 24 24">
                    <path d="M7,10L12,15L17,10H7Z"/>
                  </svg>
                </button>
                
                {showPersonaDropdown && (
                  <div className="alchemical-persona-menu">
                    {PERSONAS.map(persona => (
                      <button
                        key={persona.id}
                        type="button"
                        className={`alchemical-persona-item ${persona.id === selectedPersona ? 'selected' : ''}`}
                        onClick={() => handlePersonaSelect(persona.id)}
                      >
                        <span className="persona-icon">{persona.icon}</span>
                        <div className="persona-info">
                          <div className="persona-name">{persona.name}</div>
                          <div className="persona-description">{persona.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Options Modal */}
        {showOptionsModal && (
          <>
            {/* Modal Overlay */}
            <div className="modal-overlay" onClick={() => setShowOptionsModal(false)} />
            
            <div className="alchemical-options-modal">
              <div className="modal-header">
                <h3>Advanced Options</h3>
                <button className="close-modal-btn" onClick={() => setShowOptionsModal(false)}>×</button>
              </div>
              <div className="modal-content">
                {/* Temperature */}
                <div className="advanced-option">
                  <label className="advanced-label">
                    Temperature: <span className="slider-value">{advancedOptions.temperature}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={advancedOptions.temperature}
                    onChange={(e) => setAdvancedOptions(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="advanced-slider"
                  />
                  <div className="option-description">Controls randomness: 0 = focused, 2 = creative</div>
                </div>

                {/* Max Tokens */}
                <div className="advanced-option">
                  <label className="advanced-label">
                    Max Tokens: <span className="slider-value">{advancedOptions.maxTokens}</span>
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="4000"
                    step="100"
                    value={advancedOptions.maxTokens}
                    onChange={(e) => setAdvancedOptions(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    className="advanced-slider"
                  />
                  <div className="option-description">Maximum length of generated output</div>
                </div>

                {/* Phases Selection */}
                <div className="advanced-option">
                  <label className="advanced-label">Alchemical Phases</label>
                  <div className="phase-select">
                    {['prima-materia', 'solutio', 'coagulatio'].map(phase => (
                      <button
                        key={phase}
                        type="button"
                        className={`phase-option ${advancedOptions.phases.includes(phase) ? 'selected' : ''}`}
                        onClick={() => {
                          setAdvancedOptions(prev => ({
                            ...prev,
                            phases: prev.phases.includes(phase)
                              ? prev.phases.filter(p => p !== phase)
                              : [...prev.phases, phase]
                          }));
                        }}
                      >
                        {phase}
                      </button>
                    ))}
                  </div>
                  <div className="option-description">Select which transformation phases to apply</div>
                </div>

                {/* Toggle Options */}
                <div className="advanced-option">
                  <label className="advanced-label">Processing Options</label>
                  <div className="advanced-checkbox">
                    <input
                      type="checkbox"
                      id="useParallel"
                      checked={advancedOptions.useParallel}
                      onChange={(e) => setAdvancedOptions(prev => ({ ...prev, useParallel: e.target.checked }))}
                    />
                    <label htmlFor="useParallel">Use Parallel Processing</label>
                  </div>
                  <div className="advanced-checkbox">
                    <input
                      type="checkbox"
                      id="enableJudging"
                      checked={advancedOptions.enableJudging}
                      onChange={(e) => setAdvancedOptions(prev => ({ ...prev, enableJudging: e.target.checked }))}
                    />
                    <label htmlFor="enableJudging">Enable AI Judging</label>
                  </div>
                  <div className="advanced-checkbox">
                    <input
                      type="checkbox"
                      id="useOptimization"
                      checked={advancedOptions.useOptimization}
                      onChange={(e) => setAdvancedOptions(prev => ({ ...prev, useOptimization: e.target.checked }))}
                    />
                    <label htmlFor="useOptimization">Enable Optimization</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-btn cancel-btn" onClick={() => setShowOptionsModal(false)}>Cancel</button>
                <button className="modal-btn save-btn" onClick={() => setShowOptionsModal(false)}>Apply</button>
              </div>
            </div>
          </>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          accept=".txt,.md,.pdf,.doc,.docx,.rtf,.odt,.csv,.json,.xml,.yaml,.yml,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.hpp,.cs,.rb,.go,.rs,.swift,.kt,.php,.html,.css,.scss,.sass,.sql,.sh,.bash,.zsh,.ps1,.bat,.cmd"
          style={{ display: 'none' }}
        />
      </form>
    </div>
  );
};

export default AlchemicalInput; 