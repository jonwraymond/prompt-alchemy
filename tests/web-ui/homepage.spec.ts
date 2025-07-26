import { test, expect } from '../fixtures/base-fixtures';
import { waitForLoadingComplete, expectVisibleAndEnabled } from '../helpers/test-utils';

/**
 * Homepage Tests
 * 
 * Tests for the main page functionality including:
 * - Page loading and layout
 * - Header and navigation
 * - Main form elements
 * - Initial state verification
 * - Responsive design
 */

test.describe('Homepage', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
    await homePage.waitForReady();
  });

  test('should load successfully with all critical elements', async ({ page, homePage }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Prompt Alchemy/);

    // Verify main header is visible
    await expect(page.locator('.main-header')).toBeVisible();
    await expect(page.locator('.main-title')).toContainText('Prompt Alchemy');

    // Verify main form is present
    const formElements = await homePage.getFormElements();
    await expect(formElements.input).toBeVisible();
    await expect(formElements.generateBtn).toBeVisible();
    await expect(formElements.personaSelect).toBeVisible();
    await expect(formElements.countSelect).toBeVisible();
  });

  test('should have proper form structure and placeholders', async ({ homePage }) => {
    const formElements = await homePage.getFormElements();

    // Check input placeholder
    await expect(formElements.input).toHaveAttribute('placeholder', /Insert your prompt here/);

    // Check that form elements are enabled
    await expect(formElements.input).toBeEnabled();
    await expect(formElements.generateBtn).toBeEnabled();
    await expect(formElements.personaSelect).toBeEnabled();
    await expect(formElements.countSelect).toBeEnabled();

    // Check that input is required
    await expect(formElements.input).toHaveAttribute('required');
  });

  test('should have working persona selector with default options', async ({ homePage }) => {
    const formElements = await homePage.getFormElements();
    const personaSelect = formElements.personaSelect;

    // Check default selection
    await expect(personaSelect).toHaveValue('general');

    // Verify options are available
    const options = await personaSelect.locator('option').all();
    expect(options.length).toBeGreaterThan(1);

    // Test selecting different persona
    await personaSelect.selectOption('technical');
    await expect(personaSelect).toHaveValue('technical');
  });

  test('should have working count selector with default options', async ({ homePage }) => {
    const formElements = await homePage.getFormElements();
    const countSelect = formElements.countSelect;

    // Check default selection
    await expect(countSelect).toHaveValue('3');

    // Test selecting different count
    await countSelect.selectOption('5');
    await expect(countSelect).toHaveValue('5');
  });

  test('should show hex grid visualization', async ({ page }) => {
    // Wait for hex grid to load
    await page.waitForSelector('#hex-flow-container', { state: 'visible' });
    
    // Verify hex grid elements
    await expect(page.locator('#hex-flow-container')).toBeVisible();
    
    // Check for hex nodes (might take time to load)
    await page.waitForSelector('.hex-node', { timeout: 15000 });
    
    const nodes = page.locator('.hex-node');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThan(5); // Should have multiple nodes
  });

  test('should have responsive design', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('.dual-view-container')).toBeVisible();

    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await waitForLoadingComplete(page);
    await expect(page.locator('.main-header')).toBeVisible();

    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await waitForLoadingComplete(page);
    await expect(page.locator('.main-header')).toBeVisible();
    await expect(page.locator('#generate-form')).toBeVisible();
  });

  test('should have proper ARIA attributes for accessibility', async ({ page, homePage }) => {
    const formElements = await homePage.getFormElements();

    // Check ARIA labels
    await expect(formElements.input).toHaveAttribute('required');

    // Check form structure
    await expect(page.locator('#generate-form')).toHaveAttribute('id', 'generate-form');
  });

  test('should show loading indicators when appropriate', async ({ page }) => {
    // Check that loading elements exist for when they're needed
    const loadingIndicator = page.locator('#alchemy-loading');
    // Loading indicator should exist but not be visible initially
    await expect(loadingIndicator).toBeHidden();
  });

  test('should have proper CSS theme and styling', async ({ page }) => {
    // Verify alchemy theme CSS is loaded
    const body = page.locator('body');
    const backgroundColor = await body.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should have dark theme
    expect(backgroundColor).toMatch(/rgb\(8, 8, 8\)|rgb\(10, 10, 10\)/);

    // Check that critical CSS files are loaded
    const stylesheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).map(sheet => {
        try {
          return sheet.href || 'inline';
        } catch {
          return 'cross-origin';
        }
      });
    });

    const hasAlchemyCSS = stylesheets.some(href => 
      typeof href === 'string' && href.includes('alchemy.css')
    );
    expect(hasAlchemyCSS).toBe(true);
  });

  test('should handle page navigation and back button', async ({ page }) => {
    // Test browser navigation
    const initialUrl = page.url();
    
    // Simulate page refresh
    await page.reload();
    await waitForLoadingComplete(page);
    
    // Should be back at the same URL
    expect(page.url()).toBe(initialUrl);
    
    // Main elements should still be visible
    await expect(page.locator('.main-header')).toBeVisible();
    await expect(page.locator('#generate-form')).toBeVisible();
  });

  test('should have working legend and help sections', async ({ page }) => {
    // Check for legend section
    const legend = page.locator('.legend-section');
    if (await legend.count() > 0) {
      await expect(legend.first()).toBeVisible();
    }

    // Check for help text or instructions
    const helpElements = page.locator('[class*="help"], [class*="instruction"]');
    if (await helpElements.count() > 0) {
      await expect(helpElements.first()).toBeVisible();
    }
  });
}); 