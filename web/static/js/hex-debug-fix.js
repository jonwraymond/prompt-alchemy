// Hex Grid Debug and Fix Script
console.log('🔧 Hex Grid Debug Script Loaded');

// Function to diagnose visibility issues
function diagnoseHexGridIssues() {
    console.log('\n=== HEX GRID DIAGNOSTIC REPORT ===\n');
    
    // 1. Check for main header
    const mainHeader = document.querySelector('.main-header');
    if (mainHeader) {
        const styles = window.getComputedStyle(mainHeader);
        console.log('✅ Main header found');
        console.log(`   Display: ${styles.display}`);
        console.log(`   Visibility: ${styles.visibility}`);
        console.log(`   Opacity: ${styles.opacity}`);
        console.log(`   Position: ${styles.position}`);
        console.log(`   Z-index: ${styles.zIndex}`);
        
        // Force visibility
        if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') {
            console.log('⚠️  Main header is hidden - attempting to fix...');
            mainHeader.style.display = 'block';
            mainHeader.style.visibility = 'visible';
            mainHeader.style.opacity = '1';
        }
    } else {
        console.error('❌ Main header not found!');
    }
    
    // 2. Check for hex flow container
    const hexContainer = document.getElementById('hex-flow-container');
    if (hexContainer) {
        const styles = window.getComputedStyle(hexContainer);
        console.log('\n✅ Hex flow container found');
        console.log(`   Display: ${styles.display}`);
        console.log(`   Visibility: ${styles.visibility}`);
        console.log(`   Opacity: ${styles.opacity}`);
        console.log(`   Width: ${styles.width}`);
        console.log(`   Height: ${styles.height}`);
        
        // Force visibility
        if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') {
            console.log('⚠️  Hex container is hidden - attempting to fix...');
            hexContainer.style.display = 'block';
            hexContainer.style.visibility = 'visible';
            hexContainer.style.opacity = '1';
        }
    } else {
        console.error('❌ Hex flow container not found!');
    }
    
    // 3. Check for SVG board
    const svgBoard = document.getElementById('hex-flow-board');
    if (svgBoard) {
        const styles = window.getComputedStyle(svgBoard);
        console.log('\n✅ SVG board found');
        console.log(`   Display: ${styles.display}`);
        console.log(`   Width: ${svgBoard.getAttribute('viewBox')}`);
        
        // Check for hex nodes
        const hexNodes = svgBoard.querySelectorAll('.hex-node');
        console.log(`\n📊 Hex nodes found: ${hexNodes.length}`);
        
        if (hexNodes.length === 0) {
            console.error('❌ No hex nodes found - hex grid is empty!');
            console.log('   Attempting to manually create fallback nodes...');
            createFallbackHexNodes();
        }
    } else {
        console.error('❌ SVG board not found!');
    }
    
    // 4. Check for CSS files
    console.log('\n📁 Checking CSS files:');
    const styleSheets = Array.from(document.styleSheets);
    const cssFiles = ['alchemy.css', 'modern-alchemy.css', 'hex-flow-board.css', 'hex-flow-board-unified.css'];
    
    cssFiles.forEach(fileName => {
        const found = styleSheets.some(sheet => sheet.href && sheet.href.includes(fileName));
        if (found) {
            console.log(`   ✅ ${fileName} loaded`);
        } else {
            console.error(`   ❌ ${fileName} NOT loaded!`);
        }
    });
    
    // 5. Check for JavaScript initialization
    console.log('\n🔌 Checking JavaScript initialization:');
    console.log(`   window.unifiedHexFlow: ${!!window.unifiedHexFlow}`);
    console.log(`   window.hexFlowBoard: ${!!window.hexFlowBoard}`);
    
    console.log('\n=== END DIAGNOSTIC REPORT ===\n');
}

// Function to create fallback hex nodes if none exist
function createFallbackHexNodes() {
    const svgBoard = document.getElementById('hex-flow-board');
    const nodesGroup = document.getElementById('hex-nodes');
    
    if (!svgBoard || !nodesGroup) {
        console.error('Cannot create fallback nodes - SVG structure missing');
        return;
    }
    
    // Clear existing content
    nodesGroup.innerHTML = '';
    
    // Create basic hex nodes
    const nodes = [
        { id: 'hub', x: 500, y: 350, color: '#ff6b35', title: 'Core' },
        { id: 'prima', x: 500, y: 200, color: '#ff6b6b', title: 'Prima' },
        { id: 'solutio', x: 650, y: 350, color: '#4ecdc4', title: 'Solutio' },
        { id: 'coagulatio', x: 350, y: 350, color: '#45b7d1', title: 'Coagulatio' }
    ];
    
    nodes.forEach(node => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'hex-node');
        g.setAttribute('data-id', node.id);
        g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        
        // Create hexagon
        const hex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = 35 * Math.cos(angle);
            const y = 35 * Math.sin(angle);
            points.push(`${x},${y}`);
        }
        hex.setAttribute('points', points.join(' '));
        hex.setAttribute('fill', `${node.color}20`);
        hex.setAttribute('stroke', node.color);
        hex.setAttribute('stroke-width', '2');
        
        // Create text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dy', '0.35em');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '12');
        text.textContent = node.title;
        
        g.appendChild(hex);
        g.appendChild(text);
        nodesGroup.appendChild(g);
    });
    
    console.log('✅ Created fallback hex nodes');
}

// Function to force display all elements
function forceDisplayAll() {
    console.log('\n🔨 Forcing all elements to display...');
    
    // Force header visibility
    const header = document.querySelector('.main-header');
    if (header) {
        header.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
        console.log('✅ Forced header display');
    }
    
    // Force AI header visibility
    const aiHeader = document.getElementById('ai-header');
    if (aiHeader) {
        aiHeader.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
        console.log('✅ Forced AI header display');
    }
    
    // Force hex container visibility
    const hexContainer = document.getElementById('hex-flow-container');
    if (hexContainer) {
        hexContainer.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; width: 100% !important; height: 600px !important;';
        console.log('✅ Forced hex container display');
    }
    
    // Force SVG visibility
    const svg = document.getElementById('hex-flow-board');
    if (svg) {
        svg.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
        console.log('✅ Forced SVG display');
    }
    
    // Remove any problematic CSS rules
    removeProblemmaticCSS();
}

// Function to remove problematic CSS rules
function removeProblemmaticCSS() {
    console.log('\n🧹 Removing problematic CSS rules...');
    
    try {
        // Find and modify stylesheets
        Array.from(document.styleSheets).forEach(sheet => {
            try {
                if (sheet.href && sheet.href.includes('hex-flow-board.css')) {
                    // Look for the problematic rule that hides text content
                    Array.from(sheet.cssRules).forEach((rule, index) => {
                        if (rule.selectorText && rule.selectorText.includes('.hex-flow-container > text')) {
                            console.log(`   Found problematic rule: ${rule.selectorText}`);
                            sheet.deleteRule(index);
                            console.log('   ✅ Removed rule');
                        }
                    });
                }
            } catch (e) {
                // Cross-origin stylesheets might throw errors
            }
        });
    } catch (e) {
        console.error('Error modifying stylesheets:', e);
    }
}

// Function to reinitialize hex flow
function reinitializeHexFlow() {
    console.log('\n🔄 Reinitializing hex flow...');
    
    // Clear existing instances
    if (window.hexFlowBoard) {
        window.hexFlowBoard = null;
    }
    if (window.unifiedHexFlow) {
        window.unifiedHexFlow = null;
    }
    
    // Create new instance
    try {
        window.unifiedHexFlow = new UnifiedHexFlow();
        console.log('✅ Hex flow reinitialized');
    } catch (e) {
        console.error('❌ Failed to reinitialize:', e);
    }
}

// Auto-run diagnostic on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            diagnoseHexGridIssues();
            forceDisplayAll();
        }, 1000); // Give time for other scripts to load
    });
} else {
    setTimeout(() => {
        diagnoseHexGridIssues();
        forceDisplayAll();
    }, 100);
}

// Export functions for manual use
window.hexDebug = {
    diagnose: diagnoseHexGridIssues,
    forceDisplay: forceDisplayAll,
    reinitialize: reinitializeHexFlow,
    createFallback: createFallbackHexNodes
};

console.log('\n📌 Debug functions available:');
console.log('   hexDebug.diagnose() - Run diagnostic');
console.log('   hexDebug.forceDisplay() - Force all elements visible');
console.log('   hexDebug.reinitialize() - Reinitialize hex flow');
console.log('   hexDebug.createFallback() - Create fallback nodes\n'); 