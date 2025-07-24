// Particle Animation Fix - Comprehensive solution for missing particle animations
console.log('🔧 Particle Animation Fix initializing...');

class ParticleAnimationFix {
    constructor() {
        this.debugMode = true;
        this.init();
    }
    
    init() {
        // Wait for other systems to load
        setTimeout(() => {
            this.diagnoseCurrentState();
            this.applyFixes();
            this.testAnimations();
            console.log('✅ Particle animation fix applied');
        }, 3000);
    }
    
    diagnoseCurrentState() {
        console.log('🔍 === PARTICLE ANIMATION DIAGNOSIS ===');
        
        // Check if animation functions exist
        const checks = {
            'window.animateConnection': !!window.animateConnection,
            'window.EngineFlowConnections': !!window.EngineFlowConnections,
            'window.continuousLineAnimations': !!window.continuousLineAnimations
        };
        
        console.log('Animation systems:', checks);
        
        // Check SVG structure
        const svg = document.getElementById('hex-flow-board');
        if (svg) {
            console.log('SVG found:', svg.id);
            console.log('SVG viewBox:', svg.getAttribute('viewBox'));
            
            // Check for connection paths
            const paths = svg.querySelectorAll('[data-connection]');
            console.log(`Found ${paths.length} connection paths`);
            
            paths.forEach(path => {
                const id = path.getAttribute('data-connection');
                const pathId = path.id;
                console.log(`Path ${id}: ID=${pathId || 'MISSING'}`);
            });
            
            // Check for existing particles
            const particles = svg.querySelectorAll('[class*="particle"]');
            console.log(`Found ${particles.length} existing particles`);
        } else {
            console.error('❌ SVG not found!');
        }
    }
    
    applyFixes() {
        console.log('🔧 Applying particle animation fixes...');
        
        // Fix 1: Ensure all paths have IDs BEFORE any animation
        this.ensurePathIds();
        
        // Fix 2: Override animateConnection with fixed version
        this.createFixedAnimateConnection();
        
        // Fix 3: Add CSS for better particle visibility
        this.addParticleCSS();
        
        // Fix 4: Fix timing issues
        this.fixAnimationTiming();
    }
    
    ensurePathIds() {
        console.log('🔧 Ensuring all connection paths have IDs...');
        
        const paths = document.querySelectorAll('[data-connection]');
        let fixedCount = 0;
        
        paths.forEach(path => {
            const connectionKey = path.getAttribute('data-connection');
            if (!path.id) {
                path.id = 'path-' + connectionKey;
                fixedCount++;
                console.log(`✅ Added ID to path: ${path.id}`);
            }
        });
        
        console.log(`✅ Fixed ${fixedCount} path IDs`);
    }
    
    createFixedAnimateConnection() {
        console.log('🔧 Creating fixed animateConnection function...');
        
        // Store original if it exists
        if (window.animateConnection) {
            window.originalAnimateConnection = window.animateConnection;
        }
        
        // Create our fixed version
        window.animateConnection = (connectionKey, direction = 'forward', animationType = 'active-processing') => {
            const timestamp = new Date().toISOString();
            console.log(`🎬 [FIXED] [${timestamp}] animateConnection called:`, {connectionKey, direction, animationType});
            
            const path = document.querySelector(`[data-connection="${connectionKey}"]`);
            if (!path) {
                console.warn(`❌ Connection ${connectionKey} not found`);
                return;
            }
            
            // CRITICAL FIX: Ensure path has ID BEFORE creating mpath
            if (!path.id) {
                path.id = 'path-' + connectionKey;
                console.log(`✅ [FIXED] Added ID to path: ${path.id}`);
            }
            
            // Get style for particle
            const CONNECTION_LEGEND = window.EngineFlowConnections?.CONNECTION_LEGEND || {
                'active-processing': { stroke: '#10a37f', strokeWidth: 3 },
                'input-output': { stroke: '#ffd700', strokeWidth: 3 },
                'ready-flow': { stroke: '#ff6b35', strokeWidth: 3 },
                'standby': { stroke: '#6c757d', strokeWidth: 2 }
            };
            
            const style = CONNECTION_LEGEND[animationType];
            if (!style) {
                console.error(`❌ No style found for animation type: ${animationType}`);
                return;
            }
            
            // Create particle with fixed implementation
            this.createFixedParticle(path, style, connectionKey, direction, animationType);
        };
        
        console.log('✅ Fixed animateConnection function created');
    }
    
    createFixedParticle(path, style, connectionKey, direction, animationType) {
        const svg = document.getElementById('hex-flow-board');
        if (!svg) return;
        
        const animClass = `flow-anim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`🎯 Creating particle with class: ${animClass}`);
        
        // Create particle group
        const particleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        particleGroup.setAttribute('class', `flow-particle-group-${animClass}`);
        particleGroup.setAttribute('id', `particle-group-${animClass}`);
        
        // Create visible particle
        const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        particle.setAttribute('r', '8'); // Larger for visibility
        particle.setAttribute('fill', style.stroke);
        particle.setAttribute('opacity', '1');
        particle.setAttribute('class', `flow-particle-${animClass}`);
        particle.style.filter = `drop-shadow(0 0 12px ${style.stroke})`;
        
        particleGroup.appendChild(particle);
        
        // Create animateMotion with VERIFIED path reference
        const animateMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        animateMotion.setAttribute('dur', '3s'); // Slower for visibility
        animateMotion.setAttribute('repeatCount', 'indefinite'); // Continuous for debugging
        animateMotion.setAttribute('begin', '0s');
        
        // CRITICAL FIX: Verify path ID exists before creating mpath
        console.log(`🔍 Path ID verification: ${path.id}`);
        
        const mpath = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
        mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${path.id}`);
        
        animateMotion.appendChild(mpath);
        particleGroup.appendChild(animateMotion);
        
        // Add to SVG at top level for maximum visibility
        svg.appendChild(particleGroup);
        
        console.log(`✅ Particle created and added to SVG:`, {
            particleId: particleGroup.id,
            pathId: path.id,
            mpathHref: mpath.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
        });
        
        // Remove after 10 seconds for debugging
        setTimeout(() => {
            if (particleGroup.parentNode) {
                particleGroup.remove();
                console.log(`🗑️ Removed particle: ${animClass}`);
            }
        }, 10000);
    }
    
    addParticleCSS() {
        console.log('🎨 Adding particle visibility CSS...');
        
        const style = document.createElement('style');
        style.textContent = `
            /* Enhanced particle visibility */
            [class*="flow-particle"] {
                z-index: 1000 !important;
                pointer-events: none !important;
            }
            
            [class*="flow-particle-group"] {
                z-index: 1000 !important;
                pointer-events: none !important;
            }
            
            /* Ensure particles are above everything else */
            #hex-flow-board [id*="particle-group"] {
                z-index: 999999 !important;
            }
            
            /* Make particles more visible */
            .flow-particle-group circle {
                stroke: white !important;
                stroke-width: 1 !important;
                opacity: 1 !important;
            }
            
            /* Debug particle visibility */
            .debug-particle {
                fill: #ff0000 !important;
                stroke: #ffffff !important;
                stroke-width: 2 !important;
                opacity: 1 !important;
                r: 10 !important;
            }
        `;
        document.head.appendChild(style);
        
        console.log('✅ Particle CSS added');
    }
    
    fixAnimationTiming() {
        console.log('⏰ Fixing animation timing issues...');
        
        // Override continuous animations to use our fixed function
        if (window.continuousLineAnimations) {
            console.log('🔄 Restarting continuous animations with fix...');
            window.continuousLineAnimations.stopAllAnimations();
            
            setTimeout(() => {
                window.continuousLineAnimations.setupContinuousAnimations();
            }, 1000);
        }
    }
    
    testAnimations() {
        console.log('🧪 Running animation tests...');
        
        // Test 1: Single animation
        setTimeout(() => {
            console.log('🧪 Test 1: Single animation test');
            if (window.animateConnection) {
                window.animateConnection('input-hub', 'forward', 'active-processing');
            }
        }, 2000);
        
        // Test 2: Multiple animations
        setTimeout(() => {
            console.log('🧪 Test 2: Multiple animation test');
            const testConnections = ['input-prima', 'prima-hub', 'hub-output'];
            testConnections.forEach((conn, index) => {
                setTimeout(() => {
                    if (window.animateConnection) {
                        window.animateConnection(conn, 'forward', 'input-output');
                    }
                }, index * 500);
            });
        }, 5000);
        
        // Test 3: Create debug particle that's definitely visible
        setTimeout(() => {
            this.createDebugParticle();
        }, 8000);
    }
    
    createDebugParticle() {
        console.log('🐛 Creating debug particle for visibility test...');
        
        const svg = document.getElementById('hex-flow-board');
        if (!svg) return;
        
        // Create a simple red circle that moves in a straight line
        const debugGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        debugGroup.id = 'debug-particle-group';
        
        const debugParticle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        debugParticle.setAttribute('r', '15');
        debugParticle.setAttribute('fill', '#ff0000');
        debugParticle.setAttribute('stroke', '#ffffff');
        debugParticle.setAttribute('stroke-width', '3');
        debugParticle.setAttribute('opacity', '1');
        debugParticle.setAttribute('class', 'debug-particle');
        
        debugGroup.appendChild(debugParticle);
        
        // Create simple linear animation
        const animateTransform = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        animateTransform.setAttribute('attributeName', 'transform');
        animateTransform.setAttribute('type', 'translate');
        animateTransform.setAttribute('values', '100,350; 900,350; 100,350');
        animateTransform.setAttribute('dur', '4s');
        animateTransform.setAttribute('repeatCount', 'indefinite');
        
        debugGroup.appendChild(animateTransform);
        svg.appendChild(debugGroup);
        
        console.log('🐛 Debug particle created - should be visible as red circle moving horizontally');
        
        // Remove after 20 seconds
        setTimeout(() => {
            debugGroup.remove();
            console.log('🐛 Debug particle removed');
        }, 20000);
    }
    
    // Manual trigger function
    triggerTest() {
        console.log('🔥 Manual test trigger activated');
        
        if (window.animateConnection) {
            window.animateConnection('input-hub', 'forward', 'active-processing');
            setTimeout(() => window.animateConnection('hub-output', 'forward', 'input-output'), 1000);
            setTimeout(() => window.animateConnection('prima-hub', 'forward', 'ready-flow'), 2000);
        }
        
        this.createDebugParticle();
    }
}

// Initialize the fix
window.particleAnimationFix = new ParticleAnimationFix();

// Expose control functions
window.particleDebug = {
    test: () => window.particleAnimationFix.triggerTest(),
    diagnose: () => window.particleAnimationFix.diagnoseCurrentState(),
    createDebug: () => window.particleAnimationFix.createDebugParticle(),
    fix: () => window.particleAnimationFix.applyFixes()
};

console.log('🎮 Particle debug controls:');
console.log('  particleDebug.test() - Run animation tests');
console.log('  particleDebug.diagnose() - Diagnose current state');
console.log('  particleDebug.createDebug() - Create visible debug particle');
console.log('  particleDebug.fix() - Re-apply fixes');