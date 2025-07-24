// Hex Position Manager - Production-ready positioning system
(function() {
    'use strict';
    
    // Optimal grid positions for 1000x700 viewBox
    const GRID_POSITIONS = {
        // Central hub
        'hub': { x: 500, y: 350 },
        
        // Primary gateways
        'input': { x: 150, y: 350 },
        'output': { x: 850, y: 350 },
        
        // Main phases
        'prima': { x: 350, y: 200 },
        'solutio': { x: 650, y: 200 },
        'coagulatio': { x: 500, y: 500 },
        
        // Process nodes - Prima cluster
        'parse': { x: 250, y: 150 },
        'extract': { x: 300, y: 100 },
        'validate': { x: 400, y: 100 },
        
        // Process nodes - Solutio cluster
        'refine': { x: 750, y: 150 },
        'flow': { x: 700, y: 100 },
        'finalize': { x: 600, y: 100 },
        
        // Process nodes - Coagulatio cluster
        'optimize': { x: 400, y: 580 },
        'judge': { x: 500, y: 620 },
        'database': { x: 600, y: 580 },
        
        // AI providers
        'openai': { x: 150, y: 150 },
        'anthropic': { x: 850, y: 150 },
        'google': { x: 150, y: 550 },
        'ollama': { x: 850, y: 550 },
        'grok': { x: 300, y: 600 },
        'openrouter': { x: 700, y: 600 }
    };
    
    class HexPositionManager {
        constructor() {
            this.positions = GRID_POSITIONS;
            this.initialized = false;
            this.init();
        }
        
        init() {
            // Override UnifiedHexFlow positioning
            this.patchUnifiedHexFlow();
            
            // Set up position enforcement
            this.setupEnforcement();
            
            this.initialized = true;
        }
        
        patchUnifiedHexFlow() {
            // Wait for UnifiedHexFlow to be available
            const checkAndPatch = () => {
                if (typeof UnifiedHexFlow !== 'undefined') {
                    // Override the radial layout method
                    UnifiedHexFlow.prototype.generateRadialLayout = this.generateGridLayout.bind(this);
                    return true;
                }
                return false;
            };
            
            if (!checkAndPatch()) {
                // Try again after a short delay
                setTimeout(() => checkAndPatch(), 100);
            }
        }
        
        generateGridLayout() {
            // Return grid-based positions instead of radial
            const nodeDefinitions = [];
            
            Object.entries(this.positions).forEach(([id, pos]) => {
                nodeDefinitions.push({
                    id: id,
                    x: pos.x,
                    y: pos.y,
                    title: this.getNodeTitle(id),
                    icon: this.getNodeIcon(id),
                    color: this.getNodeColor(id),
                    type: this.getNodeType(id)
                });
            });
            
            return nodeDefinitions;
        }
        
        setupEnforcement() {
            // Monitor and correct positions
            const enforce = () => {
                const nodes = document.querySelectorAll('.hex-node[data-id]');
                
                nodes.forEach(node => {
                    const nodeId = node.getAttribute('data-id');
                    const position = this.positions[nodeId];
                    
                    if (position) {
                        const expectedTransform = `translate(${position.x}, ${position.y})`;
                        const currentTransform = node.getAttribute('transform');
                        
                        if (currentTransform !== expectedTransform) {
                            node.setAttribute('transform', expectedTransform);
                        }
                    }
                });
            };
            
            // Initial enforcement
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', enforce);
            } else {
                setTimeout(enforce, 100);
            }
            
            // Periodic enforcement
            setInterval(enforce, 1000);
            
            // Intercept setAttribute to prevent unwanted changes
            const originalSetAttribute = Element.prototype.setAttribute;
            Element.prototype.setAttribute = function(name, value) {
                if (name === 'transform' && this.classList.contains('hex-node')) {
                    const nodeId = this.getAttribute('data-id');
                    const position = GRID_POSITIONS[nodeId];
                    
                    if (position) {
                        value = `translate(${position.x}, ${position.y})`;
                    }
                }
                return originalSetAttribute.call(this, name, value);
            };
        }
        
        // Helper methods for node properties
        getNodeTitle(id) {
            const titles = {
                'hub': 'Transmutation Core',
                'input': 'Input Gateway',
                'output': 'Output Portal',
                'prima': 'Prima Materia',
                'solutio': 'Solutio',
                'coagulatio': 'Coagulatio',
                'parse': 'Parse',
                'extract': 'Extract',
                'validate': 'Validate',
                'refine': 'Refine',
                'flow': 'Flow',
                'finalize': 'Finalize',
                'optimize': 'Optimize',
                'judge': 'Judge',
                'database': 'Database',
                'openai': 'OpenAI',
                'anthropic': 'Anthropic',
                'google': 'Google',
                'ollama': 'Ollama',
                'grok': 'Grok',
                'openrouter': 'OpenRouter'
            };
            return titles[id] || id;
        }
        
        getNodeIcon(id) {
            const icons = {
                'hub': '⚛',
                'input': '📥',
                'output': '✨',
                'prima': '🔬',
                'solutio': '💧',
                'coagulatio': '💎',
                'parse': '📝',
                'extract': '⚗️',
                'validate': '✓',
                'refine': '🔄',
                'flow': '〰',
                'finalize': '🎯',
                'optimize': '⚡',
                'judge': '⚖️',
                'database': '💾',
                'openai': '🤖',
                'anthropic': '🔷',
                'google': '🔵',
                'ollama': '🦙',
                'grok': '🚀',
                'openrouter': '🌐'
            };
            return icons[id] || '🔷';
        }
        
        getNodeColor(id) {
            const colors = {
                'hub': '#ff6b35',
                'input': '#00ff88',
                'output': '#ffd700',
                'prima': '#ff6b6b',
                'solutio': '#4ecdc4',
                'coagulatio': '#45b7d1',
                'parse': '#95a5a6',
                'extract': '#95a5a6',
                'validate': '#95a5a6',
                'refine': '#95a5a6',
                'flow': '#95a5a6',
                'finalize': '#95a5a6',
                'optimize': '#95a5a6',
                'judge': '#95a5a6',
                'database': '#95a5a6',
                'openai': '#10a37f',
                'anthropic': '#7c3aed',
                'google': '#4285f4',
                'ollama': '#000000',
                'grok': '#1d9bf0',
                'openrouter': '#6366f1'
            };
            return colors[id] || '#00ff88';
        }
        
        getNodeType(id) {
            if (id === 'hub') return 'core';
            if (id === 'input' || id === 'output') return 'gateway';
            if (['prima', 'solutio', 'coagulatio'].includes(id)) return 'phase';
            if (['openai', 'anthropic', 'google', 'ollama', 'grok', 'openrouter'].includes(id)) return 'provider';
            return 'process';
        }
    }
    
    // Initialize the position manager
    window.hexPositionManager = new HexPositionManager();
})();