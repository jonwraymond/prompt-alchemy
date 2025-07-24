// ENGINE FLOW CONNECTIONS - Maps the actual prompt alchemy data flow with legend-based styling
// Based on analysis of internal/engine/engine.go and the visual legend

(function() {
    'use strict';
    
    console.log('🔌 Engine Flow Connections initializing...');
    
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
    
    // Define the complete network flow based on the engine architecture
    const ENGINE_FLOW = {
        // Phase 1: Prima Materia - Extract raw essence
        primaMateria: {
            inputs: ['input'],
            phase: 'prima',
            processes: ['parse', 'extract', 'validate'],
            providers: ['openai', 'anthropic', 'google', 'ollama'],
            outputs: ['hub']
        },
        
        // Phase 2: Solutio - Dissolve into flowing language
        solutio: {
            inputs: ['hub'],
            phase: 'solutio',
            processes: ['refine', 'enhance', 'structure'],
            providers: ['openai', 'anthropic', 'google', 'ollama'],
            outputs: ['hub']
        },
        
        // Phase 3: Coagulatio - Crystallize into final form
        coagulatio: {
            inputs: ['hub'],
            phase: 'coagulatio',
            processes: ['optimize', 'judge', 'final'],
            providers: ['openai', 'anthropic', 'google', 'ollama'],
            outputs: ['output']
        }
    };
    
    // Complete connection map with legend-based types
    // Using bidirectional key to prevent duplicate lines
    const ALL_CONNECTIONS = [
        // Input connections (Input/Output relationship - golden solid)
        { from: 'input', to: 'hub', type: 'input-output', label: 'Raw Input', direction: 'forward' },
        { from: 'input', to: 'prima', type: 'ready-flow', label: 'Initiate Phase 1', direction: 'forward' },
        
        // Prima Materia phase connections (Ready to flow - orange dotted)
        // Single bidirectional connection per node pair
        { from: 'prima', to: 'parse', type: 'ready-flow', label: 'Parse Structure', direction: 'bidirectional' },
        { from: 'prima', to: 'extract', type: 'ready-flow', label: 'Extract Essence', direction: 'bidirectional' },
        { from: 'prima', to: 'validate', type: 'ready-flow', label: 'Validate Input', direction: 'bidirectional' },
        
        // Prima to providers (Standby connections - gray dotted)
        { from: 'prima', to: 'openai', type: 'standby', label: 'OpenAI Generation' },
        { from: 'prima', to: 'anthropic', type: 'standby', label: 'Claude Generation' },
        { from: 'prima', to: 'google', type: 'standby', label: 'Gemini Generation' },
        { from: 'prima', to: 'ollama', type: 'standby', label: 'Local Generation' },
        
        // Providers back to Prima
        { from: 'openai', to: 'prima', type: 'standby', label: 'OpenAI Result' },
        { from: 'anthropic', to: 'prima', type: 'standby', label: 'Claude Result' },
        { from: 'google', to: 'prima', type: 'standby', label: 'Gemini Result' },
        { from: 'ollama', to: 'prima', type: 'standby', label: 'Local Result' },
        
        // Prima to Hub (Input/Output when complete)
        { from: 'prima', to: 'hub', type: 'standby', label: 'Phase 1 Complete' },
        
        // Hub to Solutio
        { from: 'hub', to: 'solutio', type: 'ready-flow', label: 'Initiate Phase 2' },
        
        // Solutio phase connections
        { from: 'solutio', to: 'refine', type: 'ready-flow', label: 'Refine Language' },
        { from: 'solutio', to: 'enhance', type: 'ready-flow', label: 'Enhance Flow' },
        { from: 'solutio', to: 'structure', type: 'ready-flow', label: 'Structure Output' },
        
        // Solutio process results
        { from: 'refine', to: 'solutio', type: 'standby', label: 'Refined Text' },
        { from: 'enhance', to: 'solutio', type: 'standby', label: 'Enhanced Content' },
        { from: 'structure', to: 'solutio', type: 'standby', label: 'Structured Data' },
        
        // Solutio to providers
        { from: 'solutio', to: 'openai', type: 'standby', label: 'OpenAI Refinement' },
        { from: 'solutio', to: 'anthropic', type: 'standby', label: 'Claude Refinement' },
        { from: 'solutio', to: 'google', type: 'standby', label: 'Gemini Refinement' },
        { from: 'solutio', to: 'ollama', type: 'standby', label: 'Local Refinement' },
        
        // Providers back to Solutio
        { from: 'openai', to: 'solutio', type: 'standby', label: 'OpenAI Refined' },
        { from: 'anthropic', to: 'solutio', type: 'standby', label: 'Claude Refined' },
        { from: 'google', to: 'solutio', type: 'standby', label: 'Gemini Refined' },
        { from: 'ollama', to: 'solutio', type: 'standby', label: 'Local Refined' },
        
        // Solutio to Hub
        { from: 'solutio', to: 'hub', type: 'standby', label: 'Phase 2 Complete' },
        
        // Hub to Coagulatio
        { from: 'hub', to: 'coagulatio', type: 'ready-flow', label: 'Initiate Phase 3' },
        
        // Coagulatio phase connections
        { from: 'coagulatio', to: 'optimize', type: 'ready-flow', label: 'Optimize Final' },
        { from: 'coagulatio', to: 'judge', type: 'ready-flow', label: 'Quality Judge' },
        { from: 'coagulatio', to: 'final', type: 'ready-flow', label: 'Final Polish' },
        
        // Coagulatio process results
        { from: 'optimize', to: 'coagulatio', type: 'standby', label: 'Optimized' },
        { from: 'judge', to: 'coagulatio', type: 'standby', label: 'Quality Score' },
        { from: 'final', to: 'coagulatio', type: 'standby', label: 'Finalized' },
        
        // Coagulatio to providers
        { from: 'coagulatio', to: 'openai', type: 'standby', label: 'OpenAI Final' },
        { from: 'coagulatio', to: 'anthropic', type: 'standby', label: 'Claude Final' },
        { from: 'coagulatio', to: 'google', type: 'standby', label: 'Gemini Final' },
        { from: 'coagulatio', to: 'ollama', type: 'standby', label: 'Local Final' },
        
        // Providers back to Coagulatio
        { from: 'openai', to: 'coagulatio', type: 'standby', label: 'OpenAI Complete' },
        { from: 'anthropic', to: 'coagulatio', type: 'standby', label: 'Claude Complete' },
        { from: 'google', to: 'coagulatio', type: 'standby', label: 'Gemini Complete' },
        { from: 'ollama', to: 'coagulatio', type: 'standby', label: 'Local Complete' },
        
        // Coagulatio to Hub
        { from: 'coagulatio', to: 'hub', type: 'standby', label: 'Phase 3 Complete' },
        
        // Hub to Output (Input/Output relationship - golden solid)
        { from: 'hub', to: 'output', type: 'input-output', label: 'Final Prompt' }
    ];
    
    // Create curved path with proper arc
    function createCurvedPath(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate control point for quadratic bezier curve
        // Arc away from center for better visualization
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
        console.log('🔗 Creating all engine flow connections with legend styles...');
        
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
        
        // Create arrow markers for each connection type
        const defs = svg.querySelector('defs') || svg.insertBefore(
            document.createElementNS('http://www.w3.org/2000/svg', 'defs'),
            svg.firstChild
        );
        
        Object.entries(CONNECTION_LEGEND).forEach(([type, style]) => {
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', `arrow-${type}`);
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '10');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3');
            marker.setAttribute('orient', 'auto');
            marker.setAttribute('markerUnits', 'strokeWidth');
            
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            arrow.setAttribute('d', 'M0,0 L0,6 L9,3 z');
            arrow.setAttribute('fill', style.stroke);
            arrow.setAttribute('opacity', style.opacity);
            
            marker.appendChild(arrow);
            defs.appendChild(marker);
        });
        
        // Create each connection
        ALL_CONNECTIONS.forEach((conn, index) => {
            const fromNode = document.querySelector(`[data-id="${conn.from}"]`);
            const toNode = document.querySelector(`[data-id="${conn.to}"]`);
            
            if (!fromNode || !toNode) {
                console.warn(`⚠️ Missing nodes for connection ${conn.from} -> ${conn.to}`);
                return;
            }
            
            // Get node positions
            const fromTransform = fromNode.getAttribute('transform');
            const toTransform = toNode.getAttribute('transform');
            
            const fromMatch = fromTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
            const toMatch = toTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
            
            if (!fromMatch || !toMatch) return;
            
            const x1 = parseFloat(fromMatch[1]);
            const y1 = parseFloat(fromMatch[2]);
            const x2 = parseFloat(toMatch[1]);
            const y2 = parseFloat(toMatch[2]);
            
            // Create curved path
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', createCurvedPath(x1, y1, x2, y2));
            path.setAttribute('data-connection', `${conn.from}-${conn.to}`);
            path.setAttribute('data-connection-type', conn.type);
            path.setAttribute('data-label', conn.label);
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
            path.setAttribute('marker-end', `url(#arrow-${conn.type})`);
            
            connectionsLayer.appendChild(path);
        });
        
        console.log(`✅ Created ${ALL_CONNECTIONS.length} connection paths with legend styling`);
    }
    
    // Animate connection based on legend type
    function animateConnection(fromId, toId, animationType = 'active-processing') {
        const paths = document.querySelectorAll(`[data-connection="${fromId}-${toId}"], [data-connection="${toId}-${fromId}"]`);
        
        paths.forEach(path => {
            const currentType = path.getAttribute('data-connection-type');
            const style = CONNECTION_LEGEND[animationType];
            
            // Change from standby to active type
            path.setAttribute('data-connection-type', animationType);
            path.setAttribute('stroke', style.stroke);
            path.setAttribute('stroke-width', style.strokeWidth);
            if (style.dashArray !== 'none') {
                path.setAttribute('stroke-dasharray', style.dashArray);
            } else {
                path.removeAttribute('stroke-dasharray');
            }
            path.setAttribute('opacity', style.opacity);
            
            // Apply animation based on type
            const animClass = `flow-anim-${Date.now()}`;
            const animStyle = document.createElement('style');
            
            if (animationType === 'active-processing') {
                // Green pulsing flow for active processing
                animStyle.textContent = `
                    @keyframes ${animClass} {
                        0% { 
                            opacity: ${style.opacity * 0.6};
                            filter: drop-shadow(0 0 5px ${style.stroke});
                        }
                        50% { 
                            opacity: ${style.opacity};
                            filter: drop-shadow(0 0 20px ${style.stroke}) brightness(1.3);
                        }
                        100% { 
                            opacity: ${style.opacity * 0.6};
                            filter: drop-shadow(0 0 5px ${style.stroke});
                        }
                    }
                    .${animClass} {
                        animation: ${animClass} 1.5s ease-in-out infinite !important;
                    }
                `;
            } else if (animationType === 'input-output') {
                // Golden flow for input/output
                animStyle.textContent = `
                    @keyframes ${animClass} {
                        0% { 
                            stroke-dashoffset: 0;
                            filter: drop-shadow(0 0 10px ${style.stroke});
                        }
                        100% { 
                            stroke-dashoffset: -40;
                            filter: drop-shadow(0 0 20px ${style.stroke});
                        }
                    }
                    .${animClass} {
                        stroke-dasharray: 10,10 !important;
                        animation: ${animClass} 2s linear infinite !important;
                    }
                `;
            } else if (animationType === 'ready-flow') {
                // Orange ready pulse
                animStyle.textContent = `
                    @keyframes ${animClass} {
                        0%, 100% { 
                            stroke-width: ${style.strokeWidth};
                            opacity: ${style.opacity * 0.7};
                        }
                        50% { 
                            stroke-width: ${style.strokeWidth * 1.5};
                            opacity: ${style.opacity};
                            filter: drop-shadow(0 0 15px ${style.stroke});
                        }
                    }
                    .${animClass} {
                        animation: ${animClass} 1s ease-in-out infinite !important;
                    }
                `;
            }
            
            document.head.appendChild(animStyle);
            path.classList.add(animClass);
            
            // Update arrow color
            const markerId = path.getAttribute('marker-end');
            if (markerId) {
                path.setAttribute('marker-end', `url(#arrow-${animationType})`);
            }
            
            // Reset after animation duration
            setTimeout(() => {
                path.classList.remove(animClass);
                animStyle.remove();
                
                // Reset to standby
                const standbyStyle = CONNECTION_LEGEND['standby'];
                path.setAttribute('data-connection-type', 'standby');
                path.setAttribute('stroke', standbyStyle.stroke);
                path.setAttribute('stroke-width', standbyStyle.strokeWidth);
                path.setAttribute('stroke-dasharray', standbyStyle.dashArray);
                path.setAttribute('opacity', standbyStyle.opacity);
                path.setAttribute('marker-end', `url(#arrow-standby)`);
            }, 3000);
        });
    }
    
    // Stage zoom effects
    function zoomToStage(nodeId, scale = 1.3, duration = 800) {
        const svg = document.getElementById('hex-flow-board');
        const node = document.querySelector(`[data-id="${nodeId}"]`);
        
        if (!svg || !node) return;
        
        // Get node position
        const transform = node.getAttribute('transform');
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (!match) return;
        
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
    
    // Orchestrate complete flow animation with zoom effects
    window.animateCompleteEngineFlow = async function() {
        console.log('🎭 Starting complete engine flow animation with zoom effects...');
        
        // Initial zoom out to show full network
        await zoomToStage('hub', 0.8, 1000);
        
        const sequence = [
            // Input phase with zoom
            { 
                stage: 'input',
                zoom: 1.2,
                connections: [
                    { from: 'input', to: 'hub', type: 'input-output', delay: 0 },
                    { from: 'input', to: 'prima', type: 'ready-flow', delay: 200 }
                ]
            },
            
            // Prima Materia with zoom to phase
            { 
                stage: 'prima',
                zoom: 1.3,
                connections: [
                    { from: 'prima', to: 'parse', type: 'active-processing', delay: 0 },
                    { from: 'prima', to: 'extract', type: 'active-processing', delay: 100 },
                    { from: 'prima', to: 'validate', type: 'active-processing', delay: 200 },
                    { from: 'parse', to: 'prima', type: 'ready-flow', delay: 500 },
                    { from: 'extract', to: 'prima', type: 'ready-flow', delay: 600 },
                    { from: 'validate', to: 'prima', type: 'ready-flow', delay: 700 }
                ]
            },
            
            // Provider interactions
            { 
                stage: 'hub',
                zoom: 1.1,
                connections: [
                    { from: 'prima', to: 'openai', type: 'active-processing', delay: 0 },
                    { from: 'prima', to: 'anthropic', type: 'active-processing', delay: 100 },
                    { from: 'prima', to: 'google', type: 'active-processing', delay: 200 },
                    { from: 'openai', to: 'prima', type: 'input-output', delay: 600 },
                    { from: 'anthropic', to: 'prima', type: 'input-output', delay: 700 },
                    { from: 'google', to: 'prima', type: 'input-output', delay: 800 },
                    { from: 'prima', to: 'hub', type: 'ready-flow', delay: 1000 }
                ]
            },
            
            // Solutio phase
            { 
                stage: 'solutio',
                zoom: 1.3,
                connections: [
                    { from: 'hub', to: 'solutio', type: 'ready-flow', delay: 0 },
                    { from: 'solutio', to: 'refine', type: 'active-processing', delay: 200 },
                    { from: 'solutio', to: 'enhance', type: 'active-processing', delay: 300 },
                    { from: 'solutio', to: 'structure', type: 'active-processing', delay: 400 },
                    { from: 'refine', to: 'solutio', type: 'ready-flow', delay: 800 },
                    { from: 'enhance', to: 'solutio', type: 'ready-flow', delay: 900 },
                    { from: 'structure', to: 'solutio', type: 'ready-flow', delay: 1000 },
                    { from: 'solutio', to: 'hub', type: 'ready-flow', delay: 1200 }
                ]
            },
            
            // Coagulatio phase
            { 
                stage: 'coagulatio',
                zoom: 1.3,
                connections: [
                    { from: 'hub', to: 'coagulatio', type: 'ready-flow', delay: 0 },
                    { from: 'coagulatio', to: 'optimize', type: 'active-processing', delay: 200 },
                    { from: 'coagulatio', to: 'judge', type: 'active-processing', delay: 300 },
                    { from: 'coagulatio', to: 'final', type: 'active-processing', delay: 400 },
                    { from: 'optimize', to: 'coagulatio', type: 'ready-flow', delay: 800 },
                    { from: 'judge', to: 'coagulatio', type: 'ready-flow', delay: 900 },
                    { from: 'final', to: 'coagulatio', type: 'ready-flow', delay: 1000 },
                    { from: 'coagulatio', to: 'hub', type: 'ready-flow', delay: 1200 }
                ]
            },
            
            // Final output with celebration zoom
            { 
                stage: 'output',
                zoom: 1.5,
                connections: [
                    { from: 'hub', to: 'output', type: 'input-output', delay: 0 }
                ]
            }
        ];
        
        // Execute sequence with zoom effects
        for (const step of sequence) {
            // Zoom to stage
            await zoomToStage(step.stage, step.zoom, 600);
            
            // Animate connections
            for (const conn of step.connections) {
                setTimeout(() => {
                    animateConnection(conn.from, conn.to, conn.type);
                }, conn.delay);
            }
            
            // Wait for connections to complete
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
                    // Run both animations for maximum effect
                    if (originalAnimation) originalAnimation.call(this);
                    animateCompleteEngineFlow();
                };
            }
            
            console.log('✅ Engine flow connections ready with legend styling!');
            console.log('🎮 Test with: animateCompleteEngineFlow()');
        }, 1000);
    }
    
    init();
    
})();