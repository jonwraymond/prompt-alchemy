// Layout Animation Tester - Comprehensive testing for fixed grid and animations
console.log('🧪 Layout Animation Tester initializing...');

class LayoutAnimationTester {
    constructor() {
        this.testResults = new Map();
        this.init();
    }
    
    init() {
        // Wait for grid debugger to be ready
        setTimeout(() => {
            this.runComprehensiveTests();
        }, 3000);
    }
    
    async runComprehensiveTests() {
        console.log('🚀 Running comprehensive layout and animation tests...');
        
        const tests = [
            { name: 'Hexagon Positioning', test: () => this.testHexagonPositioning() },
            { name: 'Grid Distribution', test: () => this.testGridDistribution() },
            { name: 'Animation Bindings', test: () => this.testAnimationBindings() },
            { name: 'Data-Driven Animations', test: () => this.testDataDrivenAnimations() },
            { name: 'Path ID Consistency', test: () => this.testPathIdConsistency() },
            { name: 'Coordinate System', test: () => this.testCoordinateSystem() }
        ];
        
        for (const testCase of tests) {
            console.log(`🧪 Running test: ${testCase.name}`);
            try {
                const result = await testCase.test();
                this.testResults.set(testCase.name, { passed: true, result });
                console.log(`✅ ${testCase.name}: PASSED`, result);
            } catch (error) {
                this.testResults.set(testCase.name, { passed: false, error: error.message });
                console.error(`❌ ${testCase.name}: FAILED`, error.message);
            }
        }
        
        this.generateTestReport();
    }
    
    testHexagonPositioning() {
        const nodes = document.querySelectorAll('.hex-node');
        const clusteredNodes = [];
        const properlyPositioned = [];
        
        nodes.forEach(node => {
            const nodeId = node.getAttribute('data-id');
            const transform = node.getAttribute('transform');
            const match = transform ? transform.match(/translate\(([^,]+),\s*([^)]+)\)/) : null;
            
            if (match) {
                const x = parseFloat(match[1]);
                const y = parseFloat(match[2]);
                
                // Check if clustered in problematic corner
                if (x < 100 && y < 100) {
                    clusteredNodes.push({ nodeId, x, y });
                } else {
                    properlyPositioned.push({ nodeId, x, y });
                }
            }
        });
        
        if (clusteredNodes.length > 0) {
            throw new Error(`${clusteredNodes.length} nodes still clustered in corner: ${clusteredNodes.map(n => n.nodeId).join(', ')}`);
        }
        
        return {
            totalNodes: nodes.length,
            properlyPositioned: properlyPositioned.length,
            clusteredNodes: clusteredNodes.length
        };
    }
    
    testGridDistribution() {
        const nodes = document.querySelectorAll('.hex-node');
        const positions = [];
        const overlaps = [];
        
        // Collect all positions
        nodes.forEach(node => {
            const nodeId = node.getAttribute('data-id');
            const transform = node.getAttribute('transform');
            const match = transform ? transform.match(/translate\(([^,]+),\s*([^)]+)\)/) : null;
            
            if (match) {
                positions.push({
                    nodeId,
                    x: parseFloat(match[1]),
                    y: parseFloat(match[2])
                });
            }
        });
        
        // Check for overlaps (minimum safe distance = 80px)
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const pos1 = positions[i];
                const pos2 = positions[j];
                const distance = Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
                
                if (distance < 80) {
                    overlaps.push({
                        nodes: [pos1.nodeId, pos2.nodeId],
                        distance: Math.round(distance)
                    });
                }
            }
        }
        
        if (overlaps.length > 0) {
            throw new Error(`${overlaps.length} node overlaps detected: ${overlaps.map(o => `${o.nodes.join('-')}(${o.distance}px)`).join(', ')}`);
        }
        
        // Check distribution across grid
        const bounds = this.calculateBounds(positions);
        const coverage = this.calculateCoverage(bounds);
        
        if (coverage < 0.5) {
            throw new Error(`Poor grid coverage: ${Math.round(coverage * 100)}% of available space used`);
        }
        
        return {
            totalNodes: positions.length,
            overlaps: overlaps.length,
            bounds,
            coverage: Math.round(coverage * 100)
        };
    }
    
    testAnimationBindings() {
        const animateMotions = document.querySelectorAll('animateMotion');
        const validBindings = [];
        const brokenBindings = [];
        
        animateMotions.forEach((animateMotion, index) => {
            const mpath = animateMotion.querySelector('mpath');
            if (mpath) {
                const href = mpath.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
                if (href) {
                    const pathId = href.replace('#', '');
                    const targetPath = document.getElementById(pathId);
                    
                    if (targetPath) {
                        validBindings.push({ index, pathId, hasTarget: true });
                    } else {
                        brokenBindings.push({ index, pathId, hasTarget: false });
                    }
                }
            }
        });
        
        if (brokenBindings.length > 0) {
            throw new Error(`${brokenBindings.length} broken animation bindings: ${brokenBindings.map(b => b.pathId).join(', ')}`);
        }
        
        return {
            totalAnimations: animateMotions.length,
            validBindings: validBindings.length,
            brokenBindings: brokenBindings.length
        };
    }
    
    async testDataDrivenAnimations() {
        if (typeof window.animateDataFlow !== 'function') {
            throw new Error('animateDataFlow function not available');
        }
        
        // Test creating a data-driven animation
        const testAnimations = [
            { from: 'input', to: 'hub', data: { color: '#ff0000', size: 4, duration: '1s' } },
            { from: 'hub', to: 'prima', data: { color: '#00ff00', size: 5, duration: '1.5s' } },
            { from: 'prima', to: 'openai', data: { color: '#0000ff', size: 3, duration: '2s' } }
        ];
        
        const results = [];
        
        for (const testAnim of testAnimations) {
            try {
                // Count particles before
                const particlesBefore = document.querySelectorAll('.data-bound-particle').length;
                
                // Create animation
                window.animateDataFlow(testAnim.from, testAnim.to, testAnim.data);
                
                // Check if particle was created
                await new Promise(resolve => setTimeout(resolve, 100));
                const particlesAfter = document.querySelectorAll('.data-bound-particle').length;
                
                results.push({
                    from: testAnim.from,
                    to: testAnim.to,
                    particleCreated: particlesAfter > particlesBefore
                });
                
            } catch (error) {
                results.push({
                    from: testAnim.from,
                    to: testAnim.to,
                    error: error.message
                });
            }
        }
        
        const failedAnimations = results.filter(r => r.error || !r.particleCreated);
        if (failedAnimations.length > 0) {
            throw new Error(`${failedAnimations.length} data-driven animations failed`);
        }
        
        return {
            testAnimations: testAnimations.length,
            successful: results.filter(r => r.particleCreated).length,
            failed: failedAnimations.length
        };
    }
    
    testPathIdConsistency() {
        const connectionPaths = document.querySelectorAll('[data-connection]');
        const missingIds = [];
        const duplicateIds = new Map();
        
        connectionPaths.forEach(path => {
            const connectionKey = path.getAttribute('data-connection');
            const pathId = path.id;
            
            if (!pathId) {
                missingIds.push(connectionKey);
            } else {
                // Check for duplicates
                const existing = duplicateIds.get(pathId);
                if (existing) {
                    existing.push(connectionKey);
                } else {
                    duplicateIds.set(pathId, [connectionKey]);
                }
            }
        });
        
        const duplicates = Array.from(duplicateIds.entries()).filter(([id, connections]) => connections.length > 1);
        
        if (missingIds.length > 0) {
            throw new Error(`${missingIds.length} paths missing IDs: ${missingIds.join(', ')}`);
        }
        
        if (duplicates.length > 0) {
            throw new Error(`${duplicates.length} duplicate path IDs found`);
        }
        
        return {
            totalPaths: connectionPaths.length,
            missingIds: missingIds.length,
            duplicateIds: duplicates.length
        };
    }
    
    testCoordinateSystem() {
        const svg = document.getElementById('hex-flow-board');
        if (!svg) {
            throw new Error('Main SVG element not found');
        }
        
        const viewBox = svg.getAttribute('viewBox');
        if (!viewBox) {
            throw new Error('SVG viewBox not set');
        }
        
        const [minX, minY, width, height] = viewBox.split(' ').map(Number);
        
        // Check if coordinate system is properly established
        if (width !== 1000 || height !== 700) {
            throw new Error(`Unexpected viewBox dimensions: ${width}x${height}, expected 1000x700`);
        }
        
        // Check for problematic transforms
        const svgTransform = svg.style.transform;
        if (svgTransform && svgTransform !== '' && svgTransform !== 'translateZ(0)') {
            console.warn(`SVG has transform: ${svgTransform}`);
        }
        
        return {
            viewBox: { minX, minY, width, height },
            hasTransform: !!svgTransform,
            coordinateSystemValid: true
        };
    }
    
    calculateBounds(positions) {
        if (positions.length === 0) return null;
        
        const xs = positions.map(p => p.x);
        const ys = positions.map(p => p.y);
        
        return {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys)
        };
    }
    
    calculateCoverage(bounds) {
        if (!bounds) return 0;
        
        // Available space in 1000x700 viewBox (with margins)
        const availableWidth = 800; // 1000 - 100px margins each side
        const availableHeight = 600; // 700 - 50px margins top/bottom
        
        const usedWidth = bounds.width;
        const usedHeight = bounds.height;
        
        const coverageX = Math.min(usedWidth / availableWidth, 1);
        const coverageY = Math.min(usedHeight / availableHeight, 1);
        
        return (coverageX + coverageY) / 2;
    }
    
    generateTestReport() {
        console.log('\n🏁 COMPREHENSIVE TEST REPORT');
        console.log('=====================================');
        
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        
        this.testResults.forEach((result, testName) => {
            totalTests++;
            
            if (result.passed) {
                passedTests++;
                console.log(`✅ ${testName}: PASSED`);
            } else {
                failedTests++;
                console.log(`❌ ${testName}: FAILED - ${result.error}`);
            }
        });
        
        console.log('=====================================');
        console.log(`📊 SUMMARY: ${passedTests}/${totalTests} tests passed`);
        
        if (failedTests === 0) {
            console.log('🎉 ALL TESTS PASSED! Grid layout and animations are working correctly.');
        } else {
            console.log(`⚠️ ${failedTests} tests failed. Check errors above.`);
        }
        
        // Store results globally for inspection
        window.testResults = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                success: failedTests === 0
            },
            details: Array.from(this.testResults.entries())
        };
        
        return window.testResults;
    }
    
    // Manual test trigger
    runTests() {
        console.log('🧪 Running manual test suite...');
        this.testResults.clear();
        this.runComprehensiveTests();
    }
}

// Initialize tester
window.layoutAnimationTester = new LayoutAnimationTester();

// Expose test controls
window.testLayout = {
    run: () => window.layoutAnimationTester.runTests(),
    results: () => window.testResults,
    testPositioning: () => window.layoutAnimationTester.testHexagonPositioning(),
    testAnimations: () => window.layoutAnimationTester.testAnimationBindings(),
    testDataFlow: () => window.layoutAnimationTester.testDataDrivenAnimations()
};

console.log('🎮 Layout Animation Tester Controls:');
console.log('  testLayout.run() - Run full test suite');
console.log('  testLayout.results() - View test results');
console.log('  testLayout.testPositioning() - Test hexagon positioning only');
console.log('  testLayout.testAnimations() - Test animation bindings only');