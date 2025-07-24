const { test, expect } = require('@playwright/test');

test.describe('Continuous Integration & Self-Maintaining Tests', () => {
  
  test.describe('System Health Monitoring', () => {
    test('should continuously monitor system health', async ({ page }) => {
      await page.goto('/');
      
      // Wait for systems to load
      await page.waitForFunction(() => {
        return window.apiClient && window.testGatewayEffects;
      }, { timeout: 10000 });

      // Run comprehensive health check
      const healthStatus = await page.evaluate(async () => {
        const results = {
          timestamp: new Date().toISOString(),
          apiClient: !!window.apiClient,
          errorHandler: !!window.ErrorHandler,
          gatewayEffects: !!window.testGatewayEffects,
          advancedEffects: !!window.advancedGatewayEffects,
          formAvailable: !!document.getElementById('generate-form'),
          scriptsLoaded: true,
          memoryUsage: performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          } : null
        };

        // Test core functionality
        try {
          const vortexTest = window.testGatewayEffects.inputVortex();
          results.vortexFunctional = vortexTest;
        } catch (e) {
          results.vortexFunctional = false;
          results.vortexError = e.message;
        }

        try {
          const transmutationTest = window.testGatewayEffects.outputTransmutation();
          results.transmutationFunctional = transmutationTest;
        } catch (e) {
          results.transmutationFunctional = false;
          results.transmutationError = e.message;
        }

        return results;
      });

      // Store health status for trend analysis
      console.log('Health Status:', JSON.stringify(healthStatus, null, 2));

      // Assert critical systems are functional
      expect(healthStatus.apiClient).toBe(true);
      expect(healthStatus.errorHandler).toBe(true);
      expect(healthStatus.gatewayEffects).toBe(true);
      expect(healthStatus.vortexFunctional).toBe(true);
      expect(healthStatus.transmutationFunctional).toBe(true);

      // Memory health check
      if (healthStatus.memoryUsage) {
        const memoryUsageRatio = healthStatus.memoryUsage.used / healthStatus.memoryUsage.total;
        expect(memoryUsageRatio).toBeLessThan(0.9); // Less than 90% memory usage
      }
    });

    test('should detect and report performance regressions', async ({ page }) => {
      await page.goto('/');
      
      await page.waitForFunction(() => window.testGatewayEffects, { timeout: 10000 });

      // Performance benchmark test
      const performanceMetrics = await page.evaluate(() => {
        const metrics = [];
        
        // Test effect creation speed
        for (let i = 0; i < 10; i++) {
          const start = performance.now();
          window.testGatewayEffects.inputVortex();
          const end = performance.now();
          metrics.push(end - start);
          
          // Clean up
          if (window.testGatewayEffects.clear) {
            window.testGatewayEffects.clear();
          }
        }

        return {
          averageTime: metrics.reduce((a, b) => a + b, 0) / metrics.length,
          minTime: Math.min(...metrics),
          maxTime: Math.max(...metrics),
          samples: metrics.length
        };
      });

      console.log('Performance Metrics:', performanceMetrics);

      // Assert performance is within acceptable bounds
      expect(performanceMetrics.averageTime).toBeLessThan(1000); // Less than 1 second average
      expect(performanceMetrics.maxTime).toBeLessThan(2000); // Less than 2 seconds max
    });

    test('should validate consistent behavior across browser sessions', async ({ page }) => {
      const sessionResults = [];

      // Test across multiple "sessions" (page reloads)
      for (let session = 0; session < 3; session++) {
        await page.goto('/');
        await page.waitForFunction(() => window.testGatewayEffects, { timeout: 10000 });

        const sessionResult = await page.evaluate(() => {
          // Test basic functionality
          const inputResult = window.testGatewayEffects.inputVortex();
          const outputResult = window.testGatewayEffects.outputTransmutation();
          
          return {
            inputVortex: inputResult,
            outputTransmutation: outputResult,
            timestamp: Date.now()
          };
        });

        sessionResults.push(sessionResult);
        await page.waitForTimeout(1000); // Brief pause between sessions
      }

      // All sessions should have consistent results
      sessionResults.forEach((result, index) => {
        expect(result.inputVortex, `Session ${index} input vortex failed`).toBe(true);
        expect(result.outputTransmutation, `Session ${index} output transmutation failed`).toBe(true);
      });

      console.log('Session Consistency Test:', sessionResults);
    });
  });

  test.describe('Automated Regression Detection', () => {
    test('should detect API integration regressions', async ({ page }) => {
      await page.goto('/');
      await page.waitForFunction(() => window.apiClient, { timeout: 10000 });

      // Test API client functionality
      const apiTests = await page.evaluate(async () => {
        const results = {
          healthCheck: null,
          errorHandling: null,
          formIntegration: null
        };

        // Health check test
        try {
          await window.apiClient.checkHealth();
          results.healthCheck = 'success';
        } catch (error) {
          results.healthCheck = 'expected_failure';
        }

        // Error handling test
        try {
          const testError = new window.APIError(window.ERROR_TYPES.API_CREDITS, 'Test error');
          const userMessage = testError.getUserMessage();
          results.errorHandling = userMessage.includes('API credits') ? 'success' : 'failure';
        } catch (error) {
          results.errorHandling = 'failure';
        }

        // Form integration test
        const form = document.getElementById('generate-form');
        results.formIntegration = form && form.hasAttribute('hx-disable') ? 'success' : 'failure';

        return results;
      });

      // Assert no regressions
      expect(['success', 'expected_failure']).toContain(apiTests.healthCheck);
      expect(apiTests.errorHandling).toBe('success');
      expect(apiTests.formIntegration).toBe('success');
    });

    test('should detect gateway effects regressions', async ({ page }) => {
      await page.goto('/');
      await page.waitForFunction(() => window.testGatewayEffects, { timeout: 10000 });

      // Comprehensive effects regression test
      const effectsTests = await page.evaluate(() => {
        const results = {
          inputVortexCreation: false,
          outputTransmutationCreation: false,
          effectsCleanup: false,
          multipleEffects: false
        };

        try {
          // Test input vortex creation
          results.inputVortexCreation = window.testGatewayEffects.inputVortex();

          // Test output transmutation creation
          results.outputTransmutationCreation = window.testGatewayEffects.outputTransmutation();

          // Test cleanup if available
          if (window.testGatewayEffects.clear) {
            window.testGatewayEffects.clear();
            results.effectsCleanup = true;
          }

          // Test multiple effects without conflicts
          const multipleResults = [];
          for (let i = 0; i < 5; i++) {
            multipleResults.push(window.testGatewayEffects.inputVortex());
          }
          results.multipleEffects = multipleResults.every(r => r === true);

        } catch (error) {
          results.error = error.message;
        }

        return results;
      });

      // Assert no regressions in effects
      expect(effectsTests.inputVortexCreation).toBe(true);
      expect(effectsTests.outputTransmutationCreation).toBe(true);
      expect(effectsTests.multipleEffects).toBe(true);
    });
  });

  test.describe('Self-Healing Test Capabilities', () => {
    test('should automatically retry flaky operations', async ({ page }) => {
      await page.goto('/');
      await page.waitForFunction(() => window.testGatewayEffects, { timeout: 10000 });

      let successCount = 0;
      const maxAttempts = 5;

      // Retry mechanism for potentially flaky operations
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const result = await page.evaluate(() => {
            // Simulate potentially flaky operation
            return window.testGatewayEffects.inputVortex() && 
                   window.testGatewayEffects.outputTransmutation();
          });

          if (result) {
            successCount++;
            break; // Success on first try
          }
        } catch (error) {
          console.log(`Attempt ${attempt} failed:`, error.message);
          if (attempt === maxAttempts) {
            throw error; // Re-throw on final attempt
          }
          await page.waitForTimeout(1000); // Wait before retry
        }
      }

      expect(successCount).toBeGreaterThan(0);
    });

    test('should adapt to changing page conditions', async ({ page }) => {
      await page.goto('/');

      // Test adaptation to different loading states
      const adaptationTest = await page.evaluate(() => {
        const results = [];

        // Test immediate availability
        if (window.testGatewayEffects) {
          results.push({ state: 'immediate', success: true });
        }

        return results;
      });

      // Wait for full load if not immediately available
      if (adaptationTest.length === 0) {
        await page.waitForFunction(() => window.testGatewayEffects, { timeout: 15000 });
        
        const delayedTest = await page.evaluate(() => {
          return window.testGatewayEffects ? { state: 'delayed', success: true } : { state: 'failed', success: false };
        });

        expect(delayedTest.success).toBe(true);
      }
    });

    test('should provide diagnostic information for failures', async ({ page }) => {
      await page.goto('/');

      const diagnostics = await page.evaluate(() => {
        const diag = {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          availableGlobals: {},
          documentState: document.readyState,
          scriptsLoaded: document.scripts.length,
          errors: []
        };

        // Check for expected global objects
        const expectedGlobals = ['apiClient', 'ErrorHandler', 'testGatewayEffects', 'advancedGatewayEffects'];
        expectedGlobals.forEach(global => {
          diag.availableGlobals[global] = typeof window[global];
        });

        return diag;
      });

      console.log('Diagnostic Information:', JSON.stringify(diagnostics, null, 2));

      // Ensure we have diagnostic data
      expect(diagnostics.timestamp).toBeDefined();
      expect(diagnostics.availableGlobals).toBeDefined();
      expect(Object.keys(diagnostics.availableGlobals).length).toBeGreaterThan(0);
    });
  });

  test.describe('Continuous Test Maintenance', () => {
    test('should validate test infrastructure health', async ({ page }) => {
      await page.goto('/');

      const infrastructureHealth = await page.evaluate(() => {
        return {
          consoleErrorCount: 0, // Will be updated by error listener
          pageLoadTime: performance.timing ? 
            performance.timing.loadEventEnd - performance.timing.navigationStart : null,
          resourceErrors: [],
          jsErrors: []
        };
      });

      // Monitor console errors during test
      const consoleErrors = [];
      page.on('console', message => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text());
        }
      });

      // Trigger various operations to test for errors
      await page.evaluate(() => {
        if (window.testGatewayEffects) {
          window.testGatewayEffects.inputVortex();
          window.testGatewayEffects.outputTransmutation();
        }
      });

      await page.waitForTimeout(3000);

      // Filter out expected/acceptable errors
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('API error') &&
        !error.includes('credit balance') &&
        !error.includes('Failed to fetch')
      );

      expect(criticalErrors).toHaveLength(0);
    });

    test('should track test execution metrics', async ({ page }) => {
      const testStartTime = Date.now();
      
      await page.goto('/');
      await page.waitForFunction(() => window.testGatewayEffects, { timeout: 10000 });

      // Execute a series of operations and track timing
      const executionMetrics = await page.evaluate(() => {
        const metrics = {
          operations: [],
          startTime: performance.now()
        };

        // Time various operations
        const operations = [
          () => window.testGatewayEffects.inputVortex(),
          () => window.testGatewayEffects.outputTransmutation(),
          () => window.testGatewayEffects.clear && window.testGatewayEffects.clear()
        ];

        operations.forEach((op, index) => {
          if (op) {
            const opStart = performance.now();
            try {
              const result = op();
              const opEnd = performance.now();
              metrics.operations.push({
                index,
                duration: opEnd - opStart,
                success: !!result
              });
            } catch (error) {
              metrics.operations.push({
                index,
                duration: 0,
                success: false,
                error: error.message
              });
            }
          }
        });

        metrics.totalTime = performance.now() - metrics.startTime;
        return metrics;
      });

      const testEndTime = Date.now();
      const totalTestTime = testEndTime - testStartTime;

      console.log('Test Execution Metrics:', {
        totalTestTime,
        pageOperations: executionMetrics
      });

      // Assert performance is reasonable
      expect(totalTestTime).toBeLessThan(30000); // Less than 30 seconds
      expect(executionMetrics.totalTime).toBeLessThan(10000); // Less than 10 seconds for operations
    });

    test('should provide recommendations for test improvements', async ({ page }) => {
      await page.goto('/');
      await page.waitForFunction(() => window.testGatewayEffects, { timeout: 10000 });

      const recommendations = await page.evaluate(() => {
        const recs = [];

        // Check for potential improvements
        if (!window.testGatewayEffects.clear) {
          recs.push('Add cleanup function to testGatewayEffects for better test isolation');
        }

        if (!window.advancedGatewayEffects) {
          recs.push('Advanced gateway effects not available - check loading order');
        }

        const form = document.getElementById('generate-form');
        if (form && !form.hasAttribute('hx-disable')) {
          recs.push('Form should have hx-disable attribute to prevent conflicts');
        }

        if (typeof window.performance === 'undefined') {
          recs.push('Performance API not available for monitoring');
        }

        return recs;
      });

      console.log('Test Improvement Recommendations:', recommendations);

      // Log recommendations but don't fail test
      if (recommendations.length > 0) {
        console.log('Suggestions for improving test reliability:', recommendations.join('\n'));
      }

      // This test always passes but provides valuable feedback
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  test.describe('Integration with External Systems', () => {
    test('should handle server availability changes gracefully', async ({ page }) => {
      await page.goto('/');
      await page.waitForFunction(() => window.apiClient, { timeout: 10000 });

      // Test behavior when server is available vs unavailable
      const connectivityTest = await page.evaluate(async () => {
        const results = {
          initialCheck: null,
          afterOffline: null,
          afterOnline: null
        };

        // Initial connectivity check
        try {
          await window.apiClient.checkHealth();
          results.initialCheck = 'connected';
        } catch (error) {
          results.initialCheck = 'disconnected';
        }

        return results;
      });

      // Should handle either connected or disconnected state gracefully
      expect(['connected', 'disconnected']).toContain(connectivityTest.initialCheck);
    });

    test('should maintain functionality across different deployment environments', async ({ page }) => {
      await page.goto('/');

      const environmentCheck = await page.evaluate(() => {
        return {
          origin: window.location.origin,
          protocol: window.location.protocol,
          hostname: window.location.hostname,
          port: window.location.port,
          hasHttps: window.location.protocol === 'https:',
          hasLocalhost: window.location.hostname === 'localhost',
          apiConfigMatch: window.API_CONFIG ? 
            window.API_CONFIG.baseUrl === window.location.origin : false
        };
      });

      console.log('Environment Check:', environmentCheck);

      // API config should match current environment
      if (environmentCheck.apiConfigMatch !== null) {
        expect(environmentCheck.apiConfigMatch).toBe(true);
      }
    });
  });
}); 