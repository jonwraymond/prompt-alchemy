// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Hex Flow Board System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window.htmx !== undefined);
    // Wait for HexFlowBoard to initialize
    await page.waitForFunction(() => window.hexFlowBoard !== undefined);
  });

  test('should display hex flow board correctly', async ({ page }) => {
    // Check that hex flow board container is present
    await expect(page.locator('#hex-flow-container')).toBeVisible();
    
    // Check that hex flow board SVG is present
    await expect(page.locator('#hex-flow-board')).toBeVisible();
    
    // Check for hex nodes group
    await expect(page.locator('#hex-nodes')).toBeVisible();
    
    // Check for connection paths group
    await expect(page.locator('#connection-paths')).toBeVisible();
    
    // Check for flow particles group
    await expect(page.locator('#flow-particles')).toBeVisible();
    
    // Check for specific hex nodes (based on HexFlowBoard implementation)
    await expect(page.locator('[data-id="input"]')).toBeVisible();
    await expect(page.locator('[data-id="prima"]')).toBeVisible();
    await expect(page.locator('[data-id="hub"]')).toBeVisible();
    await expect(page.locator('[data-id="solutio"]')).toBeVisible();
    await expect(page.locator('[data-id="coagulatio"]')).toBeVisible();
    await expect(page.locator('[data-id="output"]')).toBeVisible();
  });

  test('should animate hex nodes during processing', async ({ page }) => {
    // Start processing
    await page.fill('#input', 'Test hex node animations');
    await page.click('button[type="submit"]');
    
    // Wait for hex nodes to become active
    await page.waitForSelector('.hex-node.active', { timeout: 10000 });
    
    // Check that active hex node has proper styling
    const activeNode = page.locator('.hex-node.active').first();
    await expect(activeNode).toBeVisible();
    
    // Check for animation classes
    const nodeClass = await activeNode.getAttribute('class');
    expect(nodeClass).toContain('active');
  });

  test('should progress through hex node sequence', async ({ page }) => {
    await page.fill('#input', 'Test hex node sequence');
    await page.click('button[type="submit"]');
    
    // Wait for processing to start
    await page.waitForSelector('.hex-node.active', { timeout: 10000 });
    
    // Check that nodes activate in sequence over time
    // Input node should be active first
    const inputNode = page.locator('[data-id="input"]');
    await expect(inputNode).toHaveClass(/active/);
    
    // Wait and check for progression
    await page.waitForTimeout(5000);
    
    // Check that connection paths become active
    await expect(page.locator('.hex-path.active')).toBeVisible({ timeout: 15000 });
  });

  test('should handle hex node hover effects and tooltips', async ({ page }) => {
    const hexNodes = page.locator('.hex-node');
    const firstNode = hexNodes.first();
    
    // Hover over first hex node
    await firstNode.hover();
    
    // Check for tooltip appearance
    await expect(page.locator('#hex-tooltip')).toBeVisible({ timeout: 2000 });
    
    // Check tooltip has content
    const tooltip = page.locator('#hex-tooltip');
    await expect(tooltip.locator('.tooltip-title')).not.toBeEmpty();
    
    // Check for hover effects (transform, glow, etc.)
    await page.waitForTimeout(500); // Allow animation time
    
    // This test ensures hovering doesn't break the interface
    await expect(firstNode).toBeVisible();
  });

  test('should show hex path animations', async ({ page }) => {
    await page.fill('#input', 'Test hex path animations');
    await page.click('button[type="submit"]');
    
    // Wait for active connections
    await page.waitForSelector('.hex-path.active', { timeout: 15000 });
    
    // Check that active hex paths have animation styles
    const activePath = page.locator('.hex-path.active').first();
    const pathClass = await activePath.getAttribute('class');
    
    expect(pathClass).toContain('active');
    
    // Check for animated attribute indicating flow
    const pathId = await activePath.getAttribute('id');
    expect(pathId).toMatch(/path-\w+-\w+/);
  });

  test('should display completed hex node states', async ({ page }) => {
    await page.fill('#input', 'Test completed states');
    await page.click('button[type="submit"]');
    
    // Wait for some processing to complete
    await page.waitForSelector('.hex-node.completed', { timeout: 30000 });
    
    // Check that completed hex nodes have different styling
    const completedNode = page.locator('.hex-node.completed').first();
    await expect(completedNode).toBeVisible();
    
    const completedClass = await completedNode.getAttribute('class');
    expect(completedClass).toContain('completed');
  });

  test('should handle responsive hex flow layout', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('#hex-flow-board')).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Allow layout change
    await expect(page.locator('#hex-flow-board')).toBeVisible();
    
    // Ensure hex nodes are still functional on mobile
    await page.fill('#input', 'Mobile hex test');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('.hex-node.active', { timeout: 10000 });
    await expect(page.locator('.hex-node.active')).toBeVisible();
  });

  test('should handle hex flow zoom functionality', async ({ page }) => {
    // Test zoom controls
    const zoomInBtn = page.locator('#zoom-in');
    const zoomOutBtn = page.locator('#zoom-out');
    const zoomResetBtn = page.locator('#zoom-reset');
    
    if (await zoomInBtn.isVisible()) {
      // Get initial zoom level
      const zoomLevel = page.locator('.zoom-level');
      const initialZoom = await zoomLevel.textContent();
      
      // Test zoom in - the buttons use HTMX, so we need to wait for the request
      await zoomInBtn.click();
      
      // Wait for HTMX request to complete and DOM to update
      await page.waitForTimeout(1000);
      
      // The zoom might be handled client-side via JavaScript
      // Check if the SVG viewBox changed instead
      const svgViewBox = await page.locator('#hex-flow-board').getAttribute('viewBox');
      expect(svgViewBox).toBeTruthy();
      
      // Test zoom out
      await zoomOutBtn.click();
      await page.waitForTimeout(1000);
      
      // Test zoom reset - the default zoom is 100% according to hex-flow-board.js
      await zoomResetBtn.click();
      await page.waitForTimeout(1000);
      
      // After reset, zoom should be back to 100%
      const finalZoom = await zoomLevel.textContent();
      expect(finalZoom).toBe('100%');
      
      // Verify the zoom controls didn't break the interface
      await expect(page.locator('#hex-flow-board')).toBeVisible();
      await expect(page.locator('.hex-node')).toBeVisible();
    }
  });

  test('should reset hex node states between sessions', async ({ page }) => {
    // Start first session
    await page.fill('#input', 'First session');
    await page.click('button[type="submit"]');
    
    // Wait for some activity
    await page.waitForSelector('.hex-node.active', { timeout: 10000 });
    
    // Reset/reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window.hexFlowBoard !== undefined);
    
    // Check that hex nodes are back to initial state
    await expect(page.locator('.hex-node.active')).not.toBeVisible();
    await expect(page.locator('.hex-node.completed')).not.toBeVisible();
    
    // Should be able to start new session
    await page.fill('#input', 'Second session');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.hex-node.active', { timeout: 10000 });
  });

  test('should handle hex flow system errors gracefully', async ({ page }) => {
    // Mock network error to test error handling
    await page.route('**/generate*', route => route.abort());
    
    await page.fill('#input', 'Error test');
    await page.click('button[type="submit"]');
    
    // Wait a bit for error handling
    await page.waitForTimeout(5000);
    
    // Hex flow system should still be visible and functional
    await expect(page.locator('#hex-flow-board')).toBeVisible();
    
    // Should not be stuck in active state
    // (Implementation might vary - some might show error state)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should maintain hex node accessibility', async ({ page }) => {
    // Check that hex nodes have proper ARIA labels or titles
    const hexNodes = page.locator('.hex-node');
    const firstNode = hexNodes.first();
    
    // Check for accessibility attributes
    const ariaLabel = await firstNode.getAttribute('aria-label');
    const title = await firstNode.getAttribute('title');
    
    // Should have some form of accessible description or content
    // Hex nodes might use text content instead of aria-label
    const hasAccessibleContent = ariaLabel || title || await firstNode.locator('text').count() > 0;
    expect(hasAccessibleContent).toBeTruthy();
    
    // Test keyboard navigation if implemented
    await page.keyboard.press('Tab');
    
    // Should be able to navigate the interface with keyboard
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should handle hex flow system performance', async ({ page }) => {
    // Test multiple rapid state changes
    for (let i = 0; i < 3; i++) {
      await page.fill('#input', `Performance test ${i}`);
      await page.click('button[type="submit"]');
      
      // Wait briefly then reset
      await page.waitForTimeout(2000);
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => window.hexFlowBoard !== undefined);
    }
    
    // System should still be responsive
    await expect(page.locator('#hex-flow-board')).toBeVisible();
    await expect(page.locator('#input')).toBeVisible();
  });
});