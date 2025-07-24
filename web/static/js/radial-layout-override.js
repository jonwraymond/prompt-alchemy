// Radial Layout Override - Complete replacement of radial positioning logic
console.log('🎯 Radial Layout Override initializing...');

(function() {
    // Define the ONLY positions we want
    const FIXED_POSITIONS = {
        'hub': { x: 500, y: 350 },
        'input': { x: 150, y: 350 },
        'output': { x: 850, y: 350 },
        'prima': { x: 350, y: 200 },
        'solutio': { x: 650, y: 200 },
        'coagulatio': { x: 500, y: 500 },
        'parse': { x: 250, y: 150 },
        'extract': { x: 300, y: 100 },
        'validate': { x: 400, y: 100 },
        'refine': { x: 750, y: 150 },
        'flow': { x: 700, y: 100 },
        'finalize': { x: 600, y: 100 },
        'optimize': { x: 400, y: 580 },
        'judge': { x: 500, y: 620 },
        'database': { x: 600, y: 580 },
        'openai': { x: 150, y: 150 },
        'anthropic': { x: 850, y: 150 },
        'google': { x: 150, y: 550 },
        'ollama': { x: 850, y: 550 },
        'grok': { x: 300, y: 600 },
        'openrouter': { x: 700, y: 600 }
    };
    
    // Override Math.cos and Math.sin temporarily during radial calculation
    let overrideMath = false;
    const originalCos = Math.cos;
    const originalSin = Math.sin;
    
    // Create a more aggressive interception
    function interceptRadialCalculations() {
        // Look for any function that calculates positions
        const checkAndOverride = () => {
            // Find all elements with transform attributes
            const elements = document.querySelectorAll('[transform]');
            let fixedCount = 0;
            
            elements.forEach(el => {
                const nodeId = el.getAttribute('data-id');
                if (nodeId && FIXED_POSITIONS[nodeId]) {
                    const currentTransform = el.getAttribute('transform');
                    const expectedTransform = `translate(${FIXED_POSITIONS[nodeId].x}, ${FIXED_POSITIONS[nodeId].y})`;
                    
                    if (currentTransform !== expectedTransform) {
                        el.setAttribute('transform', expectedTransform);
                        fixedCount++;
                    }
                }
            });
            
            if (fixedCount > 0) {
                console.log(`🔧 Fixed ${fixedCount} positions`);
            }
        };
        
        // Run immediately
        checkAndOverride();
        
        // Set up continuous monitoring
        setInterval(checkAndOverride, 100);
        
        // Also intercept setAttribute calls
        const originalSetAttribute = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function(name, value) {
            if (name === 'transform' && this.hasAttribute('data-id')) {
                const nodeId = this.getAttribute('data-id');
                if (FIXED_POSITIONS[nodeId]) {
                    // Force our position
                    value = `translate(${FIXED_POSITIONS[nodeId].x}, ${FIXED_POSITIONS[nodeId].y})`;
                    console.log(`🎯 Intercepted transform for ${nodeId}, forcing: ${value}`);
                }
            }
            return originalSetAttribute.call(this, name, value);
        };
    }
    
    // Start interception immediately
    interceptRadialCalculations();
    
    // Also patch any radial layout functions if they exist
    function patchRadialFunctions() {
        // Wait for UnifiedHexFlow to be defined
        if (typeof UnifiedHexFlow === 'undefined') {
            setTimeout(patchRadialFunctions, 50);
            return;
        }
        
        console.log('🔧 Patching UnifiedHexFlow radial functions...');
        
        // Override the prototype method
        const originalProto = UnifiedHexFlow.prototype.generateRadialLayout;
        UnifiedHexFlow.prototype.generateRadialLayout = function() {
            console.log('🎯 Radial layout COMPLETELY OVERRIDDEN');
            
            // Return our fixed positions as node definitions
            const nodeDefinitions = [];
            
            // Add all nodes with fixed positions
            Object.entries(FIXED_POSITIONS).forEach(([id, pos]) => {
                nodeDefinitions.push({
                    id: id,
                    x: pos.x,
                    y: pos.y,
                    // Include other properties that might be expected
                    title: id.charAt(0).toUpperCase() + id.slice(1),
                    icon: '🔷',
                    color: '#00ff88'
                });
            });
            
            return nodeDefinitions;
        };
        
        // Also override any instance methods
        if (window.hexFlow || window.unifiedHexFlow) {
            const instance = window.hexFlow || window.unifiedHexFlow;
            instance.generateRadialLayout = UnifiedHexFlow.prototype.generateRadialLayout;
        }
        
        console.log('✅ Radial functions patched');
    }
    
    // Start patching
    patchRadialFunctions();
    
    // Nuclear option - rewrite all transforms every frame
    function nuclearPositionEnforcement() {
        const enforce = () => {
            Object.entries(FIXED_POSITIONS).forEach(([nodeId, pos]) => {
                const elements = document.querySelectorAll(`[data-id="${nodeId}"]`);
                elements.forEach(el => {
                    el.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
                });
            });
        };
        
        // Use requestAnimationFrame for smooth updates
        function loop() {
            enforce();
            requestAnimationFrame(loop);
        }
        
        // Start after a delay to ensure DOM is ready
        setTimeout(() => {
            console.log('☢️ Nuclear position enforcement activated');
            loop();
        }, 1000);
    }
    
    // Activate nuclear option
    nuclearPositionEnforcement();
    
    // Expose manual override function
    window.forceCorrectPositions = function() {
        console.log('🔨 Forcing all positions to correct values...');
        
        Object.entries(FIXED_POSITIONS).forEach(([nodeId, pos]) => {
            const elements = document.querySelectorAll(`[data-id="${nodeId}"]`);
            elements.forEach(el => {
                el.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
                console.log(`✅ ${nodeId} → (${pos.x}, ${pos.y})`);
            });
        });
        
        // Update connections if available
        if (window.hexFlow && window.hexFlow.updateConnections) {
            window.hexFlow.updateConnections();
        }
    };
    
    console.log('🎮 Commands:');
    console.log('  forceCorrectPositions() - Manually force all positions');
})();