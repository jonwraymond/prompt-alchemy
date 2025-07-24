// Continuous Line Animations - Ensures all connections have flowing animations
console.log('🌊 Continuous Line Animations initializing...');

class ContinuousLineAnimations {
    constructor() {
        this.animationIntervals = new Map();
        this.activeConnections = new Set();
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        setTimeout(() => {
            this.setupContinuousAnimations();
            console.log('✅ Continuous line animations initialized');
        }, 2000);
    }
    
    setupContinuousAnimations() {
        // Define which connections should have continuous animations
        const animatedConnections = [
            // Input flows
            { connection: 'input-hub', type: 'input-output', interval: 3000 },
            { connection: 'input-prima', type: 'ready-flow', interval: 3500 },
            
            // Phase connections
            { connection: 'hub-prima', type: 'standby', interval: 4000 },
            { connection: 'hub-solutio', type: 'standby', interval: 4500 },
            { connection: 'hub-coagulatio', type: 'standby', interval: 5000 },
            
            // Prima processes
            { connection: 'prima-parse', type: 'standby', interval: 3000 },
            { connection: 'prima-extract', type: 'standby', interval: 3200 },
            { connection: 'prima-validate', type: 'standby', interval: 3400 },
            
            // Solutio processes
            { connection: 'solutio-refine', type: 'standby', interval: 3100 },
            { connection: 'solutio-flow', type: 'standby', interval: 3300 },
            { connection: 'solutio-finalize', type: 'standby', interval: 3500 },
            
            // Coagulatio processes
            { connection: 'coagulatio-optimize', type: 'standby', interval: 3200 },
            { connection: 'coagulatio-judge', type: 'standby', interval: 3400 },
            { connection: 'coagulatio-database', type: 'standby', interval: 3600 },
            
            // Output flow
            { connection: 'hub-output', type: 'input-output', interval: 3000 },
            
            // Provider connections (sample)
            { connection: 'prima-openai', type: 'standby', interval: 4000 },
            { connection: 'solutio-anthropic', type: 'standby', interval: 4200 },
            { connection: 'coagulatio-google', type: 'standby', interval: 4400 }
        ];
        
        // Start animations for each connection
        animatedConnections.forEach(({ connection, type, interval }) => {
            this.startConnectionAnimation(connection, type, interval);
        });
        
        // Also add wave/flow effects to all lines
        this.addLineFlowEffects();
    }
    
    startConnectionAnimation(connectionKey, animationType, interval) {
        // Check if connection exists
        const path = document.querySelector(`[data-connection="${connectionKey}"]`);
        if (!path) {
            console.warn(`Connection ${connectionKey} not found, will retry...`);
            // Retry after a delay
            setTimeout(() => this.startConnectionAnimation(connectionKey, animationType, interval), 2000);
            return;
        }
        
        // Clear any existing interval
        if (this.animationIntervals.has(connectionKey)) {
            clearInterval(this.animationIntervals.get(connectionKey));
        }
        
        // Create continuous animation
        const animateConnection = () => {
            if (window.animateConnection) {
                window.animateConnection(connectionKey, 'forward', animationType);
            }
        };
        
        // Start immediately and then at intervals
        animateConnection();
        const intervalId = setInterval(animateConnection, interval);
        this.animationIntervals.set(connectionKey, intervalId);
        this.activeConnections.add(connectionKey);
        
        console.log(`🔄 Started continuous animation for ${connectionKey} every ${interval}ms`);
    }
    
    addLineFlowEffects() {
        // Add CSS animations for continuous flow effects
        const style = document.createElement('style');
        style.textContent = `
            /* Continuous wave animation for all connection lines */
            .connection-line {
                stroke-dasharray: 10 5;
                animation: flow-dash 20s linear infinite;
            }
            
            @keyframes flow-dash {
                to {
                    stroke-dashoffset: -150;
                }
            }
            
            /* Different speeds for different connection types */
            .connection-line[data-connection*="input"] {
                animation-duration: 15s;
            }
            
            .connection-line[data-connection*="output"] {
                animation-duration: 15s;
            }
            
            .connection-line[data-connection*="prima"] {
                animation-duration: 18s;
            }
            
            .connection-line[data-connection*="solutio"] {
                animation-duration: 20s;
            }
            
            .connection-line[data-connection*="coagulatio"] {
                animation-duration: 22s;
            }
            
            /* Pulse effect for active connections */
            .connection-active {
                animation: pulse-glow 2s ease-in-out infinite;
            }
            
            @keyframes pulse-glow {
                0%, 100% {
                    opacity: 0.6;
                    filter: drop-shadow(0 0 4px currentColor);
                }
                50% {
                    opacity: 1;
                    filter: drop-shadow(0 0 12px currentColor);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Stop animation for a specific connection
    stopConnectionAnimation(connectionKey) {
        if (this.animationIntervals.has(connectionKey)) {
            clearInterval(this.animationIntervals.get(connectionKey));
            this.animationIntervals.delete(connectionKey);
            this.activeConnections.delete(connectionKey);
            console.log(`⏹️ Stopped animation for ${connectionKey}`);
        }
    }
    
    // Stop all animations
    stopAllAnimations() {
        this.animationIntervals.forEach((intervalId, key) => {
            clearInterval(intervalId);
        });
        this.animationIntervals.clear();
        this.activeConnections.clear();
        console.log('⏹️ All animations stopped');
    }
    
    // Get status
    getStatus() {
        return {
            activeConnections: Array.from(this.activeConnections),
            totalAnimations: this.animationIntervals.size
        };
    }
}

// Initialize continuous animations
window.continuousLineAnimations = new ContinuousLineAnimations();

// Expose control functions
window.lineAnimations = {
    stop: (connection) => window.continuousLineAnimations.stopConnectionAnimation(connection),
    stopAll: () => window.continuousLineAnimations.stopAllAnimations(),
    status: () => window.continuousLineAnimations.getStatus(),
    restart: () => {
        window.continuousLineAnimations.stopAllAnimations();
        window.continuousLineAnimations.setupContinuousAnimations();
    }
};

console.log('🎮 Line animation controls:');
console.log('  lineAnimations.status() - Check active animations');
console.log('  lineAnimations.stop("input-hub") - Stop specific animation');
console.log('  lineAnimations.stopAll() - Stop all animations');
console.log('  lineAnimations.restart() - Restart all animations');