// ENGINE FLOW CONNECTIONS V2 - Directional flow animations without duplicate lines
// Based on analysis of internal/engine/engine.go and the visual legend

(function() {
    'use strict';
    
    console.log('🔌 Engine Flow Connections V2 initializing...');
    
    // Legend-based connection types from the UI
    const CONNECTION_LEGEND = {
        // Active Processing - Solid green line (currently processing)
        'active-processing': {
            stroke: '#10a37f',
            strokeWidth: 3,
            dashArray: 'none',
            opacity: 1,
            animation: 'pulse-flow'
        },
        
        // Standby Connection - Small dotted gray line (available but not active)
        'standby': {
            stroke: '#6c757d',
            strokeWidth: 2,
            dashArray: '3,3',
            opacity: 0.6,
            animation: 'none'
        },
        
        // Input/Output Relationships - Solid golden/yellow line
        'input-output': {
            stroke: '#ffd700',
            strokeWidth: 3,
            dashArray: 'none',
            opacity: 0.9,
            animation: 'golden-flow'
        },
        
        // Ready to Flow - Large dotted orange line (ready for activation)
        'ready-flow': {
            stroke: '#ff6b35',
            strokeWidth: 3,
            dashArray: '8,4',
            opacity: 0.8,
            animation: 'ready-pulse'
        },
        
        // Broken Connection - Dashed red line (error or unavailable)
        'broken': {
            stroke: '#dc3545',
            strokeWidth: 2,
            dashArray: '5,10',
            opacity: 0.5,
            animation: 'error-flash'
        }
    };
    
    // Connection definitions with bidirectional handling
    const CONNECTIONS = {
        // Input flow
        'input-hub': { nodes: ['input', 'hub'], type: 'input-output', label: 'Raw Input Flow' },
        'input-prima': { nodes: ['input', 'prima'], type: 'ready-flow', label: 'Prima Initiation' },
        
        // Prima processes (bidirectional)
        'prima-parse': { nodes: ['prima', 'parse'], type: 'standby', label: 'Parse Process' },
        'prima-extract': { nodes: ['prima', 'extract'], type: 'standby', label: 'Extract Process' },
        'prima-validate': { nodes: ['prima', 'validate'], type: 'standby', label: 'Validate Process' },
        
        // Prima to providers (bidirectional)
        'prima-openai': { nodes: ['prima', 'openai'], type: 'standby', label: 'OpenAI Processing' },
        'prima-anthropic': { nodes: ['prima', 'anthropic'], type: 'standby', label: 'Claude Processing' },
        'prima-google': { nodes: ['prima', 'google'], type: 'standby', label: 'Gemini Processing' },
        'prima-ollama': { nodes: ['prima', 'ollama'], type: 'standby', label: 'Local Processing' },
        
        // Phase connections
        'prima-hub': { nodes: ['prima', 'hub'], type: 'standby', label: 'Phase 1 Complete' },
        'hub-solutio': { nodes: ['hub', 'solutio'], type: 'standby', label: 'Solutio Initiation' },
        
        // Solutio processes (bidirectional)
        'solutio-refine': { nodes: ['solutio', 'refine'], type: 'standby', label: 'Refine Process' },
        'solutio-flow': { nodes: ['solutio', 'flow'], type: 'standby', label: 'Flow Process' },
        'solutio-finalize': { nodes: ['solutio', 'finalize'], type: 'standby', label: 'Finalize Process' },
        
        // Solutio to providers (bidirectional)
        'solutio-openai': { nodes: ['solutio', 'openai'], type: 'standby', label: 'OpenAI Refinement' },
        'solutio-anthropic': { nodes: ['solutio', 'anthropic'], type: 'standby', label: 'Claude Refinement' },
        'solutio-google': { nodes: ['solutio', 'google'], type: 'standby', label: 'Gemini Refinement' },
        'solutio-ollama': { nodes: ['solutio', 'ollama'], type: 'standby', label: 'Local Refinement' },
        
        // More phase connections
        'solutio-hub': { nodes: ['solutio', 'hub'], type: 'standby', label: 'Phase 2 Complete' },
        'hub-coagulatio': { nodes: ['hub', 'coagulatio'], type: 'standby', label: 'Coagulatio Initiation' },
        
        // Coagulatio processes (bidirectional)
        'coagulatio-optimize': { nodes: ['coagulatio', 'optimize'], type: 'standby', label: 'Optimize Process' },
        'coagulatio-judge': { nodes: ['coagulatio', 'judge'], type: 'standby', label: 'Judge Process' },
        'coagulatio-database': { nodes: ['coagulatio', 'database'], type: 'standby', label: 'Database Process' },
        
        // Coagulatio to providers (bidirectional)
        'coagulatio-openai': { nodes: ['coagulatio', 'openai'], type: 'standby', label: 'OpenAI Final' },
        'coagulatio-anthropic': { nodes: ['coagulatio', 'anthropic'], type: 'standby', label: 'Claude Final' },
        'coagulatio-google': { nodes: ['coagulatio', 'google'], type: 'standby', label: 'Gemini Final' },
        'coagulatio-ollama': { nodes: ['coagulatio', 'ollama'], type: 'standby', label: 'Local Final' },
        
        // Final connections
        'coagulatio-hub': { nodes: ['coagulatio', 'hub'], type: 'standby', label: 'Phase 3 Complete' },
        'hub-output': { nodes: ['hub', 'output'], type: 'input-output', label: 'Final Output' }
    };
    
    // Create curved path with proper arc
    function createCurvedPath(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate control point for quadratic bezier curve
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        
        // Perpendicular vector for curve
        const px = -dy / dr;
        const py = dx / dr;
        
        // Control point offset (adjust for arc amount)
        const offset = dr * 0.2; // 20% of distance for nice arc
        const cx = mx + px * offset;
        const cy = my + py * offset;
        
        return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
    }
    
    // Create all connection paths
    function createAllConnections() {
        console.log('🔗 Creating all engine flow connections (no duplicates)...');
        
        const svg = document.getElementById('hex-flow-board');
        if (!svg) {
            console.error('❌ SVG board not found');
            return;
        }
        
        // Find or create connections layer
        let connectionsLayer = svg.querySelector('.connections-layer');
        if (!connectionsLayer) {
            connectionsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            connectionsLayer.setAttribute('class', 'connections-layer');
            svg.insertBefore(connectionsLayer, svg.firstChild);
        }
        
        // Clear existing connections
        connectionsLayer.innerHTML = '';
        
        // Create gradient definitions for smooth flow
        const defs = svg.querySelector('defs') || svg.insertBefore(
            document.createElementNS('http://www.w3.org/2000/svg', 'defs'),
            svg.firstChild
        );
        
        // Clear old markers and gradients
        defs.querySelectorAll('marker[id^="arrow-"]').forEach(m => m.remove());
        defs.querySelectorAll('linearGradient[id^="flow-gradient-"]').forEach(g => g.remove());
        
        // Create each connection (only once per node pair)
        Object.entries(CONNECTIONS).forEach(([key, conn]) => {
            const [node1Id, node2Id] = conn.nodes;
            const node1 = document.querySelector(`[data-id="${node1Id}"]`);
            const node2 = document.querySelector(`[data-id="${node2Id}"]`);
            
            if (!node1 || !node2) {
                console.warn(`⚠️ Missing nodes for connection ${key}`);
                return;
            }
            
            // Get node positions
            const transform1 = node1.getAttribute('transform');
            const transform2 = node2.getAttribute('transform');
            
            const match1 = transform1.match(/translate\(([^,]+),\s*([^)]+)\)/);
            const match2 = transform2.match(/translate\(([^,]+),\s*([^)]+)\)/);
            
            if (!match1 || !match2) return;
            
            const x1 = parseFloat(match1[1]);
            const y1 = parseFloat(match1[2]);
            const x2 = parseFloat(match2[1]);
            const y2 = parseFloat(match2[2]);
            
            // Create curved path
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', createCurvedPath(x1, y1, x2, y2));
            path.setAttribute('data-connection', key);
            path.setAttribute('data-connection-type', conn.type);
            path.setAttribute('data-label', conn.label);
            path.setAttribute('data-from', node1Id);
            path.setAttribute('data-to', node2Id);
            path.setAttribute('class', `connection-path connection-${conn.type}`);
            path.setAttribute('fill', 'none');
            
            // Apply legend-based styling
            const style = CONNECTION_LEGEND[conn.type];
            path.setAttribute('stroke', style.stroke);
            path.setAttribute('stroke-width', style.strokeWidth);
            if (style.dashArray !== 'none') {
                path.setAttribute('stroke-dasharray', style.dashArray);
            }
            path.setAttribute('opacity', style.opacity);
            // No arrow markers - smooth lines only
            
            connectionsLayer.appendChild(path);
        });
        
        console.log(`✅ Created ${Object.keys(CONNECTIONS).length} connection paths (no duplicates)`);
    }
    
    // Animate connection with directional flow
    function animateConnection(connectionKey, direction = 'forward', animationType = 'active-processing') {
        const timestamp = new Date().toISOString();
        console.log(`🎬 [${timestamp}] animateConnection called:`);
        console.log(`   - Connection: ${connectionKey}`);
        console.log(`   - Direction: ${direction}`);
        console.log(`   - Animation Type: ${animationType}`);
        
        const path = document.querySelector(`[data-connection="${connectionKey}"]`);
        if (!path) {
            console.warn(`⚠️ [${timestamp}] Connection ${connectionKey} not found in DOM`);
            console.log(`   Available connections:`, Array.from(document.querySelectorAll('[data-connection]')).map(p => p.getAttribute('data-connection')));
            return;
        }
        console.log(`✅ [${timestamp}] Path found for connection ${connectionKey}`);
        
        const style = CONNECTION_LEGEND[animationType];
        
        // Update connection appearance
        path.setAttribute('data-connection-type', animationType);
        path.setAttribute('stroke', style.stroke);
        path.setAttribute('stroke-width', style.strokeWidth);
        if (style.dashArray !== 'none') {
            path.setAttribute('stroke-dasharray', style.dashArray);
        } else {
            path.removeAttribute('stroke-dasharray');
        }
        path.setAttribute('opacity', style.opacity);
        path.setAttribute('marker-end', `url(#arrow-${animationType})`);
        
        // Create directional animation
        const animClass = `flow-anim-${Date.now()}`;
        const animStyle = document.createElement('style');
        
        // Determine animation direction
        const dashOffset = direction === 'reverse' ? '40' : '-40';
        
        // Set path ID if not already set  
        if (!path.id) {
            path.id = 'path-' + connectionKey;
        }
        
        if (animationType === 'active-processing') {
            // Green smooth glow
            animStyle.textContent = `
                .${animClass} {
                    stroke: ${style.stroke} !important;
                    stroke-width: ${style.strokeWidth} !important;
                    filter: drop-shadow(0 0 10px ${style.stroke});
                    animation: pulse-glow-${animClass} 2s ease-in-out infinite !important;
                }
                @keyframes pulse-glow-${animClass} {
                    0%, 100% { 
                        opacity: ${style.opacity * 0.7};
                        filter: drop-shadow(0 0 10px ${style.stroke});
                    }
                    50% { 
                        opacity: ${style.opacity};
                        filter: drop-shadow(0 0 20px ${style.stroke}) brightness(1.2);
                    }
                }

            `;
        } else if (animationType === 'input-output') {
            // Golden smooth flow
            animStyle.textContent = `
                .${animClass} {
                    stroke: ${style.stroke} !important;
                    stroke-width: ${style.strokeWidth} !important;
                    filter: drop-shadow(0 0 15px ${style.stroke});
                    animation: golden-glow-${animClass} 1.5s ease-in-out infinite !important;
                }
                @keyframes golden-glow-${animClass} {
                    0%, 100% { 
                        opacity: ${style.opacity * 0.8};
                        filter: drop-shadow(0 0 15px ${style.stroke});
                    }
                    50% { 
                        opacity: ${style.opacity};
                        filter: drop-shadow(0 0 25px ${style.stroke}) brightness(1.3);
                    }
                }

            `;
        } else if (animationType === 'ready-flow') {
            // Orange ready smooth pulse
            animStyle.textContent = `
                .${animClass} {
                    stroke: ${style.stroke} !important;
                    stroke-width: ${style.strokeWidth} !important;
                    animation: ready-pulse-${animClass} 1.8s ease-in-out infinite !important;
                }
                @keyframes ready-pulse-${animClass} {
                    0%, 100% { 
                        stroke-width: ${style.strokeWidth}px;
                        opacity: ${style.opacity * 0.7};
                        filter: drop-shadow(0 0 8px ${style.stroke});
                    }
                    50% { 
                        stroke-width: ${style.strokeWidth * 1.2}px;
                        opacity: ${style.opacity};
                        filter: drop-shadow(0 0 15px ${style.stroke}) brightness(1.1);
                    }
                }

            `;
        }
        
        document.head.appendChild(animStyle);
        path.classList.add(animClass);
        
        // Reset after animation duration (match particle duration)
        const resetDuration = animationType === 'active-processing' ? 2500 : 2000;
        setTimeout(() => {
            path.classList.remove(animClass);
            animStyle.remove();
            
            // Remove glow filter if it exists
            const filterToRemove = document.getElementById(`glow-${animClass}`);
            if (filterToRemove) {
                filterToRemove.remove();
            }
            
            // Reset to standby
            const standbyStyle = CONNECTION_LEGEND['standby'];
            path.setAttribute('data-connection-type', 'standby');
            path.setAttribute('stroke', standbyStyle.stroke);
            path.setAttribute('stroke-width', standbyStyle.strokeWidth);
            path.setAttribute('stroke-dasharray', standbyStyle.dashArray);
            path.setAttribute('opacity', standbyStyle.opacity);
            // No arrow marker
        }, resetDuration);
    }
    
    // Stage zoom effects
    function zoomToStage(nodeId, scale = 1.3, duration = 800) {
        const svg = document.getElementById('hex-flow-board');
        const node = document.querySelector(`[data-id="${nodeId}"]`);
        
        if (!svg || !node) return Promise.resolve();
        
        // Get node position
        const transform = node.getAttribute('transform');
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (!match) return Promise.resolve();
        
        const x = parseFloat(match[1]);
        const y = parseFloat(match[2]);
        
        // Calculate center offset
        const svgRect = svg.getBoundingClientRect();
        const centerX = svgRect.width / 2;
        const centerY = svgRect.height / 2;
        
        // Apply zoom and center on node
        svg.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        svg.style.transformOrigin = `${x}px ${y}px`;
        svg.style.transform = `scale(${scale}) translate(${(centerX - x) / scale}px, ${(centerY - y) / scale}px)`;
        
        return new Promise(resolve => {
            setTimeout(() => {
                svg.style.transform = 'scale(1) translate(0, 0)';
                setTimeout(resolve, duration);
            }, duration + 500);
        });
    }
    
    // Orchestrate complete flow animation with directional flows
    window.animateCompleteEngineFlow = async function() {
        console.log('🎭 Starting complete engine flow animation (directional)...');
        
        // Initial zoom out to show full network
        await zoomToStage('hub', 0.8, 1000);
        
        const sequence = [
            // Input phase
            { 
                stage: 'input',
                zoom: 1.2,
                animations: [
                    { connection: 'input-hub', type: 'input-output', direction: 'forward', delay: 0 },
                    { connection: 'input-prima', type: 'ready-flow', direction: 'forward', delay: 200 }
                ]
            },
            
            // Prima Materia processing
            { 
                stage: 'prima',
                zoom: 1.3,
                animations: [
                    { connection: 'prima-parse', type: 'active-processing', direction: 'forward', delay: 0 },
                    { connection: 'prima-extract', type: 'active-processing', direction: 'forward', delay: 100 },
                    { connection: 'prima-validate', type: 'active-processing', direction: 'forward', delay: 200 },
                    { connection: 'prima-parse', type: 'ready-flow', direction: 'reverse', delay: 800 },
                    { connection: 'prima-extract', type: 'ready-flow', direction: 'reverse', delay: 900 },
                    { connection: 'prima-validate', type: 'ready-flow', direction: 'reverse', delay: 1000 }
                ]
            },
            
            // Provider interactions
            { 
                stage: 'hub',
                zoom: 1.1,
                animations: [
                    { connection: 'prima-openai', type: 'active-processing', direction: 'forward', delay: 0 },
                    { connection: 'prima-anthropic', type: 'active-processing', direction: 'forward', delay: 100 },
                    { connection: 'prima-google', type: 'active-processing', direction: 'forward', delay: 200 },
                    { connection: 'prima-openai', type: 'input-output', direction: 'reverse', delay: 600 },
                    { connection: 'prima-anthropic', type: 'input-output', direction: 'reverse', delay: 700 },
                    { connection: 'prima-google', type: 'input-output', direction: 'reverse', delay: 800 },
                    { connection: 'prima-hub', type: 'ready-flow', direction: 'forward', delay: 1000 }
                ]
            },
            
            // Solutio phase
            { 
                stage: 'solutio',
                zoom: 1.3,
                animations: [
                    { connection: 'hub-solutio', type: 'ready-flow', direction: 'forward', delay: 0 },
                    { connection: 'solutio-refine', type: 'active-processing', direction: 'forward', delay: 200 },
                    { connection: 'solutio-flow', type: 'active-processing', direction: 'forward', delay: 300 },
                    { connection: 'solutio-finalize', type: 'active-processing', direction: 'forward', delay: 400 },
                    { connection: 'solutio-refine', type: 'ready-flow', direction: 'reverse', delay: 800 },
                    { connection: 'solutio-flow', type: 'ready-flow', direction: 'reverse', delay: 900 },
                    { connection: 'solutio-finalize', type: 'ready-flow', direction: 'reverse', delay: 1000 },
                    { connection: 'solutio-hub', type: 'ready-flow', direction: 'forward', delay: 1200 }
                ]
            },
            
            // Coagulatio phase
            { 
                stage: 'coagulatio',
                zoom: 1.3,
                animations: [
                    { connection: 'hub-coagulatio', type: 'ready-flow', direction: 'forward', delay: 0 },
                    { connection: 'coagulatio-optimize', type: 'active-processing', direction: 'forward', delay: 200 },
                    { connection: 'coagulatio-judge', type: 'active-processing', direction: 'forward', delay: 300 },
                    { connection: 'coagulatio-database', type: 'active-processing', direction: 'forward', delay: 400 },
                    { connection: 'coagulatio-optimize', type: 'ready-flow', direction: 'reverse', delay: 800 },
                    { connection: 'coagulatio-judge', type: 'ready-flow', direction: 'reverse', delay: 900 },
                    { connection: 'coagulatio-database', type: 'ready-flow', direction: 'reverse', delay: 1000 },
                    { connection: 'coagulatio-hub', type: 'ready-flow', direction: 'forward', delay: 1200 }
                ]
            },
            
            // Final output
            { 
                stage: 'output',
                zoom: 1.5,
                animations: [
                    { connection: 'hub-output', type: 'input-output', direction: 'forward', delay: 0 }
                ]
            }
        ];
        
        // Execute sequence with zoom effects
        for (const step of sequence) {
            // Zoom to stage
            await zoomToStage(step.stage, step.zoom, 600);
            
            // Animate connections
            for (const anim of step.animations) {
                setTimeout(() => {
                    animateConnection(anim.connection, anim.direction, anim.type);
                }, anim.delay);
            }
            
            // Wait for animations to complete
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Final zoom out to show complete network
        setTimeout(() => {
            zoomToStage('hub', 0.9, 1000);
        }, 1000);
    };
    
    // Initialize when DOM is ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        // Wait a bit for nodes to be created
        setTimeout(() => {
            createAllConnections();
            
            // Hook into generate button
            const generateForm = document.getElementById('generate-form');
            if (generateForm) {
                generateForm.addEventListener('submit', function(e) {
                    setTimeout(() => {
                        animateCompleteEngineFlow();
                    }, 100);
                }, true);
            }
            
            // Also hook into the existing animation system
            if (window.unifiedHexFlow) {
                const originalAnimation = window.unifiedHexFlow.startProcessFlowWithAnimation;
                window.unifiedHexFlow.startProcessFlowWithAnimation = function() {
                    // Run only our animation (not both)
                    animateCompleteEngineFlow();
                };
            }
            
            console.log('✅ Engine flow connections V2 ready (no duplicate lines)!');
            console.log('🎮 Test with: animateCompleteEngineFlow()');
            console.log('🔵 Test line animations with: testDirectionalFlow()');
        }, 1000);
    }
    
    init();
    
    // Export functions globally
    window.animateConnection = animateConnection;
    window.EngineFlowConnections = {
        animateConnection: animateConnection,
        createAllConnections: createAllConnections,
        CONNECTION_LEGEND: CONNECTION_LEGEND,
        CONNECTIONS: CONNECTIONS
    };
    window.testDirectionalFlow = function(continuous = false) {
        console.log('🔵 Testing directional flow animations...');
        
        // Test function that shows line animations clearly
        const testSequence = () => {
            // Test various connections with animated lines
            setTimeout(() => animateConnection('input-hub', 'forward', 'input-output'), 100);
            setTimeout(() => animateConnection('input-prima', 'forward', 'ready-flow'), 500);
            setTimeout(() => animateConnection('prima-parse', 'forward', 'active-processing'), 1000);
            setTimeout(() => animateConnection('prima-extract', 'forward', 'active-processing'), 1500);
            setTimeout(() => animateConnection('prima-validate', 'forward', 'active-processing'), 2000);
            setTimeout(() => animateConnection('hub-output', 'forward', 'input-output'), 2500);
            
            // More animation tests
            setTimeout(() => animateConnection('prima-openai', 'forward', 'active-processing'), 3000);
            setTimeout(() => animateConnection('solutio-refine', 'forward', 'active-processing'), 3500);
            setTimeout(() => animateConnection('coagulatio-optimize', 'forward', 'active-processing'), 4000);
        };
        
        testSequence();
        
        if (continuous) {
            // Repeat every 5 seconds for continuous testing
            setInterval(testSequence, 5000);
            console.log('Continuous line animation test started - watch for flowing lines!');
        } else {
            console.log('Test animations started - watch for flowing lines!');
        }
    };
    
    // Debug function to check if paths exist
    window.debugConnections = function() {
        const paths = document.querySelectorAll('[data-connection]');
        console.log(`Found ${paths.length} connection paths:`);
        paths.forEach(path => {
            console.log(`- ${path.getAttribute('data-connection')}: ${path.getAttribute('data-label')}`);
        });
    };
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createAllConnections);
    } else {
        createAllConnections();
    }
    
    // Listen for connection animation events
    document.addEventListener('animate-connection', (e) => {
        if (e.detail && e.detail.connectionKey) {
            animateConnection(e.detail.connectionKey, e.detail.direction, e.detail.type);
        }
    });
    
    // Expose functions globally for integration
    window.EngineFlowConnections = {
        animateConnection: animateConnection,
        animateFlow: function(fromId, toId, type = 'active-processing') {
            // Find the connection key for these nodes
            let connectionKey = null;
            for (const [key, conn] of Object.entries(CONNECTIONS)) {
                if ((conn.nodes[0] === fromId && conn.nodes[1] === toId) ||
                    (conn.nodes[1] === fromId && conn.nodes[0] === toId)) {
                    connectionKey = key;
                    break;
                }
            }
            
            if (connectionKey) {
                console.log(`🔵 Animating flow: ${fromId} → ${toId} (${connectionKey})`);
                animateConnection(connectionKey, 'forward', type);
            } else {
                console.warn(`⚠️ No connection found for ${fromId} → ${toId}`);
            }
        },
        createAllConnections: createAllConnections,
        CONNECTIONS: CONNECTIONS
    };
    
})();