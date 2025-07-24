// Enhanced Interface JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const promptForm = document.getElementById('prompt-form');
    const promptInput = document.getElementById('prompt-input');
    const generateBtn = document.getElementById('generate-btn');
    const optionsBtn = document.getElementById('options-btn');
    const optionsPanel = document.getElementById('options-panel');
    
    // Rainbow border animation enhancement
    const rainbowContainer = document.querySelector('.rainbow-input-container');
    
    // Auto-resize textarea
    function autoResizeTextarea() {
        promptInput.style.height = 'auto';
        promptInput.style.height = promptInput.scrollHeight + 'px';
    }
    
    promptInput.addEventListener('input', autoResizeTextarea);
    
    // Form submission
    promptForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const promptValue = promptInput.value.trim();
        if (!promptValue) {
            showMessage('Please enter a prompt', 'error');
            return;
        }
        
        // Add loading state
        generateBtn.disabled = true;
        generateBtn.innerHTML = `
            <svg class="icon spinning" viewBox="0 0 24 24">
                <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
            </svg>
            Generating...
        `;
        
        // Simulate API call (replace with actual implementation)
        try {
            await simulateGeneration(promptValue);
            showMessage('Generation complete!', 'success');
        } catch (error) {
            showMessage('Generation failed. Please try again.', 'error');
        } finally {
            // Reset button state
            generateBtn.disabled = false;
            generateBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24">
                    <path d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M13.96,12.29L11.21,15.83L9.25,13.47L6.5,17H17.5L13.96,12.29Z"/>
                </svg>
                Generate
            `;
        }
    });
    
    // Options toggle
    optionsBtn.addEventListener('click', function() {
        const isVisible = optionsPanel.style.display !== 'none';
        
        if (isVisible) {
            hideOptions();
        } else {
            showOptions();
        }
    });
    
    // Show options panel
    function showOptions() {
        optionsPanel.style.display = 'block';
        optionsPanel.innerHTML = `
            <div class="options-content">
                <h3>Generation Options</h3>
                <div class="option-item">
                    <label for="model-select">Model:</label>
                    <select id="model-select" class="option-select">
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5">GPT-3.5</option>
                        <option value="claude">Claude</option>
                    </select>
                </div>
                <div class="option-item">
                    <label for="temperature">Temperature:</label>
                    <input type="range" id="temperature" min="0" max="2" step="0.1" value="0.7">
                    <span class="temperature-value">0.7</span>
                </div>
                <div class="option-item">
                    <label for="max-tokens">Max Tokens:</label>
                    <input type="number" id="max-tokens" value="150" min="50" max="2000">
                </div>
            </div>
        `;
        
        // Add temperature slider listener
        const tempSlider = document.getElementById('temperature');
        const tempValue = document.querySelector('.temperature-value');
        tempSlider.addEventListener('input', function() {
            tempValue.textContent = this.value;
        });
        
        // Animate panel appearance
        setTimeout(() => {
            optionsPanel.classList.add('show');
        }, 10);
    }
    
    // Hide options panel
    function hideOptions() {
        optionsPanel.classList.remove('show');
        setTimeout(() => {
            optionsPanel.style.display = 'none';
        }, 300);
    }
    
    // Simulate generation (replace with actual API call)
    async function simulateGeneration(prompt) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Generating with prompt:', prompt);
                displayResult(prompt);
                resolve();
            }, 2000);
        });
    }
    
    // Display result in third section
    function displayResult(prompt) {
        const thirdSection = document.getElementById('third-section');
        thirdSection.innerHTML = `
            <div class="result-container">
                <h2>Generated Result</h2>
                <div class="result-content">
                    <p><strong>Original Prompt:</strong> ${prompt}</p>
                    <p><strong>Enhanced Version:</strong> ${enhancePrompt(prompt)}</p>
                </div>
            </div>
        `;
        
        // Scroll to result
        thirdSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Simple prompt enhancement (example)
    function enhancePrompt(prompt) {
        const enhancements = [
            'with attention to detail',
            'in a professional manner',
            'considering best practices',
            'with creative flair'
        ];
        const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
        return `${prompt} ${randomEnhancement}`;
    }
    
    // Show message
    function showMessage(text, type) {
        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.textContent = text;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to generate
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            promptForm.dispatchEvent(new Event('submit'));
        }
        
        // Escape to close options
        if (e.key === 'Escape' && optionsPanel.style.display !== 'none') {
            hideOptions();
        }
    });
    
    // Enhanced rainbow effect on input
    let rainbowIntensity = 0;
    promptInput.addEventListener('input', function() {
        const textLength = this.value.length;
        rainbowIntensity = Math.min(textLength / 100, 1);
        
        if (rainbowIntensity > 0.1) {
            rainbowContainer.style.setProperty('--rainbow-intensity', rainbowIntensity);
            rainbowContainer.classList.add('active-typing');
        } else {
            rainbowContainer.classList.remove('active-typing');
        }
    });
});

// Add CSS for dynamic elements
const style = document.createElement('style');
style.textContent = `
    /* Spinning animation */
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .spinning {
        animation: spin 1s linear infinite;
    }
    
    /* Options panel */
    .options-panel {
        margin-top: 1rem;
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: var(--border-radius);
        border: 1px solid rgba(255, 255, 255, 0.1);
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s ease;
    }
    
    .options-panel.show {
        opacity: 1;
        transform: translateY(0);
    }
    
    .options-content h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: var(--text-primary);
    }
    
    .option-item {
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .option-item label {
        min-width: 120px;
        color: var(--text-secondary);
    }
    
    .option-select,
    .option-item input {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 0.5rem;
        color: var(--text-primary);
        transition: all 0.3s ease;
    }
    
    .option-select:focus,
    .option-item input:focus {
        outline: none;
        border-color: #667eea;
    }
    
    .temperature-value {
        min-width: 3ch;
        color: var(--text-secondary);
    }
    
    /* Message styles */
    .message {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        background: #333;
        color: white;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        z-index: 1000;
    }
    
    .message.show {
        opacity: 1;
        transform: translateX(0);
    }
    
    .message-success {
        background: #10b981;
    }
    
    .message-error {
        background: #ef4444;
    }
    
    /* Result container */
    .result-container {
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        padding: 2rem;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
    }
    
    .result-content {
        margin-top: 1rem;
    }
    
    .result-content p {
        margin-bottom: 1rem;
        line-height: 1.6;
    }
    
    .result-content strong {
        color: #667eea;
    }
    
    /* Active typing enhancement */
    .rainbow-input-container.active-typing::before {
        animation-duration: 2s;
        filter: blur(6px);
    }
`;
document.head.appendChild(style); 