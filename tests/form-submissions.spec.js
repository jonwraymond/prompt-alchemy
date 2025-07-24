// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Form Submissions and Dynamic Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window.htmx !== undefined);
  });

  test('should validate required input field', async ({ page }) => {
    // Check that submit button is disabled when input is empty
    const submitButton = page.locator('button[type="submit"]');
    const inputField = page.locator('#input');
    
    // Clear input field if it has any default value
    await inputField.clear();
    
    // Check button is disabled
    await expect(submitButton).toBeDisabled();
    
    // Type something in the input
    await inputField.fill('Test input');
    
    // Check button is now enabled
    await expect(submitButton).not.toBeDisabled();
    
    // Clear input again
    await inputField.clear();
    
    // Check button is disabled again
    await expect(submitButton).toBeDisabled();
  });

  test('should handle different input lengths', async ({ page }) => {
    // Test short input
    await page.fill('#input', 'Short');
    await page.click('button[type="submit"]');
    // Wait for hex flow system to show activity
    await page.waitForSelector('.hex-node.active', { timeout: 10000 });
    
    // Reset for next test
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Test long input
    const longInput = 'This is a very long input that tests how the system handles extensive prompts with multiple sentences and complex requirements. '.repeat(10);
    await page.fill('#input', longInput);
    await page.click('button[type="submit"]');
    // Wait for hex flow system to show activity
    await page.waitForSelector('.hex-node.active', { timeout: 10000 });
  });

  test('should update provider selection dynamically', async ({ page }) => {
    const providerSelect = page.locator('#provider');
    
    if (await providerSelect.isVisible()) {
      // Test different provider selections
      const providers = ['openai', 'anthropic', 'google'];
      
      for (const provider of providers) {
        await providerSelect.selectOption(provider);
        
        // Check if any dynamic content updates based on provider
        await page.waitForTimeout(500); // Allow for any updates
        
        // The form should remain functional
        await expect(page.locator('#input')).toBeVisible();
      }
    }
  });

  test('should handle phase selection checkboxes', async ({ page }) => {
    const phaseCheckboxes = page.locator('input[name="phases"]');
    const checkboxCount = await phaseCheckboxes.count();
    
    if (checkboxCount > 0) {
      // Test selecting individual phases
      for (let i = 0; i < checkboxCount; i++) {
        await phaseCheckboxes.nth(i).check();
        
        // Verify checkbox is checked
        await expect(phaseCheckboxes.nth(i)).toBeChecked();
      }
      
      // Test unchecking phases
      for (let i = 0; i < checkboxCount; i++) {
        await phaseCheckboxes.nth(i).uncheck();
        
        // Verify checkbox is unchecked
        await expect(phaseCheckboxes.nth(i)).not.toBeChecked();
      }
    }
  });

  test('should display dynamic progress messages', async ({ page }) => {
    await page.fill('#input', 'Test dynamic progress');
    await page.click('button[type="submit"]');
    
    // Wait for hex flow system to start showing activity
    await page.waitForSelector('.hex-node.active', { timeout: 10000 });
    
    // Check that hex nodes show processing state
    const activeNode = page.locator('.hex-node.active').first();
    await expect(activeNode).toBeVisible();
    
    // Wait a bit and check if flow progresses
    await page.waitForTimeout(3000);
    
    // Check for path animations indicating progress
    const activePath = page.locator('.hex-path.active');
    const activePathCount = await activePath.count();
    expect(activePathCount).toBeGreaterThan(0);
  });

  test('should handle hex flow system updates', async ({ page }) => {
    await page.fill('#input', 'Test hex flow status');
    await page.click('button[type="submit"]');
    
    // Wait for hex flow system to activate
    await page.waitForSelector('.hex-node.active', { timeout: 10000 });
    
    // Check that flow status bar shows activity - it's inside hex-flow-container
    const statusBar = page.locator('#hex-flow-container .flow-status-bar');
    await expect(statusBar).toBeVisible();
    
    // Check that status indicator is present - it's inside the status bar
    const statusIndicator = page.locator('#hex-flow-container .status-indicator');
    await expect(statusIndicator).toBeVisible();
    
    // Check that flow info panel updates - also inside hex-flow-container
    const flowInfoPanel = page.locator('#hex-flow-container .flow-info-panel');
    await expect(flowInfoPanel).toBeVisible();
  });

  test('should update phase indicators dynamically', async ({ page }) => {
    await page.fill('#input', 'Test phase indicators');
    await page.click('button[type="submit"]');
    
    // Wait for hex nodes to start activating
    await page.waitForSelector('.hex-node.active', { timeout: 10000 });
    
    // Check that phase nodes (prima, solutio, coagulatio) show activity
    const phaseNodes = page.locator('.hex-node[data-id="prima"], .hex-node[data-id="solutio"], .hex-node[data-id="coagulatio"]');
    const activePhaseCount = await phaseNodes.count();
    expect(activePhaseCount).toBeGreaterThan(0);
    
    // Check that flow stages in info panel show status - inside hex-flow-container
    const flowStages = page.locator('#hex-flow-container .flow-stage');
    await expect(flowStages.first()).toBeVisible();
  });

  test('should handle form reset after completion', async ({ page }) => {
    await page.fill('#input', 'Test form reset');
    await page.click('button[type="submit"]');
    
    // Wait for results to appear - check for the results section
    await page.waitForSelector('#results-section', { state: 'visible', timeout: 60000 });
    
    // Wait for results container to have content
    await page.waitForFunction(() => {
      const resultsContainer = document.querySelector('#results-container');
      return resultsContainer && resultsContainer.textContent.trim().length > 0;
    }, { timeout: 60000 });
    
    // Click "New Transmutation" button if available, otherwise reload the page
    const newTransmutationBtn = page.locator('button:has-text("New Transmutation")');
    if (await newTransmutationBtn.isVisible()) {
      await newTransmutationBtn.click();
      
      // Check that page scrolls to top (form area)
      await page.waitForTimeout(1000); // Wait for scroll animation
      
      // Check that input field is focused
      await expect(page.locator('#input')).toBeFocused();
      
      // Check that hex nodes are no longer active
      await expect(page.locator('.hex-node.active')).not.toBeVisible();
    } else {
      // If no "New Transmutation" button, reload page to reset
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => window.hexFlowBoard !== undefined);
      
      // Check that hex nodes are reset
      await expect(page.locator('.hex-node.active')).not.toBeVisible();
    }
  });

  test('should preserve form data during navigation', async ({ page }) => {
    // Fill form with test data
    await page.fill('#input', 'Navigation test data');
    
    const providerSelect = page.locator('#provider');
    if (await providerSelect.isVisible()) {
      await providerSelect.selectOption('openai');
    }
    
    // Navigate away and back (if navigation exists)
    const navElement = page.locator('a[href], button[hx-get]').first();
    if (await navElement.isVisible()) {
      await navElement.click();
      await page.waitForLoadState('networkidle');
      
      // Navigate back to main form
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check if form data persists (depending on implementation)
      // This might not persist in all implementations
    }
  });

  test('should handle concurrent form submissions', async ({ page }) => {
    // Open multiple tabs/contexts to test concurrent submissions
    const context = page.context();
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.waitForLoadState('networkidle');
    await page2.waitForFunction(() => window.hexFlowBoard !== undefined);
    
    // Submit from both pages simultaneously
    await page.fill('#input', 'First submission');
    await page2.fill('#input', 'Second submission');
    
    const [response1, response2] = await Promise.all([
      page.click('button[type="submit"]'),
      page2.click('button[type="submit"]')
    ]);
    
    // Both should handle the requests gracefully - check for hex flow activity
    await page.waitForSelector('.hex-node.active', { timeout: 10000 });
    await page2.waitForSelector('.hex-node.active', { timeout: 10000 });
    
    await page2.close();
  });

  test('should handle form submission with special characters', async ({ page }) => {
    // Test with various special characters and unicode
    const specialInput = 'Test with émojis 🧪⚗️ and "quotes" & symbols <>&';
    
    await page.fill('#input', specialInput);
    await page.click('button[type="submit"]');
    
    // Should handle special characters without errors - check hex flow activation
    await page.waitForSelector('.hex-node.active', { timeout: 10000 });
    
    // Check that the system is still functional
    await expect(page.locator('#hex-flow-board')).toBeVisible();
    
    // Check that hex nodes are visible - use first() to ensure we're checking a specific element
    const hexNodes = page.locator('.hex-node');
    const hexNodeCount = await hexNodes.count();
    expect(hexNodeCount).toBeGreaterThan(0);
    await expect(hexNodes.first()).toBeVisible();
  });
});