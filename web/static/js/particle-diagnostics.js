// Particle Diagnostics Tool - Debug missing particles
console.log('🔍 Particle Diagnostics Loading...');

class ParticleDiagnostics {
    constructor() {
        this.init();
    }
    
    init() {
        // Create diagnostic panel
        this.createDiagnosticPanel();
        
        // Start monitoring
        this.startMonitoring();
        
        // Expose global diagnostic functions
        window.particleDiag = {
            checkParticles: () => this.checkAllParticles(),
            testParticle: (from, to) => this.testParticle(from, to),
            monitorDOM: () => this.monitorDOMChanges(),
            showReport: () => this.generateReport()
        };
        
        console.log('✅ Particle Diagnostics initialized');
        console.log('Available commands:');
        console.log('  particleDiag.checkParticles() - Check all particle systems');
        console.log('  particleDiag.testParticle("input", "hub") - Test specific particle');
        console.log('  particleDiag.monitorDOM() - Start DOM mutation monitoring');
        console.log('  particleDiag.showReport() - Generate full diagnostic report');
    }
    
    createDiagnosticPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'particle-diagnostics';
        this.panel.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            width: 350px;
            max-height: 400px;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border: 2px solid #00ff00;
            border-radius: 5px;
            z-index: 999999;
            overflow-y: auto;
            display: none;
        `;
        
        this.panel.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">🔍 Particle Diagnostics</h3>
            <div id="diag-stats"></div>
            <div id="diag-log" style="margin-top: 10px; max-height: 300px; overflow-y: auto;"></div>
            <button onclick="this.parentElement.style.display='none'" style="position: absolute; top: 5px; right: 5px; background: transparent; border: 1px solid #00ff00; color: #00ff00; cursor: pointer;">X</button>
        `;
        
        document.body.appendChild(this.panel);
    }
    
    log(message, type = 'info') {
        const timestamp = new Date().toISOString().split('T')[1];
        const logDiv = document.getElementById('diag-log');
        if (logDiv) {
            const entry = document.createElement('div');
            entry.style.color = type === 'error' ? '#ff0000' : type === 'success' ? '#00ff00' : '#ffff00';
            entry.textContent = `[${timestamp}] ${message}`;
            logDiv.insertBefore(entry, logDiv.firstChild);
            
            // Keep only last 50 entries
            while (logDiv.children.length > 50) {
                logDiv.removeChild(logDiv.lastChild);
            }
        }
        
        // Also log to console
        console.log(`[Particle Diag] ${message}`);
    }
    
    updateStats() {
        const stats = this.gatherStats();
        const statsDiv = document.getElementById('diag-stats');
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div>SVG Elements: ${stats.svgCount}</div>
                <div>Particle Groups: ${stats.particleGroups}</div>
                <div>Active Animations: ${stats.activeAnimations}</div>
                <div>Flow Particles: ${stats.flowParticles}</div>
                <div>Call Transfer Particles: ${stats.callTransferParticles}</div>
                <div>Real API Particles: ${stats.realAPIParticles}</div>
                <div>Total Paths: ${stats.totalPaths}</div>
                <div>Connection Lines: ${stats.connectionLines}</div>
            `;
        }
    }
    
    gatherStats() {
        const svg = document.getElementById('hex-flow-board') || document.querySelector('svg');
        if (!svg) return { error: 'No SVG found' };
        
        return {
            svgCount: document.querySelectorAll('svg').length,
            particleGroups: svg.querySelectorAll('[class*="particle"]').length,
            activeAnimations: svg.querySelectorAll('animateMotion').length,
            flowParticles: svg.querySelectorAll('[class*="flow-particle"]').length,
            callTransferParticles: svg.querySelectorAll('.call-transfer-animation').length,
            realAPIParticles: svg.querySelectorAll('.real-api-particle').length,
            totalPaths: svg.querySelectorAll('path').length,
            connectionLines: svg.querySelectorAll('.connection-line').length
        };
    }
    
    checkAllParticles() {
        this.panel.style.display = 'block';
        this.log('=== Particle System Check ===', 'info');
        
        // Check each particle system
        this.checkEngineFlowConnections();
        this.checkCallTransferAnimation();
        this.checkRealAPIParticles();
        this.checkSVGStructure();
        
        this.updateStats();
    }
    
    checkEngineFlowConnections() {
        this.log('Checking Engine Flow Connections...', 'info');
        
        if (window.EngineFlowConnections) {
            this.log('✅ EngineFlowConnections found', 'success');
            
            // Try to trigger a test animation
            if (window.animateConnection) {
                this.log('Testing animateConnection...', 'info');
                window.animateConnection('input-hub', 'forward', 'active-processing');
            }
        } else {
            this.log('❌ EngineFlowConnections not found', 'error');
        }
    }
    
    checkCallTransferAnimation() {
        this.log('Checking Call Transfer Animation...', 'info');
        
        if (window.callTransferAnimation) {
            this.log('✅ CallTransferAnimation found', 'success');
            this.log(`Active transfers: ${window.callTransferAnimation.activeTransfers.size}`, 'info');
        } else {
            this.log('❌ CallTransferAnimation not found', 'error');
        }
    }
    
    checkRealAPIParticles() {
        this.log('Checking Real API Particles...', 'info');
        
        if (window.realAPIParticles) {
            this.log('✅ RealAPIParticles found', 'success');
            const layer = document.getElementById('real-api-particles');
            if (layer) {
                this.log(`Particle layer exists with ${layer.children.length} children`, 'info');
            } else {
                this.log('❌ Particle layer not found', 'error');
            }
        } else {
            this.log('❌ RealAPIParticles not found', 'error');
        }
    }
    
    checkSVGStructure() {
        this.log('Checking SVG Structure...', 'info');
        
        const svg = document.getElementById('hex-flow-board') || document.querySelector('svg');
        if (!svg) {
            this.log('❌ No SVG found!', 'error');
            return;
        }
        
        this.log('✅ SVG found', 'success');
        
        // Check for required groups
        const groups = {
            'hex-nodes': svg.querySelector('#hex-nodes'),
            'connection-paths': svg.querySelector('#connection-paths'),
            'flow-particles': svg.querySelector('#flow-particles'),
            'real-api-particles': svg.querySelector('#real-api-particles')
        };
        
        for (const [id, element] of Object.entries(groups)) {
            if (element) {
                this.log(`✅ ${id} group found`, 'success');
            } else {
                this.log(`❌ ${id} group missing`, 'error');
            }
        }
    }
    
    testParticle(fromNode = 'input', toNode = 'hub') {
        this.panel.style.display = 'block';
        this.log(`=== Testing Particle: ${fromNode} → ${toNode} ===`, 'info');
        
        // Test each system
        this.log('1. Testing Engine Flow Connection...', 'info');
        if (window.animateConnection) {
            window.animateConnection(`${fromNode}-${toNode}`, 'forward', 'active-processing');
        }
        
        setTimeout(() => {
            this.log('2. Testing Call Transfer Animation...', 'info');
            if (window.animateCallTransfer) {
                window.animateCallTransfer(fromNode, toNode, {
                    duration: 3000,
                    color: '#00ff88',
                    size: 12
                });
            }
        }, 1000);
        
        setTimeout(() => {
            this.log('3. Testing Real API Particle...', 'info');
            if (window.realAPIParticles) {
                window.realAPIParticles.createAPIParticle(fromNode, toNode, 'test');
            }
        }, 2000);
        
        setTimeout(() => {
            this.updateStats();
            this.log('Test sequence complete', 'success');
        }, 3500);
    }
    
    monitorDOMChanges() {
        this.panel.style.display = 'block';
        this.log('=== Starting DOM Monitoring ===', 'info');
        
        const svg = document.getElementById('hex-flow-board') || document.querySelector('svg');
        if (!svg) {
            this.log('❌ No SVG to monitor', 'error');
            return;
        }
        
        // Monitor for particle additions/removals
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.getAttribute) {
                            const className = node.getAttribute('class') || '';
                            const id = node.getAttribute('id') || '';
                            
                            if (className.includes('particle') || id.includes('particle')) {
                                this.log(`➕ Particle added: ${className || id}`, 'success');
                                this.updateStats();
                            }
                        }
                    });
                    
                    mutation.removedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.getAttribute) {
                            const className = node.getAttribute('class') || '';
                            const id = node.getAttribute('id') || '';
                            
                            if (className.includes('particle') || id.includes('particle')) {
                                this.log(`➖ Particle removed: ${className || id}`, 'info');
                                this.updateStats();
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(svg, {
            childList: true,
            subtree: true
        });
        
        this.log('DOM monitoring active', 'success');
        
        // Stop monitoring after 30 seconds
        setTimeout(() => {
            observer.disconnect();
            this.log('DOM monitoring stopped', 'info');
        }, 30000);
    }
    
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.gatherStats(),
            systems: {
                engineFlow: !!window.EngineFlowConnections,
                callTransfer: !!window.callTransferAnimation,
                realAPI: !!window.realAPIParticles
            },
            svg: {
                found: !!document.querySelector('svg'),
                id: document.querySelector('svg')?.id || 'none',
                viewBox: document.querySelector('svg')?.getAttribute('viewBox') || 'none'
            },
            nodes: Array.from(document.querySelectorAll('[data-id]')).map(n => n.getAttribute('data-id')),
            connections: Array.from(document.querySelectorAll('[data-connection]')).map(c => c.getAttribute('data-connection'))
        };
        
        console.log('📊 Particle Diagnostic Report:', report);
        this.log('Report generated - check console', 'success');
        
        return report;
    }
    
    startMonitoring() {
        // Update stats every second
        setInterval(() => {
            if (this.panel.style.display !== 'none') {
                this.updateStats();
            }
        }, 1000);
    }
}

// Initialize diagnostics
window.particleDiagnostics = new ParticleDiagnostics();

// Auto-show panel if particles are missing
setTimeout(() => {
    const stats = window.particleDiagnostics.gatherStats();
    if (stats.particleGroups === 0 && stats.activeAnimations === 0) {
        console.warn('⚠️ No particles detected - showing diagnostics');
        window.particleDiag.checkParticles();
    }
}, 3000);