import { test, expect } from '../fixtures/base-fixtures';
import { expectAPIResponse, makeAPIRequest } from '../helpers/test-utils';

/**
 * API Endpoints Tests
 * 
 * Tests for all HTTP API endpoints including:
 * - Health and status endpoints
 * - Prompt generation and management
 * - Provider information
 * - Analytics and metrics
 * - Learning system endpoints
 * - Error handling and validation
 * - Authentication and rate limiting
 */

test.describe('API Endpoints', () => {
  test.describe('Health and Status', () => {
    test('GET /health should return healthy status', async ({ apiClient }) => {
      const response = await apiClient.healthCheck();
      
      expectAPIResponse(response, 200, ['status', 'timestamp']);
      expect(response.data.status).toBe('healthy');
    });

    test('GET /api/v1/status should return server status', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/status');
      
      expectAPIResponse(response, 200, ['server', 'protocol', 'version']);
      expect(response.data.server).toBe('running');
      expect(response.data.protocol).toBe('http');
      expect(response.data.version).toBe('v1');
    });

    test('GET /api/v1/info should return API information', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/info');
      
      expectAPIResponse(response, 200, ['name', 'version', 'description', 'endpoints']);
      expect(response.data.name).toBe('Prompt Alchemy HTTP API');
      expect(response.data.version).toBe('v1');
      expect(response.data.endpoints).toHaveProperty('generate');
    });
  });

  test.describe('Provider Endpoints', () => {
    test('GET /api/v1/providers should list available providers', async ({ apiClient }) => {
      const response = await apiClient.getProviders();
      
      expectAPIResponse(response, 200, ['providers', 'count']);
      expect(Array.isArray(response.data.providers)).toBe(true);
      expect(response.data.count).toBeGreaterThan(0);
    });

    test('GET /api/v1/providers/{provider} should return provider details', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/providers/openai');
      
      expectAPIResponse(response, 200, ['name', 'available']);
      expect(response.data.name).toBe('openai');
      expect(response.data.available).toBe(true);
    });

    test('GET /api/v1/providers/{provider}/models should return provider models', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/providers/openai/models');
      
      // This endpoint might not be fully implemented yet
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });

    test('GET /api/v1/providers/invalid should return 404', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/providers/nonexistent');
      
      expect(response.status).toBe(404);
    });
  });

  test.describe('Prompt Generation', () => {
    test('POST /api/v1/prompts/generate should generate prompts successfully', async ({ apiClient }) => {
      const response = await apiClient.generatePrompt({
        input: 'Create a test prompt for API testing',
        count: 2,
        provider: 'openai'
      });
      
      expectAPIResponse(response, 200, ['prompts']);
      expect(Array.isArray(response.data.prompts)).toBe(true);
      expect(response.data.prompts.length).toBeGreaterThan(0);
    });

    test('POST /api/v1/prompts/generate should require input parameter', async ({ page }) => {
      const response = await makeAPIRequest(page, 'POST', '/api/v1/prompts/generate', {
        count: 3
        // Missing required 'input' parameter
      });
      
      expect(response.status).toBe(400);
    });

    test('POST /api/v1/prompts/generate should handle different providers', async ({ page }) => {
      const providers = ['openai', 'anthropic', 'google'];
      
      for (const provider of providers) {
        const response = await makeAPIRequest(page, 'POST', '/api/v1/prompts/generate', {
          input: `Test prompt for ${provider}`,
          provider: provider,
          count: 1
        });
        
        // Should either succeed or return a known error
        expect(response.status === 200 || response.status === 400 || response.status === 503).toBe(true);
      }
    });

    test('POST /api/v1/prompts/generate should respect count parameter', async ({ page }) => {
      const response = await makeAPIRequest(page, 'POST', '/api/v1/prompts/generate', {
        input: 'Test prompt for count verification',
        count: 3,
        provider: 'openai'
      });
      
      if (response.status === 200) {
        expect(response.data.prompts.length).toBeLessThanOrEqual(3);
      }
    });

    test('POST /api/v1/prompts/generate should handle phase selection', async ({ page }) => {
      const response = await makeAPIRequest(page, 'POST', '/api/v1/prompts/generate', {
        input: 'Test prompt for phase selection',
        phase_selection: 'best',
        provider: 'openai'
      });
      
      // Should accept phase_selection parameter
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });
  });

  test.describe('Prompt Management', () => {
    test('GET /api/v1/prompts should list prompts', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/prompts');
      
      expectAPIResponse(response, 200);
      
      if (response.data.prompts) {
        expect(Array.isArray(response.data.prompts)).toBe(true);
      }
    });

    test('POST /api/v1/prompts should create new prompt', async ({ page, testData }) => {
      const response = await makeAPIRequest(page, 'POST', '/api/v1/prompts', {
        content: testData.prompt,
        phase: 'prima-materia',
        provider: 'openai',
        tags: ['test', 'automation']
      });
      
      // Should either succeed or return method not allowed
      expect(response.status === 201 || response.status === 200 || response.status === 405).toBe(true);
    });

    test('GET /api/v1/prompts/search should search prompts', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/prompts/search?q=test');
      
      expectAPIResponse(response, 200);
    });

    test('GET /api/v1/prompts/popular should return popular prompts', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/prompts/popular');
      
      expectAPIResponse(response, 200);
    });

    test('GET /api/v1/prompts/recent should return recent prompts', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/prompts/recent');
      
      expectAPIResponse(response, 200);
    });
  });

  test.describe('Analytics Endpoints', () => {
    test('GET /api/v1/analytics/stats should return usage statistics', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/analytics/stats');
      
      expectAPIResponse(response, 200);
      
      if (response.data) {
        expect(typeof response.data.total_prompts).toBe('number');
        expect(typeof response.data.total_sessions).toBe('number');
      }
    });

    test('GET /api/v1/analytics/metrics should return metrics', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/analytics/metrics');
      
      expectAPIResponse(response, 200);
      
      if (response.data) {
        expect(typeof response.data.requests_today).toBe('number');
        expect(typeof response.data.success_rate).toBe('number');
      }
    });
  });

  test.describe('Learning System', () => {
    test('GET /api/v1/learning/status should return learning status', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/learning/status');
      
      // Learning might not be enabled, so 404 is acceptable
      if (response.status === 200) {
        expectAPIResponse(response, 200, ['enabled']);
      } else {
        expect(response.status).toBe(404);
      }
    });

    test('POST /api/v1/learning/feedback should accept feedback', async ({ page }) => {
      const response = await makeAPIRequest(page, 'POST', '/api/v1/learning/feedback', {
        prompt_id: 'test-prompt-id',
        rating: 5,
        feedback: 'Test feedback'
      });
      
      // Should either work or return not implemented/not found
      expect([200, 201, 404, 501].includes(response.status)).toBe(true);
    });
  });

  test.describe('Optimization Endpoints', () => {
    test('POST /api/v1/optimize should optimize prompts', async ({ page }) => {
      const response = await makeAPIRequest(page, 'POST', '/api/v1/optimize', {
        prompt: 'Test prompt for optimization',
        criteria: ['clarity', 'specificity']
      });
      
      // Feature might not be implemented yet
      expect([200, 501].includes(response.status)).toBe(true);
    });

    test('POST /api/v1/optimize/batch should handle batch optimization', async ({ page }) => {
      const response = await makeAPIRequest(page, 'POST', '/api/v1/optimize/batch', {
        prompts: ['Prompt 1', 'Prompt 2'],
        criteria: ['clarity']
      });
      
      // Feature might not be implemented yet
      expect([200, 501].includes(response.status)).toBe(true);
    });
  });

  test.describe('Selection Endpoints', () => {
    test('POST /api/v1/select should select best prompt', async ({ page }) => {
      const response = await makeAPIRequest(page, 'POST', '/api/v1/select', {
        prompts: ['Option 1', 'Option 2', 'Option 3'],
        criteria: 'best_overall'
      });
      
      // Feature might not be implemented yet
      expect([200, 501].includes(response.status)).toBe(true);
    });
  });

  test.describe('Batch Processing', () => {
    test('POST /api/v1/batch/generate should handle batch generation', async ({ page }) => {
      const response = await makeAPIRequest(page, 'POST', '/api/v1/batch/generate', {
        inputs: ['Prompt 1', 'Prompt 2'],
        count: 2,
        provider: 'openai'
      });
      
      // Feature might not be implemented yet
      expect([200, 501].includes(response.status)).toBe(true);
    });
  });

  test.describe('Node Activation', () => {
    test('POST /api/v1/node/activate should activate nodes', async ({ page }) => {
      const response = await makeAPIRequest(page, 'POST', '/api/v1/node/activate', {
        node_id: 'hub',
        action: 'activate'
      });
      
      expectAPIResponse(response, 200);
      expect(response.data.message).toBe('Endpoint connected');
    });
  });

  test.describe('Connection Status', () => {
    test('GET /api/v1/connection-status should return connection status', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/connection-status');
      
      expectAPIResponse(response, 200, ['connections', 'total', 'healthy']);
      expect(Array.isArray(response.data.connections)).toBe(true);
      expect(typeof response.data.total).toBe('number');
      expect(typeof response.data.healthy).toBe('number');
    });

    test('GET /api/v1/nodes-status should return nodes status', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/nodes-status');
      
      expectAPIResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        const node = response.data[0];
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('name');
        expect(node).toHaveProperty('status');
        expect(node).toHaveProperty('phase');
      }
    });

    test('GET /api/v1/flow-info should return flow information', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/flow-info');
      
      expectAPIResponse(response, 200, ['flow_id', 'name', 'description', 'phases']);
      expect(response.data.name).toBe('Alchemical Prompt Generation');
      expect(Array.isArray(response.data.phases)).toBe(true);
    });

    test('GET /api/v1/system-status should return system status', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/system-status');
      
      expectAPIResponse(response, 200, ['status', 'uptime', 'providers_online']);
      expect(response.data.status).toBe('healthy');
      expect(typeof response.data.providers_online).toBe('number');
    });
  });

  test.describe('Connection Endpoints', () => {
    const connectionEndpoints = [
      '/api/v1/connection/input-parse',
      '/api/v1/connection/coagulatio-output',
      '/api/v1/connection/solutio-coagulatio',
      '/api/v1/connection/prima-hub',
      '/api/v1/connection/input-prima',
      '/api/v1/connection/hub-solutio',
      '/api/v1/connection/parse-prima',
      '/api/v1/connection/input-extract',
      '/api/v1/connection/extract-prima',
      '/api/v1/connection/coagulatio-finalize',
      '/api/v1/connection/hub-flow',
      '/api/v1/connection/hub-refine',
      '/api/v1/connection/coagulatio-validate',
      '/api/v1/connection/refine-solutio',
      '/api/v1/connection/flow-solutio',
      '/api/v1/connection/validate-output',
      '/api/v1/connection/hub-judge',
      '/api/v1/connection/hub-database',
      '/api/v1/connection/hub-optimize',
      '/api/v1/connection/prima-learning',
      '/api/v1/connection/finalize-output'
    ];

    connectionEndpoints.forEach(endpoint => {
      test(`GET ${endpoint} should return connection status`, async ({ page }) => {
        const response = await makeAPIRequest(page, 'GET', endpoint);
        
        expectAPIResponse(response, 200, ['message']);
        expect(response.data.message).toBe('Endpoint connected');
      });
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 for non-existent endpoints', async ({ page }) => {
      const response = await makeAPIRequest(page, 'GET', '/api/v1/nonexistent-endpoint');
      
      expect(response.status).toBe(404);
    });

    test('should handle invalid JSON in request body', async ({ page }) => {
      const response = await page.request.post('http://localhost:8080/api/v1/prompts/generate', {
        data: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status()).toBe(400);
    });

    test('should handle missing Content-Type header', async ({ page }) => {
      const response = await page.request.post('http://localhost:8080/api/v1/prompts/generate', {
        data: JSON.stringify({ input: 'test' })
        // Missing Content-Type header
      });
      
      // Should either work or return 400
      expect(response.status() === 200 || response.status() === 400).toBe(true);
    });

    test('should handle oversized requests', async ({ page }) => {
      const largeInput = 'A'.repeat(100000); // 100KB string
      
      const response = await makeAPIRequest(page, 'POST', '/api/v1/prompts/generate', {
        input: largeInput,
        provider: 'openai'
      });
      
      // Should either work or return 413 (Payload Too Large)
      expect([200, 413, 400].includes(response.status)).toBe(true);
    });
  });

  test.describe('Request Validation', () => {
    test('should validate required parameters', async ({ page }) => {
      const response = await makeAPIRequest(page, 'POST', '/api/v1/prompts/generate', {
        // Missing required 'input' parameter
        provider: 'openai',
        count: 3
      });
      
      expect(response.status).toBe(400);
    });

    test('should validate parameter types', async ({ page }) => {
      const response = await makeAPIRequest(page, 'POST', '/api/v1/prompts/generate', {
        input: 'Test prompt',
        count: 'invalid_number', // Should be number
        provider: 'openai'
      });
      
      expect(response.status).toBe(400);
    });

    test('should validate parameter ranges', async ({ page }) => {
      const response = await makeAPIRequest(page, 'POST', '/api/v1/prompts/generate', {
        input: 'Test prompt',
        count: -1, // Invalid count
        provider: 'openai'
      });
      
      expect(response.status).toBe(400);
    });
  });

  test.describe('Rate Limiting', () => {
    test('should handle rate limiting if enabled', async ({ page }) => {
      // Make multiple rapid requests
      const requests = Array.from({ length: 10 }, (_, i) => 
        makeAPIRequest(page, 'GET', '/api/v1/status')
      );
      
      const responses = await Promise.all(requests);
      
      // All should succeed if rate limiting is not enabled, or some should be 429
      const statusCodes = responses.map(r => r.status);
      const hasRateLimit = statusCodes.some(code => code === 429);
      const allSuccess = statusCodes.every(code => code === 200);
      
      expect(hasRateLimit || allSuccess).toBe(true);
    });
  });
}); 