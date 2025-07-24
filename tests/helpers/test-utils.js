// @ts-check

/**
 * Test utilities for Playwright HTMX testing
 */

/**
 * Wait for HTMX request to complete
 * @param {import('@playwright/test').Page} page 
 */
async function waitForHtmxRequest(page) {
  // Wait for any ongoing HTMX requests to complete
  await page.waitForFunction(() => {
    // Check if HTMX has any pending requests
    return !document.querySelector('.htmx-request');
  });
  
  // Also wait for network to be idle
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for rune system to be ready
 * @param {import('@playwright/test').Page} page 
 */
async function waitForRuneSystem(page) {
  await page.waitForSelector('#rune-svg', { timeout: 10000 });
  await page.waitForFunction(() => {
    const svg = document.querySelector('#rune-svg');
    return svg && svg.querySelector('.rune-node');
  });
}

/**
 * Start a test generation and wait for processing to begin
 * @param {import('@playwright/test').Page} page 
 * @param {string} input - Input text for generation
 */
async function startGeneration(page, input = 'Test prompt generation') {
  await page.fill('#input', input);
  await page.click('button[type="submit"]');
  
  // Wait for processing to start
  await page.waitForSelector('.alchemy-progress', { timeout: 10000 });
}

/**
 * Wait for generation to complete
 * @param {import('@playwright/test').Page} page 
 */
async function waitForGenerationComplete(page) {
  await page.waitForSelector('.result-prompt', { timeout: 60000 });
}

/**
 * Check if element has CSS animation running
 * @param {import('@playwright/test').Page} page 
 * @param {string} selector 
 */
async function hasActiveAnimation(page, selector) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const computedStyle = getComputedStyle(element);
    const animationName = computedStyle.animationName;
    const animationDuration = computedStyle.animationDuration;
    
    return animationName !== 'none' && animationDuration !== '0s';
  }, selector);
}

/**
 * Get current rune system state
 * @param {import('@playwright/test').Page} page 
 */
async function getRuneSystemState(page) {
  return await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('.rune-node'));
    const connections = Array.from(document.querySelectorAll('.connection-line'));
    
    return {
      nodes: nodes.map(node => ({
        id: node.id,
        classes: node.className,
        active: node.classList.contains('active'),
        completed: node.classList.contains('completed')
      })),
      connections: connections.map(conn => ({
        id: conn.id,
        classes: conn.className,
        active: conn.classList.contains('active'),
        completed: conn.classList.contains('completed')
      }))
    };
  });
}

/**
 * Check if HTMX is properly initialized
 * @param {import('@playwright/test').Page} page 
 */
async function checkHtmxInitialized(page) {
  return await page.evaluate(() => {
    return typeof window.htmx !== 'undefined' && 
           document.body.hasAttribute('hx-boost');
  });
}

/**
 * Mock slow network for testing loading states
 * @param {import('@playwright/test').Page} page 
 * @param {number} delay - Delay in milliseconds
 */
async function mockSlowNetwork(page, delay = 3000) {
  await page.route('**/generate*', async route => {
    await new Promise(resolve => setTimeout(resolve, delay));
    await route.continue();
  });
}

/**
 * Clear all routes (remove mocks)
 * @param {import('@playwright/test').Page} page 
 */
async function clearRoutes(page) {
  await page.unroute('**/*');
}

/**
 * Take screenshot with timestamp
 * @param {import('@playwright/test').Page} page 
 * @param {string} name 
 */
async function takeTimestampedScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Log browser console messages for debugging
 * @param {import('@playwright/test').Page} page 
 */
function logConsoleMessages(page) {
  page.on('console', msg => {
    console.log(`[Browser ${msg.type()}]: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.error('[Browser Error]:', error.message);
  });
}

module.exports = {
  waitForHtmxRequest,
  waitForRuneSystem,
  startGeneration,
  waitForGenerationComplete,
  hasActiveAnimation,
  getRuneSystemState,
  checkHtmxInitialized,
  mockSlowNetwork,
  clearRoutes,
  takeTimestampedScreenshot,
  logConsoleMessages
};