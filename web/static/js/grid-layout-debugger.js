// Grid Layout Debugger - Comprehensive fix for hexagon positioning and animation data binding
console.log('🔧 Grid Layout Debugger initializing...');

class GridLayoutDebugger {
    constructor() {
        this.coordinateSystem = null;
        this.nodeRegistry = new Map();
        this.animationBindings = new Map();
        this.debugMode = true;
        this.init();
    }
    
    init() {
        console.log('🚀 Starting comprehensive grid layout debugging...');
        
        // Wait for DOM to be ready
        setTimeout(() => {
            this.establishCoordinateSystem();
            this.diagnosePositioningIssues();
            this.fixHexagonDistribution();
            this.fixAnimationDataBinding();
            this.validateFixes();
        }, 2000);
    }
    
    establishCoordinateSystem() {
        console.log('📐 Establishing coordinate system...');
        
        const svg = document.getElementById('hex-flow-board');
        if (!svg) {
            console.error('❌ Main SVG not found');
            return;
        }
        
        // Get viewBox dimensions
        const viewBox = svg.getAttribute('viewBox');
        const [minX, minY, width, height] = viewBox.split(' ').map(Number);
        
        this.coordinateSystem = {
            svg: svg,
            viewBox: { minX, minY, width, height },
            center: { x: width / 2, y: height / 2 },
            bounds: { minX, minY, maxX: minX + width, maxY: minY + height }
        };
        
        console.log('✅ Coordinate system established:', this.coordinateSystem);
        
        // Clear any problematic SVG transforms
        svg.style.transform = '';
        svg.style.transformOrigin = '';
        
        // Ensure SVG takes full container space
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
    }
    
    diagnosePositioningIssues() {
        console.log('🔍 Diagnosing positioning issues...');
        
        const nodes = document.querySelectorAll('.hex-node');
        const issues = {
            clustered: [],
            outOfBounds: [],
            overlapping: [],
            missingTransform: []
        };
        
        nodes.forEach(node => {
            const nodeId = node.getAttribute('data-id');
            const transform = node.getAttribute('transform');
            
            if (!transform) {
                issues.missingTransform.push(nodeId);
                return;
            }
            
            const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
            if (!match) {
                issues.missingTransform.push(nodeId);
                return;
            }
            
            const x = parseFloat(match[1]);
            const y = parseFloat(match[2]);
            
            // Check if clustered in corner (< 100, 100)
            if (x < 100 && y < 100) {  
                issues.clustered.push({ nodeId, x, y });
            }
            
            // Check if out of bounds
            const { bounds } = this.coordinateSystem;
            if (x < bounds.minX || x > bounds.maxX || y < bounds.minY || y > bounds.maxY) {
                issues.outOfBounds.push({ nodeId, x, y });
            }
            
            // Register position for overlap checking
            this.nodeRegistry.set(nodeId, { x, y, element: node });
        });
        
        // Check for overlapping nodes
        const positions = Array.from(this.nodeRegistry.values());
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const pos1 = positions[i];
                const pos2 = positions[j];
                const distance = Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
                
                if (distance < 80) { // Minimum safe distance
                    issues.overlapping.push({ 
                        nodes: [pos1.element.getAttribute('data-id'), pos2.element.getAttribute('data-id')],
                        distance 
                    });
                }
            }
        }
        
        console.log('🚨 Positioning issues found:', issues);
        this.positioningIssues = issues;
    }
    
    fixHexagonDistribution() {
        console.log('🔧 Fixing hexagon distribution...');
        
        // Define optimal grid layout for 1000x700 viewBox
        const optimalPositions = {
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
        
        let fixedCount = 0;
        
        // Apply optimal positions
        Object.entries(optimalPositions).forEach(([nodeId, position]) => {
            const node = document.querySelector(`[data-id="${nodeId}"]`);
            
            if (node) {
                const currentTransform = node.getAttribute('transform');
                const newTransform = `translate(${position.x}, ${position.y})`;
                
                if (currentTransform !== newTransform) {
                    console.log(`🔧 Repositioning ${nodeId}: ${currentTransform} → ${newTransform}`);
                    node.setAttribute('transform', newTransform);
                    this.nodeRegistry.set(nodeId, { ...position, element: node });
                    fixedCount++;
                }
            } else {
                console.warn(`⚠️ Node ${nodeId} not found for positioning`);
            }
        });
        
        console.log(`✅ Fixed positioning for ${fixedCount} nodes`);
        
        // Force visual update
        this.forceLayoutUpdate();
    }
    
    fixAnimationDataBinding() {
        console.log('🔧 Fixing animation data binding...');
        
        // First, ensure all connection paths have proper IDs
        this.ensurePathIds();
        
        // Then fix existing animation bindings
        this.rebindAnimations();
        
        // Create proper data binding system
        this.establishDataBinding();
    }
    
    ensurePathIds() {
        console.log('🆔 Ensuring all connection paths have IDs...');
        
        const paths = document.querySelectorAll('[data-connection]');
        let fixedCount = 0;
        
        paths.forEach(path => {
            const connectionKey = path.getAttribute('data-connection');
            if (!path.id) {
                const pathId = `connection-path-${connectionKey}`;
                path.id = pathId;
                console.log(`✅ Added ID to path: ${pathId}`);
                fixedCount++;
            }
        });
        
        console.log(`✅ Fixed ${fixedCount} path IDs`);
    }
    
    rebindAnimations() {
        console.log('🔗 Rebinding animation elements...');
        
        // Find all animateMotion elements
        const animateMotions = document.querySelectorAll('animateMotion');
        let reboundCount = 0;
        
        animateMotions.forEach(animateMotion => {
            const mpath = animateMotion.querySelector('mpath');
            if (mpath) {
                const href = mpath.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
                
                if (href) {
                    const pathId = href.replace('#', '');
                    const targetPath = document.getElementById(pathId);
                    
                    if (!targetPath) {
                        console.warn(`⚠️ Animation references missing path: ${pathId}`);
                        
                        // Try to find alternative path
                        const connectionKey = pathId.replace('connection-path-', '').replace('path-', '');
                        const alternativePath = document.querySelector(`[data-connection="${connectionKey}"]`);
                        
                        if (alternativePath && alternativePath.id) {
                            console.log(`🔗 Rebinding animation to: ${alternativePath.id}`);
                            mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${alternativePath.id}`);
                            reboundCount++;
                        }
                    } else {
                        console.log(`✅ Animation binding verified: ${pathId}`);
                    }
                }
            }
        });
        
        console.log(`✅ Rebound ${reboundCount} animation bindings`);
    }
    
    establishDataBinding() {
        console.log('📊 Establishing data-driven animation system...');
        
        // Create registry of all animation-capable elements
        const connections = document.querySelectorAll('[data-connection]');
        
        connections.forEach(path => {
            const connectionKey = path.getAttribute('data-connection');
            const pathId = path.id;
            
            if (pathId) {
                this.animationBindings.set(connectionKey, {
                    pathElement: path,
                    pathId: pathId,
                    isActive: false,
                    lastAnimation: null
                });
            }
        });
        
        console.log(`✅ Established data bindings for ${this.animationBindings.size} connections`);
        
        // Expose control interface
        this.createAnimationControls();
    }
    
    createAnimationControls() {
        // Create data-driven animation function
        window.animateDataFlow = (fromNodeId, toNodeId, data = {}) => {
            console.log(`🎬 Data-driven animation: ${fromNodeId} → ${toNodeId}`, data);
            
            // Find the connection key
            let connectionKey = null;
            for (const [key, binding] of this.animationBindings.entries()) {
                const path = binding.pathElement;
                const fromAttr = path.getAttribute('data-from');
                const toAttr = path.getAttribute('data-to');
                
                if ((fromAttr === fromNodeId && toAttr === toNodeId) ||
                    (fromAttr === toNodeId && toAttr === fromNodeId)) {
                    connectionKey = key;
                    break;
                }
            }
            
            if (!connectionKey) {
                console.warn(`⚠️ No connection found for ${fromNodeId} → ${toNodeId}`);
                return;
            }
            
            const binding = this.animationBindings.get(connectionKey);
            if (!binding) {
                console.warn(`⚠️ No binding found for connection: ${connectionKey}`);
                return;
            }
            
            // Create data-bound particle
            this.createDataBoundParticle(binding, data);
        };
        
        // Expose debug controls
        window.gridDebugger = {
            diagnose: () => this.diagnosePositioningIssues(),
            fixLayout: () => this.fixHexagonDistribution(),
            fixAnimations: () => this.fixAnimationDataBinding(),
            validate: () => this.validateFixes(),
            showRegistry: () => {
                console.log('Node Registry:', Array.from(this.nodeRegistry.entries()));
                console.log('Animation Bindings:', Array.from(this.animationBindings.entries()));
            }
        };
    }
    
    createDataBoundParticle(binding, data) {
        const svg = this.coordinateSystem.svg;
        const pathElement = binding.pathElement;
        
        // Create particle group
        const particleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const particleId = `data-particle-${Date.now()}`;
        particleGroup.id = particleId;
        particleGroup.setAttribute('class', 'data-bound-particle');
        
        // Create visible particle
        const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        particle.setAttribute('r', data.size || '4');
        particle.setAttribute('fill', data.color || '#00ff88');
        particle.setAttribute('opacity', '1');
        particle.style.filter = `drop-shadow(0 0 8px ${data.color || '#00ff88'})`;
        
        particleGroup.appendChild(particle);
        
        // Create properly bound animateMotion
        const animateMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        animateMotion.setAttribute('dur', data.duration || '2s');
        animateMotion.setAttribute('repeatCount', data.repeat || '1');
        animateMotion.setAttribute('fill', 'freeze');
        
        // CRITICAL: Ensure path ID exists before creating mpath
        if (!pathElement.id) {
            pathElement.id = `path-${binding.connectionKey}`;
        }
        
        const mpath = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
        mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${pathElement.id}`);
        
        animateMotion.appendChild(mpath);
        particleGroup.appendChild(animateMotion);
        
        // Add to SVG
        svg.appendChild(particleGroup);
        
        console.log(`✅ Created data-bound particle: ${particleId} on path ${pathElement.id}`);
        
        // Clean up after animation
        const cleanup = () => {
            if (particleGroup.parentNode) {
                particleGroup.remove();
                console.log(`🗑️ Cleaned up particle: ${particleId}`);
            }
        };
        
        animateMotion.addEventListener('endEvent', cleanup);
        animateMotion.addEventListener('end', cleanup);
        
        // Fallback cleanup
        setTimeout(cleanup, (parseFloat(data.duration || '2') * 1000) + 500);
    }
    
    forceLayoutUpdate() {
        const svg = this.coordinateSystem.svg;
        
        // Force browser reflow
        svg.style.display = 'none';
        svg.offsetHeight; // Trigger reflow
        svg.style.display = '';
        
        // Also force transform update
        const transform = svg.style.transform;
        svg.style.transform = 'translateZ(0)';
        requestAnimationFrame(() => {
            svg.style.transform = transform;
        });
        
        console.log('🔄 Forced layout update');
    }
    
    validateFixes() {
        console.log('✅ Validating fixes...');
        
        const validation = {
            positioning: this.validatePositioning(),
            animations: this.validateAnimations(),
            dataBinding: this.validateDataBinding()
        };
        
        console.log('📊 Validation results:', validation);
        
        const allPassed = Object.values(validation).every(result => result.passed);
        
        if (allPassed) {
            console.log('🎉 All validations passed!');
        } else {
            console.warn('⚠️ Some validations failed - check results above');
        }
        
        return validation;
    }
    
    validatePositioning() {
        const nodes = document.querySelectorAll('.hex-node');
        let clusteredCount = 0;
        let properlyPositioned = 0;
        
        nodes.forEach(node => {
            const transform = node.getAttribute('transform');
            const match = transform ? transform.match(/translate\(([^,]+),\s*([^)]+)\)/) : null;
            
            if (match) {
                const x = parseFloat(match[1]);
                const y = parseFloat(match[2]);
                
                if (x < 100 && y < 100) {
                    clusteredCount++;
                } else {
                    properlyPositioned++;
                }
            }
        });
        
        return {
            passed: clusteredCount === 0,
            clusteredCount,
            properlyPositioned,
            totalNodes: nodes.length
        };
    }
    
    validateAnimations() {
        const animateMotions = document.querySelectorAll('animateMotion');
        let validBindings = 0;
        let brokenBindings = 0;
        
        animateMotions.forEach(animateMotion => {
            const mpath = animateMotion.querySelector('mpath');
            if (mpath) {
                const href = mpath.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
                if (href) {
                    const pathId = href.replace('#', '');
                    const targetPath = document.getElementById(pathId);
                    
                    if (targetPath) {
                        validBindings++;
                    } else {
                        brokenBindings++;
                    }
                }
            }
        });
        
        return {
            passed: brokenBindings === 0,
            validBindings,
            brokenBindings,
            totalAnimations: animateMotions.length
        };
    }
    
    validateDataBinding() {
        return {
            passed: this.animationBindings.size > 0,
            bindingCount: this.animationBindings.size,
            hasControls: typeof window.animateDataFlow === 'function'
        };
    }
}

// Add CSS for better visibility
const debugStyle = document.createElement('style');
debugStyle.textContent = `
    /* Grid Layout Debug Styles */
    .data-bound-particle {
        pointer-events: none;
        z-index: 1000;
    }
    
    .data-bound-particle circle {
        stroke: rgba(255, 255, 255, 0.8);
        stroke-width: 1;
    }
    
    /* Debug mode outline for nodes */
    .hex-node[data-debug="true"] {
        outline: 2px solid #ff0000;
        outline-offset: 2px;
    }
    
    /* Grid coordinate helpers */
    .coordinate-debug {
        font-family: monospace;
        font-size: 10px;
        fill: #ffff00;
        pointer-events: none;
    }
`;
document.head.appendChild(debugStyle);

// Initialize the debugger
window.gridLayoutDebugger = new GridLayoutDebugger();

console.log('🎮 Grid Layout Debugger Controls:');
console.log('  gridDebugger.diagnose() - Diagnose positioning issues');
console.log('  gridDebugger.fixLayout() - Fix hexagon distribution');
console.log('  gridDebugger.fixAnimations() - Fix animation bindings');
console.log('  gridDebugger.validate() - Validate all fixes');
console.log('  animateDataFlow("input", "hub", {color: "#ff0000", size: 6}) - Test data-driven animation');