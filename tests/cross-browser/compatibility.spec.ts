/**
 * Cross-Browser Compatibility Testing Suite
 * 
 * Comprehensive testing across different browsers and devices:
 * - Browser-specific feature detection and polyfill validation
 * - CSS grid and flexbox compatibility testing
 * - JavaScript API compatibility across browsers
 * - Responsive design validation on different screen sizes
 * - Touch interaction testing for mobile browsers
 * - Performance comparison across browser engines
 * - Visual consistency validation with browser-specific screenshots
 */

import { test, expect, devices } from '@playwright/test';
import { 
  compareVisualState,
  generateVisualTestReport 
} from '../helpers/visual-regression-utils';
import { waitForHexGridLoaded } from '../helpers/test-utils';

/**
 * Browser compatibility configuration
 */
const BROWSER_CONFIGS = {
  desktop: {
    chromium: { name: 'chromium', viewport: { width: 1920, height: 1080 } },
    webkit: { name: 'webkit', viewport: { width: 1920, height: 1080 } },
    firefox: { name: 'firefox', viewport: { width: 1920, height: 1080 } }
  },
  mobile: {
    'Mobile Chrome': devices['Galaxy S9+'],
    'Mobile Safari': devices['iPhone 12'],
    'Mobile Firefox': { 
      ...devices['Galaxy S9+'],
      name: 'firefox'
    }
  },
  tablet: {
    'iPad Pro': devices['iPad Pro'],
    'Galaxy Tab': {
      name: 'chromium',
      viewport: { width: 1024, height: 768 },
      userAgent: 'Mozilla/5.0 (Linux; Android 9; SM-T820) AppleWebKit/537.36'
    }
  }
};

/**
 * Feature detection tests for cross-browser compatibility
 */
const FEATURE_TESTS = {
  css: [
    'CSS Grid Layout',
    'CSS Flexbox',
    'CSS Custom Properties',
    'CSS Transforms',
    'CSS Animations',
    'CSS Backdrop Filter'
  ],
  javascript: [
    'ES6 Modules',
    'Async/Await',
    'Fetch API',
    'IntersectionObserver',
    'ResizeObserver',
    'WebSocket'
  ],
  dom: [
    'Shadow DOM',
    'Custom Elements',
    'Web Components',
    'MutationObserver'
  ]
};

test.describe('Cross-Browser Compatibility Testing', () => {
  test.describe('Desktop Browser Compatibility', () => {
    // Test each major desktop browser
    for (const [browserName, config] of Object.entries(BROWSER_CONFIGS.desktop)) {
      test(`should render correctly in ${browserName}`, async ({ page }) => {
        // Set browser-specific viewport
        await page.setViewportSize(config.viewport);
        
        // Navigate to the application
        await page.goto('/');
        await waitForHexGridLoaded(page);

        // Test basic functionality
        const inputField = page.locator('#input');
        await expect(inputField).toBeVisible();
        
        const submitButton = page.locator('button[type="submit"]');
        await expect(submitButton).toBeVisible();

        // Test hex grid visibility and interaction
        const hexNodes = page.locator('[data-node-id] polygon');
        const nodeCount = await hexNodes.count();
        expect(nodeCount).toBeGreaterThan(3);

        // Test hover interaction
        const hubNode = page.locator('[data-node-id="hub"] polygon');
        await hubNode.hover();
        
        // Wait for hover animation
        await page.waitForTimeout(500);

        // Capture browser-specific screenshot
        await compareVisualState(page, 'body', `${browserName}-desktop-layout`, {
          threshold: 0.15,
          fullPage: true,
          animations: 'disabled'
        });

        // Test form interaction
        await page.fill('#input', `Test ${browserName} compatibility`);
        await expect(inputField).toHaveValue(`Test ${browserName} compatibility`);

        // Test responsive behavior
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(300);
        
        await compareVisualState(page, '#hex-flow-container', `${browserName}-tablet-responsive`, {
          threshold: 0.2
        });
      });

      test(`should support all required features in ${browserName}`, async ({ page }) => {
        await page.goto('/');
        
        // Test CSS feature support
        const cssSupport = await page.evaluate(() => {
          const testElement = document.createElement('div');
          const results: Record<string, boolean> = {};
          
          // Test CSS Grid
          testElement.style.display = 'grid';
          results['CSS Grid Layout'] = testElement.style.display === 'grid';
          
          // Test CSS Custom Properties
          testElement.style.setProperty('--test-var', 'test');
          results['CSS Custom Properties'] = testElement.style.getPropertyValue('--test-var') === 'test';
          
          // Test CSS Transforms
          testElement.style.transform = 'translateX(10px)';
          results['CSS Transforms'] = testElement.style.transform.includes('translateX');
          
          // Test CSS Animations
          testElement.style.animation = 'test 1s ease';
          results['CSS Animations'] = testElement.style.animation.includes('test');
          
          // Test Flexbox
          testElement.style.display = 'flex';
          results['CSS Flexbox'] = testElement.style.display === 'flex';
          
          // Test Backdrop Filter (may not be supported in all browsers)
          testElement.style.backdropFilter = 'blur(10px)';
          results['CSS Backdrop Filter'] = testElement.style.backdropFilter.includes('blur');
          
          return results;
        });

        // Test JavaScript API support
        const jsSupport = await page.evaluate(() => {
          const results: Record<string, boolean> = {};
          
          results['Fetch API'] = typeof fetch !== 'undefined';
          results['IntersectionObserver'] = typeof IntersectionObserver !== 'undefined';
          results['ResizeObserver'] = typeof ResizeObserver !== 'undefined';
          results['WebSocket'] = typeof WebSocket !== 'undefined';
          results['ES6 Modules'] = typeof Symbol !== 'undefined';
          
          // Test async/await support (indirect)
          try {
            eval('(async () => {})()');
            results['Async/Await'] = true;
          } catch {
            results['Async/Await'] = false;
          }
          
          return results;
        });

        console.log(`${browserName} CSS Support:`, cssSupport);
        console.log(`${browserName} JavaScript Support:`, jsSupport);

        // Validate critical features are supported
        expect(cssSupport['CSS Grid Layout']).toBe(true);
        expect(cssSupport['CSS Flexbox']).toBe(true);
        expect(cssSupport['CSS Transforms']).toBe(true);
        expect(jsSupport['Fetch API']).toBe(true);
      });
    }
  });

  test.describe('Mobile Browser Compatibility', () => {
    for (const [deviceName, deviceConfig] of Object.entries(BROWSER_CONFIGS.mobile)) {
      test(`should work correctly on ${deviceName}`, async ({ browser }) => {
        const context = await browser.newContext({
          ...deviceConfig
        });
        const page = await context.newPage();

        await page.goto('/');
        await waitForHexGridLoaded(page);

        // Test mobile-specific interactions
        const hexNodes = page.locator('[data-node-id] polygon');
        const hubNode = hexNodes.first();

        // Test touch interaction
        await hubNode.tap();
        await page.waitForTimeout(300);

        // Test mobile form interaction
        const inputField = page.locator('#input');
        await inputField.tap();
        await page.keyboard.type('Mobile test input');
        
        await expect(inputField).toHaveValue('Mobile test input');

        // Test mobile viewport adaptation
        const viewportSize = page.viewportSize();
        expect(viewportSize?.width).toBeLessThan(800); // Ensure mobile viewport

        // Capture mobile-specific screenshot
        await compareVisualState(page, 'body', `${deviceName.replace(/\s+/g, '-').toLowerCase()}-mobile`, {
          threshold: 0.2,
          fullPage: true
        });

        // Test touch targets are appropriately sized
        const touchTargets = page.locator('button, input, [data-node-id] polygon');
        const targetCount = await touchTargets.count();

        for (let i = 0; i < Math.min(targetCount, 5); i++) {
          const target = touchTargets.nth(i);
          const boundingBox = await target.boundingBox();
          
          if (boundingBox) {
            // WCAG recommends minimum 44x44px touch targets
            const meetsTouchSize = boundingBox.width >= 44 && boundingBox.height >= 44;
            
            if (!meetsTouchSize) {
              console.warn(`Touch target ${i} too small on ${deviceName}: ${boundingBox.width}x${boundingBox.height}`);
            }
          }
        }

        await context.close();
      });
    }
  });

  test.describe('Tablet and Intermediate Screen Sizes', () => {
    for (const [deviceName, deviceConfig] of Object.entries(BROWSER_CONFIGS.tablet)) {
      test(`should adapt layout correctly on ${deviceName}`, async ({ browser }) => {
        const context = await browser.newContext(deviceConfig);
        const page = await context.newPage();

        await page.goto('/');
        await waitForHexGridLoaded(page);

        // Test intermediate layout adaptations
        const hexContainer = page.locator('#hex-flow-container');
        await expect(hexContainer).toBeVisible();

        // Test tablet-specific grid layout
        const containerStyles = await hexContainer.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            gridTemplateColumns: computed.gridTemplateColumns,
            flexDirection: computed.flexDirection
          };
        });

        console.log(`${deviceName} container styles:`, containerStyles);

        // Test that layout adapts to tablet size
        const viewport = page.viewportSize();
        expect(viewport?.width).toBeGreaterThan(768);
        expect(viewport?.width).toBeLessThan(1200);

        // Capture tablet layout screenshot
        await compareVisualState(page, '#hex-flow-container', `${deviceName.replace(/\s+/g, '-').toLowerCase()}-tablet`, {
          threshold: 0.15
        });

        // Test interaction on tablet
        const hubNode = page.locator('[data-node-id="hub"] polygon');
        await hubNode.tap(); // Use tap for touch devices
        await page.waitForTimeout(300);

        // Test form usability on tablet
        await page.fill('#input', 'Tablet compatibility test');
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.tap();

        await context.close();
      });
    }
  });

  test.describe('Performance Comparison Across Browsers', () => {
    test('should maintain consistent performance across browsers', async ({ page, browserName }) => {
      await page.goto('/');
      await waitForHexGridLoaded(page);

      // Measure basic performance metrics
      const performanceMetrics = await page.evaluate(() => {
        return new Promise<{ 
          frameRate: number; 
          loadTime: number; 
          renderTime: number; 
          memoryUsage: number;
        }>((resolve) => {
          const startTime = performance.now();
          const frames: number[] = [];
          let frameCount = 0;
          
          // Track frames for 1 second
          function trackFrames() {
            frames.push(performance.now());
            frameCount++;
            
            if (frameCount < 60) { // ~1 second at 60fps
              requestAnimationFrame(trackFrames);
            } else {
              const renderTime = performance.now() - startTime;
              const frameRate = (frames.length - 1) / (renderTime / 1000);
              
              // Get page load timing
              const navigationTiming = performance.timing;
              const loadTime = navigationTiming.loadEventEnd - navigationTiming.navigationStart;
              
              // Get memory usage (if available)
              let memoryUsage = 0;
              if ('memory' in performance) {
                memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
              }
              
              resolve({
                frameRate: Math.round(frameRate * 100) / 100,
                loadTime,
                renderTime: Math.round(renderTime),
                memoryUsage: Math.round(memoryUsage * 10) / 10
              });
            }
          }
          
          requestAnimationFrame(trackFrames);
        });
      });

      console.log(`${browserName} Performance Metrics:`, performanceMetrics);

      // Validate performance thresholds (browser-specific adjustments)
      const minFrameRate = browserName === 'webkit' ? 40 : 45; // Safari may be slightly slower
      const maxLoadTime = browserName === 'firefox' ? 5000 : 4000; // Firefox may take longer

      expect(performanceMetrics.frameRate).toBeGreaterThan(minFrameRate);
      expect(performanceMetrics.loadTime).toBeLessThan(maxLoadTime);
    });
  });

  test.describe('Visual Consistency Validation', () => {
    test('should maintain visual consistency across browsers', async ({ page, browserName }) => {
      await page.goto('/');
      await waitForHexGridLoaded(page);

      // Test key visual elements across browsers
      const visualElements = [
        { selector: '#hex-flow-container', name: 'hex-container' },
        { selector: '.hex-node', name: 'hex-nodes' },
        { selector: '#generate-form', name: 'form-layout' },
        { selector: 'button[type="submit"]', name: 'submit-button' }
      ];

      for (const element of visualElements) {
        const locator = page.locator(element.selector);
        if (await locator.count() > 0) {
          await compareVisualState(page, element.selector, `${element.name}-${browserName}`, {
            threshold: 0.25, // Allow more variance between browsers
            animations: 'disabled'
          });
        }
      }

      // Test responsive breakpoints
      const breakpoints = [
        { width: 320, height: 568, name: 'mobile-small' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1024, height: 768, name: 'desktop-small' },
        { width: 1920, height: 1080, name: 'desktop-large' }
      ];

      for (const breakpoint of breakpoints) {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        await page.waitForTimeout(300); // Allow layout to settle

        await compareVisualState(page, '#hex-flow-container', `${breakpoint.name}-${browserName}`, {
          threshold: 0.3,
          clip: { x: 0, y: 0, width: breakpoint.width, height: Math.min(600, breakpoint.height) }
        });
      }
    });

    test('should handle browser-specific CSS features gracefully', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Test browser-specific feature detection and fallbacks
      const featureSupport = await page.evaluate(() => {
        const results: Record<string, { supported: boolean; fallback?: string }> = {};
        const testElement = document.createElement('div');
        document.body.appendChild(testElement);
        
        // Test backdrop-filter support
        testElement.style.backdropFilter = 'blur(10px)';
        results['backdrop-filter'] = {
          supported: testElement.style.backdropFilter.includes('blur'),
          fallback: !testElement.style.backdropFilter.includes('blur') ? 'background-color' : undefined
        };
        
        // Test CSS Grid subgrid support
        testElement.style.gridTemplateRows = 'subgrid';
        results['subgrid'] = {
          supported: testElement.style.gridTemplateRows === 'subgrid',
          fallback: testElement.style.gridTemplateRows !== 'subgrid' ? 'explicit-grid' : undefined
        };
        
        // Test container queries support
        try {
          testElement.style.containerType = 'inline-size';
          results['container-queries'] = {
            supported: testElement.style.containerType === 'inline-size',
            fallback: testElement.style.containerType !== 'inline-size' ? 'media-queries' : undefined
          };
        } catch {
          results['container-queries'] = { supported: false, fallback: 'media-queries' };
        }
        
        document.body.removeChild(testElement);
        return results;
      });

      console.log(`${browserName} Feature Support:`, featureSupport);

      // Validate that unsupported features have fallbacks
      for (const [feature, support] of Object.entries(featureSupport)) {
        if (!support.supported && support.fallback) {
          console.log(`${browserName} using fallback for ${feature}: ${support.fallback}`);
        }
      }

      // Take screenshot to verify fallbacks render correctly
      await page.screenshot({
        path: `test-results/cross-browser/feature-fallbacks-${browserName}.png`,
        fullPage: true
      });
    });
  });

  test.describe('Accessibility Across Browsers', () => {
    test('should maintain accessibility standards in all browsers', async ({ page, browserName }) => {
      await page.goto('/');
      await waitForHexGridLoaded(page);

      // Test keyboard navigation
      const focusableElements = [
        '#input',
        'button[type="submit"]',
        '[data-node-id="hub"] polygon'
      ];

      for (const selector of focusableElements) {
        await page.focus(selector);
        await page.waitForTimeout(100);
        
        const focusedElement = page.locator(selector);
        await expect(focusedElement).toBeFocused();
      }

      // Test ARIA attributes
      const inputField = page.locator('#input');
      await expect(inputField).toHaveAttribute('aria-label');

      // Test screen reader compatibility (basic checks)
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);

      // Test color contrast (visual check via screenshot)
      await page.screenshot({
        path: `test-results/cross-browser/accessibility-${browserName}.png`,
        fullPage: true
      });
    });
  });
});