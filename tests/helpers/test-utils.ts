import { Page, expect, Locator } from '@playwright/test';

/**
 * Test utilities for Prompt Alchemy Playwright tests
 * 
 * This module provides reusable helper functions for:
 * - Page interactions
 * - Element waiting strategies
 * - Data generation
 * - Assertions
 * - Common workflows
 */

// ============================================================================
// Page Interaction Helpers
// ============================================================================

/**
 * Wait for an element to be visible and interactable
 */
export async function waitForElement(page: Page, selector: string, timeout: number = 10000): Promise<Locator> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  return element;
}

/**
 * Wait for multiple elements to be visible
 */
export async function waitForElements(page: Page, selectors: string[], timeout: number = 10000): Promise<Locator[]> {
  const elements = selectors.map(selector => page.locator(selector));
  await Promise.all(elements.map(element => element.waitFor({ state: 'visible', timeout })));
  return elements;
}

/**
 * Wait for any loading states to complete
 */
export async function waitForLoadingComplete(page: Page): Promise<void> {
  // Wait for HTMX requests to complete
  await page.waitForFunction(() => {
    return (window as any).htmx?.trigger('htmx:afterRequest') || true;
  }, { timeout: 30000 });

  // Wait for any spinners or loading indicators to disappear
  await page.waitForSelector('.loading', { state: 'hidden', timeout: 5000 }).catch(() => {
    // Loading indicator might not exist, which is fine
  });

  // Wait for hex grid to initialize if present
  await page.waitForFunction(() => {
    return !(window as any).hexFlowBoard?.isInitializing;
  }, { timeout: 10000 }).catch(() => {
    // Hex grid might not be present, which is fine
  });
}

/**
 * Scroll element into view and wait for it to be stable
 */
export async function scrollToElement(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await element.waitFor({ state: 'visible' });
  // Wait a bit for any scroll animations to complete
  await page.waitForTimeout(500);
}

// ============================================================================
// AI Input Component Helpers
// ============================================================================

/**
 * Get the AI input component elements
 */
export async function getAIInputElements(page: Page) {
  return {
    container: page.locator('.ai-input-container'),
    wrapper: page.locator('.ai-input-wrapper'),
    textarea: page.locator('.ai-input'),
    generateBtn: page.locator('.ai-generate-btn'),
    configBtn: page.locator('.ai-config-btn'),
    attachmentBtn: page.locator('.ai-attachment-btn'),
    dropdownArrow: page.locator('.ai-generate-dropdown'),
    counter: page.locator('.ai-input-counter')
  };
}

/**
 * Type text into the AI input with realistic timing
 */
export async function typeIntoAIInput(page: Page, text: string, options: { delay?: number } = {}): Promise<void> {
  const textarea = page.locator('.ai-input');
  await textarea.waitFor({ state: 'visible' });
  await textarea.click();
  await textarea.fill(''); // Clear existing content
  await textarea.type(text, { delay: options.delay || 50 });
}

/**
 * Submit the AI input form
 */
export async function submitAIInput(page: Page): Promise<void> {
  const generateBtn = page.locator('.ai-generate-btn');
  await generateBtn.waitFor({ state: 'visible' });
  await generateBtn.click();
  await waitForLoadingComplete(page);
}

/**
 * Open AI input suggestions dropdown
 */
export async function openAISuggestions(page: Page): Promise<void> {
  const dropdownArrow = page.locator('.ai-generate-dropdown');
  await dropdownArrow.waitFor({ state: 'visible' });
  await dropdownArrow.click();
  await page.waitForSelector('.ai-profiles-menu.visible');
}

// ============================================================================
// Hex Grid Helpers
// ============================================================================

/**
 * Get hex grid elements
 */
export async function getHexGridElements(page: Page) {
  return {
    container: page.locator('#hex-flow-container'),
    svg: page.locator('#hex-flow-board'),
    nodes: page.locator('.hex-node'),
    connections: page.locator('.connection-path'),
    tooltip: page.locator('#hex-tooltip')
  };
}

/**
 * Wait for hex grid to be fully loaded
 */
export async function waitForHexGridLoaded(page: Page): Promise<void> {
  // Wait for container to be visible
  await page.waitForSelector('#hex-flow-container', { state: 'visible' });
  
  // Wait for nodes to be present
  await page.waitForSelector('.hex-node', { timeout: 10000 });
  
  // Wait for initialization to complete
  await page.waitForFunction(() => {
    return (window as any).unifiedHexFlow?.isInitialized === true;
  }, { timeout: 15000 });
}

/**
 * Click on a specific hex node
 */
export async function clickHexNode(page: Page, nodeId: string): Promise<void> {
  const node = page.locator(`[data-node-id="${nodeId}"]`);
  await node.waitFor({ state: 'visible' });
  await node.click();
}

/**
 * Hover over a hex node to show tooltip
 */
export async function hoverHexNode(page: Page, nodeId: string): Promise<void> {
  const node = page.locator(`[data-node-id="${nodeId}"]`);
  await node.waitFor({ state: 'visible' });
  await node.hover();
  await page.waitForSelector('#hex-tooltip.visible', { timeout: 5000 });
}

// ============================================================================
// Form Helpers
// ============================================================================

/**
 * Fill and submit the main generate form
 */
export async function fillAndSubmitForm(page: Page, input: string, options: {
  persona?: string;
  count?: number;
} = {}): Promise<void> {
  // Fill input field
  const inputField = page.locator('#input');
  await inputField.waitFor({ state: 'visible' });
  await inputField.fill(input);

  // Set persona if provided
  if (options.persona) {
    const personaSelect = page.locator('#persona');
    await personaSelect.selectOption(options.persona);
  }

  // Set count if provided
  if (options.count) {
    const countSelect = page.locator('#count');
    await countSelect.selectOption(options.count.toString());
  }

  // Submit form
  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.click();
  await waitForLoadingComplete(page);
}

// ============================================================================
// API Helpers
// ============================================================================

/**
 * Make an API request and return the response
 */
export async function makeAPIRequest(page: Page, method: string, endpoint: string, data?: any) {
  const apiBase = 'http://localhost:8080';
  const options: any = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    options.data = data;
  }

  const response = await page.request[method.toLowerCase() as keyof typeof page.request](`${apiBase}${endpoint}`, options);
  return {
    status: response.status(),
    data: response.ok() ? await response.json() : null,
    response
  };
}

/**
 * Generate a test prompt via API
 */
export async function generateTestPrompt(page: Page, input: string) {
  return makeAPIRequest(page, 'POST', '/api/v1/prompts/generate', {
    input,
    count: 1,
    provider: 'openai',
    phase_selection: 'best'
  });
}

// ============================================================================
// Data Generation Helpers
// ============================================================================

/**
 * Generate random test data
 */
export function generateTestData() {
  const timestamp = Date.now();
  return {
    prompt: `Test prompt ${timestamp}`,
    email: `test${timestamp}@example.com`,
    username: `testuser${timestamp}`,
    id: `test-${timestamp}`,
    tag: `test-tag-${timestamp}`
  };
}

/**
 * Generate realistic prompt content for testing
 */
export function generatePromptContent(): string {
  const prompts = [
    'Create a detailed marketing plan for a new product launch',
    'Write a comprehensive project proposal for team collaboration',
    'Design a user onboarding flow for a mobile application',
    'Develop a content strategy for social media engagement',
    'Create documentation for a REST API with examples'
  ];
  
  return prompts[Math.floor(Math.random() * prompts.length)];
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that an element has specific text content
 */
export async function expectText(page: Page, selector: string, expectedText: string): Promise<void> {
  const element = page.locator(selector);
  await expect(element).toHaveText(expectedText);
}

/**
 * Assert that an element contains specific text
 */
export async function expectToContainText(page: Page, selector: string, expectedText: string): Promise<void> {
  const element = page.locator(selector);
  await expect(element).toContainText(expectedText);
}

/**
 * Assert that an element is visible and enabled
 */
export async function expectVisibleAndEnabled(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
  await expect(element).toBeEnabled();
}

/**
 * Assert API response structure
 */
export function expectAPIResponse(response: any, expectedStatus: number, requiredFields: string[] = []) {
  expect(response.status).toBe(expectedStatus);
  if (response.data) {
    for (const field of requiredFields) {
      expect(response.data).toHaveProperty(field);
    }
  }
}

// ============================================================================
// Wait Strategies
// ============================================================================

/**
 * Wait for network requests to complete
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 30000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for specific text to appear on page
 */
export async function waitForText(page: Page, text: string, timeout: number = 10000): Promise<void> {
  await page.waitForSelector(`text=${text}`, { timeout });
}

/**
 * Wait for element count to match expected value
 */
export async function waitForElementCount(page: Page, selector: string, expectedCount: number, timeout: number = 10000): Promise<void> {
  await page.waitForFunction(
    ({ selector, expectedCount }) => document.querySelectorAll(selector).length === expectedCount,
    { selector, expectedCount },
    { timeout }
  );
}

// ============================================================================
// Screenshot Helpers
// ============================================================================

/**
 * Take a screenshot of a specific element
 */
export async function screenshotElement(page: Page, selector: string, name: string): Promise<void> {
  const element = page.locator(selector);
  await element.screenshot({ path: `test-results/screenshots/${name}.png` });
}

/**
 * Take a full page screenshot
 */
export async function screenshotPage(page: Page, name: string): Promise<void> {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}.png`,
    fullPage: true 
  });
} 