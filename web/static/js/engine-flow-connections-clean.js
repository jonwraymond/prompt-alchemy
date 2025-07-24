// ENGINE FLOW CONNECTIONS - Clean production version
(function() {
    'use strict';
    
    // Connection styling based on state
    const CONNECTION_STYLES = {
        'active-processing': {
            stroke: '#10a37f',
            strokeWidth: 3,
            dashArray: 'none',
            opacity: 1
        },
        'standby': {
            stroke: '#6c757d',
            strokeWidth: 2,
            dashArray: '3,3',
            opacity: 0.6
        },
        'input-output': {
            stroke: '#ffd700',
            strokeWidth: 3,
            dashArray: 'none',
            opacity: 0.9
        },
        'ready-flow': {
            stroke: '#ff6b35',
            strokeWidth: 3,
            dashArray: '8,4',
            opacity: 0.8
        },
        'broken': {
            stroke: '#dc3545',
            strokeWidth: 2,
            dashArray: '5,10',
            opacity: 0.5
        }
    };
    
    // Connection definitions
    const CONNECTIONS = {
        // Input flow
        'input-hub': { nodes: ['input', 'hub'], type: 'input-output' },
        'input-prima': { nodes: ['input', 'prima'], type: 'ready-flow' },
        
        // Prima processes
        'prima-parse': { nodes: ['prima', 'parse'], type: 'standby' },
        'prima-extract': { nodes: ['prima', 'extract'], type: 'standby' },
        'prima-validate': { nodes: ['prima', 'validate'], type: 'standby' },
        
        // Prima to providers
        'prima-openai': { nodes: ['prima', 'openai'], type: 'standby' },
        'prima-anthropic': { nodes: ['prima', 'anthropic'], type: 'standby' },
        'prima-google': { nodes: ['prima', 'google'], type: 'standby' },
        'prima-ollama': { nodes: ['prima', 'ollama'], type: 'standby' },
        
        // Phase connections
        'prima-hub': { nodes: ['prima', 'hub'], type: 'standby' },
        'hub-solutio': { nodes: ['hub', 'solutio'], type: 'standby' },
        
        // Solutio processes
        'solutio-refine': { nodes: ['solutio', 'refine'], type: 'standby' },
        'solutio-flow': { nodes: ['solutio', 'flow'], type: 'standby' },
        'solutio-finalize': { nodes: ['solutio', 'finalize'], type: 'standby' },
        
        // Solutio to providers
        'solutio-openai': { nodes: ['solutio', 'openai'], type: 'standby' },
        'solutio-anthropic': { nodes: ['solutio', 'anthropic'], type: 'standby' },
        'solutio-google': { nodes: ['solutio', 'google'], type: 'standby' },
        'solutio-ollama': { nodes: ['solutio', 'ollama'], type: 'standby' },
        
        // More phase connections
        'solutio-hub': { nodes: ['solutio', 'hub'], type: 'standby' },
        'hub-coagulatio': { nodes: ['hub', 'coagulatio'], type: 'standby' },
        
        // Coagulatio processes
        'coagulatio-optimize': { nodes: ['coagulatio', 'optimize'], type: 'standby' },
        'coagulatio-judge': { nodes: ['coagulatio', 'judge'], type: 'standby' },
        'coagulatio-database': { nodes: ['coagulatio', 'database'], type: 'standby' },
        
        // Coagulatio to providers
        'coagulatio-openai': { nodes: ['coagulatio', 'openai'], type: 'standby' },
        'coagulatio-anthropic': { nodes: ['coagulatio', 'anthropic'], type: 'standby' },
        'coagulatio-google': { nodes: ['coagulatio', 'google'], type: 'standby' },
        'coagulatio-ollama': { nodes: ['coagulatio', 'ollama'], type: 'standby' },
        
        // Final connections
        'coagulatio-hub': { nodes: ['coagulatio', 'hub'], type: 'standby' },
        'hub-output': { nodes: ['hub', 'output'], type: 'input-output' }
    };
    
    // Create curved path
    function createCurvedPath(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        
        const px = -dy / dr;
        const py = dx / dr;
        
        const offset = dr * 0.2;
        const cx = mx + px * offset;
        const cy = my + py * offset;
        
        return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
    }
    
    // Create all connection paths
    function createAllConnections() {
        const svg = document.getElementById('hex-flow-board');
        if (!svg) return;
        
        let connectionsLayer = svg.querySelector('.connections-layer');
        if (!connectionsLayer) {
            connectionsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            connectionsLayer.setAttribute('class', 'connections-layer');
            svg.insertBefore(connectionsLayer, svg.firstChild);
        }
        
        connectionsLayer.innerHTML = '';
        
        Object.entries(CONNECTIONS).forEach(([key, conn]) => {
            const [node1Id, node2Id] = conn.nodes;
            const node1 = document.querySelector(`[data-id="${node1Id}"]`);
            const node2 = document.querySelector(`[data-id="${node2Id}"]`);
            
            if (!node1 || !node2) return;
            
            const transform1 = node1.getAttribute('transform');
            const transform2 = node2.getAttribute('transform');
            
            const match1 = transform1.match(/translate\(([^,]+),\s*([^)]+)\)/);
            const match2 = transform2.match(/translate\(([^,]+),\s*([^)]+)\)/);
            
            if (!match1 || !match2) return;
            
            const x1 = parseFloat(match1[1]);
            const y1 = parseFloat(match1[2]);
            const x2 = parseFloat(match2[1]);
            const y2 = parseFloat(match2[2]);
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', createCurvedPath(x1, y1, x2, y2));
            path.setAttribute('data-connection', key);
            path.setAttribute('data-connection-type', conn.type);
            path.setAttribute('data-from', node1Id);
            path.setAttribute('data-to', node2Id);
            path.setAttribute('class', `connection-path connection-${conn.type}`);
            path.setAttribute('fill', 'none');
            
            const style = CONNECTION_STYLES[conn.type];
            path.setAttribute('stroke', style.stroke);
            path.setAttribute('stroke-width', style.strokeWidth);
            if (style.dashArray !== 'none') {
                path.setAttribute('stroke-dasharray', style.dashArray);
            }
            path.setAttribute('opacity', style.opacity);
            
            connectionsLayer.appendChild(path);
        });
    }
    
    // Animate connection
    function animateConnection(connectionKey, animationType = 'active-processing') {
        const path = document.querySelector(`[data-connection="${connectionKey}"]`);
        if (!path) return;
        
        const style = CONNECTION_STYLES[animationType];
        
        path.setAttribute('data-connection-type', animationType);
        path.setAttribute('stroke', style.stroke);
        path.setAttribute('stroke-width', style.strokeWidth);
        if (style.dashArray !== 'none') {
            path.setAttribute('stroke-dasharray', style.dashArray);
        } else {
            path.removeAttribute('stroke-dasharray');
        }
        path.setAttribute('opacity', style.opacity);
        
        const animClass = `flow-anim-${Date.now()}`;
        const animStyle = document.createElement('style');
        
        if (!path.id) {
            path.id = 'path-' + connectionKey;
        }
        
        // Create animation based on type
        if (animationType === 'active-processing') {
            animStyle.textContent = `
                .${animClass} {
                    stroke: ${style.stroke} !important;
                    stroke-width: ${style.strokeWidth} !important;
                    filter: drop-shadow(0 0 10px ${style.stroke});
                    animation: pulse-glow-${animClass} 2s ease-in-out infinite;
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
            animStyle.textContent = `
                .${animClass} {
                    stroke: ${style.stroke} !important;
                    stroke-width: ${style.strokeWidth} !important;
                    filter: drop-shadow(0 0 15px ${style.stroke});
                    animation: golden-glow-${animClass} 1.5s ease-in-out infinite;
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
            animStyle.textContent = `
                .${animClass} {
                    stroke: ${style.stroke} !important;
                    stroke-width: ${style.strokeWidth} !important;
                    animation: ready-pulse-${animClass} 1.8s ease-in-out infinite;
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
        
        // Reset after animation
        const resetDuration = animationType === 'active-processing' ? 2500 : 2000;
        setTimeout(() => {
            path.classList.remove(animClass);
            animStyle.remove();
            
            const standbyStyle = CONNECTION_STYLES['standby'];
            path.setAttribute('data-connection-type', 'standby');
            path.setAttribute('stroke', standbyStyle.stroke);
            path.setAttribute('stroke-width', standbyStyle.strokeWidth);
            path.setAttribute('stroke-dasharray', standbyStyle.dashArray);
            path.setAttribute('opacity', standbyStyle.opacity);
        }, resetDuration);
    }
    
    // Complete flow animation
    async function animateCompleteFlow() {
        const sequence = [
            // Input phase
            { connections: [
                { key: 'input-hub', type: 'input-output', delay: 0 },
                { key: 'input-prima', type: 'ready-flow', delay: 200 }
            ], duration: 2000 },
            
            // Prima processing
            { connections: [
                { key: 'prima-parse', type: 'active-processing', delay: 0 },
                { key: 'prima-extract', type: 'active-processing', delay: 100 },
                { key: 'prima-validate', type: 'active-processing', delay: 200 },
                { key: 'prima-openai', type: 'active-processing', delay: 400 },
                { key: 'prima-anthropic', type: 'active-processing', delay: 500 },
                { key: 'prima-hub', type: 'ready-flow', delay: 1000 }
            ], duration: 2500 },
            
            // Solutio phase
            { connections: [
                { key: 'hub-solutio', type: 'ready-flow', delay: 0 },
                { key: 'solutio-refine', type: 'active-processing', delay: 200 },
                { key: 'solutio-flow', type: 'active-processing', delay: 300 },
                { key: 'solutio-finalize', type: 'active-processing', delay: 400 },
                { key: 'solutio-hub', type: 'ready-flow', delay: 1000 }
            ], duration: 2000 },
            
            // Coagulatio phase
            { connections: [
                { key: 'hub-coagulatio', type: 'ready-flow', delay: 0 },
                { key: 'coagulatio-optimize', type: 'active-processing', delay: 200 },
                { key: 'coagulatio-judge', type: 'active-processing', delay: 300 },
                { key: 'coagulatio-database', type: 'active-processing', delay: 400 },
                { key: 'coagulatio-hub', type: 'ready-flow', delay: 1000 }
            ], duration: 2000 },
            
            // Output
            { connections: [
                { key: 'hub-output', type: 'input-output', delay: 0 }
            ], duration: 1500 }
        ];
        
        for (const phase of sequence) {
            phase.connections.forEach(conn => {
                setTimeout(() => animateConnection(conn.key, conn.type), conn.delay);
            });
            await new Promise(resolve => setTimeout(resolve, phase.duration));
        }
    }
    
    // Initialize
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        setTimeout(() => {
            createAllConnections();
            
            const generateForm = document.getElementById('generate-form');
            if (generateForm) {
                generateForm.addEventListener('submit', function(e) {
                    setTimeout(() => animateCompleteFlow(), 100);
                }, true);
            }
        }, 1000);
    }
    
    init();
    
    // Export API
    window.EngineFlowConnections = {
        animateConnection: animateConnection,
        animateFlow: animateCompleteFlow,
        createConnections: createAllConnections
    };
})();