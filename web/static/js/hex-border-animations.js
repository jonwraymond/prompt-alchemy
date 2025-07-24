// HEX BORDER ANIMATIONS - Vortex and transmutation effects on hex borders

(function() {
    'use strict';
    
    console.log('🔮 Hex Border Animations initializing...');
    
    // Create animated border for input hex
    function createInputHexVortex(hexNode) {
        if (!hexNode) return;
        
        const polygon = hexNode.querySelector('polygon');
        if (!polygon) return;
        
        // Clone the polygon for border effects
        const vortexBorder1 = polygon.cloneNode(true);
        const vortexBorder2 = polygon.cloneNode(true);
        const vortexBorder3 = polygon.cloneNode(true);
        
        // Style the vortex borders
        vortexBorder1.setAttribute('class', 'vortex-border vortex-border-1');
        vortexBorder1.setAttribute('fill', 'none');
        vortexBorder1.setAttribute('stroke', '#ffcc33');
        vortexBorder1.setAttribute('stroke-width', '3');
        vortexBorder1.setAttribute('opacity', '0.6');
        vortexBorder1.style.transformOrigin = 'center';
        
        vortexBorder2.setAttribute('class', 'vortex-border vortex-border-2');
        vortexBorder2.setAttribute('fill', 'none');
        vortexBorder2.setAttribute('stroke', '#ff9933');
        vortexBorder2.setAttribute('stroke-width', '2');
        vortexBorder2.setAttribute('opacity', '0.4');
        vortexBorder2.style.transformOrigin = 'center';
        
        vortexBorder3.setAttribute('class', 'vortex-border vortex-border-3');
        vortexBorder3.setAttribute('fill', 'none');
        vortexBorder3.setAttribute('stroke', '#ffcc33');
        vortexBorder3.setAttribute('stroke-width', '1');
        vortexBorder3.setAttribute('opacity', '0.3');
        vortexBorder3.style.transformOrigin = 'center';
        
        // Add stroke dash for spinning effect
        vortexBorder1.setAttribute('stroke-dasharray', '20 10');
        vortexBorder2.setAttribute('stroke-dasharray', '15 15');
        vortexBorder3.setAttribute('stroke-dasharray', '10 20');
        
        // Insert after the original polygon
        polygon.parentNode.insertBefore(vortexBorder3, polygon.nextSibling);
        polygon.parentNode.insertBefore(vortexBorder2, polygon.nextSibling);
        polygon.parentNode.insertBefore(vortexBorder1, polygon.nextSibling);
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes vortex-spin-1 {
                from { 
                    stroke-dashoffset: 0;
                    transform: rotate(0deg) scale(1);
                }
                to { 
                    stroke-dashoffset: 60;
                    transform: rotate(360deg) scale(1.1);
                }
            }
            @keyframes vortex-spin-2 {
                from { 
                    stroke-dashoffset: 0;
                    transform: rotate(0deg) scale(1);
                }
                to { 
                    stroke-dashoffset: -60;
                    transform: rotate(-360deg) scale(1.2);
                }
            }
            @keyframes vortex-spin-3 {
                from { 
                    stroke-dashoffset: 0;
                    transform: rotate(0deg) scale(1);
                }
                to { 
                    stroke-dashoffset: 90;
                    transform: rotate(720deg) scale(1.3);
                }
            }
            .vortex-border-1 {
                animation: vortex-spin-1 3s linear infinite;
            }
            .vortex-border-2 {
                animation: vortex-spin-2 4s linear infinite;
            }
            .vortex-border-3 {
                animation: vortex-spin-3 5s linear infinite;
            }
            .hex-node#input.vortex-active polygon:first-child {
                animation: input-hex-pulse 2s ease-in-out infinite;
            }
            @keyframes input-hex-pulse {
                0%, 100% {
                    stroke: #ffcc33;
                    stroke-width: 2;
                    filter: drop-shadow(0 0 20px #ffcc33);
                }
                50% {
                    stroke: #ff9933;
                    stroke-width: 4;
                    filter: drop-shadow(0 0 40px #ff9933);
                }
            }
        `;
        document.head.appendChild(style);
        
        // Add active class
        hexNode.classList.add('vortex-active');
        
        // Create particles being sucked into the hex
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                createVortexParticle(hexNode);
            }, i * 200);
        }
        
        // Clean up after animation
        return {
            stop: () => {
                vortexBorder1.remove();
                vortexBorder2.remove();
                vortexBorder3.remove();
                hexNode.classList.remove('vortex-active');
                style.remove();
            }
        };
    }
    
    // Create particles being sucked into hex
    function createVortexParticle(hexNode) {
        const svg = hexNode.closest('svg');
        if (!svg) return;
        
        // Get hex center
        const transform = hexNode.getAttribute('transform');
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (!match) return;
        
        const centerX = parseFloat(match[1]);
        const centerY = parseFloat(match[2]);
        
        // Random starting position
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * 40;
        const startX = centerX + Math.cos(angle) * distance;
        const startY = centerY + Math.sin(angle) * distance;
        
        const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        particle.setAttribute('cx', startX);
        particle.setAttribute('cy', startY);
        particle.setAttribute('r', '3');
        particle.setAttribute('fill', '#ffcc33');
        particle.style.filter = 'drop-shadow(0 0 6px #ff9933)';
        
        svg.appendChild(particle);
        
        // Animate to center
        const animation = particle.animate([
            { 
                cx: startX, 
                cy: startY, 
                r: 3, 
                opacity: 0 
            },
            { 
                cx: startX * 0.7 + centerX * 0.3, 
                cy: startY * 0.7 + centerY * 0.3, 
                r: 4, 
                opacity: 1 
            },
            { 
                cx: centerX, 
                cy: centerY, 
                r: 0, 
                opacity: 0 
            }
        ], {
            duration: 1500,
            easing: 'ease-in'
        });
        
        animation.onfinish = () => particle.remove();
    }
    
    // Create golden transmutation border for output hex
    function createOutputHexTransmutation(hexNode) {
        if (!hexNode) return;
        
        const polygon = hexNode.querySelector('polygon');
        if (!polygon) return;
        
        // Clone polygons for multiple border effects
        const goldenBorder = polygon.cloneNode(true);
        const alchemicalBorder1 = polygon.cloneNode(true);
        const alchemicalBorder2 = polygon.cloneNode(true);
        
        // Golden pulsing border
        goldenBorder.setAttribute('class', 'golden-border');
        goldenBorder.setAttribute('fill', 'none');
        goldenBorder.setAttribute('stroke', '#ffd700');
        goldenBorder.setAttribute('stroke-width', '4');
        goldenBorder.setAttribute('opacity', '0.8');
        
        // Alchemical symbol borders
        alchemicalBorder1.setAttribute('class', 'alchemical-border-1');
        alchemicalBorder1.setAttribute('fill', 'none');
        alchemicalBorder1.setAttribute('stroke', '#ffed4e');
        alchemicalBorder1.setAttribute('stroke-width', '2');
        alchemicalBorder1.setAttribute('stroke-dasharray', '5 10');
        alchemicalBorder1.setAttribute('opacity', '0.6');
        
        alchemicalBorder2.setAttribute('class', 'alchemical-border-2');
        alchemicalBorder2.setAttribute('fill', 'none');
        alchemicalBorder2.setAttribute('stroke', '#fff59d');
        alchemicalBorder2.setAttribute('stroke-width', '3');
        alchemicalBorder2.setAttribute('stroke-dasharray', '10 5');
        alchemicalBorder2.setAttribute('opacity', '0.4');
        
        // Insert borders
        polygon.parentNode.insertBefore(alchemicalBorder2, polygon.nextSibling);
        polygon.parentNode.insertBefore(alchemicalBorder1, polygon.nextSibling);
        polygon.parentNode.insertBefore(goldenBorder, polygon.nextSibling);
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes golden-pulse {
                0%, 100% {
                    stroke-width: 4;
                    opacity: 0.8;
                    filter: drop-shadow(0 0 20px #ffd700) drop-shadow(0 0 40px #ffed4e);
                    transform: scale(1);
                }
                50% {
                    stroke-width: 6;
                    opacity: 1;
                    filter: drop-shadow(0 0 40px #ffd700) drop-shadow(0 0 80px #ffed4e);
                    transform: scale(1.05);
                }
            }
            @keyframes alchemical-dash-1 {
                from { stroke-dashoffset: 0; }
                to { stroke-dashoffset: 30; }
            }
            @keyframes alchemical-dash-2 {
                from { stroke-dashoffset: 0; }
                to { stroke-dashoffset: -30; }
            }
            .golden-border {
                animation: golden-pulse 2s ease-in-out infinite;
                transform-origin: center;
            }
            .alchemical-border-1 {
                animation: alchemical-dash-1 20s linear infinite;
            }
            .alchemical-border-2 {
                animation: alchemical-dash-2 15s linear infinite;
            }
            .hex-node#output.transmutation-active polygon:first-child {
                fill: rgba(255, 215, 0, 0.2) !important;
                stroke: #ffd700 !important;
                stroke-width: 3 !important;
                filter: drop-shadow(0 0 30px #ffd700);
                animation: transmutation-glow 3s ease-in-out infinite;
            }
            @keyframes transmutation-glow {
                0%, 100% {
                    fill-opacity: 0.2;
                }
                50% {
                    fill-opacity: 0.4;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Add active class
        hexNode.classList.add('transmutation-active');
        
        // Create golden particle burst
        for (let i = 0; i < 16; i++) {
            setTimeout(() => {
                createGoldenParticle(hexNode);
            }, i * 100);
        }
        
        // Create alchemical rays
        createAlchemicalRays(hexNode);
        
        return {
            stop: () => {
                goldenBorder.remove();
                alchemicalBorder1.remove();
                alchemicalBorder2.remove();
                hexNode.classList.remove('transmutation-active');
                style.remove();
            }
        };
    }
    
    // Create golden burst particles
    function createGoldenParticle(hexNode) {
        const svg = hexNode.closest('svg');
        if (!svg) return;
        
        const transform = hexNode.getAttribute('transform');
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (!match) return;
        
        const centerX = parseFloat(match[1]);
        const centerY = parseFloat(match[2]);
        
        const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        particle.setAttribute('cx', centerX);
        particle.setAttribute('cy', centerY);
        particle.setAttribute('r', '2');
        particle.setAttribute('fill', '#ffd700');
        particle.style.filter = 'drop-shadow(0 0 8px #ffed4e)';
        
        // Random burst direction
        const angle = Math.random() * Math.PI * 2;
        const distance = 60 + Math.random() * 40;
        const endX = centerX + Math.cos(angle) * distance;
        const endY = centerY + Math.sin(angle) * distance;
        
        svg.appendChild(particle);
        
        // Burst animation
        const animation = particle.animate([
            { 
                cx: centerX, 
                cy: centerY, 
                r: 2, 
                opacity: 1 
            },
            { 
                cx: endX, 
                cy: endY, 
                r: 4, 
                opacity: 0 
            }
        ], {
            duration: 2000,
            easing: 'ease-out'
        });
        
        animation.onfinish = () => particle.remove();
    }
    
    // Create alchemical rays around hex
    function createAlchemicalRays(hexNode) {
        const svg = hexNode.closest('svg');
        if (!svg) return;
        
        const transform = hexNode.getAttribute('transform');
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (!match) return;
        
        const centerX = parseFloat(match[1]);
        const centerY = parseFloat(match[2]);
        
        const raysGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        raysGroup.setAttribute('class', 'alchemical-rays');
        raysGroup.style.transformOrigin = `${centerX}px ${centerY}px`;
        
        // Create 8 rays
        for (let i = 0; i < 8; i++) {
            const ray = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const angle = (i * 45) * Math.PI / 180;
            const innerRadius = 35;
            const outerRadius = 70;
            
            ray.setAttribute('x1', centerX + Math.cos(angle) * innerRadius);
            ray.setAttribute('y1', centerY + Math.sin(angle) * innerRadius);
            ray.setAttribute('x2', centerX + Math.cos(angle) * outerRadius);
            ray.setAttribute('y2', centerY + Math.sin(angle) * outerRadius);
            ray.setAttribute('stroke', '#ffd700');
            ray.setAttribute('stroke-width', '2');
            ray.setAttribute('opacity', '0.6');
            ray.style.filter = 'drop-shadow(0 0 10px #ffed4e)';
            
            raysGroup.appendChild(ray);
        }
        
        hexNode.parentNode.insertBefore(raysGroup, hexNode);
        
        // Animate rotation
        raysGroup.animate([
            { transform: `rotate(0deg)` },
            { transform: `rotate(360deg)` }
        ], {
            duration: 20000,
            iterations: Infinity,
            easing: 'linear'
        });
        
        // Fade in
        raysGroup.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], {
            duration: 1000,
            fill: 'forwards'
        });
    }
    
    // Hook into animation system
    function enhanceHexAnimations() {
        const originalAnimate = window.animateCompleteEngineFlow;
        
        window.animateCompleteEngineFlow = async function() {
            console.log('🎭 Starting enhanced hex border animations...');
            
            const inputNode = document.querySelector('[data-id="input"]');
            const outputNode = document.querySelector('[data-id="output"]');
            
            // Start input vortex
            let inputAnimation = null;
            if (inputNode) {
                inputAnimation = createInputHexVortex(inputNode);
            }
            
            // Run original animation
            if (originalAnimate) {
                await originalAnimate();
            }
            
            // When reaching output, trigger transmutation
            const checkForOutput = () => {
                const connection = document.querySelector('[data-connection="hub-output"][data-connection-type="input-output"]');
                if (connection && connection.getAttribute('stroke') === '#ffd700') {
                    if (outputNode) {
                        createOutputHexTransmutation(outputNode);
                    }
                }
            };
            
            // Monitor for output activation
            setTimeout(checkForOutput, 8000);
        };
    }
    
    // Test functions
    window.testHexBorderEffects = function() {
        console.log('🧪 Testing hex border effects...');
        
        const inputNode = document.querySelector('[data-id="input"]');
        const outputNode = document.querySelector('[data-id="output"]');
        
        if (inputNode) {
            console.log('🌀 Creating input vortex...');
            createInputHexVortex(inputNode);
        }
        
        setTimeout(() => {
            if (outputNode) {
                console.log('✨ Creating output transmutation...');
                createOutputHexTransmutation(outputNode);
            }
        }, 3000);
    };
    
    // Initialize
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        setTimeout(() => {
            enhanceHexAnimations();
            console.log('✅ Hex border animations ready!');
            console.log('🧪 Test with: testHexBorderEffects()');
        }, 1500);
    }
    
    init();
    
})();