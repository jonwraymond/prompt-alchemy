// Unified Premium Tooltip System - Diablo-inspired liquid metal/glass aesthetic
// Consolidates all tooltips into a single, premium experience

class UnifiedPremiumTooltip {
    constructor() {
        this.tooltip = null;
        this.currentTarget = null;
        this.hideTimeout = null;
        this.nodeDescriptions = this.loadNodeDescriptions();
        this.init();
    }
    
    loadNodeDescriptions() {
        return {
            // Core nodes
            'hub': {
                title: 'Transmutation Core',
                phase: 'Central Nexus',
                type: 'Core System',
                description: 'The alchemical heart where all transformations converge',
                technical: 'Orchestrates the three-phase prompt refinement process',
                icon: '🔥',
                rarity: 'legendary'
            },
            'input': {
                title: 'Input Gateway',
                phase: 'Origin Point',
                type: 'Entry Portal',
                description: 'Where raw ideas cross the threshold into transformation',
                technical: 'Accepts and validates initial prompt input',
                icon: '⚡',
                rarity: 'rare'
            },
            'output': {
                title: 'Output Portal',
                phase: 'Completion',
                type: 'Exit Gateway',
                description: 'The culmination point where perfected prompts emerge',
                technical: 'Delivers optimized results with quality metrics',
                icon: '✨',
                rarity: 'epic'
            },
            
            // Phase nodes
            'prima': {
                title: 'Prima Materia',
                phase: 'Phase I',
                type: 'Decomposition',
                description: 'Breaks down raw input into fundamental components',
                technical: 'Structural analysis and concept extraction',
                icon: '🔬',
                rarity: 'rare'
            },
            'solutio': {
                title: 'Solutio',
                phase: 'Phase II',
                type: 'Dissolution',
                description: 'Dissolves and refines ideas into flowing language',
                technical: 'Natural language enhancement and flow optimization',
                icon: '💧',
                rarity: 'rare'
            },
            'coagulatio': {
                title: 'Coagulatio',
                phase: 'Phase III',
                type: 'Crystallization',
                description: 'Solidifies the refined essence into final form',
                technical: 'Final optimization and quality assurance',
                icon: '💎',
                rarity: 'rare'
            },
            
            // Process nodes
            'parse': {
                title: 'Parse Structure',
                phase: 'Prima Sub-Process',
                type: 'Analyzer',
                description: 'Deconstructs grammatical and logical patterns',
                technical: 'AST generation and syntax analysis',
                icon: '🔍',
                rarity: 'common'
            },
            'extract': {
                title: 'Extract Essence',
                phase: 'Prima Sub-Process',
                type: 'Extractor',
                description: 'Identifies core concepts and key elements',
                technical: 'Semantic extraction and concept mapping',
                icon: '💡',
                rarity: 'common'
            },
            'flow': {
                title: 'Language Flow',
                phase: 'Solutio Sub-Process',
                type: 'Transformer',
                description: 'Transforms into natural, flowing expression',
                technical: 'Applies linguistic flow patterns',
                icon: '🌊',
                rarity: 'common'
            },
            'refine': {
                title: 'Refine Style',
                phase: 'Solutio Sub-Process',
                type: 'Refiner',
                description: 'Polishes and enhances clarity',
                technical: 'Style transfer and clarity optimization',
                icon: '✨',
                rarity: 'common'
            },
            'validate': {
                title: 'Quality Check',
                phase: 'Coagulatio Sub-Process',
                type: 'Validator',
                description: 'Ensures output meets quality standards',
                technical: 'Runs quality metrics and validation rules',
                icon: '✅',
                rarity: 'common'
            },
            'finalize': {
                title: 'Final Polish',
                phase: 'Coagulatio Sub-Process',
                type: 'Finalizer',
                description: 'Applies finishing touches for perfection',
                technical: 'Final adjustments and formatting',
                icon: '📋',
                rarity: 'common'
            },
            
            // Providers
            'openai': {
                title: 'OpenAI',
                phase: 'Provider',
                type: 'LLM Engine',
                description: 'GPT models for sophisticated generation',
                technical: 'GPT-4, GPT-3.5 API integration',
                icon: '🤖',
                rarity: 'uncommon'
            },
            'anthropic': {
                title: 'Anthropic',
                phase: 'Provider',
                type: 'LLM Engine',
                description: 'Claude for nuanced reasoning',
                technical: 'Claude 3 Opus, Sonnet, Haiku models',
                icon: '📚',
                rarity: 'uncommon'
            },
            'google': {
                title: 'Google',
                phase: 'Provider',
                type: 'LLM Engine',
                description: 'Gemini for multimodal understanding',
                technical: 'Gemini Pro and Ultra models',
                icon: '✨',
                rarity: 'uncommon'
            },
            
            // Features
            'optimize': {
                title: 'Multi-Phase Optimizer',
                phase: 'Enhancement',
                type: 'Optimizer',
                description: 'Advanced optimization across all phases',
                technical: 'Iterative refinement with quality scoring',
                icon: '🔧',
                rarity: 'epic'
            },
            'judge': {
                title: 'AI Judge',
                phase: 'Evaluation',
                type: 'Assessor',
                description: 'Quality assessment and scoring system',
                technical: 'ML-based quality evaluation metrics',
                icon: '⚖️',
                rarity: 'epic'
            },
            'database': {
                title: 'Vector Storage',
                phase: 'Persistence',
                type: 'Database',
                description: 'Stores and retrieves similar prompts',
                technical: 'SQLite with vector embeddings',
                icon: '💾',
                rarity: 'uncommon'
            }
        };
    }
    
    init() {
        // Remove any existing tooltips first
        this.removeExistingTooltips();
        
        // Create our premium tooltip
        this.createTooltip();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('⚔️ Unified Premium Tooltip System initialized');
    }
    
    removeExistingTooltips() {
        // Remove all existing tooltip elements
        document.querySelectorAll('.hex-tooltip, .tooltip, [id*="tooltip"]').forEach(el => {
            if (el !== this.tooltip) {
                el.remove();
            }
        });
        
        // Disable the old tooltip system in UnifiedHexFlow
        if (window.unifiedHexFlow) {
            window.unifiedHexFlow.showTooltip = () => {};
            window.unifiedHexFlow.hideTooltip = () => {};
            window.unifiedHexFlow.tooltip = null;
        }
    }
    
    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'premium-tooltip';
        this.tooltip.innerHTML = `
            <div class="premium-tooltip-glow"></div>
            <div class="premium-tooltip-border"></div>
            <div class="premium-tooltip-glass">
                <div class="premium-tooltip-header">
                    <span class="premium-tooltip-icon"></span>
                    <span class="premium-tooltip-title"></span>
                    <span class="premium-tooltip-rarity"></span>
                </div>
                <div class="premium-tooltip-phase"></div>
                <div class="premium-tooltip-type"></div>
                <div class="premium-tooltip-divider"></div>
                <div class="premium-tooltip-description"></div>
                <div class="premium-tooltip-technical"></div>
                <div class="premium-tooltip-footer">
                    <div class="premium-tooltip-particle"></div>
                    <div class="premium-tooltip-particle"></div>
                    <div class="premium-tooltip-particle"></div>
                </div>
            </div>
        `;
        document.body.appendChild(this.tooltip);
    }
    
    setupEventListeners() {
        // Use delegation for better performance
        document.addEventListener('mouseover', this.handleMouseOver.bind(this), true);
        document.addEventListener('mouseout', this.handleMouseOut.bind(this), true);
        document.addEventListener('mousemove', this.handleMouseMove.bind(this), true);
        
        // Hide on scroll
        window.addEventListener('scroll', () => {
            this.hide();
        }, { passive: true });
    }
    
    handleMouseOver(e) {
        const hexNode = e.target.closest('.hex-node');
        if (!hexNode || hexNode === this.currentTarget) return;
        
        // Clear any hide timeout
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        
        this.currentTarget = hexNode;
        const nodeId = hexNode.getAttribute('data-id');
        
        if (nodeId && this.nodeDescriptions[nodeId]) {
            this.show(nodeId, hexNode);
        }
    }
    
    handleMouseOut(e) {
        const hexNode = e.target.closest('.hex-node');
        if (!hexNode) return;
        
        // Check if we're still within the same hex node
        if (e.relatedTarget && hexNode.contains(e.relatedTarget)) return;
        
        // Add a small delay before hiding to prevent flickering
        this.hideTimeout = setTimeout(() => {
            this.hide();
            this.currentTarget = null;
        }, 100);
    }
    
    handleMouseMove(e) {
        if (this.currentTarget && this.tooltip.classList.contains('visible')) {
            this.updatePosition(e.clientX, e.clientY);
        }
    }
    
    show(nodeId, element) {
        const data = this.nodeDescriptions[nodeId];
        if (!data) return;
        
        // Update content
        this.tooltip.querySelector('.premium-tooltip-icon').textContent = data.icon || '⬡';
        this.tooltip.querySelector('.premium-tooltip-title').textContent = data.title;
        this.tooltip.querySelector('.premium-tooltip-phase').textContent = data.phase;
        this.tooltip.querySelector('.premium-tooltip-type').textContent = data.type;
        this.tooltip.querySelector('.premium-tooltip-description').textContent = data.description;
        this.tooltip.querySelector('.premium-tooltip-technical').textContent = data.technical;
        
        // Set rarity class
        this.tooltip.setAttribute('data-rarity', data.rarity || 'common');
        this.tooltip.querySelector('.premium-tooltip-rarity').textContent = 
            data.rarity ? data.rarity.toUpperCase() : '';
        
        // Set phase type for styling
        const phaseType = element.getAttribute('data-phase-type') || 'default';
        this.tooltip.setAttribute('data-phase', phaseType);
        
        // Position and show
        const rect = element.getBoundingClientRect();
        this.updatePosition(rect.left + rect.width / 2, rect.top);
        
        // Add visible class with animation
        requestAnimationFrame(() => {
            this.tooltip.classList.add('visible');
        });
    }
    
    hide() {
        this.tooltip.classList.remove('visible');
    }
    
    updatePosition(mouseX, mouseY) {
        const padding = 2; // Almost touching - just 2px gap
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate optimal position
        let x = mouseX - tooltipRect.width / 2;
        let y = mouseY - tooltipRect.height - padding;
        
        // Adjust if going off screen horizontally
        if (x < padding) {
            x = padding;
        } else if (x + tooltipRect.width > viewportWidth - padding) {
            x = viewportWidth - tooltipRect.width - padding;
        }
        
        // If too close to top, show below
        if (y < padding) {
            y = mouseY + 40 + padding; // Account for hex size
            this.tooltip.classList.add('below');
        } else {
            this.tooltip.classList.remove('below');
        }
        
        // Apply position
        this.tooltip.style.transform = `translate(${x}px, ${y}px)`;
    }
}

// Initialize the unified system
document.addEventListener('DOMContentLoaded', () => {
    window.unifiedPremiumTooltip = new UnifiedPremiumTooltip();
});

// Also initialize if DOM is already loaded
if (document.readyState !== 'loading') {
    window.unifiedPremiumTooltip = new UnifiedPremiumTooltip();
}