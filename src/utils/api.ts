// API utilities for frontend-backend communication

// Enhanced API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp?: string;
}

// Enhanced request interfaces based on actual backend API
export interface PromptGenerateRequest {
  input: string;
  phases?: string[];
  count?: number;
  providers?: Record<string, string>; // phase -> provider mapping
  temperature?: number;
  max_tokens?: number;
  tags?: string[];
  context?: string[];
  persona?: string;
  target_model?: string;
}

// Enhanced response interfaces based on actual backend API
export interface GeneratedPrompt {
  id: string;
  content: string;
  score: number;
  phase: string;
  provider: string;
  temperature?: number;
  created_at: string;
  metadata?: {
    tokens_used?: number;
    response_time?: number;
  };
}

export interface PromptRanking {
  prompt_id: string;
  score: number;
  criteria: string[];
}

export interface PromptGenerateResponse {
  prompts: GeneratedPrompt[];
  rankings?: PromptRanking[];
  selected?: GeneratedPrompt;
  session_id: string;
  metadata: {
    total_generated: number;
    phases_timing?: Record<string, number>;
    providers_used?: Record<string, string>;
    total_tokens?: number;
    total_duration?: number;
  };
}

export interface ProviderInfo {
  name: string;
  available: boolean;
  supports_embeddings: boolean;
  models?: string[];
  capabilities?: string[];
}

export interface ProvidersResponse {
  providers: ProviderInfo[];
  total_providers?: number;
  available_providers?: number;
  embedding_providers?: number;
  retrieved_at?: string;
}

// API configuration
const API_BASE = '/api/v1';
const API_TIMEOUT = 30000; // 30 seconds

// Enhanced fetch with error handling and timeout
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to parse error response
      let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If JSON parsing fails, use default message
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout - please try again',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: false,
      error: 'Unknown error occurred',
    };
  }
}

// Enhanced API service with comprehensive error handling and validation
export const api = {
  // Health & Status endpoints
  async health(): Promise<ApiResponse<{ status: string; timestamp: string; version: string }>> {
    try {
      return await apiRequest('/health');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to check health endpoint',
      };
    }
  },

  async status(): Promise<ApiResponse<{ server: string; protocol: string; version: string; learning_mode?: boolean; uptime?: string }>> {
    try {
      return await apiRequest('/status');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get system status',
      };
    }
  },

  async info(): Promise<ApiResponse<{ name: string; version: string; capabilities: string[]; supported_phases: string[] }>> {
    try {
      return await apiRequest('/info');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get application info',
      };
    }
  },

  // Provider management
  async getProviders(): Promise<ApiResponse<ProvidersResponse>> {
    try {
      return await apiRequest('/providers');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to retrieve providers',
      };
    }
  },

  async testProvider(providerName: string): Promise<ApiResponse<ProviderInfo & { test_result: string; response_time: number }>> {
    if (!providerName?.trim()) {
      return {
        success: false,
        error: 'Provider name is required',
      };
    }

    try {
      return await apiRequest(`/providers/${encodeURIComponent(providerName)}/test`, { 
        method: 'POST' 
      });
    } catch (error) {
      return {
        success: false,
        error: `Failed to test provider ${providerName}`,
      };
    }
  },

  // Prompt generation with validation
  async generatePrompts(request: PromptGenerateRequest): Promise<ApiResponse<PromptGenerateResponse>> {
    // Validate required fields
    if (!request.input?.trim()) {
      return {
        success: false,
        error: 'Input text is required for prompt generation',
      };
    }

    // Validate optional fields
    if (request.count && (request.count < 1 || request.count > 10)) {
      return {
        success: false,
        error: 'Count must be between 1 and 10',
      };
    }

    if (request.temperature && (request.temperature < 0 || request.temperature > 2)) {
      return {
        success: false,
        error: 'Temperature must be between 0 and 2',
      };
    }

    if (request.max_tokens && request.max_tokens < 1) {
      return {
        success: false,
        error: 'Max tokens must be positive',
      };
    }

    try {
      return await apiRequest('/prompts/generate', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate prompts',
      };
    }
  },

  // Alternative generation endpoint (shorthand)
  async generate(request: PromptGenerateRequest): Promise<ApiResponse<PromptGenerateResponse>> {
    try {
      return await apiRequest('/generate', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate prompts via shorthand endpoint',
      };
    }
  },

  // Prompt management
  async savePrompt(prompt: {
    content: string;
    phase?: string;
    provider?: string;
    input?: string;
    score?: number;
    tags?: string[];
  }): Promise<ApiResponse<{ id: string; message: string }>> {
    if (!prompt.content?.trim()) {
      return {
        success: false,
        error: 'Prompt content is required',
      };
    }

    try {
      return await apiRequest('/prompts', {
        method: 'POST',
        body: JSON.stringify(prompt),
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to save prompt',
      };
    }
  },

  // Search functionality (when implemented)
  async searchPrompts(query: string, options: {
    limit?: number;
    offset?: number;
    phase?: string;
    provider?: string;
  } = {}): Promise<ApiResponse<{ prompts: GeneratedPrompt[]; total: number }>> {
    if (!query?.trim()) {
      return {
        success: false,
        error: 'Search query is required',
      };
    }

    const params = new URLSearchParams({
      q: query,
      limit: (options.limit || 10).toString(),
      offset: (options.offset || 0).toString(),
    });

    if (options.phase) params.append('phase', options.phase);
    if (options.provider) params.append('provider', options.provider);

    try {
      return await apiRequest(`/prompts/search?${params}`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to search prompts',
      };
    }
  },

  // List prompts with pagination (when implemented)
  async listPrompts(options: {
    page?: number;
    limit?: number;
    sort_by?: string;
    order?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<{ prompts: GeneratedPrompt[]; pagination: any }>> {
    const params = new URLSearchParams({
      page: (options.page || 1).toString(),
      limit: (options.limit || 10).toString(),
    });

    if (options.sort_by) params.append('sort_by', options.sort_by);
    if (options.order) params.append('order', options.order);

    try {
      return await apiRequest(`/prompts?${params}`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to list prompts',
      };
    }
  },
};

// Enhanced connectivity test utility
export async function testApiConnectivity(): Promise<{
  healthy: boolean;
  tests: Array<{
    name: string;
    success: boolean;
    error?: string;
    duration: number;
    details?: any;
    critical: boolean;
  }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    critical_failures: number;
    total_duration: number;
  };
}> {
  const tests = [];
  let allHealthy = true;
  let criticalFailures = 0;
  const startTime = Date.now();

  // Test 1: Health check (critical)
  console.log('🔍 Testing API health endpoint...');
  const healthStart = Date.now();
  const healthResult = await api.health();
  const healthTest = {
    name: 'Health Check',
    success: healthResult.success,
    error: healthResult.error,
    duration: Date.now() - healthStart,
    details: healthResult.data,
    critical: true,
  };
  tests.push(healthTest);
  if (!healthResult.success) {
    allHealthy = false;
    criticalFailures++;
  }

  // Test 2: Status endpoint (critical)
  console.log('🔍 Testing status endpoint...');
  const statusStart = Date.now();
  const statusResult = await api.status();
  const statusTest = {
    name: 'Status Endpoint',
    success: statusResult.success,
    error: statusResult.error,
    duration: Date.now() - statusStart,
    details: statusResult.data,
    critical: true,
  };
  tests.push(statusTest);
  if (!statusResult.success) {
    allHealthy = false;
    criticalFailures++;
  }

  // Test 3: Info endpoint (non-critical)
  console.log('🔍 Testing info endpoint...');
  const infoStart = Date.now();
  const infoResult = await api.info();
  const infoTest = {
    name: 'Info Endpoint',
    success: infoResult.success,
    error: infoResult.error,
    duration: Date.now() - infoStart,
    details: infoResult.data,
    critical: false,
  };
  tests.push(infoTest);
  if (!infoResult.success) allHealthy = false;

  // Test 4: Providers endpoint (critical)
  console.log('🔍 Testing providers endpoint...');
  const providersStart = Date.now();
  const providersResult = await api.getProviders();
  const providersTest = {
    name: 'Providers Endpoint',
    success: providersResult.success,
    error: providersResult.error,
    duration: Date.now() - providersStart,
    details: providersResult.data,
    critical: true,
  };
  tests.push(providersTest);
  if (!providersResult.success) {
    allHealthy = false;
    criticalFailures++;
  }

  // Test 5: Prompt generation validation (non-critical)
  console.log('🔍 Testing prompt generation validation...');
  const generateStart = Date.now();
  const generateResult = await api.generatePrompts({
    input: '', // Invalid empty input to test validation
    count: 1,
  });
  const generateTest = {
    name: 'Generation Validation',
    success: !generateResult.success && generateResult.error?.includes('required'), // Should fail with validation error
    error: generateResult.success ? 'Validation should have failed' : undefined,
    duration: Date.now() - generateStart,
    details: { validation_working: !generateResult.success },
    critical: false,
  };
  tests.push(generateTest);
  if (!generateTest.success) allHealthy = false;

  const totalDuration = Date.now() - startTime;
  const passedTests = tests.filter(t => t.success).length;
  const failedTests = tests.length - passedTests;

  return {
    healthy: allHealthy,
    tests,
    summary: {
      total: tests.length,
      passed: passedTests,
      failed: failedTests,
      critical_failures: criticalFailures,
      total_duration: totalDuration,
    },
  };
}

// Utility for testing specific functionality
export async function testSpecificFeature(feature: 'generation' | 'providers' | 'search'): Promise<ApiResponse<any>> {
  switch (feature) {
    case 'generation':
      return await api.generatePrompts({
        input: 'Test prompt generation with a simple request',
        count: 1,
        temperature: 0.7,
      });
    
    case 'providers':
      const providersResult = await api.getProviders();
      if (providersResult.success && providersResult.data?.providers?.length > 0) {
        // Test the first available provider
        const firstProvider = providersResult.data.providers.find(p => p.available);
        if (firstProvider) {
          return await api.testProvider(firstProvider.name);
        }
      }
      return providersResult;
    
    case 'search':
      return await api.searchPrompts('test query', { limit: 5 });
    
    default:
      return {
        success: false,
        error: 'Unknown feature',
      };
  }
}

// Utility for logging API responses in development
export function logApiResponse<T>(endpoint: string, response: ApiResponse<T>, duration?: number): void {
  if (process.env.NODE_ENV === 'development') {
    const logStyle = response.success ? 'color: green' : 'color: red';
    console.group(`%c📡 API ${endpoint}`, logStyle);
    console.log('Success:', response.success);
    if (response.error) console.error('Error:', response.error);
    if (response.data) console.log('Data:', response.data);
    if (duration) console.log('Duration:', `${duration}ms`);
    console.groupEnd();
  }
}

export default api;