/**
 * Mock Services for Prompt Alchemy Testing
 * 
 * Comprehensive mocking infrastructure for testing various scenarios:
 * - API endpoint mocking with realistic responses
 * - Provider service simulation
 * - Error scenario simulation
 * - Performance testing mocks
 * - Real-time event simulation
 * - Database operation mocking
 */

import { Page, Route } from '@playwright/test';
import { 
  generateAPIResponse, 
  generatePromptOutputs, 
  generateGenerationRequest,
  TestAPIResponse 
} from './test-data-generators';

// ============================================================================
// Mock Configuration Types
// ============================================================================

export interface MockConfig {
  provider: string;
  delay?: number;
  errorRate?: number;
  responseType?: 'success' | 'error' | 'timeout' | 'partial';
  customResponse?: any;
}

export interface MockScenario {
  name: string;
  description: string;
  setup: (page: Page) => Promise<void>;
  teardown?: (page: Page) => Promise<void>;
}

export interface ProviderMockConfig extends MockConfig {
  apiKey?: string;
  rateLimit?: number;
  quotaRemaining?: number;
}

// ============================================================================
// Core Mock Service Class
// ============================================================================

export class MockServiceManager {
  private activeMocks: Map<string, Route> = new Map();
  private mockConfigs: Map<string, MockConfig> = new Map();

  constructor(private page: Page) {}

  /**
   * Register a mock for a specific endpoint
   */
  async registerMock(
    pattern: string, 
    config: MockConfig,
    mockId: string = pattern
  ): Promise<void> {
    this.mockConfigs.set(mockId, config);

    const route = await this.page.route(pattern, async (route) => {
      const delay = config.delay || this.getRealisticDelay(config.provider);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, delay));

      // Simulate error rate
      if (config.errorRate && Math.random() < config.errorRate) {
        const errorResponse = generateAPIResponse('error');
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify(errorResponse)
        });
        return;
      }

      // Use custom response or generate realistic one
      const response = config.customResponse || 
        generateAPIResponse(config.responseType || 'success');

      await route.fulfill({
        status: response.success ? 200 : 500,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });

    this.activeMocks.set(mockId, route);
  }

  /**
   * Update existing mock configuration
   */
  async updateMock(mockId: string, newConfig: Partial<MockConfig>): Promise<void> {
    const existingConfig = this.mockConfigs.get(mockId);
    if (existingConfig) {
      this.mockConfigs.set(mockId, { ...existingConfig, ...newConfig });
    }
  }

  /**
   * Remove a specific mock
   */
  async removeMock(mockId: string): Promise<void> {
    const route = this.activeMocks.get(mockId);
    if (route) {
      await route.unroute();
      this.activeMocks.delete(mockId);
      this.mockConfigs.delete(mockId);
    }
  }

  /**
   * Clear all active mocks
   */
  async clearAllMocks(): Promise<void> {
    for (const [mockId] of this.activeMocks) {
      await this.removeMock(mockId);
    }
  }

  /**
   * Get realistic delay based on provider
   */
  private getRealisticDelay(provider: string): number {
    const delays = {
      openai: Math.random() * 2000 + 500,    // 500-2500ms
      anthropic: Math.random() * 3000 + 800, // 800-3800ms
      google: Math.random() * 1500 + 300,    // 300-1800ms
      ollama: Math.random() * 5000 + 1000    // 1000-6000ms (local model)
    };
    return delays[provider as keyof typeof delays] || 1000;
  }
}

// ============================================================================
// API Endpoint Mocks
// ============================================================================

export class APIEndpointMocks {
  constructor(private mockManager: MockServiceManager) {}

  /**
   * Mock the prompt generation endpoint
   */
  async mockGenerateEndpoint(config: MockConfig = { provider: 'openai' }): Promise<void> {
    await this.mockManager.registerMock('**/api/v1/prompts/generate', {
      ...config,
      customResponse: config.customResponse || {
        success: true,
        data: {
          prompts: generatePromptOutputs('Test input', 3),
          phases: {
            prima_materia: 'Prima materia transformation of the input',
            solutio: 'Solutio refinement of the concept', 
            coagulatio: 'Coagulatio crystallization into final form'
          },
          metadata: {
            provider: config.provider,
            tokens_used: 456,
            execution_time_ms: config.delay || 1500,
            score: 8.7
          }
        }
      }
    }, 'generate-endpoint');
  }

  /**
   * Mock the optimize endpoint
   */
  async mockOptimizeEndpoint(config: MockConfig = { provider: 'openai' }): Promise<void> {
    await this.mockManager.registerMock('**/api/v1/prompts/optimize', {
      ...config,
      customResponse: config.customResponse || {
        success: true,
        data: {
          original_prompt: 'Original prompt content',
          optimized_prompt: 'Optimized and improved prompt content',
          improvements: [
            'Enhanced clarity and specificity',
            'Added context and examples',
            'Improved instruction structure'
          ],
          score_improvement: 2.3,
          metadata: {
            provider: config.provider,
            tokens_used: 234,
            execution_time_ms: config.delay || 1200
          }
        }
      }
    }, 'optimize-endpoint');
  }

  /**
   * Mock the search endpoint
   */
  async mockSearchEndpoint(config: MockConfig = { provider: 'openai' }): Promise<void> {
    await this.mockManager.registerMock('**/api/v1/prompts/search', {
      ...config,
      customResponse: config.customResponse || {
        success: true,
        data: {
          results: [
            {
              id: 'prompt-1',
              content: 'Search result prompt 1',
              score: 0.95,
              metadata: { created_at: '2024-01-15T10:30:00Z' }
            },
            {
              id: 'prompt-2', 
              content: 'Search result prompt 2',
              score: 0.87,
              metadata: { created_at: '2024-01-14T15:45:00Z' }
            }
          ],
          total: 2,
          page: 1,
          per_page: 10
        }
      }
    }, 'search-endpoint');
  }

  /**
   * Mock the providers endpoint
   */
  async mockProvidersEndpoint(): Promise<void> {
    await this.mockManager.registerMock('**/api/v1/providers**', {
      provider: 'system',
      customResponse: {
        success: true,
        data: {
          providers: [
            {
              name: 'openai',
              status: 'available',
              capabilities: ['generation', 'optimization'],
              rate_limit: 100,
              quota_remaining: 950
            },
            {
              name: 'anthropic',
              status: 'available', 
              capabilities: ['generation', 'optimization'],
              rate_limit: 50,
              quota_remaining: 300
            },
            {
              name: 'google',
              status: 'maintenance',
              capabilities: ['generation'],
              rate_limit: 200,
              quota_remaining: 0
            },
            {
              name: 'ollama',
              status: 'available',
              capabilities: ['generation'],
              rate_limit: 1000,
              quota_remaining: 1000
            }
          ]
        }
      }
    }, 'providers-endpoint');
  }

  /**
   * Mock health check endpoint
   */
  async mockHealthEndpoint(): Promise<void> {
    await this.mockManager.registerMock('**/api/v1/health', {
      provider: 'system',
      delay: 100,
      customResponse: {
        success: true,
        data: {
          status: 'healthy',
          version: '1.0.0',
          uptime: 3600,
          database: 'connected',
          providers: {
            openai: 'healthy',
            anthropic: 'healthy',
            google: 'degraded',
            ollama: 'healthy'
          }
        }
      }
    }, 'health-endpoint');
  }
}

// ============================================================================
// Provider-Specific Mocks
// ============================================================================

export class ProviderMocks {
  constructor(private mockManager: MockServiceManager) {}

  /**
   * Mock OpenAI provider responses
   */
  async mockOpenAI(config: ProviderMockConfig = { provider: 'openai' }): Promise<void> {
    await this.mockManager.registerMock('**/api/v1/prompts/generate', {
      ...config,
      delay: config.delay || Math.random() * 1000 + 500,
      customResponse: {
        success: true,
        data: {
          prompts: [
            'OpenAI-generated prompt with high quality and creativity',
            'Alternative OpenAI response with different approach',
            'Third OpenAI variant optimized for engagement'
          ],
          phases: {
            prima_materia: 'OpenAI prima materia: extracting core concepts',
            solutio: 'OpenAI solutio: flowing natural language',
            coagulatio: 'OpenAI coagulatio: precise final formulation'
          },
          metadata: {
            provider: 'openai',
            model: 'gpt-4',
            tokens_used: 567,
            score: 9.2,
            execution_time_ms: config.delay || 1200
          }
        }
      }
    }, 'openai-provider');
  }

  /**
   * Mock Anthropic provider responses
   */
  async mockAnthropic(config: ProviderMockConfig = { provider: 'anthropic' }): Promise<void> {
    await this.mockManager.registerMock('**/api/v1/prompts/generate', {
      ...config,
      delay: config.delay || Math.random() * 2000 + 800,
      customResponse: {
        success: true,
        data: {
          prompts: [
            'Anthropic Claude response with careful reasoning and nuance',
            'Alternative Claude approach emphasizing safety and helpfulness',
            'Third Claude variant with detailed explanations'
          ],
          phases: {
            prima_materia: 'Claude prima materia: thoughtful deconstruction',
            solutio: 'Claude solutio: careful natural expression',
            coagulatio: 'Claude coagulatio: safe and effective final form'
          },
          metadata: {
            provider: 'anthropic',
            model: 'claude-3-opus',
            tokens_used: 623,
            score: 9.0,
            execution_time_ms: config.delay || 1800
          }
        }
      }
    }, 'anthropic-provider');
  }

  /**
   * Mock Google provider responses
   */
  async mockGoogle(config: ProviderMockConfig = { provider: 'google' }): Promise<void> {
    await this.mockManager.registerMock('**/api/v1/prompts/generate', {
      ...config,
      delay: config.delay || Math.random() * 1200 + 400,
      customResponse: {
        success: true,
        data: {
          prompts: [
            'Google Gemini response with comprehensive analysis',
            'Alternative Gemini approach with structured thinking',
            'Third Gemini variant with creative solutions'
          ],
          phases: {
            prima_materia: 'Gemini prima materia: analytical breakdown',
            solutio: 'Gemini solutio: structured natural flow',
            coagulatio: 'Gemini coagulatio: comprehensive final result'
          },
          metadata: {
            provider: 'google',
            model: 'gemini-pro',
            tokens_used: 445,
            score: 8.8,
            execution_time_ms: config.delay || 900
          }
        }
      }
    }, 'google-provider');
  }

  /**
   * Mock Ollama local provider responses
   */
  async mockOllama(config: ProviderMockConfig = { provider: 'ollama' }): Promise<void> {
    await this.mockManager.registerMock('**/api/v1/prompts/generate', {
      ...config,
      delay: config.delay || Math.random() * 4000 + 1500,
      customResponse: {
        success: true,
        data: {
          prompts: [
            'Ollama local model response with efficient processing',
            'Alternative local approach with resource optimization',
            'Third local variant with offline capabilities'
          ],
          phases: {
            prima_materia: 'Local prima materia: efficient extraction',
            solutio: 'Local solutio: optimized transformation',
            coagulatio: 'Local coagulatio: resource-conscious result'
          },
          metadata: {
            provider: 'ollama',
            model: 'llama2:13b',
            tokens_used: 356,
            score: 7.8,
            execution_time_ms: config.delay || 3200
          }
        }
      }
    }, 'ollama-provider');
  }
}

// ============================================================================
// Error Scenario Mocks
// ============================================================================

export class ErrorScenarioMocks {
  constructor(private mockManager: MockServiceManager) {}

  /**
   * Mock rate limiting errors
   */
  async mockRateLimitError(): Promise<void> {
    await this.mockManager.registerMock('**/api/v1/prompts/**', {
      provider: 'openai',
      delay: 100,
      errorRate: 1.0,
      customResponse: {
        success: false,
        error: 'Rate limit exceeded. Please try again in 60 seconds.',
        error_code: 'RATE_LIMIT_EXCEEDED',
        retry_after: 60,
        metadata: {
          provider: 'openai',
          execution_time_ms: 100
        }
      }
    }, 'rate-limit-error');
  }

  /**
   * Mock API key errors
   */
  async mockAPIKeyError(): Promise<void> {
    await this.mockManager.registerMock('**/api/v1/prompts/**', {
      provider: 'openai',
      delay: 200,
      errorRate: 1.0,
      customResponse: {
        success: false,
        error: 'Invalid API key provided',
        error_code: 'INVALID_API_KEY',
        metadata: {
          provider: 'openai',
          execution_time_ms: 200
        }
      }
    }, 'api-key-error');
  }

  /**
   * Mock network timeout errors
   */
  async mockTimeoutError(): Promise<void> {
    await this.mockManager.registerMock('**/api/v1/prompts/**', {
      provider: 'anthropic',
      delay: 30000,
      errorRate: 1.0,
      customResponse: {
        success: false,
        error: 'Request timeout after 30 seconds',
        error_code: 'TIMEOUT',
        metadata: {
          provider: 'anthropic',
          execution_time_ms: 30000
        }
      }
    }, 'timeout-error');
  }

  /**
   * Mock server errors
   */
  async mockServerError(): Promise<void> {
    await this.mockManager.registerMock('**/api/v1/prompts/**', {
      provider: 'google',
      delay: 500,
      errorRate: 1.0,
      customResponse: {
        success: false,
        error: 'Internal server error',
        error_code: 'INTERNAL_ERROR',
        metadata: {
          provider: 'google',
          execution_time_ms: 500
        }
      }
    }, 'server-error');
  }

  /**
   * Mock quota exceeded errors
   */
  async mockQuotaExceededError(): Promise<void> {
    await this.mockManager.registerMock('**/api/v1/prompts/**', {
      provider: 'openai',
      delay: 300,
      errorRate: 1.0,
      customResponse: {
        success: false,
        error: 'Monthly quota exceeded',
        error_code: 'QUOTA_EXCEEDED',
        quota_reset_date: '2024-02-01T00:00:00Z',
        metadata: {
          provider: 'openai',
          execution_time_ms: 300
        }
      }
    }, 'quota-error');
  }
}

// ============================================================================
// Performance Testing Mocks
// ============================================================================

export class PerformanceMocks {
  constructor(private mockManager: MockServiceManager) {}

  /**
   * Mock slow provider responses
   */
  async mockSlowResponse(delay: number = 10000): Promise<void> {
    await this.mockManager.registerMock('**/api/v1/prompts/generate', {
      provider: 'ollama',
      delay,
      customResponse: generateAPIResponse('success', {
        note: 'Intentionally slow response for performance testing'
      })
    }, 'slow-response');
  }

  /**
   * Mock variable response times
   */
  async mockVariablePerformance(): Promise<void> {
    let requestCount = 0;
    
    await this.mockManager.registerMock('**/api/v1/prompts/generate', {
      provider: 'openai',
      delay: 0, // Will be overridden
      customResponse: generateAPIResponse('success')
    }, 'variable-performance');

    // Override the route to provide variable delays
    await this.mockManager.page.route('**/api/v1/prompts/generate', async (route) => {
      requestCount++;
      const delays = [500, 1500, 3000, 800, 2200, 1000, 4000, 600];
      const delay = delays[requestCount % delays.length];
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const response = generateAPIResponse('success', {
        request_number: requestCount,
        simulated_delay: delay
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Mock intermittent failures
   */
  async mockIntermittentFailures(failureRate: number = 0.3): Promise<void> {
    await this.mockManager.registerMock('**/api/v1/prompts/**', {
      provider: 'anthropic',
      errorRate: failureRate,
      delay: 1000
    }, 'intermittent-failures');
  }
}

// ============================================================================
// Real-time Event Mocks
// ============================================================================

export class RealtimeMocks {
  constructor(private page: Page) {}

  /**
   * Mock WebSocket connections for real-time updates
   */
  async mockWebSocketEvents(): Promise<void> {
    await this.page.addInitScript(() => {
      // Mock WebSocket for real-time generation progress
      const originalWebSocket = window.WebSocket;
      
      (window as any).WebSocket = class MockWebSocket {
        public readyState = 1; // OPEN
        public onopen: ((event: Event) => void) | null = null;
        public onmessage: ((event: MessageEvent) => void) | null = null;
        public onerror: ((event: Event) => void) | null = null;
        public onclose: ((event: CloseEvent) => void) | null = null;

        constructor(url: string, protocols?: string | string[]) {
          setTimeout(() => {
            if (this.onopen) {
              this.onopen(new Event('open'));
            }
          }, 100);

          // Simulate progress updates
          setTimeout(() => {
            this.simulateProgressEvents();
          }, 500);
        }

        send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
          // Mock send implementation
        }

        close(code?: number, reason?: string): void {
          setTimeout(() => {
            if (this.onclose) {
              this.onclose(new CloseEvent('close', { code: code || 1000, reason }));
            }
          }, 100);
        }

        private simulateProgressEvents(): void {
          const events = [
            { phase: 'prima_materia', progress: 0.1, status: 'started' },
            { phase: 'prima_materia', progress: 0.3, status: 'processing' },
            { phase: 'solutio', progress: 0.6, status: 'started' },
            { phase: 'solutio', progress: 0.8, status: 'processing' },
            { phase: 'coagulatio', progress: 0.9, status: 'started' },
            { phase: 'coagulatio', progress: 1.0, status: 'completed' }
          ];

          events.forEach((event, index) => {
            setTimeout(() => {
              if (this.onmessage) {
                this.onmessage(new MessageEvent('message', {
                  data: JSON.stringify(event)
                }));
              }
            }, index * 1000);
          });
        }
      };
    });
  }

  /**
   * Mock Server-Sent Events
   */
  async mockServerSentEvents(): Promise<void> {
    await this.page.route('**/api/v1/events/**', async (route) => {
      const events = [
        'data: {"type": "generation_started", "timestamp": "' + new Date().toISOString() + '"}\n\n',
        'data: {"type": "phase_completed", "phase": "prima_materia", "timestamp": "' + new Date().toISOString() + '"}\n\n',
        'data: {"type": "phase_completed", "phase": "solutio", "timestamp": "' + new Date().toISOString() + '"}\n\n',
        'data: {"type": "generation_completed", "timestamp": "' + new Date().toISOString() + '"}\n\n'
      ];

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        body: events.join('')
      });
    });
  }
}

// ============================================================================
// Scenario Presets
// ============================================================================

export const mockScenarios: Record<string, MockScenario> = {
  happyPath: {
    name: 'Happy Path',
    description: 'All services working normally with realistic delays',
    setup: async (page: Page) => {
      const mockManager = new MockServiceManager(page);
      const apiMocks = new APIEndpointMocks(mockManager);
      const providerMocks = new ProviderMocks(mockManager);
      
      await apiMocks.mockGenerateEndpoint({ provider: 'openai', delay: 1200 });
      await apiMocks.mockProvidersEndpoint();
      await apiMocks.mockHealthEndpoint();
    }
  },

  errorConditions: {
    name: 'Error Conditions',
    description: 'Various error scenarios for resilience testing',
    setup: async (page: Page) => {
      const mockManager = new MockServiceManager(page);
      const errorMocks = new ErrorScenarioMocks(mockManager);
      
      await errorMocks.mockRateLimitError();
    }
  },

  performanceStress: {
    name: 'Performance Stress',
    description: 'Slow responses and high load simulation',
    setup: async (page: Page) => {
      const mockManager = new MockServiceManager(page);
      const perfMocks = new PerformanceMocks(mockManager);
      
      await perfMocks.mockSlowResponse(5000);
      await perfMocks.mockIntermittentFailures(0.2);
    }
  },

  realtimeFeatures: {
    name: 'Real-time Features',
    description: 'WebSocket and SSE event simulation',
    setup: async (page: Page) => {
      const realtimeMocks = new RealtimeMocks(page);
      
      await realtimeMocks.mockWebSocketEvents();
      await realtimeMocks.mockServerSentEvents();
    }
  }
};

// ============================================================================
// Export Classes and Utilities
// ============================================================================

export {
  MockServiceManager,
  APIEndpointMocks,
  ProviderMocks,
  ErrorScenarioMocks,
  PerformanceMocks,
  RealtimeMocks
};