// Positioning Diagnostic Tool - Debug why hexagons are still clustering
console.log('🔍 Positioning Diagnostic Tool Starting...');

class PositioningDiagnostic {
    constructor() {
        this.diagnosticResults = {
            timestamp: new Date().toISOString(),
            scriptsLoaded: {},
            hexagonPositions: {},
            svgState: {},
            unifiedHexFlowState: {},
            errors: []
        };
        
        this.runDiagnostics();
    }
    
    runDiagnostics() {
        console.log('🏃 Running comprehensive positioning diagnostics...');
        
        // Check script loading order
        this.checkScriptLoading();
        
        // Wait for DOM and scripts to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.performChecks());
        } else {
            this.performChecks();
        }
        
        // Also check after delays
        setTimeout(() => this.performChecks('1s delay'), 1000);
        setTimeout(() => this.performChecks('3s delay'), 3000);
        setTimeout(() => this.performChecks('5s delay'), 5000);
    }
    
    checkScriptLoading() {
        // Check if our patches are loaded
        this.diagnosticResults.scriptsLoaded = {
            unifiedHexFlowPatcher: typeof window.emergencyFixHexPositions === 'function',
            positionEnforcer: typeof window.positionEnforcer === 'object',
            gridLayoutDebugger: typeof window.gridLayoutDebugger === 'object',
            hexagonPositionStabilizer: typeof window.hexagonPositionStabilizer === 'object',
            unifiedHexFlow: typeof window.UnifiedHexFlow === 'function',
            hexFlowInstance: !!window.hexFlow
        };
        
        console.log('📜 Script Loading Status:', this.diagnosticResults.scriptsLoaded);
    }
    
    performChecks(phase = 'initial') {
        console.log(`\n🔍 Performing checks (${phase})...`);
        
        // Check SVG state
        this.checkSVGState();
        
        // Check hexagon positions
        this.checkHexagonPositions();
        
        // Check UnifiedHexFlow state
        this.checkUnifiedHexFlowState();
        
        // Check for transform issues
        this.checkTransformIssues();
        
        // Generate report
        this.generateReport(phase);
    }
    
    checkSVGState() {
        const svg = document.getElementById('hex-flow-board');
        if (!svg) {
            this.diagnosticResults.errors.push('SVG element not found');
            return;
        }
        
        this.diagnosticResults.svgState = {
            exists: true,
            viewBox: svg.getAttribute('viewBox'),
            width: svg.getAttribute('width'),
            height: svg.getAttribute('height'),
            transform: svg.style.transform || 'none',
            transformOrigin: svg.style.transformOrigin || 'none',
            parentWidth: svg.parentElement?.offsetWidth,
            parentHeight: svg.parentElement?.offsetHeight,
            computedStyle: {
                transform: window.getComputedStyle(svg).transform,
                width: window.getComputedStyle(svg).width,
                height: window.getComputedStyle(svg).height
            }
        };
        
        console.log('📐 SVG State:', this.diagnosticResults.svgState);
    }
    
    checkHexagonPositions() {
        const nodes = document.querySelectorAll('.hex-node');
        const positions = {};
        const clustering = {
            total: nodes.length,
            clustered: 0,
            correct: 0,
            missing: 0
        };
        
        nodes.forEach(node => {
            const nodeId = node.getAttribute('data-id');
            const transform = node.getAttribute('transform');
            const match = transform ? transform.match(/translate\(([^,]+),\s*([^)]+)\)/) : null;
            
            if (match) {
                const x = parseFloat(match[1]);
                const y = parseFloat(match[2]);
                
                positions[nodeId] = {
                    x: x,
                    y: y,
                    transform: transform,
                    isClustered: x < 100 && y < 100,
                    className: node.getAttribute('class')
                };
                
                if (x < 100 && y < 100) {
                    clustering.clustered++;
                } else {
                    clustering.correct++;
                }
            } else {
                positions[nodeId] = {
                    x: null,
                    y: null,
                    transform: transform || 'none',
                    error: 'No valid transform'
                };
                clustering.missing++;
            }
        });
        
        this.diagnosticResults.hexagonPositions = {
            positions: positions,
            clustering: clustering
        };
        
        console.log('🔶 Hexagon Positions:', clustering);
        console.log('📍 Individual Positions:', positions);
    }
    
    checkUnifiedHexFlowState() {
        if (!window.hexFlow && !window.unifiedHexFlow) {
            this.diagnosticResults.unifiedHexFlowState = {
                error: 'No UnifiedHexFlow instance found'
            };
            return;
        }
        
        const instance = window.hexFlow || window.unifiedHexFlow;
        
        // Check if generateRadialLayout was patched
        const isPatched = instance.constructor.prototype.generateRadialLayout.toString().includes('patched');
        
        this.diagnosticResults.unifiedHexFlowState = {
            instanceExists: true,
            nodeCount: instance.nodes ? instance.nodes.size : 0,
            isPatched: isPatched,
            prototypeString: instance.constructor.prototype.generateRadialLayout.toString().substring(0, 200)
        };
        
        console.log('🎯 UnifiedHexFlow State:', this.diagnosticResults.unifiedHexFlowState);
    }
    
    checkTransformIssues() {
        // Check all parent elements for transforms
        const svg = document.getElementById('hex-flow-board');
        if (!svg) return;
        
        const transforms = [];
        let element = svg;
        
        while (element && element !== document.body) {
            const transform = window.getComputedStyle(element).transform;
            if (transform && transform !== 'none') {
                transforms.push({
                    element: element.tagName + (element.id ? '#' + element.id : ''),
                    transform: transform
                });
            }
            element = element.parentElement;
        }
        
        this.diagnosticResults.parentTransforms = transforms;
        
        if (transforms.length > 0) {
            console.warn('⚠️ Parent transforms detected:', transforms);
        }
    }
    
    generateReport(phase) {
        console.log(`\n📊 DIAGNOSTIC REPORT (${phase})`);
        console.log('=' .repeat(50));
        
        // Script loading
        console.log('\n📜 Script Loading:');
        Object.entries(this.diagnosticResults.scriptsLoaded).forEach(([script, loaded]) => {
            console.log(`  ${loaded ? '✅' : '❌'} ${script}`);
        });
        
        // Clustering status
        const clustering = this.diagnosticResults.hexagonPositions.clustering;
        if (clustering) {
            console.log('\n🔶 Hexagon Distribution:');
            console.log(`  Total nodes: ${clustering.total}`);
            console.log(`  Clustered: ${clustering.clustered} ${clustering.clustered > 0 ? '❌' : '✅'}`);
            console.log(`  Correct: ${clustering.correct}`);
            console.log(`  Missing: ${clustering.missing}`);
        }
        
        // Patching status
        console.log('\n🔧 Patching Status:');
        console.log(`  UnifiedHexFlow patched: ${this.diagnosticResults.unifiedHexFlowState.isPatched ? '✅' : '❌'}`);
        
        // Errors
        if (this.diagnosticResults.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.diagnosticResults.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        console.log('\n' + '=' .repeat(50));
        
        // Store results globally
        window.positioningDiagnostic = this.diagnosticResults;
    }
    
    // Manual fix attempt
    attemptManualFix() {
        console.log('\n🔧 Attempting manual fix...');
        
        const optimalPositions = {
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
        
        let fixed = 0;
        
        Object.entries(optimalPositions).forEach(([nodeId, pos]) => {
            const nodes = document.querySelectorAll(`[data-id="${nodeId}"]`);
            nodes.forEach(node => {
                console.log(`Fixing ${nodeId}: ${node.getAttribute('transform')} → translate(${pos.x}, ${pos.y})`);
                node.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
                fixed++;
            });
        });
        
        console.log(`✅ Fixed ${fixed} node positions`);
        
        // Force redraw
        const svg = document.getElementById('hex-flow-board');
        if (svg) {
            svg.style.display = 'none';
            svg.offsetHeight; // Force reflow
            svg.style.display = '';
        }
    }
}

// Initialize diagnostic
window.positioningDiagnosticTool = new PositioningDiagnostic();

// Console commands
console.log('\n🎮 Diagnostic Commands:');
console.log('  positioningDiagnostic - View full diagnostic results');
console.log('  positioningDiagnosticTool.attemptManualFix() - Try manual position fix');
console.log('  positioningDiagnosticTool.performChecks("manual") - Re-run diagnostics');