// REAL API PARTICLE SYSTEM - Shows actual API calls as flowing dots
console.log('🌟 REAL API Particle System Loading...');

class RealAPIParticles {
    constructor() {
        this.activeParticles = [];
        this.svg = null;
        this.init();
    }
    
    init() {
        // Find SVG
        this.svg = document.getElementById('hex-flow-board') || document.querySelector('svg');
        if (!this.svg) {
            console.error('❌ No SVG found for particles');
            return;
        }
        
        // Create dedicated particle layer
        this.particleLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.particleLayer.setAttribute('id', 'real-api-particles');
        this.particleLayer.style.zIndex = '99999';
        this.svg.appendChild(this.particleLayer);
        
        // Intercept the real API calls
        this.interceptAPICalls();
        
        console.log('✅ Real API Particle System initialized');
    }
    
    // Create a HIGHLY VISIBLE particle for each API call
    createAPIParticle(fromNode, toNode, apiType = 'processing') {
        const timestamp = new Date().toISOString();
        console.log(`🔵 [${timestamp}] Creating REAL particle for API call: ${fromNode} → ${toNode}`);
        console.log(`   - API Type: ${apiType}`);
        console.log(`   - Active particles before: ${this.activeParticles.length}`);
        
        const from = document.querySelector(`[data-id="${fromNode}"]`);
        const to = document.querySelector(`[data-id="${toNode}"]`);
        
        if (!from || !to) {
            console.error(`❌ [${timestamp}] Nodes not found: ${fromNode} or ${toNode}`);
            console.log(`   - From node found: ${!!from}`);
            console.log(`   - To node found: ${!!to}`);
            console.log(`   - Available nodes:`, Array.from(document.querySelectorAll('[data-id]')).map(n => n.getAttribute('data-id')));
            return;
        }
        console.log(`✅ [${timestamp}] Both nodes found`);
        
        // Get positions
        const fromRect = from.getBoundingClientRect();
        const toRect = to.getBoundingClientRect();
        const svgRect = this.svg.getBoundingClientRect();
        
        // Convert to SVG coordinates
        const fromX = (fromRect.left + fromRect.width/2 - svgRect.left) * (1000 / svgRect.width);
        const fromY = (fromRect.top + fromRect.height/2 - svgRect.top) * (700 / svgRect.height);
        const toX = (toRect.left + toRect.width/2 - svgRect.left) * (1000 / svgRect.width);
        const toY = (toRect.top + toRect.height/2 - svgRect.top) * (700 / svgRect.height);
        
        // Create particle group
        const particleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        particleGroup.setAttribute('class', 'real-api-particle');
        
        // Create multiple layers for MAXIMUM visibility
        // Layer 1: Large colored backdrop
        const backdrop = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        backdrop.setAttribute('r', '25');
        backdrop.setAttribute('fill', '#FFD700');
        backdrop.setAttribute('opacity', '0.3');
        backdrop.style.filter = 'blur(10px)';
        
        // Layer 2: Main particle
        const mainParticle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        mainParticle.setAttribute('r', '15');
        mainParticle.setAttribute('fill', '#00FF00');
        mainParticle.setAttribute('stroke', '#FFFFFF');
        mainParticle.setAttribute('stroke-width', '3');
        mainParticle.setAttribute('opacity', '1');
        mainParticle.style.filter = 'drop-shadow(0 0 20px #00FF00) drop-shadow(0 0 40px #00FF00)';
        
        // Layer 3: White core
        const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        core.setAttribute('r', '6');
        core.setAttribute('fill', '#FFFFFF');
        core.setAttribute('opacity', '1');
        
        // Add pulsing animation to main particle
        const pulseAnimate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        pulseAnimate.setAttribute('attributeName', 'r');
        pulseAnimate.setAttribute('values', '15;20;15');
        pulseAnimate.setAttribute('dur', '0.5s');
        pulseAnimate.setAttribute('repeatCount', 'indefinite');
        mainParticle.appendChild(pulseAnimate);
        
        // Assemble particle
        particleGroup.appendChild(backdrop);
        particleGroup.appendChild(mainParticle);
        particleGroup.appendChild(core);
        
        // Create motion path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const pathData = `M ${fromX} ${fromY} Q ${(fromX + toX)/2} ${(fromY + toY)/2 - 50} ${toX} ${toY}`;
        path.setAttribute('d', pathData);
        path.setAttribute('id', `api-path-${Date.now()}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#FFD700');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('opacity', '0.5');
        path.style.filter = 'drop-shadow(0 0 5px #FFD700)';
        
        // Add path to show the route
        this.particleLayer.appendChild(path);
        
        // Animate particle along path
        const animateMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        animateMotion.setAttribute('dur', '2s');
        animateMotion.setAttribute('repeatCount', '1');
        animateMotion.setAttribute('fill', 'freeze');
        
        const mpath = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
        mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${path.id}`);
        animateMotion.appendChild(mpath);
        
        particleGroup.appendChild(animateMotion);
        
        // Add to particle layer
        this.particleLayer.appendChild(particleGroup);
        this.activeParticles.push(particleGroup);
        console.log(`🚀 [${timestamp}] Particle added to DOM. Total particles in layer: ${this.particleLayer.children.length}`);
        console.log(`   - Active particles after: ${this.activeParticles.length}`);
        
        // Show API call info
        this.showAPICallInfo(fromNode, toNode, apiType);
        
        // Clean up after animation
        animateMotion.addEventListener('endEvent', () => {
            setTimeout(() => {
                particleGroup.remove();
                path.remove();
            }, 500);
        });
        
        // Fallback cleanup
        setTimeout(() => {
            if (particleGroup.parentNode) {
                particleGroup.remove();
            }
            if (path.parentNode) {
                path.remove();
            }
        }, 3000);
        
        return particleGroup;
    }
    
    // Show text info about the API call
    showAPICallInfo(from, to, type) {
        const info = document.createElement('div');
        info.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: #00FF00;
            padding: 10px 20px;
            border-radius: 5px;
            border: 2px solid #00FF00;
            font-family: monospace;
            z-index: 999999;
            animation: fadeInOut 3s ease;
        `;
        info.textContent = `🔵 API CALL: ${from} → ${to} (${type})`;
        document.body.appendChild(info);
        
        setTimeout(() => info.remove(), 3000);
    }
    
    // Intercept actual API calls and trigger particles
    interceptAPICalls() {
        // Override the generatePrompt method
        if (window.realtimeGenerator) {
            const original = window.realtimeGenerator.generatePrompt;
            const self = this;
            
            window.realtimeGenerator.generatePrompt = async function(input, options) {
                console.log('🚀 REAL API CALL INTERCEPTED!');
                
                // Start with input → hub
                self.createAPIParticle('input', 'hub', 'input-flow');
                
                // Call original method
                const result = await original.call(this, input, options);
                
                // Show completion
                setTimeout(() => {
                    self.createAPIParticle('hub', 'output', 'completion');
                }, 1000);
                
                return result;
            };
        }
        
        // Also intercept animateConnection to ensure particles
        if (window.realtimeGenerator) {
            const originalAnimate = window.realtimeGenerator.animateConnection;
            const self = this;
            
            window.realtimeGenerator.animateConnection = function(fromId, toId) {
                console.log(`🎯 REAL Connection: ${fromId} → ${toId}`);
                
                // Create our visible particle
                self.createAPIParticle(fromId, toId, 'api-call');
                
                // Call original if it exists
                if (originalAnimate) {
                    originalAnimate.call(this, fromId, toId);
                }
            };
        }
        
        // Intercept fetch to catch ALL API calls
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = async function(...args) {
            const url = args[0];
            
            // Check if this is an API call to our backend
            if (url.includes('/api/v1/generate')) {
                console.log('🌟 REAL API GENERATION CALL DETECTED!');
                
                // Show particles for the actual API flow
                self.createAPIParticle('input', 'hub', 'api-start');
                
                setTimeout(() => self.createAPIParticle('hub', 'prima', 'phase-1'), 500);
                setTimeout(() => self.createAPIParticle('hub', 'solutio', 'phase-2'), 1500);
                setTimeout(() => self.createAPIParticle('hub', 'coagulatio', 'phase-3'), 2500);
                setTimeout(() => self.createAPIParticle('hub', 'output', 'complete'), 3500);
            }
            
            // Call original fetch
            return originalFetch.apply(this, args);
        };
    }
}

// Create global instance
window.realAPIParticles = new RealAPIParticles();

// Also override the submit handler to ensure we catch form submissions
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('prompt-form') || document.getElementById('generate-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            console.log('📝 FORM SUBMITTED - REAL API CALL STARTING!');
            
            // Create initial particle
            if (window.realAPIParticles) {
                window.realAPIParticles.createAPIParticle('input', 'hub', 'form-submit');
            }
        });
    }
});

// Add CSS for animations
const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(20px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
    }
    
    #real-api-particles {
        pointer-events: none;
        z-index: 99999 !important;
    }
    
    .real-api-particle {
        z-index: 99999 !important;
    }
`;
document.head.appendChild(style);

console.log('✅ Real API Particle System ready!');
console.log('🎯 Submit a prompt to see REAL API particles!');