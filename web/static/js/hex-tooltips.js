// HEX TOOLTIPS - Glass-like hover tooltips for hex nodes

(function() {
    'use strict';
    
    console.log('💎 Hex Tooltips initializing...');
    
    // Node descriptions for tooltips
    const NODE_INFO = {
        // Core nodes
        'hub': {
            title: 'Transmutation Core',
            phase: 'Central Hub',
            description: 'The alchemical nexus where all phases converge. Orchestrates the transformation of raw ideas into refined prompts.'
        },
        'input': {
            title: 'Input Gateway',
            phase: 'Entry Point',
            description: 'Where raw ideas enter the alchemical process. Your thoughts begin their transformation here.'
        },
        'output': {
            title: 'Output Portal',
            phase: 'Final Result',
            description: 'The culmination of the alchemical process. Your perfected prompt emerges here, ready for use.'
        },
        
        // Phase nodes
        'prima': {
            title: 'Prima Materia',
            phase: 'Phase 1',
            description: 'The first matter - breaks down your raw input into its essential components for analysis and understanding.'
        },
        'solutio': {
            title: 'Solutio',
            phase: 'Phase 2',
            description: 'The dissolution phase - refines and flows your ideas into natural, eloquent language patterns.'
        },
        'coagulatio': {
            title: 'Coagulatio',
            phase: 'Phase 3',
            description: 'The crystallization phase - solidifies your prompt into its final, optimized form.'
        },
        
        // Prima Materia processes
        'parse': {
            title: 'Parse Structure',
            phase: 'Prima Process',
            description: 'Analyzes the grammatical and logical structure of your input to understand intent.'
        },
        'extract': {
            title: 'Extract Essence',
            phase: 'Prima Process',
            description: 'Identifies and extracts the core concepts and key elements from your raw input.'
        },
        'validate': {
            title: 'Validate Input',
            phase: 'Prima Process',
            description: 'Ensures input quality and checks for completeness before transformation begins.'
        },
        
        // Solutio processes
        'refine': {
            title: 'Refine Language',
            phase: 'Solutio Process',
            description: 'Polishes rough edges and enhances clarity while maintaining your original intent.'
        },
        'enhance': {
            title: 'Enhance Flow',
            phase: 'Solutio Process',
            description: 'Improves the natural flow and readability of your prompt for better AI comprehension.'
        },
        'structure': {
            title: 'Structure Output',
            phase: 'Solutio Process',
            description: 'Organizes content into optimal format for maximum effectiveness with AI models.'
        },
        
        // Coagulatio processes
        'optimize': {
            title: 'Optimize Final',
            phase: 'Coagulatio Process',
            description: 'Fine-tunes every aspect for peak performance with your target AI model.'
        },
        'judge': {
            title: 'Quality Judge',
            phase: 'Coagulatio Process',
            description: 'Evaluates prompt quality against best practices and effectiveness metrics.'
        },
        'final': {
            title: 'Final Polish',
            phase: 'Coagulatio Process',
            description: 'Applies the finishing touches that transform good prompts into exceptional ones.'
        },
        
        // Provider nodes
        'openai': {
            title: 'OpenAI',
            phase: 'LLM Provider',
            description: 'GPT models provide sophisticated language understanding and generation capabilities.'
        },
        'anthropic': {
            title: 'Anthropic',
            phase: 'LLM Provider',
            description: 'Claude models offer nuanced reasoning and ethical consideration in prompt crafting.'
        },
        'google': {
            title: 'Google',
            phase: 'LLM Provider',
            description: 'Gemini models bring multimodal understanding and vast knowledge to the process.'
        },
        'ollama': {
            title: 'Ollama',
            phase: 'Local Provider',
            description: 'Local models ensure privacy and enable offline prompt generation capabilities.'
        }
    };
    
    // Create tooltip element
    function createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'hex-tooltip';
        tooltip.innerHTML = `
            <div class="hex-tooltip-arrow"></div>
            <div class="hex-tooltip-content">
                <div class="hex-tooltip-phase"></div>
                <div class="hex-tooltip-title"></div>
                <div class="hex-tooltip-description"></div>
            </div>
        `;
        document.body.appendChild(tooltip);
        return tooltip;
    }
    
    // Position tooltip near element
    function positionTooltip(tooltip, element) {
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // Calculate position above the hex (almost touching - 2px gap)
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 2; // Almost touching - just 2px gap
        
        // Adjust if tooltip goes off screen
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        
        // If too close to top, show below (almost touching)
        if (top < 10) {
            top = rect.bottom + 2; // Almost touching below - just 2px gap
            tooltip.classList.add('below');
        } else {
            tooltip.classList.remove('below');
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }
    
    // Show tooltip for node
    function showTooltip(tooltip, nodeId, element) {
        const info = NODE_INFO[nodeId];
        if (!info) return;
        
        // Update content
        tooltip.querySelector('.hex-tooltip-phase').textContent = info.phase;
        tooltip.querySelector('.hex-tooltip-title').textContent = info.title;
        tooltip.querySelector('.hex-tooltip-description').textContent = info.description;
        
        // Set phase data attribute for styling
        const phaseType = element.getAttribute('data-phase-type') || 'default';
        tooltip.setAttribute('data-phase', phaseType);
        
        // Position and show
        positionTooltip(tooltip, element);
        tooltip.classList.add('visible');
    }
    
    // Hide tooltip
    function hideTooltip(tooltip) {
        tooltip.classList.remove('visible');
    }
    
    // Add liquid metal gradients to SVG
    function addLiquidGradients() {
        const svg = document.getElementById('hex-flow-board');
        if (!svg) return;
        
        let defs = svg.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svg.insertBefore(defs, svg.firstChild);
        }
        
        // Define liquid metal gradients
        const gradients = [
            {
                id: 'liquid-prima',
                colors: [
                    { offset: '0%', color: '#ff6b6b', opacity: '0.2' },
                    { offset: '50%', color: '#ff8e8e', opacity: '0.15' },
                    { offset: '100%', color: '#ff6b6b', opacity: '0.1' }
                ]
            },
            {
                id: 'liquid-solutio',
                colors: [
                    { offset: '0%', color: '#4ecdc4', opacity: '0.2' },
                    { offset: '50%', color: '#6eddd5', opacity: '0.15' },
                    { offset: '100%', color: '#4ecdc4', opacity: '0.1' }
                ]
            },
            {
                id: 'liquid-coagulatio',
                colors: [
                    { offset: '0%', color: '#45b7d1', opacity: '0.2' },
                    { offset: '50%', color: '#65c7e1', opacity: '0.15' },
                    { offset: '100%', color: '#45b7d1', opacity: '0.1' }
                ]
            },
            {
                id: 'liquid-process',
                colors: [
                    { offset: '0%', color: '#a29bfe', opacity: '0.2' },
                    { offset: '50%', color: '#b2abff', opacity: '0.15' },
                    { offset: '100%', color: '#a29bfe', opacity: '0.1' }
                ]
            },
            {
                id: 'liquid-provider',
                colors: [
                    { offset: '0%', color: '#74b9ff', opacity: '0.2' },
                    { offset: '50%', color: '#84c4ff', opacity: '0.15' },
                    { offset: '100%', color: '#74b9ff', opacity: '0.1' }
                ]
            },
            {
                id: 'liquid-core',
                colors: [
                    { offset: '0%', color: '#ff6b35', opacity: '0.25' },
                    { offset: '50%', color: '#ff8555', opacity: '0.2' },
                    { offset: '100%', color: '#ff6b35', opacity: '0.15' }
                ]
            },
            {
                id: 'liquid-io',
                colors: [
                    { offset: '0%', color: '#ffd700', opacity: '0.25' },
                    { offset: '50%', color: '#ffe033', opacity: '0.2' },
                    { offset: '100%', color: '#ffd700', opacity: '0.15' }
                ]
            }
        ];
        
        gradients.forEach(grad => {
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
            gradient.setAttribute('id', grad.id);
            
            grad.colors.forEach(stop => {
                const stopEl = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stopEl.setAttribute('offset', stop.offset);
                stopEl.setAttribute('stop-color', stop.color);
                stopEl.setAttribute('stop-opacity', stop.opacity);
                gradient.appendChild(stopEl);
            });
            
            defs.appendChild(gradient);
        });
    }
    
    // Update hex nodes to be glass-like
    function updateHexNodes() {
        const nodes = document.querySelectorAll('.hex-node');
        
        nodes.forEach(node => {
            const nodeId = node.getAttribute('data-id');
            const nodeInfo = NODE_INFO[nodeId];
            if (!nodeInfo) return;
            
            // Add appropriate class based on node type
            if (['hub'].includes(nodeId)) {
                node.classList.add('core-node');
                node.setAttribute('data-phase-type', 'core');
            } else if (['input', 'output'].includes(nodeId)) {
                node.classList.add('io-node');
                node.setAttribute('data-phase-type', 'io');
            } else if (['prima', 'solutio', 'coagulatio'].includes(nodeId)) {
                node.classList.add(`phase-${nodeId}`);
                node.setAttribute('data-phase-type', nodeId);
            } else if (['parse', 'extract', 'validate', 'refine', 'enhance', 'structure', 'optimize', 'judge', 'final'].includes(nodeId)) {
                node.classList.add('process-node');
                node.setAttribute('data-phase-type', 'process');
            } else if (['openai', 'anthropic', 'google', 'ollama'].includes(nodeId)) {
                node.classList.add('provider-node');
                node.setAttribute('data-phase-type', 'provider');
            }
            
            // Find and update text elements
            const iconText = node.querySelector('.hex-node-icon');
            const titleText = node.querySelector('.hex-node-text');
            
            // If we have a title text element, hide it
            if (titleText) {
                titleText.style.display = 'none';
            }
            
            // If we have an icon element, make sure it's visible and centered
            if (iconText) {
                iconText.setAttribute('class', 'hex-icon hex-node-icon');
                iconText.setAttribute('y', '0');
                iconText.setAttribute('font-size', '24');
                iconText.style.display = 'block';
            }
            
            // Also check for any other text elements
            const allTexts = node.querySelectorAll('text');
            allTexts.forEach(text => {
                if (text.classList.contains('hex-node-icon') || text.classList.contains('hex-icon')) {
                    // This is the emoji, keep it visible
                    text.style.display = 'block';
                    text.setAttribute('font-size', '24');
                    text.setAttribute('y', '0');
                    text.setAttribute('dominant-baseline', 'middle');
                    text.setAttribute('text-anchor', 'middle');
                } else {
                    // This is title or other text, hide it
                    text.style.display = 'none';
                }
            });
        });
    }
    
    // Initialize tooltips
    function initTooltips() {
        const tooltip = createTooltip();
        let currentNode = null;
        
        // Add hover listeners to all hex nodes
        document.addEventListener('mouseover', function(e) {
            const hexNode = e.target.closest('.hex-node');
            if (hexNode && hexNode !== currentNode) {
                currentNode = hexNode;
                const nodeId = hexNode.getAttribute('data-id');
                if (nodeId) {
                    showTooltip(tooltip, nodeId, hexNode);
                }
            }
        });
        
        document.addEventListener('mouseout', function(e) {
            const hexNode = e.target.closest('.hex-node');
            if (hexNode && !hexNode.contains(e.relatedTarget)) {
                currentNode = null;
                hideTooltip(tooltip);
            }
        });
        
        // Hide tooltip on scroll
        window.addEventListener('scroll', function() {
            if (currentNode) {
                hideTooltip(tooltip);
                currentNode = null;
            }
        });
    }
    
    // Initialize when DOM is ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        // Wait for hex nodes to be created
        setTimeout(() => {
            addLiquidGradients();
            updateHexNodes();
            initTooltips();
            
            console.log('✅ Hex tooltips initialized!');
        }, 1500);
    }
    
    init();
    
})();