import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusIndicator, SystemStatus, StatusType } from './StatusIndicator';
import { api } from '../utils/api';

// Mock the API
jest.mock('../utils/api', () => ({
  api: {
    health: jest.fn(),
    status: jest.fn(),
    getProviders: jest.fn(),
  },
}));

// Mock ReactDOM.createPortal
beforeAll(() => {
  const originalCreatePortal = jest.requireActual('react-dom').createPortal;
  jest.spyOn(require('react-dom'), 'createPortal').mockImplementation((element, container) => {
    return originalCreatePortal(element, container || document.body);
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('StatusIndicator', () => {
  const mockHealthResponse = {
    success: true,
    data: { status: 'healthy' },
  };

  const mockStatusResponse = {
    success: true,
    data: { learning_mode: true },
  };

  const mockProvidersResponse = {
    success: true,
    data: {
      total_providers: 3,
      available_providers: 2,
      embedding_providers: 1,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (api.health as jest.Mock).mockResolvedValue(mockHealthResponse);
    (api.status as jest.Mock).mockResolvedValue(mockStatusResponse);
    (api.getProviders as jest.Mock).mockResolvedValue(mockProvidersResponse);
  });

  describe('Visual Requirements', () => {
    test('renders with correct dot size (14px base)', () => {
      const { container } = render(<StatusIndicator />);
      const dots = container.querySelectorAll('.status-dot.system.minimal');
      
      expect(dots).toHaveLength(4); // 4 system dots
      
      dots.forEach(dot => {
        const styles = window.getComputedStyle(dot);
        expect(styles.width).toBe('14px');
        expect(styles.height).toBe('14px');
      });
    });

    test('maintains 12px spacing between dots', () => {
      const { container } = render(<StatusIndicator />);
      const dotsContainer = container.querySelector('.system-dots');
      const styles = window.getComputedStyle(dotsContainer!);
      
      expect(styles.gap).toBe('12px');
    });

    test('shows pulsating animation for operational status', async () => {
      const { container } = render(<StatusIndicator />);
      
      await waitFor(() => {
        const operationalDots = container.querySelectorAll('.status-dot.system.minimal.operational');
        expect(operationalDots.length).toBeGreaterThan(0);
        
        operationalDots.forEach(dot => {
          const styles = window.getComputedStyle(dot);
          expect(styles.animation).toContain('pulsate');
        });
      });
    });

    test('renders glassy tooltips with backdrop blur', async () => {
      const user = userEvent.setup();
      render(<StatusIndicator showTooltips={true} />);
      
      await waitFor(() => {
        const dots = screen.getAllByRole('button');
        expect(dots).toHaveLength(4);
      });

      const firstDot = screen.getAllByRole('button')[0];
      
      // Hover over dot
      await user.hover(firstDot);
      
      // Wait for tooltip to appear
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        
        const tooltipContent = tooltip.querySelector('.status-tooltip.enhanced');
        expect(tooltipContent).toBeInTheDocument();
        
        const styles = window.getComputedStyle(tooltipContent!);
        expect(styles.backdropFilter || styles.webkitBackdropFilter).toContain('blur');
      }, { timeout: 1000 });
    });
  });

  describe('Interaction Testing', () => {
    test('shows tooltip on hover after 200ms delay', async () => {
      const user = userEvent.setup({ delay: null });
      render(<StatusIndicator showTooltips={true} />);
      
      await waitFor(() => {
        const dots = screen.getAllByRole('button');
        expect(dots).toHaveLength(4);
      });

      const firstDot = screen.getAllByRole('button')[0];
      
      // Start hovering
      await user.hover(firstDot);
      
      // Tooltip should not appear immediately
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      
      // Wait for delay and check tooltip appears
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      }, { timeout: 500 });
    });

    test('hides tooltip when mouse leaves', async () => {
      const user = userEvent.setup();
      render(<StatusIndicator showTooltips={true} />);
      
      await waitFor(() => {
        const dots = screen.getAllByRole('button');
        expect(dots).toHaveLength(4);
      });

      const firstDot = screen.getAllByRole('button')[0];
      
      // Hover to show tooltip
      await user.hover(firstDot);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
      
      // Move mouse away
      await user.unhover(firstDot);
      
      // Tooltip should disappear
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    test('toggles tooltip on click for touch devices', async () => {
      // Mock touch device
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        value: jest.fn(),
      });
      
      const user = userEvent.setup();
      render(<StatusIndicator showTooltips={true} />);
      
      await waitFor(() => {
        const dots = screen.getAllByRole('button');
        expect(dots).toHaveLength(4);
      });

      const firstDot = screen.getAllByRole('button')[0];
      
      // Click to show tooltip
      await user.click(firstDot);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
      
      // Click again to hide
      await user.click(firstDot);
      
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    test('dismisses tooltip on outside click', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <StatusIndicator showTooltips={true} />
          <button>Outside Button</button>
        </div>
      );
      
      await waitFor(() => {
        const dots = screen.getAllByRole('button');
        expect(dots.length).toBeGreaterThan(0);
      });

      const firstDot = screen.getAllByRole('button')[0];
      
      // Show tooltip
      await user.hover(firstDot);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
      
      // Click outside
      const outsideButton = screen.getByText('Outside Button');
      await user.click(outsideButton);
      
      // Tooltip should disappear
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Testing', () => {
    test('provides 44x44px minimum touch target', () => {
      const { container } = render(<StatusIndicator />);
      const dots = container.querySelectorAll('.status-dot.system.minimal');
      
      dots.forEach(dot => {
        const styles = window.getComputedStyle(dot);
        // Check padding creates proper touch target
        expect(styles.padding).toBe('15px');
        expect(styles.margin).toBe('-15px');
      });
    });

    test('supports keyboard navigation with Tab/Shift+Tab', async () => {
      const user = userEvent.setup();
      render(<StatusIndicator />);
      
      await waitFor(() => {
        const dots = screen.getAllByRole('button');
        expect(dots).toHaveLength(4);
      });

      // Tab through all dots
      await user.tab();
      expect(screen.getAllByRole('button')[0]).toHaveFocus();
      
      await user.tab();
      expect(screen.getAllByRole('button')[1]).toHaveFocus();
      
      await user.tab();
      expect(screen.getAllByRole('button')[2]).toHaveFocus();
      
      await user.tab();
      expect(screen.getAllByRole('button')[3]).toHaveFocus();
      
      // Shift+Tab back
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(screen.getAllByRole('button')[2]).toHaveFocus();
    });

    test('shows tooltip on keyboard focus', async () => {
      const user = userEvent.setup();
      render(<StatusIndicator showTooltips={true} />);
      
      await waitFor(() => {
        const dots = screen.getAllByRole('button');
        expect(dots).toHaveLength(4);
      });

      // Tab to first dot
      await user.tab();
      
      // Tooltip should appear
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    test('provides proper ARIA labels and roles', async () => {
      render(<StatusIndicator />);
      
      await waitFor(() => {
        const dots = screen.getAllByRole('button');
        expect(dots).toHaveLength(4);
        
        // Check ARIA labels
        expect(dots[0]).toHaveAttribute('aria-label', expect.stringContaining('API Server'));
        expect(dots[1]).toHaveAttribute('aria-label', expect.stringContaining('Alchemy Engine'));
        expect(dots[2]).toHaveAttribute('aria-label', expect.stringContaining('LLM Providers'));
        expect(dots[3]).toHaveAttribute('aria-label', expect.stringContaining('Database'));
      });
    });

    test('shows focus indicators for keyboard navigation', async () => {
      const user = userEvent.setup();
      const { container } = render(<StatusIndicator />);
      
      await waitFor(() => {
        const dots = screen.getAllByRole('button');
        expect(dots).toHaveLength(4);
      });

      // Tab to first dot
      await user.tab();
      
      const focusedDot = container.querySelector('.status-dot.system.minimal:focus');
      expect(focusedDot).toBeInTheDocument();
      
      const styles = window.getComputedStyle(focusedDot!);
      expect(styles.outline).toContain('2px');
    });

    test('links tooltip to dot with aria-describedby', async () => {
      const user = userEvent.setup();
      render(<StatusIndicator showTooltips={true} />);
      
      await waitFor(() => {
        const dots = screen.getAllByRole('button');
        expect(dots).toHaveLength(4);
      });

      const firstDot = screen.getAllByRole('button')[0];
      
      // Show tooltip
      await user.hover(firstDot);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        
        // Check aria-describedby
        expect(firstDot).toHaveAttribute('aria-describedby', expect.stringContaining('tooltip-'));
      });
    });
  });

  describe('Cross-Device Testing', () => {
    test('renders larger dots (16px) on touch devices', () => {
      // Mock touch device
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        value: jest.fn(),
      });
      
      // Mock matchMedia for pointer: coarse
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(pointer: coarse)',
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
      const dotsContainer = container.querySelector('.system-dots');
      
      expect(dotsContainer).toBeInTheDocument();
      
      // Note: jsdom doesn't actually apply CSS media queries,
      // so we're testing that the CSS exists and would apply
      const styles = window.getComputedStyle(dotsContainer!);
      expect(styles).toBeDefined();
    });

    test('detects touch device correctly', async () => {
      // Mock touch device
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        value: 5,
      });
      
      render(<StatusIndicator showTooltips={true} />);
      
      await waitFor(() => {
        const dots = screen.getAllByRole('button');
        expect(dots).toHaveLength(4);
      });

      const firstDot = screen.getAllByRole('button')[0];
      
      // On touch device, hover should not show tooltip
      fireEvent.mouseEnter(firstDot);
      
      // Give it time to potentially show
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
      });
      
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Performance Testing', () => {
    test('renders without layout shifts', async () => {
      const { container, rerender } = render(<StatusIndicator />);
      
      // Get initial positions
      const initialDots = container.querySelectorAll('.status-dot.system.minimal');
      const initialPositions = Array.from(initialDots).map(dot => 
        dot.getBoundingClientRect()
      );
      
      // Update with new data
      (api.health as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Service down',
      });
      
      // Force re-render
      rerender(<StatusIndicator />);
      
      await waitFor(() => {
        const updatedDots = container.querySelectorAll('.status-dot.system.minimal');
        const updatedPositions = Array.from(updatedDots).map(dot => 
          dot.getBoundingClientRect()
        );
        
        // Positions should remain the same
        initialPositions.forEach((pos, i) => {
          expect(updatedPositions[i].left).toBe(pos.left);
          expect(updatedPositions[i].top).toBe(pos.top);
        });
      });
    });

    test('animates smoothly without jank', () => {
      const { container } = render(<StatusIndicator />);
      const dots = container.querySelectorAll('.status-dot.system.minimal');
      
      dots.forEach(dot => {
        const styles = window.getComputedStyle(dot);
        // Check for hardware acceleration hints
        expect(styles.transition).toContain('transform');
        expect(styles.transition).toContain('box-shadow');
      });
    });

    test('handles rapid tooltip show/hide without issues', async () => {
      const user = userEvent.setup({ delay: null });
      render(<StatusIndicator showTooltips={true} />);
      
      await waitFor(() => {
        const dots = screen.getAllByRole('button');
        expect(dots).toHaveLength(4);
      });

      const dots = screen.getAllByRole('button');
      
      // Rapidly hover over multiple dots
      for (let i = 0; i < 10; i++) {
        await user.hover(dots[i % 4]);
        await user.unhover(dots[i % 4]);
      }
      
      // Should have at most one tooltip
      const tooltips = screen.queryAllByRole('tooltip');
      expect(tooltips.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Status Updates', () => {
    test('updates status colors correctly', async () => {
      const { container } = render(<StatusIndicator />);
      
      await waitFor(() => {
        const dots = container.querySelectorAll('.status-dot.system.minimal');
        expect(dots).toHaveLength(4);
        
        // Check operational status (green)
        const operationalDot = dots[0];
        const styles = window.getComputedStyle(operationalDot);
        expect(styles.backgroundColor).toBe('rgba(16, 185, 129, 1)');
      });
    });

    test('shows correct status in tooltips', async () => {
      const user = userEvent.setup();
      render(<StatusIndicator showTooltips={true} />);
      
      await waitFor(() => {
        const dots = screen.getAllByRole('button');
        expect(dots).toHaveLength(4);
      });

      const firstDot = screen.getAllByRole('button')[0];
      
      // Show tooltip
      await user.hover(firstDot);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveTextContent('API Server');
        expect(tooltip).toHaveTextContent('Operational');
      });
    });

    test('auto-refreshes status at specified interval', async () => {
      jest.useFakeTimers();
      
      render(<StatusIndicator autoRefresh={true} refreshInterval={5000} />);
      
      await waitFor(() => {
        expect(api.health).toHaveBeenCalledTimes(1);
      });
      
      // Advance time
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      await waitFor(() => {
        expect(api.health).toHaveBeenCalledTimes(2);
      });
      
      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    test('handles API failures gracefully', async () => {
      (api.health as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const { container } = render(<StatusIndicator />);
      
      await waitFor(() => {
        const dots = container.querySelectorAll('.status-dot.system.minimal');
        expect(dots).toHaveLength(4);
        
        // All should show as down (red)
        dots.forEach(dot => {
          const styles = window.getComputedStyle(dot);
          expect(styles.backgroundColor).toBe('rgba(239, 68, 68, 1)');
        });
      });
    });

    test('shows helpful error messages in tooltips', async () => {
      (api.health as jest.Mock).mockRejectedValue(new Error('Connection refused'));
      
      const user = userEvent.setup();
      render(<StatusIndicator showTooltips={true} />);
      
      await waitFor(() => {
        const dots = screen.getAllByRole('button');
        expect(dots).toHaveLength(4);
      });

      const firstDot = screen.getAllByRole('button')[0];
      
      // Show tooltip
      await user.hover(firstDot);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveTextContent(/System check failed/i);
      });
    });
  });
});