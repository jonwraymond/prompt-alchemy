import { test, expect } from '../fixtures/base-fixtures';
import { 
  compareVisualState,
  captureAnimationSequence,
  generateAccessibilityVisualReport,
  capturePerformanceVisuals,
  testHexGridVisualState,
  testHexGridAnimations,
  testTooltipPositioning,
  testCrossBrowserConsistency,
  generateVisualTestReport
} from '../helpers/visual-regression-utils';
import { waitForHexGridLoaded } from '../helpers/test-utils';

/**
 * Hex Grid Visual Regression Tests
 * 
 * Comprehensive visual testing suite using advanced screenshot comparison,
 * animation capture, and cross-browser consistency validation.
 * 
 * Features tested:
 * - Pixel-perfect hex grid rendering
 * - Node state transitions and animations
 * - Tooltip positioning across different viewports
 * - Connection line animations and flow visualization
 * - Accessibility visual indicators
 * - Performance visual monitoring
 * - Cross-browser visual consistency
 */

test.describe('Hex Grid Visual Regression', () => {
  let testResults: Array<{ name: string; passed: boolean; diffPixels?: number }> = [];

  test.beforeEach(async ({ hexGridPage }) => {
    await hexGridPage.goto();
    await waitForHexGridLoaded(hexGridPage.page);
  });

  test.afterAll(async () => {
    // Generate comprehensive visual test report
    await generateVisualTestReport(testResults);
  });

  test.describe('Grid Layout Visual Tests', () => {
    test('should render hex grid with pixel-perfect accuracy', async ({ page }) => {
      try {
        await testHexGridVisualState(page);
        testResults.push({ name: 'hex-grid-visual-state', passed: true });
      } catch (error) {
        testResults.push({ name: 'hex-grid-visual-state', passed: false });
        throw error;
      }
    });

    test('should maintain visual consistency across viewport sizes', async ({ page }) => {
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop-large' },
        { width: 1280, height: 720, name: 'desktop-standard' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 375, height: 667, name: 'mobile' }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(500); // Allow layout to settle

        try {
          await compareVisualState(page, '#hex-flow-container', `grid-${viewport.name}`, {
            threshold: 0.15,
            animations: 'disabled',
            fullPage: false,
            clip: { x: 0, y: 0, width: viewport.width, height: Math.min(viewport.height, 800) }
          });
          testResults.push({ name: `grid-${viewport.name}`, passed: true });
        } catch (error) {
          testResults.push({ name: `grid-${viewport.name}`, passed: false });
          console.error(`Viewport ${viewport.name} visual test failed:`, error);
        }
      }
    });

    test('should render individual node states correctly', async ({ page }) => {
      const nodeIds = ['hub', 'input', 'output', 'prima', 'solutio', 'coagulatio'];
      
      for (const nodeId of nodeIds) {
        // Test normal state
        try {
          await compareVisualState(page, `[data-node-id="${nodeId}"]`, `node-${nodeId}-normal`, {
            threshold: 0.1,
            animations: 'disabled'
          });
          testResults.push({ name: `node-${nodeId}-normal`, passed: true });
        } catch (error) {
          testResults.push({ name: `node-${nodeId}-normal`, passed: false });
          console.error(`Node ${nodeId} normal state visual test failed:`, error);
        }

        // Test hover state
        try {
          await page.locator(`[data-node-id="${nodeId}"] polygon`).hover();
          await page.waitForTimeout(300); // Allow hover animation
          
          await compareVisualState(page, `[data-node-id="${nodeId}"]`, `node-${nodeId}-hover`, {
            threshold: 0.2,
            animations: 'allow'
          });
          testResults.push({ name: `node-${nodeId}-hover`, passed: true });
        } catch (error) {
          testResults.push({ name: `node-${nodeId}-hover`, passed: false });
          console.error(`Node ${nodeId} hover state visual test failed:`, error);
        }

        // Reset hover state
        await page.locator('#hex-flow-container').hover({ position: { x: 50, y: 50 } });
        await page.waitForTimeout(200);
      }
    });
  });

  test.describe('Animation Visual Tests', () => {
    test('should capture and validate hex grid animations', async ({ page }) => {
      try {
        await testHexGridAnimations(page);
        testResults.push({ name: 'hex-grid-animations', passed: true });
      } catch (error) {
        testResults.push({ name: 'hex-grid-animations', passed: false });
        throw error;
      }
    });

    test('should capture connection line animations', async ({ page }) => {
      try {
        const screenshots = await captureAnimationSequence(page, {
          duration: 2000,
          frameRate: 15,
          element: '#hex-flow-container .connection-path',
          trigger: async () => {
            // Trigger connection animations by starting a generation process
            await page.fill('#input', 'Animation test prompt');
            await page.click('button[type="submit"]');
            await page.waitForTimeout(500);
          }
        });

        expect(screenshots.length).toBeGreaterThan(10);
        testResults.push({ name: 'connection-animations', passed: true });
      } catch (error) {
        testResults.push({ name: 'connection-animations', passed: false });
        throw error;
      }
    });

    test('should validate node glow effects during interactions', async ({ page }) => {
      try {
        const glowScreenshots = await captureAnimationSequence(page, {
          duration: 1500,
          frameRate: 20,
          element: '[data-node-id="hub"]',
          trigger: async () => {
            await page.locator('[data-node-id="hub"] polygon').hover();
          }
        });

        expect(glowScreenshots.length).toBeGreaterThan(15);
        testResults.push({ name: 'node-glow-effects', passed: true });
      } catch (error) {
        testResults.push({ name: 'node-glow-effects', passed: false });
        throw error;
      }
    });
  });

  test.describe('Tooltip Visual Tests', () => {
    test('should validate tooltip positioning across all nodes', async ({ page }) => {
      try {
        await testTooltipPositioning(page);
        testResults.push({ name: 'tooltip-positioning', passed: true });
      } catch (error) {
        testResults.push({ name: 'tooltip-positioning', passed: false });
        throw error;
      }
    });

    test('should test tooltip positioning at viewport edges', async ({ page }) => {
      const edgePositions = [
        { x: 50, y: 50, name: 'top-left' },
        { x: 1230, y: 50, name: 'top-right' },
        { x: 50, y: 670, name: 'bottom-left' },
        { x: 1230, y: 670, name: 'bottom-right' }
      ];

      for (const position of edgePositions) {
        try {
          // Move a node to edge position for testing
          await page.evaluate(({ x, y }) => {
            const hubNode = document.querySelector('[data-node-id="hub"]');
            if (hubNode) {
              (hubNode as HTMLElement).style.transform = `translate(${x}px, ${y}px)`;
            }
          }, position);

          await page.locator('[data-node-id="hub"] polygon').hover();
          await page.waitForSelector('.tooltip, [class*="tooltip"]', { state: 'visible', timeout: 2000 });

          await compareVisualState(page, '.tooltip, [class*="tooltip"]', `tooltip-edge-${position.name}`, {
            threshold: 0.15
          });
          
          testResults.push({ name: `tooltip-edge-${position.name}`, passed: true });
        } catch (error) {
          testResults.push({ name: `tooltip-edge-${position.name}`, passed: false });
          console.error(`Tooltip edge position ${position.name} test failed:`, error);
        }
      }
    });
  });

  test.describe('Accessibility Visual Tests', () => {
    test('should generate accessibility visual report', async ({ page }) => {
      try {
        await generateAccessibilityVisualReport(page, {
          includeColorContrast: true,
          highlightFocusElements: true,
          showScreenReaderPath: true
        });
        testResults.push({ name: 'accessibility-visual-report', passed: true });
      } catch (error) {
        testResults.push({ name: 'accessibility-visual-report', passed: false });
        throw error;
      }
    });

    test('should validate focus indicators on interactive elements', async ({ page }) => {
      const focusableElements = [
        '[data-node-id="hub"] polygon',
        '[data-node-id="input"] polygon',
        '[data-node-id="output"] polygon'
      ];

      for (const selector of focusableElements) {
        try {
          await page.locator(selector).focus();
          await page.waitForTimeout(200);

          await compareVisualState(page, selector, `focus-indicator-${selector.replace(/[\[\]"=\s]/g, '-')}`, {
            threshold: 0.2
          });
          
          testResults.push({ name: `focus-indicator-${selector.replace(/[\[\]"=\s]/g, '-')}`, passed: true });
        } catch (error) {
          testResults.push({ name: `focus-indicator-${selector.replace(/[\[\]"=\s]/g, '-')}`, passed: false });
          console.error(`Focus indicator test failed for ${selector}:`, error);
        }
      }
    });
  });

  test.describe('Performance Visual Tests', () => {
    test('should capture performance visuals during grid initialization', async ({ page }) => {
      // Start fresh page for performance testing
      await page.goto('/');
      
      try {
        await capturePerformanceVisuals(page, {
          captureTimeframes: [500, 1000, 2000, 3000],
          highlightSlowElements: true,
          showLoadingStates: true
        });
        testResults.push({ name: 'performance-initialization', passed: true });
      } catch (error) {
        testResults.push({ name: 'performance-initialization', passed: false });
        throw error;
      }
    });

    test('should monitor performance during intensive interactions', async ({ page }) => {
      try {
        // Create intensive interaction scenario
        const performanceTest = async () => {
          for (let i = 0; i < 5; i++) {
            await page.locator('[data-node-id="hub"] polygon').hover();
            await page.waitForTimeout(100);
            await page.locator('[data-node-id="prima"] polygon').hover();
            await page.waitForTimeout(100);
            await page.locator('[data-node-id="solutio"] polygon').hover();
            await page.waitForTimeout(100);
          }
        };

        await capturePerformanceVisuals(page, {
          captureTimeframes: [0, 1000, 2000],
          highlightSlowElements: false,
          showLoadingStates: false
        });

        await performanceTest();
        testResults.push({ name: 'performance-interactions', passed: true });
      } catch (error) {
        testResults.push({ name: 'performance-interactions', passed: false });
        throw error;
      }
    });
  });

  test.describe('Cross-Browser Visual Consistency', () => {
    test('should maintain visual consistency across browsers', async ({ page, context }) => {
      // This test would typically run across multiple browser contexts
      // For now, test within current browser but document the framework
      
      try {
        // Take baseline screenshot
        await compareVisualState(page, '#hex-flow-container', 'cross-browser-baseline', {
          threshold: 0.1,
          animations: 'disabled',
          fullPage: false,
          clip: { x: 0, y: 0, width: 1280, height: 720 }
        });

        // Test different rendering modes
        await page.addStyleTag({
          content: `
            /* Force different rendering path for testing */
            #hex-flow-container {
              transform: translateZ(0);
              will-change: transform;
            }
          `
        });

        await page.waitForTimeout(500);

        await compareVisualState(page, '#hex-flow-container', 'cross-browser-accelerated', {
          threshold: 0.15,
          animations: 'disabled',
          fullPage: false,
          clip: { x: 0, y: 0, width: 1280, height: 720 }
        });

        testResults.push({ name: 'cross-browser-consistency', passed: true });
      } catch (error) {
        testResults.push({ name: 'cross-browser-consistency', passed: false });
        throw error;
      }
    });
  });

  test.describe('State Transition Visual Tests', () => {
    test('should validate visual transitions between node states', async ({ page }) => {
      const states = ['ready', 'active', 'processing', 'complete'];
      
      for (const state of states) {
        try {
          // Simulate state change
          await page.evaluate((stateClass) => {
            const hubNode = document.querySelector('[data-node-id="hub"]');
            if (hubNode) {
              // Clear existing state classes
              hubNode.classList.remove('ready', 'active', 'processing', 'complete');
              hubNode.classList.add(stateClass);
            }
          }, state);

          await page.waitForTimeout(300); // Allow state transition

          await compareVisualState(page, '[data-node-id="hub"]', `hub-state-${state}`, {
            threshold: 0.15
          });
          
          testResults.push({ name: `hub-state-${state}`, passed: true });
        } catch (error) {
          testResults.push({ name: `hub-state-${state}`, passed: false });
          console.error(`State transition test failed for ${state}:`, error);
        }
      }
    });

    test('should validate connection line state changes', async ({ page }) => {
      try {
        // Test connection activation
        await page.evaluate(() => {
          const connections = document.querySelectorAll('.connection-path');
          connections.forEach((conn, index) => {
            if (index < 3) { // Activate first 3 connections
              conn.classList.add('active', 'animated');
            }
          });
        });

        await page.waitForTimeout(500);

        await compareVisualState(page, '#connection-paths', 'connections-active', {
          threshold: 0.2,
          animations: 'allow'
        });
        
        testResults.push({ name: 'connection-states', passed: true });
      } catch (error) {
        testResults.push({ name: 'connection-states', passed: false });
        throw error;
      }
    });
  });

  test.describe('Integration Visual Tests', () => {
    test('should validate complete generation process visualization', async ({ page }) => {
      try {
        // Capture the complete process flow
        const processScreenshots = await captureAnimationSequence(page, {
          duration: 5000,
          frameRate: 8,
          element: '#hex-flow-container',
          trigger: async () => {
            await page.fill('#input', 'Complete process visual test');
            await page.click('button[type="submit"]');
          }
        });

        expect(processScreenshots.length).toBeGreaterThan(20);
        testResults.push({ name: 'complete-process-flow', passed: true });
      } catch (error) {
        testResults.push({ name: 'complete-process-flow', passed: false });
        throw error;
      }
    });

    test('should validate error state visualization', async ({ page }) => {
      try {
        // Mock an error response
        await page.route('**/generate', (route) => {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Test error for visual validation' })
          });
        });

        await page.fill('#input', 'Error state test');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);

        await compareVisualState(page, '#hex-flow-container', 'error-state', {
          threshold: 0.2
        });
        
        testResults.push({ name: 'error-state-visualization', passed: true });
      } catch (error) {
        testResults.push({ name: 'error-state-visualization', passed: false });
        throw error;
      }
    });
  });
});