// ULTRA ANIMATION FIX - Ensures animations work when Generate is clicked
// This file overrides the broken animation system with one that DEFINITELY works

(function() {
    'use strict';
    
    console.log('🎬 Ultra Animation Fix loading...');
    
    // Wait for UnifiedHexFlow to be ready
    function installAnimationFix() {
        if (!window.unifiedHexFlow) {
            console.log('⏳ Waiting for UnifiedHexFlow...');
            setTimeout(installAnimationFix, 100);
            return;
        }
        
        console.log('🔧 Installing ULTRA ANIMATION FIX...');
        
        // Save original method
        window.unifiedHexFlow._originalStartAnimation = window.unifiedHexFlow.startProcessFlowWithAnimation;
        
        // Replace with guaranteed working animation
        window.unifiedHexFlow.startProcessFlowWithAnimation = function() {
            console.log('🚀 ULTRA ANIMATION SEQUENCE ACTIVATED!');
            
            // Prevent multiple animations
            if (this.isAnimating) {
                console.log('⚠️ Animation already in progress');
                return;
            }
            this.isAnimating = true;
            
            // Animation sequence with timings
            const sequence = [
                {id: 'input', color: '#ffcc33', label: 'Input Gateway', delay: 0},
                {id: 'hub', color: '#ff6b35', label: 'Transmutation Core', delay: 400},
                {id: 'prima', color: '#ff6b6b', label: 'Prima Materia', delay: 800},
                {id: 'hub', color: '#ff6b35', label: 'Core Processing', delay: 1600},
                {id: 'solutio', color: '#4ecdc4', label: 'Solutio', delay: 2000},
                {id: 'hub', color: '#ff6b35', label: 'Core Processing', delay: 2800},
                {id: 'coagulatio', color: '#45b7d1', label: 'Coagulatio', delay: 3200},
                {id: 'hub', color: '#ff6b35', label: 'Final Processing', delay: 4000},
                {id: 'output', color: '#ffd700', label: 'Output Complete', delay: 4400}
            ];
            
            // SVG zoom effect
            const svg = document.getElementById('hex-flow-board');
            if (svg) {
                svg.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                svg.style.transform = 'scale(1.15)';
                
                setTimeout(() => {
                    svg.style.transform = 'scale(1)';
                }, 5000);
            }
            
            // Animate each node in sequence
            sequence.forEach((step, index) => {
                setTimeout(() => {
                    const node = document.querySelector(`[data-id="${step.id}"]`);
                    if (node) {
                        console.log(`⚡ Animating: ${step.label}`);
                        
                        // Get current transform to preserve position
                        const currentTransform = node.getAttribute('transform') || '';
                        const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                        const translateX = translateMatch ? translateMatch[1] : '0';
                        const translateY = translateMatch ? translateMatch[2] : '0';
                        
                        // Create unique animation class
                        const animClass = `ultra-anim-${Date.now()}-${index}`;
                        
                        // Inject animation styles that preserve position
                        const style = document.createElement('style');
                        style.textContent = `
                            .${animClass} {
                                transform: translate(${translateX}, ${translateY}) scale(1.8) !important;
                                filter: drop-shadow(0 0 50px ${step.color}) brightness(1.8) !important;
                                z-index: 1000 !important;
                                transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1) !important;
                            }
                            .${animClass} polygon {
                                fill: ${step.color} !important;
                                fill-opacity: 1 !important;
                                stroke: #ffffff !important;
                                stroke-width: 6 !important;
                                transition: all 0.6s ease !important;
                            }
                            .${animClass} text {
                                fill: #ffffff !important;
                                font-size: 16px !important;
                                font-weight: bold !important;
                                transition: all 0.6s ease !important;
                            }
                        `;
                        document.head.appendChild(style);
                        
                        // Apply animation
                        node.classList.add(animClass);
                        
                        // Animate connection lines
                        if (step.delay > 0 && index > 0) {
                            animateConnectionLine(sequence[index - 1].id, step.id, step.color);
                        }
                        
                        // Reset after animation
                        setTimeout(() => {
                            node.classList.remove(animClass);
                            style.remove();
                        }, 600);
                    }
                }, step.delay);
            });
            
            // Final celebration effect
            setTimeout(() => {
                const outputNode = document.querySelector('[data-id="output"]');
                if (outputNode) {
                    console.log('🎉 GENERATION COMPLETE - CELEBRATION!');
                    
                    // Get current transform to preserve position
                    const currentTransform = outputNode.getAttribute('transform') || '';
                    const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                    const translateX = translateMatch ? translateMatch[1] : '0';
                    const translateY = translateMatch ? translateMatch[2] : '0';
                    
                    // Epic celebration animation
                    const celebrationClass = 'ultra-celebration';
                    const celebrationStyle = document.createElement('style');
                    celebrationStyle.textContent = `
                        @keyframes ultra-celebrate {
                            0% { transform: translate(${translateX}, ${translateY}) scale(1) rotate(0deg); }
                            50% { transform: translate(${translateX}, ${translateY}) scale(2.5) rotate(360deg); }
                            100% { transform: translate(${translateX}, ${translateY}) scale(1) rotate(720deg); }
                        }
                        .${celebrationClass} {
                            animation: ultra-celebrate 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
                            filter: drop-shadow(0 0 80px #ffd700) brightness(2) !important;
                        }
                        .${celebrationClass} polygon {
                            fill: #ffd700 !important;
                            stroke: #ffffff !important;
                            stroke-width: 8 !important;
                        }
                    `;
                    document.head.appendChild(celebrationStyle);
                    
                    outputNode.classList.add(celebrationClass);
                    
                    setTimeout(() => {
                        outputNode.classList.remove(celebrationClass);
                        celebrationStyle.remove();
                        this.isAnimating = false;
                    }, 1500);
                }
            }, 5000);
            
            // Helper function to animate connection lines according to legend
            function animateConnectionLine(fromId, toId, color) {
                const paths = document.querySelectorAll('path[data-connection]');
                paths.forEach(path => {
                    const conn = path.getAttribute('data-connection');
                    if (conn && ((conn.includes(fromId) && conn.includes(toId)) || 
                               (conn.includes(toId) && conn.includes(fromId)))) {
                        
                        const flowClass = `ultra-flow-${Date.now()}`;
                        const flowStyle = document.createElement('style');
                        
                        // Determine animation type based on nodes
                        let animationType = 'active-processing'; // default
                        if (fromId === 'input' || toId === 'input') {
                            animationType = 'input-relationship';
                        } else if (fromId === 'output' || toId === 'output') {
                            animationType = 'output-relationship';
                        }
                        
                        // Animation styles based on legend
                        if (animationType === 'active-processing') {
                            // Active Processing: green animated flow
                            flowStyle.textContent = `
                                @keyframes ${flowClass}-anim {
                                    0% { 
                                        stroke-dashoffset: 10;
                                        opacity: 0.7;
                                    }
                                    50% { 
                                        opacity: 1;
                                    }
                                    100% { 
                                        stroke-dashoffset: -10;
                                        opacity: 0.7;
                                    }
                                }
                                .${flowClass} {
                                    stroke: #10a37f !important;
                                    stroke-width: 3 !important;
                                    stroke-dasharray: 5, 5 !important;
                                    filter: drop-shadow(0 0 10px #10a37f) !important;
                                    animation: ${flowClass}-anim 2.5s linear infinite !important;
                                }
                            `;
                        } else if (animationType === 'input-relationship') {
                            // Input Relationship: golden waves from input
                            flowStyle.textContent = `
                                @keyframes ${flowClass}-anim {
                                    0% { 
                                        stroke-dashoffset: 0;
                                        stroke: #ffcc33;
                                        filter: drop-shadow(0 0 15px #ffcc33);
                                    }
                                    100% { 
                                        stroke-dashoffset: -20;
                                        stroke: #ffd700;
                                        filter: drop-shadow(0 0 20px #ffd700);
                                    }
                                }
                                .${flowClass} {
                                    stroke: #ffcc33 !important;
                                    stroke-width: 4 !important;
                                    stroke-dasharray: 8, 4 !important;
                                    animation: ${flowClass}-anim 1s linear infinite !important;
                                }
                            `;
                        } else if (animationType === 'output-relationship') {
                            // Output Relationship: golden waves to output
                            flowStyle.textContent = `
                                @keyframes ${flowClass}-anim {
                                    0% { 
                                        stroke-dashoffset: 0;
                                        stroke: #ffd700;
                                        filter: drop-shadow(0 0 15px #ffd700);
                                    }
                                    100% { 
                                        stroke-dashoffset: -20;
                                        stroke: #ffcc33;
                                        filter: drop-shadow(0 0 20px #ffcc33);
                                    }
                                }
                                .${flowClass} {
                                    stroke: #ffd700 !important;
                                    stroke-width: 4 !important;
                                    stroke-dasharray: 8, 4 !important;
                                    animation: ${flowClass}-anim 1s linear infinite !important;
                                }
                            `;
                        }
                        
                        document.head.appendChild(flowStyle);
                        path.classList.add(flowClass);
                        
                        // Also add the appropriate connection type class
                        path.classList.add(animationType);
                        
                        setTimeout(() => {
                            path.classList.remove(flowClass);
                            path.classList.remove(animationType);
                            flowStyle.remove();
                            
                            // Return to standby state
                            path.style.stroke = '#6c757d';
                            path.style.strokeWidth = '2';
                            path.style.strokeDasharray = '3,3';
                            path.style.opacity = '0.6';
                        }, 1000);
                    }
                });
            }
        };
        
        // Also fix the form submit handler
        const generateForm = document.getElementById('generate-form');
        if (generateForm) {
            // Add high-priority event listener
            generateForm.addEventListener('submit', function(e) {
                console.log('🎯 Generate form submitted - triggering ULTRA animation!');
                
                // Always trigger our animation
                setTimeout(() => {
                    if (window.unifiedHexFlow) {
                        window.unifiedHexFlow.startProcessFlowWithAnimation();
                    }
                }, 50);
                
                // Don't prevent default - let other handlers run too
            }, true); // Use capture phase for priority
        }
        
        console.log('✅ ULTRA ANIMATION FIX INSTALLED!');
        console.log('🎮 Click Generate to see the amazing animation sequence!');
        
        // Add test function
        window.testUltraAnimation = function() {
            console.log('🧪 Testing ULTRA animation...');
            if (window.unifiedHexFlow) {
                window.unifiedHexFlow.startProcessFlowWithAnimation();
            }
        };
    }
    
    // Start installation
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', installAnimationFix);
    } else {
        setTimeout(installAnimationFix, 100);
    }
})();