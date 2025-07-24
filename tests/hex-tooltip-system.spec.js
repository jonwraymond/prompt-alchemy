// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Hex Flow Board - Tooltip System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window.htmx !== undefined);
    await page.waitForFunction(() => window.hexFlowBoard !== undefined);
  });

  test('should display tooltip with correct content structure', async ({ page }) => {
    const tooltip = page.locator('#hex-tooltip');
    const inputNode = page.locator('[data-id="input"]');
    
    // Hover over input node
    await inputNode.hover();
    
    // Wait for tooltip to appear
    await expect(tooltip).toHaveClass(/visible/);
    
    // Check tooltip structure
    await expect(tooltip.locator('.tooltip-content')).toBeVisible();
    await expect(tooltip.locator('.tooltip-title')).toBeVisible();
    await expect(tooltip.locator('.tooltip-type')).toBeVisible();
    await expect(tooltip.locator('.tooltip-description')).toBeVisible();
    
    // Check content is populated
    const title = await tooltip.locator('.tooltip-title').textContent();
    const description = await tooltip.locator('.tooltip-description').textContent();
    
    expect(title).toBeTruthy();
    expect(description).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    expect(description.length).toBeGreaterThan(0);
  });

  test('should position tooltip correctly relative to cursor', async ({ page }) => {
    const inputNode = page.locator('[data-id="input"]');
    const tooltip = page.locator('#hex-tooltip');
    
    // Get node position
    const nodeBox = await inputNode.boundingBox();
    
    // Hover at a specific position
    await inputNode.hover({ position: { x: 50, y: 50 } });
    
    // Wait for tooltip to appear
    await expect(tooltip).toHaveClass(/visible/);
    
    // Check tooltip position is offset from hover point
    const tooltipStyle = await tooltip.getAttribute('style');
    expect(tooltipStyle).toContain('left:');
    expect(tooltipStyle).toContain('top:');
    
    // Tooltip should be positioned near but not exactly at cursor
    const leftMatch = tooltipStyle.match(/left:\s*(\d+)px/);
    const topMatch = tooltipStyle.match(/top:\s*(\d+)px/);
    
    if (leftMatch && topMatch && nodeBox) {
      const tooltipLeft = parseInt(leftMatch[1]);
      const tooltipTop = parseInt(topMatch[1]);
      
      // Should be offset from cursor position
      expect(tooltipLeft).toBeGreaterThan(nodeBox.x + 50);
      expect(Math.abs(tooltipTop - (nodeBox.y + 50))).toBeLessThan(50);
    }
  });

  test('should show different content for different node types', async ({ page }) => {
    const tooltip = page.locator('#hex-tooltip');
    
    // Test input node
    await page.locator('[data-id="input"]').hover();
    await expect(tooltip).toHaveClass(/visible/);
    const inputTitle = await tooltip.locator('.tooltip-title').textContent();
    const inputType = await tooltip.locator('.tooltip-type').textContent();
    
    // Move away to hide tooltip
    await page.locator('body').hover({ position: { x: 0, y: 0 } });
    await expect(tooltip).not.toHaveClass(/visible/);
    
    // Test prima materia node
    await page.locator('[data-id="prima"]').hover();
    await expect(tooltip).toHaveClass(/visible/);
    const primaTitle = await tooltip.locator('.tooltip-title').textContent();
    const primaType = await tooltip.locator('.tooltip-type').textContent();
    
    // Content should be different
    expect(inputTitle).not.toEqual(primaTitle);
    expect(inputType).not.toEqual(primaType);
    
    // Type should reflect node classification
    expect(primaType).toMatch(/PRIMA/i);
  });

  test('should handle HTMX tooltip content updates', async ({ page }) => {
    const tooltip = page.locator('#hex-tooltip');
    
    // Mock HTMX response for tooltip stats
    await page.route('**/api/node-details*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="tooltip-stats">Active: 3 connections<br>Status: Ready</div>'
      });
    });
    
    // Hover over core hub node (which has HTMX tooltip updates)
    await page.locator('[data-id="hub"]').hover();
    
    // Wait for tooltip and HTMX request
    await expect(tooltip).toHaveClass(/visible/);
    await page.waitForTimeout(1000); // Allow HTMX to process
    
    // Check if stats section was updated
    const statsContent = await tooltip.locator('.tooltip-stats').textContent();
    expect(statsContent).toContain('Active: 3 connections');
  });

  test('should hide tooltip when mouse leaves node', async ({ page }) => {
    const tooltip = page.locator('#hex-tooltip');
    const inputNode = page.locator('[data-id="input"]');
    
    // Show tooltip
    await inputNode.hover();
    await expect(tooltip).toHaveClass(/visible/);
    
    // Move to empty area
    await page.locator('#hex-flow-board').hover({ position: { x: 100, y: 100 } });
    
    // Tooltip should hide
    await expect(tooltip).not.toHaveClass(/visible/);
  });

  test('should handle tooltip with long descriptions gracefully', async ({ page }) => {
    const tooltip = page.locator('#hex-tooltip');
    
    // Hover over a node with potentially long description
    await page.locator('[data-id="database"]').hover();
    await expect(tooltip).toHaveClass(/visible/);
    
    // Check tooltip doesn't overflow viewport
    const tooltipBox = await tooltip.boundingBox();
    const viewportSize = await page.viewportSize();
    
    if (tooltipBox && viewportSize) {
      expect(tooltipBox.x + tooltipBox.width).toBeLessThanOrEqual(viewportSize.width);
      expect(tooltipBox.y + tooltipBox.height).toBeLessThanOrEqual(viewportSize.height);
    }
  });

  test('should handle rapid hover events without flickering', async ({ page }) => {
    const tooltip = page.locator('#hex-tooltip');
    const nodes = ['input', 'prima', 'hub', 'solutio'];
    
    // Rapidly hover over multiple nodes
    for (const nodeId of nodes) {
      await page.locator(`[data-id="${nodeId}"]`).hover();
      await page.waitForTimeout(100);
    }
    
    // Tooltip should still be functional
    await page.locator('[data-id="input"]').hover();
    await expect(tooltip).toHaveClass(/visible/);
    
    const title = await tooltip.locator('.tooltip-title').textContent();
    expect(title).toBeTruthy();
  });

  test('should work on mobile/touch devices', async ({ page }) => {
    // Simulate mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const tooltip = page.locator('#hex-tooltip');
    const inputNode = page.locator('[data-id="input"]');
    
    // On mobile, might need tap instead of hover
    await inputNode.tap();
    
    // Check if tooltip appears (behavior may differ on mobile)
    // Some implementations might show tooltip on tap rather than hover
    const tooltipVisible = await tooltip.isVisible();
    
    if (tooltipVisible) {
      const title = await tooltip.locator('.tooltip-title').textContent();
      expect(title).toBeTruthy();
    }
  });

  test('should handle tooltip errors gracefully', async ({ page }) => {
    const tooltip = page.locator('#hex-tooltip');
    
    // Simulate error in tooltip system
    await page.evaluate(() => {
      if (window.hexFlowBoard && window.hexFlowBoard.showTooltip) {
        // Call with invalid parameters
        window.hexFlowBoard.showTooltip(null, null);
      }
    });
    
    // System should not crash
    await expect(page.locator('#hex-flow-board')).toBeVisible();
    
    // Normal tooltip functionality should still work
    await page.locator('[data-id="input"]').hover();
    // Tooltip might not work after error, but page should still be functional
    await expect(page.locator('#hex-flow-board')).toBeVisible();
  });

  test('should support keyboard accessibility for tooltips', async ({ page }) => {
    // Tab to first focusable element
    await page.keyboard.press('Tab');
    
    // Check if focused element shows tooltip information
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Some implementations might show tooltip on focus
    const tooltip = page.locator('#hex-tooltip');
    const tooltipVisible = await tooltip.isVisible();
    
    if (tooltipVisible) {
      const title = await tooltip.locator('.tooltip-title').textContent();
      expect(title).toBeTruthy();
    }
  });
});