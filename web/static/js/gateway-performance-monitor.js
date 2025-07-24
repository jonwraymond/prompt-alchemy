// Gateway Effects Performance Monitor
(function() {
    'use strict';
    
    // Performance monitoring state
    const performanceStats = {
        frameRate: 0,
        activeParticles: 0,
        memoryUsage: 0,
        effectsActive: 0,
        lastFrameTime: 0,
        frameCount: 0
    };
    
    const performanceInterval = null;
    let isMonitoring = false;
    
    // Advanced performance tracking
    function trackPerformance() {
        const now = performance.now();
        
        if (performanceStats.lastFrameTime) {
            const delta = now - performanceStats.lastFrameTime;
            performanceStats.frameRate = Math.round(1000 / delta);
        }
        
        performanceStats.lastFrameTime = now;
        performanceStats.frameCount++;
        
        // Count active particles
        performanceStats.activeParticles = document.querySelectorAll('.input-particle, .golden-sparkle, .data-fragment').length;
        
        // Count active effects
        performanceStats.effectsActive = document.querySelectorAll('.input-vortex, .radiant-burst, .tattoo-alchemy-pattern').length;
        
        // Memory usage (if available)
        if (performance.memory) {
            performanceStats.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        }
        
        // Log performance every 60 frames
        if (performanceStats.frameCount % 60 === 0) {
            console.log(`🎭 Performance: ${performanceStats.frameRate}fps, ${performanceStats.activeParticles} particles, ${performanceStats.effectsActive} effects, ${performanceStats.memoryUsage}MB`);
        }
        
        if (isMonitoring) {
            requestAnimationFrame(trackPerformance);
        }
    }
    
    // Advanced effect coordination
    function coordinateEffects() {
        const coordination = {
            inputPhase: {
                duration: 4000,
                effects: ['vortex', 'particles', 'dataStreams']
            },
            transitionPhase: {
                duration: 1000,
                effects: ['connectionPulse', 'energyTransfer']
            },
            outputPhase: {
                duration: 6000,
                effects: ['radiantBurst', 'tattooOverlay', 'crownCompletion']
            }
        };
        
        console.log('🎼 Coordinating advanced effect sequence...');
        
        // Phase 1: Enhanced Input
        console.log('🌀 Phase 1: Enhanced Input Vortex');
        if (window.testGatewayEffects) {
            window.testGatewayEffects.inputVortex();
        }
        
        // Phase 2: Transition Effects
        setTimeout(() => {
            console.log('⚡ Phase 2: Energy Transfer');
            createEnergyTransferEffect();
        }, coordination.inputPhase.duration);
        
        // Phase 3: Enhanced Output
        setTimeout(() => {
            console.log('✨ Phase 3: Golden Transmutation');
            if (window.testGatewayEffects) {
                window.testGatewayEffects.outputTransmutation();
            }
        }, coordination.inputPhase.duration + coordination.transitionPhase.duration);
        
        // Phase 4: Completion Crown
        setTimeout(() => {
            console.log('👑 Phase 4: Crown Completion');
            createCompletionCelebration();
        }, coordination.inputPhase.duration + coordination.transitionPhase.duration + coordination.outputPhase.duration);
        
        return coordination;
    }
    
    // Energy transfer effect between input and output
    function createEnergyTransferEffect() {
        const inputNode = document.getElementById('input');
        const outputNode = document.getElementById('output');
        
        if (!inputNode || !outputNode) return;
        
        // Get node positions
        const inputRect = inputNode.getBoundingClientRect();
        const outputRect = outputNode.getBoundingClientRect();
        
        // Create energy bolt container
        const energyBolt = document.createElement('div');
        energyBolt.className = 'energy-transfer-bolt';
        energyBolt.style.cssText = `
            position: fixed;
            left: ${inputRect.left + inputRect.width/2}px;
            top: ${inputRect.top + inputRect.height/2}px;
            width: 4px;
            height: 4px;
            background: linear-gradient(45deg, #ff0080, #00ffff, #ffd700);
            border-radius: 50%;
            z-index: 9999;
            pointer-events: none;
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
        `;
        
        document.body.appendChild(energyBolt);
        
        // Animate bolt from input to output
        const dx = outputRect.left + outputRect.width/2 - (inputRect.left + inputRect.width/2);
        const dy = outputRect.top + outputRect.height/2 - (inputRect.top + inputRect.height/2);
        
        energyBolt.animate([
            { transform: 'scale(1)', filter: 'hue-rotate(0deg)' },
            { transform: `translate(${dx/2}px, ${dy/2}px) scale(2)`, filter: 'hue-rotate(180deg)' },
            { transform: `translate(${dx}px, ${dy}px) scale(3)`, filter: 'hue-rotate(360deg)' }
        ], {
            duration: 1000,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }).onfinish = () => {
            energyBolt.remove();
            
            // Create impact burst at output
            createImpactBurst(outputNode);
        };
    }
    
    // Impact burst at output node
    function createImpactBurst(targetNode) {
        const burstContainer = document.createElement('div');
        burstContainer.className = 'impact-burst';
        burstContainer.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 200px;
            height: 200px;
            pointer-events: none;
            z-index: 1000;
        `;
        
        // Create burst particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            const angle = (i / 12) * Math.PI * 2;
            const distance = 80;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            particle.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                width: 8px;
                height: 8px;
                background: linear-gradient(45deg, #ffd700, #ffed4e);
                border-radius: 50%;
                box-shadow: 0 0 15px #ffd700;
            `;
            
            particle.animate([
                { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
                { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`, opacity: 0 }
            ], {
                duration: 800,
                easing: 'ease-out'
            });
            
            burstContainer.appendChild(particle);
        }
        
        targetNode.appendChild(burstContainer);
        
        setTimeout(() => burstContainer.remove(), 1000);
    }
    
    // Completion celebration effect
    function createCompletionCelebration() {
        console.log('🎉 Creating completion celebration');
        
        // Create celebration particles across the screen
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                createCelebrationParticle();
            }, i * 100);
        }
        
        // Add screen flash effect
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
            z-index: 9998;
            pointer-events: none;
        `;
        
        document.body.appendChild(flash);
        
        flash.animate([
            { opacity: 0 },
            { opacity: 1 },
            { opacity: 0 }
        ], {
            duration: 1500,
            easing: 'ease-in-out'
        }).onfinish = () => flash.remove();
    }
    
    // Individual celebration particle
    function createCelebrationParticle() {
        const particle = document.createElement('div');
        const startX = Math.random() * window.innerWidth;
        const startY = -20;
        const endY = window.innerHeight + 20;
        const drift = (Math.random() - 0.5) * 200;
        
        particle.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            width: 12px;
            height: 12px;
            background: linear-gradient(45deg, #ffd700, #ffed4e, #ff69b4);
            border-radius: 50%;
            z-index: 9999;
            pointer-events: none;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
        `;
        
        document.body.appendChild(particle);
        
        particle.animate([
            { 
                transform: 'translateY(0) rotate(0deg) scale(1)',
                filter: 'hue-rotate(0deg)'
            },
            { 
                transform: `translateY(${endY}px) translateX(${drift}px) rotate(720deg) scale(0.5)`,
                filter: 'hue-rotate(360deg)'
            }
        ], {
            duration: 3000 + Math.random() * 2000,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }).onfinish = () => particle.remove();
    }
    
    // Performance optimization suggestions
    function getOptimizationSuggestions() {
        const suggestions = [];
        
        if (performanceStats.frameRate < 30) {
            suggestions.push('⚠️ Low frame rate detected. Consider reducing particle count.');
        }
        
        if (performanceStats.activeParticles > 100) {
            suggestions.push('⚠️ High particle count. Enable particle pooling.');
        }
        
        if (performanceStats.memoryUsage > 100) {
            suggestions.push('⚠️ High memory usage. Check for memory leaks.');
        }
        
        if (performanceStats.effectsActive > 5) {
            suggestions.push('⚠️ Multiple effects active. Consider effect queuing.');
        }
        
        return suggestions;
    }
    
    // Export advanced gateway functions
    window.advancedGatewayEffects = {
        startMonitoring: () => {
            console.log('📊 Starting performance monitoring...');
            isMonitoring = true;
            trackPerformance();
            return true;
        },
        
        stopMonitoring: () => {
            console.log('📊 Stopping performance monitoring...');
            isMonitoring = false;
            return true;
        },
        
        getStats: () => {
            console.log('📈 Performance Stats:', performanceStats);
            return performanceStats;
        },
        
        coordinateAdvanced: () => {
            console.log('🎼 Starting advanced effect coordination...');
            return coordinateEffects();
        },
        
        energyTransfer: () => {
            console.log('⚡ Creating energy transfer effect...');
            createEnergyTransferEffect();
            return true;
        },
        
        celebrate: () => {
            console.log('🎉 Creating completion celebration...');
            createCompletionCelebration();
            return true;
        },
        
        optimize: () => {
            const suggestions = getOptimizationSuggestions();
            console.log('🔧 Optimization Suggestions:', suggestions);
            return suggestions;
        },
        
        fullDemo: () => {
            console.log('🎪 Starting full advanced demo...');
            
            // Start monitoring
            window.advancedGatewayEffects.startMonitoring();
            
            // Run coordinated sequence
            setTimeout(() => {
                window.advancedGatewayEffects.coordinateAdvanced();
            }, 1000);
            
            // Final celebration
            setTimeout(() => {
                window.advancedGatewayEffects.celebrate();
            }, 12000);
            
            // Stop monitoring
            setTimeout(() => {
                window.advancedGatewayEffects.stopMonitoring();
                console.log('🎭 Advanced demo complete!');
            }, 15000);
            
            return true;
        }
    };
    
    console.log('🚀 Advanced Gateway Effects Performance Monitor loaded');
    console.log('🎮 Advanced functions:');
    console.log('  advancedGatewayEffects.fullDemo()      - Complete advanced demo');
    console.log('  advancedGatewayEffects.coordinateAdvanced() - Coordinated sequence');
    console.log('  advancedGatewayEffects.startMonitoring() - Performance tracking');
    console.log('  advancedGatewayEffects.getStats()      - Performance stats');
    console.log('  advancedGatewayEffects.optimize()      - Optimization tips');
    
})(); 