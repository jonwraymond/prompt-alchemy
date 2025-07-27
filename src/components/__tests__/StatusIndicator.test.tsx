import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusIndicator } from '../StatusIndicator';
import { api } from '../../utils/api';

// Mock the API
jest.mock('../../utils/api', () => ({
  api: {
    health: jest.fn(),
    status: jest.fn(),
    getProviders: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('StatusIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock responses
    mockApi.health.mockResolvedValue({
      success: true,
      data: { status: 'healthy', timestamp: new Date().toISOString(), version: 'v1.0.0' },
    });
    
    mockApi.status.mockResolvedValue({
      success: true,
      data: { 
        server: 'running',
        protocol: 'http',
        version: 'v1',
        learning_mode: true,
        uptime: '5m'
      },
    });
    
    mockApi.getProviders.mockResolvedValue({
      success: true,
      data: {
        providers: [
          { name: 'openai', available: false, supports_embeddings: false },
          { name: 'anthropic', available: false, supports_embeddings: false },
        ],
        total_providers: 2,
        available_providers: 0,
        embedding_providers: 0,
      },
    });
  });

  it('renders overall status dot', async () => {
    render(<StatusIndicator />);
    
    const statusDot = document.querySelector('.status-dot.overall');
    expect(statusDot).toBeInTheDocument();
  });

  it('expands to show individual system dots when clicked', async () => {
    render(<StatusIndicator />);
    
    const overallDot = document.querySelector('.status-dot.overall');
    fireEvent.click(overallDot!);
    
    await waitFor(() => {
      expect(document.querySelector('.system-dots')).toBeInTheDocument();
    });
  });

  it('displays helpful tooltip for degraded provider status', async () => {
    render(<StatusIndicator />);
    
    // Wait for initial health check
    await waitFor(() => {
      expect(mockApi.health).toHaveBeenCalled();
    });
    
    // Expand to show system dots
    const overallDot = document.querySelector('.status-dot.overall');
    fireEvent.click(overallDot!);
    
    // Click on providers dot (should be the 3rd system dot)
    await waitFor(() => {
      const systemDots = document.querySelectorAll('.status-dot.system');
      expect(systemDots).toHaveLength(4); // API, Engine, Providers, Database
      
      fireEvent.click(systemDots[2]); // Providers dot
    });
    
    // Check for helpful tooltip content
    await waitFor(() => {
      expect(screen.getByText(/Configure API keys in settings/)).toBeInTheDocument();
    });
  });

  it('shows correct status for unconfigured providers', async () => {
    render(<StatusIndicator />);
    
    await waitFor(() => {
      expect(mockApi.getProviders).toHaveBeenCalled();
    });
    
    // Expand to show system dots
    const overallDot = document.querySelector('.status-dot.overall');
    fireEvent.click(overallDot!);
    
    // Click on providers dot
    await waitFor(() => {
      const systemDots = document.querySelectorAll('.status-dot.system');
      fireEvent.click(systemDots[2]); // Providers dot
    });
    
    // Should show degraded status for unconfigured providers
    await waitFor(() => {
      expect(screen.getByText(/check API keys/)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockApi.health.mockRejectedValue(new Error('Connection failed'));
    
    render(<StatusIndicator />);
    
    await waitFor(() => {
      expect(mockApi.health).toHaveBeenCalled();
    });
    
    // Should show down status and error message
    const overallDot = document.querySelector('.status-dot.overall');
    fireEvent.click(overallDot!);
    
    await waitFor(() => {
      const systemDots = document.querySelectorAll('.status-dot.system');
      fireEvent.click(systemDots[0]); // API dot
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
    });
  });

  it('displays performance indicators for response times', async () => {
    // Mock slow response
    mockApi.health.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          success: true,
          data: { status: 'healthy', timestamp: new Date().toISOString(), version: 'v1.0.0' }
        }), 600) // Simulate 600ms response
      )
    );
    
    render(<StatusIndicator />);
    
    await waitFor(() => {
      expect(mockApi.health).toHaveBeenCalled();
    }, { timeout: 1000 });
    
    // Expand and click API dot
    const overallDot = document.querySelector('.status-dot.overall');
    fireEvent.click(overallDot!);
    
    await waitFor(() => {
      const systemDots = document.querySelectorAll('.status-dot.system');
      fireEvent.click(systemDots[0]); // API dot
    });
    
    // Should show response time
    await waitFor(() => {
      const responseTimeText = screen.getByText(/Response time:/);
      expect(responseTimeText).toBeInTheDocument();
    });
  });
});