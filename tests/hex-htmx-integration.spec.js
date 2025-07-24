// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Hex Flow Board - HTMX Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window.htmx !== undefined);
    await page.waitForFunction(() => window.hexFlowBoard !== undefined);
  });

  test('should make HTMX requests to flow status endpoint', async ({ page }) => {
    let flowStatusRequested = false;
    
    // Intercept flow status requests
    await page.route('**/api/flow-status', async route => {
      flowStatusRequested = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ready' })
      });
    });
    
    // Wait for initial load trigger
    await page.waitForTimeout(2000);
    
    expect(flowStatusRequested).toBe(true);
  });

  test('should handle node-specific API endpoints', async ({ page }) => {
    let nodeDetailRequested = false;
    
    // Mock node detail endpoint
    await page.route('**/api/node/input', async route => {
      nodeDetailRequested = true;
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="node-info">Input Gateway Active</div>'
      });
    });
    
    // Click on input node to trigger HTMX request
    const inputNode = page.locator('[data-id="input"]');
    await inputNode.click();
    
    // Wait for request
    await page.waitForTimeout(1000);
    
    expect(nodeDetailRequested).toBe(true);
  });

  test('should handle phase activation API calls', async ({ page }) => {
    let phaseActivated = false;
    let activatedPhase = '';
    
    await page.route('**/api/phase/prima', async route => {
      phaseActivated = true;
      activatedPhase = 'prima';
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div>Prima Materia phase activated</div>'
      });
    });
    
    // Click on prima materia node
    await page.locator('[data-id="prima"]').click();
    await page.waitForTimeout(1000);
    
    expect(phaseActivated).toBe(true);
    expect(activatedPhase).toBe('prima');
  });

  test('should handle core status endpoint with mouseenter trigger', async ({ page }) => {
    let coreStatusRequested = false;
    
    await page.route('**/api/core-status', async route => {
      coreStatusRequested = true;
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div>Core processing at 85% capacity</div>'
      });
    });
    
    // Hover over hub/core node to trigger mouseenter
    await page.locator('[data-id="hub"]').hover();
    await page.waitForTimeout(1000);
    
    expect(coreStatusRequested).toBe(true);
  });

  test('should handle zoom API integration', async ({ page }) => {
    let zoomRequested = false;
    let zoomAction = '';
    
    await page.route('**/api/zoom', async route => {
      const postData = route.request().postDataJSON();
      zoomRequested = true;
      zoomAction = postData.action;
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, zoomLevel: 1.2 })
      });
    });
    
    // Click zoom in button
    const zoomInBtn = page.locator('#zoom-in');
    if (await zoomInBtn.isVisible()) {
      await zoomInBtn.click();
      await page.waitForTimeout(1000);
      
      expect(zoomRequested).toBe(true);
      expect(zoomAction).toBe('in');
    }
  });

  test('should handle viewport API updates', async ({ page }) => {
    let viewportUpdated = false;
    let viewportData = null;
    
    await page.route('**/api/viewport', async route => {
      viewportUpdated = true;
      viewportData = route.request().postDataJSON();
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    // Simulate drag to trigger viewport update
    const container = page.locator('#hex-flow-container');
    await container.hover({ position: { x: 500, y: 350 } });
    await page.mouse.down();
    await page.mouse.move(600, 450);
    await page.mouse.up();
    
    // Wait for viewport API call
    await page.waitForTimeout(1000);
    
    expect(viewportUpdated).toBe(true);
    expect(viewportData).toBeTruthy();
    expect(viewportData).toHaveProperty('x');
    expect(viewportData).toHaveProperty('y');
  });

  test('should handle system status polling', async ({ page }) => {
    let statusPolled = false;
    
    await page.route('**/api/system-status', async route => {
      statusPolled = true;
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <div class="status-indicator">
            <span class="status-dot active"></span>
            <span class="status-text">System Active - 3 nodes processing</span>
          </div>
        `
      });
    });
    
    // Wait for polling to occur
    await page.waitForTimeout(3000);
    
    expect(statusPolled).toBe(true);
    
    // Check that status was updated
    const statusText = await page.locator('.status-text').textContent();
    expect(statusText).toContain('System Active');
  });

  test('should handle connection status updates', async ({ page }) => {
    let connectionStatusRequested = false;
    
    await page.route('**/api/connection-status', async route => {
      connectionStatusRequested = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          connections: [
            { id: 'input-prima', active: true, flow: 0.8 },
            { id: 'prima-hub', active: false, flow: 0.0 }
          ]
        })
      });
    });
    
    // Wait for connection polling
    await page.waitForTimeout(4000);
    
    expect(connectionStatusRequested).toBe(true);
  });

  test('should handle node status batch updates', async ({ page }) => {
    let nodeStatusRequested = false;
    
    await page.route('**/api/nodes-status', async route => {
      nodeStatusRequested = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'input', active: false, processing: false, complete: true },
          { id: 'prima', active: true, processing: true, complete: false },
          { id: 'hub', active: false, processing: false, complete: false }
        ])
      });
    });
    
    // Wait for node status polling
    await page.waitForTimeout(3000);
    
    expect(nodeStatusRequested).toBe(true);
  });

  test('should handle flow info panel updates', async ({ page }) => {
    let flowInfoRequested = false;
    
    await page.route('**/api/flow-info', async route => {
      flowInfoRequested = true;
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <h3>Transmutation Flow</h3>
          <div class="flow-stage active">
            <div class="stage-indicator prima active"></div>
            <span>Prima Materia - Extract Essence</span>
          </div>
          <div class="flow-stage">
            <div class="stage-indicator solutio"></div>
            <span>Solutio - Natural Flow</span>
          </div>
        `
      });
    });
    
    // Wait for flow info update
    await page.waitForTimeout(2000);
    
    expect(flowInfoRequested).toBe(true);
  });

  test('should handle node activation POST requests', async ({ page }) => {
    let nodeActivated = false;
    let activationData = null;
    
    await page.route('**/api/node/activate', async route => {
      nodeActivated = true;
      activationData = route.request().postDataJSON();
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    // Click on a node to trigger activation
    await page.locator('[data-id="prima"]').click();
    await page.waitForTimeout(1000);
    
    expect(nodeActivated).toBe(true);
    expect(activationData).toBeTruthy();
    expect(activationData).toHaveProperty('nodeId', 'prima');
    expect(activationData).toHaveProperty('timestamp');
  });

  test('should handle feature toggle API calls', async ({ page }) => {
    let featureToggled = false;
    
    await page.route('**/api/toggle-features', async route => {
      featureToggled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    // Find and click feature toggle checkbox
    const featureToggle = page.locator('input[type="checkbox"]').filter({ 
      hasText: /Show Advanced Features|Advanced Features/i
    }).first();
    
    if (await featureToggle.isVisible()) {
      await featureToggle.check();
      await page.waitForTimeout(1000);
      
      expect(featureToggled).toBe(true);
    }
  });

  test('should handle HTMX error responses gracefully', async ({ page }) => {
    // Mock server error
    await page.route('**/api/flow-status', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // System should still function despite error
    await page.waitForTimeout(2000);
    await expect(page.locator('#hex-flow-board')).toBeVisible();
    
    // User interactions should still work
    await page.locator('[data-id="input"]').click();
    await expect(page.locator('[data-id="input"]')).toHaveClass(/active/);
  });

  test('should include correct HTMX headers and parameters', async ({ page }) => {
    let requestHeaders = null;
    let requestParams = null;
    
    await page.route('**/api/node/input', async route => {
      requestHeaders = route.request().headers();
      requestParams = route.request().url();
      
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div>Node details</div>'
      });
    });
    
    // Click node to trigger request
    await page.locator('[data-id="input"]').click();
    await page.waitForTimeout(1000);
    
    expect(requestHeaders).toBeTruthy();
    expect(requestHeaders['hx-request']).toBe('true');
    expect(requestParams).toContain('/api/node/input');
  });

  test('should handle SSE (Server-Sent Events) for real-time updates', async ({ page }) => {
    // Mock SSE endpoint
    await page.route('**/api/flow-events', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"type": "flow-update", "nodeId": "prima", "active": true}\n\n'
      });
    });
    
    // Check if SSE connection would be established
    // (Full SSE testing requires more complex setup)
    const container = page.locator('#hex-flow-container');
    const sseConnect = await container.getAttribute('sse-connect');
    
    expect(sseConnect).toBe('/api/flow-events');
  });
});