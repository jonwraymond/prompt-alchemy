// API utilities for frontend-backend communication
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PromptGenerateRequest {
  input: string;
  phases?: string[];
  count?: number;
  persona?: string;
  temperature?: number;
  provider?: string;
  phase_selection?: string;
}

export interface PromptGenerateResponse {
  prompts: Array<{
    content: string;
    score: number;
    phase: string;
    provider: string;
  }>;
  metadata: {
    total_time: number;
    phases_completed: string[];
    provider_used: string;
  };
}

export interface ProviderInfo {
  name: string;
  available: boolean;
  supports_embeddings: boolean;
  models: string[];
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

// API methods
export const api = {
  // Health check
  async health(): Promise<ApiResponse<{ status: string; uptime: string }>> {
    return apiRequest('/health');
  },

  // System status
  async status(): Promise<ApiResponse<{ server: string; version: string; learning_mode: boolean; uptime: string }>> {
    return apiRequest('/status');
  },

  // Get available providers
  async getProviders(): Promise<ApiResponse<{ providers: ProviderInfo[] }>> {
    return apiRequest('/providers', { method: 'POST' });
  },

  // Test specific provider
  async testProvider(providerName: string): Promise<ApiResponse<ProviderInfo>> {
    return apiRequest(`/providers/${providerName}/test`, { method: 'POST' });
  },

  // Generate prompts
  async generatePrompts(request: PromptGenerateRequest): Promise<ApiResponse<PromptGenerateResponse>> {
    return apiRequest('/prompts/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // Search prompts
  async searchPrompts(query: string, limit: number = 10): Promise<ApiResponse<{ prompts: any[], total: number }>> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });
    return apiRequest(`/prompts/search?${params}`);
  },

  // List prompts
  async listPrompts(page: number = 1, limit: number = 10): Promise<ApiResponse<{ prompts: any[], pagination: any }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return apiRequest(`/prompts?${params}`);
  },
};

// Connection test utility
export async function testApiConnectivity(): Promise<{
  healthy: boolean;
  tests: Array<{
    name: string;
    success: boolean;
    error?: string;
    duration: number;
    details?: any;
  }>;
}> {
  const tests = [];
  let allHealthy = true;

  // Test 1: Health check
  const healthStart = Date.now();
  const healthResult = await api.health();
  tests.push({
    name: 'Health Check',
    success: healthResult.success,
    error: healthResult.error,
    duration: Date.now() - healthStart,
    details: healthResult.data,
  });
  if (!healthResult.success) allHealthy = false;

  // Test 2: Status endpoint
  const statusStart = Date.now();
  const statusResult = await api.status();
  tests.push({
    name: 'Status Endpoint',
    success: statusResult.success,
    error: statusResult.error,
    duration: Date.now() - statusStart,
    details: statusResult.data,
  });
  if (!statusResult.success) allHealthy = false;

  // Test 3: Providers endpoint
  const providersStart = Date.now();
  const providersResult = await api.getProviders();
  tests.push({
    name: 'Providers Endpoint',
    success: providersResult.success,
    error: providersResult.error,
    duration: Date.now() - providersStart,
    details: providersResult.data,
  });
  if (!providersResult.success) allHealthy = false;

  return {
    healthy: allHealthy,
    tests,
  };
}

export default api;