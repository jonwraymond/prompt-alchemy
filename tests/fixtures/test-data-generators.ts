/**
 * Test Data Generators for Prompt Alchemy
 * 
 * Comprehensive data generation utilities for testing various scenarios:
 * - Realistic prompt content generation
 * - API response mocking
 * - User interaction patterns
 * - Performance test data
 * - Edge case scenarios
 * - Multilingual content generation
 */

import { faker } from '@faker-js/faker';

// ============================================================================
// Core Data Interfaces
// ============================================================================

export interface TestPromptData {
  id: string;
  input: string;
  output: string[];
  metadata: {
    provider: string;
    persona: string;
    phase_selection: string;
    timestamp: string;
    score: number;
    tokens_used: number;
  };
  phases: {
    prima_materia: string;
    solutio: string;
    coagulatio: string;
  };
}

export interface TestUserData {
  id: string;
  email: string;
  username: string;
  preferences: {
    default_provider: string;
    default_persona: string;
    ui_theme: string;
    language: string;
  };
  usage_stats: {
    prompts_generated: number;
    last_active: string;
    favorite_personas: string[];
  };
}

export interface TestAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata: {
    request_id: string;
    timestamp: string;
    execution_time_ms: number;
    provider_used: string;
  };
}

export interface TestGenerationRequest {
  input: string;
  provider: string;
  persona: string;
  count: number;
  phase_selection: string;
  temperature?: number;
  max_tokens?: number;
}

// ============================================================================
// Prompt Content Generators
// ============================================================================

/**
 * Generate realistic prompt inputs for various personas
 */
export function generatePromptInput(persona: string = 'general'): string {
  const prompts = {
    general: [
      'Create a comprehensive marketing strategy for a new tech startup',
      'Write a detailed project proposal for team collaboration software',
      'Design a user onboarding flow for a mobile banking app',
      'Develop a content calendar for social media engagement',
      'Create documentation for a REST API with authentication',
      'Write a business plan for a sustainable energy company',
      'Design a customer feedback system for e-commerce',
      'Create a training program for remote team management'
    ],
    code: [
      'Build a React component for real-time data visualization',
      'Create a Python script for automated data analysis',
      'Design a microservice architecture for user authentication',
      'Implement a caching strategy for high-traffic APIs',
      'Build a CI/CD pipeline for containerized applications',
      'Create a database schema for multi-tenant SaaS',
      'Implement real-time chat functionality with WebSockets',
      'Design a scalable file upload system'
    ],
    creative: [
      'Write a compelling story about time travel',
      'Create a brand narrative for an eco-friendly fashion company',
      'Design a creative campaign for mental health awareness',
      'Write engaging copy for a luxury travel website',
      'Create a series of social media posts for a food blog',
      'Design a memorable logo concept with brand guidelines',
      'Write a persuasive email sequence for product launch',
      'Create an interactive storytelling experience'
    ],
    analytical: [
      'Analyze market trends in the renewable energy sector',
      'Evaluate the ROI of digital transformation initiatives',
      'Compare customer acquisition strategies across industries',
      'Assess the impact of remote work on productivity metrics',
      'Analyze user behavior patterns in mobile applications',
      'Evaluate the effectiveness of different pricing models',
      'Compare the performance of various ML algorithms',
      'Analyze social media sentiment for brand monitoring'
    ],
    educational: [
      'Explain quantum computing concepts for beginners',
      'Create a curriculum for digital marketing certification',
      'Design a learning path for full-stack development',
      'Develop interactive exercises for data science training',
      'Create assessment rubrics for project-based learning',
      'Design a mentorship program for career development',
      'Explain complex financial concepts with simple examples',
      'Create study guides for professional certification exams'
    ]
  };

  const personaPrompts = prompts[persona as keyof typeof prompts] || prompts.general;
  const basePrompt = faker.helpers.arrayElement(personaPrompts);
  
  // Add variation to make each prompt unique
  const variations = [
    ` focusing on ${faker.company.buzzNoun()}`,
    ` for ${faker.company.name()}`,
    ` targeting ${faker.helpers.arrayElement(['millennials', 'Gen Z', 'professionals', 'small businesses', 'enterprises'])}`,
    ` with emphasis on ${faker.helpers.arrayElement(['sustainability', 'innovation', 'efficiency', 'user experience', 'security'])}`,
    ` considering ${faker.helpers.arrayElement(['budget constraints', 'scalability', 'compliance requirements', 'international markets'])}`
  ];

  return basePrompt + faker.helpers.arrayElement(variations);
}

/**
 * Generate realistic prompt outputs
 */
export function generatePromptOutputs(input: string, count: number = 3): string[] {
  const outputs: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const styles = [
      'professional and detailed',
      'concise and action-oriented',
      'creative and engaging',
      'technical and precise',
      'strategic and comprehensive'
    ];
    
    const style = faker.helpers.arrayElement(styles);
    const baseOutput = `Create a ${style} response to: "${input}"`;
    
    // Add specific details based on style
    const details = {
      'professional and detailed': 'Include market research, competitive analysis, and implementation timeline.',
      'concise and action-oriented': 'Focus on key action items, deadlines, and measurable outcomes.',
      'creative and engaging': 'Use storytelling elements, emotional hooks, and memorable examples.',
      'technical and precise': 'Include technical specifications, code examples, and performance metrics.',
      'strategic and comprehensive': 'Cover long-term vision, risk assessment, and resource allocation.'
    };
    
    outputs.push(`${baseOutput} ${details[style as keyof typeof details]}`);
  }
  
  return outputs;
}

/**
 * Generate phase-specific content
 */
export function generatePhaseContent(phase: 'prima_materia' | 'solutio' | 'coagulatio', input: string): string {
  const phaseStyles = {
    prima_materia: 'Extract the core essence and raw ideas. Break down the concept into fundamental components.',
    solutio: 'Dissolve into natural, flowing language. Make it conversational and accessible.',
    coagulatio: 'Crystallize into precise, production-ready form. Optimize for clarity and effectiveness.'
  };
  
  return `${phaseStyles[phase]} ${input}`;
}

// ============================================================================
// API Response Generators
// ============================================================================

/**
 * Generate realistic API responses for different scenarios
 */
export function generateAPIResponse(type: 'success' | 'error' | 'timeout' | 'partial', data?: any): TestAPIResponse {
  const baseResponse = {
    metadata: {
      request_id: faker.datatype.uuid(),
      timestamp: faker.date.recent().toISOString(),
      execution_time_ms: faker.datatype.number({ min: 100, max: 5000 }),
      provider_used: faker.helpers.arrayElement(['openai', 'anthropic', 'google', 'ollama'])
    }
  };

  switch (type) {
    case 'success':
      return {
        success: true,
        data: data || {
          prompts: generatePromptOutputs(faker.lorem.sentence(), 3),
          phases: {
            prima_materia: generatePhaseContent('prima_materia', faker.lorem.sentence()),
            solutio: generatePhaseContent('solutio', faker.lorem.sentence()),
            coagulatio: generatePhaseContent('coagulatio', faker.lorem.sentence())
          },
          score: faker.datatype.float({ min: 7.0, max: 10.0, precision: 0.1 }),
          tokens_used: faker.datatype.number({ min: 150, max: 800 })
        },
        ...baseResponse
      };

    case 'error':
      return {
        success: false,
        error: faker.helpers.arrayElement([
          'Provider API rate limit exceeded',
          'Invalid API key configuration',
          'Network timeout during generation',
          'Insufficient provider credits',
          'Content filter violation detected',
          'Server temporarily unavailable'
        ]),
        ...baseResponse,
        metadata: {
          ...baseResponse.metadata,
          execution_time_ms: faker.datatype.number({ min: 50, max: 1000 })
        }
      };

    case 'timeout':
      return {
        success: false,
        error: 'Request timeout after 30 seconds',
        ...baseResponse,
        metadata: {
          ...baseResponse.metadata,
          execution_time_ms: 30000
        }
      };

    case 'partial':
      return {
        success: true,
        data: {
          prompts: generatePromptOutputs(faker.lorem.sentence(), 1), // Only 1 instead of requested 3
          phases: {
            prima_materia: generatePhaseContent('prima_materia', faker.lorem.sentence()),
            solutio: generatePhaseContent('solutio', faker.lorem.sentence()),
            coagulatio: null // Missing phase
          },
          score: faker.datatype.float({ min: 5.0, max: 7.0, precision: 0.1 }),
          tokens_used: faker.datatype.number({ min: 50, max: 200 }),
          warnings: ['Some phases failed to generate', 'Partial response due to provider limitations']
        },
        ...baseResponse
      };

    default:
      throw new Error(`Unknown response type: ${type}`);
  }
}

/**
 * Generate test generation requests
 */
export function generateGenerationRequest(overrides: Partial<TestGenerationRequest> = {}): TestGenerationRequest {
  return {
    input: generatePromptInput(),
    provider: faker.helpers.arrayElement(['openai', 'anthropic', 'google', 'ollama']),
    persona: faker.helpers.arrayElement(['general', 'code', 'creative', 'analytical', 'educational']),
    count: faker.datatype.number({ min: 1, max: 5 }),
    phase_selection: faker.helpers.arrayElement(['best', 'all', 'specific']),
    temperature: faker.datatype.float({ min: 0.1, max: 1.0, precision: 0.1 }),
    max_tokens: faker.datatype.number({ min: 100, max: 1000 }),
    ...overrides
  };
}

// ============================================================================
// User Data Generators
// ============================================================================

/**
 * Generate realistic user data
 */
export function generateUserData(overrides: Partial<TestUserData> = {}): TestUserData {
  return {
    id: faker.datatype.uuid(),
    email: faker.internet.email(),
    username: faker.internet.userName(),
    preferences: {
      default_provider: faker.helpers.arrayElement(['openai', 'anthropic', 'google']),
      default_persona: faker.helpers.arrayElement(['general', 'code', 'creative', 'analytical']),
      ui_theme: faker.helpers.arrayElement(['dark', 'light', 'auto']),
      language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de', 'ja'])
    },
    usage_stats: {
      prompts_generated: faker.datatype.number({ min: 0, max: 1000 }),
      last_active: faker.date.recent().toISOString(),
      favorite_personas: faker.helpers.arrayElements(['general', 'code', 'creative', 'analytical', 'educational'], { min: 1, max: 3 })
    },
    ...overrides
  };
}

// ============================================================================
// Performance Test Data
// ============================================================================

/**
 * Generate data for performance testing
 */
export function generatePerformanceTestData() {
  return {
    massRequests: Array.from({ length: 100 }, () => generateGenerationRequest()),
    longInput: faker.lorem.paragraphs(20), // Very long input for stress testing
    complexRequest: {
      input: generatePromptInput('code'),
      provider: 'openai',
      persona: 'code',
      count: 5,
      phase_selection: 'all',
      temperature: 0.7,
      max_tokens: 2000
    },
    concurrentUsers: Array.from({ length: 10 }, () => generateUserData()),
    heavyPayload: {
      requests: Array.from({ length: 50 }, () => generateGenerationRequest()),
      metadata: {
        test_id: faker.datatype.uuid(),
        timestamp: new Date().toISOString(),
        duration_target_ms: 30000
      }
    }
  };
}

// ============================================================================
// Edge Case Generators
// ============================================================================

/**
 * Generate edge case test data
 */
export function generateEdgeCaseData() {
  return {
    emptyInput: '',
    veryLongInput: 'a'.repeat(10000),
    specialCharacters: '!@#$%^&*()_+-=[]{}|;:,.<>?~`',
    unicodeInput: '🚀 Unicode test with émojis and spëcial châractérs 中文 العربية',
    htmlInput: '<script>alert("xss")</script><h1>HTML Content</h1>',
    sqlInjection: "'; DROP TABLE users; --",
    invalidJSON: '{"invalid": json}',
    nullValues: null,
    undefinedValues: undefined,
    extremeNumbers: {
      veryLarge: Number.MAX_SAFE_INTEGER,
      verySmall: Number.MIN_SAFE_INTEGER,
      negative: -999999,
      zero: 0,
      float: 3.14159265359
    },
    invalidProviders: ['invalid-provider', '', null, undefined],
    invalidPersonas: ['non-existent', '', null, undefined],
    invalidCounts: [-1, 0, 100, null, undefined, 'not-a-number']
  };
}

// ============================================================================
// Multilingual Test Data
// ============================================================================

/**
 * Generate multilingual test data
 */
export function generateMultilingualData() {
  const languages = {
    en: 'Create a comprehensive marketing strategy for sustainable products',
    es: 'Crear una estrategia de marketing integral para productos sostenibles',
    fr: 'Créer une stratégie marketing complète pour les produits durables',
    de: 'Erstellen Sie eine umfassende Marketingstrategie für nachhaltige Produkte',
    ja: '持続可能な製品のための包括的なマーケティング戦略を作成する',
    zh: '为可持续产品创建综合营销策略',
    ar: 'إنشاء استراتيجية تسويق شاملة للمنتجات المستدامة',
    ru: 'Создать комплексную маркетинговую стратегию для устойчивых продуктов'
  };

  return Object.entries(languages).map(([lang, input]) => ({
    language: lang,
    input,
    request: generateGenerationRequest({ input })
  }));
}

// ============================================================================
// Mock Factory Functions
// ============================================================================

/**
 * Create mock data factories for different scenarios
 */
export class TestDataFactory {
  static createPromptSet(count: number, persona?: string): TestPromptData[] {
    return Array.from({ length: count }, () => ({
      id: faker.datatype.uuid(),
      input: generatePromptInput(persona),
      output: generatePromptOutputs(generatePromptInput(persona)),
      metadata: {
        provider: faker.helpers.arrayElement(['openai', 'anthropic', 'google']),
        persona: persona || faker.helpers.arrayElement(['general', 'code', 'creative']),
        phase_selection: faker.helpers.arrayElement(['best', 'all']),
        timestamp: faker.date.recent().toISOString(),
        score: faker.datatype.float({ min: 6.0, max: 10.0, precision: 0.1 }),
        tokens_used: faker.datatype.number({ min: 100, max: 800 })
      },
      phases: {
        prima_materia: generatePhaseContent('prima_materia', generatePromptInput()),
        solutio: generatePhaseContent('solutio', generatePromptInput()),
        coagulatio: generatePhaseContent('coagulatio', generatePromptInput())
      }
    }));
  }

  static createUserSession(actions: number = 5): any[] {
    const user = generateUserData();
    const session = [];

    for (let i = 0; i < actions; i++) {
      session.push({
        timestamp: faker.date.recent().toISOString(),
        action: faker.helpers.arrayElement(['generate', 'search', 'optimize', 'export']),
        data: generateGenerationRequest(),
        user_id: user.id
      });
    }

    return session;
  }

  static createAPITestSuite() {
    return {
      successfulGeneration: generateAPIResponse('success'),
      failedGeneration: generateAPIResponse('error'),
      timeoutScenario: generateAPIResponse('timeout'),
      partialResponse: generateAPIResponse('partial'),
      validRequests: Array.from({ length: 5 }, () => generateGenerationRequest()),
      invalidRequests: [
        generateGenerationRequest({ input: '' }),
        generateGenerationRequest({ provider: 'invalid' as any }),
        generateGenerationRequest({ count: -1 })
      ]
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Seed faker for reproducible tests
 */
export function seedTestData(seed: number = 12345): void {
  faker.seed(seed);
}

/**
 * Reset faker to random state
 */
export function resetTestData(): void {
  faker.seed();
}

/**
 * Generate timestamp-based unique identifiers
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${faker.datatype.number({ min: 1000, max: 9999 })}`;
}

/**
 * Create realistic test delays
 */
export function generateTestDelay(): number {
  return faker.datatype.number({ min: 100, max: 2000 });
}

/**
 * Export all generators for easy access
 */
export const generators = {
  prompt: {
    input: generatePromptInput,
    outputs: generatePromptOutputs,
    phase: generatePhaseContent
  },
  api: {
    response: generateAPIResponse,
    request: generateGenerationRequest
  },
  user: generateUserData,
  performance: generatePerformanceTestData,
  edgeCase: generateEdgeCaseData,
  multilingual: generateMultilingualData,
  factory: TestDataFactory
};