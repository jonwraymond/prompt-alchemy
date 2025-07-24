// Global setup for Playwright tests
// This runs once before all tests

async function globalSetup(config) {
  console.log('🚀 Playwright Global Setup - Starting...');
  
  // Log test environment details
  console.log('Test Configuration:');
  console.log(`  - Base URL: ${config.use.baseURL}`);
  console.log(`  - Test Directory: ${config.testDir}`);
  console.log(`  - Workers: ${config.workers || 'auto'}`);
  console.log(`  - Retries: ${config.retries}`);
  
  // Environment checks
  const environment = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    ci: !!process.env.CI,
    testMode: process.env.API_TEST_MODE
  };
  
  console.log('Environment Details:', environment);
  
  // Wait for server to be ready (additional check beyond webServer config)
  if (config.webServer) {
    console.log('🔍 Verifying server readiness...');
    
    const maxAttempts = 30;
    const delay = 2000; // 2 seconds
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(config.use.baseURL, {
          method: 'GET',
          timeout: 5000
        });
        
        if (response.status < 500) {
          console.log('✅ Server is ready for testing');
          break;
        }
      } catch (error) {
        if (attempt === maxAttempts) {
          console.error('❌ Server failed to become ready:', error.message);
          throw new Error(`Server not ready after ${maxAttempts} attempts`);
        }
        
        console.log(`⏳ Attempt ${attempt}/${maxAttempts}: Server not ready, waiting...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Pre-test validations
  console.log('🔧 Running pre-test validations...');
  
  // Validate test files exist
  const fs = require('fs');
  const path = require('path');
  
  const requiredTestFiles = [
    'api-integration.spec.js',
    'gateway-effects.spec.js',
    'continuous-integration.spec.js'
  ];
  
  const testDir = path.resolve(__dirname, '../');
  
  for (const testFile of requiredTestFiles) {
    const testPath = path.join(testDir, testFile);
    if (!fs.existsSync(testPath)) {
      throw new Error(`Required test file missing: ${testFile}`);
    }
  }
  
  console.log('✅ All required test files present');
  
  // Create test results directory if it doesn't exist
  const testResultsDir = path.resolve(__dirname, '../../test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
    console.log('📁 Created test-results directory');
  }
  
  // Log start time for performance tracking
  global.testSuiteStartTime = Date.now();
  
  console.log('🎯 Global setup completed successfully');
  console.log('=====================================');
}

module.exports = globalSetup; 