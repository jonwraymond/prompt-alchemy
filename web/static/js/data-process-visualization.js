// Data Process Visualization - Event-driven particle system for actual data processes
console.log('🔬 Data Process Visualization initializing...');

class DataProcessVisualization {
    constructor() {
        this.activeProcesses = new Map();
        this.processQueue = [];
        this.isProcessing = false;
        this.particleSize = 3; // Smaller particles as requested
        this.init();
    }
    
    init() {
        // Stop all continuous animations first
        this.stopContinuousAnimations();
        
        // Set up event-driven system
        this.setupEventListeners();
        this.setupProcessChoreography();
        
        console.log('✅ Data Process Visualization initialized');
    }
    
    stopContinuousAnimations() {
        console.log('🛑 Stopping continuous animations...');
        
        // Stop continuous line animations
        if (window.continuousLineAnimations) {
            window.continuousLineAnimations.stopAllAnimations();
        }
        
        // Stop any setInterval loops
        const highestId = setTimeout(() => {}, 0);
        for (let i = 0; i < highestId; i++) {
            clearInterval(i);
        }
        
        // Remove existing particles with indefinite repeat
        const infiniteParticles = document.querySelectorAll('[repeatCount="indefinite"]');
        infiniteParticles.forEach(particle => {
            const parent = particle.closest('[id*="particle"]');
            if (parent) parent.remove();
        });
        
        console.log('✅ Continuous animations stopped');
    }
    
    setupEventListeners() {
        // Listen for generate button
        const generateForm = document.getElementById('generate-form');
        if (generateForm) {
            generateForm.addEventListener('submit', (e) => {
                // Don't prevent default - let HTMX handle the request
                this.startDataProcessFlow();
            });
        }
        
        // Listen for HTMX events to track actual API calls
        document.addEventListener('htmx:beforeRequest', (e) => {
            const detail = e.detail;
            this.handleAPICallStart(detail);
        });
        
        document.addEventListener('htmx:afterRequest', (e) => {
            const detail = e.detail;
            this.handleAPICallComplete(detail);
        });
        
        // Listen for custom process events
        document.addEventListener('data-process', (e) => {
            this.handleDataProcess(e.detail);
        });
    }
    
    setupProcessChoreography() {
        // Define the actual data process flow based on the alchemical phases
        this.processFlow = [
            {
                phase: 'input',
                connections: [
                    { from: 'input', to: 'hub', type: 'data-ingestion', duration: 1000 }
                ]
            },
            {
                phase: 'prima-materia',
                connections: [
                    { from: 'hub', to: 'prima', type: 'phase-initiation', duration: 800 },
                    { from: 'prima', to: 'parse', type: 'parsing', duration: 1200 },
                    { from: 'prima', to: 'extract', type: 'extraction', duration: 1000 },
                    { from: 'prima', to: 'validate', type: 'validation', duration: 800 },
                    // API calls to providers
                    { from: 'prima', to: 'openai', type: 'api-call', duration: 2000 },
                    { from: 'prima', to: 'anthropic', type: 'api-call', duration: 2000 }
                ]
            },
            {
                phase: 'solutio',
                connections: [
                    { from: 'hub', to: 'solutio', type: 'phase-initiation', duration: 800 },
                    { from: 'solutio', to: 'refine', type: 'refinement', duration: 1000 },
                    { from: 'solutio', to: 'flow', type: 'flow-optimization', duration: 1200 },
                    { from: 'solutio', to: 'finalize', type: 'finalization', duration: 800 },
                    // API calls
                    { from: 'solutio', to: 'anthropic', type: 'api-call', duration: 2000 },
                    { from: 'solutio', to: 'google', type: 'api-call', duration: 2000 }
                ]
            },
            {
                phase: 'coagulatio',
                connections: [
                    { from: 'hub', to: 'coagulatio', type: 'phase-initiation', duration: 800 },
                    { from: 'coagulatio', to: 'optimize', type: 'optimization', duration: 1000 },
                    { from: 'coagulatio', to: 'judge', type: 'evaluation', duration: 1200 },
                    { from: 'coagulatio', to: 'database', type: 'storage', duration: 800 },
                    // Final API calls  
                    { from: 'coagulatio', to: 'openai', type: 'api-call', duration: 2000 }
                ]
            },
            {
                phase: 'output',
                connections: [
                    { from: 'hub', to: 'output', type: 'final-output', duration: 1000 }
                ]
            }
        ];
    }
    
    startDataProcessFlow() {
        console.log('🚀 Starting data process flow...');
        
        if (this.isProcessing) {
            console.log('⚠️ Process already running, skipping');
            return;
        }
        
        this.isProcessing = true;
        this.fixHexagonPositioning();
        
        // Execute each phase sequentially
        this.executeProcessPhases();
    }
    
    fixHexagonPositioning() {
        console.log('🔧 Fixing hexagon positioning for process...');
        
        // Ensure all hexagons are in correct positions
        if (window.hexPositioningFix) {
            window.hexPositioningFix.fixNodePositions();
        }
        
        // Remove any transform scaling that might cause clustering
        const svg = document.getElementById('hex-flow-board');
        if (svg) {
            svg.style.transform = '';
            svg.style.transformOrigin = '';
        }
    }
    
    async executeProcessPhases() {
        for (const phase of this.processFlow) {
            console.log(`🔄 Executing phase: ${phase.phase}`);
            
            // Highlight current phase
            this.highlightPhase(phase.phase);
            
            // Execute connections in parallel for this phase
            const phasePromises = phase.connections.map(conn => 
                this.executeConnection(conn)
            );
            
            // Wait for all connections in this phase to complete
            await Promise.all(phasePromises);
            
            // Brief pause between phases
            await this.delay(500);
        }
        
        this.isProcessing = false;
        console.log('✅ Data process flow completed');
    }
    
    async executeConnection(connection) {
        const { from, to, type, duration } = connection;
        
        console.log(`📡 Executing: ${from} → ${to} (${type})`);
        
        // Create bidirectional flow
        await this.createBidirectionalFlow(from, to, type, duration);
    }
    
    async createBidirectionalFlow(fromId, toId, processType, duration) {
        // Step 1: Send request (from → to)
        await this.createDataAnimation(fromId, toId, processType, 'request', duration / 2);
        
        // Brief processing delay at destination
        await this.delay(200);
        
        // Step 2: Send response (to → from)  
        await this.createDataAnimation(toId, fromId, processType, 'response', duration / 2);
    }
    
    createDataAnimation(fromId, toId, processType, direction, duration) {
        return new Promise((resolve) => {
            const fromNode = document.querySelector(`[data-id="${fromId}"]`);
            const toNode = document.querySelector(`[data-id="${toId}"]`);
            
            if (!fromNode || !toNode) {
                console.warn(`⚠️ Nodes not found: ${fromId} → ${toId}`);
                resolve();
                return;
            }
            
            // Animate connection line only (no particles)
            this.animateConnectionLine(fromId, toId, duration, processType);
            
            // Resolve after animation duration
            setTimeout(() => {
                resolve();
            }, duration);
        });
    }

    
    animateConnectionLine(fromId, toId, duration, processType = 'processing') {
        // Use the advanced line animator if available
        if (window.connectionLineAnimator) {
            return window.connectionLineAnimator.animateConnection(fromId, toId, processType, duration);
        }
        
        // Fallback to simple animation
        const connectionKey = this.findConnectionKey(fromId, toId);
        if (!connectionKey) return Promise.resolve();
        
        const path = document.querySelector(`[data-connection="${connectionKey}"]`);
        if (!path) return Promise.resolve();
        
        return new Promise((resolve) => {
            // Create temporary line animation
            const originalStroke = path.getAttribute('stroke');
            const originalWidth = path.getAttribute('stroke-width');
            
            // Animate line
            path.setAttribute('stroke', '#00ff88');
            path.setAttribute('stroke-width', '4');
            path.style.filter = 'drop-shadow(0 0 8px #00ff88)';
            
            // Reset after animation
            setTimeout(() => {
                path.setAttribute('stroke', originalStroke);
                path.setAttribute('stroke-width', originalWidth);
                path.style.filter = '';
                resolve();
            }, duration);
        });
    }
    
    findConnectionKey(fromId, toId) {
        // Check both directions since connections might be bidirectional
        const connections = window.EngineFlowConnections?.CONNECTIONS || {};
        
        for (const [key, conn] of Object.entries(connections)) {
            if ((conn.nodes[0] === fromId && conn.nodes[1] === toId) ||
                (conn.nodes[1] === fromId && conn.nodes[0] === toId)) {
                return key;
            }
        }
        return null;
    }
    
    highlightPhase(phaseName) {
        // Remove previous highlights
        document.querySelectorAll('.phase-highlight').forEach(el => {
            el.classList.remove('phase-highlight');
        });
        
        // Add highlight to current phase
        const phaseNode = document.querySelector(`[data-id="${phaseName}"]`);
        if (phaseNode) {
            phaseNode.classList.add('phase-highlight');
        }
    }
    
    handleAPICallStart(detail) {
        console.log('📡 API call started:', detail);
        // Could trigger specific API call animations here
    }
    
    handleAPICallComplete(detail) {
        console.log('📡 API call completed:', detail);
        // Could show completion animations here
    }
    
    handleDataProcess(detail) {
        // Handle custom data process events
        console.log('🔄 Data process event:', detail);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Manual trigger for testing
    testDataFlow() {
        console.log('🧪 Testing data flow...');
        this.startDataProcessFlow();
    }
}

// Add CSS for better particle and line visibility
const dataProcessVisStyle = document.createElement('style');
dataProcessVisStyle.textContent = `
    /* Data particle styles */
    .data-particle {
        pointer-events: none;
        z-index: 1000;
    }
    
    .data-particle.request {
        stroke: rgba(255, 255, 255, 0.8);
        stroke-width: 1;
    }
    
    .data-particle.response {
        stroke: rgba(255, 255, 255, 0.6);
        stroke-width: 1;
        opacity: 0.8;
    }
    
    /* Phase highlighting */
    .phase-highlight {
        filter: brightness(1.5) drop-shadow(0 0 15px currentColor);
        transform: scale(1.1);
        transition: all 0.3s ease;
    }
    
    /* Connection line enhancements */
    [data-connection] {
        transition: stroke 0.3s ease, stroke-width 0.3s ease, filter 0.3s ease;
    }
`;
document.head.appendChild(dataProcessVisStyle);

// Initialize the system
window.dataProcessVisualization = new DataProcessVisualization();

// Expose control functions
window.dataProcess = {
    start: () => window.dataProcessVisualization.startDataProcessFlow(),
    test: () => window.dataProcessVisualization.testDataFlow(),
    stop: () => window.dataProcessVisualization.stopContinuousAnimations()
};

console.log('🎮 Data process controls:');
console.log('  dataProcess.start() - Start process flow');
console.log('  dataProcess.test() - Test data flow');
console.log('  dataProcess.stop() - Stop continuous animations');