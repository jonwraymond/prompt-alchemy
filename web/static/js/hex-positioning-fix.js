// Hex Positioning Fix - Emergency fix for clustered nodes
console.log('🚑 Hex Positioning Fix initializing...');

class HexPositioningFix {
    constructor() {
        this.init();
    }
    
    init() {
        // Wait for DOM and existing nodes to be created
        setTimeout(() => {
            this.diagnosePositioningIssue();
            this.fixNodePositions();
            console.log('✅ Hex positioning fix applied');
        }, 2000);
    }
    
    diagnosePositioningIssue() {
        console.log('🔍 Diagnosing positioning issue...');
        
        const svg = document.getElementById('hex-flow-board');
        if (!svg) {
            console.error('❌ SVG not found');
            return;
        }
        
        console.log('SVG viewBox:', svg.getAttribute('viewBox'));
        console.log('SVG dimensions:', {
            width: svg.clientWidth,
            height: svg.clientHeight
        });
        
        const nodes = document.querySelectorAll('.hex-node');
        console.log(`Found ${nodes.length} hex nodes`);
        
        nodes.forEach(node => {
            const transform = node.getAttribute('transform');
            const id = node.getAttribute('data-id');
            console.log(`Node ${id}: ${transform}`);
        });
    }
    
    fixNodePositions() {
        console.log('🔧 Applying position fix...');
        
        // Define correct positions for a 1000x700 viewBox
        const correctPositions = {
            // Core node at center
            'hub': { x: 500, y: 350 },
            
            // Main phases in a triangle around center
            'prima': { x: 360, y: 250 },      // Top-left
            'solutio': { x: 640, y: 250 },    // Top-right  
            'coagulatio': { x: 500, y: 480 }, // Bottom
            
            // Input/Output gateways at far ends
            'input': { x: 180, y: 350 },      // Far left
            'output': { x: 820, y: 350 },     // Far right
            
            // Process nodes around prima (left cluster)
            'parse': { x: 280, y: 180 },
            'extract': { x: 320, y: 120 },
            'validate': { x: 400, y: 120 },
            
            // Process nodes around solutio (right cluster)
            'refine': { x: 720, y: 180 },
            'flow': { x: 680, y: 120 },
            'finalize': { x: 600, y: 120 },
            
            // Process nodes around coagulatio (bottom cluster)
            'optimize': { x: 420, y: 560 },
            'judge': { x: 500, y: 600 },
            'database': { x: 580, y: 560 },
            
            // Provider nodes in outer ring
            'openai': { x: 200, y: 200 },
            'anthropic': { x: 800, y: 200 },
            'google': { x: 200, y: 500 },
            'ollama': { x: 800, y: 500 },
            'grok': { x: 350, y: 600 },
            'openrouter': { x: 650, y: 600 }
        };
        
        // Apply fixes to each node
        Object.entries(correctPositions).forEach(([nodeId, pos]) => {
            const node = document.querySelector(`[data-id="${nodeId}"]`);
            if (node) {
                const oldTransform = node.getAttribute('transform');
                const newTransform = `translate(${pos.x}, ${pos.y})`;
                node.setAttribute('transform', newTransform);
                console.log(`✅ Fixed ${nodeId}: ${oldTransform} → ${newTransform}`);
            } else {
                console.warn(`⚠️ Node ${nodeId} not found in DOM`);
            }
        });
        
        // Also fix any nodes with invalid positions (x=0, y=0 or NaN)
        const allNodes = document.querySelectorAll('.hex-node');
        allNodes.forEach(node => {
            const transform = node.getAttribute('transform');
            const id = node.getAttribute('data-id');
            
            if (!transform || transform.includes('NaN') || transform.includes('translate(0, 0)')) {
                console.warn(`⚠️ Node ${id} has invalid transform: ${transform}`);
                
                // Give it a random valid position if we don't have a defined one
                if (!correctPositions[id]) {
                    const randomX = 200 + Math.random() * 600; // Random x between 200-800
                    const randomY = 150 + Math.random() * 400; // Random y between 150-550
                    const newTransform = `translate(${randomX}, ${randomY})`;
                    node.setAttribute('transform', newTransform);
                    console.log(`🎲 Random position for ${id}: ${newTransform}`);
                }
            }
        });
        
        // Force repaint
        const svg = document.getElementById('hex-flow-board');
        if (svg) {
            svg.style.transform = 'translateZ(0)';
            setTimeout(() => {
                svg.style.transform = '';
            }, 10);
        }
    }
    
    // Method to restore original positioning logic
    restoreOriginalPositioning() {
        console.log('🔄 Restoring original positioning...');
        
        if (window.unifiedHexFlow && window.unifiedHexFlow.generateRadialLayout) {
            const nodeDefinitions = window.unifiedHexFlow.generateRadialLayout();
            
            nodeDefinitions.forEach(nodeDef => {
                const node = document.querySelector(`[data-id="${nodeDef.id}"]`);
                if (node) {
                    const transform = `translate(${nodeDef.x}, ${nodeDef.y})`;
                    node.setAttribute('transform', transform);
                    console.log(`🔄 Restored ${nodeDef.id}: ${transform}`);
                }
            });
        } else {
            console.error('❌ Cannot restore - unifiedHexFlow not available');
        }
    }
    
    // Debug method to show all current positions
    showCurrentPositions() {
        const nodes = document.querySelectorAll('.hex-node');
        console.log('📍 Current node positions:');
        
        nodes.forEach(node => {
            const id = node.getAttribute('data-id');
            const transform = node.getAttribute('transform');
            const match = transform ? transform.match(/translate\(([^,]+),\s*([^)]+)\)/) : null;
            
            if (match) {
                const x = parseFloat(match[1]);
                const y = parseFloat(match[2]);
                console.log(`  ${id}: (${x}, ${y})`);
            } else {
                console.log(`  ${id}: INVALID TRANSFORM - ${transform}`);
            }
        });
    }
}

// Initialize the fix
window.hexPositioningFix = new HexPositioningFix();

// Expose control functions
window.hexPositionControls = {
    fix: () => window.hexPositioningFix.fixNodePositions(),
    restore: () => window.hexPositioningFix.restoreOriginalPositioning(),
    diagnose: () => window.hexPositioningFix.diagnosePositioningIssue(),
    showPositions: () => window.hexPositioningFix.showCurrentPositions()
};

console.log('🎮 Hex position controls:');
console.log('  hexPositionControls.fix() - Apply position fix');
console.log('  hexPositionControls.restore() - Restore original positioning');
console.log('  hexPositionControls.diagnose() - Diagnose issues');
console.log('  hexPositionControls.showPositions() - Show current positions');