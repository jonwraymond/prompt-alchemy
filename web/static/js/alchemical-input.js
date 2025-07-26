// Alchemical Input Component - Vanilla JavaScript Version
// Replaces the old input components with modern alchemical styling

class AlchemicalInput {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = {
      placeholder: "Describe what you want to create...",
      maxLength: 5000,
      onSubmit: null,
      onValueChange: null,
      ...options
    };
    
    this.state = {
      input: '',
      isExpanded: false,
      isLoading: false,
      showPresets: false,
      showAdvanced: false,
      attachments: [],
      providers: [],
      selectedPreset: null
    };
    
    this.advancedOptions = {
      persona: 'generic',
      temperature: 0.7,
      maxTokens: 2000,
      phases: ['prima-materia', 'solutio', 'coagulatio'],
      providers: {},
      useParallel: false,
      enableJudging: false,
      useOptimization: false
    };
    
    this.presets = [
      {
        id: 'code-generation',
        name: 'Code Generation',
        description: 'Generate clean, efficient code',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>`,
        prompt: 'Create a {language} function that {task}',
        persona: 'code',
        temperature: 0.3,
        maxTokens: 2000
      },
      {
        id: 'creative-writing',
        name: 'Creative Writing',
        description: 'Craft engaging creative content',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 12l2 2 4-4"></path>
          <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"></path>
          <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z"></path>
          <path d="M12 3c0 1-1 2-2 2s-2-1-2-2 1-2 2-2 2 1 2 2z"></path>
          <path d="M12 21c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z"></path>
        </svg>`,
        prompt: 'Write a {style} piece about {topic}',
        persona: 'creative',
        temperature: 0.8,
        maxTokens: 1500
      },
      {
        id: 'technical-docs',
        name: 'Technical Documentation',
        description: 'Create clear technical documentation',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10,9 9,9 8,9"></polyline>
        </svg>`,
        prompt: 'Document the {system} with {requirements}',
        persona: 'technical',
        temperature: 0.4,
        maxTokens: 2500
      },
      {
        id: 'business-analysis',
        name: 'Business Analysis',
        description: 'Analyze business scenarios and data',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 3v18h18"></path>
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
        </svg>`,
        prompt: 'Analyze {business_scenario} and provide {insights}',
        persona: 'analysis',
        temperature: 0.6,
        maxTokens: 2000
      },
      {
        id: 'problem-solving',
        name: 'Problem Solving',
        description: 'Break down complex problems',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>`,
        prompt: 'Solve {problem} by {approach}',
        persona: 'analysis',
        temperature: 0.5,
        maxTokens: 2000
      }
    ];
    
    this.init();
  }
  
  init() {
    this.createStructure();
    this.setupEventListeners();
    this.loadProviders();
    this.updateTextareaHeight();
  }
  
  createStructure() {
    // Clear existing content
    this.container.innerHTML = '';
    this.container.className = 'alchemical-input-container';
    
    // Create form
    this.form = document.createElement('form');
    this.form.className = 'alchemical-input-form';
    
    // Create input wrapper
    this.inputWrapper = document.createElement('div');
    this.inputWrapper.className = 'alchemical-input-wrapper';
    
    // Create main input area
    this.inputMain = document.createElement('div');
    this.inputMain.className = 'alchemical-input-main';
    
    // Create textarea
    this.textarea = document.createElement('textarea');
    this.textarea.className = 'alchemical-input';
    this.textarea.placeholder = this.options.placeholder;
    this.textarea.maxLength = this.options.maxLength;
    this.textarea.rows = 1;
    
    // Create character counter
    this.charCounter = document.createElement('div');
    this.charCounter.className = 'alchemical-char-counter';
    this.charCounter.innerHTML = `
      <div class="char-count-text">0/${this.options.maxLength}</div>
      <div class="char-count-bar">
        <div class="char-count-fill" style="width: 0%"></div>
      </div>
    `;
    
    // Create attachments area
    this.attachmentsArea = document.createElement('div');
    this.attachmentsArea.className = 'alchemical-attachments';
    this.attachmentsArea.style.display = 'none';
    
    // Create controls
    this.controls = document.createElement('div');
    this.controls.className = 'alchemical-controls';
    
    // Left controls
    this.leftControls = document.createElement('div');
    this.leftControls.className = 'alchemical-controls-left';
    
    // Attachment button - Modern Paperclip
    this.attachBtn = document.createElement('button');
    this.attachBtn.type = 'button';
    this.attachBtn.className = 'alchemical-btn alchemical-btn-attach';
    this.attachBtn.title = 'Attach files';
    this.attachBtn.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
      </svg>
    `;
    
    // Advanced button - Modern Settings
    this.advancedBtn = document.createElement('button');
    this.advancedBtn.type = 'button';
    this.advancedBtn.className = 'alchemical-btn alchemical-btn-advanced';
    this.advancedBtn.title = 'Advanced options';
    this.advancedBtn.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
    
    // Right controls
    this.rightControls = document.createElement('div');
    this.rightControls.className = 'alchemical-controls-right';
    
    // Generate container
    this.generateContainer = document.createElement('div');
    this.generateContainer.className = 'alchemical-generate-container';
    
    // Generate button - Modern Send
    this.generateBtn = document.createElement('button');
    this.generateBtn.type = 'submit';
    this.generateBtn.className = 'alchemical-btn alchemical-btn-generate';
    this.generateBtn.disabled = true;
    this.generateBtn.title = 'Generate prompt (Cmd/Ctrl + Enter)';
    this.generateBtn.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 2L11 13"></path>
        <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
      </svg>
      Generate
    `;
    
    // Preset dropdown
    this.presetDropdown = document.createElement('div');
    this.presetDropdown.className = 'alchemical-preset-dropdown';
    
    this.presetToggle = document.createElement('button');
    this.presetToggle.type = 'button';
    this.presetToggle.className = 'alchemical-preset-toggle';
    this.presetToggle.title = 'Choose preset';
    this.presetToggle.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9L12 15L18 9"></path>
      </svg>
    `;
    
    // Advanced panel
    this.advancedPanel = document.createElement('div');
    this.advancedPanel.className = 'alchemical-advanced-panel';
    this.advancedPanel.style.display = 'none';
    this.createAdvancedPanel();
    
    // Hidden file input
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.multiple = true;
    this.fileInput.style.display = 'none';
    
    // Assemble the structure
    this.inputMain.appendChild(this.textarea);
    this.inputWrapper.appendChild(this.inputMain);
    this.inputWrapper.appendChild(this.charCounter);
    this.inputWrapper.appendChild(this.attachmentsArea);
    
    this.leftControls.appendChild(this.attachBtn);
    this.leftControls.appendChild(this.advancedBtn);
    
    this.presetDropdown.appendChild(this.presetToggle);
    this.generateContainer.appendChild(this.generateBtn);
    this.generateContainer.appendChild(this.presetDropdown);
    this.rightControls.appendChild(this.generateContainer);
    
    this.controls.appendChild(this.leftControls);
    this.controls.appendChild(this.rightControls);
    
    this.form.appendChild(this.inputWrapper);
    this.form.appendChild(this.controls);
    this.form.appendChild(this.advancedPanel);
    this.form.appendChild(this.fileInput);
    
    this.container.appendChild(this.form);
  }
  
  createAdvancedPanel() {
    this.advancedPanel.innerHTML = `
      <div class="advanced-grid">
        <div class="advanced-option">
          <label class="advanced-label">Persona</label>
          <select class="advanced-select" id="persona-select">
            <option value="generic">Generic</option>
            <option value="code">Code</option>
            <option value="creative">Creative</option>
            <option value="technical">Technical</option>
            <option value="analysis">Analysis</option>
            <option value="business">Business</option>
          </select>
        </div>
        
        <div class="advanced-option">
          <label class="advanced-label">Temperature: <span id="temp-value">0.7</span></label>
          <input type="range" min="0" max="2" step="0.1" value="0.7" class="advanced-slider" id="temp-slider">
        </div>
        
        <div class="advanced-option">
          <label class="advanced-label">Max Tokens: <span id="tokens-value">2000</span></label>
          <input type="range" min="500" max="4000" step="100" value="2000" class="advanced-slider" id="tokens-slider">
        </div>
        
        <div class="advanced-option">
          <label class="advanced-label">Provider</label>
          <select class="advanced-select" id="provider-select">
            <option value="">Auto</option>
          </select>
        </div>
        
        <div class="advanced-option">
          <label class="advanced-label">Optimization</label>
          <div class="advanced-toggles">
            <label class="advanced-toggle">
              <input type="checkbox" id="optimization-toggle">
              <span>Use Optimization</span>
            </label>
            <label class="advanced-toggle">
              <input type="checkbox" id="judging-toggle">
              <span>Enable Judging</span>
            </label>
            <label class="advanced-toggle">
              <input type="checkbox" id="parallel-toggle">
              <span>Parallel Processing</span>
            </label>
          </div>
        </div>
      </div>
    `;
  }
  
  setupEventListeners() {
    // Textarea events
    this.textarea.addEventListener('input', this.handleInputChange.bind(this));
    this.textarea.addEventListener('focus', this.handleFocus.bind(this));
    this.textarea.addEventListener('blur', this.handleBlur.bind(this));
    this.textarea.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Form submission
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    
    // Button events
    this.attachBtn.addEventListener('click', () => this.fileInput.click());
    this.advancedBtn.addEventListener('click', this.toggleAdvanced.bind(this));
    this.presetToggle.addEventListener('click', this.togglePresets.bind(this));
    
    // File input
    this.fileInput.addEventListener('change', this.handleFileAttach.bind(this));
    
    // Advanced panel events
    this.setupAdvancedEventListeners();
    
    // Click outside to close dropdowns
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }
  
  setupAdvancedEventListeners() {
    const personaSelect = this.advancedPanel.querySelector('#persona-select');
    const tempSlider = this.advancedPanel.querySelector('#temp-slider');
    const tempValue = this.advancedPanel.querySelector('#temp-value');
    const tokensSlider = this.advancedPanel.querySelector('#tokens-slider');
    const tokensValue = this.advancedPanel.querySelector('#tokens-value');
    const providerSelect = this.advancedPanel.querySelector('#provider-select');
    const optimizationToggle = this.advancedPanel.querySelector('#optimization-toggle');
    const judgingToggle = this.advancedPanel.querySelector('#judging-toggle');
    const parallelToggle = this.advancedPanel.querySelector('#parallel-toggle');
    
    personaSelect.addEventListener('change', (e) => {
      this.advancedOptions.persona = e.target.value;
    });
    
    tempSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.advancedOptions.temperature = value;
      tempValue.textContent = value;
    });
    
    tokensSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.advancedOptions.maxTokens = value;
      tokensValue.textContent = value;
    });
    
    providerSelect.addEventListener('change', (e) => {
      this.advancedOptions.providers['prima-materia'] = e.target.value;
    });
    
    optimizationToggle.addEventListener('change', (e) => {
      this.advancedOptions.useOptimization = e.target.checked;
    });
    
    judgingToggle.addEventListener('change', (e) => {
      this.advancedOptions.enableJudging = e.target.checked;
    });
    
    parallelToggle.addEventListener('change', (e) => {
      this.advancedOptions.useParallel = e.target.checked;
    });
  }
  
  handleInputChange(e) {
    const newValue = e.target.value;
    if (newValue.length <= this.options.maxLength) {
      this.state.input = newValue;
      this.updateCharCounter();
      this.updateTextareaHeight();
      this.updateGenerateButton();
      this.options.onValueChange?.(newValue);
    }
  }
  
  handleFocus() {
    this.state.isExpanded = true;
    this.updateWrapperClasses();
  }
  
  handleBlur() {
    setTimeout(() => {
      this.state.isExpanded = false;
      this.updateWrapperClasses();
    }, 100);
  }
  
  handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      this.handleSubmit(e);
    }
  }
  
  handleSubmit(e) {
    e.preventDefault();
    if (!this.state.input.trim() || this.state.isLoading) return;
    
    this.setStateLoading(true);
    
    // Prepare request data
    const requestData = {
      input: this.state.input,
      persona: this.advancedOptions.persona,
      temperature: this.advancedOptions.temperature,
      max_tokens: this.advancedOptions.maxTokens,
      phases: this.advancedOptions.phases,
      providers: this.advancedOptions.providers,
      use_parallel: this.advancedOptions.useParallel,
      enable_judging: this.advancedOptions.enableJudging,
      use_optimization: this.advancedOptions.useOptimization
    };
    
    // Call custom submit handler or default API call
    if (this.options.onSubmit) {
      this.options.onSubmit(requestData).finally(() => {
        this.setStateLoading(false);
      });
    } else {
      this.submitToAPI(requestData);
    }
  }
  
  async submitToAPI(requestData) {
    try {
      const response = await fetch('/api/v1/prompts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Clear input after successful submission
      this.state.input = '';
      this.state.attachments = [];
      this.state.selectedPreset = null;
      this.textarea.value = '';
      this.updateCharCounter();
      this.updateTextareaHeight();
      this.updateGenerateButton();
      this.updateAttachmentsArea();
      
      // Trigger any custom success handler
      if (this.options.onSuccess) {
        this.options.onSuccess(result);
      }
      
    } catch (error) {
      console.error('Submission failed:', error);
      
      // Trigger any custom error handler
      if (this.options.onError) {
        this.options.onError(error);
      }
    } finally {
      this.setStateLoading(false);
    }
  }
  
  handleFileAttach(e) {
    const files = Array.from(e.target.files || []);
    this.state.attachments = [...this.state.attachments, ...files];
    this.updateAttachmentsArea();
  }
  
  handleFileRemove(index) {
    this.state.attachments = this.state.attachments.filter((_, i) => i !== index);
    this.updateAttachmentsArea();
  }
  
  toggleAdvanced() {
    this.state.showAdvanced = !this.state.showAdvanced;
    this.advancedPanel.style.display = this.state.showAdvanced ? 'block' : 'none';
    this.advancedBtn.classList.toggle('active', this.state.showAdvanced);
  }
  
  togglePresets() {
    this.state.showPresets = !this.state.showPresets;
    this.updatePresetMenu();
  }
  
  handlePresetSelect(preset) {
    this.state.selectedPreset = preset;
    this.state.input = preset.prompt;
    this.textarea.value = preset.prompt;
    
    // Update advanced options
    if (preset.persona) this.advancedOptions.persona = preset.persona;
    if (preset.temperature) this.advancedOptions.temperature = preset.temperature;
    if (preset.maxTokens) this.advancedOptions.maxTokens = preset.maxTokens;
    
    // Update UI
    this.updateCharCounter();
    this.updateTextareaHeight();
    this.updateGenerateButton();
    this.updateAdvancedPanel();
    this.state.showPresets = false;
    this.updatePresetMenu();
    
    this.options.onValueChange?.(preset.prompt);
  }
  
  handleClickOutside(e) {
    if (!this.container.contains(e.target)) {
      this.state.showPresets = false;
      this.updatePresetMenu();
    }
  }
  
  updateWrapperClasses() {
    this.inputWrapper.className = `alchemical-input-wrapper ${this.state.isExpanded ? 'expanded' : ''} ${this.state.isLoading ? 'loading' : ''}`;
  }
  
  updateCharCounter() {
    const charCount = this.state.input.length;
    const charPercentage = (charCount / this.options.maxLength) * 100;
    
    const charCountText = this.charCounter.querySelector('.char-count-text');
    const charCountFill = this.charCounter.querySelector('.char-count-fill');
    
    charCountText.textContent = `${charCount}/${this.options.maxLength}`;
    charCountFill.style.width = `${charPercentage}%`;
  }
  
  updateTextareaHeight() {
    this.textarea.style.height = 'auto';
    this.textarea.style.height = Math.min(this.textarea.scrollHeight, 200) + 'px';
  }
  
  updateGenerateButton() {
    this.generateBtn.disabled = !this.state.input.trim() || this.state.isLoading;
  }
  
  updateAttachmentsArea() {
    if (this.state.attachments.length === 0) {
      this.attachmentsArea.style.display = 'none';
      return;
    }
    
    this.attachmentsArea.style.display = 'block';
    this.attachmentsArea.innerHTML = this.state.attachments.map((file, index) => `
      <div class="attachment-item">
        <span class="attachment-name">${file.name}</span>
        <button type="button" class="attachment-remove" data-index="${index}">×</button>
      </div>
    `).join('');
    
    // Add event listeners to remove buttons
    this.attachmentsArea.querySelectorAll('.attachment-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.handleFileRemove(index);
      });
    });
  }
  
  updatePresetMenu() {
    if (this.state.showPresets) {
      const menu = document.createElement('div');
      menu.className = 'alchemical-preset-menu';
      menu.innerHTML = this.presets.map(preset => `
        <button type="button" class="alchemical-preset-item" data-preset-id="${preset.id}">
          <span class="preset-icon">${preset.icon}</span>
          <div class="preset-content">
            <div class="preset-name">${preset.name}</div>
            <div class="preset-description">${preset.description}</div>
          </div>
        </button>
      `).join('');
      
      // Remove existing menu
      const existingMenu = this.presetDropdown.querySelector('.alchemical-preset-menu');
      if (existingMenu) {
        existingMenu.remove();
      }
      
      this.presetDropdown.appendChild(menu);
      
      // Add event listeners
      menu.querySelectorAll('.alchemical-preset-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const presetId = e.currentTarget.dataset.presetId;
          const preset = this.presets.find(p => p.id === presetId);
          if (preset) {
            this.handlePresetSelect(preset);
          }
        });
      });
    } else {
      const existingMenu = this.presetDropdown.querySelector('.alchemical-preset-menu');
      if (existingMenu) {
        existingMenu.remove();
      }
    }
  }
  
  updateAdvancedPanel() {
    const personaSelect = this.advancedPanel.querySelector('#persona-select');
    const tempSlider = this.advancedPanel.querySelector('#temp-slider');
    const tempValue = this.advancedPanel.querySelector('#temp-value');
    const tokensSlider = this.advancedPanel.querySelector('#tokens-slider');
    const tokensValue = this.advancedPanel.querySelector('#tokens-value');
    const optimizationToggle = this.advancedPanel.querySelector('#optimization-toggle');
    const judgingToggle = this.advancedPanel.querySelector('#judging-toggle');
    const parallelToggle = this.advancedPanel.querySelector('#parallel-toggle');
    
    personaSelect.value = this.advancedOptions.persona;
    tempSlider.value = this.advancedOptions.temperature;
    tempValue.textContent = this.advancedOptions.temperature;
    tokensSlider.value = this.advancedOptions.maxTokens;
    tokensValue.textContent = this.advancedOptions.maxTokens;
    optimizationToggle.checked = this.advancedOptions.useOptimization;
    judgingToggle.checked = this.advancedOptions.enableJudging;
    parallelToggle.checked = this.advancedOptions.useParallel;
  }
  
  setStateLoading(loading) {
    this.state.isLoading = loading;
    this.updateWrapperClasses();
    this.updateGenerateButton();
    
    if (loading) {
      this.generateBtn.innerHTML = `
        <svg class="btn-icon loading-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 11-6.219-8.56"></path>
        </svg>
        Generating...
      `;
    } else {
      this.generateBtn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 2L11 13"></path>
          <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
        </svg>
        Generate
      `;
    }
  }
  
  async loadProviders() {
    try {
      const response = await fetch('/api/v1/providers');
      if (response.ok) {
        const data = await response.json();
        this.state.providers = data.providers || [];
        this.updateProviderSelect();
      }
    } catch (error) {
      console.warn('Failed to load providers:', error);
    }
  }
  
  updateProviderSelect() {
    const providerSelect = this.advancedPanel.querySelector('#provider-select');
    if (providerSelect) {
      const currentValue = providerSelect.value;
      providerSelect.innerHTML = '<option value="">Auto</option>' + 
        this.state.providers.map(provider => 
          `<option value="${provider.name}">${provider.name.charAt(0).toUpperCase() + provider.name.slice(1)}</option>`
        ).join('');
      providerSelect.value = currentValue;
    }
  }
  
  // Public methods
  getValue() {
    return this.state.input;
  }
  
  setValue(value) {
    this.state.input = value;
    this.textarea.value = value;
    this.updateCharCounter();
    this.updateTextareaHeight();
    this.updateGenerateButton();
  }
  
  clear() {
    this.setValue('');
    this.state.attachments = [];
    this.updateAttachmentsArea();
  }
  
  focus() {
    this.textarea.focus();
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize alchemical input in the designated container
  const container = document.getElementById('alchemical-input-container');
  if (container) {
    new AlchemicalInput(container, {
      onSubmit: async (data) => {
        // Trigger the existing form submission
        const form = document.getElementById('generate-form');
        if (form) {
          // Update the original input value
          const originalInput = document.getElementById('input');
          if (originalInput) {
            originalInput.value = data.input;
          }
          
          // Submit the form
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      }
    });
  }
});

// Export for global use
window.AlchemicalInput = AlchemicalInput; 