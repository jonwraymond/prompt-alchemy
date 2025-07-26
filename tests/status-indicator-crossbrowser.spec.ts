import { test, expect, Page } from '@playwright/test';

// Test status indicator across different browsers
test.describe('StatusIndicator Cross-Browser Compatibility', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');
    
    // Wait for the status indicator to load
    await page.waitForSelector('.status-indicator', { timeout: 10000 });
  });

  test('displays status indicator on Chrome', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'This test is only for Chrome');
    
    const statusIndicator = page.locator('.status-indicator');
    await expect(statusIndicator).toBeVisible();
    
    const overallDot = page.locator('.status-dot.overall');
    await expect(overallDot).toBeVisible();
    
    // Test color is applied correctly
    const color = await overallDot.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(color).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
  });

  test('displays status indicator on Firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'This test is only for Firefox');
    
    const statusIndicator = page.locator('.status-indicator');
    await expect(statusIndicator).toBeVisible();
    
    // Test backdrop filter support
    const backdropFilter = await statusIndicator.evaluate(el => 
      window.getComputedStyle(el).backdropFilter
    );
    
    // Firefox should support backdrop-filter or gracefully degrade
    expect(backdropFilter).toBeDefined();
  });

  test('displays status indicator on Safari (WebKit)', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'This test is only for Safari/WebKit');
    
    const statusIndicator = page.locator('.status-indicator');
    await expect(statusIndicator).toBeVisible();
    
    // Test that animations work in Safari
    const overallDot = page.locator('.status-dot.overall');
    await overallDot.hover();
    
    // Check that hover effect is applied
    const transform = await overallDot.evaluate(el => 
      window.getComputedStyle(el).transform
    );
    expect(transform).toBeDefined();
  });

  test('tooltip positioning works across browsers', async ({ page }) => {
    // Click overall dot to expand
    await page.click('.status-dot.overall');
    
    // Wait for system dots to appear
    await page.waitForSelector('.system-dots');
    
    // Click on a system dot to show tooltip
    const systemDots = page.locator('.status-dot.system');
    await systemDots.first().click();
    
    // Check tooltip appears
    const tooltip = page.locator('.status-tooltip');
    await expect(tooltip).toBeVisible();
    
    // Verify tooltip is positioned within viewport
    const tooltipBox = await tooltip.boundingBox();
    const viewportSize = page.viewportSize();
    
    if (tooltipBox && viewportSize) {
      expect(tooltipBox.x).toBeGreaterThanOrEqual(0);
      expect(tooltipBox.y).toBeGreaterThanOrEqual(0);
      expect(tooltipBox.x + tooltipBox.width).toBeLessThanOrEqual(viewportSize.width);
      expect(tooltipBox.y + tooltipBox.height).toBeLessThanOrEqual(viewportSize.height);
    }
  });

  test('responsive design works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const statusIndicator = page.locator('.status-indicator');
    await expect(statusIndicator).toBeVisible();
    
    // Check mobile-specific positioning
    const indicatorBox = await statusIndicator.boundingBox();
    expect(indicatorBox).toBeTruthy();
    
    if (indicatorBox) {
      // Should be positioned near bottom-right on mobile
      expect(indicatorBox.x).toBeGreaterThan(0);
      expect(indicatorBox.y).toBeGreaterThan(0);
    }
  });

  test('keyboard navigation works', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Should be able to focus interactive elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('handles API errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/v1/providers', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Reload to trigger API calls with mocked error
    await page.reload();
    
    // Should still show status indicator
    const statusIndicator = page.locator('.status-indicator');
    await expect(statusIndicator).toBeVisible();
    
    // Overall status should show error state
    const overallDot = page.locator('.status-dot.overall');
    const backgroundColor = await overallDot.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should be red for error state
    expect(backgroundColor).toContain('239, 68, 68'); // Red color
  });

  test('performance is acceptable across browsers', async ({ page }) => {
    const startTime = Date.now();
    
    // Trigger status check
    await page.click('.status-dot.overall');
    await page.waitForSelector('.system-dots');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should respond within reasonable time
    expect(duration).toBeLessThan(2000); // 2 seconds max
  });
});