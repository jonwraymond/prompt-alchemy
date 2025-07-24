// Enhanced Magical Gateway Animations
(function() {
    'use strict';
    
    // Enhanced debug logging
    function debug(message, data = null) {
        const timestamp = new Date().toTimeString().split(' ')[0];
        if (data) {
            console.log(`[${timestamp}] 🌟 GATEWAY: ${message}`, data);
        } else {
            console.log(`[${timestamp}] 🌟 GATEWAY: ${message}`);
        }
    }
    
    // Performance optimization state
    const activeAnimations = new Set();
    const particlePool = [];
    const MAX_PARTICLES = 50;
    
    // Enhanced input vortex creation
    function createInputVortex() {
        debug('Creating enhanced input vortex effect');
        
        const inputNode = document.getElementById('input');
        if (!inputNode) {
            debug('❌ Input node not found');
            return false;
        }
        
        // Clear any existing vortex
        clearInputVortex();
        
        // Add input active state
        inputNode.classList.add('input-active');
        
        // Create vortex container
        const vortex = document.createElement('div');
        vortex.className = 'input-vortex';
        vortex.id = 'input-vortex-effect';
        
        // Enhanced black hole center
        const center = document.createElement('div');
        center.className = 'vortex-center';
        vortex.appendChild(center);
        
        // Enhanced rainbow rings with better timing
        for (let i = 1; i <= 4; i++) {
            const ring = document.createElement('div');
            ring.className = `vortex-ring vortex-ring-${i}`;
            vortex.appendChild(ring);
        }
        
        // Enhanced particle system
        createEnhancedParticles(vortex);
        
        // Enhanced data streams
        createDataStreams(vortex);
        
        // Distortion waves
        createDistortionWaves(vortex);
        
        // Enhanced data fragments
        createDataFragments(vortex);
        
        inputNode.appendChild(vortex);
        
        // Start continuous particle generation
        const particleInterval = setInterval(() => {
            if (document.getElementById('input-vortex-effect')) {
                addContinuousParticles(vortex);
            } else {
                clearInterval(particleInterval);
            }
        }, 200);
        
        activeAnimations.add(particleInterval);
        
        debug('✅ Enhanced input vortex created with continuous particles');
        return true;
    }
    
    // Enhanced particle creation
    function createEnhancedParticles(container) {
        const particleCount = 25; // More particles
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = `input-particle type-${(i % 5) + 1}`;
            
            // Random starting positions around the vortex
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 120 + Math.random() * 80;
            const startX = Math.cos(angle) * radius;
            const startY = Math.sin(angle) * radius;
            
            particle.style.setProperty('--start-x', `${startX}px`);
            particle.style.setProperty('--start-y', `${startY}px`);
            particle.style.left = `calc(50% + ${startX}px)`;
            particle.style.top = `calc(50% + ${startY}px)`;
            particle.style.animationDelay = `${(i * 0.1)}s`;
            
            container.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, 3000 + (i * 100));
        }
    }
    
    // Continuous particle generation
    function addContinuousParticles(container) {
        const count = 3;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = `input-particle type-${Math.floor(Math.random() * 5) + 1}`;
                
                const angle = Math.random() * Math.PI * 2;
                const radius = 100 + Math.random() * 100;
                const startX = Math.cos(angle) * radius;
                const startY = Math.sin(angle) * radius;
                
                particle.style.setProperty('--start-x', `${startX}px`);
                particle.style.setProperty('--start-y', `${startY}px`);
                particle.style.left = `calc(50% + ${startX}px)`;
                particle.style.top = `calc(50% + ${startY}px)`;
                
                container.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.remove();
                    }
                }, 3000);
            }, i * 50);
        }
    }
    
    // Enhanced data streams
    function createDataStreams(container) {
        const streamCount = 12;
        
        for (let i = 0; i < streamCount; i++) {
            const trail = document.createElement('div');
            trail.className = 'data-trail';
            
            const angle = (i / streamCount) * Math.PI * 2;
            const radius = 80 + Math.random() * 40;
            const spiralX = Math.cos(angle) * radius;
            const spiralY = Math.sin(angle) * radius;
            
            trail.style.setProperty('--spiral-x', `${spiralX}px`);
            trail.style.setProperty('--spiral-y', `${spiralY}px`);
            trail.style.left = `calc(50% + ${spiralX}px)`;
            trail.style.top = `calc(50% + ${spiralY}px)`;
            trail.style.animationDelay = `${(i * 0.3)}s`;
            
            container.appendChild(trail);
        }
    }
    
    // Distortion wave effects
    function createDistortionWaves(container) {
        for (let i = 0; i < 3; i++) {
            const wave = document.createElement('div');
            wave.className = 'distortion-wave';
            wave.style.animationDelay = `${i * 1}s`;
            container.appendChild(wave);
        }
    }
    
    // Enhanced data fragments
    function createDataFragments(container) {
        const fragmentCount = 15;
        
        for (let i = 0; i < fragmentCount; i++) {
            const fragment = document.createElement('div');
            fragment.className = 'data-fragment';
            
            const angle = Math.random() * Math.PI * 2;
            const radius = 60 + Math.random() * 80;
            const fragX = Math.cos(angle) * radius;
            const fragY = Math.sin(angle) * radius;
            
            fragment.style.setProperty('--frag-x', `${fragX}px`);
            fragment.style.setProperty('--frag-y', `${fragY}px`);
            fragment.style.left = `calc(50% + ${fragX}px)`;
            fragment.style.top = `calc(50% + ${fragY}px)`;
            fragment.style.animationDelay = `${Math.random() * 2}s`;
            
            container.appendChild(fragment);
        }
    }
    
    // Enhanced output transmutation
    function createOutputTransmutation() {
        debug('Creating enhanced output transmutation effect');
        
        // Try multiple selectors for output node
        let outputNode = document.getElementById('output') || 
                        document.querySelector('[data-id="output"]') ||
                        document.querySelector('.hex-node[data-id="output"]') ||
                        document.querySelector('#output');
        
        if (!outputNode) {
            debug('❌ Output node not found with any selector');
            debug('Available nodes:', Array.from(document.querySelectorAll('[data-id], #output, .hex-node')).map(n => n.id || n.getAttribute('data-id')));
            return false;
        }
        
        debug('✅ Found output node:', outputNode);
        
        // Clear any existing effects
        clearOutputTransmutation();
        
        // Add output active state
        outputNode.classList.add('output-tattoo-active');
        
        // Create enhanced radiant burst
        createEnhancedRadiantBurst(outputNode);
        
        // Create continuous sparkle effects
        createContinuousSparkles(outputNode);
        
        // Trigger tattoo effect after delay
        setTimeout(() => {
            debug('Triggering enhanced tattoo overlay');
            if (window.createOutputTattooEffect) {
                window.createOutputTattooEffect(outputNode);
            }
        }, 1500);
        
        // Add completion crown after full effect
        setTimeout(() => {
            outputNode.classList.add('tattoo-complete');
            debug('✅ Output transmutation complete with crown effect');
        }, 6000);
        
        debug('✅ Enhanced output transmutation created');
        return true;
    }
    
    // Enhanced radiant burst
    function createEnhancedRadiantBurst(container) {
        const burst = document.createElement('div');
        burst.className = 'radiant-burst';
        burst.id = 'radiant-burst-effect';
        
        const rayCount = 16; // More rays
        
        for (let i = 0; i < rayCount; i++) {
            const ray = document.createElement('div');
            ray.className = 'radiant-ray';
            
            const angle = (i / rayCount) * 360;
            const rayLength = 120 + Math.random() * 60;
            const rayX = Math.cos(angle * Math.PI / 180) * (rayLength / 2);
            const rayY = Math.sin(angle * Math.PI / 180) * (rayLength / 2);
            
            ray.style.setProperty('--ray-angle', `${angle}deg`);
            ray.style.setProperty('--ray-x', `${rayX}px`);
            ray.style.setProperty('--ray-y', `${rayY}px`);
            ray.style.transform = `translateX(${rayX}px) translateY(${rayY}px) rotate(${angle}deg)`;
            ray.style.animationDelay = `${(i * 0.1)}s`;
            
            burst.appendChild(ray);
        }
        
        container.appendChild(burst);
        
        // Remove burst after animation
        setTimeout(() => {
            if (burst.parentNode) {
                burst.remove();
            }
        }, 4000);
    }
    
    // Continuous sparkle effects
    function createContinuousSparkles(container) {
        const sparkleInterval = setInterval(() => {
            if (container.classList.contains('output-tattoo-active')) {
                addSparkleWave(container);
            } else {
                clearInterval(sparkleInterval);
            }
        }, 800);
        
        activeAnimations.add(sparkleInterval);
    }
    
    // Add sparkle wave
    function addSparkleWave(container) {
        const sparkleCount = 8;
        
        for (let i = 0; i < sparkleCount; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'golden-sparkle';
                
                const angle = Math.random() * Math.PI * 2;
                const radius = 60 + Math.random() * 80;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                sparkle.style.left = `calc(50% + ${x}px)`;
                sparkle.style.top = `calc(50% + ${y}px)`;
                sparkle.style.animationDelay = `${Math.random() * 0.5}s`;
                
                container.appendChild(sparkle);
                
                setTimeout(() => {
                    if (sparkle.parentNode) {
                        sparkle.remove();
                    }
                }, 4000);
            }, i * 100);
        }
    }
    
    // Cleanup functions
    function clearInputVortex() {
        const existing = document.getElementById('input-vortex-effect');
        if (existing) {
            existing.remove();
        }
        
        const inputNode = document.getElementById('input');
        if (inputNode) {
            inputNode.classList.remove('input-active');
        }
    }
    
    function clearOutputTransmutation() {
        const existing = document.getElementById('radiant-burst-effect');
        if (existing) {
            existing.remove();
        }
        
        const outputNode = document.getElementById('output');
        if (outputNode) {
            outputNode.classList.remove('output-tattoo-active', 'tattoo-complete');
        }
    }
    
    // Clear all active animations
    function clearAllAnimations() {
        activeAnimations.forEach(animation => {
            clearInterval(animation);
        });
        activeAnimations.clear();
        
        clearInputVortex();
        clearOutputTransmutation();
        
        // Clear tattoo effects
        if (window.testTattooEffects && window.testTattooEffects.remove) {
            window.testTattooEffects.remove();
        }
    }
    
    // Enhanced animation flow
    function enhanceAnimationFlow() {
        debug('Installing enhanced animation flow hooks');
        
        // Hook into existing animation system
        const originalAnimateConnection = window.animateConnection;
        if (originalAnimateConnection) {
            window.animateConnection = function(from, to, options = {}) {
                const result = originalAnimateConnection.call(this, from, to, options);
                
                // Trigger input vortex on input connections
                if (from === 'input' || to === 'input') {
                    debug('Input connection detected - triggering vortex');
                    setTimeout(() => createInputVortex(), 500);
                }
                
                // Trigger output effects on output connections
                if (from === 'output' || to === 'output') {
                    debug('Output connection detected - triggering transmutation');
                    setTimeout(() => createOutputTransmutation(), 1000);
                }
                
                return result;
            };
        }
        
        debug('✅ Enhanced animation flow installed');
    }
    
    // Manual test functions
    window.testGatewayEffects = {
        inputVortex: () => {
            debug('Manual input vortex test');
            return createInputVortex();
        },
        
        outputTransmutation: () => {
            debug('Manual output transmutation test');
            return createOutputTransmutation();
        },
        
        completeFlow: () => {
            debug('Manual complete flow test');
            createInputVortex();
            setTimeout(() => createOutputTransmutation(), 3000);
            return true;
        },
        
        clear: () => {
            debug('Clearing all gateway effects');
            clearAllAnimations();
            return true;
        },
        
        status: () => {
            const status = {
                activeAnimations: activeAnimations.size,
                inputActive: !!document.querySelector('.input-active'),
                outputActive: !!document.querySelector('.output-tattoo-active'),
                tattooComplete: !!document.querySelector('.tattoo-complete'),
                vortexPresent: !!document.getElementById('input-vortex-effect'),
                burstPresent: !!document.getElementById('radiant-burst-effect')
            };
            debug('Gateway effects status', status);
            return status;
        }
    };
    
    // Initialize enhanced system
    function init() {
        debug('🚀 Enhanced Magical Gateway Animations initializing...');
        
        // Install enhanced animation flow
        enhanceAnimationFlow();
        
        // Enhanced form submission handling
        const form = document.getElementById('generate-form');
        if (form) {
            // Remove existing listeners by cloning
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            newForm.addEventListener('submit', function(e) {
                debug('📝 Form submission detected - triggering enhanced gateway flow');
                
                // Clear any existing effects first
                clearAllAnimations();
                
                // Trigger input vortex immediately
                setTimeout(() => {
                    createInputVortex();
                    debug('🌀 Input vortex triggered from form submission');
                }, 100);
                
                // Trigger output effects after processing delay
                setTimeout(() => {
                    createOutputTransmutation();
                    debug('⚡ Output transmutation triggered from form processing');
                }, 4000);
            });
            
            debug('✅ Enhanced form submission handler installed');
        }
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', clearAllAnimations);
        
        debug('✅ Enhanced Magical Gateway Animations ready');
        debug('🎮 Test functions available: testGatewayEffects.inputVortex(), testGatewayEffects.outputTransmutation(), testGatewayEffects.completeFlow()');
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();