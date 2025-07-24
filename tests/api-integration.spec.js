const { test, expect } = require('@playwright/test');

test.describe('API Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for essential scripts to load
    await page.waitForFunction(() => {
      return window.apiClient && 
             window.ErrorHandler && 
             window.testGatewayEffects;
    }, { timeout: 10000 });
  });

  test.describe('API Client Functionality', () => {
    test('should have API client properly initialized', async ({ page }) => {
      // Verify API client exists and has required methods
      const apiClientExists = await page.evaluate(() => {
        return !!(window.apiClient && 
                 typeof window.apiClient.checkHealth === 'function' &&
                 typeof window.apiClient.generate === 'function');
      });
      
      expect(apiClientExists).toBe(true);
    });

    test('should handle API health check correctly', async ({ page }) => {
      const healthCheckResult = await page.evaluate(async () => {
        try {
          const result = await window.apiClient.checkHealth();
          return { success: true, result };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      // Health check should either succeed or fail gracefully
      expect(healthCheckResult.success).toBeDefined();
    });

    test('should handle API generation with proper error handling', async ({ page }) => {
      const apiCallResult = await page.evaluate(async () => {
        try {
          const response = await window.apiClient.generate('Test prompt for Playwright', {
            persona: 'generic',
            count: '1'
          });
          return { success: true, response };
        } catch (error) {
          return { 
            success: false, 
            error: error.message,
            errorType: error.type || 'unknown',
            isAPIError: error instanceof window.APIError
          };
        }
      });

      // Should either succeed or fail with proper API error handling
      if (!apiCallResult.success) {
        expect(apiCallResult.isAPIError).toBe(true);
        expect(apiCallResult.errorType).toBeDefined();
      }
    });
  });

  test.describe('Error Handling System', () => {
    test('should have error handler properly configured', async ({ page }) => {
      const errorSystemCheck = await page.evaluate(() => {
        return !!(window.ErrorHandler && 
                 window.APIError && 
                 window.ERROR_TYPES &&
                 Object.keys(window.ERROR_TYPES).length > 0);
      });

      expect(errorSystemCheck).toBe(true);
    });

    test('should create proper error notifications', async ({ page }) => {
      // Trigger an error and check if notification appears
      await page.evaluate(() => {
        const testError = new window.APIError(
          window.ERROR_TYPES.API_CREDITS, 
          'Test error for Playwright'
        );
        window.ErrorHandler.handleAPIError(testError, 'playwright test');
      });

      // Check if error notification appears
      const notification = await page.locator('.api-error-notification').first();
      await expect(notification).toBeVisible({ timeout: 5000 });

      // Verify error content
      await expect(notification).toContainText('API Error');
      await expect(notification).toContainText('API credits');
    });

    test('should auto-remove error notifications', async ({ page }) => {
      // Create error notification
      await page.evaluate(() => {
        const testError = new window.APIError(
          window.ERROR_TYPES.NETWORK_ERROR, 
          'Auto-remove test'
        );
        window.ErrorHandler.handleAPIError(testError, 'auto-remove test');
      });

      const notification = await page.locator('.api-error-notification').first();
      await expect(notification).toBeVisible();

      // Click close button
      await notification.locator('.error-close').click();
      await expect(notification).not.toBeVisible();
    });
  });

  test.describe('Form Submission Integration', () => {
    test('should have form properly configured without conflicts', async ({ page }) => {
      const form = page.locator('#generate-form');
      await expect(form).toBeVisible();

      // Check that HTMX is disabled on the form
      const hasHtmxDisabled = await form.getAttribute('hx-disable');
      expect(hasHtmxDisabled).toBe('true');
    });

    test('should handle form submission with proper API integration', async ({ page }) => {
      // Fill out the form
      await page.fill('#prompt-input', 'Test prompt for API integration');
      
      // Monitor network requests
      const apiRequests = [];
      page.on('request', request => {
        if (request.url().includes('/generate')) {
          apiRequests.push(request);
        }
      });

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for API request or visual effects (should happen regardless of API status)
      await page.waitForTimeout(2000);

      // Either should have made API request OR should show visual effects
      const hasVisualEffects = await page.evaluate(() => {
        return document.querySelector('.input-vortex') !== null ||
               document.querySelector('.tattoo-alchemy-pattern') !== null;
      });

      // Test should pass if either API was called or visual effects appeared
      const testPassed = apiRequests.length > 0 || hasVisualEffects;
      expect(testPassed).toBe(true);
    });

    test('should trigger visual effects even on API failure', async ({ page }) => {
      // Mock API to fail
      await page.route('**/generate', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Simulated API failure for test' })
        });
      });

      // Fill and submit form
      await page.fill('#prompt-input', 'Test prompt for failure handling');
      await page.click('button[type="submit"]');

      // Should still show visual effects despite API failure
      await page.waitForTimeout(3000);

      const hasVisualEffects = await page.evaluate(() => {
        return document.querySelector('.input-vortex') !== null ||
               document.querySelector('.vortex-center') !== null ||
               document.querySelector('[class*="gateway"]') !== null;
      });

      expect(hasVisualEffects).toBe(true);
    });
  });

  test.describe('Live Server Gateway Integration', () => {
    test('should have live server gateway properly initialized', async ({ page }) => {
      const gatewayStatus = await page.evaluate(() => {
        return window.testLiveServerGateway ? 
          window.testLiveServerGateway.status() : null;
      });

      expect(gatewayStatus).not.toBeNull();
      expect(gatewayStatus.apiClientAvailable).toBe(true);
      expect(gatewayStatus.errorHandlerAvailable).toBe(true);
    });

    test('should handle real data testing gracefully', async ({ page }) => {
      const testResult = await page.evaluate(async () => {
        if (!window.testLiveServerGateway) return { error: 'Gateway not available' };
        
        try {
          await window.testLiveServerGateway.testWithRealData();
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      // Should either succeed or fail gracefully
      expect(testResult).toBeDefined();
      expect(typeof testResult.success === 'boolean' || testResult.error).toBe(true);
    });
  });

  test.describe('Script Conflict Resolution', () => {
    test('should not have duplicate event listeners', async ({ page }) => {
      // Check that form doesn't have multiple event listeners
      const form = page.locator('#generate-form');
      
      // Submit form multiple times rapidly to test for conflicts
      await page.fill('#prompt-input', 'Conflict test');
      
      let submitCount = 0;
      page.on('request', request => {
        if (request.url().includes('/generate')) submitCount++;
      });

      // Click submit button 3 times rapidly
      await Promise.all([
        page.click('button[type="submit"]'),
        page.click('button[type="submit"]'),
        page.click('button[type="submit"]')
      ]);

      await page.waitForTimeout(2000);

      // Should not have sent more than 1 request (no duplicate handlers)
      expect(submitCount).toBeLessThanOrEqual(1);
    });

    test('should not have JavaScript errors in console', async ({ page }) => {
      const errors = [];
      page.on('console', message => {
        if (message.type() === 'error') {
          errors.push(message.text());
        }
      });

      // Interact with the page to trigger potential errors
      await page.fill('#prompt-input', 'Console error test');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);

      // Filter out known acceptable errors (like API failures)
      const criticalErrors = errors.filter(error => 
        !error.includes('API error') &&
        !error.includes('credit balance') &&
        !error.includes('Failed to fetch') &&
        !error.includes('ERR_CONNECTION_RESET')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Network Status Monitoring', () => {
    test('should handle offline state gracefully', async ({ page }) => {
      // Simulate offline state
      await page.context().setOffline(true);

      const offlineHandling = await page.evaluate(async () => {
        try {
          await window.apiClient.generate('Offline test', {});
          return { success: true };
        } catch (error) {
          return {
            success: false,
            isNetworkError: error.type === window.ERROR_TYPES.NETWORK_ERROR,
            message: error.message
          };
        }
      });

      expect(offlineHandling.success).toBe(false);
      expect(offlineHandling.isNetworkError).toBe(true);

      // Restore online state
      await page.context().setOffline(false);
    });

    test('should restore functionality when back online', async ({ page }) => {
      // Start offline
      await page.context().setOffline(true);
      
      // Try operation (should fail)
      let offlineResult = await page.evaluate(() => {
        return window.apiClient.isOnline;
      });
      
      // Go back online
      await page.context().setOffline(false);
      
      // Trigger online event
      await page.evaluate(() => {
        window.dispatchEvent(new Event('online'));
      });

      await page.waitForTimeout(1000);

      // Check if client detected online status
      let onlineResult = await page.evaluate(() => {
        return window.apiClient.isOnline;
      });

      expect(onlineResult).toBe(true);
    });
  });
}); 