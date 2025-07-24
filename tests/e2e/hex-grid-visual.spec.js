// Comprehensive visual regression tests for hexagonal grid
const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

// Helper to wait for animations to complete
async function waitForAnimations(page, timeout = 1000) {
  await page.evaluate(() => {
    return new Promise((resolve) => {
      if (typeof window.requestAnimationFrame === 'undefined') {
        setTimeout(resolve, 100);
        return;
      }
      let lastTime = performance.now();
      let frameCount = 0;
      const checkFrame = (currentTime) => {
        if (currentTime - lastTime > 16.7) { // More than one frame
          frameCount = 0;
        } else {
          frameCount++;
        }
        lastTime = currentTime;
        if (frameCount > 10) { // 10 consecutive frames without changes
          resolve();
        } else {
          requestAnimationFrame(checkFrame);
        }
      };
      requestAnimationFrame(checkFrame);
    });
  });
  // Additional safety timeout
  await page.waitForTimeout(timeout);
}

// Helper to get hex node positions
async function getHexNodePositions(page) {
  return await page.evaluate(() => {
    const nodes = document.querySelectorAll('.hex-node');
    const positions = {};
    nodes.forEach(node => {
      const id = node.getAttribute('data-id');
      const transform = node.getAttribute('transform');
      const match = transform?.match(/translate\(([^,]+),\s*([^)]+)\)/);
      if (match) {
        positions[id] = {
          x: parseFloat(match[1]),
          y: parseFloat(match[2]),
          bbox: node.getBBox()
        };
      }
    });
    return positions;
  });
}

// Helper to check for overlapping elements
async function checkForOverlaps(page) {
  return await page.evaluate(() => {
    const allHexagons = document.querySelectorAll('polygon');
    const overlaps = [];
    
    for (let i = 0; i < allHexagons.length; i++) {
      for (let j = i + 1; j < allHexagons.length; j++) {
        const rect1 = allHexagons[i].getBoundingClientRect();
        const rect2 = allHexagons[j].getBoundingClientRect();
        
        // Check if rectangles overlap
        if (!(rect1.right < rect2.left || 
              rect2.right < rect1.left || 
              rect1.bottom < rect2.top || 
              rect2.bottom < rect1.top)) {
          // Additional check for significant overlap (not just touching)
          const overlapWidth = Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left);
          const overlapHeight = Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top);
          
          // Only report significant overlaps (more than 20% overlap)
          const minArea = Math.min(rect1.width * rect1.height, rect2.width * rect2.height);
          const overlapArea = overlapWidth * overlapHeight;
          if (overlapArea > minArea * 0.2) {
            overlaps.push({
              element1: i,
              element2: j,
              overlap: { width: overlapWidth, height: overlapHeight }
            });
          }
        }
      }
    }
    return overlaps;
  });
}

test.describe('Hexagonal Grid Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#hex-flow-board', { state: 'visible' });
    await waitForAnimations(page);
  });

  test('should have no overlapping hexagonal elements', async ({ page }) => {
    const overlaps = await checkForOverlaps(page);
    expect(overlaps).toHaveLength(0);
  });

  test('should render correct number of hex nodes', async ({ page }) => {
    const nodeCount = await page.locator('.hex-node').count();
    expect(nodeCount).toBe(15); // Server provides 15 nodes in the layout
  });

  test('should position nodes correctly', async ({ page }) => {
    const positions = await getHexNodePositions(page);
    
    // Verify expected nodes exist
    const expectedNodes = [
      'input-gateway',
      'parse-structure', 
      'extract-concepts',
      'prima-materia',
      'solutio',
      'coagulatio',
      'output-gateway'
    ];
    
    for (const nodeId of expectedNodes) {
      expect(positions[nodeId]).toBeDefined();
    }
    
    // Verify positioning logic
    expect(positions['input-gateway'].x).toBeLessThan(positions['prima-materia'].x);
    expect(positions['prima-materia'].x).toBeLessThan(positions['solutio'].x);
    expect(positions['solutio'].x).toBeLessThan(positions['coagulatio'].x);
  });

  test('should show tooltips on hover', async ({ page }) => {
    // Hover over prima-materia node
    await page.hover('[data-id="prima-materia"]');
    await page.waitForTimeout(500);
    
    const tooltip = await page.locator('.hex-tooltip-enhanced.visible');
    await expect(tooltip).toBeVisible();
    
    // Verify tooltip content
    const tooltipText = await tooltip.textContent();
    expect(tooltipText).toContain('Prima Materia');
    expect(tooltipText).toContain('First alchemical phase');
  });

  test('should animate on process start', async ({ page }) => {
    // Type in the input field
    await page.fill('#input', 'Test prompt generation');
    
    // Get initial state
    const initialActiveNodes = await page.locator('.stage-active').count();
    expect(initialActiveNodes).toBe(0);
    
    // Click generate button
    await page.click('button:has-text("Generate")');
    await page.waitForTimeout(500);
    
    // Check that animation has started
    const activeNodes = await page.locator('.stage-active').count();
    expect(activeNodes).toBeGreaterThan(0);
  });

  test('should have proper connection paths', async ({ page }) => {
    const paths = await page.locator('.flow-path').all();
    expect(paths.length).toBeGreaterThan(0);
    
    // Verify paths connect nodes
    for (const path of paths) {
      const pathData = await path.getAttribute('d');
      expect(pathData).toMatch(/^M\s*[\d.]+\s*[\d.]+/); // Starts with move command
      expect(pathData).toContain('Q'); // Contains quadratic curve
    }
  });

  test('should handle window resize gracefully', async ({ page }) => {
    // Set different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await waitForAnimations(page);
      
      // Check SVG viewBox adjusts properly
      const svg = await page.locator('#hex-flow-board');
      const viewBox = await svg.getAttribute('viewBox');
      expect(viewBox).toBeTruthy();
      
      // Ensure no overlaps after resize
      const overlaps = await checkForOverlaps(page);
      expect(overlaps).toHaveLength(0);
    }
  });

  test('visual regression - hex grid layout', async ({ page }, testInfo) => {
    // Take screenshot of the hex grid
    const screenshot = await page.locator('#hex-flow-container').screenshot({
      animations: 'disabled',
      mask: [page.locator('.flow-status-bar')] // Mask dynamic elements
    });
    
    // Compare with baseline
    expect(screenshot).toMatchSnapshot('hex-grid-layout.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
  });

  test('should have correct z-index layering', async ({ page }) => {
    const zIndices = await page.evaluate(() => {
      const elements = {
        paths: document.querySelector('#connection-paths'),
        nodes: document.querySelector('#hex-nodes'),
        particles: document.querySelector('#flow-particles')
      };
      
      const getZIndex = (el) => {
        const computed = window.getComputedStyle(el);
        return computed.zIndex === 'auto' ? 0 : parseInt(computed.zIndex);
      };
      
      return {
        paths: elements.paths ? getZIndex(elements.paths) : -1,
        nodes: elements.nodes ? getZIndex(elements.nodes) : -1,
        particles: elements.particles ? getZIndex(elements.particles) : -1
      };
    });
    
    // Paths should be behind nodes
    expect(zIndices.nodes).toBeGreaterThanOrEqual(zIndices.paths);
    // Particles should be on top
    expect(zIndices.particles).toBeGreaterThanOrEqual(zIndices.nodes);
  });
});

// Animation timing tests
test.describe('Animation Timing Tests', () => {
  test('should complete full process flow in reasonable time', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#hex-flow-board');
    
    // Start process
    await page.fill('#input', 'Test animation timing');
    await page.click('button:has-text("Generate")');
    
    // Wait for all stages to complete
    const startTime = Date.now();
    await page.waitForFunction(() => {
      const completeNodes = document.querySelectorAll('.stage-complete');
      return completeNodes.length === 7; // All nodes complete
    }, { timeout: 30000 });
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(20000); // Should complete within 20 seconds
  });

  test('should show particles flowing between nodes', async ({ page }) => {
    await page.goto('/');
    await page.fill('#input', 'Test particles');
    await page.click('button:has-text("Generate")');
    
    // Wait for particles to appear
    await page.waitForSelector('.flow-particle', { timeout: 5000 });
    
    // Check particle animation
    const particleCount = await page.locator('.flow-particle').count();
    expect(particleCount).toBeGreaterThan(0);
  });
});

// 100 iteration stress test
test.describe('Stress Testing - 100 Iterations', () => {
  test('should handle 100 rapid generations without errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#hex-flow-board');
    
    const results = [];
    
    for (let i = 0; i < 100; i++) {
      const iterationStart = Date.now();
      
      // Clear and fill input
      await page.fill('#input', `Stress test iteration ${i + 1}`);
      
      // Click generate
      await page.click('button:has-text("Generate")');
      
      // Quick check for errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Wait a bit for animation to start
      await page.waitForTimeout(100);
      
      // Check for overlaps
      const overlaps = await checkForOverlaps(page);
      
      results.push({
        iteration: i + 1,
        duration: Date.now() - iterationStart,
        errors: consoleErrors.length,
        overlaps: overlaps.length
      });
      
      // Reset for next iteration
      if (i < 99) {
        await page.waitForTimeout(200);
      }
    }
    
    // Analyze results
    const failedIterations = results.filter(r => r.errors > 0 || r.overlaps > 0);
    console.log(`Stress test complete: ${failedIterations.length} failed out of 100`);
    
    // Write detailed results
    await fs.writeFile(
      path.join(__dirname, '../../test-results/stress-test-results.json'),
      JSON.stringify(results, null, 2)
    );
    
    expect(failedIterations.length).toBe(0);
  });
});