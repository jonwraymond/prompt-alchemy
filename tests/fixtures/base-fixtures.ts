import { test as base, Page } from '@playwright/test';
import { 
  waitForLoadingComplete, 
  waitForHexGridLoaded,
  getAIInputElements,
  getHexGridElements,
  generateTestData
} from '../helpers/test-utils';

/**
 * Base fixtures for Prompt Alchemy tests
 * 
 * These fixtures provide common setup patterns and page objects
 * that can be reused across different test files.
 */

// ============================================================================
// Page Object Models
// ============================================================================

export class HomePage {
  constructor(public readonly page: Page) {}

  async goto() {
    await this.page.goto('/');
    await waitForLoadingComplete(this.page);
    return this;
  }

  async waitForReady() {
    // Wait for critical elements to be visible
    await this.page.waitForSelector('.main-header', { state: 'visible' });
    await this.page.waitForSelector('#generate-form', { state: 'visible' });
    return this;
  }

  async getFormElements() {
    return {
      input: this.page.locator('#input'),
      generateBtn: this.page.locator('button[type="submit"]'),
      personaSelect: this.page.locator('#persona'),
      countSelect: this.page.locator('#count')
    };
  }
}

export class AIInputPage {
  constructor(public readonly page: Page) {}

  async goto() {
    await this.page.goto('/');
    await waitForLoadingComplete(this.page);
    await this.waitForAIInputReady();
    return this;
  }

  async waitForAIInputReady() {
    await this.page.waitForSelector('.ai-input-container', { state: 'visible' });
    await this.page.waitForSelector('.ai-input', { state: 'visible' });
    return this;
  }

  async getElements() {
    return getAIInputElements(this.page);
  }
}

export class HexGridPage {
  constructor(public readonly page: Page) {}

  async goto() {
    await this.page.goto('/');
    await waitForLoadingComplete(this.page);
    await this.waitForHexGridReady();
    return this;
  }

  async waitForHexGridReady() {
    await waitForHexGridLoaded(this.page);
    return this;
  }

  async getElements() {
    return getHexGridElements(this.page);
  }

  async getAllNodes() {
    const { nodes } = await this.getElements();
    return await nodes.all();
  }

  async getNodeById(nodeId: string) {
    return this.page.locator(`[data-node-id="${nodeId}"]`);
  }
}

export class APIClient {
  constructor(public readonly page: Page) {}

  private get baseURL() {
    return 'http://localhost:8080/api/v1';
  }

  async healthCheck() {
    const response = await this.page.request.get(`${this.baseURL}/health`);
    return {
      status: response.status(),
      data: response.ok() ? await response.json() : null
    };
  }

  async getProviders() {
    const response = await this.page.request.get(`${this.baseURL}/providers`);
    return {
      status: response.status(),
      data: response.ok() ? await response.json() : null
    };
  }

  async generatePrompt(data: {
    input: string;
    provider?: string;
    count?: number;
    phase_selection?: string;
  }) {
    const response = await this.page.request.post(`${this.baseURL}/prompts/generate`, {
      data: {
        provider: 'openai',
        count: 3,
        phase_selection: 'best',
        ...data
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return {
      status: response.status(),
      data: response.ok() ? await response.json() : null
    };
  }
}

// ============================================================================
// Test Fixtures
// ============================================================================

type TestFixtures = {
  homePage: HomePage;
  aiInputPage: AIInputPage;
  hexGridPage: HexGridPage;
  apiClient: APIClient;
  testData: ReturnType<typeof generateTestData>;
};

type WorkerFixtures = {
  // Worker-scoped fixtures can be added here
};

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Home page fixture
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  // AI Input page fixture
  aiInputPage: async ({ page }, use) => {
    const aiInputPage = new AIInputPage(page);
    await use(aiInputPage);
  },

  // Hex Grid page fixture
  hexGridPage: async ({ page }, use) => {
    const hexGridPage = new HexGridPage(page);
    await use(hexGridPage);
  },

  // API client fixture
  apiClient: async ({ page }, use) => {
    const apiClient = new APIClient(page);
    await use(apiClient);
  },

  // Test data fixture
  testData: async ({}, use) => {
    const testData = generateTestData();
    await use(testData);
  }
});

export { expect } from '@playwright/test'; 