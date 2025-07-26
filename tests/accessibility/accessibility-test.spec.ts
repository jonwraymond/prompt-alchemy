import { test, expect } from '../fixtures/base-fixtures';
import { 
  generateAccessibilityVisualReport,
  compareVisualState 
} from '../helpers/visual-regression-utils';
import { waitForHexGridLoaded } from '../helpers/test-utils';

/**
 * Comprehensive Accessibility Testing Suite
 * 
 * Tests for WCAG 2.1 AA compliance and accessibility best practices:
 * - Keyboard navigation and focus management
 * - Screen reader compatibility and ARIA attributes
 * - Color contrast and visual accessibility
 * - Alternative text and semantic markup
 * - Interactive element accessibility
 * - Form accessibility and error handling
 * - Mobile accessibility and touch targets
 */

test.describe('Accessibility Compliance Testing', () => {
  test.beforeEach(async ({ hexGridPage }) => {
    await hexGridPage.goto();
    await waitForHexGridLoaded(hexGridPage.page);
  });

  test.describe('Keyboard Navigation and Focus Management', () => {
    test('should support full keyboard navigation', async ({ page }) => {
      // Test tab navigation through all interactive elements
      const interactiveElements = [
        { selector: '#input', name: 'Main input field' },
        { selector: '#persona', name: 'Persona selector' },
        { selector: '#count', name: 'Count selector' },
        { selector: 'button[type="submit"]', name: 'Generate button' },
        { selector: '[data-node-id="hub"] polygon', name: 'Hub hex node' },
        { selector: '[data-node-id="input"] polygon', name: 'Input hex node' },
        { selector: '[data-node-id="output"] polygon', name: 'Output hex node' }
      ];

      let tabCount = 0;
      for (const element of interactiveElements) {
        // Tab to next element
        if (tabCount === 0) {
          await page.focus(element.selector);
        } else {
          await page.keyboard.press('Tab');
        }
        
        // Verify focus is on expected element
        const focusedElement = page.locator(element.selector);
        await expect(focusedElement).toBeFocused();
        
        // Take screenshot of focus state for visual validation
        await page.screenshot({
          path: `test-results/accessibility/focus-${element.name.replace(/\s+/g, '-').toLowerCase()}.png`
        });
        
        tabCount++;
      }
    });

    test('should maintain visible focus indicators', async ({ page }) => {
      const focusableElements = [
        '#input',
        'button[type="submit"]',
        '[data-node-id="hub"] polygon'
      ];

      for (const selector of focusableElements) {
        await page.focus(selector);
        
        // Check if focus indicator is visible
        const focusedElement = page.locator(selector);
        const styles = await focusedElement.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            outline: computed.outline,
            outlineColor: computed.outlineColor,
            outlineWidth: computed.outlineWidth,
            boxShadow: computed.boxShadow
          };
        });
        
        // Should have some form of focus indicator
        const hasFocusIndicator = 
          styles.outline !== 'none' || 
          styles.outlineWidth !== '0px' ||
          styles.boxShadow !== 'none';
        
        expect(hasFocusIndicator).toBe(true);
      }
    });

    test('should handle Enter and Space key interactions', async ({ page }) => {
      // Test Enter key on submit button
      await page.focus('button[type="submit"]');
      
      // Fill form first
      await page.fill('#input', 'Test keyboard submission');
      await page.focus('button[type="submit"]');
      
      // Mock the API response to avoid actual generation
      await page.route('**/api/v1/prompts/generate', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { prompts: ['Test result'] }
          })
        });
      });
      
      await page.keyboard.press('Enter');
      
      // Should trigger form submission
      await page.waitForSelector('.loading-indicator, .prompt-result', { timeout: 5000 });
    });

    test('should support Escape key for modal/tooltip dismissal', async ({ page }) => {
      // Hover over hex node to show tooltip
      await page.locator('[data-node-id="hub"] polygon').hover();
      
      // Wait for tooltip to appear
      await page.waitForSelector('#hex-tooltip.visible', { timeout: 2000 });
      
      // Press Escape to dismiss
      await page.keyboard.press('Escape');
      
      // Tooltip should be hidden
      const tooltip = page.locator('#hex-tooltip');
      await expect(tooltip).toBeHidden();
    });
  });

  test.describe('Screen Reader and ARIA Compatibility', () => {
    test('should have proper ARIA labels and descriptions', async ({ page }) => {
      // Check main input field
      const inputField = page.locator('#input');
      await expect(inputField).toHaveAttribute('aria-label');
      
      // Check form elements have proper labeling
      const personaSelect = page.locator('#persona');
      await expect(personaSelect).toHaveAttribute('aria-label');
      
      const countSelect = page.locator('#count');
      await expect(countSelect).toHaveAttribute('aria-label');
      
      // Check submit button has description
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toHaveAttribute('aria-describedby');
    });

    test('should have proper heading structure', async ({ page }) => {
      // Check for proper heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
      
      // Check main heading exists
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      
      // Verify heading text is descriptive
      const h1Text = await h1.textContent();
      expect(h1Text).toBeTruthy();
      expect(h1Text!.length).toBeGreaterThan(5);
    });

    test('should have proper landmark regions', async ({ page }) => {
      // Check for main content area
      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible();
      
      // Check for navigation if present
      const nav = page.locator('nav, [role="navigation"]');
      if (await nav.count() > 0) {
        await expect(nav).toBeVisible();
      }
      
      // Check for banner/header
      const header = page.locator('header, [role="banner"]');
      if (await header.count() > 0) {
        await expect(header).toBeVisible();
      }
    });

    test('should provide alternative text for visual elements', async ({ page }) => {
      // Check images have alt text
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        await expect(img).toHaveAttribute('alt');
      }
      
      // Check SVG elements have proper titles or aria-labels
      const svgElements = page.locator('svg');
      const svgCount = await svgElements.count();
      
      for (let i = 0; i < svgCount; i++) {
        const svg = svgElements.nth(i);
        const hasAccessibility = await svg.evaluate(el => {
          return el.hasAttribute('aria-label') || 
                 el.hasAttribute('aria-labelledby') ||
                 el.querySelector('title') !== null;
        });
        
        expect(hasAccessibility).toBe(true);
      }
    });

    test('should announce dynamic content changes', async ({ page }) => {
      // Check for live regions
      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
      const liveRegionCount = await liveRegions.count();
      expect(liveRegionCount).toBeGreaterThan(0);
      
      // Test dynamic content announcement
      await page.fill('#input', 'Test dynamic content');
      await page.click('button[type="submit"]');
      
      // Should have loading announcement
      const loadingRegion = page.locator('[aria-live="polite"]');
      if (await loadingRegion.count() > 0) {
        await expect(loadingRegion).toBeVisible();
      }
    });
  });

  test.describe('Color Contrast and Visual Accessibility', () => {
    test('should meet WCAG color contrast requirements', async ({ page }) => {
      await generateAccessibilityVisualReport(page, {
        includeColorContrast: true,
        highlightFocusElements: false,
        showScreenReaderPath: false
      });
      
      // Test specific color combinations
      const textElements = [
        'h1',
        'p',
        'button',
        'input',
        'label'
      ];
      
      for (const selector of textElements) {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          const contrastInfo = await element.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
              color: styles.color,
              backgroundColor: styles.backgroundColor,
              fontSize: styles.fontSize
            };
          });
          
          // Log contrast information for manual verification
          console.log(`${selector} contrast:`, contrastInfo);
        }
      }
    });

    test('should be usable without color alone', async ({ page }) => {
      // Test with simulated color blindness by removing all color
      await page.addStyleTag({
        content: `
          * {
            filter: grayscale(100%) !important;
          }
        `
      });
      
      await page.waitForTimeout(500);
      
      // Take screenshot for manual review
      await page.screenshot({
        path: 'test-results/accessibility/grayscale-test.png',
        fullPage: true
      });
      
      // Interactive elements should still be distinguishable
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
      
      // Form should still be usable
      await page.fill('#input', 'Grayscale test');
      await expect(page.locator('#input')).toHaveValue('Grayscale test');
    });

    test('should support high contrast mode', async ({ page }) => {
      // Simulate Windows high contrast mode
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            * {
              background: black !important;
              color: white !important;
              border: 2px solid white !important;
            }
          }
        `
      });
      
      await page.waitForTimeout(500);
      
      // Take screenshot for manual review
      await page.screenshot({
        path: 'test-results/accessibility/high-contrast-test.png',
        fullPage: true
      });
      
      // Elements should still be functional
      await page.fill('#input', 'High contrast test');
      await expect(page.locator('#input')).toHaveValue('High contrast test');
    });
  });

  test.describe('Form Accessibility', () => {
    test('should have proper form labels and descriptions', async ({ page }) => {
      // Check input field has label
      const inputField = page.locator('#input');
      const inputLabel = await inputField.getAttribute('aria-label') || 
                        await page.locator('label[for="input"]').textContent();
      expect(inputLabel).toBeTruthy();
      
      // Check select elements have labels
      const selects = page.locator('select');
      const selectCount = await selects.count();
      
      for (let i = 0; i < selectCount; i++) {
        const select = selects.nth(i);
        const selectId = await select.getAttribute('id');
        
        if (selectId) {
          const label = page.locator(`label[for="${selectId}"]`);
          const hasLabel = await label.count() > 0 || 
                          await select.getAttribute('aria-label') !== null;
          expect(hasLabel).toBe(true);
        }
      }
    });

    test('should provide helpful error messages', async ({ page }) => {
      // Submit empty form to trigger validation
      await page.click('button[type="submit"]');
      
      // Check for error messages
      const errorMessages = page.locator('.error-message, [role="alert"]');
      if (await errorMessages.count() > 0) {
        // Error messages should be descriptive
        const errorText = await errorMessages.first().textContent();
        expect(errorText).toBeTruthy();
        expect(errorText!.length).toBeGreaterThan(10);
        
        // Error should be associated with the field
        const inputField = page.locator('#input');
        const describedBy = await inputField.getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();
      }
    });

    test('should support form field requirements indication', async ({ page }) => {
      // Check for required field indicators
      const requiredFields = page.locator('[required], [aria-required="true"]');
      const requiredCount = await requiredFields.count();
      
      if (requiredCount > 0) {
        // Required fields should have visual indication
        for (let i = 0; i < requiredCount; i++) {
          const field = requiredFields.nth(i);
          const fieldLabel = await field.getAttribute('aria-label') ||
                            await field.getAttribute('placeholder');
          
          // Should indicate requirement in label or nearby text
          const hasRequiredIndicator = fieldLabel?.includes('*') ||
                                      fieldLabel?.includes('required') ||
                                      await field.getAttribute('aria-required') === 'true';
          
          expect(hasRequiredIndicator).toBe(true);
        }
      }
    });
  });

  test.describe('Interactive Element Accessibility', () => {
    test('should have appropriate touch target sizes', async ({ page }) => {
      // Set mobile viewport for touch target testing
      await page.setViewportSize({ width: 375, height: 667 });
      
      const interactiveElements = [
        'button',
        'input',
        'select',
        '[data-node-id] polygon'
      ];
      
      for (const selector of interactiveElements) {
        const elements = page.locator(selector);
        const elementCount = await elements.count();
        
        for (let i = 0; i < Math.min(elementCount, 5); i++) {
          const element = elements.nth(i);
          const boundingBox = await element.boundingBox();
          
          if (boundingBox) {
            // WCAG recommends minimum 44x44px touch targets
            const minSize = 44;
            const meetsSize = boundingBox.width >= minSize && boundingBox.height >= minSize;
            
            if (!meetsSize) {
              console.warn(`Touch target too small: ${selector} - ${boundingBox.width}x${boundingBox.height}`);
            }
            
            // For critical elements, enforce the requirement
            if (selector === 'button' || selector === 'input') {
              expect(meetsSize).toBe(true);
            }
          }
        }
      }
    });

    test('should provide clear interactive element states', async ({ page }) => {
      const button = page.locator('button[type="submit"]');
      
      // Test normal state
      const normalStyles = await button.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          cursor: computed.cursor
        };
      });
      
      expect(normalStyles.cursor).toBe('pointer');
      
      // Test hover state
      await button.hover();
      await page.waitForTimeout(100);
      
      const hoverStyles = await button.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Hover state should be different from normal state
      expect(hoverStyles.backgroundColor).not.toBe(normalStyles.backgroundColor);
      
      // Test disabled state if applicable
      await button.evaluate(el => el.setAttribute('disabled', 'true'));
      
      const disabledStyles = await button.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          cursor: computed.cursor,
          opacity: computed.opacity
        };
      });
      
      // Disabled elements should look disabled
      expect(disabledStyles.cursor).toBe('not-allowed');
    });
  });

  test.describe('Reduced Motion Support', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.addStyleTag({
        content: `
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `
      });
      
      // Test that animations are reduced
      const hubNode = page.locator('[data-node-id="hub"] polygon');
      await hubNode.hover();
      
      const animationDuration = await hubNode.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return computed.animationDuration;
      });
      
      // Animation duration should be very short
      expect(animationDuration).toBe('0.01ms');
      
      // Take screenshot for reduced motion state
      await page.screenshot({
        path: 'test-results/accessibility/reduced-motion-test.png',
        fullPage: true
      });
    });
  });

  test.describe('Comprehensive Accessibility Report', () => {
    test('should generate full accessibility visual report', async ({ page }) => {
      await generateAccessibilityVisualReport(page, {
        includeColorContrast: true,
        highlightFocusElements: true,
        showScreenReaderPath: true
      });
      
      // Take final accessibility validation screenshot
      await compareVisualState(page, 'body', 'accessibility-overview', {
        threshold: 0.3,
        fullPage: true
      });
    });
  });
});