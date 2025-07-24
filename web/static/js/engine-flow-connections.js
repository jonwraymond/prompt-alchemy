// ENGINE FLOW CONNECTIONS - Maps the actual prompt alchemy data flow
// Based on analysis of internal/engine/engine.go

(function() {
    'use strict';
    
    console.log('🔌 Engine Flow Connections initializing...');
    
    // Define the complete network flow based on the engine architecture
    const ENGINE_FLOW = {
        // Phase 1: Prima Materia - Extract raw essence
        primaMateria: {
            inputs: ['input'],
            phase: 'prima',
            processes: ['parse', 'extract', 'validate'],
            providers: ['openai', 'anthropic', 'google'],
            outputs: ['hub']
        },
        
        // Phase 2: Solutio - Dissolve into flowing language
        solutio: {
            inputs: ['hub'],
            phase: 'solutio',
            processes: ['refine', 'enhance', 'structure'],
            providers: ['openai', 'anthropic', 'google'],
            outputs: ['hub']
        },
        
        // Phase 3: Coagulatio - Crystallize into final form
        coagulatio: {
            inputs: ['hub'],
            phase: 'coagulatio',
            processes: ['optimize', 'judge', 'final'],
            providers: ['openai', 'anthropic', 'google'],
            outputs: ['output']
        }
    };
    
    // Complete connection map for all 21 nodes
    const ALL_CONNECTIONS = [
        // Input connections
        { from: 'input', to: 'hub', type: 'input-flow', label: 'Raw Input' },
        { from: 'input', to: 'prima', type: 'phase-trigger', label: 'Initiate Phase 1' },
        
        // Prima Materia phase connections
        { from: 'prima', to: 'parse', type: 'process-dispatch', label: 'Parse Structure' },
        { from: 'prima', to: 'extract', type: 'process-dispatch', label: 'Extract Essence' },
        { from: 'prima', to: 'validate', type: 'process-dispatch', label: 'Validate Input' },
        
        // Prima process results back to phase
        { from: 'parse', to: 'prima', type: 'process-result', label: 'Parsed Data' },
        { from: 'extract', to: 'prima', type: 'process-result', label: 'Extracted Info' },
        { from: 'validate', to: 'prima', type: 'process-result', label: 'Validation OK' },
        
        // Prima to providers
        { from: 'prima', to: 'openai', type: 'provider-request', label: 'OpenAI Generation' },
        { from: 'prima', to: 'anthropic', type: 'provider-request', label: 'Claude Generation' },
        { from: 'prima', to: 'google', type: 'provider-request', label: 'Gemini Generation' },
        
        // Providers back to Prima
        { from: 'openai', to: 'prima', type: 'provider-response', label: 'OpenAI Result' },
        { from: 'anthropic', to: 'prima', type: 'provider-response', label: 'Claude Result' },
        { from: 'google', to: 'prima', type: 'provider-response', label: 'Gemini Result' },
        
        // Prima to Hub
        { from: 'prima', to: 'hub', type: 'phase-complete', label: 'Phase 1 Complete' },
        
        // Hub to Solutio
        { from: 'hub', to: 'solutio', type: 'phase-trigger', label: 'Initiate Phase 2' },
        
        // Solutio phase connections
        { from: 'solutio', to: 'refine', type: 'process-dispatch', label: 'Refine Language' },
        { from: 'solutio', to: 'enhance', type: 'process-dispatch', label: 'Enhance Flow' },
        { from: 'solutio', to: 'structure', type: 'process-dispatch', label: 'Structure Output' },
        
        // Solutio process results
        { from: 'refine', to: 'solutio', type: 'process-result', label: 'Refined Text' },
        { from: 'enhance', to: 'solutio', type: 'process-result', label: 'Enhanced Content' },
        { from: 'structure', to: 'solutio', type: 'process-result', label: 'Structured Data' },
        
        // Solutio to providers (may use different provider per phase)
        { from: 'solutio', to: 'openai', type: 'provider-request', label: 'OpenAI Refinement' },
        { from: 'solutio', to: 'anthropic', type: 'provider-request', label: 'Claude Refinement' },
        { from: 'solutio', to: 'google', type: 'provider-request', label: 'Gemini Refinement' },
        
        // Providers back to Solutio
        { from: 'openai', to: 'solutio', type: 'provider-response', label: 'OpenAI Refined' },
        { from: 'anthropic', to: 'solutio', type: 'provider-response', label: 'Claude Refined' },
        { from: 'google', to: 'solutio', type: 'provider-response', label: 'Gemini Refined' },
        
        // Solutio to Hub
        { from: 'solutio', to: 'hub', type: 'phase-complete', label: 'Phase 2 Complete' },
        
        // Hub to Coagulatio
        { from: 'hub', to: 'coagulatio', type: 'phase-trigger', label: 'Initiate Phase 3' },
        
        // Coagulatio phase connections
        { from: 'coagulatio', to: 'optimize', type: 'process-dispatch', label: 'Optimize Final' },
        { from: 'coagulatio', to: 'judge', type: 'process-dispatch', label: 'Quality Judge' },
        { from: 'coagulatio', to: 'final', type: 'process-dispatch', label: 'Final Polish' },
        
        // Coagulatio process results
        { from: 'optimize', to: 'coagulatio', type: 'process-result', label: 'Optimized' },
        { from: 'judge', to: 'coagulatio', type: 'process-result', label: 'Quality Score' },
        { from: 'final', to: 'coagulatio', type: 'process-result', label: 'Finalized' },
        
        // Coagulatio to providers
        { from: 'coagulatio', to: 'openai', type: 'provider-request', label: 'OpenAI Final' },
        { from: 'coagulatio', to: 'anthropic', type: 'provider-request', label: 'Claude Final' },
        { from: 'coagulatio', to: 'google', type: 'provider-request', label: 'Gemini Final' },
        
        // Providers back to Coagulatio
        { from: 'openai', to: 'coagulatio', type: 'provider-response', label: 'OpenAI Complete' },
        { from: 'anthropic', to: 'coagulatio', type: 'provider-response', label: 'Claude Complete' },
        { from: 'google', to: 'coagulatio', type: 'provider-response', label: 'Gemini Complete' },
        
        // Coagulatio to Hub (final processing)
        { from: 'coagulatio', to: 'hub', type: 'phase-complete', label: 'Phase 3 Complete' },
        
        // Hub to Output
        { from: 'hub', to: 'output', type: 'output-flow', label: 'Final Prompt' },
        
        // Ollama local connections (optional provider)
        { from: 'prima', to: 'ollama', type: 'provider-request', label: 'Local Generation' },
        { from: 'ollama', to: 'prima', type: 'provider-response', label: 'Local Result' },
        { from: 'solutio', to: 'ollama', type: 'provider-request', label: 'Local Refine' },
        { from: 'ollama', to: 'solutio', type: 'provider-response', label: 'Local Refined' },
        { from: 'coagulatio', to: 'ollama', type: 'provider-request', label: 'Local Final' },
        { from: 'ollama', to: 'coagulatio', type: 'provider-response', label: 'Local Complete' }
    ];
    
    // Connection animation styles based on type
    const CONNECTION_STYLES = {
        'input-flow': {
            color: '#ffcc33',
            width: 4,
            dashArray: '8,4',
            animationSpeed: 1.5,
            glow: 20
        },
        'phase-trigger': {
            color: '#ff6b35',
            width: 3,
            dashArray: '5,5',
            animationSpeed: 2,
            glow: 15
        },
        'process-dispatch': {
            color: '#4ecdc4',
            width: 2.5,
            dashArray: '4,4',
            animationSpeed: 2.5,
            glow: 10
        },
        'process-result': {
            color: '#45b7d1',
            width: 2.5,
            dashArray: '4,4',
            animationSpeed: 2.5,
            glow: 10
        },
        'provider-request': {
            color: '#10a37f',
            width: 3,
            dashArray: '6,3',
            animationSpeed: 2,
            glow: 12
        },
        'provider-response': {
            color: '#28a745',
            width: 3,
            dashArray: '6,3',
            animationSpeed: 2,
            glow: 12
        },
        'phase-complete': {
            color: '#ffd700',
            width: 4,
            dashArray: '8,2',
            animationSpeed: 1.8,
            glow: 25
        },
        'output-flow': {
            color: '#ffd700',
            width: 5,
            dashArray: '10,5',
            animationSpeed: 1,
            glow: 30
        }
    };
    
    // Create all connection paths
    function createAllConnections() {
        console.log('🔗 Creating all engine flow connections...');
        
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
            
            // Create curved path for better visualization
            const dx = x2 - x1;
            const dy = y2 - y1;
            const dr = Math.sqrt(dx * dx + dy * dy);
            
            // Control point for curve
            const cx = (x1 + x2) / 2 + (dy / dr) * 30;
            const cy = (y1 + y2) / 2 - (dx / dr) * 30;
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
            path.setAttribute('data-connection', `${conn.from}-${conn.to}`);
            path.setAttribute('data-connection-type', conn.type);
            path.setAttribute('data-label', conn.label);
            path.setAttribute('class', `connection-path connection-${conn.type}`);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', '#6c757d');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('stroke-dasharray', '3,3');
            path.setAttribute('opacity', '0.4');
            
            // Add arrow marker
            const markerId = `arrow-${conn.type}-${index}`;
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', markerId);
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '10');
            marker.setAttribute('refX', '8');
            marker.setAttribute('refY', '3');
            marker.setAttribute('orient', 'auto');
            marker.setAttribute('markerUnits', 'strokeWidth');
            
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            arrow.setAttribute('d', 'M0,0 L0,6 L9,3 z');
            arrow.setAttribute('fill', '#6c757d');
            
            marker.appendChild(arrow);
            svg.appendChild(marker);
            
            path.setAttribute('marker-end', `url(#${markerId})`);
            
            connectionsLayer.appendChild(path);
        });
        
        console.log(`✅ Created ${ALL_CONNECTIONS.length} connection paths`);
    }
    
    // Animate connections based on flow type
    function animateConnection(fromId, toId, type = 'phase-trigger') {
        const style = CONNECTION_STYLES[type] || CONNECTION_STYLES['phase-trigger'];
        const paths = document.querySelectorAll(`[data-connection="${fromId}-${toId}"], [data-connection="${toId}-${fromId}"]`);
        
        paths.forEach(path => {
            const animClass = `flow-anim-${Date.now()}`;
            const animStyle = document.createElement('style');
            
            animStyle.textContent = `
                @keyframes ${animClass} {
                    0% { 
                        stroke-dashoffset: 20;
                        stroke: ${style.color};
                        opacity: 0.6;
                    }
                    50% { 
                        stroke: ${style.color};
                        opacity: 1;
                        filter: drop-shadow(0 0 ${style.glow}px ${style.color});
                    }
                    100% { 
                        stroke-dashoffset: -20;
                        stroke: ${style.color};
                        opacity: 0.6;
                    }
                }
                .${animClass} {
                    stroke: ${style.color} !important;
                    stroke-width: ${style.width} !important;
                    stroke-dasharray: ${style.dashArray} !important;
                    animation: ${animClass} ${style.animationSpeed}s linear infinite !important;
                }
                .${animClass} + marker path {
                    fill: ${style.color} !important;
                }
            `;
            
            document.head.appendChild(animStyle);
            path.classList.add(animClass);
            
            // Update arrow color
            const markerId = path.getAttribute('marker-end');
            if (markerId) {
                const marker = document.querySelector(markerId.replace('url(#', '#').replace(')', ''));
                if (marker) {
                    const arrow = marker.querySelector('path');
                    if (arrow) arrow.setAttribute('fill', style.color);
                }
            }
            
            // Remove animation after duration
            setTimeout(() => {
                path.classList.remove(animClass);
                animStyle.remove();
                // Reset to standby
                path.setAttribute('stroke', '#6c757d');
                path.setAttribute('opacity', '0.4');
                if (markerId) {
                    const marker = document.querySelector(markerId.replace('url(#', '#').replace(')', ''));
                    if (marker) {
                        const arrow = marker.querySelector('path');
                        if (arrow) arrow.setAttribute('fill', '#6c757d');
                    }
                }
            }, style.animationSpeed * 1000);
        });
    }
    
    // Orchestrate complete flow animation
    window.animateCompleteEngineFlow = function() {
        console.log('🎭 Starting complete engine flow animation...');
        
        const sequence = [
            // Input phase
            { delay: 0, connections: [
                { from: 'input', to: 'hub', type: 'input-flow' },
                { from: 'input', to: 'prima', type: 'phase-trigger' }
            ]},
            
            // Prima Materia processing
            { delay: 500, connections: [
                { from: 'prima', to: 'parse', type: 'process-dispatch' },
                { from: 'prima', to: 'extract', type: 'process-dispatch' },
                { from: 'prima', to: 'validate', type: 'process-dispatch' }
            ]},
            
            // Prima process results
            { delay: 1000, connections: [
                { from: 'parse', to: 'prima', type: 'process-result' },
                { from: 'extract', to: 'prima', type: 'process-result' },
                { from: 'validate', to: 'prima', type: 'process-result' }
            ]},
            
            // Prima to providers
            { delay: 1500, connections: [
                { from: 'prima', to: 'openai', type: 'provider-request' },
                { from: 'prima', to: 'anthropic', type: 'provider-request' },
                { from: 'prima', to: 'google', type: 'provider-request' }
            ]},
            
            // Provider responses
            { delay: 2000, connections: [
                { from: 'openai', to: 'prima', type: 'provider-response' },
                { from: 'anthropic', to: 'prima', type: 'provider-response' },
                { from: 'google', to: 'prima', type: 'provider-response' }
            ]},
            
            // Prima complete
            { delay: 2500, connections: [
                { from: 'prima', to: 'hub', type: 'phase-complete' }
            ]},
            
            // Solutio phase
            { delay: 3000, connections: [
                { from: 'hub', to: 'solutio', type: 'phase-trigger' }
            ]},
            
            // Solutio processing
            { delay: 3500, connections: [
                { from: 'solutio', to: 'refine', type: 'process-dispatch' },
                { from: 'solutio', to: 'enhance', type: 'process-dispatch' },
                { from: 'solutio', to: 'structure', type: 'process-dispatch' }
            ]},
            
            // Solutio complete
            { delay: 4500, connections: [
                { from: 'solutio', to: 'hub', type: 'phase-complete' }
            ]},
            
            // Coagulatio phase
            { delay: 5000, connections: [
                { from: 'hub', to: 'coagulatio', type: 'phase-trigger' }
            ]},
            
            // Coagulatio processing
            { delay: 5500, connections: [
                { from: 'coagulatio', to: 'optimize', type: 'process-dispatch' },
                { from: 'coagulatio', to: 'judge', type: 'process-dispatch' },
                { from: 'coagulatio', to: 'final', type: 'process-dispatch' }
            ]},
            
            // Final output
            { delay: 6500, connections: [
                { from: 'coagulatio', to: 'hub', type: 'phase-complete' }
            ]},
            
            { delay: 7000, connections: [
                { from: 'hub', to: 'output', type: 'output-flow' }
            ]}
        ];
        
        // Execute sequence
        sequence.forEach(step => {
            setTimeout(() => {
                step.connections.forEach(conn => {
                    animateConnection(conn.from, conn.to, conn.type);
                });
            }, step.delay);
        });
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
            
            console.log('✅ Engine flow connections ready!');
            console.log('🎮 Test with: animateCompleteEngineFlow()');
        }, 1000);
    }
    
    init();
    
})();