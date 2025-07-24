// Tattoo-style Alchemical Effect for Output Gateway
// Creates swirling, branching lines in a modern alchemical tattoo art style

class TattooAlchemyEffect {
    constructor() {
        this.outputNode = null;
        this.svgNamespace = 'http://www.w3.org/2000/svg';
        this.debug = this.createDebugger();
    }
    
    // Create debug logger
    createDebugger() {
        return (message, data = null) => {
            const timestamp = new Date().toTimeString().split(' ')[0];
            if (data) {
                console.log(`[${timestamp}] 🎨 TATTOO: ${message}`, data);
            } else {
                console.log(`[${timestamp}] 🎨 TATTOO: ${message}`);
            }
        };
    }

    // Create the complete tattoo effect on the output hex
    createOutputTattooEffect(hexNode) {
        this.debug('createOutputTattooEffect called', hexNode);
        
        if (!hexNode) {
            this.debug('❌ No hex node provided');
            return;
        }
        
        this.outputNode = hexNode;
        hexNode.classList.add('output-tattoo-active');
        this.debug('✅ Added output-tattoo-active class');
        
        // Get hex center position in SVG coordinates
        const svg = hexNode.closest('svg');
        if (!svg) {
            this.debug('❌ Could not find parent SVG');
            return;
        }
        
        // Get the hex polygon and its center
        const polygon = hexNode.querySelector('polygon');
        if (!polygon) {
            this.debug('❌ Could not find polygon in hex node');
            return;
        }
        
        // Get hex transform
        const transform = hexNode.getAttribute('transform');
        const translateMatch = transform ? transform.match(/translate\(([^,]+),([^)]+)\)/) : null;
        const centerX = translateMatch ? parseFloat(translateMatch[1]) : 0;
        const centerY = translateMatch ? parseFloat(translateMatch[2]) : 0;
        this.debug('📍 Tattoo center position', { centerX, centerY, transform });
        
        // Create container for tattoo elements
        const tattooContainer = document.createElementNS(this.svgNamespace, 'g');
        tattooContainer.setAttribute('class', 'tattoo-alchemy-pattern');
        tattooContainer.setAttribute('transform', `translate(${centerX}, ${centerY})`);
        tattooContainer.setAttribute('id', 'active-tattoo-effect');
        
        // Create radiant burst effect first
        this.createRadiantBurst(tattooContainer);
        this.debug('✅ Created radiant burst');
        
        // Generate multiple swirl patterns
        this.createSwirls(tattooContainer);
        this.debug('✅ Created swirl patterns');
        
        // Add filigree patterns for extra ornateness
        this.createFiligreePatterns(tattooContainer);
        this.debug('✅ Created filigree patterns');
        
        // Add branching patterns
        this.createBranches(tattooContainer);
        this.debug('✅ Created branch patterns');
        
        // Add alchemical symbols
        this.createAlchemicalSymbols(tattooContainer);
        this.debug('✅ Created alchemical symbols');
        
        // Add flowing particles
        this.createFlowingParticles(tattooContainer);
        this.debug('✅ Created flowing particles');
        
        // Create golden sparkles
        this.createSparkleEffect(svg, centerX, centerY);
        this.debug('✅ Created sparkle effect');
        
        // Find the hex nodes group or create one at the right level
        let nodesGroup = svg.querySelector('#hex-nodes');
        if (!nodesGroup) {
            nodesGroup = svg.querySelector('g');
        }
        
        // Insert tattoo container after the hex node for proper layering
        if (hexNode.parentNode) {
            hexNode.parentNode.insertBefore(tattooContainer, hexNode.nextSibling);
            this.debug('✅ Tattoo container added to DOM');
        } else {
            svg.appendChild(tattooContainer);
            this.debug('⚠️ Added tattoo container to SVG root');
        }
        
        // Store reference for cleanup
        hexNode.tattooContainer = tattooContainer;
        
        // Mark as complete after animation
        setTimeout(() => {
            hexNode.classList.add('tattoo-complete');
            this.debug('✅ Tattoo animation complete');
            // Keep some sparkles going
            this.sustainedSparkles(svg, centerX, centerY);
        }, 4000);
    }

    // Create radiant burst effect
    createRadiantBurst(container) {
        const burstContainer = document.createElementNS(this.svgNamespace, 'g');
        burstContainer.setAttribute('class', 'radiant-burst');
        
        // Create 12 rays bursting outward
        for (let i = 0; i < 12; i++) {
            const ray = document.createElementNS(this.svgNamespace, 'rect');
            ray.setAttribute('class', 'radiant-ray');
            ray.setAttribute('x', '-1');
            ray.setAttribute('y', '0');
            ray.setAttribute('width', '2');
            ray.setAttribute('height', '100');
            ray.setAttribute('transform', `rotate(${i * 30})`);
            ray.style.animationDelay = `${i * 0.05}s`;
            burstContainer.appendChild(ray);
        }
        
        container.appendChild(burstContainer);
    }

    // Create filigree patterns for ornateness
    createFiligreePatterns(container) {
        const filigrees = [
            // Filigree 1 - Upper ornamental curve
            {
                path: 'M -50,-80 Q -30,-90 -10,-85 T 20,-75 Q 40,-65 50,-45 T 55,-20',
                class: 'tattoo-filigree tattoo-filigree-1'
            },
            // Filigree 2 - Lower ornamental curve
            {
                path: 'M 60,70 Q 40,80 20,75 T -10,65 Q -30,55 -40,35 T -45,10',
                class: 'tattoo-filigree tattoo-filigree-2'
            }
        ];

        filigrees.forEach(filigree => {
            const path = document.createElementNS(this.svgNamespace, 'path');
            path.setAttribute('d', filigree.path);
            path.setAttribute('class', filigree.class);
            container.appendChild(path);
        });
    }

    // Create swirling patterns emanating from hex - enhanced version
    createSwirls(container) {
        const swirls = [
            // Swirl 1 - Large clockwise spiral with flourish
            {
                path: 'M 0,0 Q 50,-50 100,-40 T 150,-20 Q 180,10 170,60 T 140,120 Q 100,140 50,130 T -20,100 Q -40,80 -30,50',
                class: 'tattoo-swirl tattoo-swirl-1'
            },
            // Swirl 2 - Counter-clockwise wave with ornamental end
            {
                path: 'M 0,0 Q -40,-60 -80,-70 T -120,-50 Q -140,-20 -130,20 T -100,60 Q -60,80 -20,70 T 10,50',
                class: 'tattoo-swirl tattoo-swirl-2'
            },
            // Swirl 3 - S-curve pattern with decorative loops
            {
                path: 'M 0,0 Q 60,20 80,60 T 70,120 Q 50,160 0,170 T -60,150 Q -80,120 -70,80 T -40,20 Q -20,0 0,0',
                class: 'tattoo-swirl tattoo-swirl-3'
            },
            // Swirl 4 - Spiral with loop and flourish
            {
                path: 'M 0,0 Q -50,30 -60,70 T -40,120 Q -10,140 30,130 T 70,100 Q 90,70 80,30 T 50,-10 Q 30,-20 0,0',
                class: 'tattoo-swirl tattoo-swirl-4'
            }
        ];

        swirls.forEach((swirl, index) => {
            const path = document.createElementNS(this.svgNamespace, 'path');
            path.setAttribute('d', swirl.path);
            path.setAttribute('class', swirl.class);
            path.setAttribute('id', `tattoo-swirl-${index}`);
            container.appendChild(path);
        });
    }

    // Create branching patterns
    createBranches(container) {
        const branches = [
            // Branch 1 - Upper right
            {
                path: 'M 80,-30 Q 100,-40 120,-35 M 100,-40 Q 105,-55 115,-60 M 100,-40 Q 110,-45 115,-50',
                class: 'tattoo-branch tattoo-branch-1',
                transform: 'rotate(30)'
            },
            // Branch 2 - Lower left
            {
                path: 'M -70,40 Q -85,50 -95,55 M -85,50 Q -90,60 -95,70 M -85,50 Q -95,45 -105,45',
                class: 'tattoo-branch tattoo-branch-2',
                transform: 'rotate(-45)'
            },
            // Branch 3 - Upper left
            {
                path: 'M -60,-50 Q -75,-60 -85,-65 M -75,-60 Q -80,-70 -85,-80 M -75,-60 Q -85,-55 -95,-55',
                class: 'tattoo-branch tattoo-branch-3',
                transform: 'rotate(120)'
            }
        ];

        branches.forEach(branch => {
            const path = document.createElementNS(this.svgNamespace, 'path');
            path.setAttribute('d', branch.path);
            path.setAttribute('class', branch.class);
            path.setAttribute('transform', branch.transform);
            container.appendChild(path);
        });
    }

    // Create alchemical symbols along the swirls
    createAlchemicalSymbols(container) {
        const symbols = [
            // Mercury symbol
            {
                transform: 'translate(100, -40)',
                class: 'alchemy-symbol alchemy-symbol-1',
                path: 'M -8,0 A 8,8 0 1,1 8,0 A 8,8 0 1,1 -8,0 M 0,8 L 0,16 M -6,16 L 6,16 M 0,-8 L 0,-16 M -4,-12 L 4,-12'
            },
            // Sulfur symbol
            {
                transform: 'translate(-80, 70)',
                class: 'alchemy-symbol alchemy-symbol-2',
                path: 'M -6,-10 L 6,-10 L 0,5 Z M 0,5 L 0,12 M -6,12 L 6,12'
            },
            // Salt symbol
            {
                transform: 'translate(50, 100)',
                class: 'alchemy-symbol alchemy-symbol-3',
                path: 'M -8,0 L 8,0 M 0,-8 L 0,8 M -8,0 A 8,8 0 0,1 0,-8 M 8,0 A 8,8 0 0,1 0,8'
            }
        ];

        symbols.forEach(symbol => {
            const g = document.createElementNS(this.svgNamespace, 'g');
            g.setAttribute('transform', symbol.transform);
            g.setAttribute('class', symbol.class);
            
            const path = document.createElementNS(this.svgNamespace, 'path');
            path.setAttribute('d', symbol.path);
            path.setAttribute('stroke-width', '2');
            path.setAttribute('stroke', '#ffd700');
            path.setAttribute('fill', 'none');
            
            g.appendChild(path);
            container.appendChild(g);
        });
    }

    // Create flowing particles along the swirls
    createFlowingParticles(container) {
        // Create particles that flow along the swirl paths
        const swirlPaths = container.querySelectorAll('.tattoo-swirl');
        
        swirlPaths.forEach((path, index) => {
            // Create multiple particles per path
            for (let i = 0; i < 3; i++) {
                const particle = document.createElementNS(this.svgNamespace, 'circle');
                particle.setAttribute('r', '2');
                particle.setAttribute('class', 'tattoo-particle tattoo-particle-flow');
                
                // Create motion along path
                const animateMotion = document.createElementNS(this.svgNamespace, 'animateMotion');
                animateMotion.setAttribute('dur', `${4 + i}s`);
                animateMotion.setAttribute('repeatCount', 'indefinite');
                animateMotion.setAttribute('begin', `${i * 1.5}s`);
                
                const mpath = document.createElementNS(this.svgNamespace, 'mpath');
                mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#tattoo-swirl-${index}`);
                
                animateMotion.appendChild(mpath);
                particle.appendChild(animateMotion);
                
                // Fade in/out animation
                const animate = document.createElementNS(this.svgNamespace, 'animate');
                animate.setAttribute('attributeName', 'opacity');
                animate.setAttribute('values', '0;1;1;0');
                animate.setAttribute('dur', `${4 + i}s`);
                animate.setAttribute('repeatCount', 'indefinite');
                animate.setAttribute('begin', `${i * 1.5}s`);
                
                particle.appendChild(animate);
                container.appendChild(particle);
            }
        });
    }

    // Create golden sparkles
    createSparkleEffect(svg, centerX, centerY) {
        // Create sparkles at intervals
        let sparkleCount = 0;
        const sparkleInterval = setInterval(() => {
            if (sparkleCount >= 20) {
                clearInterval(sparkleInterval);
                return;
            }
            
            const sparkle = document.createElementNS(this.svgNamespace, 'circle');
            
            // Random position around the output hex
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 80 + 20;
            const sparkleX = centerX + Math.cos(angle) * distance;
            const sparkleY = centerY + Math.sin(angle) * distance;
            
            sparkle.setAttribute('class', 'golden-sparkle');
            sparkle.setAttribute('cx', sparkleX);
            sparkle.setAttribute('cy', sparkleY);
            sparkle.setAttribute('r', '2');
            sparkle.style.animationDelay = `${Math.random() * 0.5}s`;
            
            svg.appendChild(sparkle);
            
            // Remove after animation
            setTimeout(() => {
                sparkle.remove();
            }, 1500);
            
            sparkleCount++;
        }, 100);
    }
    
    // Sustained sparkle animation for permanent glow
    sustainedSparkles(svg, centerX, centerY) {
        // Create occasional sparkles for sustained effect
        const createSustainedSparkle = () => {
            const sparkle = document.createElementNS(this.svgNamespace, 'circle');
            
            // Random position in a tighter radius
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 60 + 10;
            const sparkleX = centerX + Math.cos(angle) * distance;
            const sparkleY = centerY + Math.sin(angle) * distance;
            
            sparkle.setAttribute('class', 'golden-sparkle');
            sparkle.setAttribute('cx', sparkleX);
            sparkle.setAttribute('cy', sparkleY);
            sparkle.setAttribute('r', '1.5');
            sparkle.style.animationDuration = '2s';
            
            svg.appendChild(sparkle);
            
            // Remove after animation
            setTimeout(() => {
                sparkle.remove();
            }, 2000);
        };
        
        // Create sparkles periodically
        setInterval(() => {
            createSustainedSparkle();
        }, 500);
    }

    // Remove tattoo effect
    removeTattooEffect(hexNode) {
        if (hexNode && hexNode.tattooContainer) {
            hexNode.tattooContainer.remove();
            hexNode.classList.remove('output-tattoo-active', 'tattoo-complete');
            delete hexNode.tattooContainer;
        }
    }
}

// Create global instance
const tattooAlchemyEffect = new TattooAlchemyEffect();
console.log('🎨 TattooAlchemyEffect instance created');

// Export for use in other scripts
window.TattooAlchemyEffect = TattooAlchemyEffect;
window.createOutputTattooEffect = (node) => {
    console.log('🎨 Global createOutputTattooEffect called');
    return tattooAlchemyEffect.createOutputTattooEffect(node);
};
window.removeTattooEffect = (node) => tattooAlchemyEffect.removeTattooEffect(node);

// Test functions
window.testTattooEffects = {
    create: function() {
        console.log('🧪 Testing tattoo effect creation...');
        const outputNode = document.querySelector('[data-id="output"]');
        if (outputNode) {
            window.createOutputTattooEffect(outputNode);
        } else {
            console.error('Output node not found! Available nodes:', 
                Array.from(document.querySelectorAll('[data-id]')).map(n => n.getAttribute('data-id'))
            );
        }
    },
    
    status: function() {
        const tattooContainer = document.getElementById('active-tattoo-effect');
        const outputActive = document.querySelector('.output-tattoo-active');
        const tattooComplete = document.querySelector('.tattoo-complete');
        
        console.log('🔍 Tattoo Effect Status:');
        console.log('  • Tattoo Container Active:', !!tattooContainer);
        console.log('  • Output Node Active:', !!outputActive);
        console.log('  • Tattoo Complete:', !!tattooComplete);
        
        return {
            containerActive: !!tattooContainer,
            outputActive: !!outputActive,
            complete: !!tattooComplete
        };
    },
    
    remove: function() {
        console.log('🧹 Removing tattoo effects...');
        const outputNode = document.querySelector('[data-id="output"]');
        if (outputNode) {
            window.removeTattooEffect(outputNode);
        }
    }
};

console.log('🎨 Tattoo effect system ready!');
console.log('  testTattooEffects.create() - Create tattoo effect');
console.log('  testTattooEffects.status() - Check status');
console.log('  testTattooEffects.remove() - Remove effect');

// Integrate with existing hex border animations if available
if (window.createOutputHexCelebration) {
    console.log('🔗 Integrating with hex border animations...');
    const originalCelebration = window.createOutputHexCelebration;
    window.createOutputHexCelebration = function(node) {
        console.log('🎉 Enhanced celebration triggered');
        // Call original celebration
        originalCelebration(node);
        // Add tattoo effect
        tattooAlchemyEffect.createOutputTattooEffect(node);
    };
}