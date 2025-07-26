import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Prompt Alchemy Playwright tests
 * 
 * This setup runs once before all tests and:
 * - Ensures servers are ready
 * - Sets up test data
 * - Performs authentication if needed
 * - Configures test environment
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Global Setup: Starting Prompt Alchemy test environment...');

  // Extract base URLs from config
  const webBaseURL = config.projects.find(p => p.name === 'chromium')?.use?.baseURL || 'http://localhost:8090';
  const apiBaseURL = 'http://localhost:8080';

  // Create a browser instance for setup operations
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for API server to be ready
    console.log('⏳ Waiting for API server to be ready...');
    await waitForServer(page, `${apiBaseURL}/health`, 60000);
    console.log('✅ API server is ready');

    // Wait for web server to be ready
    console.log('⏳ Waiting for web server to be ready...');
    await waitForServer(page, `${webBaseURL}/health`, 60000);
    console.log('✅ Web server is ready');

    // Verify critical API endpoints
    await verifyAPIEndpoints(page, apiBaseURL);

    // Set up test data if needed
    await setupTestData(page, apiBaseURL);

    console.log('🎉 Global setup completed successfully');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Wait for a server to respond
 */
async function waitForServer(page: any, url: string, timeout: number) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await page.request.get(url);
      if (response.ok()) {
        return;
      }
    } catch (error) {
      // Server not ready yet, continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`Server at ${url} did not become ready within ${timeout}ms`);
}

/**
 * Verify that critical API endpoints are working
 */
async function verifyAPIEndpoints(page: any, apiBaseURL: string) {
  console.log('🔍 Verifying API endpoints...');

  const endpoints = [
    '/api/v1/health',
    '/api/v1/status',
    '/api/v1/info',
    '/api/v1/providers'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await page.request.get(`${apiBaseURL}${endpoint}`);
      if (!response.ok()) {
        console.warn(`⚠️ Endpoint ${endpoint} returned status ${response.status()}`);
      } else {
        console.log(`✅ Endpoint ${endpoint} is working`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to check endpoint ${endpoint}:`, error);
    }
  }
}

/**
 * Set up test data
 */
async function setupTestData(page: any, apiBaseURL: string) {
  console.log('📝 Setting up test data...');
  
  // Create test prompts if needed
  try {
    const testPrompt = {
      content: 'Test prompt for automated testing',
      phase: 'prima-materia',
      provider: 'openai',
      tags: ['test', 'automation']
    };

    const response = await page.request.post(`${apiBaseURL}/api/v1/prompts`, {
      data: testPrompt,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok()) {
      console.log('✅ Test prompt created');
    }
  } catch (error) {
    console.log('ℹ️ Test data setup completed (some operations may have failed)');
  }
}

export default globalSetup; 