// Unified Hexagonal Flow System
// Combines HexFlowBoard and InteractiveHexFlowBoard into a single, non-duplicating system

class UnifiedHexFlow {
    constructor() {
        console.log('🚀 UnifiedHexFlow: Constructor starting...');
        console.log('Document ready state:', document.readyState);
        console.log('Looking for elements...');
        
        this.container = document.getElementById('hex-flow-container');
        this.svg = document.getElementById('hex-flow-board');
        this.tooltip = document.getElementById('hex-tooltip');
        this.nodesGroup = document.getElementById('hex-nodes');
        this.pathsGroup = document.getElementById('connection-paths');
        this.particlesGroup = document.getElementById('flow-particles');
        
        console.log('Elements found:', {
            container: !!this.container,
            svg: !!this.svg,
            tooltip: !!this.tooltip,
            nodesGroup: !!this.nodesGroup,
            pathsGroup: !!this.pathsGroup,
            particlesGroup: !!this.particlesGroup
        });
        
        if (!this.container) console.error('❌ hex-flow-container not found!');
        if (!this.svg) console.error('❌ hex-flow-board not found!');
        if (!this.nodesGroup) console.error('❌ hex-nodes not found!');
        if (!this.pathsGroup) console.error('❌ connection-paths not found!');
        
        // State management
        this.nodes = new Map();
        this.connections = new Map();
        this.zoomLevel = 1;
        this.currentPhase = null;
        this.isProcessing = false;
        this.processStages = [];
        
        // Configuration
        this.hexSize = 35;
        this.hexHeight = Math.sqrt(3) * this.hexSize;
        this.hexWidth = 2 * this.hexSize;
        
        // Initialize if DOM elements exist
        if (this.validateElements()) {
            // Don't call init here - it's called at the end of constructor
            console.log('DOM elements validated');
        }
    }
    
    validateElements() {
        const required = [
            { element: this.container, name: 'hex-flow-container' },
            { element: this.svg, name: 'hex-flow-board' },
            { element: this.nodesGroup, name: 'hex-nodes' },
            { element: this.pathsGroup, name: 'connection-paths' }
        ];
        
        console.log('UnifiedHexFlow: Validating elements...');
        console.log('Container:', this.container);
        console.log('SVG:', this.svg);
        console.log('NodesGroup:', this.nodesGroup);
        console.log('PathsGroup:', this.pathsGroup);
        
        const missing = required.filter(({ element }) => !element);
        if (missing.length > 0) {
            console.warn('UnifiedHexFlow: Missing elements:', missing.map(({ name }) => name));
        }
        
        return this.container && this.svg && this.nodesGroup && this.pathsGroup;
    }
    
    init() {
        console.log('UnifiedHexFlow: init() called');
        // Check if nodes already exist from server-side rendering
        const existingNodes = this.nodesGroup.querySelectorAll('.hex-node');
        console.log('Existing nodes found:', existingNodes.length);
        
        if (existingNodes.length > 0) {
            console.log('Found existing server-rendered nodes, integrating them...');
            this.integrateServerNodes();
        } else {
            console.log('No existing nodes, creating fresh network...');
            // No existing nodes, create fresh
            this.clearExistingNodes();
            this.createNodeNetwork();
        }
        
        console.log('Creating connections...');
        // Always recreate connections and setup interactions
        this.createConnections();
        console.log('Total connections created:', this.connections.size);
        
        this.setupInteractions();
        this.setupZoomControls();
        this.setupDragPan();
        this.setupHTMXEventListeners();
        this.setupProcessListener();
        
        // Clean up any stray JSON
        this.setupCleanupObserver();
        
        console.log('✨ Unified hex flow system initialized');
    }
    
    clearExistingNodes() {
        // Only clear nodes that we created, not server-rendered ones
        if (this.nodesGroup) {
            // Mark all nodes created by this instance
            this.nodesGroup.querySelectorAll('.hex-node[data-client-created="true"]').forEach(node => {
                node.remove();
            });
        }
        
        if (this.pathsGroup) {
            // Clear all paths since we'll recreate connections
            while (this.pathsGroup.firstChild) {
                this.pathsGroup.removeChild(this.pathsGroup.firstChild);
            }
        }
        
        if (this.particlesGroup) {
            while (this.particlesGroup.firstChild) {
                this.particlesGroup.removeChild(this.particlesGroup.firstChild);
            }
        }
        
        // Clear internal state
        this.nodes.clear();
        this.connections.clear();
        this.processStages = [];
    }
    
    integrateServerNodes() {
        // Map server-rendered nodes into our internal state
        const existingNodes = this.nodesGroup.querySelectorAll('.hex-node');
        
        existingNodes.forEach(nodeElement => {
            const nodeId = nodeElement.getAttribute('data-id');
            const transform = nodeElement.getAttribute('transform');
            const match = transform ? transform.match(/translate\(([^,]+),\s*([^)]+)\)/) : null;
            
            if (nodeId && match) {
                const x = parseFloat(match[1]);
                const y = parseFloat(match[2]);
                
                // Extract node configuration from DOM
                const textElement = nodeElement.querySelector('text');
                const title = textElement ? textElement.textContent : nodeId;
                
                // Determine type from classes
                const classList = Array.from(nodeElement.classList);
                const type = classList.find(c => c !== 'hex-node') || 'default';
                
                // Extract color from stroke
                const hexagon = nodeElement.querySelector('polygon');
                const color = hexagon ? hexagon.getAttribute('stroke') : '#3498db';
                
                // Create node config
                const nodeConfig = {
                    id: nodeId,
                    x: x,
                    y: y,
                    type: type,
                    title: title,
                    color: color,
                    element: nodeElement
                };
                
                // Store node config on element for interactions
                nodeElement.nodeConfig = nodeConfig;
                
                // Add to internal state
                this.nodes.set(nodeId, nodeConfig);
                
                // Track process stages if applicable
                if (nodeElement.hasAttribute('data-phase')) {
                    const phase = parseFloat(nodeElement.getAttribute('data-phase'));
                    this.processStages.push({
                        id: nodeId,
                        config: nodeConfig,
                        element: nodeElement,
                        phase: phase
                    });
                }
            }
        });
        
        // Sort process stages
        this.processStages.sort((a, b) => a.phase - b.phase);
    }
    
    generateRadialLayout() {
        // Central coordinates for the entire visualization
        const centerX = 500;
        const centerY = 350;
        const hexRadius = this.hexSize; // Hexagon size for collision detection
        const minSpacing = hexRadius * 2.5; // Minimum distance between hex centers
        
        // Define node categories with collision-aware spacing
        const nodeCategories = {
            core: {
                nodes: [
                    { id: 'hub', title: 'Transmutation Core', description: 'Central processing and routing engine', 
                      icon: '⚛', color: '#ff6b35', type: 'core', phase: 2 }
                ],
                radius: 0, // Central position
                startAngle: 0
            },
            
            mainPhases: {
                nodes: [
                    { id: 'prima', title: 'Prima Materia', description: 'Extract raw essence and structure from input', 
                      technical: 'Phase 1: Applies prima_materia template', icon: '🔬', color: '#ff6b6b', 
                      type: 'phase-prima', phase: 1, image: 'prima_materia' },
                    { id: 'solutio', title: 'Solutio', description: 'Dissolve into natural flowing language', 
                      technical: 'Phase 2: Uses solutio template', icon: '💧', color: '#4ecdc4', 
                      type: 'phase-solutio', phase: 3, image: 'solutio' },
                    { id: 'coagulatio', title: 'Coagulatio', description: 'Crystallize into final prompt form', 
                      technical: 'Phase 3: Applies coagulatio template', icon: '💎', color: '#45b7d1', 
                      type: 'phase-coagulatio', phase: 4, image: 'coagulatio' }
                ],
                radius: 140, // Increased from 120 for better spacing
                startAngle: -90 // Start at top
            },
            
            gateways: {
                nodes: [
                    { id: 'input', title: 'Input Gateway', description: 'Entry point where raw ideas enter the system', 
                      technical: 'Accepts text input and prepares for processing', icon: '⚡', color: '#ffcc33', 
                      type: 'special', phase: 0 },
                    { id: 'output', title: 'Output Gateway', description: 'Refined prompt ready for use - The final distilled product', 
                      technical: 'Final output with golden celebration glow when complete', 
                      icon: '✨', color: '#ffd700', type: 'special', phase: 5 } // Changed to golden color
                ],
                radius: 320, // Increased for maximum separation at grid ends
                startAngle: 180 // Input on left (180°), output on right (0°)
            },
            
            processors: {
                nodes: [
                    { id: 'parse', title: 'Parse Structure', description: 'Analyze and break down input components', 
                      icon: '🔍', color: '#3498db', type: 'enhanced', phase: 1.1 },
                    { id: 'extract', title: 'Extract Concepts', description: 'Identify key ideas and patterns', 
                      icon: '💡', color: '#e74c3c', type: 'enhanced', phase: 1.2 },
                    { id: 'flow', title: 'Language Flow', description: 'Transform into natural expression', 
                      icon: '🌊', color: '#4ecdc4', type: 'enhanced', phase: 3.1 },
                    { id: 'refine', title: 'Refine Style', description: 'Polish and enhance clarity', 
                      icon: '✨', color: '#4ecdc4', type: 'enhanced', phase: 3.2 },
                    { id: 'validate', title: 'Quality Check', description: 'Validate output quality', 
                      icon: '✅', color: '#2ecc71', type: 'validator', phase: 4.1 },
                    { id: 'finalize', title: 'Finalize', description: 'Prepare final output', 
                      icon: '📋', color: '#2ecc71', type: 'validator', phase: 4.2 }
                ],
                radius: 200, // Increased from 170 for better spacing
                startAngle: -30 // Adjusted to distribute better around phases
            },
            
            features: {
                nodes: [
                    { id: 'optimize', title: 'Multi-Phase Optimizer', description: 'Advanced optimization across all phases', 
                      icon: '🔧', color: '#9b59b6', type: 'feature' },
                    { id: 'judge', title: 'AI Judge', description: 'Quality assessment and scoring', 
                      icon: '⚖️', color: '#e67e22', type: 'feature' },
                    { id: 'database', title: 'Vector Storage', description: 'Store and retrieve similar prompts', 
                      icon: '💾', color: '#34495e', type: 'feature' }
                ],
                radius: 320, // Increased from 260 for outermost ring
                startAngle: 210 // Bottom area, adjusted for better distribution
            },

            providers: {
                nodes: [
                    { id: 'openai', title: 'OpenAI', description: 'GPT-4, GPT-3.5, etc.', icon: '🤖', color: '#10a37f', type: 'provider' },
                    { id: 'anthropic', title: 'Anthropic', description: 'Claude 3, etc.', icon: '📚', color: '#d07d5b', type: 'provider' },
                    { id: 'google', title: 'Google', description: 'Gemini, etc.', icon: '✨', color: '#4285f4', type: 'provider' },
                    { id: 'grok', title: 'Grok', description: 'Grok-1, etc.', icon: '🚀', color: '#fbbc05', type: 'provider' },
                    { id: 'openrouter', title: 'OpenRouter', description: 'Access to multiple models', icon: '↔️', color: '#9b59b6', type: 'provider' },
                    { id: 'ollama', title: 'Ollama', description: 'Local models', icon: '💻', color: '#e74c3c', type: 'provider' }
                ],
                radius: 450, // Outermost ring
                startAngle: 0
            }
        };
        
        // Generate positions with collision detection
        const allNodes = [];
        const placedNodes = []; // Track all placed nodes for collision detection
        
        Object.entries(nodeCategories).forEach(([categoryName, category]) => {
            const { nodes, radius, startAngle } = category;
            
            if (categoryName === 'core') {
                // Central core - no collision issues
                nodes[0].x = centerX;
                nodes[0].y = centerY;
                allNodes.push(nodes[0]);
                placedNodes.push({ x: centerX, y: centerY, radius: hexRadius });
                return;
            }
            
            // Calculate optimal angle distribution to avoid collisions
            const baseAngleStep = nodes.length > 1 ? 360 / nodes.length : 0;
            
            nodes.forEach((node, index) => {
                let attempts = 0;
                let placed = false;
                
                while (!placed && attempts < 20) {
                    // Try different angle adjustments to avoid collisions
                    const angleAdjustment = attempts * 15; // Increase angle by 15° each attempt
                    const angle = (startAngle + (baseAngleStep * index) + angleAdjustment) * (Math.PI / 180);
                    const testX = centerX + radius * Math.cos(angle);
                    const testY = centerY + radius * Math.sin(angle);
                    
                    // Check for collisions with already placed nodes
                    const hasCollision = placedNodes.some(placedNode => {
                        const distance = Math.sqrt(
                            Math.pow(testX - placedNode.x, 2) + 
                            Math.pow(testY - placedNode.y, 2)
                        );
                        return distance < minSpacing;
                    });
                    
                    if (!hasCollision) {
                        // Position is clear
                        node.x = testX;
                        node.y = testY;
                        placedNodes.push({ x: testX, y: testY, radius: hexRadius });
                        placed = true;
                    } else {
                        attempts++;
                        // If we can't find a spot on this radius, try slightly larger radius
                        if (attempts > 10) {
                            radius += 20;
                        }
                    }
                }
                
                // Fallback: if still not placed, use original calculation with warning
                if (!placed) {
                    console.warn(`Could not find collision-free position for node ${node.id}, using fallback`);
                    const angle = (startAngle + (baseAngleStep * index)) * (Math.PI / 180);
                    node.x = centerX + radius * Math.cos(angle);
                    node.y = centerY + radius * Math.sin(angle);
                }
                
                allNodes.push(node);
            });
        });
        
        console.log(`Generated ${allNodes.length} nodes with collision detection`);
        console.log('Generated nodes:', allNodes);
        return allNodes;
    }
    
    // Collision detection helper method
    checkCollision(x1, y1, x2, y2, minDistance) {
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        return distance < minDistance;
    }
    
    createNodeNetwork() {
        console.log('createNodeNetwork: Starting node creation...');
        
        try {
            // Calculate radial positions for a clean circular layout
            const nodeDefinitions = this.generateRadialLayout();
            console.log('createNodeNetwork: Got node definitions:', nodeDefinitions.length);
            
            if (!nodeDefinitions || nodeDefinitions.length === 0) {
                console.error('❌ No node definitions generated!');
                return;
            }
            
            // Log the nodesGroup element
            console.log('createNodeNetwork: nodesGroup element:', this.nodesGroup);
            console.log('createNodeNetwork: nodesGroup parent:', this.nodesGroup?.parentElement);
            
            if (!this.nodesGroup) {
                console.error('❌ nodesGroup is null or undefined!');
                return;
            }
            
            // Create nodes
            nodeDefinitions.forEach((nodeDef, index) => {
                try {
                    console.log(`createNodeNetwork: Creating node ${index + 1}/${nodeDefinitions.length}:`, nodeDef.id);
                    const node = this.createHexNode(nodeDef);
                    if (!node || !node.element) {
                        console.error(`❌ Failed to create node element for ${nodeDef.id}`);
                        return;
                    }
                    this.nodes.set(nodeDef.id, node);
                    
                    // Detailed appendChild debugging
                    console.log(`Attempting appendChild for ${nodeDef.id}...`);
                    console.log('- nodesGroup exists:', !!this.nodesGroup);
                    console.log('- nodesGroup type:', this.nodesGroup?.constructor?.name);
                    console.log('- node.element exists:', !!node.element);
                    console.log('- node.element type:', node.element?.constructor?.name);
                    console.log('- nodesGroup children before:', this.nodesGroup?.children?.length || 0);
                    
                    try {
                        this.nodesGroup.appendChild(node.element);
                        console.log('- appendChild succeeded');
                        console.log('- nodesGroup children after:', this.nodesGroup?.children?.length || 0);
                        console.log(`✅ Node ${nodeDef.id} added to DOM`);
                    } catch (appendError) {
                        console.error(`❌ appendChild failed for ${nodeDef.id}:`, appendError);
                        console.error('Error details:', appendError.message, appendError.stack);
                    }
                    
                    // Track process stages
                    if (typeof nodeDef.phase === 'number') {
                        this.processStages.push({ 
                            id: nodeDef.id, 
                            config: nodeDef, 
                            element: node.element,
                            phase: nodeDef.phase
                        });
                    }
                } catch (nodeError) {
                    console.error(`❌ Error creating node ${nodeDef.id}:`, nodeError);
                }
            });
        } catch (error) {
            console.error('❌ createNodeNetwork failed:', error);
            console.error('Stack trace:', error.stack);
        }
        
        console.log('createNodeNetwork: Total nodes created:', this.nodes.size);
        console.log('createNodeNetwork: Process stages:', this.processStages.length);
        console.log('createNodeNetwork: Nodes in DOM:', this.nodesGroup.querySelectorAll('.hex-node').length);
        
        // Sort process stages by phase
        this.processStages.sort((a, b) => a.phase - b.phase);
    }
    
    createHexNode(config) {
        console.log(`createHexNode: Creating node ${config.id} at (${config.x}, ${config.y})`);
        
        let g;
        try {
            if (!config || !config.id || config.x === undefined || config.y === undefined) {
                console.error('❌ Invalid config for createHexNode:', config);
                return null;
            }
            
            g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            if (!g) {
                console.error('❌ Failed to create SVG g element');
                return null;
            }
            
            g.setAttribute('class', `hex-node ${config.type || ''}`);
            g.setAttribute('data-id', config.id);
            g.setAttribute('data-client-created', 'true');  // Mark as client-created
            g.setAttribute('transform', `translate(${config.x}, ${config.y})`);
            
            // Add phase data if available
            if (typeof config.phase === 'number') {
                g.setAttribute('data-phase', config.phase);
            }
            
            // Create hexagon shape
            const hex = this.createHexagon(0, 0, this.hexSize);
            if (!hex) {
                console.error('❌ Failed to create hexagon for', config.id);
                return null;
            }
            
            hex.setAttribute('fill', `${config.color || '#ffffff'}20`);
            hex.setAttribute('stroke', config.color || '#ffffff');
            hex.setAttribute('stroke-width', '2');
            g.appendChild(hex);
            
            console.log(`✅ createHexNode: Created element for ${config.id}`);
            
            // Add icon or image
            if (config.image) {
                const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                image.setAttribute('x', -25);
                image.setAttribute('y', -25);
                image.setAttribute('width', 50);
                image.setAttribute('height', 50);
                image.setAttribute('href', `/static/assets/${config.image}.png?v=${Date.now()}`);
                image.style.mask = 'radial-gradient(ellipse at center, black 30%, transparent 65%)';
                image.style.webkitMask = 'radial-gradient(ellipse at center, black 30%, transparent 65%)';
                g.appendChild(image);
            } else if (config.icon) {
                const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                iconText.setAttribute('text-anchor', 'middle');
                iconText.setAttribute('dominant-baseline', 'middle');
                iconText.setAttribute('font-size', '24');
                iconText.setAttribute('fill', config.color);
                iconText.textContent = config.icon;
                g.appendChild(iconText);
            }
            
            // Add text label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('y', this.hexSize + 20);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('class', 'hex-node-text');
            text.setAttribute('fill', '#ecf0f1');
            text.setAttribute('font-size', '12');
            text.textContent = config.title;
            g.appendChild(text);
            
            // Store config for interactions
            g.nodeConfig = config;
            
            console.log(`✅ createHexNode: Successfully created complete node for ${config.id}`);
            
            return {
                element: g,
                ...config
            };
        } catch (error) {
            console.error(`❌ createHexNode error for ${config.id}:`, error);
            console.error('Error stack:', error.stack);
            return null;
        }
    }
    
    createHexagon(cx, cy, size) {
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const points = [];
        
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const x = cx + size * Math.cos(angle);
            const y = cy + size * Math.sin(angle);
            points.push(`${x},${y}`);
        }
        
        polygon.setAttribute('points', points.join(' '));
        return polygon;
    }
    
    createConnections() {
        // Clear existing connections first
        if (this.pathsGroup) {
            while (this.pathsGroup.firstChild) {
                this.pathsGroup.removeChild(this.pathsGroup.firstChild);
            }
        }
        this.connections.clear();
        
        // Optimized connections for radial layout - minimize crossings
        const connectionDefs = [
            // Primary radial connections from core to main phases
            { from: 'hub', to: 'prima', type: 'primary-radial', priority: 1 },
            { from: 'hub', to: 'solutio', type: 'primary-radial', priority: 1 },
            { from: 'hub', to: 'coagulatio', type: 'primary-radial', priority: 1 },
            
            // Gateway connections (input/output)
            { from: 'input', to: 'hub', type: 'gateway', priority: 2 },
            { from: 'hub', to: 'output', type: 'gateway', priority: 2 },
            
            // Phase supporting connections (curved to avoid center)
            { from: 'prima', to: 'parse', type: 'phase-support', priority: 3 },
            { from: 'prima', to: 'extract', type: 'phase-support', priority: 3 },
            { from: 'solutio', to: 'flow', type: 'phase-support', priority: 3 },
            { from: 'solutio', to: 'refine', type: 'phase-support', priority: 3 },
            { from: 'coagulatio', to: 'validate', type: 'phase-support', priority: 3 },
            { from: 'coagulatio', to: 'finalize', type: 'phase-support', priority: 3 },
            
            // Sequential flow connections (outer ring)
            { from: 'input', to: 'prima', type: 'flow-sequence', priority: 4 },
            { from: 'prima', to: 'solutio', type: 'flow-sequence', priority: 4 },
            { from: 'solutio', to: 'coagulatio', type: 'flow-sequence', priority: 4 },
            { from: 'coagulatio', to: 'output', type: 'flow-sequence', priority: 4 },
            
            // Feature connections (subtle, outer)
            { from: 'hub', to: 'optimize', type: 'feature', priority: 5 },
            { from: 'hub', to: 'judge', type: 'feature', priority: 5 },
            { from: 'hub', to: 'database', type: 'feature', priority: 5 },

            // Provider connections
            { from: 'hub', to: 'openai', type: 'provider', priority: 6 },
            { from: 'hub', to: 'anthropic', type: 'provider', priority: 6 },
            { from: 'hub', to: 'google', type: 'provider', priority: 6 },
            { from: 'hub', to: 'grok', type: 'provider', priority: 6 },
            { from: 'hub', to: 'openrouter', type: 'provider', priority: 6 },
            { from: 'hub', to: 'ollama', type: 'provider', priority: 6 }
        ];
        
        connectionDefs.forEach(connDef => {
            const fromNode = this.nodes.get(connDef.from);
            const toNode = this.nodes.get(connDef.to);
            
            if (fromNode && toNode) {
                const path = this.createRadialOptimizedConnection(fromNode, toNode, connDef.type, connDef.priority);
                this.connections.set(`${connDef.from}-${connDef.to}`, {
                    path,
                    from: connDef.from,
                    to: connDef.to,
                    type: connDef.type,
                    priority: connDef.priority
                });
                this.pathsGroup.appendChild(path);
            }
        });
    }
    
    createRadialOptimizedConnection(fromNode, toNode, type, priority) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Generate optimized path based on connection type and radial layout
        let pathData, strokeStyle, opacity;
        
        switch (type) {
            case 'primary-radial':
                // Direct lines from core to main phases
                pathData = `M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`;
                strokeStyle = { width: 3, color: '#4ecdc4', opacity: 0.8, dashArray: '10,10' };
                break;
                
            case 'gateway':
                // Smooth curves for input/output
                const midX = (fromNode.x + toNode.x) / 2;
                const midY = (fromNode.y + toNode.y) / 2;
                pathData = `M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY - 30} ${toNode.x} ${toNode.y}`;
                strokeStyle = { width: 4, color: '#ffcc33', opacity: 0.9 };
                break;
                
            case 'phase-support':
                // Curved connections that avoid the center
                const dx = toNode.x - fromNode.x;
                const dy = toNode.y - fromNode.y;
                const centerX = 500, centerY = 350; // Avoid the core
                
                // Calculate control point that curves away from center
                const controlX = fromNode.x + dx * 0.3 + (fromNode.x > centerX ? 40 : -40);
                const controlY = fromNode.y + dy * 0.3 + (fromNode.y > centerY ? 40 : -40);
                
                pathData = `M ${fromNode.x} ${fromNode.y} Q ${controlX} ${controlY} ${toNode.x} ${toNode.y}`;
                strokeStyle = { width: 2, color: '#3498db', opacity: 0.6 };
                break;
                
            case 'flow-sequence':
                // Outer ring connections with gentle curves
                const radius = 280; // Outer radius
                const centerAng = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
                const arcX = 500 + radius * Math.cos(centerAng);
                const arcY = 350 + radius * Math.sin(centerAng);
                
                pathData = `M ${fromNode.x} ${fromNode.y} Q ${arcX} ${arcY} ${toNode.x} ${toNode.y}`;
                strokeStyle = { width: 2.5, color: '#2ecc71', opacity: 0.7 };
                break;
                
            case 'feature':
                // Subtle dashed lines for features
                const featureMidX = (fromNode.x + toNode.x) / 2;
                const featureMidY = (fromNode.y + toNode.y) / 2 + 20;
                pathData = `M ${fromNode.x} ${fromNode.y} Q ${featureMidX} ${featureMidY} ${toNode.x} ${toNode.y}`;
                strokeStyle = { width: 2, color: '#95a5a6', opacity: 0.4, dashArray: '5,5' };
                break;
                
            default:
                // Fallback connection
                pathData = `M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`;
                strokeStyle = { width: 2, color: '#3498db', opacity: 0.5 };
        }
        
        // Apply path styling
        path.setAttribute('d', pathData);
        path.setAttribute('class', `hex-path ${type} priority-${priority}`);
        path.setAttribute('id', `path-${fromNode.id}-${toNode.id}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', strokeStyle.color);
        path.setAttribute('stroke-width', strokeStyle.width);
        path.setAttribute('stroke-opacity', strokeStyle.opacity);
        
        if (strokeStyle.dashArray) {
            path.setAttribute('stroke-dasharray', strokeStyle.dashArray);
        }
        
        return path;
    }
    
    createConnection(fromNode, toNode, type) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Calculate curved path
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const cx = fromNode.x + dx / 2;
        const cy = fromNode.y + dy / 2 - Math.abs(dx) * 0.1;
        
        const d = `M ${fromNode.x} ${fromNode.y} Q ${cx} ${cy} ${toNode.x} ${toNode.y}`;
        path.setAttribute('d', d);
        path.setAttribute('class', `hex-path ${type}`);
        path.setAttribute('id', `path-${fromNode.id}-${toNode.id}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#3498db');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-opacity', '0.3');
        
        if (type === 'feature') {
            path.setAttribute('stroke-dasharray', '5,5');
        }
        
        return path;
    }
    
    setupInteractions() {
        // Node hover
        this.nodesGroup.addEventListener('mouseenter', (e) => {
            const node = e.target.closest('.hex-node');
            if (node && node.nodeConfig) {
                this.showTooltip(e, node.nodeConfig);
                this.highlightConnections(node.nodeConfig.id);
            }
        }, true);
        
        this.nodesGroup.addEventListener('mouseleave', (e) => {
            const node = e.target.closest('.hex-node');
            if (node) {
                this.hideTooltip();
                this.resetConnections();
            }
        }, true);
        
        // Node click
        this.nodesGroup.addEventListener('click', (e) => {
            const node = e.target.closest('.hex-node');
            if (node && node.nodeConfig) {
                this.activateNode(node.nodeConfig);
            }
        });
        
        // Setup clean node interactions (hover and click only)
        this.setupCleanNodeInteractions();
    }
    
    setupCleanNodeInteractions() {
        // Enhanced hover effects for the radial layout
        this.nodesGroup.addEventListener('mouseenter', (e) => {
            const node = e.target.closest('.hex-node');
            if (node && node.nodeConfig) {
                // Add hover state
                node.classList.add('hover-state');
                
                // Show tooltip with enhanced positioning
                this.showTooltip(e, node.nodeConfig);
                
                // Highlight connected nodes with radial-aware logic
                this.highlightRadialConnections(node.nodeConfig.id);
                
                // Subtle animation for connected paths
                this.animateConnectedPaths(node.nodeConfig.id, true);
            }
        });
        
        this.nodesGroup.addEventListener('mouseleave', (e) => {
            const node = e.target.closest('.hex-node');
            if (node) {
                // Remove hover state
                node.classList.remove('hover-state');
                
                // Hide tooltip
                this.hideTooltip();
                
                // Reset connection highlighting
                this.resetConnections();
                
                // Stop path animations
                this.animateConnectedPaths(node.nodeConfig?.id, false);
            }
        });
        
        // Clean click interactions for activation
        this.nodesGroup.addEventListener('click', (e) => {
            const node = e.target.closest('.hex-node');
            if (node && node.nodeConfig) {
                // Activate node with radial-aware effects
                this.activateNodeInRadialLayout(node.nodeConfig);
                
                // Optional: Zoom focus on clicked node
                this.focusOnNode(node.nodeConfig);
            }
        });
    }
    
    // Convert screen coordinates to SVG coordinates accounting for viewBox
    getPointInSVG(screenPoint) {
        const svgRect = this.svg.getBoundingClientRect();
        const viewBox = this.svg.viewBox.baseVal;
        
        // Calculate the ratio between screen pixels and SVG units
        const scaleX = viewBox.width / svgRect.width;
        const scaleY = viewBox.height / svgRect.height;
        
        // Convert screen coordinates to SVG coordinates
        const svgX = ((screenPoint.x - svgRect.left) * scaleX) + viewBox.x;
        const svgY = ((screenPoint.y - svgRect.top) * scaleY) + viewBox.y;
        
        return { x: svgX, y: svgY };
    }
    
    // Get boundary constraints for node movement
    getConstraints() {
        const viewBox = this.svg.viewBox.baseVal;
        const padding = this.hexSize * 1.5; // Extra padding for better UX
        
        return {
            minX: viewBox.x + padding,
            maxX: viewBox.x + viewBox.width - padding,
            minY: viewBox.y + padding,
            maxY: viewBox.y + viewBox.height - padding
        };
    }
    
    // Apply grid snapping for better alignment
    applyGridSnapping(x, y, snapSize = 20) {
        // Optional: enable/disable snapping with a class or setting
        if (!this.container.classList.contains('grid-snap-enabled')) {
            return { x, y };
        }
        
        const snappedX = Math.round(x / snapSize) * snapSize;
        const snappedY = Math.round(y / snapSize) * snapSize;
        
        return { x: snappedX, y: snappedY };
    }
    
    // Radial-aware connection highlighting
    highlightRadialConnections(nodeId) {
        this.connections.forEach((conn, key) => {
            if (conn.from === nodeId || conn.to === nodeId) {
                conn.path.classList.add('radial-highlight');
                conn.path.style.strokeOpacity = '0.9';
                conn.path.style.strokeWidth = '3';
                
                // Add pulsing effect for core connections
                if (nodeId === 'hub' || conn.from === 'hub' || conn.to === 'hub') {
                    conn.path.classList.add('core-connection-pulse');
                }
            }
        });
    }
    
    // Enhanced path animations for radial layout
    animateConnectedPaths(nodeId, enable) {
        if (!nodeId) return;
        
        this.connections.forEach((conn, key) => {
            if (conn.from === nodeId || conn.to === nodeId) {
                if (enable) {
                    conn.path.classList.add('path-flow-active');
                } else {
                    conn.path.classList.remove('path-flow-active');
                }
            }
        });
    }
    
    // Radial layout specific node activation
    activateNodeInRadialLayout(nodeConfig) {
        // Clear previous active states
        this.nodesGroup.querySelectorAll('.hex-node').forEach(n => {
            n.classList.remove('active', 'processing', 'radial-focus');
        });
        
        // Activate selected node with radial-specific effects
        const nodeElement = this.nodes.get(nodeConfig.id)?.element;
        if (nodeElement) {
            nodeElement.classList.add('active', 'processing', 'radial-focus');
            
            // Special effect for core node
            if (nodeConfig.id === 'hub') {
                this.activateCoreNode();
            }
            
            // Ripple effect from activated node
            this.createRadialRipple(nodeConfig);
            
            // Start process flow if this is a phase node
            if (nodeConfig.type.startsWith('phase-')) {
                this.currentPhase = nodeConfig.id;
                this.startProcessFlow();
            }
        }
        
        // Remove processing state after animation
        setTimeout(() => {
            if (nodeElement) {
                nodeElement.classList.remove('processing');
            }
        }, 1500);
    }
    
    // Create ripple effect for radial activation
    createRadialRipple(nodeConfig) {
        // Create expanding circle animation from the activated node
        const ripple = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ripple.setAttribute('cx', nodeConfig.x);
        ripple.setAttribute('cy', nodeConfig.y);
        ripple.setAttribute('r', '0');
        ripple.setAttribute('fill', 'none');
        ripple.setAttribute('stroke', nodeConfig.color);
        ripple.setAttribute('stroke-width', '2');
        ripple.setAttribute('opacity', '0.8');
        ripple.classList.add('radial-ripple');
        
        // Add animation
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', '0;80;120');
        animate.setAttribute('dur', '1s');
        animate.setAttribute('fill', 'freeze');
        
        const animateOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animateOpacity.setAttribute('attributeName', 'opacity');
        animateOpacity.setAttribute('values', '0.8;0.4;0');
        animateOpacity.setAttribute('dur', '1s');
        animateOpacity.setAttribute('fill', 'freeze');
        
        ripple.appendChild(animate);
        ripple.appendChild(animateOpacity);
        
        // Add to SVG and remove after animation
        this.svg.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000);
    }
    
    // Special activation for the central core
    activateCoreNode() {
        const coreNode = this.nodes.get('hub')?.element;
        if (coreNode) {
            coreNode.classList.add('core-activated');
            
            // Pulse all main phase connections
            ['prima', 'solutio', 'coagulatio'].forEach(phaseId => {
                const connection = this.connections.get(`hub-${phaseId}`) || 
                                 this.connections.get(`${phaseId}-hub`);
                if (connection) {
                    connection.path.classList.add('core-pulse');
                }
            });
            
            // Remove special states after effect
            setTimeout(() => {
                coreNode.classList.remove('core-activated');
                this.connections.forEach(conn => {
                    conn.path.classList.remove('core-pulse');
                });
            }, 2000);
        }
    }
    
    // Enhanced focus with smooth zoom to node
    focusOnNode(nodeConfig) {
        const targetZoom = 1.3;
        const viewBox = this.svg.viewBox.baseVal;
        const targetW = 1000 / targetZoom;
        const targetH = 700 / targetZoom;
        const targetX = nodeConfig.x - targetW / 2;
        const targetY = nodeConfig.y - targetH / 2;
        
        this.animateViewBox(
            viewBox.x, viewBox.y, viewBox.width, viewBox.height,
            targetX, targetY, targetW, targetH,
            800
        );
        
        this.zoomLevel = targetZoom;
        this.updateZoomDisplay();
    }
    
    updateConnectionPaths(nodeId) {
        // Update all paths connected to this node with smooth curved connections
        this.connections.forEach((conn, key) => {
            if (conn.from === nodeId || conn.to === nodeId) {
                const fromNode = this.nodes.get(conn.from);
                const toNode = this.nodes.get(conn.to);
                
                if (fromNode && toNode) {
                    // Create smooth curved path between nodes
                    const path = this.createSmoothPath(fromNode, toNode, conn.type);
                    conn.path.setAttribute('d', path);
                    
                    // Add visual feedback during drag
                    if (conn.from === nodeId || conn.to === nodeId) {
                        conn.path.classList.add('drag-active');
                    } else {
                        conn.path.classList.remove('drag-active');
                    }
                }
            }
        });
    }
    
    createSmoothPath(fromNode, toNode, connectionType = 'normal') {
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Different curve styles based on connection type
        let path;
        
        switch (connectionType) {
            case 'phase':
                // Stronger curve for phase connections
                const curve1 = distance * 0.4;
                const cx1 = fromNode.x + dx * 0.3;
                const cy1 = fromNode.y + dy * 0.3 - curve1;
                const cx2 = fromNode.x + dx * 0.7;
                const cy2 = fromNode.y + dy * 0.7 - curve1 * 0.5;
                path = `M ${fromNode.x} ${fromNode.y} C ${cx1} ${cy1} ${cx2} ${cy2} ${toNode.x} ${toNode.y}`;
                break;
                
            case 'feature':
                // Subtle curve for feature connections
                const midX = fromNode.x + dx / 2;
                const midY = fromNode.y + dy / 2 - Math.abs(dx) * 0.05;
                path = `M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}`;
                break;
                
            default:
                // Standard quadratic curve
                const curvature = Math.min(distance * 0.25, 50);
                const controlX = fromNode.x + dx / 2;
                const controlY = fromNode.y + dy / 2 - curvature;
                path = `M ${fromNode.x} ${fromNode.y} Q ${controlX} ${controlY} ${toNode.x} ${toNode.y}`;
                break;
        }
        
        return path;
    }
    
    showTooltip(event, nodeConfig) {
        if (!this.tooltip || !nodeConfig) return;
        
        // Update tooltip content
        const titleEl = this.tooltip.querySelector('.tooltip-title');
        const typeEl = this.tooltip.querySelector('.tooltip-type');
        const descEl = this.tooltip.querySelector('.tooltip-description');
        const techEl = this.tooltip.querySelector('.tooltip-technical');
        
        if (titleEl) titleEl.textContent = nodeConfig.title || '';
        if (typeEl) typeEl.textContent = nodeConfig.type.replace(/-/g, ' ').toUpperCase();
        if (descEl) descEl.textContent = nodeConfig.description || '';
        if (techEl && nodeConfig.technical) {
            techEl.textContent = nodeConfig.technical;
            techEl.style.display = 'block';
        } else if (techEl) {
            techEl.style.display = 'none';
        }
        
        // Smart positioning to avoid overlapping hexagons
        const rect = this.container.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Make tooltip visible first to get dimensions
        this.tooltip.style.visibility = 'hidden';
        this.tooltip.classList.add('visible');
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const tooltipWidth = tooltipRect.width;
        const tooltipHeight = tooltipRect.height;
        
        // Check for nearby hexagons and find optimal position
        const optimalPos = this.findOptimalTooltipPosition(
            mouseX, mouseY, tooltipWidth, tooltipHeight, nodeConfig.id
        );
        
        this.tooltip.style.left = `${optimalPos.x}px`;
        this.tooltip.style.top = `${optimalPos.y}px`;
        this.tooltip.style.visibility = 'visible';
    }
    
    findOptimalTooltipPosition(mouseX, mouseY, tooltipWidth, tooltipHeight, currentNodeId) {
        const containerRect = this.container.getBoundingClientRect();
        const padding = 20;
        const hexRadius = this.hexSize + 10; // Extra clearance
        
        // Default positions to try (in order of preference)
        const positions = [
            { x: mouseX + 20, y: mouseY - 10, label: 'right' },
            { x: mouseX - tooltipWidth - 20, y: mouseY - 10, label: 'left' },
            { x: mouseX - tooltipWidth / 2, y: mouseY + 50, label: 'bottom' },
            { x: mouseX - tooltipWidth / 2, y: mouseY - tooltipHeight - 30, label: 'top' },
            { x: mouseX + 20, y: mouseY + 30, label: 'bottom-right' },
        ];
        
        // Check each position for collisions with hexagons
        for (const pos of positions) {
            // Ensure tooltip stays within container bounds
            const adjustedPos = {
                x: Math.max(padding, Math.min(pos.x, containerRect.width - tooltipWidth - padding)),
                y: Math.max(padding, Math.min(pos.y, containerRect.height - tooltipHeight - padding))
            };
            
            // Check if this position overlaps with any hexagon
            const hasCollision = this.checkTooltipHexCollision(
                adjustedPos.x, adjustedPos.y, tooltipWidth, tooltipHeight, currentNodeId
            );
            
            if (!hasCollision) {
                return adjustedPos;
            }
        }
        
        // If all positions have collisions, use the default right position
        return {
            x: Math.max(padding, Math.min(mouseX + 20, containerRect.width - tooltipWidth - padding)),
            y: Math.max(padding, Math.min(mouseY - 10, containerRect.height - tooltipHeight - padding))
        };
    }
    
    checkTooltipHexCollision(tooltipX, tooltipY, tooltipWidth, tooltipHeight, excludeNodeId) {
        const tooltipBounds = {
            left: tooltipX,
            right: tooltipX + tooltipWidth,
            top: tooltipY,
            bottom: tooltipY + tooltipHeight
        };
        
        // Check against all hex nodes
        for (const [nodeId, nodeData] of this.nodes) {
            if (nodeId === excludeNodeId) continue; // Skip the hovered node
            
            const hexBounds = {
                left: nodeData.x - this.hexSize,
                right: nodeData.x + this.hexSize,
                top: nodeData.y - this.hexSize,
                bottom: nodeData.y + this.hexSize
            };
            
            // Check for overlap
            if (!(tooltipBounds.right < hexBounds.left || 
                  tooltipBounds.left > hexBounds.right || 
                  tooltipBounds.bottom < hexBounds.top || 
                  tooltipBounds.top > hexBounds.bottom)) {
                return true; // Collision detected
            }
        }
        
        return false; // No collision
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.classList.remove('visible');
        }
    }
    
    highlightConnections(nodeId) {
        this.connections.forEach((conn, key) => {
            if (conn.from === nodeId || conn.to === nodeId) {
                conn.path.style.strokeOpacity = '0.8';
                conn.path.style.strokeWidth = '3';
            }
        });
    }
    
    resetConnections() {
        this.connections.forEach(conn => {
            conn.path.style.strokeOpacity = '0.3';
            conn.path.style.strokeWidth = '2';
            conn.path.classList.remove('drag-active');
        });
    }
    
    activateNode(nodeConfig) {
        // Clear previous active states
        this.nodesGroup.querySelectorAll('.hex-node').forEach(n => {
            n.classList.remove('active', 'processing');
        });
        
        // Activate selected node
        const nodeElement = this.nodes.get(nodeConfig.id).element;
        nodeElement.classList.add('active', 'processing');
        
        // Start process if this is a phase node
        if (nodeConfig.type.startsWith('phase-')) {
            this.currentPhase = nodeConfig.id;
            this.startProcessFlow();
        }
        
        // Zoom to node
        this.zoomToNode(nodeConfig);
        
        // Remove processing state after animation
        setTimeout(() => {
            nodeElement.classList.remove('processing');
        }, 1000);
    }
    
    setupZoomControls() {
        // Mouse wheel zoom
        this.container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom(delta);
        });
        
        // Zoom button handlers
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const zoomResetBtn = document.getElementById('zoom-reset');
        
        if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.zoom(1.2));
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.zoom(0.8));
        if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => this.resetZoom());
    }
    
    zoom(factor) {
        this.zoomLevel *= factor;
        this.zoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel));
        
        const viewBox = this.svg.viewBox.baseVal;
        const centerX = viewBox.x + viewBox.width / 2;
        const centerY = viewBox.y + viewBox.height / 2;
        const newWidth = 1000 / this.zoomLevel;
        const newHeight = 700 / this.zoomLevel;
        
        this.svg.setAttribute('viewBox', 
            `${centerX - newWidth / 2} ${centerY - newHeight / 2} ${newWidth} ${newHeight}`);
        
        this.updateZoomDisplay();
    }
    
    resetZoom() {
        this.zoomLevel = 1;
        this.svg.setAttribute('viewBox', '0 0 1000 700');
        this.updateZoomDisplay();
    }
    
    updateZoomDisplay() {
        const zoomElement = document.querySelector('.zoom-level');
        if (zoomElement) {
            zoomElement.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        }
    }
    
    zoomToNode(nodeConfig) {
        const targetZoom = 1.2;
        const viewBox = this.svg.viewBox.baseVal;
        const targetW = 1000 / targetZoom;
        const targetH = 700 / targetZoom;
        const targetX = nodeConfig.x - targetW / 2;
        const targetY = nodeConfig.y - targetH / 2;
        
        this.animateViewBox(
            viewBox.x, viewBox.y, viewBox.width, viewBox.height,
            targetX, targetY, targetW, targetH,
            500
        );
        
        this.zoomLevel = targetZoom;
        this.updateZoomDisplay();
    }
    
    animateViewBox(fromX, fromY, fromW, fromH, toX, toY, toW, toH, duration) {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeInOutCubic(progress);
            
            const x = fromX + (toX - fromX) * eased;
            const y = fromY + (toY - fromY) * eased;
            const w = fromW + (toW - fromW) * eased;
            const h = fromH + (toH - fromH) * eased;
            
            this.svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    setupDragPan() {
        let isDragging = false;
        let startX, startY;
        let viewBoxX, viewBoxY;
        
        this.container.addEventListener('mousedown', (e) => {
            if (e.target === this.container || e.target === this.svg) {
                isDragging = true;
                this.container.style.cursor = 'grabbing';
                startX = e.clientX;
                startY = e.clientY;
                const viewBox = this.svg.viewBox.baseVal;
                viewBoxX = viewBox.x;
                viewBoxY = viewBox.y;
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = (startX - e.clientX) / this.zoomLevel;
            const dy = (startY - e.clientY) / this.zoomLevel;
            const viewBox = this.svg.viewBox.baseVal;
            
            this.svg.setAttribute('viewBox', 
                `${viewBoxX + dx} ${viewBoxY + dy} ${viewBox.width} ${viewBox.height}`);
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.container.style.cursor = 'grab';
            }
        });
    }
    
    setupHTMXEventListeners() {
        // Listen for HTMX events
        document.body.addEventListener('htmx:afterRequest', (event) => {
            if (event.detail.successful && event.detail.target.id === 'hex-nodes') {
                // Server has updated the nodes, integrate them
                console.log('HTMX board state update received');
                this.handleServerStateUpdate();
            }
        });
        
        // Listen for HTMX before swap to prevent flicker
        document.body.addEventListener('htmx:beforeSwap', (event) => {
            if (event.detail.target.id === 'hex-nodes') {
                // Clear our client-created nodes before the swap
                this.clearExistingNodes();
            }
        });
        
        // Listen for HTMX after swap to integrate new nodes
        document.body.addEventListener('htmx:afterSwap', (event) => {
            if (event.detail.target.id === 'hex-nodes') {
                // Integrate the new server nodes
                this.integrateServerNodes();
                // Recreate connections
                this.createConnections();
            }
        });
        
        // Handle flow updates
        document.body.addEventListener('sse:flow-update', (event) => {
            const data = JSON.parse(event.detail.data);
            this.handleFlowUpdate(data);
        });
        
        // Handle board state updates
        document.body.addEventListener('board-state', (event) => {
            const data = event.detail;
            this.handleBoardStateUpdate(data);
        });

        // Animate provider connections on response
        document.body.addEventListener('htmx:afterRequest', (event) => {
            if (event.detail.successful) {
                const provider = event.detail.xhr.getResponseHeader('X-Provider-Used');
                if (provider) {
                    this.animateProviderConnection(provider);
                }
            }
        });
    }
    
    setupProcessListener() {
        // Listen for generate button clicks
        const generateBtn = document.getElementById('central-send') || 
                           document.querySelector('button[type="submit"]');
        
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                if (!this.isProcessing) {
                    // Reset all animations before starting new cycle
                    this.prepareForNewGenerationCycle();
                    
                    // Small delay to ensure reset is complete
                    setTimeout(() => {
                        this.startProcessFlowWithAnimation();
                    }, 100);
                }
            });
        }
        
        // Listen for phase transition events (from form submission)
        document.addEventListener('phase-transition', (event) => {
            const { phase, provider } = event.detail;
            this.animateProviderCall(phase, provider);
        });
    }
    
    startProcessFlowWithAnimation() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        
        // Start animation sequence
        this.animateGenerationSequence();
    }
    
    animateGenerationSequence() {
        // Get provider configuration from form
        const providers = this.getPhaseProviders();
        
        // Phase 0: Input → Prima Materia
        this.animatePhaseTransition('input', 'prima');
        
        // Phase 1: Prima Materia processing with provider
        setTimeout(() => {
            this.animatePhaseProcessing('prima', providers['prima-materia']);
        }, 1000);
        
        // Phase 1→2: Prima → Solutio transition
        setTimeout(() => {
            this.animatePhaseTransition('prima', 'solutio');
        }, 2500);
        
        // Phase 2: Solutio processing with provider
        setTimeout(() => {
            this.animatePhaseProcessing('solutio', providers['solutio']);
        }, 3500);
        
        // Phase 2→3: Solutio → Coagulatio transition
        setTimeout(() => {
            this.animatePhaseTransition('solutio', 'coagulatio');
        }, 5000);
        
        // Phase 3: Coagulatio processing with provider
        setTimeout(() => {
            this.animatePhaseProcessing('coagulatio', providers['coagulatio']);
        }, 6000);
        
        // Phase 3→Output: Coagulatio → Output
        setTimeout(() => {
            this.animatePhaseTransition('coagulatio', 'output');
        }, 7500);
        
        // Complete
        setTimeout(() => {
            this.completeGenerationAnimation();
        }, 9000);
    }
    
    animatePhaseProcessing(phaseName, providerName) {
        const phaseNode = this.nodes.get(phaseName);
        const hubNode = this.nodes.get('hub');
        const providerNode = this.nodes.get(providerName);
        
        if (!phaseNode || !hubNode || !providerNode) return;
        
        // 1. Activate phase node
        phaseNode.element.classList.add('phase-active');
        
        // 2. Animate Phase → Hub
        const phaseToHub = this.connections.get(`hub-${phaseName}`) || 
                          this.connections.get(`${phaseName}-hub`);
        if (phaseToHub) {
            phaseToHub.path.classList.add('flow-active-to-hub');
        }
        
        // 3. Animate Hub → Provider (after 300ms)
        setTimeout(() => {
            if (phaseToHub) {
                phaseToHub.path.classList.remove('flow-active-to-hub');
            }
            
            // Show provider connection
            this.animateProviderConnection(hubNode, providerNode, 'forward');
        }, 300);
        
        // 4. Animate Provider → Hub → Phase (after 800ms)
        setTimeout(() => {
            // Return from provider
            this.animateProviderConnection(providerNode, hubNode, 'backward');
            
            // Return to phase
            setTimeout(() => {
                if (phaseToHub) {
                    phaseToHub.path.classList.add('flow-active-from-hub');
                }
            }, 300);
        }, 800);
        
        // 5. Deactivate phase (after 1500ms total)
        setTimeout(() => {
            phaseNode.element.classList.remove('phase-active');
            if (phaseToHub) {
                phaseToHub.path.classList.remove('flow-active-from-hub');
            }
        }, 1500);
    }
    
    animateProviderConnection(fromNode, toNode, direction) {
        const pathId = `provider-temp-${Date.now()}-${direction}`;
        const path = this.createProviderAnimationPath(
            fromNode, toNode, pathId, `provider-${direction}`
        );
        
        // Remove path after animation
        setTimeout(() => {
            path.remove();
        }, 600);
    }
    
    animateProviderCall(phase, providerName) {
        const hubNode = this.nodes.get('hub');
        const providerNode = this.nodes.get(providerName);
        
        if (!hubNode || !providerNode) return;
        
        // Create bidirectional animated path for provider call
        const pathId = `provider-${phase}-${providerName}`;
        
        // Forward path (hub to provider)
        const forwardPath = this.createProviderAnimationPath(
            hubNode, providerNode, pathId + '-forward', 'provider-forward'
        );
        
        // Backward path (provider to hub)  
        setTimeout(() => {
            const backwardPath = this.createProviderAnimationPath(
                providerNode, hubNode, pathId + '-backward', 'provider-backward'
            );
            
            // Clean up after animation
            setTimeout(() => {
                forwardPath.remove();
                backwardPath.remove();
            }, 1000);
        }, 500);
        
        // Highlight provider node
        providerNode.element.classList.add('provider-active');
        setTimeout(() => {
            providerNode.element.classList.remove('provider-active');
        }, 1500);
    }
    
    createProviderAnimationPath(fromNode, toNode, id, animationClass) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Create curved path
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const cx = fromNode.x + dx / 2;
        const cy = fromNode.y + dy / 2 - Math.abs(dx) * 0.2;
        
        const d = `M ${fromNode.x} ${fromNode.y} Q ${cx} ${cy} ${toNode.x} ${toNode.y}`;
        path.setAttribute('d', d);
        path.setAttribute('id', id);
        path.setAttribute('class', `provider-animation-path ${animationClass}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#ffcc33');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('stroke-opacity', '0.8');
        
        this.pathsGroup.appendChild(path);
        return path;
    }
    
    animatePhaseTransition(fromPhase, toPhase) {
        const fromNode = this.nodes.get(fromPhase);
        const toNode = this.nodes.get(toPhase);
        
        if (!fromNode || !toNode) return;
        
        // Find existing connection path
        const connectionKey = `${fromPhase}-${toPhase}`;
        const connection = this.connections.get(connectionKey) || 
                          this.connections.get(`${toPhase}-${fromPhase}`);
        
        if (connection) {
            connection.path.classList.add('phase-transition-active');
            setTimeout(() => {
                connection.path.classList.remove('phase-transition-active');
            }, 1500);
        }
        
        // Activate next phase node
        toNode.element.classList.add('phase-incoming');
        setTimeout(() => {
            toNode.element.classList.remove('phase-incoming');
        }, 1000);
    }
    
    completeGenerationAnimation() {
        // Celebrate at output gateway
        const outputNode = this.nodes.get('output')?.element;
        if (outputNode) {
            outputNode.classList.add('generation-complete');
            this.createSuccessBurst(this.nodes.get('output'));
        }
        
        // Reset processing state
        setTimeout(() => {
            this.isProcessing = false;
            if (outputNode) {
                outputNode.classList.remove('generation-complete');
            }
        }, 2000);
    }
    
    createSuccessBurst(node) {
        if (!node) return;
        
        // Create particle burst effect
        for (let i = 0; i < 8; i++) {
            const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            particle.setAttribute('cx', node.x);
            particle.setAttribute('cy', node.y);
            particle.setAttribute('r', '3');
            particle.setAttribute('fill', '#ffd700');
            particle.setAttribute('class', 'success-particle');
            particle.style.setProperty('--angle', `${i * 45}deg`);
            particle.style.setProperty('--delay', `${i * 0.1}s`);
            
            this.particlesGroup.appendChild(particle);
            
            // Remove after animation
            setTimeout(() => particle.remove(), 1500);
        }
    }
    
    startProcessFlowWithAnimationOld() {
        if (this.isProcessing) return;
        
        // Start with pulsation animation on current active hex
        const activeHex = this.findActiveHex();
        if (activeHex) {
            this.startHexPulsation(activeHex);
            
            // After pulsation, start movement and flow
            setTimeout(() => {
                this.stopHexPulsation(activeHex);
                this.startProcessFlow();
            }, 2000); // 2 second pulsation
        } else {
            // No active hex, start normal flow
            this.startProcessFlow();
        }
    }
    
    findActiveHex() {
        // Find currently active/focused hexagon or default to input gateway
        const activeNode = this.nodesGroup.querySelector('.hex-node.active') ||
                          this.nodesGroup.querySelector('.hex-node[data-id="input"]');
        return activeNode;
    }
    
    startHexPulsation(hexElement) {
        if (!hexElement) return;
        
        // Add pulsation class for CSS animation
        hexElement.classList.add('pulsating-active');
        
        // Create additional pulsation rings for enhanced effect
        const nodeConfig = hexElement.nodeConfig;
        if (nodeConfig) {
            this.createPulsationRings(nodeConfig);
        }
        
        console.log('Started pulsation for hex:', hexElement.getAttribute('data-id'));
    }
    
    stopHexPulsation(hexElement) {
        if (!hexElement) return;
        
        hexElement.classList.remove('pulsating-active');
        
        // Remove pulsation rings
        this.svg.querySelectorAll('.pulsation-ring').forEach(ring => ring.remove());
        
        console.log('Stopped pulsation for hex:', hexElement.getAttribute('data-id'));
    }
    
    createPulsationRings(nodeConfig) {
        // Create multiple expanding rings for dramatic effect
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                ring.setAttribute('cx', nodeConfig.x);
                ring.setAttribute('cy', nodeConfig.y);
                ring.setAttribute('r', '0');
                ring.setAttribute('fill', 'none');
                ring.setAttribute('stroke', nodeConfig.color);
                ring.setAttribute('stroke-width', '3');
                ring.setAttribute('opacity', '0.8');
                ring.classList.add('pulsation-ring');
                
                // Animate the ring expansion
                const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                animate.setAttribute('attributeName', 'r');
                animate.setAttribute('values', '0;60;100');
                animate.setAttribute('dur', '1.5s');
                animate.setAttribute('fill', 'freeze');
                
                const animateOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                animateOpacity.setAttribute('attributeName', 'opacity');
                animateOpacity.setAttribute('values', '0.8;0.4;0');
                animateOpacity.setAttribute('dur', '1.5s');
                animateOpacity.setAttribute('fill', 'freeze');
                
                ring.appendChild(animate);
                ring.appendChild(animateOpacity);
                
                this.svg.appendChild(ring);
                
                // Remove ring after animation
                setTimeout(() => ring.remove(), 1500);
            }, i * 500); // Stagger the rings
        }
    }
    
    startProcessFlow() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        let currentIndex = 0;
        
        // Reset all nodes to pending
        this.processStages.forEach(stage => {
            stage.element.classList.remove('active', 'complete');
            stage.element.classList.add('pending');
        });
        
        // Process stages sequentially
        const processNextStage = () => {
            if (currentIndex >= this.processStages.length) {
                this.completeProcess();
                return;
            }
            
            const stage = this.processStages[currentIndex];
            this.activateStage(stage);
            
            // Duration based on phase
            const duration = Math.floor(stage.phase) === stage.phase ? 2000 : 1000;
            
            setTimeout(() => {
                this.completeStage(stage);
                currentIndex++;
                processNextStage();
            }, duration);
        };
        
        processNextStage();
    }
    
    activateStage(stage) {
        stage.element.classList.remove('pending');
        stage.element.classList.add('active');
        
        // Emit hex node activation event for AI thoughts
        this.emitHexEvent('hex-node-activated', {
            nodeId: stage.id,
            nodeType: stage.config?.type || 'unknown',
            phase: stage.config?.phase || 0,
            title: stage.config?.title || stage.id
        });
        
        // Emit phase change event if this is a phase node
        if (stage.config?.type?.startsWith('phase-')) {
            const phaseName = stage.config.type.replace('phase-', '');
            this.emitHexEvent('hex-phase-change', {
                fromPhase: this.currentPhase,
                toPhase: phaseName,
                reason: `Activating ${stage.config.title || stage.id} node`
            });
            this.currentPhase = phaseName;
        }
        
        // Add hex-to-hex movement animation
        const prevStage = this.findPreviousStage(stage);
        if (prevStage) {
            this.animateHexMovement(prevStage.element, stage.element);
        }
        
        // Create flow particles
        if (stage.phase > 0) {
            const prevStage = this.processStages.find(s => s.phase === Math.floor(stage.phase - 1));
            if (prevStage) {
                this.createFlowParticle(prevStage.id, stage.id);
            }
        }
        
        // Animate connections with processing indicators
        this.activateProcessingConnections(stage.id);
    }
    
    findPreviousStage(currentStage) {
        // Find the previous stage in the processing flow
        const currentPhase = currentStage.phase;
        let prevStage = null;
        let closestPhase = -1;
        
        this.processStages.forEach(stage => {
            if (stage.phase < currentPhase && stage.phase > closestPhase) {
                closestPhase = stage.phase;
                prevStage = stage;
            }
        });
        
        return prevStage;
    }
    
    animateHexMovement(fromHex, toHex) {
        if (!fromHex || !toHex) return;
        
        // Get original positions
        const fromConfig = fromHex.nodeConfig;
        const toConfig = toHex.nodeConfig;
        
        if (!fromConfig || !toConfig) return;
        
        // Create a temporary moving hex clone
        const movingHex = fromHex.cloneNode(true);
        movingHex.classList.add('moving-to-target');
        movingHex.setAttribute('id', `moving-${fromConfig.id}-to-${toConfig.id}`);
        
        // Add to SVG
        this.svg.appendChild(movingHex);
        
        // Calculate movement path with natural curve
        const deltaX = toConfig.x - fromConfig.x;
        const deltaY = toConfig.y - fromConfig.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Create curved path for natural movement
        const controlPointX = fromConfig.x + deltaX * 0.5 + (deltaY * 0.2);
        const controlPointY = fromConfig.y + deltaY * 0.5 - (deltaX * 0.2);
        
        // Animate along the curved path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const pathData = `M ${fromConfig.x} ${fromConfig.y} Q ${controlPointX} ${controlPointY} ${toConfig.x} ${toConfig.y}`;
        path.setAttribute('d', pathData);
        path.setAttribute('id', `movement-path-${fromConfig.id}-${toConfig.id}`);
        path.style.display = 'none';
        this.svg.appendChild(path);
        
        // Animate the hex along the path
        const animateMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        animateMotion.setAttribute('dur', '1.5s');
        animateMotion.setAttribute('fill', 'freeze');
        animateMotion.setAttribute('calcMode', 'spline');
        animateMotion.setAttribute('keySplines', '0.25 0.46 0.45 0.94');
        animateMotion.setAttribute('keyTimes', '0;1');
        
        const mpath = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
        mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#movement-path-${fromConfig.id}-${toConfig.id}`);
        
        animateMotion.appendChild(mpath);
        movingHex.appendChild(animateMotion);
        
        // Create energy trail effect
        this.createEnergyTrail(fromConfig, toConfig);
        
        // Clean up after animation
        setTimeout(() => {
            movingHex.remove();
            path.remove();
            
            // Highlight the target hex
            toHex.classList.add('movement-target-reached');
            setTimeout(() => {
                toHex.classList.remove('movement-target-reached');
            }, 1000);
        }, 1500);
        
        console.log(`Animated hex movement from ${fromConfig.id} to ${toConfig.id}`);
    }
    
    createEnergyTrail(fromConfig, toConfig) {
        // Create particles that follow the movement path
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                particle.setAttribute('r', '3');
                particle.setAttribute('fill', fromConfig.color);
                particle.setAttribute('opacity', '0.8');
                particle.classList.add('energy-trail-particle');
                
                // Position along the path
                const progress = i / 4; // 0 to 1
                const x = fromConfig.x + (toConfig.x - fromConfig.x) * progress;
                const y = fromConfig.y + (toConfig.y - fromConfig.y) * progress;
                
                particle.setAttribute('cx', x);
                particle.setAttribute('cy', y);
                
                // Fade out animation
                const fadeOut = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                fadeOut.setAttribute('attributeName', 'opacity');
                fadeOut.setAttribute('values', '0.8;0');
                fadeOut.setAttribute('dur', '0.8s');
                fadeOut.setAttribute('fill', 'freeze');
                
                particle.appendChild(fadeOut);
                this.svg.appendChild(particle);
                
                // Remove after fade
                setTimeout(() => particle.remove(), 800);
            }, i * 100);
        }
    }
    
    activateProcessingConnections(stageId) {
        // Add dotted processing indicators to connections
        this.connections.forEach(conn => {
            if (conn.to === stageId) {
                conn.path.classList.add('processing-active');
                
                // Add input/output relationship styling
                if (conn.from === 'input' || stageId === 'input') {
                    conn.path.classList.add('input-relationship');
                }
                if (conn.to === 'output' || stageId === 'output') {
                    conn.path.classList.add('output-relationship');
                }
            }
        });
    }
    
    completeStage(stage) {
        stage.element.classList.remove('active');
        stage.element.classList.add('complete');
        
        // Add completion glow effect
        stage.element.classList.add('stage-completed');
        setTimeout(() => {
            stage.element.classList.remove('stage-completed');
        }, 1500);
        
        // Update connection states - remove processing, add completed
        this.connections.forEach(conn => {
            if (conn.to === stage.id) {
                conn.path.classList.remove('processing-active', 'flowing');
                conn.path.classList.add('connection-completed');
                
                // Briefly highlight completed connection
                setTimeout(() => {
                    conn.path.classList.remove('connection-completed');
                }, 2000);
            }
        });
        
        // Add dotted trail from previous stage to show completion path
        const prevStage = this.findPreviousStage(stage);
        if (prevStage) {
            this.createCompletionTrail(prevStage, stage);
        }
    }
    
    createCompletionTrail(fromStage, toStage) {
        // Create a dotted line that shows the completion path
        const completionPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const fromConfig = fromStage.config || fromStage.element?.nodeConfig;
        const toConfig = toStage.config || toStage.element?.nodeConfig;
        
        if (!fromConfig || !toConfig) return;
        
        // Create curved dotted path
        const midX = (fromConfig.x + toConfig.x) / 2;
        const midY = (fromConfig.y + toConfig.y) / 2 - 20;
        const pathData = `M ${fromConfig.x} ${fromConfig.y} Q ${midX} ${midY} ${toConfig.x} ${toConfig.y}`;
        
        completionPath.setAttribute('d', pathData);
        completionPath.setAttribute('fill', 'none');
        completionPath.setAttribute('stroke', '#2ecc71');
        completionPath.setAttribute('stroke-width', '2');
        completionPath.setAttribute('stroke-dasharray', '4,4');
        completionPath.setAttribute('stroke-opacity', '0.8');
        completionPath.classList.add('completion-trail');
        
        // Animate the dotted line
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'stroke-dashoffset');
        animate.setAttribute('values', '0;-8');
        animate.setAttribute('dur', '0.8s');
        animate.setAttribute('repeatCount', '3');
        
        completionPath.appendChild(animate);
        this.pathsGroup.appendChild(completionPath);
        
        // Remove trail after animation
        setTimeout(() => {
            completionPath.remove();
        }, 2400);
    }
    
    // Enhanced connection management for processing states
    showProcessingStateConnections() {
        // Show all relevant connections with dotted indicators
        this.connections.forEach(conn => {
            const fromNode = this.nodes.get(conn.from);
            const toNode = this.nodes.get(conn.to);
            
            if (fromNode && toNode) {
                // Add dotted connection styling based on relationship
                if (this.isInputOutputRelationship(conn.from, conn.to)) {
                    conn.path.classList.add('dotted-connection');
                    
                    if (conn.from === 'input' || conn.to === 'input') {
                        conn.path.classList.add('input-relationship');
                    }
                    if (conn.from === 'output' || conn.to === 'output') {
                        conn.path.classList.add('output-relationship');
                    }
                }
            }
        });
    }
    
    isInputOutputRelationship(fromId, toId) {
        // Determine if this connection represents input/output processing
        const inputRelated = ['input', 'parse', 'extract', 'prima'].includes(fromId) || 
                            ['input', 'parse', 'extract', 'prima'].includes(toId);
        const outputRelated = ['output', 'validate', 'finalize', 'coagulatio'].includes(fromId) || 
                             ['output', 'validate', 'finalize', 'coagulatio'].includes(toId);
        
        return inputRelated || outputRelated;
    }
    
    hideProcessingStateConnections() {
        // Remove all processing state indicators
        this.connections.forEach(conn => {
            conn.path.classList.remove(
                'dotted-connection', 
                'processing-active', 
                'input-relationship', 
                'output-relationship',
                'connection-completed'
            );
        });
    }
    
    createFlowParticle(fromId, toId) {
        if (!this.particlesGroup) return;
        
        const fromNode = this.nodes.get(fromId);
        const toNode = this.nodes.get(toId);
        if (!fromNode || !toNode) return;
        
        const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        particle.setAttribute('r', '4');
        particle.setAttribute('fill', toNode.color || '#3498db');
        particle.setAttribute('class', 'flow-particle');
        
        // Animation along path
        const animateMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        animateMotion.setAttribute('dur', '1.5s');
        animateMotion.setAttribute('fill', 'freeze');
        
        const mpath = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
        mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#path-${fromId}-${toId}`);
        
        animateMotion.appendChild(mpath);
        particle.appendChild(animateMotion);
        
        this.particlesGroup.appendChild(particle);
        
        // Remove after animation
        setTimeout(() => particle.remove(), 1500);
    }
    
    completeProcess() {
        this.isProcessing = false;
        console.log('✅ Process flow complete');
        
        // Standard celebration effect for all stages
        this.processStages.forEach((stage, index) => {
            setTimeout(() => {
                const hex = stage.element.querySelector('polygon');
                if (hex) {
                    hex.style.filter = `drop-shadow(0 0 20px ${stage.config.color})`;
                    setTimeout(() => {
                        hex.style.filter = '';
                    }, 500);
                }
            }, index * 100);
        });
        
        // Special golden celebration for output gateway
        setTimeout(() => {
            this.startOutputGatewayCelebration();
        }, this.processStages.length * 100 + 500);
    }
    
    /**
     * Start the golden celebration effect for the output gateway
     */
    startOutputGatewayCelebration() {
        const outputNode = this.nodes.get('output');
        if (!outputNode || !outputNode.element) {
            console.warn('Output gateway not found for celebration');
            return;
        }
        
        console.log('🎉 Starting golden celebration for output gateway');
        
        // Add celebration class
        outputNode.element.classList.add('output-celebration');
        
        // Create multiple golden ripples for dramatic effect
        this.createGoldenCelebrationRipples(outputNode);
        
        // Create sparkle particles around the output
        this.createGoldenSparkles(outputNode);
        
        // Optional: Focus on the output gateway
        setTimeout(() => {
            this.focusOnNode(outputNode);
        }, 1000);
        
        // Keep celebration active for extended period
        setTimeout(() => {
            outputNode.element.classList.remove('output-celebration');
            console.log('Golden celebration complete');
        }, 10000); // 10 seconds of celebration
    }
    
    /**
     * Create multiple golden ripples around the output gateway
     */
    createGoldenCelebrationRipples(outputNode) {
        const nodeConfig = outputNode.element.nodeConfig || outputNode;
        
        // Create 5 staggered ripples for dramatic effect
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const ripple = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                ripple.setAttribute('cx', nodeConfig.x);
                ripple.setAttribute('cy', nodeConfig.y);
                ripple.setAttribute('r', '0');
                ripple.setAttribute('fill', 'none');
                ripple.setAttribute('stroke', '#ffd700');
                ripple.setAttribute('stroke-width', '4');
                ripple.setAttribute('opacity', '0.8');
                ripple.classList.add('golden-celebration-ripple');
                
                // Animate ripple expansion
                const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                animate.setAttribute('attributeName', 'r');
                animate.setAttribute('values', '0;120;180');
                animate.setAttribute('dur', '3s');
                animate.setAttribute('fill', 'freeze');
                
                const animateOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                animateOpacity.setAttribute('attributeName', 'opacity');
                animateOpacity.setAttribute('values', '0.8;0.3;0');
                animateOpacity.setAttribute('dur', '3s');
                animateOpacity.setAttribute('fill', 'freeze');
                
                const animateStroke = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                animateStroke.setAttribute('attributeName', 'stroke-width');
                animateStroke.setAttribute('values', '4;2;1');
                animateStroke.setAttribute('dur', '3s');
                animateStroke.setAttribute('fill', 'freeze');
                
                ripple.appendChild(animate);
                ripple.appendChild(animateOpacity);
                ripple.appendChild(animateStroke);
                
                // Add to SVG and remove after animation
                this.svg.appendChild(ripple);
                setTimeout(() => ripple.remove(), 3000);
            }, i * 600); // Stagger ripples by 600ms
        }
    }
    
    /**
     * Create golden sparkle particles around the output gateway
     */
    createGoldenSparkles(outputNode) {
        const nodeConfig = outputNode.element.nodeConfig || outputNode;
        
        // Create 12 sparkle particles in a circle around the output
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                const angle = (i / 12) * 2 * Math.PI;
                const radius = 80 + Math.random() * 40; // Random radius between 80-120
                const sparkleX = nodeConfig.x + radius * Math.cos(angle);
                const sparkleY = nodeConfig.y + radius * Math.sin(angle);
                
                const sparkle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                sparkle.setAttribute('cx', sparkleX);
                sparkle.setAttribute('cy', sparkleY);
                sparkle.setAttribute('r', '3');
                sparkle.setAttribute('fill', '#ffd700');
                sparkle.setAttribute('opacity', '1');
                sparkle.style.filter = 'drop-shadow(0 0 6px #ffd700)';
                
                // Animate sparkle twinkle
                const animateOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                animateOpacity.setAttribute('attributeName', 'opacity');
                animateOpacity.setAttribute('values', '1;0.3;1;0');
                animateOpacity.setAttribute('dur', '2s');
                animateOpacity.setAttribute('fill', 'freeze');
                
                const animateScale = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
                animateScale.setAttribute('attributeName', 'transform');
                animateScale.setAttribute('type', 'scale');
                animateScale.setAttribute('values', '1;1.5;1;0');
                animateScale.setAttribute('dur', '2s');
                animateScale.setAttribute('fill', 'freeze');
                
                sparkle.appendChild(animateOpacity);
                sparkle.appendChild(animateScale);
                
                // Add to SVG and remove after animation
                this.svg.appendChild(sparkle);
                setTimeout(() => sparkle.remove(), 2000);
            }, i * 150); // Stagger sparkles by 150ms
        }
    }

    // Animation State Management Methods

    animateProviderConnection(providerId) {
        const conn = this.connections.get(`hub-${providerId}`);
        if (conn && conn.path) {
            conn.path.classList.add('provider-active');
            setTimeout(() => {
                conn.path.classList.remove('provider-active');
            }, 2000);
        }
    }
    
    /**
     * Reset all animations to default state - called between generation cycles
     */
    resetAllAnimationStates() {
        console.log('🔄 Resetting all animation states to default');
        
        // Reset node states
        this.resetNodeAnimationStates();
        
        // Reset connection states
        this.resetConnectionAnimationStates();
        
        // Remove all temporary animation elements
        this.removeTemporaryAnimationElements();
        
        // Clear any ongoing animations
        this.clearActiveAnimationTimers();
        
        // Reset process state
        this.isProcessing = false;
        this.currentPhase = null;
        
        console.log('✅ All animation states reset to default');
    }
    
    /**
     * Reset all node animation states to default
     */
    resetNodeAnimationStates() {
        this.nodes.forEach((node, nodeId) => {
            if (node.element) {
                // Remove all animation classes
                node.element.classList.remove(
                    // Processing states
                    'active', 'processing', 'pending', 'complete',
                    // Hover and focus states
                    'hover-state', 'radial-focus', 'core-activated',
                    // Movement states
                    'dragging', 'moving-to-target', 'movement-target-reached',
                    // Celebration states
                    'stage-completed', 'output-celebration',
                    // Pulsation states
                    'pulsating-active',
                    // Failure states
                    'state-failed', 'critical-failure', 'state-warning'
                );
                
                // Reset any inline styles that may have been applied during animations
                const polygon = node.element.querySelector('polygon');
                if (polygon) {
                    polygon.style.filter = '';
                    polygon.style.transform = '';
                    polygon.style.opacity = '';
                    polygon.style.strokeWidth = '';
                    polygon.style.animation = '';
                }
                
                // Reset text elements
                const textElement = node.element.querySelector('.hex-node-text');
                if (textElement) {
                    textElement.style.opacity = '';
                    textElement.style.animation = '';
                    textElement.style.filter = '';
                }
                
                // Reset icon elements
                const iconElement = node.element.querySelector('.hex-node-icon');
                if (iconElement) {
                    iconElement.style.animation = '';
                    iconElement.style.filter = '';
                    iconElement.style.transform = '';
                }
            }
        });
    }
    
    /**
     * Reset all connection animation states to default
     */
    resetConnectionAnimationStates() {
        this.connections.forEach((conn, key) => {
            if (conn.path) {
                // Remove all animation classes
                conn.path.classList.remove(
                    // Flow states
                    'active', 'animated', 'flowing',
                    // Processing states
                    'processing-active', 'dotted-connection',
                    'input-relationship', 'output-relationship',
                    // Highlight states
                    'radial-highlight', 'core-connection-pulse', 'core-pulse',
                    'path-flow-active', 'drag-active',
                    // Completion states
                    'connection-completed',
                    // Broken states
                    'connection-broken', 'connection-severed', 'connection-error',
                    'connection-breaking'
                );
                
                // Reset inline styles
                conn.path.style.strokeOpacity = '';
                conn.path.style.strokeWidth = '';
                conn.path.style.animation = '';
                conn.path.style.filter = '';
                conn.path.style.strokeDasharray = '';
                conn.path.style.strokeDashoffset = '';
            }
        });
    }
    
    /**
     * Remove all temporary animation elements (ripples, particles, trails, etc.)
     */
    removeTemporaryAnimationElements() {
        // Remove various temporary animation elements
        const temporarySelectors = [
            '.radial-ripple',
            '.failure-ripple',
            '.golden-celebration-ripple', 
            '.pulsation-ring',
            '.flow-particle',
            '.energy-trail-particle',
            '.completion-trail',
            // Moving elements
            '[id^="moving-"]',
            '[id^="movement-path-"]'
        ];
        
        temporarySelectors.forEach(selector => {
            this.svg.querySelectorAll(selector).forEach(element => {
                element.remove();
            });
        });
        
        // Remove any elements in particles group
        if (this.particlesGroup) {
            while (this.particlesGroup.firstChild) {
                this.particlesGroup.removeChild(this.particlesGroup.firstChild);
            }
        }
    }
    
    /**
     * Clear any active animation timers
     */
    clearActiveAnimationTimers() {
        // Clear any stored timeout/interval IDs
        // Note: In a more complex system, you'd maintain arrays of active timer IDs
        
        // Reset any ongoing process flows
        if (this.isProcessing) {
            this.isProcessing = false;
        }
        
        // Clear process stages state
        this.processStages.forEach(stage => {
            if (stage.element) {
                stage.element.classList.remove('pending', 'active', 'complete');
            }
        });
    }
    
    /**
     * Prepare the system for a new generation cycle
     */
    prepareForNewGenerationCycle() {
        console.log('🎯 Preparing system for new generation cycle');
        
        // Reset all animations first
        this.resetAllAnimationStates();
        
        // Reset to clean visual state
        this.resetZoom();
        
        // Clear any tooltips
        this.hideTooltip();
        
        // Set all process stages back to pending
        this.processStages.forEach(stage => {
            if (stage.element) {
                stage.element.classList.add('pending');
                stage.element.classList.remove('active', 'complete');
            }
        });
        
        console.log('✨ System ready for new generation cycle');
    }

    // Failure State Management Methods
    
    /**
     * Mark a hexagon as failed with red pulsating animation
     * @param {string} nodeId - ID of the node to mark as failed
     * @param {string} failureType - Type of failure: 'state-failed', 'critical-failure', 'state-warning'
     */
    setNodeFailureState(nodeId, failureType = 'state-failed') {
        const node = this.nodes.get(nodeId);
        if (!node || !node.element) {
            console.warn(`Cannot set failure state for node ${nodeId}: node not found`);
            return false;
        }
        
        // Clear any existing failure states
        this.clearNodeFailureState(nodeId);
        
        // Add failure state class
        node.element.classList.add(failureType);
        
        // Create failure ripple effect
        if (failureType === 'state-failed' || failureType === 'critical-failure') {
            this.createFailureRipple(node);
        }
        
        console.log(`Set failure state for node ${nodeId}: ${failureType}`);
        return true;
    }
    
    /**
     * Clear failure state from a hexagon
     * @param {string} nodeId - ID of the node to clear
     */
    clearNodeFailureState(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node || !node.element) {
            return false;
        }
        
        // Remove all failure state classes
        node.element.classList.remove('state-failed', 'critical-failure', 'state-warning');
        
        // Remove any failure ripples
        this.svg.querySelectorAll(`.failure-ripple[data-node="${nodeId}"]`).forEach(ripple => {
            ripple.remove();
        });
        
        console.log(`Cleared failure state for node ${nodeId}`);
        return true;
    }
    
    /**
     * Set connection to broken/failed state
     * @param {string} fromId - Source node ID
     * @param {string} toId - Target node ID
     * @param {string} brokenType - Type of broken connection: 'connection-broken', 'connection-severed', 'connection-error'
     */
    setConnectionBrokenState(fromId, toId, brokenType = 'connection-broken') {
        const connectionKey = `${fromId}-${toId}`;
        const reverseKey = `${toId}-${fromId}`;
        
        // Find the connection (either direction)
        const connection = this.connections.get(connectionKey) || this.connections.get(reverseKey);
        
        if (!connection || !connection.path) {
            console.warn(`Cannot set broken state for connection ${fromId}-${toId}: connection not found`);
            return false;
        }
        
        // Clear existing connection states
        this.clearConnectionBrokenState(fromId, toId);
        
        // Add broken state class
        connection.path.classList.add(brokenType);
        
        console.log(`Set broken connection state ${fromId}-${toId}: ${brokenType}`);
        return true;
    }
    
    /**
     * Clear broken state from a connection
     * @param {string} fromId - Source node ID
     * @param {string} toId - Target node ID
     */
    clearConnectionBrokenState(fromId, toId) {
        const connectionKey = `${fromId}-${toId}`;
        const reverseKey = `${toId}-${fromId}`;
        
        const connection = this.connections.get(connectionKey) || this.connections.get(reverseKey);
        
        if (!connection || !connection.path) {
            return false;
        }
        
        // Remove all broken state classes
        connection.path.classList.remove('connection-broken', 'connection-severed', 'connection-error', 'connection-breaking');
        
        console.log(`Cleared broken connection state ${fromId}-${toId}`);
        return true;
    }
    
    /**
     * Create failure ripple effect around a failed node
     * @param {Object} node - Node object with element and config
     */
    createFailureRipple(node) {
        const nodeConfig = node.element.nodeConfig || node;
        
        // Create expanding failure ripple
        const ripple = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ripple.setAttribute('cx', nodeConfig.x);
        ripple.setAttribute('cy', nodeConfig.y);
        ripple.setAttribute('r', '0');
        ripple.setAttribute('fill', 'none');
        ripple.setAttribute('stroke', '#e74c3c');
        ripple.setAttribute('stroke-width', '3');
        ripple.setAttribute('opacity', '0.8');
        ripple.setAttribute('data-node', nodeConfig.id);
        ripple.classList.add('failure-ripple');
        
        // Animate ripple expansion
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', '0;50;80');
        animate.setAttribute('dur', '1.5s');
        animate.setAttribute('fill', 'freeze');
        
        const animateOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animateOpacity.setAttribute('attributeName', 'opacity');
        animateOpacity.setAttribute('values', '0.8;0.4;0');
        animateOpacity.setAttribute('dur', '1.5s');
        animateOpacity.setAttribute('fill', 'freeze');
        
        ripple.appendChild(animate);
        ripple.appendChild(animateOpacity);
        
        // Add to SVG and remove after animation
        this.svg.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1500);
    }
    
    /**
     * Simulate a process failure at a specific stage
     * @param {string} nodeId - ID of the node where failure occurs
     * @param {Object} options - Failure options
     */
    simulateProcessFailure(nodeId, options = {}) {
        const {
            failureType = 'state-failed',
            affectedConnections = [],
            cascadeFailure = false,
            warningBeforeFailure = true
        } = options;
        
        console.log(`Simulating process failure at node ${nodeId}`);
        
        // Optional warning phase before failure
        if (warningBeforeFailure) {
            this.setNodeFailureState(nodeId, 'state-warning');
            
            setTimeout(() => {
                // Escalate to full failure
                this.setNodeFailureState(nodeId, failureType);
                this.handleFailureConsequences(nodeId, affectedConnections, cascadeFailure);
            }, 2000);
        } else {
            // Immediate failure
            this.setNodeFailureState(nodeId, failureType);
            this.handleFailureConsequences(nodeId, affectedConnections, cascadeFailure);
        }
    }
    
    /**
     * Handle the consequences of a node failure
     * @param {string} failedNodeId - ID of the failed node
     * @param {Array} affectedConnections - Connections to mark as broken
     * @param {boolean} cascadeFailure - Whether to cascade failure to connected nodes
     */
    handleFailureConsequences(failedNodeId, affectedConnections = [], cascadeFailure = false) {
        // Break connections involving the failed node
        this.connections.forEach((conn, key) => {
            if (conn.from === failedNodeId || conn.to === failedNodeId) {
                // Use connection-breaking animation first, then broken state
                conn.path.classList.add('connection-breaking');
                
                setTimeout(() => {
                    conn.path.classList.remove('connection-breaking');
                    conn.path.classList.add('connection-broken');
                }, 2000);
            }
        });
        
        // Break explicitly specified connections
        affectedConnections.forEach(({ from, to, brokenType = 'connection-severed' }) => {
            this.setConnectionBrokenState(from, to, brokenType);
        });
        
        // Cascade failure to connected nodes if requested
        if (cascadeFailure) {
            setTimeout(() => {
                this.cascadeFailureToConnectedNodes(failedNodeId);
            }, 3000);
        }
        
        // Stop any ongoing process flow
        this.isProcessing = false;
    }
    
    /**
     * Cascade failure to nodes connected to the failed node
     * @param {string} originNodeId - ID of the originally failed node
     */
    cascadeFailureToConnectedNodes(originNodeId) {
        const connectedNodes = new Set();
        
        // Find all directly connected nodes
        this.connections.forEach((conn) => {
            if (conn.from === originNodeId) {
                connectedNodes.add(conn.to);
            }
            if (conn.to === originNodeId) {
                connectedNodes.add(conn.from);
            }
        });
        
        // Apply warning state to connected nodes
        connectedNodes.forEach((nodeId, index) => {
            setTimeout(() => {
                this.setNodeFailureState(nodeId, 'state-warning');
                
                // Some may escalate to full failure
                if (Math.random() < 0.3) { // 30% chance of cascade failure
                    setTimeout(() => {
                        this.setNodeFailureState(nodeId, 'state-failed');
                    }, 2000);
                }
            }, index * 500);
        });
    }
    
    /**
     * Clear all failure states from the entire system
     */
    clearAllFailureStates() {
        // Clear node failure states
        this.nodes.forEach((node, nodeId) => {
            this.clearNodeFailureState(nodeId);
        });
        
        // Clear connection broken states
        this.connections.forEach((conn) => {
            conn.path.classList.remove(
                'connection-broken', 
                'connection-severed', 
                'connection-error', 
                'connection-breaking'
            );
        });
        
        // Remove any remaining failure ripples
        this.svg.querySelectorAll('.failure-ripple').forEach(ripple => {
            ripple.remove();
        });
        
        console.log('Cleared all failure states from the system');
    }
    
    /**
     * Get failure state information for debugging
     */
    getFailureStateInfo() {
        const failedNodes = [];
        const brokenConnections = [];
        
        this.nodes.forEach((node, nodeId) => {
            const element = node.element;
            if (element.classList.contains('state-failed')) {
                failedNodes.push({ id: nodeId, type: 'failed' });
            } else if (element.classList.contains('critical-failure')) {
                failedNodes.push({ id: nodeId, type: 'critical' });
            } else if (element.classList.contains('state-warning')) {
                failedNodes.push({ id: nodeId, type: 'warning' });
            }
        });
        
        this.connections.forEach((conn, key) => {
            if (conn.path.classList.contains('connection-broken')) {
                brokenConnections.push({ from: conn.from, to: conn.to, type: 'broken' });
            } else if (conn.path.classList.contains('connection-severed')) {
                brokenConnections.push({ from: conn.from, to: conn.to, type: 'severed' });
            }
        });
        
        return { failedNodes, brokenConnections };
    }
    
    handleFlowUpdate(data) {
        if (data.activeNode) {
            const node = this.nodes.get(data.activeNode);
            if (node) {
                this.activateNode(node);
            }
        }
    }
    
    updateNodeStates() {
        // Update node visual states based on server response
        // This can be extended based on actual server data
    }
    
    handleServerStateUpdate() {
        // Re-integrate server nodes after an update
        this.nodes.clear();
        this.processStages = [];
        this.integrateServerNodes();
        console.log('Server state integrated:', this.nodes.size, 'nodes');
    }
    
    handleBoardStateUpdate(data) {
        // Handle specific board state updates from the server
        if (data.nodes) {
            // Update specific nodes
            data.nodes.forEach(nodeData => {
                const node = this.nodes.get(nodeData.id);
                if (node && node.element) {
                    // Update node state
                    if (nodeData.state) {
                        node.element.classList.remove('pending', 'active', 'complete');
                        node.element.classList.add(nodeData.state);
                    }
                    
                    // Update node attributes if provided
                    if (nodeData.attributes) {
                        Object.entries(nodeData.attributes).forEach(([key, value]) => {
                            node.element.setAttribute(key, value);
                        });
                    }
                }
            });
        }
        
        if (data.activePhase) {
            this.currentPhase = data.activePhase;
        }
        
        if (data.processComplete) {
            this.completeProcess();
        }
    }
    
    setupCleanupObserver() {
        // Clean up any stray JSON text
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const text = node.textContent;
                        if (text && (text.includes('"name"') || text.includes('"description"') || 
                                   text.startsWith('{'))) {
                            node.remove();
                        }
                    }
                });
            });
        });
        
        observer.observe(this.container, {
            childList: true,
            subtree: true
        });
    }
    
    // Helper method to emit custom events for AI thoughts integration
    emitHexEvent(eventType, detail) {
        const event = new CustomEvent(eventType, {
            detail: detail,
            bubbles: true,
            cancelable: false
        });
        document.dispatchEvent(event);
        
        // Also log to console for debugging
        console.log(`🔮 Hex Event: ${eventType}`, detail);
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeUnifiedHexFlow();
    });
} else {
    initializeUnifiedHexFlow();
}

function initializeUnifiedHexFlow() {
    console.log('🎯 initializeUnifiedHexFlow called!');
    console.log('Current document state:', document.readyState);
    console.log('Current URL:', window.location.href);
    
    // Clear any existing instances
    if (window.hexFlowBoard) {
        console.log('Clearing existing hexFlowBoard instance');
        window.hexFlowBoard = null;
    }
    if (window.interactiveHexFlowBoard) {
        console.log('Clearing existing interactiveHexFlowBoard instance');
        window.interactiveHexFlowBoard = null;
    }
    
    // Don't initialize if already exists and is working
    if (window.unifiedHexFlow && window.unifiedHexFlow.validateElements()) {
        console.log('UnifiedHexFlow already initialized and valid');
        return;
    }
    
    console.log('Creating new UnifiedHexFlow instance...');
    try {
        // Create unified instance
        window.unifiedHexFlow = new UnifiedHexFlow();
        console.log('✨ Unified hex flow system ready');
        console.log('Instance created:', window.unifiedHexFlow);
    } catch (error) {
        console.error('❌ Failed to create UnifiedHexFlow:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Also expose initialization function for HTMX to call after dynamic updates
window.initializeUnifiedHexFlow = initializeUnifiedHexFlow;

// Expose failure state functions globally for debugging and external use
window.hexFlowFailureAPI = {
    /**
     * Trigger a failure state on a hexagon
     * Usage: hexFlowFailureAPI.fail('prima', 'state-failed')
     */
    fail: (nodeId, failureType = 'state-failed') => {
        if (window.unifiedHexFlow) {
            return window.unifiedHexFlow.setNodeFailureState(nodeId, failureType);
        }
        console.warn('UnifiedHexFlow not initialized');
        return false;
    },
    
    /**
     * Clear failure state from a hexagon
     * Usage: hexFlowFailureAPI.clear('prima')
     */
    clear: (nodeId) => {
        if (window.unifiedHexFlow) {
            return window.unifiedHexFlow.clearNodeFailureState(nodeId);
        }
        console.warn('UnifiedHexFlow not initialized');
        return false;
    },
    
    /**
     * Break a connection between two hexagons
     * Usage: hexFlowFailureAPI.breakConnection('prima', 'hub', 'connection-severed')
     */
    breakConnection: (fromId, toId, brokenType = 'connection-broken') => {
        if (window.unifiedHexFlow) {
            return window.unifiedHexFlow.setConnectionBrokenState(fromId, toId, brokenType);
        }
        console.warn('UnifiedHexFlow not initialized');
        return false;
    },
    
    /**
     * Fix a broken connection
     * Usage: hexFlowFailureAPI.fixConnection('prima', 'hub')
     */
    fixConnection: (fromId, toId) => {
        if (window.unifiedHexFlow) {
            return window.unifiedHexFlow.clearConnectionBrokenState(fromId, toId);
        }
        console.warn('UnifiedHexFlow not initialized');
        return false;
    },
    
    /**
     * Simulate a complete process failure scenario
     * Usage: hexFlowFailureAPI.simulateFailure('solutio', { cascadeFailure: true })
     */
    simulateFailure: (nodeId, options = {}) => {
        if (window.unifiedHexFlow) {
            return window.unifiedHexFlow.simulateProcessFailure(nodeId, options);
        }
        console.warn('UnifiedHexFlow not initialized');
        return false;
    },
    
    /**
     * Clear all failure states from the system
     * Usage: hexFlowFailureAPI.reset()
     */
    reset: () => {
        if (window.unifiedHexFlow) {
            window.unifiedHexFlow.clearAllFailureStates();
            return true;
        }
        console.warn('UnifiedHexFlow not initialized');
        return false;
    },
    
    /**
     * Get current failure state information
     * Usage: hexFlowFailureAPI.status()
     */
    status: () => {
        if (window.unifiedHexFlow) {
            return window.unifiedHexFlow.getFailureStateInfo();
        }
        console.warn('UnifiedHexFlow not initialized');
        return { failedNodes: [], brokenConnections: [] };
    },
    
    /**
     * Trigger golden celebration on output gateway
     * Usage: hexFlowFailureAPI.celebrate()
     */
    celebrate: () => {
        if (window.unifiedHexFlow) {
            window.unifiedHexFlow.startOutputGatewayCelebration();
            return true;
        }
        console.warn('UnifiedHexFlow not initialized');
        return false;
    },
    
    /**
     * Demonstrate different line animation types
     * Usage: hexFlowFailureAPI.showLineTypes()
     */
    showLineTypes: () => {
        if (!window.unifiedHexFlow) {
            console.warn('UnifiedHexFlow not initialized');
            return false;
        }
        
        console.log('🔗 Demonstrating line animation types...');
        
        // Reset first
        window.unifiedHexFlow.resetAllAnimationStates();
        
        // Show different line types with descriptions
        setTimeout(() => {
            console.log('1. ACTIVE DATA FLOW (processing-active): Directional wave toward destination');
            window.unifiedHexFlow.connections.forEach((conn, key) => {
                if (key.includes('hub-prima')) {
                    conn.path.classList.add('processing-active');
                }
            });
        }, 1000);
        
        setTimeout(() => {
            console.log('2. INPUT FLOW (input-relationship): Golden waves from input gateway');
            window.unifiedHexFlow.connections.forEach((conn, key) => {
                if (key.includes('input-hub')) {
                    conn.path.classList.add('input-relationship');
                }
            });
        }, 3000);
        
        setTimeout(() => {
            console.log('3. OUTPUT FLOW (output-relationship): Golden waves to output gateway');
            window.unifiedHexFlow.connections.forEach((conn, key) => {
                if (key.includes('hub-output')) {
                    conn.path.classList.add('output-relationship');
                }
            });
        }, 5000);
        
        setTimeout(() => {
            console.log('4. STANDBY CONNECTIONS (dotted-connection): Static dotted - available but inactive');
            window.unifiedHexFlow.connections.forEach((conn, key) => {
                if (key.includes('prima-parse') || key.includes('prima-extract')) {
                    conn.path.classList.add('dotted-connection');
                }
            });
        }, 7000);
        
        setTimeout(() => {
            console.log('5. READY TO FLOW (ready-to-flow): Pulsing - ready to activate');
            window.unifiedHexFlow.connections.forEach((conn, key) => {
                if (key.includes('solutio-flow') || key.includes('solutio-refine')) {
                    conn.path.classList.add('ready-to-flow');
                }
            });
        }, 9000);
        
        // Reset after demo
        setTimeout(() => {
            console.log('Demo complete - resetting all line animations');
            window.unifiedHexFlow.resetAllAnimationStates();
        }, 12000);
        
        return true;
    },
    
    /**
     * Demo function that shows various failure scenarios
     * Usage: hexFlowFailureAPI.demo()
     */
    demo: () => {
        if (!window.unifiedHexFlow) {
            console.warn('UnifiedHexFlow not initialized');
            return false;
        }
        
        console.log('🎭 Starting failure state demo...');
        
        // Reset first
        window.unifiedHexFlow.clearAllFailureStates();
        
        // Scenario 1: Warning state
        setTimeout(() => {
            console.log('Demo: Setting warning state on input gateway');
            window.unifiedHexFlow.setNodeFailureState('input', 'state-warning');
        }, 1000);
        
        // Scenario 2: Critical failure with cascade
        setTimeout(() => {
            console.log('Demo: Simulating critical failure with cascade');
            window.unifiedHexFlow.simulateProcessFailure('prima', {
                failureType: 'critical-failure',
                cascadeFailure: true,
                warningBeforeFailure: false
            });
        }, 3000);
        
        // Scenario 3: Connection failures
        setTimeout(() => {
            console.log('Demo: Breaking connections');
            window.unifiedHexFlow.setConnectionBrokenState('hub', 'solutio', 'connection-severed');
            window.unifiedHexFlow.setConnectionBrokenState('solutio', 'coagulatio', 'connection-error');
        }, 5000);
        
        // Scenario 4: Multiple node failures
        setTimeout(() => {
            console.log('Demo: Multiple node failures');
            window.unifiedHexFlow.setNodeFailureState('validate', 'state-failed');
            window.unifiedHexFlow.setNodeFailureState('output', 'critical-failure');
        }, 7000);
        
        // Reset after demo
        setTimeout(() => {
            console.log('Demo: Resetting all failure states');
            window.unifiedHexFlow.clearAllFailureStates();
            console.log('🎭 Demo complete!');
        }, 10000);
        
        return true;
    }
};

// Console helper message
console.log('🔧 Hex Flow API available:');
console.log('  hexFlowFailureAPI.fail("prima", "state-failed") - Trigger failure');
console.log('  hexFlowFailureAPI.clear("prima") - Clear failure'); 
console.log('  hexFlowFailureAPI.breakConnection("hub", "prima") - Break connection');
console.log('  hexFlowFailureAPI.celebrate() - Golden celebration on output');
console.log('  hexFlowFailureAPI.showLineTypes() - Demo line animation types');
console.log('  hexFlowFailureAPI.reset() - Clear all states');
console.log('  hexFlowFailureAPI.demo() - Run failure demo');
console.log('  hexFlowFailureAPI.status() - Get system info');
console.log('');
console.log('📊 Line Animation Types:');
console.log('  • processing-active: Active data flow (directional waves)');
console.log('  • dotted-connection: Standby paths (static dotted)');
console.log('  • input-relationship: Input flow (golden waves from input)');
console.log('  • output-relationship: Output flow (golden waves to output)');
console.log('  • ready-to-flow: Ready state (pulsing dotted)');

// Initialize global instance when DOM is ready
function initializeUnifiedHexFlow() {
    console.log('🚀 Initializing UnifiedHexFlow global instance...');
    
    if (typeof UnifiedHexFlow === 'undefined') {
        console.error('❌ UnifiedHexFlow class not available!');
        return false;
    }
    
    if (window.unifiedHexFlow) {
        console.log('⚠️ UnifiedHexFlow instance already exists');
        return true;
    }
    
    try {
        window.unifiedHexFlow = new UnifiedHexFlow();
        console.log('✅ UnifiedHexFlow global instance created successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to create UnifiedHexFlow instance:', error);
        return false;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUnifiedHexFlow);
} else {
    // DOM is already ready
    initializeUnifiedHexFlow();
}

// Make initialization function globally available
window.initializeUnifiedHexFlow = initializeUnifiedHexFlow;