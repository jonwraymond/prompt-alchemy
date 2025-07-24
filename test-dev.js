#!/usr/bin/env node

/**
 * Development test runner with live reload capability
 * Monitors file changes and re-runs tests automatically
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DevTestRunner {
  constructor() {
    this.testProcess = null;
    this.watchers = [];
    this.debounceTimer = null;
    this.isRunning = false;
  }

  async start() {
    console.log('🧪 Starting Playwright Development Test Runner...');
    console.log('📁 Watching for changes in: web/, tests/, package.json');
    console.log('🔄 Tests will automatically re-run when files change');
    console.log('🛑 Press Ctrl+C to stop');
    
    // Initial test run
    await this.runTests();
    
    // Set up file watchers
    this.setupWatchers();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down test runner...');
      this.cleanup();
      process.exit(0);
    });
  }

  setupWatchers() {
    const watchPaths = [
      'web',
      'tests',
      'package.json',
      'playwright.config.js'
    ];

    watchPaths.forEach(watchPath => {
      if (fs.existsSync(watchPath)) {
        const watcher = fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
          if (filename && this.shouldRerunTests(filename)) {
            console.log(`\n📝 File changed: ${filename}`);
            this.debounceRerun();
          }
        });
        
        this.watchers.push(watcher);
        console.log(`👀 Watching: ${watchPath}`);
      }
    });
  }

  shouldRerunTests(filename) {
    // Skip temporary files, node_modules, etc.
    if (filename.includes('node_modules') || 
        filename.includes('.git') || 
        filename.includes('test-results') ||
        filename.startsWith('.') ||
        filename.endsWith('.tmp') ||
        filename.endsWith('.log')) {
      return false;
    }

    // Only rerun for relevant file types
    const relevantExtensions = ['.js', '.html', '.css', '.json', '.yml', '.yaml', '.go'];
    return relevantExtensions.some(ext => filename.endsWith(ext));
  }

  debounceRerun() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.runTests();
    }, 1000); // Wait 1 second after last change
  }

  async runTests() {
    if (this.isRunning) {
      console.log('⏳ Tests already running, skipping...');
      return;
    }

    this.isRunning = true;
    
    // Kill existing test process if running
    if (this.testProcess) {
      this.testProcess.kill();
    }

    console.log('\n🚀 Running Playwright tests...');
    console.log('═'.repeat(50));

    const startTime = Date.now();

    return new Promise((resolve) => {
      this.testProcess = spawn('npx', ['playwright', 'test', '--headed'], {
        stdio: 'inherit',
        shell: true
      });

      this.testProcess.on('close', (code) => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        if (code === 0) {
          console.log(`\n✅ Tests completed successfully in ${duration}s`);
        } else {
          console.log(`\n❌ Tests failed with exit code ${code} in ${duration}s`);
        }
        
        console.log('═'.repeat(50));
        console.log('👀 Watching for changes...\n');
        
        this.isRunning = false;
        this.testProcess = null;
        resolve();
      });

      this.testProcess.on('error', (error) => {
        console.error('❌ Failed to start test process:', error.message);
        this.isRunning = false;
        this.testProcess = null;
        resolve();
      });
    });
  }

  cleanup() {
    // Close file watchers
    this.watchers.forEach(watcher => {
      watcher.close();
    });

    // Kill test process
    if (this.testProcess) {
      this.testProcess.kill();
    }

    // Clear timers
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}

// CLI handling
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🧪 Playwright Development Test Runner

Usage: node test-dev.js [options]

Options:
  --help, -h     Show this help message
  --single       Run tests once without watching
  --debug        Run tests in debug mode
  --ui           Run tests with UI mode

Examples:
  node test-dev.js              # Start with file watching
  node test-dev.js --single     # Run once and exit
  node test-dev.js --debug      # Run with debugging
  node test-dev.js --ui         # Run with Playwright UI
  `);
  process.exit(0);
}

if (args.includes('--single')) {
  // Single run mode
  console.log('🧪 Running tests once...');
  const testProcess = spawn('npx', ['playwright', 'test', '--headed'], {
    stdio: 'inherit',
    shell: true
  });
  
  testProcess.on('close', (code) => {
    process.exit(code);
  });
} else if (args.includes('--debug')) {
  // Debug mode
  console.log('🐛 Running tests in debug mode...');
  const testProcess = spawn('npx', ['playwright', 'test', '--debug'], {
    stdio: 'inherit',
    shell: true
  });
  
  testProcess.on('close', (code) => {
    process.exit(code);
  });
} else if (args.includes('--ui')) {
  // UI mode
  console.log('🎨 Running tests with UI...');
  const testProcess = spawn('npx', ['playwright', 'test', '--ui'], {
    stdio: 'inherit',
    shell: true
  });
  
  testProcess.on('close', (code) => {
    process.exit(code);
  });
} else {
  // Default: watch mode
  const runner = new DevTestRunner();
  runner.start().catch(error => {
    console.error('❌ Failed to start test runner:', error);
    process.exit(1);
  });
}