# Prompt Alchemy - Comprehensive Testing System

A complete automated testing system for the Prompt Alchemy application featuring visual regression testing, performance monitoring, accessibility validation, and cross-browser compatibility testing.

## 🚀 Overview

This comprehensive testing system provides complete coverage of the Prompt Alchemy application, including:

- **Visual Regression Testing**: Pixel-perfect UI validation with screenshot comparison
- **Performance Monitoring**: Animation frame rate analysis and resource usage tracking
- **Accessibility Testing**: WCAG 2.1 AA compliance validation
- **Cross-Browser Compatibility**: Multi-browser and device testing
- **Integration Testing**: End-to-end workflow validation with mock services
- **CI/CD Integration**: Automated testing pipeline with visual feedback
- **Test Data Generation**: Realistic test data and API mocking infrastructure

## 📁 Test Structure

```
tests/
├── README.md                           # This documentation
├── global-setup.ts                     # Global test setup
├── global-teardown.ts                  # Global test cleanup
├── fixtures/
│   ├── base-fixtures.ts                # Custom Playwright fixtures
│   ├── test-data-generators.ts         # Realistic test data generation
│   └── mock-services.ts                # API mocking infrastructure
├── helpers/
│   ├── visual-regression-utils.ts      # Visual testing utilities
│   └── test-utils.ts                   # Common test helpers
├── visual/
│   └── hex-grid-visual.spec.ts         # Visual regression tests
├── accessibility/
│   └── accessibility-test.spec.ts      # WCAG 2.1 AA compliance tests
├── performance/
│   └── animation-performance.spec.ts   # Performance monitoring
├── cross-browser/
│   └── compatibility.spec.ts           # Cross-browser compatibility
├── integration/
│   └── comprehensive-ui-test.spec.ts   # Full workflow integration tests
├── web-ui/
│   └── homepage.spec.ts                # Homepage functionality tests
├── components/
│   ├── ai-input-component.spec.ts      # AI Input Component tests
│   └── hex-grid.spec.ts                # Hex Grid visualization tests
└── api/
    └── endpoints.api.spec.ts           # API endpoint tests
```

## 🛠️ Configuration

### Playwright Configuration (`playwright.config.ts`)

- **Multi-browser support**: Chrome, Firefox, Safari, Mobile
- **Test environments**: Local development and CI/CD
- **Auto-server startup**: Automatically starts API and web servers
- **Parallel execution**: Optimized for speed and reliability
- **Screenshots/Videos**: Captured on failure for debugging
- **Trace collection**: Detailed execution traces for analysis

### Key Features:
- **Headless/Headed modes**: Configurable based on environment
- **Timeout management**: Appropriate timeouts for different operations
- **Report generation**: HTML, JSON, and JUnit formats
- **Global setup/teardown**: Database preparation and cleanup

## 🧰 Test Utilities

### Page Objects (`fixtures/base-fixtures.ts`)

**HomePage**
- Navigation and basic page setup
- Form element access
- Page readiness validation

**AIInputPage** 
- AI input component interactions
- Element access and state management
- Component initialization

**HexGridPage**
- Hex grid visualization testing
- Node interaction and state verification
- Animation and visual testing

**APIClient**
- Standardized API interactions
- Request/response handling
- Error management

### Helper Functions (`helpers/test-utils.ts`)

**Page Interactions**
- `waitForElement()` - Wait for elements with timeout
- `waitForLoadingComplete()` - Wait for all loading states
- `scrollToElement()` - Scroll and stability management

**AI Input Helpers**
- `typeIntoAIInput()` - Realistic text input
- `submitAIInput()` - Form submission with loading
- `openAISuggestions()` - Dropdown interactions

**Hex Grid Helpers**
- `waitForHexGridLoaded()` - Grid initialization
- `clickHexNode()` - Node interaction
- `hoverHexNode()` - Tooltip testing

**API Helpers**
- `makeAPIRequest()` - Standardized API calls
- `generateTestPrompt()` - Test data generation
- `expectAPIResponse()` - Response validation

**Data Generation**
- `generateTestData()` - Random test data
- `generatePromptContent()` - Realistic prompts

## 📋 Test Coverage

### 1. Homepage Tests (`web-ui/homepage.spec.ts`)
- ✅ Page loading and critical elements
- ✅ Form structure and validation
- ✅ Dropdown functionality (persona, count)
- ✅ Hex grid visualization presence
- ✅ Responsive design across devices
- ✅ Accessibility attributes
- ✅ CSS theme application
- ✅ Navigation and browser behavior

### 2. AI Input Component (`components/ai-input-component.spec.ts`)
- ✅ Component initialization and visibility
- ✅ Text input and character counting
- ✅ Generate button states and interactions
- ✅ Dropdown suggestions and enhancements
- ✅ Configuration panel functionality
- ✅ File attachment system
- ✅ Keyboard shortcuts (Cmd+Enter, arrows, Escape)
- ✅ Accessibility and screen reader support
- ✅ Integration with original form elements

### 3. Hex Grid Visualization (`components/hex-grid.spec.ts`)
- ✅ Grid initialization and SVG structure
- ✅ Node rendering (core, phase, process nodes)
- ✅ Connection paths and animations
- ✅ Node interactions (click, hover, tooltips)
- ✅ Visual states and theme application
- ✅ Zoom and pan controls
- ✅ Responsive layout adaptation
- ✅ Performance and memory management
- ✅ Process flow integration
- ✅ Visual regression testing

### 4. API Endpoints (`api/endpoints.api.spec.ts`)
- ✅ Health and status endpoints
- ✅ Provider information and details
- ✅ Prompt generation with all parameters
- ✅ Prompt management (CRUD operations)
- ✅ Analytics and metrics
- ✅ Learning system integration
- ✅ Optimization and selection features
- ✅ Node activation and connection status
- ✅ Error handling and validation
- ✅ Rate limiting and security

### 5. Form Submission & HTMX (`integration/form-submission.spec.ts`)
- ✅ Basic form submission workflows
- ✅ HTMX dynamic updates and events
- ✅ Loading states and progress indicators
- ✅ Error handling (server, network, validation)
- ✅ Form validation and input constraints
- ✅ Real-time features (counters, suggestions)
- ✅ Visualization integration during processing
- ✅ Accessibility and focus management
- ✅ Performance under load

## 🚀 Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Ensure servers are available
./start-api.sh    # API server on :8080
go run cmd/web/main.go  # Web server on :8090
```

### Basic Commands

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/web-ui/homepage.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests for specific browser
npx playwright test --project=chromium

# Run API tests only
npx playwright test tests/api/

# Run with debug mode
npx playwright test --debug
```

### Advanced Usage

```bash
# Run tests in parallel
npx playwright test --workers=4

# Generate test report
npx playwright test --reporter=html

# Record new tests
npx playwright codegen http://localhost:8090

# Update snapshots
npx playwright test --update-snapshots

# Run specific test pattern
npx playwright test --grep "should submit form"
```

## 🔧 Development Workflow

### Adding New Tests

1. **Create test file** in appropriate directory
2. **Import fixtures** from `base-fixtures.ts`
3. **Use helper functions** from `test-utils.ts`
4. **Follow naming conventions**: `describe`, `test`, clear descriptions
5. **Add assertions** with appropriate timeouts
6. **Test both happy and error paths**

### Example Test Structure

```typescript
import { test, expect } from '../fixtures/base-fixtures';
import { waitForLoadingComplete } from '../helpers/test-utils';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test('should perform expected behavior', async ({ page }) => {
    // Arrange
    await page.fill('#input', 'test value');
    
    // Act
    await page.click('button[type="submit"]');
    await waitForLoadingComplete(page);
    
    // Assert
    await expect(page.locator('#result')).toBeVisible();
  });
});
```

### Best Practices

- **Use page objects** for complex interactions
- **Mock external dependencies** consistently
- **Wait for completion** before assertions
- **Test error scenarios** alongside happy paths
- **Keep tests independent** and repeatable
- **Use descriptive test names** that explain the behavior
- **Group related tests** with `describe` blocks

## 🐛 Debugging

### Common Issues

**Timeouts**
```bash
# Increase timeout for slow operations
npx playwright test --timeout=60000
```

**Flaky Tests**
```bash
# Run tests multiple times to identify flakiness
npx playwright test --repeat-each=3
```

**Element Not Found**
```typescript
// Use better wait strategies
await page.waitForSelector('.element', { state: 'visible' });
await expect(page.locator('.element')).toBeVisible();
```

### Debug Tools

**Playwright Inspector**
```bash
npx playwright test --debug
```

**Trace Viewer**
```bash
npx playwright show-trace test-results/trace.zip
```

**Screenshot on Failure**
Automatically captured in `test-results/` directory

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run Playwright tests
        run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Environment Variables

```bash
# For CI environments
export CI=true
export BASE_URL=http://localhost:8090
export API_BASE_URL=http://localhost:8080
```

## 📈 Metrics and Reporting

### Test Reports

- **HTML Report**: Interactive report with screenshots and traces
- **JSON Report**: Machine-readable format for CI/CD
- **JUnit Report**: Compatible with most CI systems

### Coverage Areas

- **UI Components**: 100% of critical user paths
- **API Endpoints**: All documented endpoints
- **Error Scenarios**: Major error conditions
- **Browser Compatibility**: Chrome, Firefox, Safari
- **Device Types**: Desktop, tablet, mobile

## 🔮 Future Enhancements

### Planned Additions

- **Visual Regression Testing**: Automated screenshot comparison
- **Performance Testing**: Load time and resource usage monitoring
- **Accessibility Testing**: Automated a11y checks with axe-core
- **API Contract Testing**: Schema validation and contract testing
- **Cross-browser Testing**: Extended browser matrix
- **Mobile Testing**: Native mobile app testing (if applicable)

### Test Data Management

- **Database Seeding**: Automated test data setup
- **Test Isolation**: Improved test independence
- **Cleanup Automation**: Enhanced teardown procedures

## 📞 Support

For questions about the test suite:

1. **Check the documentation** in this README
2. **Review existing tests** for patterns and examples
3. **Use Playwright documentation**: https://playwright.dev/
4. **Create GitHub issues** for bugs or feature requests

## 🎯 Quick Reference

### Essential Commands
```bash
# Quick test run
npx playwright test --headed --project=chromium

# Debug failing test
npx playwright test --debug tests/path/to/test.spec.ts

# Generate test report
npx playwright test && npx playwright show-report

# Update test snapshots
npx playwright test --update-snapshots
```

### Key Selectors
- `#input` - Main prompt input
- `#generate-form` - Primary form
- `#hex-flow-container` - Hex grid
- `.ai-input-container` - AI input component
- `#results-container` - Results display

---

**Test Suite Status**: ✅ Complete  
**Last Updated**: January 2025  
**Coverage**: Comprehensive  
**Maintenance**: Active 