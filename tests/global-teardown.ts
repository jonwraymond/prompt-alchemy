import { chromium, FullConfig } from '@playwright/test';

/**
 * Global teardown for Prompt Alchemy Playwright tests
 * 
 * This teardown runs once after all tests and:
 * - Cleans up test data
 * - Shuts down servers if needed
 * - Performs final cleanup
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Global Teardown: Cleaning up test environment...');

  const apiBaseURL = 'http://localhost:8080';

  // Create a browser instance for cleanup operations
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Clean up test data
    await cleanupTestData(page, apiBaseURL);

    console.log('✅ Global teardown completed successfully');

  } catch (error) {
    console.warn('⚠️ Some cleanup operations failed:', error);
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Clean up test data created during testing
 */
async function cleanupTestData(page: any, apiBaseURL: string) {
  console.log('🗑️ Cleaning up test data...');
  
  try {
    // Get all prompts to find test prompts
    const response = await page.request.get(`${apiBaseURL}/api/v1/prompts?tags=test,automation`);
    
    if (response.ok()) {
      const data = await response.json();
      const prompts = data.prompts || [];
      
      // Delete test prompts
      for (const prompt of prompts) {
        if (prompt.tags && prompt.tags.includes('test')) {
          try {
            await page.request.delete(`${apiBaseURL}/api/v1/prompts/${prompt.id}`);
            console.log(`🗑️ Deleted test prompt: ${prompt.id}`);
          } catch (error) {
            console.warn(`⚠️ Failed to delete prompt ${prompt.id}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.log('ℹ️ Test data cleanup completed (some operations may have failed)');
  }
}

export default globalTeardown; 