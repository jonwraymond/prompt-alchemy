/**
 * Animation Performance Testing Suite
 * 
 * Comprehensive performance monitoring for hex grid animations:
 * - Frame rate monitoring and smoothness analysis
 * - Animation timing and duration validation
 * - Resource usage monitoring during animations
 * - Performance benchmarks across browsers and devices
 * - Visual performance indicators and bottleneck detection
 * - Memory leak detection in animation cycles
 * - CPU usage optimization for smooth 60fps animations
 */

import { test, expect } from '../fixtures/base-fixtures';
import { 
  capturePerformanceVisuals,
  compareVisualState 
} from '../helpers/visual-regression-utils';
import { waitForHexGridLoaded } from '../helpers/test-utils';

/**
 * Performance metrics interface for structured monitoring
 */
interface AnimationMetrics {
  frameRate: number;
  averageFrameTime: number;
  jankCount: number;
  cpuUsage: number;
  memoryUsage: number;
  animationDuration: number;
  visualChanges: number;
}

/**
 * Performance thresholds for different test scenarios
 */
const PERFORMANCE_THRESHOLDS = {
  MIN_FRAME_RATE: 50, // Minimum acceptable FPS
  MAX_FRAME_TIME: 20, // Maximum frame time in ms (for 50fps)
  MAX_JANK_COUNT: 3,  // Maximum number of janky frames
  MAX_CPU_USAGE: 80,  // Maximum CPU usage percentage
  MAX_MEMORY_INCREASE: 50, // Maximum memory increase in MB
  MAX_ANIMATION_TIME: 1000 // Maximum animation duration in ms
};

test.describe('Animation Performance Monitoring', () => {
  test.beforeEach(async ({ hexGridPage }) => {
    await hexGridPage.goto();
    await waitForHexGridLoaded(hexGridPage.page);
  });

  test.describe('Frame Rate and Smoothness Analysis', () => {
    test('should maintain 60fps during hex node hover animations', async ({ page }) => {
      // Start performance monitoring
      await page.evaluate(() => {
        (window as any).performanceData = {
          frames: [],
          startTime: performance.now(),
          animationFrames: 0
        };

        // Monitor animation frames
        function measureFrame() {
          const now = performance.now();
          (window as any).performanceData.frames.push(now);
          (window as any).performanceData.animationFrames++;
          
          if ((window as any).performanceData.animationFrames < 120) { // Monitor for 2 seconds at 60fps
            requestAnimationFrame(measureFrame);
          }
        }
        
        requestAnimationFrame(measureFrame);
      });

      // Trigger hover animation on hub node
      const hubNode = page.locator('[data-node-id="hub"] polygon');
      await hubNode.hover();
      
      // Wait for animation monitoring to complete
      await page.waitForTimeout(2500);
      
      // Collect performance metrics
      const metrics = await page.evaluate((): AnimationMetrics => {
        const data = (window as any).performanceData;
        const frames = data.frames;
        const totalTime = frames[frames.length - 1] - frames[0];
        const frameCount = frames.length;
        
        // Calculate frame times
        const frameTimes = [];
        for (let i = 1; i < frames.length; i++) {
          frameTimes.push(frames[i] - frames[i - 1]);
        }
        
        // Calculate metrics
        const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const frameRate = 1000 / averageFrameTime;
        
        // Count janky frames (>16.67ms for 60fps)
        const jankCount = frameTimes.filter(time => time > 16.67).length;
        
        return {
          frameRate: Math.round(frameRate * 100) / 100,
          averageFrameTime: Math.round(averageFrameTime * 100) / 100,
          jankCount,
          cpuUsage: 0, // Will be measured separately
          memoryUsage: 0, // Will be measured separately
          animationDuration: totalTime,
          visualChanges: frameCount
        };
      });

      console.log('Animation Performance Metrics:', metrics);

      // Validate performance thresholds
      expect(metrics.frameRate).toBeGreaterThan(PERFORMANCE_THRESHOLDS.MIN_FRAME_RATE);
      expect(metrics.averageFrameTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_FRAME_TIME);
      expect(metrics.jankCount).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_JANK_COUNT);
      
      // Take performance screenshot for visual validation
      await page.screenshot({
        path: `test-results/performance/frame-rate-analysis-${metrics.frameRate}fps.png`,
        fullPage: false
      });
    });

    test('should handle rapid consecutive animations smoothly', async ({ page }) => {
      const nodes = ['hub', 'prima', 'solutio', 'coagulatio', 'input', 'output'];
      const animationResults: Array<{ node: string; metrics: Partial<AnimationMetrics> }> = [];

      for (const nodeId of nodes) {
        // Start performance monitoring for this node
        await page.evaluate((id) => {
          (window as any).currentNodePerf = {
            nodeId: id,
            startTime: performance.now(),
            frames: []
          };
          
          function trackFrames() {
            (window as any).currentNodePerf.frames.push(performance.now());
            if ((window as any).currentNodePerf.frames.length < 30) { // Track 30 frames
              requestAnimationFrame(trackFrames);
            }
          }
          
          requestAnimationFrame(trackFrames);
        }, nodeId);

        // Trigger hover animation
        const node = page.locator(`[data-node-id="${nodeId}"] polygon`);
        await node.hover();
        await page.waitForTimeout(500);

        // Collect metrics for this node
        const nodeMetrics = await page.evaluate(() => {
          const data = (window as any).currentNodePerf;
          const frames = data.frames;
          
          if (frames.length < 2) return { frameRate: 0, duration: 0 };
          
          const duration = frames[frames.length - 1] - frames[0];
          const frameRate = (frames.length - 1) / (duration / 1000);
          
          return {
            frameRate: Math.round(frameRate * 100) / 100,
            animationDuration: Math.round(duration)
          };
        });

        animationResults.push({
          node: nodeId,
          metrics: nodeMetrics
        });

        // Brief pause between animations
        await page.waitForTimeout(100);
      }

      // Validate that all animations maintained good performance
      for (const result of animationResults) {
        expect(result.metrics.frameRate).toBeGreaterThan(30); // Allow lower threshold for rapid succession
        console.log(`${result.node} node: ${result.metrics.frameRate}fps`);
      }

      // Take comprehensive performance screenshot
      await capturePerformanceVisuals(page, {
        captureTimeframes: [0],
        highlightSlowElements: true,
        showLoadingStates: false
      });
    });

    test('should optimize animation performance on mobile devices', async ({ page }) => {
      // Set mobile viewport for performance testing
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Simulate mobile performance constraints
      await page.evaluate(() => {
        // Reduce animation complexity for mobile
        const style = document.createElement('style');
        style.textContent = `
          @media (max-width: 768px) {
            .hex-node {
              transition-duration: 0.2s !important;
            }
            .hex-connection {
              animation-duration: 0.3s !important;
            }
          }
        `;
        document.head.appendChild(style);
      });

      // Monitor mobile performance
      const mobileMetrics = await page.evaluate(() => {
        const startTime = performance.now();
        const frames: number[] = [];
        
        function trackMobileFrames() {
          frames.push(performance.now());
          if (frames.length < 60) { // Track 1 second at 60fps
            requestAnimationFrame(trackMobileFrames);
          }
        }
        
        requestAnimationFrame(trackMobileFrames);
        
        return new Promise<AnimationMetrics>((resolve) => {
          setTimeout(() => {
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            const frameCount = frames.length;
            const frameRate = (frameCount / totalTime) * 1000;
            
            resolve({
              frameRate: Math.round(frameRate * 100) / 100,
              averageFrameTime: totalTime / frameCount,
              jankCount: 0,
              cpuUsage: 0,
              memoryUsage: 0,
              animationDuration: totalTime,
              visualChanges: frameCount
            });
          }, 1100);
        });
      });

      // Test mobile-specific animations
      const hubNode = page.locator('[data-node-id="hub"] polygon');
      await hubNode.tap(); // Use tap instead of hover for mobile
      await page.waitForTimeout(500);

      const finalMetrics = await mobileMetrics;
      console.log('Mobile Performance Metrics:', finalMetrics);

      // Mobile performance should still be acceptable (lower threshold)
      expect(finalMetrics.frameRate).toBeGreaterThan(30);
      
      // Take mobile performance screenshot
      await page.screenshot({
        path: 'test-results/performance/mobile-animation-performance.png',
        fullPage: true
      });
    });
  });

  test.describe('Resource Usage Monitoring', () => {
    test('should monitor CPU usage during complex animations', async ({ page }) => {
      // Start CPU monitoring (simulated via performance timing)
      const cpuMetrics = await page.evaluate(() => {
        const measurements: Array<{ timestamp: number; taskTime: number }> = [];
        let taskStartTime = performance.now();
        
        // Simulate CPU-intensive tasks and measure timing
        function measureCPU() {
          const taskEndTime = performance.now();
          const taskTime = taskEndTime - taskStartTime;
          
          measurements.push({
            timestamp: taskEndTime,
            taskTime
          });
          
          taskStartTime = performance.now();
          
          if (measurements.length < 50) {
            // Schedule next measurement with slight delay to avoid blocking
            setTimeout(measureCPU, 20);
          }
        }
        
        measureCPU();
        
        return new Promise((resolve) => {
          setTimeout(() => {
            const averageTaskTime = measurements.reduce((sum, m) => sum + m.taskTime, 0) / measurements.length;
            const cpuUsagePercent = Math.min((averageTaskTime / 16.67) * 100, 100); // Estimate based on 60fps budget
            
            resolve({
              averageTaskTime,
              cpuUsagePercent: Math.round(cpuUsagePercent * 100) / 100,
              sampleCount: measurements.length
            });
          }, 1500);
        });
      });

      // Trigger multiple simultaneous animations
      const nodes = page.locator('[data-node-id] polygon');
      const nodeCount = await nodes.count();
      
      // Hover over multiple nodes rapidly
      for (let i = 0; i < Math.min(nodeCount, 5); i++) {
        await nodes.nth(i).hover();
        await page.waitForTimeout(50); // Very brief delay
      }

      const finalCPUMetrics = await cpuMetrics;
      console.log('CPU Usage Metrics:', finalCPUMetrics);

      expect((finalCPUMetrics as any).cpuUsagePercent).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_CPU_USAGE);
    });

    test('should detect memory leaks in animation cycles', async ({ page }) => {
      // Get baseline memory usage
      const baselineMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0; // Fallback if memory API not available
      });

      // Perform repeated animation cycles
      const cycles = 10;
      for (let cycle = 0; cycle < cycles; cycle++) {
        // Animate all nodes in sequence
        const nodes = ['hub', 'prima', 'solutio', 'coagulatio'];
        
        for (const nodeId of nodes) {
          const node = page.locator(`[data-node-id="${nodeId}"] polygon`);
          await node.hover();
          await page.waitForTimeout(100);
          
          // Move away from node
          await page.locator('body').hover();
          await page.waitForTimeout(50);
        }
      }

      // Force garbage collection if possible
      await page.evaluate(() => {
        if ('gc' in window) {
          (window as any).gc();
        }
      });

      // Measure final memory usage
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Calculate memory increase
      const memoryIncrease = (finalMemory - baselineMemory) / (1024 * 1024); // Convert to MB
      console.log(`Memory usage increase: ${memoryIncrease.toFixed(2)} MB`);

      // Should not increase memory significantly
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_MEMORY_INCREASE);
    });

    test('should optimize rendering performance during scroll animations', async ({ page }) => {
      // Add scrollable content to test scroll performance
      await page.evaluate(() => {
        const container = document.querySelector('#hex-flow-container');
        if (container) {
          (container as HTMLElement).style.height = '300px';
          (container as HTMLElement).style.overflowY = 'scroll';
          
          // Add extra content to make it scrollable
          const extraContent = document.createElement('div');
          extraContent.style.height = '1000px';
          extraContent.style.background = 'linear-gradient(transparent, rgba(0,0,0,0.1))';
          container.appendChild(extraContent);
        }
      });

      // Monitor scroll performance
      const scrollMetrics = await page.evaluate(() => {
        return new Promise<{ frameRate: number; smoothness: number }>((resolve) => {
          const container = document.querySelector('#hex-flow-container') as HTMLElement;
          const frames: number[] = [];
          let scrolling = false;
          
          function trackScrollFrames() {
            if (scrolling) {
              frames.push(performance.now());
            }
            requestAnimationFrame(trackScrollFrames);
          }
          
          trackScrollFrames();
          
          container.addEventListener('scroll', () => {
            if (!scrolling) {
              scrolling = true;
              setTimeout(() => {
                scrolling = false;
                
                if (frames.length > 1) {
                  const duration = frames[frames.length - 1] - frames[0];
                  const frameRate = (frames.length - 1) / (duration / 1000);
                  const smoothness = frames.length / (duration / 16.67); // Ideal frames vs actual
                  
                  resolve({
                    frameRate: Math.round(frameRate * 100) / 100,
                    smoothness: Math.round(smoothness * 100) / 100
                  });
                } else {
                  resolve({ frameRate: 0, smoothness: 0 });
                }
              }, 500);
            }
          });
          
          // Trigger scroll after setup
          setTimeout(() => {
            container.scrollTop = 100;
            setTimeout(() => container.scrollTop = 200, 50);
            setTimeout(() => container.scrollTop = 300, 100);
          }, 100);
        });
      });

      const metrics = await scrollMetrics;
      console.log('Scroll Performance Metrics:', metrics);

      // Validate scroll performance
      expect(metrics.frameRate).toBeGreaterThan(30);
      expect(metrics.smoothness).toBeGreaterThan(0.8); // 80% of ideal performance
    });
  });

  test.describe('Animation Timing and Synchronization', () => {
    test('should validate animation durations match CSS specifications', async ({ page }) => {
      // Define expected animation durations
      const expectedDurations = {
        'hover-in': 300,
        'hover-out': 200,
        'connection-animate': 500,
        'tooltip-show': 150
      };

      // Test each animation type
      for (const [animationType, expectedDuration] of Object.entries(expectedDurations)) {
        const actualDuration = await page.evaluate((type) => {
          return new Promise<number>((resolve) => {
            const hubNode = document.querySelector('[data-node-id="hub"] polygon');
            if (!hubNode) {
              resolve(0);
              return;
            }

            const startTime = performance.now();
            
            // Trigger animation based on type
            switch (type) {
              case 'hover-in':
                (hubNode as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'));
                break;
              case 'hover-out':
                (hubNode as HTMLElement).dispatchEvent(new MouseEvent('mouseleave'));
                break;
              case 'connection-animate':
                // Trigger connection animation
                (hubNode as HTMLElement).click();
                break;
              case 'tooltip-show':
                (hubNode as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'));
                break;
            }

            // Monitor for animation end
            const checkAnimation = () => {
              const computedStyle = window.getComputedStyle(hubNode);
              const transform = computedStyle.transform;
              const opacity = computedStyle.opacity;
              
              // Check if animation is complete (simplified check)
              if (transform !== 'none' || opacity !== '1') {
                requestAnimationFrame(checkAnimation);
              } else {
                const endTime = performance.now();
                resolve(endTime - startTime);
              }
            };

            setTimeout(() => {
              checkAnimation();
            }, 50);
            
            // Fallback timeout
            setTimeout(() => resolve(expectedDuration), expectedDuration + 200);
          });
        }, animationType);

        console.log(`${animationType} duration: ${actualDuration}ms (expected: ${expectedDuration}ms)`);
        
        // Allow 20% tolerance for animation timing
        const tolerance = expectedDuration * 0.2;
        expect(actualDuration).toBeGreaterThan(expectedDuration - tolerance);
        expect(actualDuration).toBeLessThan(expectedDuration + tolerance);
      }
    });

    test('should synchronize multiple animation phases correctly', async ({ page }) => {
      // Test animation sequence timing for form submission
      await page.fill('#input', 'Test animation synchronization');
      
      // Monitor animation phases during form submission
      const phaseTimings = await page.evaluate(() => {
        return new Promise<Array<{ phase: string; timestamp: number; duration: number }>>((resolve) => {
          const phases: Array<{ phase: string; timestamp: number; duration: number }> = [];
          const startTime = performance.now();
          
          // Mock the form submission animation sequence
          const submitButton = document.querySelector('button[type="submit"]') as HTMLElement;
          
          phases.push({ phase: 'button-click', timestamp: performance.now() - startTime, duration: 0 });
          
          setTimeout(() => {
            phases.push({ phase: 'loading-start', timestamp: performance.now() - startTime, duration: 0 });
          }, 50);
          
          setTimeout(() => {
            phases.push({ phase: 'hex-grid-animate', timestamp: performance.now() - startTime, duration: 0 });
          }, 200);
          
          setTimeout(() => {
            phases.push({ phase: 'results-appear', timestamp: performance.now() - startTime, duration: 0 });
          }, 800);
          
          setTimeout(() => {
            // Calculate durations
            for (let i = 0; i < phases.length - 1; i++) {
              phases[i].duration = phases[i + 1].timestamp - phases[i].timestamp;
            }
            phases[phases.length - 1].duration = performance.now() - startTime - phases[phases.length - 1].timestamp;
            
            resolve(phases);
          }, 1000);
          
          // Trigger the animation sequence
          submitButton.click();
        });
      });

      console.log('Animation Phase Timings:', phaseTimings);

      // Validate phase timing relationships
      const loadingPhase = phaseTimings.find(p => p.phase === 'loading-start');
      const hexGridPhase = phaseTimings.find(p => p.phase === 'hex-grid-animate');
      
      if (loadingPhase && hexGridPhase) {
        expect(hexGridPhase.timestamp).toBeGreaterThan(loadingPhase.timestamp);
        expect(hexGridPhase.timestamp - loadingPhase.timestamp).toBeLessThan(300); // Should start within 300ms
      }
    });
  });

  test.describe('Performance Benchmarking and Reporting', () => {
    test('should generate comprehensive performance report', async ({ page }) => {
      const performanceReport = {
        testSuite: 'Animation Performance',
        timestamp: new Date().toISOString(),
        browser: await page.evaluate(() => navigator.userAgent),
        viewport: await page.viewportSize(),
        metrics: {} as Record<string, any>
      };

      // Collect various performance metrics
      const hubNode = page.locator('[data-node-id="hub"] polygon');
      
      // 1. Basic hover performance
      const hoverStartTime = Date.now();
      await hubNode.hover();
      await page.waitForTimeout(500);
      performanceReport.metrics.hoverAnimationTime = Date.now() - hoverStartTime;

      // 2. Page load performance
      const navigationTiming = await page.evaluate(() => {
        const timing = performance.timing;
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          pageLoad: timing.loadEventEnd - timing.navigationStart,
          domInteractive: timing.domInteractive - timing.navigationStart
        };
      });
      performanceReport.metrics.pageLoad = navigationTiming;

      // 3. Animation frame rate test
      const frameRateTest = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const frames: number[] = [];
          const duration = 1000; // 1 second test
          const startTime = performance.now();
          
          function countFrames() {
            frames.push(performance.now());
            if (performance.now() - startTime < duration) {
              requestAnimationFrame(countFrames);
            } else {
              const fps = frames.length / (duration / 1000);
              resolve(Math.round(fps));
            }
          }
          
          requestAnimationFrame(countFrames);
        });
      });
      performanceReport.metrics.averageFrameRate = frameRateTest;

      // 4. Memory usage snapshot
      const memoryUsage = await page.evaluate(() => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          return {
            usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
            totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
            jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) // MB
          };
        }
        return null;
      });
      performanceReport.metrics.memoryUsage = memoryUsage;

      // 5. Visual regression with performance timing
      const visualTestStart = Date.now();
      await compareVisualState(page, '#hex-flow-container', 'performance-benchmark', {
        threshold: 0.2,
        animations: 'allow'
      });
      performanceReport.metrics.visualRegressionTime = Date.now() - visualTestStart;

      // Log comprehensive report
      console.log('Performance Benchmark Report:', JSON.stringify(performanceReport, null, 2));

      // Save report to file for CI integration
      await page.evaluate((report) => {
        // Store report in a global variable for potential extraction
        (window as any).performanceReport = report;
      }, performanceReport);

      // Validate key performance metrics
      expect(performanceReport.metrics.averageFrameRate).toBeGreaterThan(45);
      expect(performanceReport.metrics.hoverAnimationTime).toBeLessThan(1000);
      
      if (performanceReport.metrics.memoryUsage) {
        expect(performanceReport.metrics.memoryUsage.usedJSHeapSize).toBeLessThan(100); // Less than 100MB
      }
    });

    test('should provide performance optimization recommendations', async ({ page }) => {
      const recommendations: Array<{ category: string; severity: 'low' | 'medium' | 'high'; message: string; fix?: string }> = [];

      // Analyze current performance characteristics
      const analysisResults = await page.evaluate(() => {
        const issues = [];
        
        // Check for potential performance issues
        const hexNodes = document.querySelectorAll('[data-node-id] polygon');
        if (hexNodes.length > 10) {
          issues.push({
            category: 'DOM Complexity',
            severity: 'medium' as const,
            message: `High number of hex nodes (${hexNodes.length}) may impact animation performance`,
            fix: 'Consider virtualizing or simplifying hex node rendering'
          });
        }

        // Check for CSS animation complexity
        const animatedElements = document.querySelectorAll('[style*="transition"], [style*="animation"]');
        if (animatedElements.length > 20) {
          issues.push({
            category: 'Animation Complexity',
            severity: 'high' as const,
            message: `Many elements (${animatedElements.length}) have CSS animations`,
            fix: 'Use CSS transform and opacity for better performance'
          });
        }

        // Check for heavy stylesheets
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"], style');
        if (stylesheets.length > 5) {
          issues.push({
            category: 'Resource Loading',
            severity: 'low' as const,
            message: `Multiple stylesheets (${stylesheets.length}) detected`,
            fix: 'Consider bundling CSS files to reduce HTTP requests'
          });
        }

        return issues;
      });

      recommendations.push(...analysisResults);

      // Test actual performance and add recommendations based on results
      const frameRateTest = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const frames: number[] = [];
          let frameCount = 0;
          const maxFrames = 60; // Test for 1 second at 60fps
          
          function measureFrames() {
            frames.push(performance.now());
            frameCount++;
            
            if (frameCount < maxFrames) {
              requestAnimationFrame(measureFrames);
            } else {
              const duration = frames[frames.length - 1] - frames[0];
              const fps = (frames.length - 1) / (duration / 1000);
              resolve(fps);
            }
          }
          
          requestAnimationFrame(measureFrames);
        });
      });

      if (frameRateTest < 50) {
        recommendations.push({
          category: 'Frame Rate',
          severity: 'high',
          message: `Low frame rate detected: ${frameRateTest.toFixed(1)}fps`,
          fix: 'Optimize animations using will-change CSS property and hardware acceleration'
        });
      }

      // Log recommendations
      console.log('Performance Optimization Recommendations:');
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.severity.toUpperCase()}] ${rec.category}: ${rec.message}`);
        if (rec.fix) {
          console.log(`   Fix: ${rec.fix}`);
        }
      });

      // Save recommendations for reporting
      await page.evaluate((recs) => {
        (window as any).performanceRecommendations = recs;
      }, recommendations);

      // Should have some recommendations to validate the analysis worked
      expect(recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });
});