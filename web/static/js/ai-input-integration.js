/**
 * AI Input Component Integration
 * Seamlessly integrates AI-powered input with the existing alchemy interface
 */

console.log('🤖 AI Input Integration: Script loaded at', new Date().toLocaleTimeString());

class AIInputIntegration {
  constructor(options = {}) {
    console.log('🤖 AI Input Integration: Constructor called with options:', options);
    
    this.options = {
      selector: '#input',
      formSelector: '#generate-form',
      enableSuggestions: true,
      enableThinking: true,
      maxLength: 5000,
      debounceDelay: 300,
      ...options
    };
    
    console.log('🤖 AI Input Integration: Final options:', this.options);
    
    this.originalInput = null;
    this.aiContainer = null;
    this.aiInput = null;
    this.elements = {}; // Initialize elements object
    this.isInitialized = false;
    this.thoughtProcess = [];
    
    // Initialize navigation state
    this.selectedSuggestion = null;
    this.selectedSuggestionIndex = -1;
    
    this.init();
  }
  
  init() {
    console.log('🤖 AI Input Integration: init() called');
    console.log('🤖 AI Input Integration: Looking for selector:', this.options.selector);
    
    this.originalInput = document.querySelector(this.options.selector);
    console.log('🤖 AI Input Integration: Found original input:', this.originalInput);
    
    if (!this.originalInput) {
      console.error('🤖 AI Input Integration: ❌ Original input not found with selector:', this.options.selector);
      return;
    }
    
    console.log('🤖 AI Input Integration: Creating AI input structure...');
    this.createAIInputStructure();
    
    console.log('🤖 AI Input Integration: Binding events...');
    this.bindEvents();
    
    console.log('🤖 AI Input Integration: Syncing with original input...');
    this.syncWithOriginalInput();
    
    this.isInitialized = true;
    console.log('🤖 AI Input Integration: ✅ Initialization complete!');
  }
  
  createAIInputStructure() {
    // Create container
    this.aiContainer = document.createElement('div');
    this.aiContainer.className = 'ai-input-container';
    
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-input-wrapper';
    
    // Create textarea
    this.aiInput = document.createElement('textarea');
    this.aiInput.className = 'ai-input';
    this.aiInput.placeholder = this.originalInput.placeholder || 'Insert your prompt here...';
    this.aiInput.rows = this.originalInput.rows || 3;
    this.aiInput.name = this.originalInput.name;
    this.aiInput.required = this.originalInput.required;
    this.aiInput.value = this.originalInput.value;
    
    // Create loading indicator
    const loading = document.createElement('div');
    loading.className = 'ai-input-loading';
    loading.style.display = 'none';
    
    // Create thinking dots
    const thinkingDots = document.createElement('div');
    thinkingDots.className = 'ai-thinking-dots';
    thinkingDots.innerHTML = `
      <span class="ai-thinking-dot"></span>
      <span class="ai-thinking-dot"></span>
      <span class="ai-thinking-dot"></span>
    `;
    
    // Create character counter
    const counter = document.createElement('div');
    counter.className = 'ai-input-counter';
    counter.textContent = '0 chars';
    
    // Create button controls container
    const buttonControls = document.createElement('div');
    buttonControls.className = 'ai-input-controls';
    
    // Create right side controls container
    const rightControls = document.createElement('div');
    rightControls.className = 'ai-input-controls-right';
    
    // Create enhanced button structure
    this.createEnhancedButtons(rightControls);
    
    // Move existing functionality
    const existingControls = document.querySelector('.horizontal-controls');
    if (existingControls) {
      // Hide the original controls
      existingControls.style.display = 'none';
    }
    
    // Create suggestions dropdown
    const suggestions = document.createElement('div');
    suggestions.className = 'ai-suggestions';
    suggestions.id = 'ai-suggestions';
    
    // Create attachment area
    const attachmentArea = this.createAttachmentArea();
    
    // Add elements to button controls - generate button goes far right
    buttonControls.appendChild(attachmentArea);
    buttonControls.appendChild(counter);
    buttonControls.appendChild(rightControls);
    
    // Assemble structure
    wrapper.appendChild(this.aiInput);
    wrapper.appendChild(loading);
    wrapper.appendChild(thinkingDots);
    wrapper.appendChild(buttonControls);
    
    this.aiContainer.appendChild(wrapper);
    this.aiContainer.appendChild(suggestions);
    
    // Insert before original input
    this.originalInput.parentNode.insertBefore(this.aiContainer, this.originalInput);
    
    // Hide original input
    this.originalInput.style.display = 'none';
    
    // Store references (extend existing elements object)
    Object.assign(this.elements, {
      wrapper,
      loading,
      thinkingDots,
      counter,
      suggestions
    });
  }
  
  bindEvents() {
    // Input events
    this.aiInput.addEventListener('input', this.handleInput.bind(this));
    this.aiInput.addEventListener('focus', this.handleFocus.bind(this));
    this.aiInput.addEventListener('blur', this.handleBlur.bind(this));
    this.aiInput.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Form submission
    const form = document.querySelector(this.options.formSelector);
    if (form) {
      form.addEventListener('submit', this.handleSubmit.bind(this));
    }
    
    // HTMX integration
    document.body.addEventListener('htmx:beforeRequest', this.handleHTMXRequest.bind(this));
    document.body.addEventListener('htmx:afterRequest', this.handleHTMXResponse.bind(this));
  }
  
  handleInput(e) {
    const value = e.target.value;
    const length = value.length;
    
    // Update counter
    this.elements.counter.textContent = `${length} chars`;
    
    // Sync with original input
    this.originalInput.value = value;
    
    // Trigger custom event
    this.originalInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Handle suggestions (debounced)
    if (this.options.enableSuggestions) {
      clearTimeout(this.suggestionTimeout);
      this.suggestionTimeout = setTimeout(() => {
        this.updateSuggestions(value);
      }, this.options.debounceDelay);
    }
    
    // Check for AI trigger patterns
    this.checkAITriggers(value);
  }
  
  handleFocus(e) {
    this.elements.wrapper.classList.add('is-focused');
    this.showSuggestions();
  }
  
  handleBlur(e) {
    this.elements.wrapper.classList.remove('is-focused');
    setTimeout(() => this.hideSuggestions(), 200);
  }
  
  handleKeydown(e) {
    // Handle special key combinations
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      const form = document.querySelector(this.options.formSelector);
      if (form) {
        form.requestSubmit();
      }
    }
    
    // Handle suggestion navigation
    if (this.elements.suggestions.classList.contains('is-visible')) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateSuggestions(e.key === 'ArrowDown' ? 1 : -1);
      } else if (e.key === 'Enter' && this.selectedSuggestion) {
        e.preventDefault();
        this.applySuggestion(this.selectedSuggestion);
      }
    }
  }
  
  handleSubmit(e) {
    // Add transmutation effect
    this.elements.wrapper.classList.add('is-transmuting');
    setTimeout(() => {
      this.elements.wrapper.classList.remove('is-transmuting');
    }, 2000);
    
    // Show loading state
    this.showLoading();
  }
  
  handleHTMXRequest(evt) {
    if (evt.detail.elt.closest(this.options.formSelector)) {
      this.showLoading();
      this.showThinking();
    }
  }
  
  handleHTMXResponse(evt) {
    if (evt.detail.elt.closest(this.options.formSelector)) {
      this.hideLoading();
      this.hideThinking();
    }
  }
  
  showLoading() {
    this.elements.loading.style.display = 'block';
    this.elements.wrapper.classList.add('is-loading');
  }
  
  hideLoading() {
    this.elements.loading.style.display = 'none';
    this.elements.wrapper.classList.remove('is-loading');
  }
  
  showThinking() {
    if (this.options.enableThinking) {
      this.elements.wrapper.classList.add('is-thinking');
      this.startThinkingAnimation();
    }
  }
  
  hideThinking() {
    this.elements.wrapper.classList.remove('is-thinking');
    this.stopThinkingAnimation();
  }
  
  startThinkingAnimation() {
    // Integrate with hex grid thinking display
    if (window.hexAIThoughts) {
      window.hexAIThoughts.addThought({
        phase: 'Input Analysis',
        text: 'Analyzing prompt structure and intent...',
        type: 'system'
      });
    }
  }
  
  stopThinkingAnimation() {
    // Clear thinking animation
  }
  
  checkAITriggers(value) {
    // Check for special AI commands
    const triggers = {
      '/help': () => this.showAIHelp(),
      '/suggest': () => this.generateSuggestions(),
      '/enhance': () => this.enhancePrompt(),
      '/examples': () => this.showExamples()
    };
    
    const lastWord = value.split(' ').pop();
    if (triggers[lastWord]) {
      triggers[lastWord]();
    }
  }
  
  async updateSuggestions(value) {
    if (!value || value.length < 3) {
      this.hideSuggestions();
      return;
    }
    
    // Generate contextual suggestions
    const suggestions = await this.generateContextualSuggestions(value);
    this.displaySuggestions(suggestions);
  }
  
  async generateContextualSuggestions(input) {
    // This would connect to your AI backend
    // For now, return example suggestions
    const suggestions = [
      {
        text: 'Enhance this prompt with more detail',
        action: 'enhance',
        icon: '✨'
      },
      {
        text: 'Add technical specifications',
        action: 'technical',
        icon: '🔧'
      },
      {
        text: 'Make it more creative',
        action: 'creative',
        icon: '🎨'
      },
      {
        text: 'Optimize for clarity',
        action: 'clarity',
        icon: '💡'
      }
    ];
    
    return suggestions;
  }
  
  displaySuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }
    
    this.elements.suggestions.innerHTML = suggestions.map((suggestion, index) => `
      <div class="ai-suggestion-item" data-index="${index}" data-action="${suggestion.action}">
        <span class="suggestion-icon">${suggestion.icon}</span>
        <span class="suggestion-text">${suggestion.text}</span>
      </div>
    `).join('');
    
    // Bind click events
    this.elements.suggestions.querySelectorAll('.ai-suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        this.applySuggestionAction(action);
      });
    });
    
    this.showSuggestions();
  }
  
  showSuggestions() {
    if (this.elements.suggestions.children.length > 0) {
      this.elements.suggestions.classList.add('is-visible');
    }
  }
  
  hideSuggestions() {
    this.elements.suggestions.classList.remove('is-visible');
    this.selectedSuggestion = null;
  }
  
  applySuggestionAction(action) {
    const currentValue = this.aiInput.value;
    
    // Apply transformation based on action
    switch (action) {
      case 'enhance':
        this.enhancePrompt();
        break;
      case 'technical':
        this.addTechnicalContext();
        break;
      case 'creative':
        this.makeCreative();
        break;
      case 'clarity':
        this.optimizeClarity();
        break;
    }
    
    this.hideSuggestions();
  }
  
  async enhancePrompt() {
    const currentValue = this.aiInput.value;
    // This would call your AI enhancement endpoint
    console.log('Enhancing prompt:', currentValue);
    
    // Show enhancement in progress
    this.showThinking();
    
    // Simulate enhancement
    setTimeout(() => {
      this.aiInput.value = currentValue + '\n\n[Enhanced with additional context]';
      this.aiInput.dispatchEvent(new Event('input'));
      this.hideThinking();
    }, 1500);
  }
  
  createEnhancedButtons(container) {
    // Create Generate Button Group
    const generateGroup = document.createElement('div');
    generateGroup.className = 'ai-generate-btn-container';
    
    // Main Generate Button
    const generateBtn = document.createElement('button');
    generateBtn.type = 'submit';
    generateBtn.className = 'ai-generate-btn';
    generateBtn.title = 'Generate (Enter) | Right-click for presets';
    generateBtn.innerHTML = `
      <svg class="btn-icon" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L15.5 8.5L22 12L15.5 15.5L12 22L8.5 15.5L2 12L8.5 8.5L12 2Z"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1"/>
      </svg>
      Generate
    `;
    
    // Dropdown Arrow
    const dropdownArrow = document.createElement('div');
    dropdownArrow.className = 'ai-generate-dropdown';
    dropdownArrow.title = 'Generation Profiles';
    dropdownArrow.innerHTML = `
      <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 6L8 12L12 18L16 12L12 6Z"/>
        <circle cx="12" cy="12" r="1.5"/>
      </svg>
    `;
    
    // Config Button
    const configBtn = document.createElement('button');
    configBtn.type = 'button';
    configBtn.className = 'ai-config-btn';
    configBtn.title = 'Advanced Options';
    configBtn.innerHTML = `
      <svg class="btn-icon gear-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    `;
    
    // Assemble generate group
    generateGroup.appendChild(generateBtn);
    generateGroup.appendChild(dropdownArrow);
    
    // Create dropdown menus
    this.createDropdownMenus(container);
    
    // Add to container - config button first, then generate group
    container.appendChild(configBtn);
    container.appendChild(generateGroup);
    
    // Store references
    this.elements.generateBtn = generateBtn;
    this.elements.dropdownArrow = dropdownArrow;
    this.elements.configBtn = configBtn;
    this.elements.generateGroup = generateGroup;
    
    // Bind enhanced events
    this.bindEnhancedButtonEvents();
  }
  
  createDropdownMenus(container) {
    // Preset Options Menu (Right-click on Generate)
    const presetMenu = document.createElement('div');
    presetMenu.className = 'ai-dropdown-menu';
    presetMenu.id = 'ai-preset-menu';
    presetMenu.innerHTML = `
      <div class="ai-dropdown-item" data-action="quick-generate">
        <div class="icon">⚡</div>
        <div class="label">Quick Generate</div>
        <div class="description">Fast, single iteration</div>
      </div>
      <div class="ai-dropdown-item" data-action="detailed-generate">
        <div class="icon">🔍</div>
        <div class="label">Detailed Generate</div>
        <div class="description">Multiple iterations with analysis</div>
      </div>
      <div class="ai-dropdown-item" data-action="creative-generate">
        <div class="icon">🎨</div>
        <div class="label">Creative Generate</div>
        <div class="description">High creativity, experimental</div>
      </div>
      <div class="ai-dropdown-item" data-action="precise-generate">
        <div class="icon">🎯</div>
        <div class="label">Precise Generate</div>
        <div class="description">Focused, accurate results</div>
      </div>
    `;
    
    // Generation Profiles Menu (Dropdown arrow)
    const profilesMenu = document.createElement('div');
    profilesMenu.className = 'ai-dropdown-menu ai-profiles-dropdown';
    profilesMenu.id = 'ai-profiles-menu';
    profilesMenu.innerHTML = `
      <div class="ai-profile-item" data-action="enhance-detail">
        <div class="profile-name">✨ Enhance this prompt with more detail</div>
        <div class="profile-desc">Add depth and specificity to your prompt</div>
      </div>
      <div class="ai-profile-item" data-action="add-technical">
        <div class="profile-name">🔧 Add technical specifications</div>
        <div class="profile-desc">Include technical details and requirements</div>
      </div>
      <div class="ai-profile-item" data-action="make-creative">
        <div class="profile-name">🎨 Make it more creative</div>
        <div class="profile-desc">Boost creativity and imaginative elements</div>
      </div>
      <div class="ai-profile-item" data-action="optimize-clarity">
        <div class="profile-name">💡 Optimize for clarity</div>
        <div class="profile-desc">Improve readability and understanding</div>
      </div>
    `;
    
    container.appendChild(presetMenu);
    container.appendChild(profilesMenu);
    
    this.elements.presetMenu = presetMenu;
    this.elements.profilesMenu = profilesMenu;
  }
  
  bindEnhancedButtonEvents() {
    console.log('🤖 AI Input: Binding enhanced button events...');
    console.log('🤖 AI Input: Elements available:', Object.keys(this.elements));
    
    // Generate button left-click (normal submit)
    if (this.elements.generateBtn) {
      this.elements.generateBtn.addEventListener('click', (e) => {
        console.log('🤖 AI Input: Generate button clicked, button:', e.button);
        if (e.button === 0) { // Left click
          this.handleGenerateSubmit();
        }
      });
      
      // Generate button right-click (preset menu)
      this.elements.generateBtn.addEventListener('contextmenu', (e) => {
        console.log('🤖 AI Input: Right-click detected on generate button');
        e.preventDefault();
        this.showPresetMenu();
      });
    } else {
      console.error('🤖 AI Input: generateBtn element not found!');
    }
    
    // Dropdown arrow click (profiles menu)
    if (this.elements.dropdownArrow) {
      this.elements.dropdownArrow.addEventListener('click', (e) => {
        console.log('🤖 AI Input: Dropdown arrow clicked');
        e.preventDefault();
        this.toggleProfilesMenu();
      });
    } else {
      console.error('🤖 AI Input: dropdownArrow element not found!');
    }
    
    // Config button click
    this.elements.configBtn.addEventListener('click', (e) => {
      this.toggleConfigPanel();
    });
    
    // Preset menu item clicks
    this.elements.presetMenu.addEventListener('click', (e) => {
      const item = e.target.closest('.ai-dropdown-item');
      if (item) {
        const action = item.dataset.action;
        this.handlePresetAction(action);
        this.hidePresetMenu();
      }
    });
    
    // Profile menu item clicks
    this.elements.profilesMenu.addEventListener('click', (e) => {
      const item = e.target.closest('.ai-profile-item');
      if (item) {
        const action = item.dataset.action;
        this.handleSuggestionAction(action);
        this.hideProfilesMenu();
      }
    });
    
    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.ai-generate-btn-container') && 
          !e.target.closest('.ai-dropdown-menu')) {
        this.hideAllMenus();
      }
    });
  }
  
  handleGenerateSubmit() {
    console.log('🤖 AI Input: Normal generate submit');
    // Trigger form submission
    const form = document.querySelector(this.options.formSelector);
    if (form) {
      form.requestSubmit();
    }
  }
  
  showPresetMenu() {
    console.log('🤖 AI Input: Showing preset menu...');
    this.hideProfilesMenu();
    if (this.elements.presetMenu) {
      this.elements.presetMenu.classList.add('visible');
      console.log('🤖 AI Input: ✅ Preset menu visible class added');
    } else {
      console.error('🤖 AI Input: ❌ presetMenu element not found!');
    }
  }
  
  hidePresetMenu() {
    console.log('🤖 AI Input: Hiding preset menu...');
    if (this.elements.presetMenu) {
      this.elements.presetMenu.classList.remove('visible');
    }
  }
  
  toggleProfilesMenu() {
    console.log('🤖 AI Input: Toggling profiles menu...');
    this.hidePresetMenu();
    if (this.elements.profilesMenu) {
      this.elements.profilesMenu.classList.toggle('visible');
      const isVisible = this.elements.profilesMenu.classList.contains('visible');
      console.log('🤖 AI Input: Profiles menu visible:', isVisible);
    } else {
      console.error('🤖 AI Input: ❌ profilesMenu element not found!');
    }
  }
  
  hideProfilesMenu() {
    console.log('🤖 AI Input: Hiding profiles menu...');
    if (this.elements.profilesMenu) {
      this.elements.profilesMenu.classList.remove('visible');
    }
  }
  
  hideAllMenus() {
    this.hidePresetMenu();
    this.hideProfilesMenu();
  }
  
  toggleConfigPanel() {
    console.log('🤖 AI Input: Config panel toggle');
    // Call existing config toggle function
    if (typeof toggleFloatingOptions === 'function') {
      toggleFloatingOptions();
    }
  }
  
  handlePresetAction(action) {
    console.log('🤖 AI Input: Preset action:', action);
    
    // Set form values based on preset
    const presets = {
      'quick-generate': {
        count: '1',
        temperature: '0.7',
        use_optimization: false
      },
      'detailed-generate': {
        count: '3',
        temperature: '0.8',
        use_optimization: true,
        enable_judging: true
      },
      'creative-generate': {
        count: '3',
        temperature: '1.2',
        persona: 'creative'
      },
      'precise-generate': {
        count: '1',
        temperature: '0.3',
        persona: 'analysis'
      }
    };
    
    const preset = presets[action];
    if (preset) {
      this.applyFormSettings(preset);
      this.handleGenerateSubmit();
    }
  }
  
  handleSuggestionAction(action) {
    console.log('🤖 AI Input: Suggestion action:', action);
    
    // Call the appropriate suggestion method
    switch(action) {
      case 'enhance-detail':
        this.addTechnicalContext();
        break;
      case 'add-technical':
        this.addTechnicalContext();
        break;
      case 'make-creative':
        this.makeCreative();
        break;
      case 'optimize-clarity':
        this.optimizeClarity();
        break;
      default:
        console.log('Unknown suggestion action:', action);
    }
  }

  handleProfileSelect(profile) {
    console.log('🤖 AI Input: Profile selected:', profile);
    
    // Update persona in form
    const personaSelect = document.querySelector('#persona');
    if (personaSelect) {
      personaSelect.value = profile;
    }
    
    // Visual feedback
    this.showProfileFeedback(profile);
  }
  
  applyFormSettings(settings) {
    Object.entries(settings).forEach(([key, value]) => {
      const element = document.querySelector(`[name="${key}"]`);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = value;
        } else {
          element.value = value;
        }
      }
    });
  }
  
  createAttachmentArea() {
    const attachmentArea = document.createElement('div');
    attachmentArea.className = 'ai-attachment-area';
    attachmentArea.innerHTML = `
      <button type="button" class="ai-attachment-btn" title="Add files & attachments">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 7v10m-5-5h10"/>
        </svg>
      </button>
      <input type="file" class="ai-attachment-input" multiple accept="image/*,.pdf,.txt,.doc,.docx" style="display: none;">
      <div class="ai-attachment-list"></div>
    `;
    
    // Bind attachment events
    const attachBtn = attachmentArea.querySelector('.ai-attachment-btn');
    const attachInput = attachmentArea.querySelector('.ai-attachment-input');
    
    attachBtn.addEventListener('click', () => {
      attachInput.click();
    });
    
    attachInput.addEventListener('change', (e) => {
      this.handleFileAttachments(e.target.files);
    });
    
    return attachmentArea;
  }
  
  handleFileAttachments(files) {
    console.log('🤖 AI Input: Files attached:', files.length);
    const attachmentList = this.elements.wrapper.querySelector('.ai-attachment-list');
    
    Array.from(files).forEach(file => {
      const attachmentItem = document.createElement('div');
      attachmentItem.className = 'ai-attachment-item';
      attachmentItem.innerHTML = `
        <span class="attachment-name">${file.name}</span>
        <span class="attachment-size">${(file.size / 1024).toFixed(1)}KB</span>
        <button type="button" class="attachment-remove" onclick="this.parentElement.remove()">×</button>
      `;
      attachmentList.appendChild(attachmentItem);
    });
  }
  
  showProfileFeedback(profile) {
    // Create temporary feedback element
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: absolute;
      top: -30px;
      right: 0;
      background: var(--liquid-gold);
      color: #000;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      z-index: 1001;
      animation: slideInFade 2s ease-out forwards;
    `;
    feedback.textContent = `Profile: ${profile}`;
    
    this.elements.generateGroup.style.position = 'relative';
    this.elements.generateGroup.appendChild(feedback);
    
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 2000);
  }
  
  syncWithOriginalInput() {
    // Ensure two-way sync
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
          this.aiInput.value = this.originalInput.value;
        }
      });
    });
    
    observer.observe(this.originalInput, {
      attributes: true,
      attributeFilter: ['value']
    });
    
    // Dynamic expansion based on content
    this.bindDynamicExpansion();
  }
  
  bindDynamicExpansion() {
    this.aiInput.addEventListener('input', () => {
      this.updateInputHeight();
    });
    
    this.aiInput.addEventListener('focus', () => {
      this.elements.wrapper.classList.add('expanded');
      this.aiInput.classList.add('expanded');
    });
    
    this.aiInput.addEventListener('blur', () => {
      if (!this.aiInput.value.trim()) {
        this.elements.wrapper.classList.remove('expanded');
        this.aiInput.classList.remove('expanded');
      }
    });
  }
  
  updateInputHeight() {
    const value = this.aiInput.value;
    const lineCount = value.split('\n').length;
    const hasContent = value.trim().length > 0;
    
    if (lineCount > 2 || hasContent) {
      this.elements.wrapper.classList.add('expanded');
      this.aiInput.classList.add('expanded');
    } else {
      this.elements.wrapper.classList.remove('expanded');
      this.aiInput.classList.remove('expanded');
    }
    
    // Auto-scroll to bottom when expanding
    if (lineCount > 3) {
      this.aiInput.scrollTop = this.aiInput.scrollHeight;
    }
  }
  
  // Missing navigation method
  navigateSuggestions(direction) {
    const suggestions = this.elements.suggestions.querySelectorAll('.ai-suggestion-item');
    if (suggestions.length === 0) return;
    
    let currentIndex = this.selectedSuggestionIndex || 0;
    currentIndex += direction;
    
    // Wrap around
    if (currentIndex < 0) currentIndex = suggestions.length - 1;
    if (currentIndex >= suggestions.length) currentIndex = 0;
    
    // Remove previous selection
    suggestions.forEach(item => item.classList.remove('selected'));
    
    // Add new selection
    suggestions[currentIndex].classList.add('selected');
    this.selectedSuggestion = suggestions[currentIndex];
    this.selectedSuggestionIndex = currentIndex;
  }

  // Missing suggestion action methods
  addTechnicalContext() {
    const currentValue = this.aiInput.value.trim();
    if (!currentValue) return;
    
    const technicalPrompt = `${currentValue}\n\nPlease provide a technical implementation with:\n- Specific code examples\n- Best practices\n- Error handling\n- Performance considerations`;
    
    this.aiInput.value = technicalPrompt;
    this.syncWithOriginalInput();
    this.showFeedback('Technical context added');
  }
  
  makeCreative() {
    const currentValue = this.aiInput.value.trim();
    if (!currentValue) return;
    
    const creativePrompt = `${currentValue}\n\nMake this creative and engaging with:\n- Unique perspectives\n- Innovative approaches\n- Creative examples\n- Out-of-the-box thinking`;
    
    this.aiInput.value = creativePrompt;
    this.syncWithOriginalInput();
    this.showFeedback('Creative enhancement applied');
  }
  
  optimizeClarity() {
    const currentValue = this.aiInput.value.trim();
    if (!currentValue) return;
    
    const clarityPrompt = `${currentValue}\n\nPlease make this clear and specific:\n- Use precise language\n- Provide concrete examples\n- Break down complex concepts\n- Ensure unambiguous instructions`;
    
    this.aiInput.value = clarityPrompt;
    this.syncWithOriginalInput();
    this.showFeedback('Clarity optimization applied');
  }
  
  showFeedback(message) {
    // Create temporary feedback element
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--liquid-gold);
      color: #000;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      z-index: 10000;
      animation: slideInFade 3s ease-out forwards;
      box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
    `;
    feedback.textContent = message;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 3000);
  }

  destroy() {
    // Clean up
    if (this.aiContainer) {
      this.aiContainer.remove();
    }
    if (this.originalInput) {
      this.originalInput.style.display = '';
    }
    this.isInitialized = false;
  }
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🤖 AI Input Integration: DOM ready, initializing...');
  
  // Force enable for now (can be controlled later)
  const enableAI = true; // localStorage.getItem('enableAIInput') !== 'false';
  
  if (enableAI) {
    console.log('🤖 AI Input Integration: Creating new instance...');
    try {
      window.aiInput = new AIInputIntegration({
        selector: '#input',
        formSelector: '#generate-form',
        enableSuggestions: true,
        enableThinking: true,
        maxLength: 5000
      });
      console.log('🤖 AI Input Integration: ✅ Successfully initialized!');
    } catch (error) {
      console.error('🤖 AI Input Integration: ❌ Initialization failed:', error);
    }
  } else {
    console.log('🤖 AI Input Integration: Disabled via localStorage');
  }
});

// Export for manual initialization
window.AIInputIntegration = AIInputIntegration; 