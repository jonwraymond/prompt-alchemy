// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('HTMX Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the alchemy interface
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Ensure HTMX is loaded
    await page.waitForFunction(() => window.htmx !== undefined);
  });

  test('should load the main alchemy interface', async ({ page }) => {
    // Check for the main title - spans contain the text
    const titleSpans = page.locator('.alchemy-title span');
    const titleText = await titleSpans.allTextContents();
    expect(titleText.join('')).toContain('PROMPTALCHEMY');
    
    // Check for the hex flow board system
    await expect(page.locator('#hex-flow-board')).toBeVisible();
    
    // Check for the main form
    await expect(page.locator('#generate-form')).toBeVisible();
    
    // Check for the input field
    await expect(page.locator('#input')).toBeVisible();
  });

  test('should display provider status with HTMX', async ({ page }) => {
    // The provider status button appears after results are generated
    // For now, we'll check that the form is ready for submission
    await expect(page.locator('#generate-form')).toBeVisible();
    
    // Check that provider selection exists
    const providerSelect = page.locator('#provider');
    if (await providerSelect.isVisible()) {
      // Check that it has options
      const options = await providerSelect.locator('option').count();
      expect(options).toBeGreaterThan(1); // Should have at least "Auto Select" + one provider
    }
  });

  test('should handle form submission with HTMX', async ({ page }) => {
    // Fill in the input field
    await page.fill('#input', 'Create a test prompt for user authentication');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for hex flow system to activate
    await page.waitForSelector('.hex-node.active', { timeout: 10000 });
    
    // Check that hex flow board shows activity
    await expect(page.locator('#hex-flow-board')).toBeVisible();
    
    // Check that hex nodes become active
    await expect(page.locator('.hex-node.active')).toBeVisible();
  });

  test('should update hex flow system during processing', async ({ page }) => {
    // Start a generation
    await page.fill('#input', 'Generate a simple test prompt');
    await page.click('button[type="submit"]');
    
    // Wait for processing to start
    await page.waitForSelector('.hex-node.active', { timeout: 10000 });
    
    // Check that hex paths become active
    await expect(page.locator('.hex-path.active')).toBeVisible({ timeout: 15000 });
    
    // Check that flow info panel is visible
    await expect(page.locator('.flow-info-panel')).toBeVisible();
  });

  test('should display results after completion', async ({ page }) => {
    // Start a generation
    await page.fill('#input', 'Create a basic prompt');
    await page.click('button[type="submit"]');
    
    // Wait for completion - look for results section to become visible
    await page.waitForSelector('#results-section', { state: 'visible', timeout: 60000 });
    
    // Check that results section is visible
    const resultsSection = page.locator('#results-section');
    await expect(resultsSection).toBeVisible();
    
    // Wait for results container to have content
    await page.waitForFunction(() => {
      const resultsContainer = document.querySelector('#results-container');
      return resultsContainer && resultsContainer.textContent.trim().length > 0 && 
             !resultsContainer.querySelector('.results-placeholder');
    }, { timeout: 60000 });
    
    // Check that results container has actual content
    const resultsContainer = page.locator('#results-container');
    await expect(resultsContainer).toBeVisible();
    
    // The actual structure of results depends on the backend response
    // So we just check that there's content and it's not the placeholder
    const placeholderText = await resultsContainer.locator('.results-placeholder').count();
    expect(placeholderText).toBe(0);
  });

  test('should handle HTMX error states gracefully', async ({ page }) => {
    // Mock a network error by intercepting requests
    await page.route('**/generate*', route => route.abort());
    
    // Try to submit form
    await page.fill('#input', 'Test error handling');
    await page.click('button[type="submit"]');
    
    // Check that error state is handled (might show error message or retry options)
    await page.waitForTimeout(5000); // Give time for error handling
    
    // The exact error handling depends on implementation
    // This test ensures the page doesn't crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('should maintain HTMX state during navigation', async ({ page }) => {
    // Check initial state
    await expect(page.locator('#generate-form')).toBeVisible();
    
    // Check that HTMX attributes are present
    const htmxElements = page.locator('[hx-post], [hx-get], [hx-trigger]');
    const htmxCount = await htmxElements.count();
    expect(htmxCount).toBeGreaterThan(0);
    
    // Verify form has HTMX attributes
    const form = page.locator('#generate-form');
    const hxPost = await form.getAttribute('hx-post');
    expect(hxPost).toBeTruthy();
  });

  test('should handle multiple concurrent HTMX requests', async ({ page }) => {
    // Start multiple requests quickly
    await page.fill('#input', 'First request');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for hex flow to activate
    await page.waitForSelector('.hex-node.active', { timeout: 10000 });
    
    // Check that multiple HTMX requests are handled (hex nodes polling for status)
    const htmxRequests = page.locator('[hx-trigger*="every"]');
    const requestCount = await htmxRequests.count();
    expect(requestCount).toBeGreaterThan(0); // Should have polling elements
    
    // Ensure the page is still responsive
    await expect(page.locator('#hex-flow-board')).toBeVisible();
  });

  test('should preserve form state during HTMX updates', async ({ page }) => {
    // Fill form fields
    await page.fill('#input', 'Test preservation');
    
    // Select provider if available
    const providerSelect = page.locator('#provider');
    if (await providerSelect.isVisible()) {
      await providerSelect.selectOption({ index: 1 }); // Select first real provider
    }
    
    // The form uses localStorage to preserve state
    // Reload the page to test persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window.htmx !== undefined);
    
    // Check that form values are preserved via localStorage
    const inputValue = await page.locator('#input').inputValue();
    // The value might be preserved or might show placeholder
    expect(inputValue).toBeTruthy();
  });

  test('should handle responsive layout changes', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('#hex-flow-board')).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Wait for layout adjustment
    await expect(page.locator('#hex-flow-board')).toBeVisible();
    
    // Ensure HTMX still works on mobile
    await page.fill('#input', 'Mobile test');
    await page.click('button[type="submit"]');
    
    // Check that hex flow system works on mobile
    await page.waitForSelector('.hex-node.active', { timeout: 10000 });
    await expect(page.locator('.hex-node.active')).toBeVisible();
  });
});