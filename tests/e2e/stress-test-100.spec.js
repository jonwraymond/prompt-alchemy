// Focused 100 iteration stress test
const { test, expect } = require('@playwright/test');

test('100 rapid hex grid updates without overlaps', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#hex-flow-board', { state: 'visible' });
  
  const results = [];
  const startTime = Date.now();
  
  console.log('Starting 100 iteration stress test...');
  
  for (let i = 0; i < 100; i++) {
    const iterationStart = Date.now();
    
    // Trigger some action that might cause overlaps
    await page.evaluate((iteration) => {
      // Simulate rapid DOM updates
      const event = new CustomEvent('board-refresh', { detail: { iteration } });
      document.body.dispatchEvent(event);
    }, i);
    
    // Quick wait for any animations
    await page.waitForTimeout(50);
    
    // Check for overlaps
    const overlaps = await page.evaluate(() => {
      const allHexagons = document.querySelectorAll('polygon');
      const overlaps = [];
      
      for (let i = 0; i < allHexagons.length; i++) {
        for (let j = i + 1; j < allHexagons.length; j++) {
          const rect1 = allHexagons[i].getBoundingClientRect();
          const rect2 = allHexagons[j].getBoundingClientRect();
          
          if (!(rect1.right < rect2.left || 
                rect2.right < rect1.left || 
                rect1.bottom < rect2.top || 
                rect2.bottom < rect1.top)) {
            const overlapWidth = Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left);
            const overlapHeight = Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top);
            const minArea = Math.min(rect1.width * rect1.height, rect2.width * rect2.height);
            const overlapArea = overlapWidth * overlapHeight;
            
            if (overlapArea > minArea * 0.2) {
              overlaps.push({
                iteration: i,
                element1: i,
                element2: j,
                overlapPercent: (overlapArea / minArea) * 100
              });
            }
          }
        }
      }
      return overlaps;
    });
    
    // Check node count remains consistent
    const nodeCount = await page.locator('.hex-node').count();
    
    results.push({
      iteration: i + 1,
      duration: Date.now() - iterationStart,
      overlaps: overlaps.length,
      nodeCount,
      hasErrors: overlaps.length > 0 || nodeCount !== 15
    });
    
    if ((i + 1) % 10 === 0) {
      console.log(`Completed ${i + 1} iterations...`);
    }
  }
  
  const totalTime = Date.now() - startTime;
  const failedIterations = results.filter(r => r.hasErrors);
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log('=== STRESS TEST RESULTS ===');
  console.log(`Total time: ${totalTime}ms`);
  console.log(`Average iteration: ${avgDuration.toFixed(2)}ms`);
  console.log(`Failed iterations: ${failedIterations.length}/100`);
  console.log(`Success rate: ${((100 - failedIterations.length) / 100 * 100).toFixed(1)}%`);
  
  if (failedIterations.length > 0) {
    console.log('\nFailed iterations:');
    failedIterations.slice(0, 5).forEach(f => {
      console.log(`  Iteration ${f.iteration}: ${f.overlaps} overlaps, ${f.nodeCount} nodes`);
    });
  }
  
  // Test passes if 95% or more iterations succeed
  expect(failedIterations.length).toBeLessThanOrEqual(5);
});

test('rapid animation triggers without visual artifacts', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#hex-flow-board', { state: 'visible' });
  
  // Rapid-fire animation triggers
  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => {
      // Trigger animation on random nodes
      const nodes = document.querySelectorAll('.hex-node');
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      if (randomNode) {
        randomNode.classList.add('stage-active');
        setTimeout(() => {
          randomNode.classList.remove('stage-active');
          randomNode.classList.add('stage-complete');
        }, 100);
      }
    });
    
    await page.waitForTimeout(50);
  }
  
  // Final check for visual consistency
  const finalNodeCount = await page.locator('.hex-node').count();
  expect(finalNodeCount).toBe(15);
  
  // Check no duplicate nodes created
  const nodeIds = await page.evaluate(() => {
    const nodes = document.querySelectorAll('.hex-node');
    const ids = Array.from(nodes).map(n => n.getAttribute('data-id'));
    return { total: ids.length, unique: new Set(ids).size };
  });
  
  expect(nodeIds.total).toBe(nodeIds.unique);
});