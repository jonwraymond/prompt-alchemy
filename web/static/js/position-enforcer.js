// Position Enforcer - Continuously ensures hexagons stay in correct positions
console.log('🔒 Position Enforcer initializing...');

class PositionEnforcer {
    constructor() {
        this.correctPositions = {
            // Central hub
            'hub': { x: 500, y: 350 },
            
            // Primary gateways at extreme ends
            'input': { x: 150, y: 350 },
            'output': { x: 850, y: 350 },
            
            // Main phases in strategic triangle
            'prima': { x: 350, y: 200 },
            'solutio': { x: 650, y: 200 },
            'coagulatio': { x: 500, y: 500 },
            
            // Process nodes around prima (northwest cluster)
            'parse': { x: 250, y: 150 },
            'extract': { x: 300, y: 100 },
            'validate': { x: 400, y: 100 },
            
            // Process nodes around solutio (northeast cluster)
            'refine': { x: 750, y: 150 },
            'flow': { x: 700, y: 100 },
            'finalize': { x: 600, y: 100 },
            
            // Process nodes around coagulatio (south cluster)
            'optimize': { x: 400, y: 580 },
            'judge': { x: 500, y: 620 },
            'database': { x: 600, y: 580 },
            
            // AI providers in outer ring - well spaced
            'openai': { x: 150, y: 150 },
            'anthropic': { x: 850, y: 150 },
            'google': { x: 150, y: 550 },
            'ollama': { x: 850, y: 550 },
            'grok': { x: 300, y: 600 },
            'openrouter': { x: 700, y: 600 }
        };
        
        this.enforcementActive = true;
        this.checkInterval = null;
        this.mutationObserver = null;
        
        this.init();
    }
    
    init() {
        // Start continuous enforcement
        this.startContinuousEnforcement();
        
        // Set up mutation observer
        this.setupMutationObserver();
        
        // Listen for DOM changes
        this.listenForDOMChanges();
        
        console.log('✅ Position Enforcer activated');
    }
    
    startContinuousEnforcement() {
        // Initial enforcement
        this.enforcePositions();
        
        // Continuous checking every 500ms
        this.checkInterval = setInterval(() => {
            if (this.enforcementActive) {
                this.enforcePositions(true); // silent mode
            }
        }, 500);
        
        console.log('🔄 Continuous position enforcement started');
    }
    
    setupMutationObserver() {
        const svg = document.getElementById('hex-flow-board');
        if (!svg) {
            console.warn('⚠️ SVG not found, retrying...');
            setTimeout(() => this.setupMutationObserver(), 1000);
            return;
        }
        
        // Watch for any changes to node transforms
        this.mutationObserver = new MutationObserver((mutations) => {
            let needsEnforcement = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'transform') {
                    const node = mutation.target;
                    const nodeId = node.getAttribute('data-id');
                    
                    if (nodeId && this.correctPositions[nodeId]) {
                        const currentTransform = node.getAttribute('transform');
                        const expectedTransform = `translate(${this.correctPositions[nodeId].x}, ${this.correctPositions[nodeId].y})`;
                        
                        if (currentTransform !== expectedTransform) {
                            needsEnforcement = true;
                        }
                    }
                }
            });
            
            if (needsEnforcement) {
                console.log('⚠️ Incorrect position detected, enforcing...');
                this.enforcePositions();
            }
        });
        
        this.mutationObserver.observe(svg, {
            attributes: true,
            attributeFilter: ['transform'],
            subtree: true
        });
        
        console.log('👁️ Mutation observer active');
    }
    
    listenForDOMChanges() {
        // Listen for HTMX events
        document.addEventListener('htmx:afterSwap', () => {
            console.log('📡 HTMX swap detected, enforcing positions...');
            setTimeout(() => this.enforcePositions(), 100);
        });
        
        document.addEventListener('htmx:afterSettle', () => {
            console.log('📡 HTMX settle detected, enforcing positions...');
            this.enforcePositions();
        });
        
        // Listen for custom events
        document.addEventListener('hexNodesUpdated', () => {
            console.log('🔄 Hex nodes updated, enforcing positions...');
            this.enforcePositions();
        });
    }
    
    enforcePositions(silent = false) {
        let correctedCount = 0;
        
        Object.entries(this.correctPositions).forEach(([nodeId, position]) => {
            const node = document.querySelector(`[data-id="${nodeId}"]`);
            
            if (node) {
                const currentTransform = node.getAttribute('transform');
                const expectedTransform = `translate(${position.x}, ${position.y})`;
                
                if (currentTransform !== expectedTransform) {
                    node.setAttribute('transform', expectedTransform);
                    correctedCount++;
                    
                    if (!silent) {
                        console.log(`✅ Corrected position for ${nodeId}`);
                    }
                }
            }
        });
        
        if (correctedCount > 0 && !silent) {
            console.log(`✅ Corrected ${correctedCount} node positions`);
            
            // Update connections if available
            if (window.hexFlow && window.hexFlow.updateConnections) {
                window.hexFlow.updateConnections();
            }
        }
        
        return correctedCount;
    }
    
    // Force immediate position correction
    forceEnforce() {
        console.log('🔨 Force enforcing all positions...');
        const corrected = this.enforcePositions();
        
        // Also clear any SVG transforms
        const svg = document.getElementById('hex-flow-board');
        if (svg) {
            svg.style.transform = '';
            svg.style.transformOrigin = '';
        }
        
        console.log(`✅ Force enforcement complete: ${corrected} positions corrected`);
    }
    
    // Temporarily disable enforcement
    pause() {
        this.enforcementActive = false;
        console.log('⏸️ Position enforcement paused');
    }
    
    // Resume enforcement
    resume() {
        this.enforcementActive = true;
        this.enforcePositions();
        console.log('▶️ Position enforcement resumed');
    }
    
    // Get enforcement status
    getStatus() {
        const status = {
            active: this.enforcementActive,
            positions: {}
        };
        
        Object.entries(this.correctPositions).forEach(([nodeId, expectedPos]) => {
            const node = document.querySelector(`[data-id="${nodeId}"]`);
            
            if (node) {
                const transform = node.getAttribute('transform');
                const match = transform ? transform.match(/translate\(([^,]+),\s*([^)]+)\)/) : null;
                
                if (match) {
                    const currentX = parseFloat(match[1]);
                    const currentY = parseFloat(match[2]);
                    const isCorrect = Math.abs(currentX - expectedPos.x) < 0.1 && 
                                     Math.abs(currentY - expectedPos.y) < 0.1;
                    
                    status.positions[nodeId] = {
                        current: { x: currentX, y: currentY },
                        expected: expectedPos,
                        correct: isCorrect
                    };
                }
            } else {
                status.positions[nodeId] = {
                    current: null,
                    expected: expectedPos,
                    correct: false,
                    missing: true
                };
            }
        });
        
        return status;
    }
    
    // Clean up
    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        console.log('🗑️ Position Enforcer destroyed');
    }
}

// Initialize the enforcer
window.positionEnforcer = new PositionEnforcer();

// Expose control functions
window.enforcePositions = {
    force: () => window.positionEnforcer.forceEnforce(),
    pause: () => window.positionEnforcer.pause(),
    resume: () => window.positionEnforcer.resume(),
    status: () => window.positionEnforcer.getStatus(),
    destroy: () => window.positionEnforcer.destroy()
};

console.log('🎮 Position Enforcer Controls:');
console.log('  enforcePositions.force() - Force immediate position correction');
console.log('  enforcePositions.pause() - Temporarily disable enforcement');
console.log('  enforcePositions.resume() - Resume enforcement');
console.log('  enforcePositions.status() - Get current status');

// Extra enforcement on page load
window.addEventListener('load', () => {
    console.log('📄 Page loaded, enforcing positions...');
    window.positionEnforcer.forceEnforce();
});

// Extra enforcement after a delay
setTimeout(() => {
    console.log('⏱️ Delayed enforcement check...');
    window.positionEnforcer.forceEnforce();
}, 3000);