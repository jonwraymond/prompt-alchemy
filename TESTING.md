# 🧪 Playwright Testing for HTMX Interface

This document outlines the comprehensive testing setup for the Prompt Alchemy HTMX interface using Playwright.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Docker and Docker Compose running
- Prompt Alchemy web service running on port 8090

### Installation
```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run test:install
```

### Basic Test Run
```bash
# Run all tests headlessly
npm test

# Run tests with browser visible
npm run test:headed

# Run tests with Playwright UI
npm run test:ui
```

## 🔥 Live Development Mode

For **instant feedback** during development, use these live reload options:

### Option 1: File Watcher + Auto-Rebuild
```bash
# Watch for file changes and rebuild container automatically
npm run dev:watch
```

This will:
- Monitor `web/` directory for changes
- Automatically rebuild and restart the web container
- Provide instant feedback when you modify templates, CSS, or Go code

### Option 2: Live Test Runner
```bash
# Watch for changes and re-run tests automatically  
npm run test:dev
```

This will:
- Monitor `web/`, `tests/`, and config files
- Re-run Playwright tests whenever files change
- Show test results in real-time

### Option 3: Full Development Mode
```bash
# Run both file watcher and test runner together
npm run dev:full
```

This combines both watchers for maximum development velocity.

## 📋 Test Categories

### 1. HTMX Interactions (`htmx-interactions.spec.js`)
Tests core HTMX functionality:
- Form submissions with `hx-post`
- Dynamic content loading with `hx-get`
- Progress tracking and state management
- Error handling and recovery
- Multi-device responsiveness

### 2. Form Submissions (`form-submissions.spec.js`)
Tests form behavior and validation:
- Input validation and error states
- Provider selection and dynamic updates
- Phase selection checkboxes
- Special characters and edge cases
- Concurrent form submissions

### 3. Rune System (`rune-system.spec.js`)
Tests the animated rune visualization:
- SVG rendering and layout
- Animation state transitions
- Hover and interaction effects
- Responsive layout changes
- Performance under load

## 🛠 Development Workflow

### Making Changes with Live Feedback

1. **Start the live watcher:**
   ```bash
   npm run dev:watch
   ```

2. **In another terminal, start the test runner:**
   ```bash
   npm run test:dev
   ```

3. **Make changes to your files:**
   - Edit `web/templates/*.html`
   - Modify `web/static/css/*.css`
   - Update Go handlers in `cmd/web/`

4. **See instant results:**
   - File watcher rebuilds container (5-10 seconds)
   - Test runner re-runs relevant tests
   - Browser shows updated interface

### Example Development Session
```bash
# Terminal 1: Start file watcher
npm run dev:watch

# Terminal 2: Start test runner  
npm run test:dev

# Terminal 3: Make changes
echo "/* New styles */" >> web/static/css/alchemy.css

# Results:
# - Terminal 1: Shows rebuild progress
# - Terminal 2: Shows test results
# - Browser: Updated styles visible immediately
```

## 🎯 Test Configuration

### Browsers Tested
- Chromium (Desktop)
- Firefox (Desktop)  
- Safari/WebKit (Desktop)
- Chrome Mobile (Pixel 5)
- Safari Mobile (iPhone 12)

### Test Environment
- Base URL: `http://localhost:8090`
- Auto-retry on CI: 2 attempts
- Screenshots on failure
- Video recording on failure
- Trace collection for debugging

### Custom Configuration
Edit `playwright.config.js` to modify:
- Timeout values
- Browser selection
- Reporter options
- Base URL for different environments

## 🐛 Debugging Tests

### Visual Debugging
```bash
# Run tests with browser visible
npm run test:headed

# Run specific test with debugging
npm run test:debug

# Use Playwright UI for interactive debugging
npm run test:ui
```

### Debug Specific Test
```bash
# Run single test file
npx playwright test htmx-interactions.spec.js --headed

# Run specific test by name
npx playwright test --grep "should handle form submission"

# Debug with browser dev tools
npx playwright test --debug --grep "rune animation"
```

### Console Logging
Tests include automatic console logging:
- Browser console messages
- Network requests/responses
- JavaScript errors
- Performance metrics

## 📊 Test Reports

### View Results
```bash
# Generate and view HTML report
npm run test:report

# View last test results
ls test-results/
```

### CI Integration
Test results are exported in multiple formats:
- HTML report (`test-results/`)
- JUnit XML (`test-results/results.xml`)
- JSON (`test-results/results.json`)

## 🚨 Common Issues

### Container Not Starting
```bash
# Check if containers are running
docker-compose ps

# Restart web container
docker-compose restart prompt-alchemy-web

# View logs
docker-compose logs prompt-alchemy-web
```

### Tests Timing Out
```bash
# Increase timeout in playwright.config.js
use: {
  timeout: 60000, // 60 seconds
}

# Or set per test
test('slow test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
});
```

### Browser Installation Issues
```bash
# Reinstall browsers
npx playwright install

# Install specific browser
npx playwright install chromium
```

## 🎨 Custom Test Utilities

The `tests/helpers/test-utils.js` file provides utilities:

```javascript
const { waitForHtmxRequest, startGeneration } = require('./helpers/test-utils');

test('custom test', async ({ page }) => {
  await startGeneration(page, 'Test input');
  await waitForHtmxRequest(page);
  // Test continues...
});
```

Available utilities:
- `waitForHtmxRequest()` - Wait for HTMX requests
- `startGeneration()` - Start prompt generation
- `getRuneSystemState()` - Get current rune states
- `mockSlowNetwork()` - Test loading states
- `takeTimestampedScreenshot()` - Debug screenshots

## 📈 Performance Testing

### Load Testing
```bash
# Run performance-focused tests
npx playwright test --grep "performance"

# Test with slow network simulation
npx playwright test --grep "slow network"
```

### Memory Monitoring
Tests include checks for:
- Memory leaks in long-running sessions
- Animation performance
- Large result handling
- Concurrent user simulation

## 🔧 Advanced Configuration

### Environment Variables
```bash
# Test against different environments
BASE_URL=http://staging.example.com npm test

# Enable debug mode
DEBUG=true npm run test:dev

# Mock API responses
MOCK_API=true npm test
```

### Custom Reporters
Add custom reporters in `playwright.config.js`:
```javascript
reporter: [
  ['html'],
  ['junit', { outputFile: 'results.xml' }],
  ['./custom-reporter.js'] // Your custom reporter
]
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [HTMX Testing Guide](https://htmx.org/docs/#testing)
- [Docker Compose Override Files](https://docs.docker.com/compose/extends/)

---

**Happy Testing! 🎭**

*This testing setup provides comprehensive coverage of the HTMX interface with live reload capabilities for rapid development.*