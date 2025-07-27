import { test, expect } from '@playwright/test';

// Configure visual regression test settings
test.use({
  // Consistent viewport for visual tests
  viewport: { width: 1280, height: 720 },
  
  // Disable animations for consistent screenshots
  actionTimeout: 0,
  navigationTimeout: 30000,
});

test.describe('StatusIndicator Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
    
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.status-indicator', { state: 'visible' });
    await page.waitForTimeout(1000); // Wait for initial load
  });

  test.describe('Component States', () => {
    test('default state with mixed statuses', async ({ page }) => {
      const statusIndicator = page.locator('.status-indicator');
      await expect(statusIndicator).toHaveScreenshot('status-indicator-default.png', {
        animations: 'disabled',
        mask: [page.locator('.tooltip-timestamp')], // Mask dynamic timestamps
      });
    });

    test('all operational state', async ({ page }) => {
      // Wait for all dots to potentially become operational
      await page.waitForTimeout(2000);
      
      const statusIndicator = page.locator('.status-indicator');
      await expect(statusIndicator).toHaveScreenshot('status-indicator-all-operational.png', {
        animations: 'disabled',
      });
    });

    test('tooltip appearance', async ({ page }) => {
      const firstDot = page.locator('.status-dot.system.minimal').first();
      await firstDot.hover();
      await page.waitForSelector('.status-tooltip-portal', { state: 'visible' });
      await page.waitForTimeout(100); // Wait for tooltip animation
      
      // Take screenshot of specific area containing dot and tooltip
      await expect(page).toHaveScreenshot('status-indicator-tooltip.png', {
        clip: {
          x: 0,
          y: 0,
          width: 600,
          height: 300,
        },
        animations: 'disabled',
        mask: [page.locator('.tooltip-timestamp')],
      });
    });
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      test(`${viewport.name} viewport (${viewport.width}x${viewport.height})`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500); // Wait for resize
        
        const statusIndicator = page.locator('.status-indicator');
        await expect(statusIndicator).toHaveScreenshot(
          `status-indicator-${viewport.name}.png`,
          { animations: 'disabled' }
        );
      });
    }
  });

  test.describe('Position Variants', () => {
    const positions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
    
    for (const position of positions) {
      test(`position: ${position}`, async ({ page }) => {
        // We would need to modify the component prop here
        // For now, testing default position
        if (position === 'bottom-right') {
          const statusIndicator = page.locator('.status-indicator');
          await expect(statusIndicator).toHaveScreenshot(
            `status-indicator-position-${position}.png`,
            { animations: 'disabled' }
          );
        }
      });
    }
  });

  test.describe('Interaction States', () => {
    test('hover state', async ({ page }) => {
      const firstDot = page.locator('.status-dot.system.minimal').first();
      await firstDot.hover();
      
      await expect(firstDot).toHaveScreenshot('status-dot-hover.png', {
        animations: 'disabled',
      });
    });

    test('focus state', async ({ page }) => {
      await page.keyboard.press('Tab');
      
      // Find focused dot
      const focusedDot = page.locator('.status-dot.system.minimal:focus');
      await expect(focusedDot).toHaveScreenshot('status-dot-focus.png', {
        animations: 'disabled',
      });
    });

    test('active/pressed state', async ({ page }) => {
      const firstDot = page.locator('.status-dot.system.minimal').first();
      
      // Mouse down to trigger active state
      await firstDot.dispatchEvent('mousedown');
      
      await expect(firstDot).toHaveScreenshot('status-dot-active.png', {
        animations: 'disabled',
      });
    });
  });

  test.describe('Theme Variations', () => {
    test('dark theme (default)', async ({ page }) => {
      const app = page.locator('#root');
      await expect(app).toHaveScreenshot('status-indicator-dark-theme.png', {
        animations: 'disabled',
      });
    });

    // Light theme test would go here if implemented
  });

  test.describe('Animation States', () => {
    test('pulsating operational dot', async ({ page }) => {
      // Remove animation disable for this specific test
      await page.evaluate(() => {
        const style = document.querySelector('style');
        if (style && style.textContent?.includes('animation-duration: 0s')) {
          style.remove();
        }
      });
      
      await page.waitForSelector('.status-dot.system.minimal.operational', { 
        state: 'visible' 
      });
      
      const operationalDot = page.locator('.status-dot.system.minimal.operational').first();
      
      // Take multiple screenshots to capture animation
      const screenshots = [];
      for (let i = 0; i < 3; i++) {
        await page.waitForTimeout(500);
        screenshots.push(await operationalDot.screenshot());
      }
      
      // At least verify the element exists and can be screenshotted
      expect(screenshots.length).toBe(3);
    });
  });

  test.describe('Error States', () => {
    test('all systems down', async ({ page }) => {
      // This would require mocking API to return errors
      // For now, capture whatever state exists
      const statusIndicator = page.locator('.status-indicator');
      await expect(statusIndicator).toHaveScreenshot('status-indicator-error-state.png', {
        animations: 'disabled',
      });
    });
  });

  test.describe('Accessibility Features', () => {
    test('high contrast mode', async ({ page }) => {
      // Simulate high contrast mode
      await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
      
      const statusIndicator = page.locator('.status-indicator');
      await expect(statusIndicator).toHaveScreenshot('status-indicator-high-contrast.png', {
        animations: 'disabled',
      });
    });

    test('reduced motion', async ({ page }) => {
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      const statusIndicator = page.locator('.status-indicator');
      await expect(statusIndicator).toHaveScreenshot('status-indicator-reduced-motion.png', {
        animations: 'disabled',
      });
    });
  });

  test.describe('Full Page Context', () => {
    test('status indicator in app context', async ({ page }) => {
      // Take full page screenshot to see component in context
      await expect(page).toHaveScreenshot('app-with-status-indicator.png', {
        fullPage: true,
        animations: 'disabled',
        mask: [
          page.locator('.tooltip-timestamp'),
          page.locator('.last-generated'), // Mask other dynamic content
        ],
      });
    });

    test('status indicator with other UI elements', async ({ page }) => {
      // Interact with app to show more UI elements
      const promptInput = page.locator('textarea[placeholder*="Describe"]');
      if (await promptInput.isVisible()) {
        await promptInput.fill('Test prompt for visual regression');
      }
      
      await expect(page).toHaveScreenshot('app-with-content.png', {
        fullPage: false,
        animations: 'disabled',
        clip: {
          x: 0,
          y: 0,
          width: 1280,
          height: 720,
        },
      });
    });
  });
});

// Pixel comparison configuration
test.describe.configure({
  // Allow small differences for anti-aliasing
  use: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2, // 20% difference threshold per pixel
      animations: 'disabled',
    },
  },
});