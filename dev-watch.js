#!/usr/bin/env node

/**
 * Development file watcher for live reload
 * Monitors web files and rebuilds/restarts containers automatically
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DevWatcher {
  constructor() {
    this.watchers = [];
    this.debounceTimer = null;
    this.isRebuilding = false;
  }

  async start() {
    console.log('🔥 Starting Live Development Watcher...');
    console.log('📁 Watching: web/ directory');
    console.log('🔄 Web container will rebuild/restart on changes');
    console.log('🛑 Press Ctrl+C to stop');
    
    this.setupWatchers();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down dev watcher...');
      this.cleanup();
      process.exit(0);
    });

    // Keep process alive
    process.stdin.resume();
  }

  setupWatchers() {
    const watchPaths = ['web'];

    watchPaths.forEach(watchPath => {
      if (fs.existsSync(watchPath)) {
        const watcher = fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
          if (filename && this.shouldTriggerRebuild(filename)) {
            console.log(`\n📝 File changed: ${filename}`);
            this.debounceRebuild();
          }
        });
        
        this.watchers.push(watcher);
        console.log(`👀 Watching: ${watchPath}/`);
      }
    });
  }

  shouldTriggerRebuild(filename) {
    // Skip temporary files, etc.
    if (filename.includes('.git') || 
        filename.startsWith('.') ||
        filename.endsWith('.tmp') ||
        filename.endsWith('.log') ||
        filename.endsWith('.swp')) {
      return false;
    }

    // Trigger rebuild for web-related files
    const relevantExtensions = ['.html', '.css', '.js', '.go'];
    return relevantExtensions.some(ext => filename.endsWith(ext));
  }

  debounceRebuild() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.rebuildAndRestart();
    }, 2000); // Wait 2 seconds after last change
  }

  async rebuildAndRestart() {
    if (this.isRebuilding) {
      console.log('⏳ Rebuild already in progress, skipping...');
      return;
    }

    this.isRebuilding = true;
    
    console.log('\n🔨 Rebuilding web container...');
    console.log('═'.repeat(50));

    const startTime = Date.now();

    try {
      // Build the web container
      await this.runCommand('docker-compose', ['build', 'prompt-alchemy-web']);
      
      // Restart the web container
      await this.runCommand('docker-compose', ['restart', 'prompt-alchemy-web']);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n✅ Container rebuilt and restarted in ${duration}s`);
      console.log('🌐 Web interface updated at http://localhost:8090');
      
    } catch (error) {
      console.error('\n❌ Rebuild failed:', error.message);
    }
    
    console.log('═'.repeat(50));
    console.log('👀 Watching for changes...\n');
    
    this.isRebuilding = false;
  }

  runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: 'inherit',
        shell: true
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  cleanup() {
    // Close file watchers
    this.watchers.forEach(watcher => {
      watcher.close();
    });

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
🔥 Development File Watcher for Prompt Alchemy

Usage: node dev-watch.js [options]

Options:
  --help, -h     Show this help message
  --test-mode    Also run tests after rebuild

Examples:
  node dev-watch.js              # Watch and rebuild on changes
  node dev-watch.js --test-mode  # Watch, rebuild, and run tests
  `);
  process.exit(0);
}

const watcher = new DevWatcher();
watcher.start().catch(error => {
  console.error('❌ Failed to start dev watcher:', error);
  process.exit(1);
});