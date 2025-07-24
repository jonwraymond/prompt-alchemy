// Force Grid Positions - Aggressive override for hex node positioning
(function() {
    'use strict';
    
    // Fixed grid positions - no clustering allowed!
    const GRID_POSITIONS = {
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
    
    // Force positions immediately
    function forcePositions() {
        const nodes = document.querySelectorAll('.hex-node[data-id]');
        let fixed = 0;
        
        nodes.forEach(node => {
            const nodeId = node.getAttribute('data-id');
            const position = GRID_POSITIONS[nodeId];
            
            if (position) {
                node.setAttribute('transform', `translate(${position.x}, ${position.y})`);
                fixed++;
            }
        });
        
        if (fixed > 0) {
            console.log(`✅ Fixed ${fixed} node positions`);
        }
    }
    
    // Override UnifiedHexFlow's radial layout
    function overrideRadialLayout() {
        if (typeof UnifiedHexFlow !== 'undefined') {
            // Replace the generateRadialLayout method
            UnifiedHexFlow.prototype.generateRadialLayout = function() {
                console.log('🎯 Using FORCED grid layout instead of radial');
                const nodeDefinitions = [];
                
                // Create node definitions with our fixed positions
                Object.entries(GRID_POSITIONS).forEach(([id, pos]) => {
                    nodeDefinitions.push({
                        id: id,
                        x: pos.x,
                        y: pos.y,
                        title: id.charAt(0).toUpperCase() + id.slice(1),
                        icon: '🔷',
                        color: '#00ff88',
                        type: 'process'
                    });
                });
                
                return nodeDefinitions;
            };
            
            console.log('✅ Radial layout overridden with grid positions');
        }
    }
    
    // Apply fixes on multiple events
    function applyFixes() {
        overrideRadialLayout();
        forcePositions();
    }
    
    // Initial application
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyFixes);
    } else {
        applyFixes();
    }
    
    // Reapply periodically to combat any resets
    setInterval(forcePositions, 500);
    
    // Override setAttribute to prevent position changes
    const originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, value) {
        if (name === 'transform' && this.classList && this.classList.contains('hex-node')) {
            const nodeId = this.getAttribute('data-id');
            if (nodeId && GRID_POSITIONS[nodeId]) {
                // Force our position instead
                value = `translate(${GRID_POSITIONS[nodeId].x}, ${GRID_POSITIONS[nodeId].y})`;
            }
        }
        return originalSetAttribute.call(this, name, value);
    };
    
    // Expose manual fix function
    window.fixHexPositions = function() {
        console.log('🔧 Manually fixing hex positions...');
        applyFixes();
    };
    
    console.log('🚀 Force Grid Positions loaded - hexagons will stay in place!');
})();