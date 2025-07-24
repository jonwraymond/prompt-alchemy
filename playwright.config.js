// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Enhanced Playwright configuration for Prompt Alchemy
 * Optimized for continuous testing and comprehensive coverage
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  
  /* Global test timeout */
  timeout: 60 * 1000, // 60 seconds per test
  
  /* Global timeout for expect() assertions */
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1, // Allow 1 retry locally for flaky tests
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined,
  
  /* Enhanced reporter configuration */
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['line'], // Live progress updates
  ],
  
  /* Enhanced output directory configuration */
  outputDir: 'test-results/artifacts/',
  
  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8090',
    
    /* Collect trace when retrying the failed test. */
    trace: 'retain-on-failure',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Navigation timeout */
    navigationTimeout: 30 * 1000,
    
    /* Action timeout */
    actionTimeout: 10 * 1000,
    
    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true,
    
    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'X-Test-Environment': 'playwright'
    }
  },

  /* Enhanced projects configuration for comprehensive browser testing */
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Chromium-specific settings for gateway effects
        launchOptions: {
          args: [
            '--enable-web-animations-api',
            '--enable-experimental-web-platform-features'
          ]
        }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox-specific settings
        launchOptions: {
          firefoxUserPrefs: {
            'layout.css.backdrop-filter.enabled': true
          }
        }
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // Safari-specific settings for animations
      },
    },
    
    // Mobile browsers for responsive testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // Specialized test configurations
    {
      name: 'continuous-monitoring',
      testMatch: /continuous-integration\.spec\.js/,
      use: { 
        ...devices['Desktop Chrome'],
        // Optimized for continuous monitoring
        trace: 'on',
        screenshot: 'on',
      },
      timeout: 120 * 1000, // Longer timeout for monitoring tests
    },
    
    {
      name: 'api-focused',
      testMatch: /api-integration\.spec\.js/,
      use: { 
        ...devices['Desktop Chrome'],
        // API-focused configuration
      },
      retries: 3, // More retries for API tests due to external dependencies
    },
    
    {
      name: 'gateway-effects',
      testMatch: /gateway-effects\.spec\.js/,
      use: { 
        ...devices['Desktop Chrome'],
        // Optimized for visual effects testing
        video: 'on', // Always record videos for effects tests
        launchOptions: {
          args: [
            '--enable-web-animations-api',
            '--force-gpu-compositing',
            '--enable-accelerated-2d-canvas'
          ]
        }
      },
    }
  ],

  /* Enhanced web server configuration */
  webServer: {
    command: 'docker-compose up prompt-alchemy-web',
    url: 'http://localhost:8090',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    
    /* Additional health checks */
    ignoreHTTPSErrors: true,
    
    /* Environment variables for the server */
    env: {
      NODE_ENV: 'test',
      API_TEST_MODE: 'true'
    }
  },
  
  /* Global setup and teardown */
  globalSetup: './tests/helpers/global-setup.js',
  globalTeardown: './tests/helpers/global-teardown.js',
});