// Real-time API Integration for Prompt Alchemy
// This connects the UI to the actual API and visualizes the process in real-time

class RealtimePromptGenerator {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8080';
        this.activePhase = null;
        this.phaseResults = {};
        this.connectionAnimations = [];
    }

    // Main generate function that orchestrates the entire process
    async generatePrompt(input, options = {}) {
        try {
            // IMPORTANT: This is for REAL API calls only - no mocks or demos
            console.log('🚀 REAL API CALL: Starting prompt generation');
            
            // Reset state
            this.resetVisualization();
            
            // Start input gateway animation
            this.activateInputGateway();
            
            // Activate hub
            await this.delay(500);
            this.activateNode('hub');
            this.animateConnection('input', 'hub');
            
            // Start the generation process
            const requestBody = {
                input: input,
                count: options.count || 3,
                save: options.save || true,
                persona: options.persona || 'general',
                provider_overrides: options.providerOverrides || {},
                phase_selection: options.phaseSelection || 'best'
            };

            // Call the REAL API endpoint - no mocks
            console.log('📡 Making REAL API request to:', `${this.apiBaseUrl}/api/v1/generate`);
            const response = await fetch(`${this.apiBaseUrl}/api/v1/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ REAL API response received:', result);
            
            // Visualize each phase based on the REAL result
            await this.visualizePhases(result);
            
            // Activate output gateway with celebration
            await this.activateOutputGateway();
            
            return result;
            
        } catch (error) {
            console.error('REAL API error:', error);
            this.showError(error.message);
            throw error;
        }
    }

    // Visualize each phase of the generation process
    async visualizePhases(result) {
        // Phase 1: Prima Materia
        await this.visualizePhase('prima', result.phases?.prima || result.prompt);
        
        // Phase 2: Solutio
        await this.delay(1000);
        await this.visualizePhase('solutio', result.phases?.solutio || result.prompt);
        
        // Phase 3: Coagulatio
        await this.delay(1000);
        await this.visualizePhase('coagulatio', result.phases?.coagulatio || result.prompt);
        
        // Final: Ranking and Storage
        await this.delay(1000);
        await this.visualizeFinalProcessing(result);
    }

    // Visualize a single phase
    async visualizePhase(phaseName, phaseData) {
        console.log(`Visualizing phase: ${phaseName}`, phaseData);
        
        // Activate phase node
        this.activateNode(phaseName);
        
        // Animate connection from hub to phase
        this.animateConnection('hub', phaseName);
        await this.delay(500);
        
        // Activate sub-processes for this phase
        const subProcesses = this.getPhaseSubProcesses(phaseName);
        for (const subprocess of subProcesses) {
            await this.delay(300);
            this.activateNode(subprocess);
            this.animateConnection(phaseName, subprocess);
        }
        
        // Store phase result
        this.phaseResults[phaseName] = phaseData;
        
        // Deactivate after processing
        await this.delay(800);
        this.deactivatePhaseNodes(phaseName);
    }

    // Get sub-processes for each phase
    getPhaseSubProcesses(phase) {
        const processes = {
            'prima': ['prima-extract', 'prima-analyze', 'prima-structure'],
            'solutio': ['solutio-flow', 'solutio-adapt', 'solutio-refine'],
            'coagulatio': ['coagulatio-crystallize', 'coagulatio-optimize', 'coagulatio-finalize']
        };
        return processes[phase] || [];
    }

    // Visualize final processing (ranking, storage)
    async visualizeFinalProcessing(result) {
        // Activate ranking
        this.activateNode('rank');
        this.animateConnection('hub', 'rank');
        await this.delay(500);
        
        // Activate database storage
        this.activateNode('coagulatio-database');
        this.animateConnection('rank', 'coagulatio-database');
        await this.delay(500);
        
        // Connect to output
        this.animateConnection('hub', 'output');
    }

    // Activate input gateway with vortex effect
    activateInputGateway() {
        const inputNode = document.querySelector('[data-id="input"]');
        if (inputNode) {
            inputNode.classList.add('input-vortex-active');
            this.createInputVortexEffect(inputNode);
        }
    }

    // Activate output gateway with tattoo alchemy effect
    async activateOutputGateway() {
        const outputNode = document.querySelector('[data-id="output"]');
        if (outputNode) {
            outputNode.classList.add('output-transmutation-active');
            
            // Use tattoo effect if available, fallback to original
            if (window.createOutputTattooEffect) {
                console.log('🎨 Creating tattoo effect on output node');
                window.createOutputTattooEffect(outputNode);
            } else {
                console.log('⚠️ Tattoo effect not available, using fallback');
                this.createOutputCelebrationEffect(outputNode);
            }
            
            // Keep the effect persistent
            setTimeout(() => {
                outputNode.classList.add('transmutation-complete');
            }, 3000);
        } else {
            console.error('❌ Output node not found!');
        }
    }

    // Activate a specific node
    activateNode(nodeId) {
        const node = document.querySelector(`[data-id="${nodeId}"]`);
        if (node) {
            node.classList.add('phase-active', 'processing');
            
            // Add glow effect
            const polygon = node.querySelector('polygon');
            if (polygon) {
                polygon.style.filter = 'drop-shadow(0 0 20px currentColor) brightness(1.5)';
            }
        }
    }

    // Deactivate a node
    deactivateNode(nodeId) {
        const node = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (node) {
            node.classList.remove('phase-active', 'processing');
            const polygon = node.querySelector('polygon');
            if (polygon) {
                polygon.style.filter = '';
            }
        }
    }

    // Deactivate all nodes for a phase
    deactivatePhaseNodes(phase) {
        this.deactivateNode(phase);
        const subProcesses = this.getPhaseSubProcesses(phase);
        subProcesses.forEach(subprocess => this.deactivateNode(subprocess));
    }

    // Animate connection between nodes
    animateConnection(fromId, toId) {
        console.log(`🎯 Attempting to animate connection: ${fromId} → ${toId}`);
        
        // Use the global engine flow connections function if available
        if (window.EngineFlowConnections && window.EngineFlowConnections.animateFlow) {
            console.log('✅ Using EngineFlowConnections.animateFlow');
            window.EngineFlowConnections.animateFlow(fromId, toId);
        } else {
            console.log('⚠️ EngineFlowConnections not available, using fallback');
            // Fallback: Find and animate the connection manually
            const svg = document.getElementById('hex-flow-svg') || document.getElementById('hex-flow-board');
            if (!svg) {
                console.error('❌ SVG board not found!');
                return;
            }
            
            // Look for the specific connection
            const connections = svg.querySelectorAll('.connection-line');
            connections.forEach(conn => {
                const connData = conn.getAttribute('data-connection');
                if (connData && connData.includes(fromId) && connData.includes(toId)) {
                    // Trigger particle animation
                    this.createParticleAnimation(conn, fromId, toId);
                    
                    // Add glow effect
                    conn.classList.add('connection-active');
                    setTimeout(() => {
                        conn.classList.remove('connection-active');
                    }, 2000);
                }
            });
        }
    }
    
    // Create particle animation for a connection
    createParticleAnimation(pathElement, fromId, toId) {
        const svg = pathElement.closest('svg');
        const particleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        particleGroup.setAttribute('class', 'flow-particle-realtime');
        
        // Create particle with white core
        const particleCore = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        particleCore.setAttribute('r', '4');
        particleCore.setAttribute('fill', '#ffffff');
        particleCore.setAttribute('opacity', '0.9');
        
        // Create particle glow
        const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        particle.setAttribute('r', '8');
        particle.setAttribute('fill', '#ffd700');
        particle.setAttribute('opacity', '0.7');
        particle.setAttribute('filter', 'url(#glow)');
        
        particleGroup.appendChild(particle);
        particleGroup.appendChild(particleCore);
        
        // Create animation along path
        const animateMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        animateMotion.setAttribute('dur', '1.5s');
        animateMotion.setAttribute('repeatCount', '1');
        animateMotion.setAttribute('fill', 'freeze');
        
        // Use the path data
        const pathData = pathElement.getAttribute('d');
        const mpath = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
        mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${pathElement.id || this.generatePathId(pathElement)}`);
        animateMotion.appendChild(mpath);
        
        particleGroup.appendChild(animateMotion);
        svg.appendChild(particleGroup);
        
        // Remove particle after animation
        animateMotion.addEventListener('endEvent', () => {
            particleGroup.remove();
        });
        
        // Fallback removal
        setTimeout(() => {
            if (particleGroup.parentNode) {
                particleGroup.remove();
            }
        }, 2000);
    }
    
    // Generate ID for path if needed
    generatePathId(pathElement) {
        const id = `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        pathElement.setAttribute('id', id);
        return id;
    }

    // Check if connection matches the nodes
    connectionMatches(fromId, toId, connection) {
        // This is a simplified check - in reality, you'd need to match based on the actual connection data
        const connectionData = connection.getAttribute('data-connection');
        return connectionData && connectionData.includes(fromId) && connectionData.includes(toId);
    }

    // Create input vortex effect
    createInputVortexEffect(node) {
        // This triggers the hex-border-animations.js effect
        if (window.createInputHexVortex) {
            window.createInputHexVortex(node);
        }
    }

    // Create output celebration effect
    createOutputCelebrationEffect(node) {
        // This triggers the hex-border-animations.js effect
        if (window.createOutputHexCelebration) {
            window.createOutputHexCelebration(node);
        }
    }

    // Reset visualization state
    resetVisualization() {
        // Remove all active states
        document.querySelectorAll('.phase-active, .processing').forEach(node => {
            node.classList.remove('phase-active', 'processing');
        });
        
        // Remove connection active states
        document.querySelectorAll('.connection-active').forEach(conn => {
            conn.classList.remove('connection-active');
        });
        
        // Clear previous effects
        document.querySelectorAll('.input-vortex-active, .output-transmutation-active, .transmutation-complete').forEach(node => {
            node.classList.remove('input-vortex-active', 'output-transmutation-active', 'transmutation-complete');
        });
        
        this.phaseResults = {};
    }

    // Show error message
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'api-error-message';
        errorDiv.textContent = `Error: ${message}`;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            errorDiv.classList.remove('show');
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the generator
const realtimeGenerator = new RealtimePromptGenerator();

// Export for use in other scripts
window.RealtimePromptGenerator = RealtimePromptGenerator;
window.realtimeGenerator = realtimeGenerator;

// Add styles for error messages
const style = document.createElement('style');
style.textContent = `
    .api-error-message {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        z-index: 10000;
        max-width: 400px;
    }
    
    .api-error-message.show {
        opacity: 1;
        transform: translateX(0);
    }
    
    .connection-active {
        stroke: #ffd700 !important;
        stroke-width: 3 !important;
        filter: drop-shadow(0 0 10px #ffd700);
        animation: pulse-glow 1s ease-in-out;
    }
    
    @keyframes pulse-glow {
        0%, 100% {
            opacity: 0.8;
        }
        50% {
            opacity: 1;
            filter: drop-shadow(0 0 20px #ffd700);
        }
    }
    
    .phase-active polygon {
        animation: phase-processing 1s ease-in-out infinite;
    }
    
    @keyframes phase-processing {
        0%, 100% {
            stroke-opacity: 0.8;
        }
        50% {
            stroke-opacity: 1;
            stroke-width: 3;
        }
    }
`;
document.head.appendChild(style);