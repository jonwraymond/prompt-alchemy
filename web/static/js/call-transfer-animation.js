// Call Transfer Animation System
// Creates pulsating dots that move along connection paths to represent calls being transferred

class CallTransferAnimation {
    constructor() {
        this.svg = null;
        this.activeTransfers = new Map();
        this.init();
    }
    
    init() {
        // Wait for SVG to be available
        const checkSVG = setInterval(() => {
            this.svg = document.getElementById('hex-flow-board') || document.querySelector('svg');
            if (this.svg) {
                clearInterval(checkSVG);
                console.log('✅ Call Transfer Animation System initialized');
                this.createDefs();
            }
        }, 100);
    }
    
    // Create SVG definitions for reusable elements
    createDefs() {
        let defs = this.svg.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            this.svg.insertBefore(defs, this.svg.firstChild);
        }
        
        // Create gradient for the pulsating dot
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        gradient.setAttribute('id', 'call-transfer-gradient');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#ffffff');
        stop1.setAttribute('stop-opacity', '1');
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '40%');
        stop2.setAttribute('stop-color', '#00ff88');
        stop2.setAttribute('stop-opacity', '0.8');
        
        const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop3.setAttribute('offset', '100%');
        stop3.setAttribute('stop-color', '#00ff88');
        stop3.setAttribute('stop-opacity', '0');
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        gradient.appendChild(stop3);
        defs.appendChild(gradient);
        
        // Create filter for glow effect
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', 'call-transfer-glow');
        filter.setAttribute('x', '-50%');
        filter.setAttribute('y', '-50%');
        filter.setAttribute('width', '200%');
        filter.setAttribute('height', '200%');
        
        const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
        feGaussianBlur.setAttribute('stdDeviation', '3');
        feGaussianBlur.setAttribute('result', 'coloredBlur');
        
        const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
        const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        feMergeNode1.setAttribute('in', 'coloredBlur');
        const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        feMergeNode2.setAttribute('in', 'SourceGraphic');
        
        feMerge.appendChild(feMergeNode1);
        feMerge.appendChild(feMergeNode2);
        filter.appendChild(feGaussianBlur);
        filter.appendChild(feMerge);
        defs.appendChild(filter);
    }
    
    // Create a call transfer animation between two nodes
    createCallTransfer(fromNodeId, toNodeId, options = {}) {
        const {
            duration = 2000,
            color = '#00ff88',
            size = 8,
            pulseScale = 1.5,
            onComplete = null
        } = options;
        
        const timestamp = new Date().toISOString();
        console.log(`🔄 [${timestamp}] Creating call transfer: ${fromNodeId} → ${toNodeId}`);
        console.log(`   - Duration: ${duration}ms`);
        console.log(`   - Color: ${color}`);
        console.log(`   - Size: ${size}`);
        console.log(`   - Active transfers before: ${this.activeTransfers.size}`);
        
        // Find the connection path
        const connectionPath = this.findConnectionPath(fromNodeId, toNodeId);
        if (!connectionPath) {
            console.error(`❌ No connection found between ${fromNodeId} and ${toNodeId}`);
            return null;
        }
        
        // Create transfer ID
        const transferId = `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create the main container for the transfer animation
        const transferGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        transferGroup.setAttribute('id', transferId);
        transferGroup.setAttribute('class', 'call-transfer-animation');
        
        // Create the pulsating dot
        const dot = this.createPulsatingDot(size, color, pulseScale);
        transferGroup.appendChild(dot);
        
        // Create trail effect
        const trail = this.createTrailEffect(size);
        transferGroup.appendChild(trail);
        
        // Add to SVG
        this.svg.appendChild(transferGroup);
        
        // Animate along the path
        this.animateAlongPath(transferGroup, connectionPath, duration, () => {
            // Cleanup
            transferGroup.remove();
            this.activeTransfers.delete(transferId);
            
            // Trigger completion callback
            if (onComplete) {
                onComplete();
            }
        });
        
        // Store active transfer
        this.activeTransfers.set(transferId, {
            from: fromNodeId,
            to: toNodeId,
            element: transferGroup,
            startTime: Date.now()
        });
        
        return transferId;
    }
    
    // Create the pulsating dot element
    createPulsatingDot(size, color, pulseScale) {
        const dotGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        dotGroup.setAttribute('class', 'call-transfer-dot');
        
        // Outer glow circle
        const glowCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        glowCircle.setAttribute('r', size * 2);
        glowCircle.setAttribute('fill', 'url(#call-transfer-gradient)');
        glowCircle.setAttribute('filter', 'url(#call-transfer-glow)');
        
        // Main dot
        const mainDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        mainDot.setAttribute('r', size);
        mainDot.setAttribute('fill', color);
        mainDot.setAttribute('filter', 'url(#call-transfer-glow)');
        
        // Inner bright core
        const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        core.setAttribute('r', size * 0.4);
        core.setAttribute('fill', '#ffffff');
        
        // Add pulsating animation
        const pulseAnimation = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        pulseAnimation.setAttribute('attributeName', 'transform');
        pulseAnimation.setAttribute('type', 'scale');
        pulseAnimation.setAttribute('values', `1;${pulseScale};1`);
        pulseAnimation.setAttribute('dur', '0.8s');
        pulseAnimation.setAttribute('repeatCount', 'indefinite');
        
        // Add opacity animation for glow
        const opacityAnimation = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        opacityAnimation.setAttribute('attributeName', 'opacity');
        opacityAnimation.setAttribute('values', '0.6;1;0.6');
        opacityAnimation.setAttribute('dur', '0.8s');
        opacityAnimation.setAttribute('repeatCount', 'indefinite');
        
        glowCircle.appendChild(opacityAnimation);
        dotGroup.appendChild(glowCircle);
        dotGroup.appendChild(mainDot);
        dotGroup.appendChild(core);
        dotGroup.appendChild(pulseAnimation);
        
        return dotGroup;
    }
    
    // Create trail effect for the moving dot
    createTrailEffect(size) {
        const trail = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        trail.setAttribute('class', 'call-transfer-trail');
        
        // Create multiple trail dots that fade out
        for (let i = 0; i < 5; i++) {
            const trailDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            trailDot.setAttribute('r', size * (1 - i * 0.15));
            trailDot.setAttribute('fill', '#00ff88');
            trailDot.setAttribute('opacity', 0.5 - i * 0.1);
            trailDot.style.transform = `translateX(${-i * size * 1.5}px)`;
            trail.appendChild(trailDot);
        }
        
        return trail;
    }
    
    // Find the SVG path between two nodes
    findConnectionPath(fromNodeId, toNodeId) {
        // Look for existing connection paths
        const paths = this.svg.querySelectorAll('path.connection-line');
        
        for (const path of paths) {
            const connData = path.getAttribute('data-connection');
            if (connData && 
                (connData.includes(fromNodeId) && connData.includes(toNodeId))) {
                return path;
            }
        }
        
        // If no existing path, try to find nodes and create a temporary path
        const fromNode = document.querySelector(`[data-id="${fromNodeId}"]`);
        const toNode = document.querySelector(`[data-id="${toNodeId}"]`);
        
        if (fromNode && toNode) {
            return this.createTemporaryPath(fromNode, toNode);
        }
        
        return null;
    }
    
    // Create a temporary path between nodes if one doesn't exist
    createTemporaryPath(fromNode, toNode) {
        const fromTransform = fromNode.getAttribute('transform');
        const toTransform = toNode.getAttribute('transform');
        
        const fromMatch = fromTransform?.match(/translate\(([^,]+),\s*([^)]+)\)/);
        const toMatch = toTransform?.match(/translate\(([^,]+),\s*([^)]+)\)/);
        
        if (!fromMatch || !toMatch) return null;
        
        const x1 = parseFloat(fromMatch[1]);
        const y1 = parseFloat(fromMatch[2]);
        const x2 = parseFloat(toMatch[1]);
        const y2 = parseFloat(toMatch[2]);
        
        // Create curved path
        const dx = x2 - x1;
        const dy = y2 - y1;
        const cx = x1 + dx * 0.5 + dy * 0.1;
        const cy = y1 + dy * 0.5 - dx * 0.1;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'none');
        path.setAttribute('id', `temp-path-${Date.now()}`);
        
        this.svg.appendChild(path);
        
        return path;
    }
    
    // Animate the transfer group along the path
    animateAlongPath(element, path, duration, onComplete) {
        const pathLength = path.getTotalLength();
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeProgress = this.easeInOutCubic(progress);
            
            // Get point on path
            const point = path.getPointAtLength(easeProgress * pathLength);
            
            // Move the element
            element.setAttribute('transform', `translate(${point.x}, ${point.y})`);
            
            // Calculate rotation for trail direction
            if (progress < 0.99) {
                const nextPoint = path.getPointAtLength(Math.min((easeProgress + 0.01) * pathLength, pathLength));
                const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI;
                
                const trail = element.querySelector('.call-transfer-trail');
                if (trail) {
                    trail.setAttribute('transform', `rotate(${angle + 180})`);
                }
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Clean up temporary path if created
                if (path.id && path.id.startsWith('temp-path-')) {
                    path.remove();
                }
                if (onComplete) {
                    onComplete();
                }
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    // Easing function for smooth animation
    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // Cancel an active transfer
    cancelTransfer(transferId) {
        const transfer = this.activeTransfers.get(transferId);
        if (transfer) {
            transfer.element.remove();
            this.activeTransfers.delete(transferId);
            console.log(`❌ Cancelled transfer: ${transferId}`);
        }
    }
    
    // Get all active transfers
    getActiveTransfers() {
        return Array.from(this.activeTransfers.values());
    }
}

// Initialize the call transfer animation system
window.callTransferAnimation = new CallTransferAnimation();

// Expose easy-to-use API
window.animateCallTransfer = function(from, to, options) {
    return window.callTransferAnimation.createCallTransfer(from, to, options);
};

console.log('📞 Call Transfer Animation System loaded');
console.log('Usage: animateCallTransfer("input", "hub", { duration: 3000, color: "#00ff88" })');