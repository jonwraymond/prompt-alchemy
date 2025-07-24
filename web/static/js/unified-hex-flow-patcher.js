// Unified Hex Flow Patcher - Fixes positioning by patching the radial layout calculation
console.log('🔧 Unified Hex Flow Patcher initializing...');

// This script MUST run BEFORE hex-flow-unified.js initializes
(function() {
    // Store the original UnifiedHexFlow class if it exists
    let OriginalUnifiedHexFlow = window.UnifiedHexFlow;
    
    // Define optimal positions for proper grid distribution
    const OPTIMAL_POSITIONS = {
        // Central hub
        'hub': { x: 500, y: 350 },
        
        // Primary gateways at extreme ends
        'input': { x: 150, y: 350 },
        'output': { x: 850, y: 350 },
        
        // Main phases in strategic triangle
        'prima': { x: 350, y: 200 },
        'solutio': { x: 650, y: 200 },
        'coagulatio': { x: 500, y: 500 },
        
        // Process nodes around prima (northwest cluster)
        'parse': { x: 250, y: 150 },
        'extract': { x: 300, y: 100 },
        'validate': { x: 400, y: 100 },
        
        // Process nodes around solutio (northeast cluster)
        'refine': { x: 750, y: 150 },
        'flow': { x: 700, y: 100 },
        'finalize': { x: 600, y: 100 },
        
        // Process nodes around coagulatio (south cluster)
        'optimize': { x: 400, y: 580 },
        'judge': { x: 500, y: 620 },
        'database': { x: 600, y: 580 },
        
        // AI providers in outer ring - well spaced
        'openai': { x: 150, y: 150 },
        'anthropic': { x: 850, y: 150 },
        'google': { x: 150, y: 550 },
        'ollama': { x: 850, y: 550 },
        'grok': { x: 300, y: 600 },
        'openrouter': { x: 700, y: 600 }
    };
    
    // Patch function to override radial layout
    function patchRadialLayout() {
        console.log('🔧 Patching UnifiedHexFlow radial layout...');
        
        // Check if UnifiedHexFlow exists
        if (typeof UnifiedHexFlow === 'undefined') {
            console.warn('⚠️ UnifiedHexFlow not found, waiting...');
            setTimeout(patchRadialLayout, 100);
            return;
        }
        
        // Save original generateRadialLayout method
        const originalGenerateRadialLayout = UnifiedHexFlow.prototype.generateRadialLayout;
        
        // Override the method
        UnifiedHexFlow.prototype.generateRadialLayout = function() {
            console.log('🎯 Using patched generateRadialLayout with optimal positions');
            
            // Call original to get the node definitions
            const nodeDefinitions = originalGenerateRadialLayout.call(this);
            
            // Override positions with our optimal layout
            const patchedDefinitions = nodeDefinitions.map(nodeDef => {
                const optimalPos = OPTIMAL_POSITIONS[nodeDef.id];
                if (optimalPos) {
                    console.log(`✅ Patching position for ${nodeDef.id}: (${nodeDef.x}, ${nodeDef.y}) → (${optimalPos.x}, ${optimalPos.y})`);
                    return {
                        ...nodeDef,
                        x: optimalPos.x,
                        y: optimalPos.y
                    };
                } else {
                    console.warn(`⚠️ No optimal position defined for ${nodeDef.id}, using original`);
                    return nodeDef;
                }
            });
            
            return patchedDefinitions;
        };
        
        console.log('✅ UnifiedHexFlow patched successfully');
        
        // Also patch any existing instances
        patchExistingInstances();
    }
    
    // Patch existing instances if they've already been created
    function patchExistingInstances() {
        // Look for the global instance
        if (window.hexFlow && window.hexFlow.nodes) {
            console.log('🔧 Found existing hexFlow instance, repositioning nodes...');
            
            let repositionedCount = 0;
            
            // Reposition all nodes
            Object.entries(OPTIMAL_POSITIONS).forEach(([nodeId, position]) => {
                const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
                if (nodeElement) {
                    const oldTransform = nodeElement.getAttribute('transform');
                    const newTransform = `translate(${position.x}, ${position.y})`;
                    
                    if (oldTransform !== newTransform) {
                        nodeElement.setAttribute('transform', newTransform);
                        console.log(`✅ Repositioned ${nodeId}: ${oldTransform} → ${newTransform}`);
                        repositionedCount++;
                    }
                    
                    // Update the internal node state if it exists
                    const nodeConfig = window.hexFlow.nodes.get(nodeId);
                    if (nodeConfig) {
                        nodeConfig.x = position.x;
                        nodeConfig.y = position.y;
                    }
                }
            });
            
            console.log(`✅ Repositioned ${repositionedCount} nodes`);
            
            // Force redraw of connections
            if (window.hexFlow.updateConnections) {
                console.log('🔄 Updating connections after repositioning...');
                window.hexFlow.updateConnections();
            }
        }
    }
    
    // Emergency position fix function
    window.emergencyFixHexPositions = function() {
        console.log('🚨 Emergency hex position fix activated');
        
        Object.entries(OPTIMAL_POSITIONS).forEach(([nodeId, position]) => {
            const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
            if (nodeElement) {
                nodeElement.setAttribute('transform', `translate(${position.x}, ${position.y})`);
            }
        });
        
        // Update connections if available
        if (window.hexFlow && window.hexFlow.updateConnections) {
            window.hexFlow.updateConnections();
        }
        
        console.log('✅ Emergency fix complete');
    };
    
    // Start patching process
    patchRadialLayout();
    
    // Also patch after a short delay to catch late initializations
    setTimeout(patchRadialLayout, 500);
    setTimeout(patchExistingInstances, 1000);
    setTimeout(patchExistingInstances, 2000);
    
    console.log('🎮 Emergency controls:');
    console.log('  emergencyFixHexPositions() - Force all hexagons to correct positions');
})();