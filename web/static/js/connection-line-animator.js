// Connection Line Animator - Enhanced line animations for data processes
console.log('🌊 Connection Line Animator initializing...');

class ConnectionLineAnimator {
    constructor() {
        this.activeAnimations = new Map();
        this.animationStyles = new Map();
        this.init();
    }
    
    init() {
        this.setupAnimationStyles();
        this.createAnimationFilters();
        console.log('✅ Connection Line Animator initialized');
    }
    
    setupAnimationStyles() {
        // Define different animation styles for different process types
        this.animationStyles.set('data-ingestion', {
            color: '#ffcc33',
            glowColor: '#ffed4e',
            strokeWidth: 4,
            dashArray: '10,5',
            animationDuration: '2s',
            glowIntensity: 15
        });
        
        this.animationStyles.set('phase-initiation', {
            color: '#4ecdc4',
            glowColor: '#6eddd5',
            strokeWidth: 3,
            dashArray: '8,4',
            animationDuration: '1.5s',
            glowIntensity: 12
        });
        
        this.animationStyles.set('api-call', {
            color: '#e74c3c',
            glowColor: '#ff6b6b',
            strokeWidth: 5,
            dashArray: '15,8',
            animationDuration: '3s',
            glowIntensity: 20
        });
        
        this.animationStyles.set('processing', {
            color: '#3498db',
            glowColor: '#74b9ff',
            strokeWidth: 3,
            dashArray: '6,3',
            animationDuration: '1.2s',
            glowIntensity: 10
        });
        
        this.animationStyles.set('final-output', {
            color: '#ffd700',
            glowColor: '#ffed4e',
            strokeWidth: 6,
            dashArray: '20,10',
            animationDuration: '2.5s',
            glowIntensity: 25
        });
    }
    
    createAnimationFilters() {
        const svg = document.getElementById('hex-flow-board');
        if (!svg) return;
        
        let defs = svg.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svg.insertBefore(defs, svg.firstChild);
        }
        
        // Clear existing animation filters
        defs.querySelectorAll('[id^="line-glow-"]').forEach(f => f.remove());
        
        // Create glow filters for each animation style
        this.animationStyles.forEach((style, styleName) => {
            const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
            filter.setAttribute('id', `line-glow-${styleName}`);
            filter.setAttribute('x', '-50%');
            filter.setAttribute('y', '-50%');
            filter.setAttribute('width', '200%');
            filter.setAttribute('height', '200%');
            
            // Gaussian blur for glow
            const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
            feGaussianBlur.setAttribute('in', 'SourceGraphic');
            feGaussianBlur.setAttribute('stdDeviation', style.glowIntensity / 3);
            feGaussianBlur.setAttribute('result', 'coloredBlur');
            
            // Color matrix to enhance glow
            const feColorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
            feColorMatrix.setAttribute('in', 'coloredBlur');
            feColorMatrix.setAttribute('mode', 'matrix');
            const rgb = this.hexToRgb(style.glowColor);
            feColorMatrix.setAttribute('values', `0 0 0 0 ${rgb.r/255}
                                                  0 0 0 0 ${rgb.g/255}
                                                  0 0 0 0 ${rgb.b/255}
                                                  0 0 0 1 0`);
            feColorMatrix.setAttribute('result', 'coloredGlow');
            
            // Merge with original
            const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
            const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
            feMergeNode1.setAttribute('in', 'coloredGlow');
            const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
            feMergeNode2.setAttribute('in', 'SourceGraphic');
            
            feMerge.appendChild(feMergeNode1);
            feMerge.appendChild(feMergeNode2);
            
            filter.appendChild(feGaussianBlur);
            filter.appendChild(feColorMatrix);
            filter.appendChild(feMerge);
            defs.appendChild(filter);
        });
    }
    
    animateConnection(fromId, toId, processType, duration = 2000) {
        const connectionKey = this.findConnectionKey(fromId, toId);
        if (!connectionKey) {
            console.warn(`⚠️ No connection found for ${fromId} → ${toId}`);
            return Promise.resolve();
        }
        
        const path = document.querySelector(`[data-connection="${connectionKey}"]`);
        if (!path) {
            console.warn(`⚠️ Path not found for connection: ${connectionKey}`);
            return Promise.resolve();
        }
        
        return this.animatePath(path, processType, duration);
    }
    
    animatePath(path, processType, duration) {
        return new Promise((resolve) => {
            const style = this.animationStyles.get(processType) || this.animationStyles.get('processing');
            const animationId = `anim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            console.log(`🌊 Animating path with style: ${processType}`);
            
            // Store original values
            const originalStroke = path.getAttribute('stroke');
            const originalStrokeWidth = path.getAttribute('stroke-width');
            const originalDashArray = path.getAttribute('stroke-dasharray');
            const originalFilter = path.getAttribute('filter');
            
            // Apply animation style
            path.setAttribute('stroke', style.color);
            path.setAttribute('stroke-width', style.strokeWidth);
            path.setAttribute('stroke-dasharray', style.dashArray);
            path.setAttribute('filter', `url(#line-glow-${processType})`);
            path.classList.add('animated-line');
            path.setAttribute('data-animation-id', animationId);
            
            // Create CSS animation for dash movement
            this.createDashAnimation(animationId, style);
            
            // Track active animation
            this.activeAnimations.set(animationId, {
                path,
                originalStyle: {
                    stroke: originalStroke,
                    strokeWidth: originalStrokeWidth,
                    dashArray: originalDashArray,
                    filter: originalFilter
                },
                timeout: setTimeout(() => {
                    this.resetPathStyle(path, animationId);
                    resolve();
                }, duration)
            });
        });
    }
    
    createDashAnimation(animationId, style) {
        // Remove existing animation if any
        const existingStyle = document.getElementById(`dash-anim-${animationId}`);
        if (existingStyle) existingStyle.remove();
        
        const styleElement = document.createElement('style');
        styleElement.id = `dash-anim-${animationId}`;
        styleElement.textContent = `
            [data-animation-id="${animationId}"] {
                animation: dash-flow-${animationId} ${style.animationDuration} linear infinite;
            }
            
            @keyframes dash-flow-${animationId} {
                0% {
                    stroke-dashoffset: 0;
                    opacity: 0.7;
                }
                50% {
                    opacity: 1;
                }
                100% {
                    stroke-dashoffset: -100;
                    opacity: 0.7;
                }
            }
        `;
        document.head.appendChild(styleElement);
    }
    
    resetPathStyle(path, animationId) {
        const animation = this.activeAnimations.get(animationId);
        if (!animation) return;
        
        const { originalStyle } = animation;
        
        // Reset to original style
        if (originalStyle.stroke) path.setAttribute('stroke', originalStyle.stroke);
        if (originalStyle.strokeWidth) path.setAttribute('stroke-width', originalStyle.strokeWidth);
        if (originalStyle.dashArray) {
            path.setAttribute('stroke-dasharray', originalStyle.dashArray);
        } else {
            path.removeAttribute('stroke-dasharray');
        }
        if (originalStyle.filter) {
            path.setAttribute('filter', originalStyle.filter);
        } else {
            path.removeAttribute('filter');
        }
        
        // Remove animation classes and attributes
        path.classList.remove('animated-line');
        path.removeAttribute('data-animation-id');
        
        // Remove CSS animation
        const styleElement = document.getElementById(`dash-anim-${animationId}`);
        if (styleElement) styleElement.remove();
        
        // Clear timeout
        if (animation.timeout) clearTimeout(animation.timeout);
        
        // Remove from active animations
        this.activeAnimations.delete(animationId);
        
        console.log(`✅ Reset path animation: ${animationId}`);
    }
    
    findConnectionKey(fromId, toId) {
        const connections = window.EngineFlowConnections?.CONNECTIONS || {};
        
        for (const [key, conn] of Object.entries(connections)) {
            if ((conn.nodes[0] === fromId && conn.nodes[1] === toId) ||
                (conn.nodes[1] === fromId && conn.nodes[0] === toId)) {
                return key;
            }
        }
        return null;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }
    
    // Public methods for external use
    animateDataIngestion(fromId, toId, duration = 2000) {
        return this.animateConnection(fromId, toId, 'data-ingestion', duration);
    }
    
    animatePhaseInitiation(fromId, toId, duration = 1500) {
        return this.animateConnection(fromId, toId, 'phase-initiation', duration);
    }
    
    animateAPICall(fromId, toId, duration = 3000) {
        return this.animateConnection(fromId, toId, 'api-call', duration);
    }
    
    animateProcessing(fromId, toId, duration = 1200) {
        return this.animateConnection(fromId, toId, 'processing', duration);
    }
    
    animateFinalOutput(fromId, toId, duration = 2500) {
        return this.animateConnection(fromId, toId, 'final-output', duration);
    }
    
    stopAllAnimations() {
        console.log('🛑 Stopping all line animations...');
        
        this.activeAnimations.forEach((animation, animationId) => {
            this.resetPathStyle(animation.path, animationId);
        });
        
        this.activeAnimations.clear();
        console.log('✅ All line animations stopped');
    }
    
    getActiveAnimationsCount() {
        return this.activeAnimations.size;
    }
}

// Add base CSS for animated lines
const style = document.createElement('style');
style.textContent = `
    /* Base styles for animated connection lines */
    .animated-line {
        transition: stroke 0.3s ease, stroke-width 0.3s ease, filter 0.3s ease;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
    
    /* Ensure animated lines are visible above other elements */
    .animated-line {
        z-index: 100;
    }
`;
document.head.appendChild(style);

// Initialize the line animator
window.connectionLineAnimator = new ConnectionLineAnimator();

// Expose control functions
window.lineAnimator = {
    animateDataIngestion: (from, to, duration) => window.connectionLineAnimator.animateDataIngestion(from, to, duration),
    animatePhaseInitiation: (from, to, duration) => window.connectionLineAnimator.animatePhaseInitiation(from, to, duration),
    animateAPICall: (from, to, duration) => window.connectionLineAnimator.animateAPICall(from, to, duration),
    animateProcessing: (from, to, duration) => window.connectionLineAnimator.animateProcessing(from, to, duration),
    animateFinalOutput: (from, to, duration) => window.connectionLineAnimator.animateFinalOutput(from, to, duration),
    stopAll: () => window.connectionLineAnimator.stopAllAnimations(),
    getActiveCount: () => window.connectionLineAnimator.getActiveAnimationsCount()
};

console.log('🎮 Line animator controls:');
console.log('  lineAnimator.animateAPICall("prima", "openai", 3000) - Animate API call');
console.log('  lineAnimator.animateDataIngestion("input", "hub", 2000) - Animate data flow');
console.log('  lineAnimator.stopAll() - Stop all animations');
console.log('  lineAnimator.getActiveCount() - Get active animation count');