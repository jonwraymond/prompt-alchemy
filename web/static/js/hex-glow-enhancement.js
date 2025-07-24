// Hexagon Glow Enhancement - Adds diffusion/blur and synchronized glow effects
console.log('✨ Hexagon Glow Enhancement initializing...');

class HexGlowEnhancement {
    constructor() {
        this.enhancedNodes = new Set();
        this.init();
    }
    
    init() {
        // Wait for DOM and hex nodes to be ready
        setTimeout(() => {
            this.setupGlowFilters();
            this.enhanceHexagons();
            this.startPulseAnimation();
            console.log('✅ Hexagon glow enhancement initialized');
        }, 1500);
    }
    
    setupGlowFilters() {
        const svg = document.getElementById('hex-flow-board') || document.querySelector('svg');
        if (!svg) return;
        
        let defs = svg.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svg.insertBefore(defs, svg.firstChild);
        }
        
        // Create different glow filters for each hex type
        const glowTypes = [
            { id: 'hex-glow-prima', color: '#ff6b6b', blur: 8 },
            { id: 'hex-glow-solutio', color: '#4ecdc4', blur: 8 },
            { id: 'hex-glow-coagulatio', color: '#45b7d1', blur: 8 },
            { id: 'hex-glow-core', color: '#ff6b35', blur: 10 },
            { id: 'hex-glow-special', color: '#ffd700', blur: 10 },
            { id: 'hex-glow-enhanced', color: '#a29bfe', blur: 6 },
            { id: 'hex-glow-provider', color: '#74b9ff', blur: 6 },
            { id: 'hex-glow-default', color: '#ffffff', blur: 6 }
        ];
        
        glowTypes.forEach(glow => {
            // Create filter for diffusion effect
            const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
            filter.setAttribute('id', glow.id);
            filter.setAttribute('x', '-100%');
            filter.setAttribute('y', '-100%');
            filter.setAttribute('width', '300%');
            filter.setAttribute('height', '300%');
            
            // Gaussian blur for diffusion
            const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
            feGaussianBlur.setAttribute('in', 'SourceGraphic');
            feGaussianBlur.setAttribute('stdDeviation', glow.blur);
            feGaussianBlur.setAttribute('result', 'coloredBlur');
            
            // Color matrix to enhance the glow color
            const feColorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
            feColorMatrix.setAttribute('in', 'coloredBlur');
            feColorMatrix.setAttribute('mode', 'matrix');
            feColorMatrix.setAttribute('values', `0 0 0 0 ${this.hexToRgb(glow.color).r/255}
                                                  0 0 0 0 ${this.hexToRgb(glow.color).g/255}
                                                  0 0 0 0 ${this.hexToRgb(glow.color).b/255}
                                                  0 0 0 1 0`);
            feColorMatrix.setAttribute('result', 'coloredGlow');
            
            // Merge the glow with the original
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
        
        // Create animated radial gradients
        this.createAnimatedGradients(defs);
    }
    
    createAnimatedGradients(defs) {
        const gradientTypes = [
            { id: 'hex-gradient-prima', color1: '#ff6b6b', color2: '#ff8e8e' },
            { id: 'hex-gradient-solutio', color1: '#4ecdc4', color2: '#6eddd5' },
            { id: 'hex-gradient-coagulatio', color1: '#45b7d1', color2: '#65c7e1' },
            { id: 'hex-gradient-core', color1: '#ff6b35', color2: '#ff8555' },
            { id: 'hex-gradient-special', color1: '#ffd700', color2: '#ffed4e' }
        ];
        
        gradientTypes.forEach(grad => {
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
            gradient.setAttribute('id', grad.id);
            
            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', grad.color1);
            stop1.setAttribute('stop-opacity', '0.3');
            
            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '50%');
            stop2.setAttribute('stop-color', grad.color2);
            stop2.setAttribute('stop-opacity', '0.2');
            
            const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop3.setAttribute('offset', '100%');
            stop3.setAttribute('stop-color', grad.color1);
            stop3.setAttribute('stop-opacity', '0');
            
            gradient.appendChild(stop1);
            gradient.appendChild(stop2);
            gradient.appendChild(stop3);
            defs.appendChild(gradient);
        });
    }
    
    enhanceHexagons() {
        const hexNodes = document.querySelectorAll('.hex-node');
        
        hexNodes.forEach(node => {
            const nodeId = node.getAttribute('data-id');
            if (this.enhancedNodes.has(nodeId)) return;
            
            // Determine node type for appropriate glow
            let glowType = 'default';
            let gradientType = null;
            
            if (nodeId === 'hub') {
                glowType = 'core';
                gradientType = 'core';
            } else if (['input', 'output'].includes(nodeId)) {
                glowType = 'special';
                gradientType = 'special';
            } else if (nodeId === 'prima') {
                glowType = 'prima';
                gradientType = 'prima';
            } else if (nodeId === 'solutio') {
                glowType = 'solutio';
                gradientType = 'solutio';
            } else if (nodeId === 'coagulatio') {
                glowType = 'coagulatio';
                gradientType = 'coagulatio';
            } else if (['parse', 'extract', 'flow', 'refine', 'validate', 'finalize', 'optimize', 'judge'].includes(nodeId)) {
                glowType = 'enhanced';
            } else if (['openai', 'anthropic', 'google', 'ollama', 'grok', 'openrouter'].includes(nodeId)) {
                glowType = 'provider';
            }
            
            // Create glow background element
            const glowBg = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const hexagon = node.querySelector('polygon');
            if (hexagon) {
                glowBg.setAttribute('points', hexagon.getAttribute('points'));
                glowBg.setAttribute('fill', gradientType ? `url(#hex-gradient-${gradientType})` : 'none');
                glowBg.setAttribute('stroke', hexagon.getAttribute('stroke'));
                glowBg.setAttribute('stroke-width', '2');
                glowBg.setAttribute('opacity', '0.5');
                glowBg.setAttribute('filter', `url(#hex-glow-${glowType})`);
                glowBg.setAttribute('class', 'hex-glow-bg');
                
                // Insert before the main hexagon
                node.insertBefore(glowBg, hexagon);
            }
            
            // Add pulsing class
            node.classList.add('hex-pulse-active');
            node.setAttribute('data-glow-type', glowType);
            
            this.enhancedNodes.add(nodeId);
        });
    }
    
    startPulseAnimation() {
        // Add CSS for synchronized pulsing
        const style = document.createElement('style');
        style.textContent = `
            /* Synchronized hex pulse animation */
            .hex-pulse-active {
                animation: hex-pulse 3s ease-in-out infinite;
            }
            
            @keyframes hex-pulse {
                0%, 100% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.05);
                    opacity: 0.9;
                }
            }
            
            /* Glow background pulse */
            .hex-glow-bg {
                animation: glow-pulse 3s ease-in-out infinite;
                transform-origin: center;
            }
            
            @keyframes glow-pulse {
                0%, 100% {
                    opacity: 0.3;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.6;
                    transform: scale(1.1);
                }
            }
            
            /* Different pulse delays for variety */
            .hex-node:nth-child(even) .hex-glow-bg {
                animation-delay: 0.3s;
            }
            
            .hex-node:nth-child(3n) .hex-glow-bg {
                animation-delay: 0.6s;
            }
            
            .hex-node:nth-child(5n) .hex-glow-bg {
                animation-delay: 0.9s;
            }
            
            /* Enhanced hover effect */
            .hex-node:hover .hex-glow-bg {
                animation: glow-pulse-hover 0.5s ease-in-out;
                opacity: 0.8 !important;
            }
            
            @keyframes glow-pulse-hover {
                0% {
                    transform: scale(1.1);
                }
                50% {
                    transform: scale(1.2);
                }
                100% {
                    transform: scale(1.1);
                }
            }
            
            /* Core node special animation */
            [data-id="hub"] .hex-glow-bg {
                animation: core-pulse 2s ease-in-out infinite;
            }
            
            @keyframes core-pulse {
                0%, 100% {
                    opacity: 0.4;
                    transform: scale(1) rotate(0deg);
                }
                50% {
                    opacity: 0.7;
                    transform: scale(1.15) rotate(5deg);
                }
            }
            
            /* Special nodes (input/output) animation */
            [data-id="input"] .hex-glow-bg,
            [data-id="output"] .hex-glow-bg {
                animation: special-pulse 2.5s ease-in-out infinite;
            }
            
            @keyframes special-pulse {
                0%, 100% {
                    opacity: 0.5;
                    transform: scale(1);
                    filter: brightness(1);
                }
                50% {
                    opacity: 0.8;
                    transform: scale(1.2);
                    filter: brightness(1.2);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }
    
    // Method to manually trigger glow on specific node
    triggerGlow(nodeId, intensity = 1) {
        const node = document.querySelector(`[data-id="${nodeId}"]`);
        if (!node) return;
        
        const glowBg = node.querySelector('.hex-glow-bg');
        if (glowBg) {
            glowBg.style.opacity = Math.min(intensity, 1);
            glowBg.style.transform = `scale(${1 + intensity * 0.2})`;
            
            // Reset after animation
            setTimeout(() => {
                glowBg.style.opacity = '';
                glowBg.style.transform = '';
            }, 500);
        }
    }
}

// Initialize hex glow enhancement
window.hexGlowEnhancement = new HexGlowEnhancement();

// Expose control functions
window.hexGlow = {
    trigger: (nodeId, intensity) => window.hexGlowEnhancement.triggerGlow(nodeId, intensity),
    enhance: () => window.hexGlowEnhancement.enhanceHexagons()
};

console.log('🎮 Hex glow controls:');
console.log('  hexGlow.trigger("hub", 1.5) - Trigger glow on specific node');
console.log('  hexGlow.enhance() - Re-enhance all hexagons');