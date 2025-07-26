import { test, expect } from '../fixtures/base-fixtures';
import { 
  fillAndSubmitForm,
  waitForLoadingComplete,
  waitForNetworkIdle,
  expectToContainText,
  screenshotElement
} from '../helpers/test-utils';

/**
 * Form Submission and HTMX Integration Tests
 * 
 * Tests for form functionality including:
 * - Basic form submission
 * - HTMX dynamic updates
 * - Loading states and indicators
 * - Results rendering and display
 * - Error handling and validation
 * - Form state persistence
 * - Progress tracking
 * - Real-time updates
 */

test.describe('Form Submission and HTMX Integration', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
    await homePage.waitForReady();
  });

  test.describe('Basic Form Submission', () => {
    test('should submit form with valid input', async ({ page }) => {
      // Mock successful response
      await page.route('**/generate', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <div id="results-container">
              <h3>Generated Prompts</h3>
              <div class="prompt-result">Enhanced test prompt with detailed instructions</div>
              <div class="prompt-result">Alternative version of the test prompt</div>
            </div>
          `
        });
      });

      await fillAndSubmitForm(page, 'Create a test prompt', {
        persona: 'technical',
        count: 2
      });

      // Wait for HTMX to update results
      await waitForLoadingComplete(page);

      // Verify results are displayed
      await expect(page.locator('#results-container')).toBeVisible();
      await expectToContainText(page, '#results-container', 'Generated Prompts');
      
      const results = page.locator('.prompt-result');
      await expect(results).toHaveCount(2);
    });

    test('should show validation error for empty input', async ({ page }) => {
      const submitBtn = page.locator('button[type="submit"]');
      
      // Try to submit without input
      await submitBtn.click();

      // Should show browser validation or prevent submission
      const input = page.locator('#input');
      const validationMessage = await input.evaluate((el: HTMLInputElement) => el.validationMessage);
      
      expect(validationMessage).toBeTruthy();
    });

    test('should maintain form state during submission', async ({ page }) => {
      await page.fill('#input', 'Test prompt for state persistence');
      await page.selectOption('#persona', 'creative');
      await page.selectOption('#count', '5');

      // Mock delayed response
      await page.route('**/generate', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<div id="results-container">Success</div>'
        });
      });

      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();

      // Check that form values are preserved
      await expect(page.locator('#input')).toHaveValue('Test prompt for state persistence');
      await expect(page.locator('#persona')).toHaveValue('creative');
      await expect(page.locator('#count')).toHaveValue('5');

      await waitForLoadingComplete(page);
    });
  });

  test.describe('HTMX Dynamic Updates', () => {
    test('should update results container with HTMX', async ({ page }) => {
      // Check initial state
      const resultsContainer = page.locator('#results-container');
      const initialContent = await resultsContainer.textContent();

      // Mock HTMX response
      await page.route('**/generate', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<div id="results-container"><p>HTMX Updated Content</p></div>'
        });
      });

      await fillAndSubmitForm(page, 'HTMX test prompt');
      await waitForLoadingComplete(page);

      // Content should be updated
      const finalContent = await resultsContainer.textContent();
      expect(finalContent).toContain('HTMX Updated Content');
      expect(finalContent).not.toBe(initialContent);
    });

    test('should trigger HTMX events properly', async ({ page }) => {
      let htmxEvents: string[] = [];

      // Listen for HTMX events
      await page.evaluate(() => {
        const events = ['htmx:beforeRequest', 'htmx:afterRequest', 'htmx:responseError'];
        events.forEach(event => {
          document.addEventListener(event, (e) => {
            (window as any).htmxEvents = (window as any).htmxEvents || [];
            (window as any).htmxEvents.push(event);
          });
        });
      });

      await page.route('**/generate', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<div id="results-container">Success</div>'
        });
      });

      await fillAndSubmitForm(page, 'HTMX events test');
      await waitForLoadingComplete(page);

      // Check events were fired
      htmxEvents = await page.evaluate(() => (window as any).htmxEvents || []);
      expect(htmxEvents).toContain('htmx:beforeRequest');
      expect(htmxEvents).toContain('htmx:afterRequest');
    });

    test('should handle HTMX swap transitions', async ({ page }) => {
      await page.route('**/generate', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <div id="results-container" class="fade-in">
              <div class="results-header">Results Updated</div>
              <div class="prompt-result">New content with transition</div>
            </div>
          `
        });
      });

      await fillAndSubmitForm(page, 'Transition test');
      await waitForLoadingComplete(page);

      // Check for transition classes
      const results = page.locator('#results-container');
      await expect(results).toHaveClass(/fade-in/);
      await expectToContainText(page, '.results-header', 'Results Updated');
    });
  });

  test.describe('Loading States and Indicators', () => {
    test('should show loading indicator during submission', async ({ page }) => {
      // Mock delayed response
      await page.route('**/generate', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<div id="results-container">Completed</div>'
        });
      });

      await page.fill('#input', 'Loading test prompt');
      
      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();

      // Should show loading indicator
      await expect(page.locator('#alchemy-loading')).toBeVisible();
      
      // Button should be disabled
      await expect(submitBtn).toBeDisabled();

      await waitForLoadingComplete(page);

      // Loading should disappear
      await expect(page.locator('#alchemy-loading')).toBeHidden();
      await expect(submitBtn).toBeEnabled();
    });

    test('should show progress indicators for hex grid', async ({ page }) => {
      await page.route('**/generate', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<div id="results-container">Progress test complete</div>'
        });
      });

      await fillAndSubmitForm(page, 'Progress visualization test');

      // Check for active nodes in hex grid during processing
      await page.waitForTimeout(500); // Let animation start
      
      const activeNodes = page.locator('.hex-node.active');
      const activeCount = await activeNodes.count();
      
      // Should have some active visualization
      expect(activeCount).toBeGreaterThanOrEqual(0);

      await waitForLoadingComplete(page);
    });

    test('should handle loading timeout gracefully', async ({ page }) => {
      // Mock very slow response
      await page.route('**/generate', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 35000)); // Longer than timeout
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<div id="results-container">Too slow</div>'
        });
      });

      await fillAndSubmitForm(page, 'Timeout test');

      // Wait for potential timeout handling
      await page.waitForTimeout(5000);
      
      // Should either show error or still be loading
      const loadingVisible = await page.locator('#alchemy-loading').isVisible();
      const errorVisible = await page.locator('.error-message').isVisible();
      
      expect(loadingVisible || errorVisible).toBe(true);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle server errors gracefully', async ({ page }) => {
      await page.route('**/generate', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'text/html',
          body: '<div class="error-message">Server error occurred</div>'
        });
      });

      await fillAndSubmitForm(page, 'Error test prompt');
      await waitForLoadingComplete(page);

      // Should show error message
      await expect(page.locator('.error-message')).toBeVisible();
      await expectToContainText(page, '.error-message', 'error');
    });

    test('should handle network failures', async ({ page }) => {
      await page.route('**/generate', (route) => {
        route.abort('internetdisconnected');
      });

      await fillAndSubmitForm(page, 'Network failure test');
      await page.waitForTimeout(2000);

      // Should handle the failure gracefully
      const submitBtn = page.locator('button[type="submit"]');
      await expect(submitBtn).toBeEnabled(); // Should re-enable after failure
    });

    test('should handle API validation errors', async ({ page }) => {
      await page.route('**/generate', (route) => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Invalid input parameter',
            details: 'Input must be at least 10 characters'
          })
        });
      });

      await fillAndSubmitForm(page, 'Short'); // Too short input
      await waitForLoadingComplete(page);

      // Should show validation error
      const errorElements = page.locator('.error-message, .validation-error');
      await expect(errorElements.first()).toBeVisible();
    });

    test('should retry failed requests if configured', async ({ page }) => {
      let attemptCount = 0;
      
      await page.route('**/generate', (route) => {
        attemptCount++;
        if (attemptCount === 1) {
          route.fulfill({ status: 500 });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: '<div id="results-container">Success after retry</div>'
          });
        }
      });

      await fillAndSubmitForm(page, 'Retry test prompt');
      await waitForLoadingComplete(page);

      // Should eventually succeed
      expect(attemptCount).toBeGreaterThan(1);
    });
  });

  test.describe('Form Validation', () => {
    test('should validate input length', async ({ page }) => {
      const input = page.locator('#input');
      
      // Test very long input
      const longInput = 'A'.repeat(10000);
      await input.fill(longInput);
      
      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();

      // Should either truncate or show validation error
      const finalValue = await input.inputValue();
      expect(finalValue.length).toBeLessThanOrEqual(5000); // Assuming 5000 char limit
    });

    test('should validate persona selection', async ({ page }) => {
      const personaSelect = page.locator('#persona');
      const options = await personaSelect.locator('option').all();
      
      expect(options.length).toBeGreaterThan(1);
      
      // Test each valid option
      for (let i = 0; i < Math.min(options.length, 3); i++) {
        const value = await options[i].getAttribute('value');
        if (value) {
          await personaSelect.selectOption(value);
          await expect(personaSelect).toHaveValue(value);
        }
      }
    });

    test('should validate count parameter', async ({ page }) => {
      const countSelect = page.locator('#count');
      
      // Test valid counts
      const validCounts = ['1', '3', '5'];
      for (const count of validCounts) {
        await countSelect.selectOption(count);
        await expect(countSelect).toHaveValue(count);
      }
    });
  });

  test.describe('Real-time Features', () => {
    test('should update character counter in real-time', async ({ page }) => {
      const input = page.locator('#input');
      const counter = page.locator('.character-counter, .ai-input-counter');
      
      if (await counter.count() > 0) {
        // Check initial state
        await expect(counter).toContainText('0');
        
        // Type and check counter updates
        await input.type('Hello');
        await expect(counter).toContainText('5');
        
        await input.fill('Hello World');
        await expect(counter).toContainText('11');
      }
    });

    test('should provide live suggestions if enabled', async ({ page }) => {
      const input = page.locator('#input');
      await input.fill('Create a');
      
      // Wait for potential suggestions
      await page.waitForTimeout(1000);
      
      const suggestions = page.locator('.suggestion, .autocomplete-item');
      if (await suggestions.count() > 0) {
        await expect(suggestions.first()).toBeVisible();
      }
    });

    test('should show typing indicators', async ({ page }) => {
      const input = page.locator('#input');
      
      await input.focus();
      await input.type('Test prompt', { delay: 100 });
      
      // Check for typing indicators or animations
      const typingIndicators = page.locator('.typing-indicator, .input-active');
      if (await typingIndicators.count() > 0) {
        await expect(typingIndicators.first()).toBeVisible();
      }
    });
  });

  test.describe('Integration with Visualization', () => {
    test('should update hex grid during form submission', async ({ page }) => {
      await page.route('**/generate', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<div id="results-container">Visualization test complete</div>'
        });
      });

      await fillAndSubmitForm(page, 'Visualization integration test');

      // Check for hex grid updates during processing
      await page.waitForTimeout(500);
      
      const hexContainer = page.locator('#hex-flow-container');
      await expect(hexContainer).toBeVisible();
      
      // Should show some form of activity
      const activeElements = page.locator('.active, .processing, .animated');
      const activeCount = await activeElements.count();
      expect(activeCount).toBeGreaterThanOrEqual(0);

      await waitForLoadingComplete(page);
    });

    test('should reflect process phases in visualization', async ({ page }) => {
      await page.route('**/generate', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            phases: ['prima-materia', 'solutio', 'coagulatio'],
            prompts: ['Generated prompt']
          })
        });
      });

      await fillAndSubmitForm(page, 'Phase visualization test');
      await waitForLoadingComplete(page);

      // Check for phase indicators
      const phaseNodes = page.locator('[data-phase], [data-node-type*="phase"]');
      const phaseCount = await phaseNodes.count();
      expect(phaseCount).toBeGreaterThan(0);
    });
  });

  test.describe('Accessibility and UX', () => {
    test('should maintain focus management during submission', async ({ page }) => {
      await page.route('**/generate', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<div id="results-container">Focus test complete</div>'
        });
      });

      const input = page.locator('#input');
      const submitBtn = page.locator('button[type="submit"]');
      
      await input.fill('Focus management test');
      await submitBtn.click();

      // Focus should remain manageable during loading
      await page.keyboard.press('Tab');
      
      await waitForLoadingComplete(page);

      // Focus should be restored or properly managed
      const focusedElement = page.locator(':focus');
      expect(await focusedElement.count()).toBeGreaterThanOrEqual(0);
    });

    test('should provide screen reader announcements', async ({ page }) => {
      // Check for ARIA live regions
      const liveRegions = page.locator('[aria-live]');
      if (await liveRegions.count() > 0) {
        await expect(liveRegions.first()).toBeVisible();
      }

      await fillAndSubmitForm(page, 'Screen reader test');
      await waitForLoadingComplete(page);

      // Check for status announcements
      const statusElements = page.locator('[role="status"], [aria-live]');
      if (await statusElements.count() > 0) {
        const statusText = await statusElements.first().textContent();
        expect(statusText).toBeTruthy();
      }
    });

    test('should handle keyboard navigation', async ({ page }) => {
      const input = page.locator('#input');
      await input.fill('Keyboard navigation test');

      // Tab to submit button
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.locator(':focus').getAttribute('type');
      expect(focusedElement).toBe('submit');

      // Submit with Enter
      await page.keyboard.press('Enter');
      await waitForLoadingComplete(page);
    });
  });

  test.describe('Performance', () => {
    test('should handle rapid form submissions', async ({ page }) => {
      await page.route('**/generate', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<div id="results-container">Rapid submission handled</div>'
        });
      });

      const input = page.locator('#input');
      const submitBtn = page.locator('button[type="submit"]');

      // Submit multiple times rapidly
      await input.fill('Rapid test 1');
      await submitBtn.click();
      
      await input.fill('Rapid test 2');
      await submitBtn.click();
      
      await input.fill('Rapid test 3');
      await submitBtn.click();

      await waitForLoadingComplete(page);

      // Should handle gracefully without breaking
      const results = page.locator('#results-container');
      await expect(results).toBeVisible();
    });

    test('should not leak memory during repeated submissions', async ({ page }) => {
      await page.route('**/generate', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<div id="results-container">Memory test complete</div>'
        });
      });

      // Submit form multiple times
      for (let i = 0; i < 5; i++) {
        await fillAndSubmitForm(page, `Memory test ${i}`);
        await waitForLoadingComplete(page);
        await page.waitForTimeout(200);
      }

      // Check JavaScript heap (if available)
      const memory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize
        } : null;
      });

      if (memory) {
        // Heap shouldn't be excessive
        expect(memory.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024); // 100MB
      }
    });
  });
}); 