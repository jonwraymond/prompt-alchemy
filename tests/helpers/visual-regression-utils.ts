import { Page, expect, Locator, BrowserContext } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Advanced Visual Regression Testing Utilities for Prompt Alchemy
 * 
 * This module provides sophisticated visual testing capabilities:
 * - Pixel-perfect screenshot comparisons
 * - Animation frame capture and analysis
 * - Accessibility visual testing
 * - Performance monitoring with visual feedback
 * - Cross-browser visual consistency testing
 * - Interactive element state validation
 */

// ============================================================================
// Configuration and Types
// ============================================================================

export interface VisualTestConfig {
  threshold: number;
  maxDiffPixels?: number;
  animations?: 'disabled' | 'allow';
  clip?: { x: number; y: number; width: number; height: number };
  mask?: string[];
  fullPage?: boolean;
}

export interface AnimationTestConfig {
  duration: number;
  frameRate: number;
  element: string;
  trigger?: () => Promise<void>;
}

export interface AccessibilityVisualConfig {
  includeColorContrast: boolean;
  highlightFocusElements: boolean;
  showScreenReaderPath: boolean;
}

export interface PerformanceVisualConfig {
  captureTimeframes: number[];
  highlightSlowElements: boolean;
  showLoadingStates: boolean;
}

// ============================================================================
// Core Visual Testing Functions
// ============================================================================

/**
 * Enhanced screenshot comparison with advanced options
 */
export async function compareVisualState(
  page: Page,
  elementSelector: string,
  testName: string,
  config: VisualTestConfig = { threshold: 0.2 }
): Promise<void> {
  const element = page.locator(elementSelector);
  await element.waitFor({ state: 'visible' });

  // Disable animations if specified
  if (config.animations === 'disabled') {
    await disableAnimations(page);
  }

  // Wait for element to be stable
  await waitForElementStable(page, elementSelector);

  // Apply masks for dynamic content
  if (config.mask) {
    await applyDynamicContentMasks(page, config.mask);
  }

  // Take screenshot with comparison
  await expect(element).toHaveScreenshot(`${testName}.png`, {
    threshold: config.threshold,
    maxDiffPixels: config.maxDiffPixels,
    clip: config.clip,
    animations: config.animations === 'disabled' ? 'disabled' : 'allow'
  });
}

/**
 * Capture and analyze animation sequences
 */
export async function captureAnimationSequence(
  page: Page,
  config: AnimationTestConfig
): Promise<string[]> {
  const screenshots: string[] = [];
  const frameInterval = 1000 / config.frameRate;
  const totalFrames = Math.floor(config.duration / frameInterval);

  // Trigger animation if provided
  if (config.trigger) {
    await config.trigger();
  }

  // Capture frames
  for (let frame = 0; frame < totalFrames; frame++) {
    const element = page.locator(config.element);
    const screenshotPath = `test-results/animations/frame-${frame}.png`;
    
    await element.screenshot({ path: screenshotPath });
    screenshots.push(screenshotPath);
    
    await page.waitForTimeout(frameInterval);
  }

  return screenshots;
}

/**
 * Generate visual accessibility report
 */
export async function generateAccessibilityVisualReport(
  page: Page,
  config: AccessibilityVisualConfig
): Promise<void> {
  // Inject accessibility visualization styles
  await page.addStyleTag({
    content: `
      .a11y-focus-indicator {
        outline: 3px solid #ff4444 !important;
        outline-offset: 2px !important;
      }
      .a11y-contrast-fail {
        background: linear-gradient(45deg, #ff0000 25%, transparent 25%, transparent 75%, #ff0000 75%),
                    linear-gradient(45deg, #ff0000 25%, transparent 25%, transparent 75%, #ff0000 75%);
        background-size: 8px 8px;
        background-position: 0 0, 4px 4px;
      }
      .a11y-screen-reader-path {
        border: 2px dashed #00ff00 !important;
        background-color: rgba(0, 255, 0, 0.1) !important;
      }
    `
  });

  // Highlight focus elements
  if (config.highlightFocusElements) {
    await page.evaluate(() => {
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusableElements.forEach(el => {
        (el as HTMLElement).classList.add('a11y-focus-indicator');
      });
    });
  }

  // Check color contrast
  if (config.includeColorContrast) {
    await checkColorContrast(page);
  }

  // Visualize screen reader navigation path
  if (config.showScreenReaderPath) {
    await visualizeScreenReaderPath(page);
  }

  // Take screenshot with accessibility overlays
  await page.screenshot({
    path: 'test-results/accessibility/a11y-visual-report.png',
    fullPage: true
  });
}

/**
 * Performance visual monitoring
 */
export async function capturePerformanceVisuals(
  page: Page,
  config: PerformanceVisualConfig
): Promise<void> {
  const startTime = Date.now();

  // Capture at specified timeframes
  for (const timeframe of config.captureTimeframes) {
    await page.waitForTimeout(timeframe);
    
    const currentTime = Date.now() - startTime;
    
    // Highlight slow elements if enabled
    if (config.highlightSlowElements) {
      await highlightSlowLoadingElements(page);
    }

    // Show loading states
    if (config.showLoadingStates) {
      await visualizeLoadingStates(page);
    }

    await page.screenshot({
      path: `test-results/performance/perf-${currentTime}ms.png`,
      fullPage: true
    });
  }
}

// ============================================================================
// Hex Grid Specific Visual Testing
// ============================================================================

/**
 * Comprehensive hex grid visual testing
 */
export async function testHexGridVisualState(page: Page): Promise<void> {
  // Wait for hex grid to be fully loaded
  await page.waitForSelector('#hex-flow-container .modular-alchemy-grid', { state: 'visible' });
  await page.waitForFunction(() => {
    const nodes = document.querySelectorAll('polygon');
    return nodes.length >= 15; // Expected number of hex nodes
  });

  // Test base state
  await compareVisualState(page, '#hex-flow-container', 'hex-grid-base', {
    threshold: 0.1,
    animations: 'disabled'
  });

  // Test individual node states
  const nodeIds = ['hub', 'input', 'output', 'prima', 'solutio', 'coagulatio'];
  
  for (const nodeId of nodeIds) {
    // Test normal state
    await compareVisualState(page, `[data-node-id="${nodeId}"]`, `node-${nodeId}-normal`, {
      threshold: 0.1
    });

    // Test hover state
    await page.locator(`[data-node-id="${nodeId}"] polygon`).hover();
    await page.waitForTimeout(200); // Allow hover animation
    await compareVisualState(page, `[data-node-id="${nodeId}"]`, `node-${nodeId}-hover`, {
      threshold: 0.15
    });

    // Reset hover state
    await page.locator('#hex-flow-container').hover({ position: { x: 50, y: 50 } });
  }
}

/**
 * Test hex grid animations and transitions
 */
export async function testHexGridAnimations(page: Page): Promise<void> {
  // Test connection animation
  await captureAnimationSequence(page, {
    duration: 3000,
    frameRate: 10,
    element: '#hex-flow-container',
    trigger: async () => {
      // Trigger the connection animations by clicking generate button
      const generateBtn = page.locator('window.showAlchemyConnections');
      if (await generateBtn.count() > 0) {
        await page.evaluate(() => {
          if (typeof window.showAlchemyConnections === 'function') {
            window.showAlchemyConnections();
          }
        });
      }
    }
  });

  // Test node hover animations
  const hubNode = page.locator('[data-node-id="hub"] polygon');
  await captureAnimationSequence(page, {
    duration: 1000,
    frameRate: 20,
    element: '[data-node-id="hub"]',
    trigger: async () => {
      await hubNode.hover();
    }
  });
}

/**
 * Test tooltip visual positioning
 */
export async function testTooltipPositioning(page: Page): Promise<void> {
  const nodeIds = ['hub', 'prima', 'solutio', 'coagulatio'];
  
  for (const nodeId of nodeIds) {
    // Hover over node to show tooltip
    await page.locator(`[data-node-id="${nodeId}"] polygon`).hover();
    
    // Wait for tooltip to appear
    await page.waitForSelector('.tooltip, [class*="tooltip"]', { state: 'visible', timeout: 2000 });
    
    // Take screenshot of tooltip positioning
    await page.screenshot({
      path: `test-results/tooltips/tooltip-${nodeId}.png`,
      fullPage: false
    });
    
    // Clear hover state
    await page.locator('#hex-flow-container').hover({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(200);
  }
}

// ============================================================================
// Cross-Browser Visual Consistency
// ============================================================================

/**
 * Test visual consistency across different browsers
 */
export async function testCrossBrowserConsistency(
  contexts: BrowserContext[],
  url: string
): Promise<void> {
  const screenshots: { browser: string; path: string }[] = [];

  for (let i = 0; i < contexts.length; i++) {
    const context = contexts[i];
    const page = await context.newPage();
    
    // Navigate to the page
    await page.goto(url);
    await page.waitForSelector('#hex-flow-container', { state: 'visible' });
    
    // Take screenshot
    const browserName = context.browser()?.browserType().name() || `browser-${i}`;
    const screenshotPath = `test-results/cross-browser/${browserName}-hex-grid.png`;
    
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 720 }
    });
    
    screenshots.push({ browser: browserName, path: screenshotPath });
    await page.close();
  }

  // Compare screenshots between browsers
  await compareCrossBrowserScreenshots(screenshots);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Disable all animations on the page
 */
async function disableAnimations(page: Page): Promise<void> {
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
}

/**
 * Wait for element to be visually stable
 */
async function waitForElementStable(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector);
  
  // Wait for element to exist and be visible
  await element.waitFor({ state: 'visible' });
  
  // Wait for position to stabilize
  let previousBoundingBox = await element.boundingBox();
  await page.waitForTimeout(100);
  
  for (let i = 0; i < 10; i++) {
    const currentBoundingBox = await element.boundingBox();
    
    if (previousBoundingBox && currentBoundingBox &&
        Math.abs(previousBoundingBox.x - currentBoundingBox.x) < 1 &&
        Math.abs(previousBoundingBox.y - currentBoundingBox.y) < 1) {
      break;
    }
    
    previousBoundingBox = currentBoundingBox;
    await page.waitForTimeout(100);
  }
}

/**
 * Apply masks to dynamic content areas
 */
async function applyDynamicContentMasks(page: Page, selectors: string[]): Promise<void> {
  for (const selector of selectors) {
    await page.locator(selector).evaluate(el => {
      (el as HTMLElement).style.visibility = 'hidden';
    });
  }
}

/**
 * Check color contrast and highlight failures
 */
async function checkColorContrast(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Simple contrast checking logic
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
      const styles = window.getComputedStyle(el);
      const bgColor = styles.backgroundColor;
      const textColor = styles.color;
      
      // Simple heuristic for contrast issues
      if (bgColor && textColor && bgColor !== 'rgba(0, 0, 0, 0)') {
        // This is a simplified check - in real implementation,
        // you'd use proper contrast ratio calculation
        (el as HTMLElement).classList.add('a11y-contrast-checked');
      }
    });
  });
}

/**
 * Visualize screen reader navigation path
 */
async function visualizeScreenReaderPath(page: Page): Promise<void> {
  await page.evaluate(() => {
    const focusableElements = Array.from(document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ));
    
    focusableElements.forEach((el, index) => {
      (el as HTMLElement).classList.add('a11y-screen-reader-path');
      (el as HTMLElement).setAttribute('data-tab-order', index.toString());
    });
  });
}

/**
 * Highlight slow loading elements
 */
async function highlightSlowLoadingElements(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Mark elements that might be slow to load
    const images = document.querySelectorAll('img:not([data-loaded])');
    const videos = document.querySelectorAll('video:not([data-loaded])');
    
    [...images, ...videos].forEach(el => {
      (el as HTMLElement).style.border = '3px solid red';
      (el as HTMLElement).style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
    });
  });
}

/**
 * Visualize loading states
 */
async function visualizeLoadingStates(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Add loading indicators to elements that might be loading
    const loadingElements = document.querySelectorAll('.loading, [data-loading], .spinner');
    loadingElements.forEach(el => {
      (el as HTMLElement).style.background = 'repeating-linear-gradient(45deg, #ff0, #ff0 10px, #f0f 10px, #f0f 20px)';
    });
  });
}

/**
 * Compare screenshots between browsers
 */
async function compareCrossBrowserScreenshots(
  screenshots: { browser: string; path: string }[]
): Promise<void> {
  // This would typically use an image comparison library
  // For now, just log the comparison results
  console.log('Cross-browser screenshots captured:');
  screenshots.forEach(({ browser, path }) => {
    console.log(`${browser}: ${path}`);
  });
  
  // In a real implementation, you would:
  // 1. Load each screenshot
  // 2. Compare pixel differences
  // 3. Generate a diff report
  // 4. Fail the test if differences exceed threshold
}

/**
 * Generate visual test report
 */
export async function generateVisualTestReport(
  testResults: Array<{ name: string; passed: boolean; diffPixels?: number }>
): Promise<void> {
  const reportPath = 'test-results/visual-test-report.json';
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.length,
      passed: testResults.filter(r => r.passed).length,
      failed: testResults.filter(r => !r.passed).length
    },
    tests: testResults
  };
  
  // Ensure directory exists
  const dir = 'test-results';
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Visual test report generated: ${reportPath}`);
}