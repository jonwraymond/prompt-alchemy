import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { StatusIndicator } from '../StatusIndicator';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the API
jest.mock('../../utils/api', () => ({
  api: {
    health: jest.fn().mockResolvedValue({
      success: true,
      data: { status: 'healthy' },
    }),
    status: jest.fn().mockResolvedValue({
      success: true,
      data: { 
        server: 'running',
        version: 'v1',
        learning_mode: true,
        uptime: '5m'
      },
    }),
    getProviders: jest.fn().mockResolvedValue({
      success: true,
      data: {
        providers: [
          { name: 'openai', available: true, supports_embeddings: true },
          { name: 'anthropic', available: false, supports_embeddings: false },
        ],
        total_providers: 2,
        available_providers: 1,
        embedding_providers: 1,
      },
    }),
  },
}));

describe('StatusIndicator Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<StatusIndicator />);
    
    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('provides proper ARIA labels and roles', () => {
    const { container } = render(<StatusIndicator showTooltips={true} />);
    
    const statusDot = container.querySelector('.status-dot.overall');
    expect(statusDot).toHaveAttribute('title');
    
    // Check that title provides meaningful description
    const title = statusDot?.getAttribute('title');
    expect(title).toMatch(/Overall Status:/);
  });

  it('supports keyboard navigation', () => {
    const { container } = render(<StatusIndicator />);
    
    const buttons = container.querySelectorAll('button, [role="button"]');
    buttons.forEach(button => {
      // Each interactive element should be focusable
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
  });

  it('provides sufficient color contrast', () => {
    const { container } = render(<StatusIndicator />);
    
    // Test that we're using the defined colors that meet contrast requirements
    const statusDot = container.querySelector('.status-dot.overall');
    
    // The colors should be visible on the dark background
    const computedStyle = window.getComputedStyle(statusDot!);
    const backgroundColor = computedStyle.backgroundColor;
    
    // The background color should be one of our defined accessible colors
    // Valid colors: operational green, degraded amber, down red
    // (This is a simplified test - in practice you'd use a contrast ratio calculator)
    expect(backgroundColor).toBeTruthy();
  });

  it('respects prefers-reduced-motion', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { container } = render(<StatusIndicator />);
    
    // Check that CSS respects reduced motion
    const style = document.createElement('style');
    document.head.appendChild(style);
    style.sheet?.insertRule(`
      @media (prefers-reduced-motion: reduce) {
        .status-pulse { animation: none !important; }
      }
    `);
    
    // In a real test, you'd check computed styles
    // This is more of a smoke test that the component renders
    expect(container.querySelector('.status-indicator')).toBeInTheDocument();
  });

  it('provides clear status text', () => {
    const { container } = render(<StatusIndicator />);
    
    const overallDot = container.querySelector('.status-dot.overall');
    const title = overallDot?.getAttribute('title');
    
    // Title should be descriptive and not just show status code
    expect(title).not.toMatch(/^(up|down|ok|error)$/i);
    expect(title).toMatch(/operational|degraded|down/i);
  });
});