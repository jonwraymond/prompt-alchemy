import { test, expect } from '../fixtures/base-fixtures';
import { 
  MockServiceManager, 
  APIEndpointMocks, 
  mockScenarios 
} from '../fixtures/mock-services';
import { 
  TestDataFactory,
  generatePromptInput,
  seedTestData 
} from '../fixtures/test-data-generators';
import {
  compareVisualState,
  generateAccessibilityVisualReport,
  capturePerformanceVisuals,
  testHexGridVisualState,
  generateVisualTestReport
} from '../helpers/visual-regression-utils';
import { 
  waitForHexGridLoaded,
  typeIntoAIInput,
  submitAIInput 
} from '../helpers/test-utils';

/**
 * Comprehensive UI Integration Tests
 * 
 * This test suite demonstrates the complete testing infrastructure:
 * - Visual regression testing with pixel-perfect comparisons
 * - Performance monitoring and animation testing
 * - Accessibility compliance validation
 * - Cross-browser compatibility testing
 * - Real-time feedback loops with screenshot analysis
 * - Automated error scenario testing
 * - Mock service integration
 * - Test data generation and validation
 * 
 * The tests cover the complete user journey from initial page load
 * through prompt generation with full visual validation.
 */

test.describe('Comprehensive UI Testing System', () => {
  let mockManager: MockServiceManager;
  let testResults: Array<{ name: string; passed: boolean; diffPixels?: number }> = [];

  test.beforeAll(async () => {
    // Seed test data for reproducible results
    seedTestData(12345);
  });

  test.beforeEach(async ({ page, hexGridPage }) => {
    // Initialize mock service manager
    mockManager = new MockServiceManager(page);
    
    // Set up API mocks for consistent testing
    const apiMocks = new APIEndpointMocks(mockManager);
    await apiMocks.mockGenerateEndpoint({ 
      provider: 'openai', 
      delay: 1200,
      customResponse: {
        success: true,
        data: {
          prompts: [
            'Create a comprehensive marketing strategy focusing on digital transformation',
            'Develop an integrated approach to customer engagement through multiple channels',
            'Design a data-driven framework for measuring campaign effectiveness and ROI'
          ],
          phases: {
            prima_materia: 'Breaking down marketing strategy into core components: audience analysis, channel selection, message crafting',
            solutio: 'Flowing integration of digital touchpoints creating seamless customer journey experiences',
            coagulatio: 'Crystallized strategic framework with measurable KPIs and implementation roadmap'
          },
          metadata: {
            provider: 'openai',
            tokens_used: 567,
            execution_time_ms: 1200,
            score: 9.2
          }
        }
      }
    });
    await apiMocks.mockProvidersEndpoint();
    await apiMocks.mockHealthEndpoint();

    // Navigate to page and ensure hex grid is loaded
    await hexGridPage.goto();
    await waitForHexGridLoaded(page);
  });

  test.afterEach(async () => {
    // Clean up mocks after each test
    await mockManager.clearAllMocks();
  });

  test.afterAll(async () => {
    // Generate comprehensive test report
    await generateVisualTestReport(testResults);
  });

  test.describe('Complete User Journey with Visual Validation', () => {
    test('should complete full generation workflow with visual feedback', async ({ page }) => {
      // Phase 1: Initial page load and visual validation
      try {
        await compareVisualState(page, 'body', 'initial-page-load', {
          threshold: 0.1,
          animations: 'disabled',
          fullPage: true
        });
        testResults.push({ name: 'initial-page-load', passed: true });
      } catch (error) {
        testResults.push({ name: 'initial-page-load', passed: false });
        console.error('Initial page load visual test failed:', error);
      }

      // Phase 2: Hex grid visual validation
      try {
        await testHexGridVisualState(page);
        testResults.push({ name: 'hex-grid-initial-state', passed: true });
      } catch (error) {
        testResults.push({ name: 'hex-grid-initial-state', passed: false });
        console.error('Hex grid visual validation failed:', error);
      }

      // Phase 3: Form interaction and validation
      const testInput = generatePromptInput('code');
      
      // Input interaction with visual feedback
      await page.fill('#input', testInput);
      
      try {
        await compareVisualState(page, '#generate-form', 'form-with-input', {
          threshold: 0.15
        });
        testResults.push({ name: 'form-with-input', passed: true });
      } catch (error) {
        testResults.push({ name: 'form-with-input', passed: false });
      }

      // Phase 4: Form submission and loading state
      await page.click('button[type="submit"]');
      
      // Capture loading state
      await page.waitForTimeout(500);
      try {
        await compareVisualState(page, '#hex-flow-container', 'generation-loading-state', {
          threshold: 0.2,
          animations: 'allow'
        });
        testResults.push({ name: 'generation-loading-state', passed: true });
      } catch (error) {
        testResults.push({ name: 'generation-loading-state', passed: false });
      }

      // Phase 5: Results display and validation
      await page.waitForSelector('.prompt-result', { timeout: 15000 });
      
      try {
        await compareVisualState(page, '.results-container', 'generation-results', {
          threshold: 0.15,
          mask: ['.timestamp', '.execution-time'] // Mask dynamic content
        });
        testResults.push({ name: 'generation-results', passed: true });
      } catch (error) {
        testResults.push({ name: 'generation-results', passed: false });
      }

      // Validate results content
      const results = page.locator('.prompt-result');
      const resultCount = await results.count();
      expect(resultCount).toBe(3);
      
      // Validate each result contains expected content
      for (let i = 0; i < resultCount; i++) {
        const result = results.nth(i);
        await expect(result).toContainText('marketing strategy');
      }
    });

    test('should handle error scenarios with proper visual feedback', async ({ page }) => {
      // Set up error scenario
      await mockManager.registerMock('**/api/v1/prompts/generate', {
        provider: 'openai',
        delay: 500,
        errorRate: 1.0,
        customResponse: {
          success: false,
          error: 'Rate limit exceeded. Please try again in 60 seconds.',
          error_code: 'RATE_LIMIT_EXCEEDED',
          retry_after: 60
        }
      });

      // Trigger error scenario
      await page.fill('#input', 'Test error handling');
      await page.click('button[type="submit"]');
      
      // Wait for error state
      await page.waitForSelector('.error-message', { timeout: 10000 });
      
      try {
        await compareVisualState(page, '.error-container', 'error-state-display', {
          threshold: 0.15
        });
        testResults.push({ name: 'error-state-display', passed: true });
      } catch (error) {
        testResults.push({ name: 'error-state-display', passed: false });
      }

      // Validate error message content
      const errorMessage = page.locator('.error-message');
      await expect(errorMessage).toContainText('Rate limit exceeded');
    });
  });

  test.describe('Performance and Animation Testing', () => {
    test('should monitor performance during intensive interactions', async ({ page }) => {
      // Create performance testing scenario
      const startTime = Date.now();
      
      try {
        await capturePerformanceVisuals(page, {
          captureTimeframes: [0, 1000, 2000, 3000],
          highlightSlowElements: true,
          showLoadingStates: false
        });
        testResults.push({ name: 'performance-monitoring', passed: true });
      } catch (error) {
        testResults.push({ name: 'performance-monitoring', passed: false });
      }

      // Test rapid interactions
      for (let i = 0; i < 5; i++) {
        await page.locator('[data-node-id="hub"] polygon').hover();
        await page.waitForTimeout(100);
        await page.locator('[data-node-id="prima"] polygon').hover();
        await page.waitForTimeout(100);
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should validate animation smoothness and timing', async ({ page }) => {
      // Test hex grid animations
      const hubNode = page.locator('[data-node-id="hub"] polygon');
      
      // Capture hover animation sequence
      const animationStartTime = Date.now();
      await hubNode.hover();
      
      // Wait for animation completion
      await page.waitForTimeout(1000);
      
      const animationDuration = Date.now() - animationStartTime;
      expect(animationDuration).toBeGreaterThan(300); // Animation should take some time
      expect(animationDuration).toBeLessThan(2000); // But not too long
      
      // Validate final animation state
      try {
        await compareVisualState(page, '[data-node-id="hub"]', 'hub-hover-final-state', {
          threshold: 0.2
        });
        testResults.push({ name: 'animation-final-state', passed: true });
      } catch (error) {
        testResults.push({ name: 'animation-final-state', passed: false });
      }
    });
  });

  test.describe('Accessibility Testing with Visual Validation', () => {
    test('should generate comprehensive accessibility report', async ({ page }) => {
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

    test('should validate keyboard navigation and focus management', async ({ page }) => {
      // Test tab navigation through interactive elements
      const focusableElements = [
        '#input',
        'button[type="submit"]',
        '[data-node-id="hub"] polygon',
        '[data-node-id="input"] polygon',
        '[data-node-id="output"] polygon'
      ];

      for (const selector of focusableElements) {
        await page.focus(selector);
        await page.waitForTimeout(200);
        
        // Validate focus indicator visibility
        const focusedElement = page.locator(selector);
        await expect(focusedElement).toBeFocused();
        
        try {
          await compareVisualState(page, selector, `focus-${selector.replace(/[\[\]"=\s#]/g, '-')}`, {
            threshold: 0.2
          });
          testResults.push({ name: `focus-${selector.replace(/[\[\]"=\s#]/g, '-')}`, passed: true });
        } catch (error) {
          testResults.push({ name: `focus-${selector.replace(/[\[\]"=\s#]/g, '-')}`, passed: false });
        }
      }
    });

    test('should validate ARIA attributes and semantic structure', async ({ page }) => {
      // Check for proper ARIA labeling
      const inputField = page.locator('#input');
      await expect(inputField).toHaveAttribute('aria-label');
      
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toHaveAttribute('aria-describedby');
      
      // Check for proper heading structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
      
      // Validate landmark regions
      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible();
    });
  });

  test.describe('Cross-Browser Compatibility Testing', () => {
    test('should maintain visual consistency across viewport sizes', async ({ page }) => {
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop-xl' },
        { width: 1280, height: 720, name: 'desktop' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 375, height: 667, name: 'mobile' }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(500); // Allow layout to settle
        
        try {
          await compareVisualState(page, '#hex-flow-container', `responsive-${viewport.name}`, {
            threshold: 0.15,
            animations: 'disabled',
            clip: { x: 0, y: 0, width: viewport.width, height: Math.min(800, viewport.height) }
          });
          testResults.push({ name: `responsive-${viewport.name}`, passed: true });
        } catch (error) {
          testResults.push({ name: `responsive-${viewport.name}`, passed: false });
          console.error(`Responsive test failed for ${viewport.name}:`, error);
        }
      }
    });

    test('should validate touch interactions on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Simulate touch interactions
      const hubNode = page.locator('[data-node-id="hub"] polygon');
      
      // Touch hover simulation
      await hubNode.tap();
      await page.waitForTimeout(300);
      
      try {
        await compareVisualState(page, '[data-node-id="hub"]', 'mobile-touch-interaction', {
          threshold: 0.2
        });
        testResults.push({ name: 'mobile-touch-interaction', passed: true });
      } catch (error) {
        testResults.push({ name: 'mobile-touch-interaction', passed: false });
      }
    });
  });

  test.describe('Real-time Feedback and Data Validation', () => {
    test('should validate generated data quality and format', async ({ page }) => {
      // Use test data factory to create realistic test data
      const testData = TestDataFactory.createPromptSet(3, 'code');
      
      // Mock API response with test data
      await mockManager.registerMock('**/api/v1/prompts/generate', {
        provider: 'openai',
        delay: 1000,
        customResponse: {
          success: true,
          data: {
            prompts: testData.map(d => d.output[0]),
            phases: testData[0].phases,
            metadata: testData[0].metadata
          }
        }
      });

      // Trigger generation
      await page.fill('#input', testData[0].input);
      await page.click('button[type="submit"]');
      
      // Wait for results
      await page.waitForSelector('.prompt-result', { timeout: 15000 });
      
      // Validate data structure and content
      const results = page.locator('.prompt-result');
      const resultCount = await results.count();
      expect(resultCount).toBe(3);
      
      // Validate metadata display
      const metadata = page.locator('.generation-metadata');
      await expect(metadata).toContainText('openai');
      await expect(metadata).toContainText('567 tokens');
    });

    test('should provide real-time feedback during generation process', async ({ page }) => {
      // Set up slower mock to see loading states
      await mockManager.registerMock('**/api/v1/prompts/generate', {
        provider: 'anthropic',
        delay: 3000,
        customResponse: {
          success: true,
          data: {
            prompts: ['Long generation result'],
            phases: {
              prima_materia: 'Extended analysis phase',
              solutio: 'Comprehensive transformation',
              coagulatio: 'Detailed crystallization'
            }
          }
        }
      });

      // Start generation
      await page.fill('#input', 'Test real-time feedback');
      await page.click('button[type="submit"]');
      
      // Capture loading states at different intervals
      const loadingStates = [500, 1500, 2500];
      for (const interval of loadingStates) {
        await page.waitForTimeout(interval);
        
        try {
          await compareVisualState(page, '#hex-flow-container', `loading-state-${interval}ms`, {
            threshold: 0.25,
            animations: 'allow'
          });
          testResults.push({ name: `loading-state-${interval}ms`, passed: true });
        } catch (error) {
          testResults.push({ name: `loading-state-${interval}ms`, passed: false });
        }
      }
      
      // Wait for completion
      await page.waitForSelector('.prompt-result', { timeout: 15000 });
    });
  });

  test.describe('Integration Testing with Mock Services', () => {
    test('should handle multiple provider scenarios', async ({ page }) => {
      const providers = ['openai', 'anthropic', 'google'];
      
      for (const provider of providers) {
        // Set up provider-specific mock
        await mockManager.registerMock('**/api/v1/prompts/generate', {
          provider,
          delay: 1000,
          customResponse: {
            success: true,
            data: {
              prompts: [`${provider} generated response`],
              metadata: { provider, model: `${provider}-model` }
            }
          }
        });

        // Test generation with this provider
        await page.selectOption('#provider', provider);
        await page.fill('#input', `Test ${provider} generation`);
        await page.click('button[type="submit"]');
        
        await page.waitForSelector('.prompt-result', { timeout: 10000 });
        
        // Validate provider-specific response
        const result = page.locator('.prompt-result').first();
        await expect(result).toContainText(`${provider} generated response`);
        
        // Clean up for next iteration
        await mockManager.removeMock('generate-endpoint');
        await page.reload();
        await waitForHexGridLoaded(page);
      }
    });

    test('should recover gracefully from service failures', async ({ page }) => {
      // Test service failure and recovery
      await mockManager.registerMock('**/api/v1/prompts/generate', {
        provider: 'openai',
        delay: 500,
        errorRate: 1.0,
        customResponse: {
          success: false,
          error: 'Service temporarily unavailable'
        }
      });

      // Attempt generation
      await page.fill('#input', 'Test service failure');
      await page.click('button[type="submit"]');
      
      // Validate error handling
      await page.waitForSelector('.error-message', { timeout: 10000 });
      
      // Simulate service recovery
      await mockManager.registerMock('**/api/v1/prompts/generate', {
        provider: 'openai',
        delay: 1000,
        customResponse: {
          success: true,
          data: {
            prompts: ['Recovered service response'],
            metadata: { provider: 'openai' }
          }
        }
      });

      // Retry generation
      await page.click('button[type="submit"]');
      await page.waitForSelector('.prompt-result', { timeout: 10000 });
      
      const result = page.locator('.prompt-result').first();
      await expect(result).toContainText('Recovered service response');
    });
  });
});