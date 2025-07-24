// API Call Transfer Integration
// Automatically shows call transfer animations for real API calls

class APICallTransferIntegration {
    constructor() {
        this.init();
    }
    
    init() {
        // Wait for both systems to be ready
        const checkReady = setInterval(() => {
            if (window.callTransferAnimation && window.realtimeGenerator) {
                clearInterval(checkReady);
                this.setupIntegration();
                console.log('✅ API Call Transfer Integration ready');
            }
        }, 100);
    }
    
    setupIntegration() {
        // Hook into the real-time generator's animation method
        if (window.realtimeGenerator) {
            const original = window.realtimeGenerator.animateConnection;
            const self = this;
            
            window.realtimeGenerator.animateConnection = function(fromId, toId) {
                console.log(`📞 API Call Transfer: ${fromId} → ${toId}`);
                
                // Call original method
                if (original) {
                    original.call(this, fromId, toId);
                }
                
                // Add call transfer animation
                self.createAPICallTransfer(fromId, toId);
            };
        }
        
        // Hook into the visualization phases
        if (window.realtimeGenerator) {
            const originalPhase = window.realtimeGenerator.visualizePhase;
            const self = this;
            
            window.realtimeGenerator.visualizePhase = async function(phaseName, phaseData) {
                console.log(`🔄 Phase Transfer: ${phaseName}`);
                
                // Create transfers for phase connections
                if (phaseName === 'prima') {
                    self.createAPICallTransfer('hub', 'prima', { color: '#ff6b6b', duration: 2000 });
                } else if (phaseName === 'solutio') {
                    self.createAPICallTransfer('hub', 'solutio', { color: '#4ecdc4', duration: 2000 });
                } else if (phaseName === 'coagulatio') {
                    self.createAPICallTransfer('hub', 'coagulatio', { color: '#45b7d1', duration: 2000 });
                }
                
                // Call original method
                if (originalPhase) {
                    return await originalPhase.call(this, phaseName, phaseData);
                }
            };
        }
        
        // Hook into fetch to detect all API calls
        this.interceptFetch();
    }
    
    createAPICallTransfer(fromId, toId, options = {}) {
        // Determine color based on connection type
        const connectionType = this.getConnectionType(fromId, toId);
        const defaultOptions = this.getDefaultOptions(connectionType);
        
        // Merge with provided options
        const finalOptions = {
            ...defaultOptions,
            ...options,
            onComplete: () => {
                console.log(`✅ Call transfer complete: ${fromId} → ${toId}`);
                this.onTransferComplete(fromId, toId);
            }
        };
        
        // Create the animation
        window.animateCallTransfer(fromId, toId, finalOptions);
    }
    
    getConnectionType(fromId, toId) {
        // Categorize connection types
        if (fromId === 'input' || toId === 'output') {
            return 'gateway';
        } else if (['prima', 'solutio', 'coagulatio'].includes(toId)) {
            return 'phase';
        } else if (toId.includes('provider') || ['openai', 'anthropic', 'google'].includes(toId)) {
            return 'provider';
        } else if (['parse', 'extract', 'flow', 'refine', 'validate', 'finalize'].includes(toId)) {
            return 'processor';
        }
        return 'default';
    }
    
    getDefaultOptions(connectionType) {
        const options = {
            gateway: {
                color: '#ffd700',
                size: 10,
                duration: 2500,
                pulseScale: 1.8
            },
            phase: {
                color: '#00ff88',
                size: 8,
                duration: 2000,
                pulseScale: 1.5
            },
            provider: {
                color: '#00aaff',
                size: 6,
                duration: 3000,
                pulseScale: 1.4
            },
            processor: {
                color: '#ff66cc',
                size: 7,
                duration: 1500,
                pulseScale: 1.3
            },
            default: {
                color: '#00ff88',
                size: 8,
                duration: 2000,
                pulseScale: 1.5
            }
        };
        
        return options[connectionType] || options.default;
    }
    
    onTransferComplete(fromId, toId) {
        // Trigger node activation effect
        const toNode = document.querySelector(`[data-id="${toId}"]`);
        if (toNode) {
            toNode.classList.add('transfer-received');
            setTimeout(() => {
                toNode.classList.remove('transfer-received');
            }, 500);
        }
    }
    
    interceptFetch() {
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = async function(...args) {
            const url = args[0];
            
            // Detect API calls
            if (typeof url === 'string' && url.includes('/api/')) {
                console.log('🌐 API Call detected:', url);
                
                // Show initial transfer from input
                if (url.includes('/generate')) {
                    self.createAPICallTransfer('input', 'hub', {
                        color: '#ffd700',
                        size: 12,
                        duration: 1500,
                        pulseScale: 2
                    });
                }
            }
            
            // Call original fetch
            const response = await originalFetch.apply(this, args);
            
            // Show completion transfer
            if (response.ok && url.includes('/generate')) {
                setTimeout(() => {
                    self.createAPICallTransfer('hub', 'output', {
                        color: '#ffd700',
                        size: 12,
                        duration: 1500,
                        pulseScale: 2
                    });
                }, 100);
            }
            
            return response;
        };
    }
}

// Initialize the integration
window.apiCallTransferIntegration = new APICallTransferIntegration();

// Utility function for manual testing
window.testCallTransfer = function(from = 'input', to = 'hub') {
    const options = {
        duration: 3000,
        color: '#00ff88',
        size: 10,
        pulseScale: 1.8
    };
    
    console.log(`🧪 Testing call transfer: ${from} → ${to}`);
    return window.animateCallTransfer(from, to, options);
};

// Demo function to show various transfer types
window.demoCallTransfers = function() {
    const sequences = [
        { from: 'input', to: 'hub', delay: 0 },
        { from: 'hub', to: 'prima', delay: 500 },
        { from: 'prima', to: 'parse', delay: 1000 },
        { from: 'prima', to: 'extract', delay: 1200 },
        { from: 'hub', to: 'solutio', delay: 2000 },
        { from: 'solutio', to: 'flow', delay: 2500 },
        { from: 'solutio', to: 'refine', delay: 2700 },
        { from: 'hub', to: 'coagulatio', delay: 3500 },
        { from: 'coagulatio', to: 'validate', delay: 4000 },
        { from: 'coagulatio', to: 'finalize', delay: 4200 },
        { from: 'hub', to: 'output', delay: 5000 }
    ];
    
    sequences.forEach(({ from, to, delay }) => {
        setTimeout(() => {
            window.testCallTransfer(from, to);
        }, delay);
    });
    
    console.log('🎬 Call transfer demo started');
};

console.log('📞 API Call Transfer Integration loaded');
console.log('Test with: testCallTransfer("input", "hub")');
console.log('Demo all: demoCallTransfers()');