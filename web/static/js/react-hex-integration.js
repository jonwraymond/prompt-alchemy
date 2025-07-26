/**
 * React Hex Grid Integration
 * Replaces all legacy hex grid systems with modern React implementation
 */

// Destroy all legacy systems
console.log('🗑️ React Integration: Destroying ALL legacy hex grid systems...');

// Remove all legacy elements
const legacySelectors = [
    '.hex-node:not(.alchemy-hex-node)',
    '.enhanced-hex-node', 
    '.unified-hex-flow',
    '#hex-nodes',
    '#connection-paths',
    '.hex-flow-board:not(#hex-flow-container)'
];

legacySelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        console.log(`🗑️ Removing legacy element: ${selector}`);
        el.remove();
    });
});

// Remove legacy scripts
const legacyScriptSources = [
    'hex-flow-unified.js',
    'enhanced-node-ui.js',
    'hex-tooltips.js',
    'engine-flow-connections-clean.js'
];

legacyScriptSources.forEach(src => {
    const scripts = document.querySelectorAll(`script[src*="${src}"]`);
    scripts.forEach(script => {
        console.log(`🗑️ Removing legacy script: ${src}`);
        script.remove();
    });
});

// Clear any legacy global variables
if (window.UnifiedHexFlow) {
    console.log('🗑️ Clearing UnifiedHexFlow global');
    delete window.UnifiedHexFlow;
}
if (window.unifiedHexFlow) {
    console.log('🗑️ Clearing unifiedHexFlow instance');
    delete window.unifiedHexFlow;
}

console.log('✅ Legacy system destruction complete');
console.log('🚀 React Hex Grid will initialize automatically when DOM is ready');