// Hexagon Position Stabilizer - Ensures hexagons stay in correct positions during generate process
console.log('🔧 Hexagon Position Stabilizer initializing...');

class HexagonPositionStabilizer {
    constructor() {
        this.correctPositions = new Map();
        this.positionObserver = null;
        this.stabilizationActive = false;
        this.init();
    }
    
    init() {
        this.defineCorrectPositions();
        this.setupPositionMonitoring();
        this.interceptGenerateProcess();
        console.log('✅ Hexagon Position Stabilizer initialized');
    }
    
    defineCorrectPositions() {
        // Define the correct positions for all hexagon nodes
        // These correspond to a 1000x700 viewBox layout
        const positions = {
            // Core node at center
            'hub': { x: 500, y: 350 },
            
            // Main phases in strategic positions
            'prima': { x: 360, y: 250 },      // Top-left
            'solutio': { x: 640, y: 250 },    // Top-right  
            'coagulatio': { x: 500, y: 480 }, // Bottom center
            
            // Input/Output gateways at ends
            'input': { x: 180, y: 350 },      // Far left
            'output': { x: 820, y: 350 },     // Far right
            
            // Process nodes around prima (left cluster)
            'parse': { x: 280, y: 180 },
            'extract': { x: 320, y: 120 },
            'validate': { x: 400, y: 120 },
            
            // Process nodes around solutio (right cluster)
            'refine': { x: 720, y: 180 },
            'flow': { x: 680, y: 120 },
            'finalize': { x: 600, y: 120 },
            
            // Process nodes around coagulatio (bottom cluster)
            'optimize': { x: 420, y: 560 },
            'judge': { x: 500, y: 600 },
            'database': { x: 580, y: 560 },
            
            // Provider nodes in outer ring
            'openai': { x: 200, y: 200 },
            'anthropic': { x: 800, y: 200 },
            'google': { x: 200, y: 500 },
            'ollama': { x: 800, y: 500 },
            'grok': { x: 350, y: 600 },
            'openrouter': { x: 650, y: 600 }
        };
        
        // Store in map for quick lookup
        Object.entries(positions).forEach(([nodeId, pos]) => {
            this.correctPositions.set(nodeId, pos);
        });
        
        console.log(`📍 Defined ${this.correctPositions.size} correct positions`);
    }
    
    setupPositionMonitoring() {
        // Use MutationObserver to watch for position changes
        const svg = document.getElementById('hex-flow-board');
        if (!svg) return;
        
        this.positionObserver = new MutationObserver((mutations) => {
            if (!this.stabilizationActive) return;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'transform') {
                    const node = mutation.target;
                    const nodeId = node.getAttribute('data-id');
                    
                    if (nodeId && this.correctPositions.has(nodeId)) {
                        this.checkAndStabilizePosition(node, nodeId);
                    }
                }
            });
        });
        
        this.positionObserver.observe(svg, {
            attributes: true,
            attributeFilter: ['transform'],
            subtree: true
        });
        
        console.log('👁️ Position monitoring active');
    }
    
    interceptGenerateProcess() {
        // Intercept form submission to stabilize positions
        const generateForm = document.getElementById('generate-form');
        if (generateForm) {
            generateForm.addEventListener('submit', (e) => {
                console.log('🎯 Generate process detected - activating position stabilization');
                this.activateStabilization();
            });
        }
        
        // Also listen for HTMX events
        document.addEventListener('htmx:beforeRequest', () => {
            console.log('📡 HTMX request detected - ensuring stable positions');
            this.stabilizeAllPositions();
        });
        
        document.addEventListener('htmx:afterRequest', () => {
            console.log('📡 HTMX request completed - maintaining stability');
            setTimeout(() => this.stabilizeAllPositions(), 100);
        });
    }
    
    activateStabilization() {
        console.log('🔒 Activating position stabilization...');
        
        this.stabilizationActive = true;
        
        // Immediately fix all positions
        this.stabilizeAllPositions();
        
        // Prevent any zoom or transform operations on the SVG
        this.preventSVGTransforms();
        
        // Keep stabilization active for the duration of the process
        setTimeout(() => {
            this.stabilizationActive = false;
            console.log('🔓 Position stabilization deactivated');
        }, 30000); // 30 seconds should be enough for the process
    }
    
    preventSVGTransforms() {
        const svg = document.getElementById('hex-flow-board');
        if (!svg) return;
        
        // Clear any existing transforms
        svg.style.transform = '';
        svg.style.transformOrigin = '';
        
        // Add event listeners to prevent zoom/pan during process
        const preventTransform = (e) => {
            if (this.stabilizationActive) {
                e.preventDefault();
                e.stopPropagation();
                
                // Reset transform immediately if someone tries to change it
                svg.style.transform = '';
                svg.style.transformOrigin = '';
            }
        };
        
        svg.addEventListener('wheel', preventTransform, { passive: false });
        svg.addEventListener('mousedown', preventTransform);
        svg.addEventListener('touchstart', preventTransform, { passive: false });
        
        console.log('🛡️ SVG transform prevention active');
    }
    
    stabilizeAllPositions() {
        console.log('🔧 Stabilizing all hexagon positions...');
        
        let fixedCount = 0;
        
        this.correctPositions.forEach((correctPos, nodeId) => {
            const node = document.querySelector(`[data-id="${nodeId}"]`);
            if (node) {
                const wasFixed = this.fixNodePosition(node, nodeId, correctPos);
                if (wasFixed) fixedCount++;
            } else {
                console.warn(`⚠️ Node ${nodeId} not found in DOM`);
            }
        });
        
        console.log(`✅ Stabilized ${fixedCount} node positions`);
        
        // Force repaint to ensure positions are applied
        this.forceRepaint();
    }
    
    checkAndStabilizePosition(node, nodeId) {
        const correctPos = this.correctPositions.get(nodeId);
        if (!correctPos) return;
        
        const currentTransform = node.getAttribute('transform');
        const expectedTransform = `translate(${correctPos.x}, ${correctPos.y})`;
        
        if (currentTransform !== expectedTransform) {
            console.log(`🔧 Auto-correcting position for ${nodeId}: ${currentTransform} → ${expectedTransform}`);
            node.setAttribute('transform', expectedTransform);
        }
    }
    
    fixNodePosition(node, nodeId, correctPos) {
        const currentTransform = node.getAttribute('transform');
        const expectedTransform = `translate(${correctPos.x}, ${correctPos.y})`;
        
        if (currentTransform !== expectedTransform) {
            console.log(`🔧 Fixing position for ${nodeId}: ${currentTransform} → ${expectedTransform}`);
            node.setAttribute('transform', expectedTransform);
            return true;
        }
        
        return false;
    }
    
    forceRepaint() {
        const svg = document.getElementById('hex-flow-board');
        if (svg) {
            // Force browser to repaint by changing a non-visual property
            const originalOpacity = svg.style.opacity || '1';
            svg.style.opacity = '0.999';
            
            requestAnimationFrame(() => {
                svg.style.opacity = originalOpacity;
            });
        }
    }
    
    // Get current position of a node
    getCurrentPosition(nodeId) {
        const node = document.querySelector(`[data-id="${nodeId}"]`);
        if (!node) return null;
        
        const transform = node.getAttribute('transform');
        const match = transform ? transform.match(/translate\(([^,]+),\s*([^)]+)\)/) : null;
        
        if (match) {
            return {
                x: parseFloat(match[1]),
                y: parseFloat(match[2])
            };
        }
        
        return null;
    }
    
    // Check if node is in correct position
    isNodeInCorrectPosition(nodeId) {
        const currentPos = this.getCurrentPosition(nodeId);
        const correctPos = this.correctPositions.get(nodeId);
        
        if (!currentPos || !correctPos) return false;
        
        // Allow small tolerance for floating point differences
        const tolerance = 0.1;
        return Math.abs(currentPos.x - correctPos.x) < tolerance && 
               Math.abs(currentPos.y - correctPos.y) < tolerance;
    }
    
    // Get status of all node positions
    getPositionStatus() {
        const status = {
            correct: [],
            incorrect: [],
            missing: []
        };
        
        this.correctPositions.forEach((correctPos, nodeId) => {
            const node = document.querySelector(`[data-id="${nodeId}"]`);
            
            if (!node) {
                status.missing.push(nodeId);
            } else if (this.isNodeInCorrectPosition(nodeId)) {
                status.correct.push(nodeId);
            } else {
                status.incorrect.push({
                    nodeId,
                    current: this.getCurrentPosition(nodeId),
                    expected: correctPos
                });
            }
        });
        
        return status;
    }
    
    // Manual stabilization trigger
    stabilizeNow() {
        console.log('🔧 Manual stabilization triggered');
        this.activateStabilization();
    }
    
    // Emergency position reset
    emergencyReset() {
        console.log('🚨 Emergency position reset triggered');
        
        // Clear all transforms on SVG
        const svg = document.getElementById('hex-flow-board');
        if (svg) {
            svg.style.transform = '';
            svg.style.transformOrigin = '';
        }
        
        // Force all nodes to correct positions
        this.stabilizeAllPositions();
        
        // Activate monitoring
        this.activateStabilization();
    }
}

// Initialize the stabilizer
window.hexagonPositionStabilizer = new HexagonPositionStabilizer();

// Expose control functions
window.hexStabilizer = {
    stabilize: () => window.hexagonPositionStabilizer.stabilizeNow(),
    emergencyReset: () => window.hexagonPositionStabilizer.emergencyReset(),
    getStatus: () => window.hexagonPositionStabilizer.getPositionStatus(),
    getCurrentPosition: (nodeId) => window.hexagonPositionStabilizer.getCurrentPosition(nodeId),
    isCorrect: (nodeId) => window.hexagonPositionStabilizer.isNodeInCorrectPosition(nodeId)
};

console.log('🎮 Hex stabilizer controls:');
console.log('  hexStabilizer.stabilize() - Stabilize all positions');
console.log('  hexStabilizer.emergencyReset() - Emergency position reset'); 
console.log('  hexStabilizer.getStatus() - Get position status report');
console.log('  hexStabilizer.getCurrentPosition("hub") - Get node position');
console.log('  hexStabilizer.isCorrect("input") - Check if node is positioned correctly');