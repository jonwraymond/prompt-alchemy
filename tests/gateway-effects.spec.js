const { test, expect } = require('@playwright/test');

test.describe('Gateway Effects Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for all gateway effect systems to load
    await page.waitForFunction(() => {
      return window.testGatewayEffects && 
             window.advancedGatewayEffects &&
             window.createInputVortex &&
             window.createOutputTransmutation;
    }, { timeout: 15000 });
  });

  test.describe('Input Gateway (Vortex) Effects', () => {
    test('should create input vortex effect successfully', async ({ page }) => {
      const vortexResult = await page.evaluate(() => {
        return window.testGatewayEffects.inputVortex();
      });

      expect(vortexResult).toBe(true);

      // Verify vortex elements are created
      const vortexExists = await page.locator('.input-vortex').first();
      await expect(vortexExists).toBeVisible({ timeout: 5000 });

      // Check for vortex components
      await expect(page.locator('.vortex-center')).toBeVisible();
      await expect(page.locator('.vortex-ring')).toBeVisible();
    });

    test('should animate input vortex with particles', async ({ page }) => {
      // Trigger vortex
      await page.evaluate(() => window.testGatewayEffects.inputVortex());

      // Wait for animation to start
      await page.waitForTimeout(1000);

      // Check for particle elements
      const particles = await page.locator('.input-particle').count();
      expect(particles).toBeGreaterThan(0);

      // Verify particles are animating (positions should change)
      const initialParticle = await page.locator('.input-particle').first();
      const initialTransform = await initialParticle.getAttribute('style');
      
      await page.waitForTimeout(2000);
      
      const updatedTransform = await initialParticle.getAttribute('style');
      // Transform should be different after animation
      expect(initialTransform).not.toBe(updatedTransform);
    });

    test('should trigger input effects on form submission', async ({ page }) => {
      // Fill form
      await page.fill('#prompt-input', 'Test prompt for input effects');
      
      // Submit form (should trigger input vortex)
      await page.click('button[type="submit"]');
      
      // Verify input effects appear
      await expect(page.locator('.input-vortex, .input-active')).toBeVisible({ timeout: 5000 });
    });

    test('should handle multiple rapid vortex triggers without conflicts', async ({ page }) => {
      // Trigger multiple vortex effects rapidly
      const results = await page.evaluate(() => {
        const results = [];
        for (let i = 0; i < 5; i++) {
          results.push(window.testGatewayEffects.inputVortex());
        }
        return results;
      });

      // All should succeed
      results.forEach(result => expect(result).toBe(true));

      // Should only have one active vortex (no duplicates)
      const vortexCount = await page.locator('.input-vortex').count();
      expect(vortexCount).toBeLessThanOrEqual(1);
    });
  });

  test.describe('Output Gateway (Tattoo) Effects', () => {
    test('should create output transmutation effect successfully', async ({ page }) => {
      const transmutationResult = await page.evaluate(() => {
        return window.testGatewayEffects.outputTransmutation();
      });

      expect(transmutationResult).toBe(true);

      // Verify tattoo elements are created
      await expect(page.locator('.tattoo-alchemy-pattern, .output-tattoo-active')).toBeVisible({ timeout: 5000 });
    });

    test('should create golden radiant burst effects', async ({ page }) => {
      await page.evaluate(() => window.testGatewayEffects.outputTransmutation());

      // Wait for effects to develop
      await page.waitForTimeout(2000);

      // Check for radiant burst elements
      const burstElements = await page.locator('.radiant-burst, .radiant-ray').count();
      expect(burstElements).toBeGreaterThan(0);
    });

    test('should create golden sparkles and completion crown', async ({ page }) => {
      await page.evaluate(() => window.testGatewayEffects.outputTransmutation());

      // Wait for full effect sequence
      await page.waitForTimeout(5000);

      // Check for sparkles
      const sparkles = await page.locator('.golden-sparkle').count();
      expect(sparkles).toBeGreaterThan(0);

      // Check for completion crown effect
      const crownEffect = await page.locator('.tattoo-complete').count();
      expect(crownEffect).toBeGreaterThan(0);
    });

    test('should trigger tattoo effect in complete animation flow', async ({ page }) => {
      // Start with input, then trigger complete flow
      await page.evaluate(() => {
        window.testGatewayEffects.inputVortex();
        setTimeout(() => {
          window.testGatewayEffects.outputTransmutation();
        }, 1000);
      });

      // Verify both effects are active
      await expect(page.locator('.input-vortex')).toBeVisible();
      await expect(page.locator('.tattoo-alchemy-pattern, .output-tattoo-active')).toBeVisible({ timeout: 6000 });
    });
  });

  test.describe('Advanced Gateway Effects Coordination', () => {
    test('should have advanced gateway effects system available', async ({ page }) => {
      const advancedSystemCheck = await page.evaluate(() => {
        return !!(window.advancedGatewayEffects &&
                 typeof window.advancedGatewayEffects.coordinateAdvanced === 'function' &&
                 typeof window.advancedGatewayEffects.fullDemo === 'function');
      });

      expect(advancedSystemCheck).toBe(true);
    });

    test('should run coordinated advanced effects', async ({ page }) => {
      const coordinationResult = await page.evaluate(() => {
        window.advancedGatewayEffects.coordinateAdvanced();
        return true;
      });

      expect(coordinationResult).toBe(true);

      // Wait for coordination sequence
      await page.waitForTimeout(3000);

      // Should have both input and output effects
      const inputEffects = await page.locator('.input-vortex, .input-active').count();
      const outputEffects = await page.locator('.tattoo-alchemy-pattern, .output-tattoo-active').count();

      expect(inputEffects + outputEffects).toBeGreaterThan(0);
    });

    test('should run full demo with performance monitoring', async ({ page }) => {
      // Start monitoring console logs for performance stats
      const performanceLogs = [];
      page.on('console', message => {
        if (message.text().includes('FPS:') || message.text().includes('Performance')) {
          performanceLogs.push(message.text());
        }
      });

      // Run full demo
      await page.evaluate(() => {
        window.advancedGatewayEffects.fullDemo();
      });

      // Wait for demo to complete
      await page.waitForTimeout(16000);

      // Should have performance monitoring logs
      expect(performanceLogs.length).toBeGreaterThan(0);
    });

    test('should handle energy transfer effects between nodes', async ({ page }) => {
      const energyTransferResult = await page.evaluate(() => {
        if (window.advancedGatewayEffects.energyTransfer) {
          window.advancedGatewayEffects.energyTransfer('input', 'output');
          return true;
        }
        return false;
      });

      if (energyTransferResult) {
        // Wait for energy transfer animation
        await page.waitForTimeout(2000);

        // Check for energy transfer elements
        const transferElements = await page.locator('.energy-bolt, .impact-burst').count();
        expect(transferElements).toBeGreaterThan(0);
      }
    });

    test('should create completion celebration effects', async ({ page }) => {
      const celebrationResult = await page.evaluate(() => {
        if (window.advancedGatewayEffects.celebrate) {
          window.advancedGatewayEffects.celebrate();
          return true;
        }
        return false;
      });

      if (celebrationResult) {
        // Wait for celebration
        await page.waitForTimeout(3000);

        // Check for celebration elements
        const celebrationElements = await page.locator('.celebration-particle, .screen-flash').count();
        expect(celebrationElements).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Gateway Effects Performance', () => {
    test('should not cause memory leaks with repeated effects', async ({ page }) => {
      // Measure initial DOM nodes
      const initialNodeCount = await page.evaluate(() => document.querySelectorAll('*').length);

      // Trigger effects multiple times
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => {
          window.testGatewayEffects.inputVortex();
          setTimeout(() => window.testGatewayEffects.outputTransmutation(), 500);
        });
        await page.waitForTimeout(1000);
      }

      // Clean up
      await page.evaluate(() => {
        if (window.testGatewayEffects.clear) {
          window.testGatewayEffects.clear();
        }
      });

      await page.waitForTimeout(2000);

      // Check final DOM node count
      const finalNodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
      
      // Should not have significantly more nodes (allowing for some variance)
      expect(finalNodeCount).toBeLessThan(initialNodeCount + 100);
    });

    test('should handle high-frequency effect triggers without breaking', async ({ page }) => {
      // Rapid-fire effect triggers
      const results = await page.evaluate(() => {
        const results = [];
        for (let i = 0; i < 50; i++) {
          setTimeout(() => {
            results.push(window.testGatewayEffects.inputVortex());
          }, i * 10); // Every 10ms
        }
        return new Promise(resolve => {
          setTimeout(() => resolve(results), 1000);
        });
      });

      // Wait for all effects to settle
      await page.waitForTimeout(3000);

      // Should not have broken the system
      const systemStillWorks = await page.evaluate(() => {
        return typeof window.testGatewayEffects.inputVortex === 'function';
      });

      expect(systemStillWorks).toBe(true);
    });

    test('should provide performance optimization suggestions', async ({ page }) => {
      const optimizationSuggestions = await page.evaluate(() => {
        if (window.advancedGatewayEffects && window.advancedGatewayEffects.optimize) {
          return window.advancedGatewayEffects.optimize();
        }
        return null;
      });

      if (optimizationSuggestions) {
        expect(Array.isArray(optimizationSuggestions)).toBe(true);
      }
    });
  });

  test.describe('Gateway Effects Integration with Form Submission', () => {
    test('should coordinate effects with real form submission flow', async ({ page }) => {
      // Fill form
      await page.fill('#prompt-input', 'Integration test prompt');

      // Monitor for both API calls and visual effects
      const apiRequests = [];
      page.on('request', request => {
        if (request.url().includes('/generate')) {
          apiRequests.push(request);
        }
      });

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for effects to appear
      await page.waitForTimeout(5000);

      // Should have visual effects regardless of API status
      const hasInputEffects = await page.locator('.input-vortex, .input-active').count();
      const hasOutputEffects = await page.locator('.tattoo-alchemy-pattern, .output-tattoo-active').count();

      expect(hasInputEffects + hasOutputEffects).toBeGreaterThan(0);
    });

    test('should maintain effects quality during API errors', async ({ page }) => {
      // Mock API to return error
      await page.route('**/generate', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'text/html',
          body: '<div>API error (500): {"error":"Simulated error for testing"}</div>'
        });
      });

      // Submit form
      await page.fill('#prompt-input', 'Error handling test');
      await page.click('button[type="submit"]');

      // Wait for effects
      await page.waitForTimeout(5000);

      // Visual effects should still work beautifully
      const vortexVisible = await page.locator('.input-vortex').isVisible();
      const tattooVisible = await page.locator('.tattoo-alchemy-pattern, .output-tattoo-active').count();

      expect(vortexVisible || tattooVisible > 0).toBe(true);
    });
  });

  test.describe('Gateway Effects Cleanup and State Management', () => {
    test('should properly clean up effects when requested', async ({ page }) => {
      // Create effects
      await page.evaluate(() => {
        window.testGatewayEffects.inputVortex();
        window.testGatewayEffects.outputTransmutation();
      });

      await page.waitForTimeout(2000);

      // Verify effects exist
      const effectsBefore = await page.locator('.input-vortex, .tattoo-alchemy-pattern').count();
      expect(effectsBefore).toBeGreaterThan(0);

      // Clean up
      await page.evaluate(() => {
        if (window.testGatewayEffects.clear) {
          window.testGatewayEffects.clear();
        }
      });

      await page.waitForTimeout(1000);

      // Verify cleanup
      const effectsAfter = await page.locator('.input-vortex, .tattoo-alchemy-pattern').count();
      expect(effectsAfter).toBeLessThan(effectsBefore);
    });

    test('should handle page reload without breaking', async ({ page }) => {
      // Create effects
      await page.evaluate(() => window.testGatewayEffects.inputVortex());
      await page.waitForTimeout(1000);

      // Reload page
      await page.reload();

      // Wait for systems to reinitialize
      await page.waitForFunction(() => {
        return window.testGatewayEffects && window.advancedGatewayEffects;
      }, { timeout: 10000 });

      // Effects should work after reload
      const postReloadResult = await page.evaluate(() => {
        return window.testGatewayEffects.inputVortex();
      });

      expect(postReloadResult).toBe(true);
    });
  });
}); 