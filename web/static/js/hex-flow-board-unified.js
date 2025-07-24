class UnifiedHexFlowBoard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.svg = this.container.querySelector('#hex-flow-board');
        this.nodesGroup = this.svg.querySelector('#hex-nodes');
        this.pathsGroup = this.svg.querySelector('#connection-paths');
        this.nodes = new Map();
        this.flowAnimations = new Set();
        this.isActive = false;

        this.clearDuplicateSystems();
        this.createOriginalGridSystem();
    }

    clearDuplicateSystems() {
        this.nodesGroup.innerHTML = '';
        this.pathsGroup.innerHTML = '';
        const existingGrids = this.container.querySelectorAll('.duplicate-grid, .secondary-grid');
        existingGrids.forEach(grid => grid.remove());
    }

    createOriginalGridSystem() {
        // Implementation for creating the grid
    }

    activateGridSystem() {
        this.container.classList.add('on-stage');
        this.startProcessSequence();
    }

    startProcessSequence() {
        // Implementation for animation sequence
    }

    animateConnectedPaths(startNode, endNode) {
        // Implementation for animating paths
    }

    createFlowParticle(path) {
        // Implementation for creating flow particles
    }

    completeSequence() {
        this.container.classList.remove('on-stage');
        this.isActive = false;
        this.flowAnimations.forEach(anim => clearTimeout(anim));
        this.flowAnimations.clear();
    }

    validateElements() {
        return this.container && this.svg && this.nodesGroup && this.pathsGroup;
    }
}

window.unifiedHexFlow = new UnifiedHexFlowBoard('hex-flow-container');
