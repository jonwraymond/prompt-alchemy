// React AI Input Component - Standalone Browser Version
// Compatible with CDN React and ReactDOM

(function() {
  'use strict';

  const { useState, useRef, useEffect, useCallback } = React;
  const { createRoot } = ReactDOM;

  // AI Input Component
  function AIInputComponent({ 
    value: initialValue = '', 
    onSubmit = () => {},
    onValueChange = () => {},
    placeholder = 'Describe what you want to create...',
    maxLength = 5000,
    enableSuggestions = true,
    enableThinking = true 
  }) {
    // State management
    const [value, setValue] = useState(initialValue);
    const [isLoading, setIsLoading] = useState(false);
    
    // Refs
    const textareaRef = useRef(null);

    // Handle textarea auto-resize
    const adjustTextareaHeight = useCallback(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const scrollHeight = textareaRef.current.scrollHeight;
        const newHeight = Math.min(Math.max(scrollHeight, 60), 200);
        textareaRef.current.style.height = newHeight + 'px';
      }
    }, []);

    // Effects
    useEffect(() => {
      adjustTextareaHeight();
    }, [value, adjustTextareaHeight]);

    useEffect(() => {
      onValueChange(value);
    }, [value, onValueChange]);

    // Event handlers
    const handleInputChange = (e) => {
      setValue(e.target.value);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!value.trim() || isLoading) return;

      setIsLoading(true);
      try {
        await onSubmit(value);
      } finally {
        setIsLoading(false);
      }
    };

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    return React.createElement('form', {
      key: 'form',
      onSubmit: handleSubmit,
      className: 'htmx-fade',
      style: { background: 'none', border: 'none', boxShadow: 'none', padding: 0, margin: 0 }
    }, [
      React.createElement('textarea', {
        key: 'textarea',
        ref: textareaRef,
        id: 'input',
        name: 'input',
        required: true,
        className: 'clean-input',
        placeholder: placeholder,
        rows: 3,
        value: value,
        onChange: handleInputChange,
        onKeyDown: handleKeyDown,
        disabled: isLoading
      }),
      React.createElement('div', {
        key: 'controls',
        className: 'horizontal-controls'
      }, [
        React.createElement('button', {
          key: 'submit-btn',
          type: 'submit',
          className: 'generate-btn',
          title: 'Generate (Enter)',
          id: 'central-send',
          disabled: isLoading || !value.trim()
        }, [
          React.createElement('svg', {
            key: 'submit-icon',
            className: 'btn-icon',
            fill: 'currentColor',
            viewBox: '0 0 24 24'
          }, React.createElement('path', { d: 'M2,21L23,12L2,3V10L17,12L2,14V21Z' })),
          isLoading ? ' Generating...' : ' Generate'
        ]),
        React.createElement('button', {
          key: 'config-btn',
          type: 'button',
          className: 'config-btn',
          onClick: (e) => { e.stopPropagation(); window.toggleFloatingOptions && window.toggleFloatingOptions() },
          title: 'Configuration'
        }, [
          React.createElement('svg', {
            key: 'config-icon',
            className: 'btn-icon',
            fill: 'currentColor',
            viewBox: '0 0 24 24'
          }, React.createElement('path', { d: 'M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l1.86-1.41c.17-.13.22-.36.12-.55l-1.76-3.03a.448.448 0 0 0-.52-.22l-2.19.91c-.46-.35-.97-.62-1.51-.84L16.06 2.5c-.03-.23-.21-.4-.45-.4h-3.52c-.24 0-.42.17-.45.4L11.27 4.95c-.54.22-1.05.49-1.51.84l-2.19-.91c-.23-.09-.49 0-.52-.22L5.29 8.13c-.1.19-.05.42.12.55L7.27 10.09c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-1.86 1.41c-.17.13-.22-.36-.12-.55l1.76 3.03c.12.22.29.28.52.22l2.19-.91c.46.35.97.62 1.51.84l.37 1.95c.03.23.21.4.45.4h3.52c.24 0 .42-.17-.45.4l.37-1.95c.54-.22 1.05-.49 1.51-.84l2.19.91c.23.09.49 0 .52-.22l1.76-3.03c.1-.19.05-.42-.12-.55l-1.86-1.41Z' })),
          ' Options'
        ])
      ])
    ]);
  }

  // Initialize React component when DOM is ready
  function initializeReactAIInput() {
    // Find the target container
    const targetContainer = document.getElementById('react-ai-input-root');
    if (!targetContainer) {
      console.warn('React AI Input: Container #react-ai-input-root not found');
      return;
    }

    // Find the original form to integrate with
    const originalForm = document.getElementById('generate-form');
    const originalInput = document.getElementById('input');

    if (!originalForm || !originalInput) {
      console.warn('React AI Input: Original form or input not found');
      return;
    }

    // Handle form submission
    const handleSubmit = async (value) => {
      console.log('🚀 React AI Input: Form submission', { value });
      
      // Update the original input value
      originalInput.value = value;
      
      // Trigger the original form submission
      originalForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    };

    // Handle value changes
    const handleValueChange = (value) => {
      // Sync with original input
      originalInput.value = value;
      
      // Trigger input event for any listeners
      originalInput.dispatchEvent(new Event('input', { bubbles: true }));
    };

    // Get initial value from original input
    const initialValue = originalInput.value || '';

    // Create React root and render component
    const root = createRoot(targetContainer);
    root.render(React.createElement(AIInputComponent, {
      value: initialValue,
      onSubmit: handleSubmit,
      onValueChange: handleValueChange,
      placeholder: originalInput.placeholder || 'Describe what you want to create...',
      maxLength: parseInt(originalInput.getAttribute('maxlength')) || 5000
    }));

    // Hide the original input
    originalInput.style.display = 'none';
    
    console.log('✅ React AI Input: Successfully initialized');
  }

  // Export to global scope
  window.AIInputComponent = AIInputComponent;
  window.initializeReactAIInput = initializeReactAIInput;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeReactAIInput);
  } else {
    // DOM is already ready
    setTimeout(initializeReactAIInput, 100);
  }

})();