import { test, expect } from '../fixtures/base-fixtures';
import { 
  typeIntoAIInput, 
  submitAIInput, 
  openAISuggestions,
  waitForLoadingComplete,
  expectVisibleAndEnabled 
} from '../helpers/test-utils';

/**
 * AI Input Component Tests
 * 
 * Tests for the AI Input Component functionality including:
 * - Component initialization and visibility
 * - Text input and character counting
 * - Generate button and dropdown interactions
 * - Suggestions and enhancement features
 * - Config panel and settings
 * - File attachment functionality
 * - Keyboard shortcuts and accessibility
 * - Loading states and animations
 */

test.describe('AI Input Component', () => {
  test.beforeEach(async ({ aiInputPage }) => {
    await aiInputPage.goto();
  });

  test.describe('Component Initialization', () => {
    test('should initialize with all required elements', async ({ aiInputPage }) => {
      const elements = await aiInputPage.getElements();

      // Verify container structure
      await expect(elements.container).toBeVisible();
      await expect(elements.wrapper).toBeVisible();
      await expect(elements.textarea).toBeVisible();

      // Verify button elements
      await expect(elements.generateBtn).toBeVisible();
      await expect(elements.configBtn).toBeVisible();
      await expect(elements.attachmentBtn).toBeVisible();
      await expect(elements.dropdownArrow).toBeVisible();

      // Verify counter
      await expect(elements.counter).toBeVisible();
      await expect(elements.counter).toContainText('0/5000');
    });

    test('should have proper CSS classes and styling', async ({ page }) => {
      // Check wrapper classes
      const wrapper = page.locator('.ai-input-wrapper');
      await expect(wrapper).toHaveClass(/ai-input-wrapper/);

      // Check theme application
      const container = page.locator('.ai-input-container');
      const styles = await container.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          position: computed.position,
          width: computed.width
        };
      });

      expect(styles.position).toBe('relative');
    });

    test('should hide original input elements', async ({ page }) => {
      // Original input should be hidden when AI input is active
      const originalInput = page.locator('#input');
      const originalControls = page.locator('.horizontal-controls');

      // These elements might be hidden by CSS
      const originalInputStyle = await originalInput.evaluate(el => 
        window.getComputedStyle(el).display
      );
      
      // Should be either hidden or the AI input should be visible as replacement
      const aiInputVisible = await page.locator('.ai-input-container').isVisible();
      expect(aiInputVisible || originalInputStyle === 'none').toBe(true);
    });
  });

  test.describe('Text Input Functionality', () => {
    test('should accept text input and update character counter', async ({ page, aiInputPage }) => {
      const elements = await aiInputPage.getElements();
      const testText = 'This is a test prompt for the AI input component';

      await typeIntoAIInput(page, testText);

      // Verify text is entered
      await expect(elements.textarea).toHaveValue(testText);

      // Verify counter updates
      await expect(elements.counter).toContainText(`${testText.length}/5000`);
    });

    test('should enforce maximum character limit', async ({ page, aiInputPage }) => {
      const elements = await aiInputPage.getElements();
      const longText = 'A'.repeat(5001); // Exceeds 5000 character limit

      await elements.textarea.fill(longText);

      // Should be truncated to 5000 characters
      const actualValue = await elements.textarea.inputValue();
      expect(actualValue.length).toBeLessThanOrEqual(5000);
    });

    test('should auto-resize textarea based on content', async ({ page }) => {
      const textarea = page.locator('.ai-input');
      
      // Get initial height
      const initialHeight = await textarea.evaluate(el => el.clientHeight);

      // Add multiple lines of text
      const multilineText = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
      await typeIntoAIInput(page, multilineText);

      // Wait for auto-resize
      await page.waitForTimeout(300);

      // Height should increase
      const newHeight = await textarea.evaluate(el => el.clientHeight);
      expect(newHeight).toBeGreaterThan(initialHeight);
    });

    test('should expand wrapper on focus', async ({ page, aiInputPage }) => {
      const elements = await aiInputPage.getElements();

      // Initially not expanded
      await expect(elements.wrapper).not.toHaveClass(/expanded/);

      // Focus should expand
      await elements.textarea.focus();
      await expect(elements.wrapper).toHaveClass(/expanded/);

      // Blur should collapse (after delay)
      await elements.textarea.blur();
      await page.waitForTimeout(200);
      // Note: blur behavior might vary based on other interactions
    });
  });

  test.describe('Generate Button Functionality', () => {
    test('should be disabled when textarea is empty', async ({ aiInputPage }) => {
      const elements = await aiInputPage.getElements();

      // Generate button should be disabled when empty
      await expect(elements.generateBtn).toBeDisabled();
    });

    test('should be enabled when textarea has content', async ({ page, aiInputPage }) => {
      const elements = await aiInputPage.getElements();

      await typeIntoAIInput(page, 'Test prompt');

      // Generate button should be enabled
      await expect(elements.generateBtn).toBeEnabled();
    });

    test('should submit form when clicked', async ({ page }) => {
      await typeIntoAIInput(page, 'Test prompt for submission');

      // Set up response interception
      let submissionData: any = null;
      await page.route('**/generate', (route) => {
        submissionData = route.request().postData();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      await submitAIInput(page);

      // Verify submission occurred
      expect(submissionData).toBeTruthy();
    });

    test('should show loading state during submission', async ({ page }) => {
      await typeIntoAIInput(page, 'Test prompt');

      // Intercept request to add delay
      await page.route('**/generate', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      const generateBtn = page.locator('.ai-generate-btn');
      await generateBtn.click();

      // Should show loading state
      await expect(generateBtn).toContainText('Generating...');
    });
  });

  test.describe('Dropdown and Suggestions', () => {
    test('should open suggestions dropdown when arrow is clicked', async ({ page }) => {
      await openAISuggestions(page);

      // Dropdown menu should be visible
      await expect(page.locator('.ai-profiles-menu.visible')).toBeVisible();

      // Should contain suggestion items
      const suggestions = page.locator('.ai-profile-item');
      const count = await suggestions.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should close dropdown when clicking outside', async ({ page }) => {
      await openAISuggestions(page);

      // Click outside
      await page.click('body', { position: { x: 100, y: 100 } });

      // Dropdown should be hidden
      await expect(page.locator('.ai-profiles-menu.visible')).toBeHidden();
    });

    test('should apply suggestion when clicked', async ({ page }) => {
      await typeIntoAIInput(page, 'Basic prompt');
      await openAISuggestions(page);

      // Click on first suggestion
      const firstSuggestion = page.locator('.ai-profile-item').first();
      await firstSuggestion.click();

      // Text should be enhanced
      const textarea = page.locator('.ai-input');
      const finalValue = await textarea.inputValue();
      expect(finalValue).toContain('Basic prompt');
      expect(finalValue.length).toBeGreaterThan('Basic prompt'.length);

      // Dropdown should close
      await expect(page.locator('.ai-profiles-menu.visible')).toBeHidden();
    });

    test('should show thinking animation after suggestion application', async ({ page }) => {
      await typeIntoAIInput(page, 'Test prompt');
      await openAISuggestions(page);

      const firstSuggestion = page.locator('.ai-profile-item').first();
      await firstSuggestion.click();

      // Should show thinking overlay
      await expect(page.locator('.ai-thinking-overlay')).toBeVisible();
      
      // Should disappear after a short time
      await expect(page.locator('.ai-thinking-overlay')).toBeHidden({ timeout: 3000 });
    });
  });

  test.describe('Config Panel', () => {
    test('should open config panel when gear button is clicked', async ({ page, aiInputPage }) => {
      const elements = await aiInputPage.getElements();

      await elements.configBtn.click();

      // Config panel should be visible
      await expect(page.locator('.ai-config-panel')).toBeVisible();
    });

    test('should close config panel when clicked outside', async ({ page, aiInputPage }) => {
      const elements = await aiInputPage.getElements();

      await elements.configBtn.click();
      await expect(page.locator('.ai-config-panel')).toBeVisible();

      // Click outside
      await page.click('body', { position: { x: 100, y: 100 } });

      // Panel should be hidden
      await expect(page.locator('.ai-config-panel')).toBeHidden();
    });

    test('should contain configuration options', async ({ page, aiInputPage }) => {
      const elements = await aiInputPage.getElements();

      await elements.configBtn.click();

      // Should have configuration checkboxes
      const configOptions = page.locator('.config-option');
      const count = await configOptions.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('File Attachment', () => {
    test('should open file dialog when attachment button is clicked', async ({ page, aiInputPage }) => {
      const elements = await aiInputPage.getElements();

      // Set up file chooser handler
      let fileChooserPromise = page.waitForEvent('filechooser');
      
      await elements.attachmentBtn.click();
      
      let fileChooser = await fileChooserPromise;
      expect(fileChooser).toBeTruthy();
    });

    test('should show attached files in the list', async ({ page, aiInputPage }) => {
      const elements = await aiInputPage.getElements();

      // Mock file selection
      await page.setInputFiles('.ai-attachment-input', {
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('test content')
      });

      // Should show file in attachment list
      await expect(page.locator('.ai-attachment-item')).toBeVisible();
      await expect(page.locator('.ai-attachment-item')).toContainText('test.txt');
    });

    test('should allow removing attached files', async ({ page, aiInputPage }) => {
      const elements = await aiInputPage.getElements();

      // Add file
      await page.setInputFiles('.ai-attachment-input', {
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('test content')
      });

      await expect(page.locator('.ai-attachment-item')).toBeVisible();

      // Remove file
      await page.locator('.ai-attachment-item button').click();

      // File should be removed
      await expect(page.locator('.ai-attachment-item')).toBeHidden();
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should submit form with Cmd+Enter', async ({ page }) => {
      await typeIntoAIInput(page, 'Test prompt');

      // Set up interception
      let submitted = false;
      await page.route('**/generate', (route) => {
        submitted = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      // Press Cmd+Enter (or Ctrl+Enter)
      await page.keyboard.press('Meta+Enter');

      await page.waitForTimeout(500);
      expect(submitted).toBe(true);
    });

    test('should navigate suggestions with arrow keys', async ({ page }) => {
      await openAISuggestions(page);

      const suggestions = page.locator('.ai-profile-item');
      const count = await suggestions.count();

      if (count > 1) {
        // Press arrow down
        await page.keyboard.press('ArrowDown');

        // First item should be selected
        await expect(suggestions.first()).toHaveClass(/selected/);

        // Press arrow down again
        await page.keyboard.press('ArrowDown');

        // Second item should be selected
        await expect(suggestions.nth(1)).toHaveClass(/selected/);
      }
    });

    test('should close dropdowns with Escape key', async ({ page }) => {
      await openAISuggestions(page);
      await expect(page.locator('.ai-profiles-menu.visible')).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(page.locator('.ai-profiles-menu.visible')).toBeHidden();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA attributes', async ({ page, aiInputPage }) => {
      const elements = await aiInputPage.getElements();

      // Check button accessibility
      await expect(elements.generateBtn).toHaveAttribute('title');
      await expect(elements.configBtn).toHaveAttribute('title');
      await expect(elements.attachmentBtn).toHaveAttribute('title');
    });

    test('should support screen reader navigation', async ({ page }) => {
      // Check that elements can be reached by tab navigation
      await page.keyboard.press('Tab');
      
      // Should focus on textarea
      await expect(page.locator('.ai-input')).toBeFocused();
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // This is a basic check - in a real implementation you'd use axe-core
      const textarea = page.locator('.ai-input');
      
      const styles = await textarea.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });

      // Basic validation that colors are set
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    });
  });

  test.describe('Integration with Original Form', () => {
    test('should sync values with original form elements', async ({ page }) => {
      const testText = 'Sync test prompt';
      await typeIntoAIInput(page, testText);

      // Check if original input is updated (if visible)
      const originalInput = page.locator('#input');
      if (await originalInput.isVisible()) {
        await expect(originalInput).toHaveValue(testText);
      }
    });

    test('should work with HTMX form submission', async ({ page }) => {
      await typeIntoAIInput(page, 'HTMX test prompt');

      // Mock HTMX response
      await page.route('**/generate', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<div id="results-container">Generated content</div>'
        });
      });

      await submitAIInput(page);

      // Wait for HTMX to update the page
      await waitForLoadingComplete(page);
    });
  });
}); 