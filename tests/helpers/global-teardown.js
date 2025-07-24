// Global teardown for Playwright tests
// This runs once after all tests complete

async function globalTeardown(config) {
  console.log('🏁 Playwright Global Teardown - Starting...');
  
  // Calculate total test suite duration
  const testSuiteEndTime = Date.now();
  const totalDuration = global.testSuiteStartTime ? 
    testSuiteEndTime - global.testSuiteStartTime : 0;
  
  console.log(`⏱️  Total test suite duration: ${Math.round(totalDuration / 1000)}s`);
  
  // Cleanup and reporting
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Generate summary report
    const summaryReport = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        ci: !!process.env.CI,
        baseURL: config.use.baseURL
      },
      configuration: {
        workers: config.workers,
        retries: config.retries,
        timeout: config.timeout,
        projects: config.projects?.length || 0
      }
    };
    
    // Write summary to file
    const testResultsDir = path.resolve(__dirname, '../../test-results');
    const summaryPath = path.join(testResultsDir, 'test-summary.json');
    
    fs.writeFileSync(summaryPath, JSON.stringify(summaryReport, null, 2));
    console.log('📊 Test summary written to test-summary.json');
    
    // Check for any remaining test artifacts
    const artifactsDir = path.join(testResultsDir, 'artifacts');
    if (fs.existsSync(artifactsDir)) {
      const artifacts = fs.readdirSync(artifactsDir);
      if (artifacts.length > 0) {
        console.log(`📁 Generated ${artifacts.length} test artifacts`);
      }
    }
    
    // Performance recommendations based on duration
    const durationMinutes = totalDuration / (1000 * 60);
    if (durationMinutes > 10) {
      console.log('⚠️  Test suite took longer than 10 minutes');
      console.log('💡 Consider parallelization or test optimization');
    } else if (durationMinutes > 5) {
      console.log('ℹ️  Test suite duration is moderate (>5 min)');
    } else {
      console.log('✅ Test suite completed in good time');
    }
    
    // Clean up temporary test data if any
    const tempFiles = [
      'test-temp.json',
      'debug-output.log'
    ];
    
    let cleanedFiles = 0;
    tempFiles.forEach(file => {
      const filePath = path.join(testResultsDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        cleanedFiles++;
      }
    });
    
    if (cleanedFiles > 0) {
      console.log(`🧹 Cleaned up ${cleanedFiles} temporary files`);
    }
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Error during global teardown:', error.message);
    // Don't throw error to avoid masking test results
  }
  
  console.log('=====================================');
  console.log('🎭 Playwright test suite complete');
}

module.exports = globalTeardown; 