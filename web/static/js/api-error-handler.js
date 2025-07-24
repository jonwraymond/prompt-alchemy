// Centralized API Error Handler and Client
(function() {
    'use strict';
    
    console.log('🔧 API Error Handler initializing...');
    
    // API Configuration - Fixed endpoints
    const API_CONFIG = {
        baseUrl: window.location.origin,
        endpoints: {
            generate: '/generate',        // Actual working endpoint
            status: '/',                  // Use root for status check
            health: '/'                   // Use root for health check
        },
        timeout: 30000,
        retryAttempts: 2,
        retryDelay: 1000
    };
    
    // Centralized error types
    const ERROR_TYPES = {
        NETWORK_ERROR: 'network_error',
        SERVER_ERROR: 'server_error',
        TIMEOUT: 'timeout',
        API_CREDITS: 'api_credits',
        VALIDATION: 'validation',
        NOT_FOUND: 'not_found'
    };
    
    // Enhanced logging
    function log(level, message, data = null) {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const prefix = `[${timestamp}] 🔧 API:`;
        
        switch(level) {
            case 'error':
                console.error(`${prefix} ❌ ${message}`, data || '');
                break;
            case 'warn':
                console.warn(`${prefix} ⚠️ ${message}`, data || '');
                break;
            case 'success':
                console.log(`${prefix} ✅ ${message}`, data || '');
                break;
            default:
                console.log(`${prefix} ${message}`, data || '');
        }
    }
    
    // Enhanced API Client
    class APIClient {
        constructor() {
            this.requestQueue = [];
            this.isOnline = navigator.onLine;
            this.setupNetworkMonitoring();
        }
        
        setupNetworkMonitoring() {
            window.addEventListener('online', () => {
                this.isOnline = true;
                log('success', 'Network connection restored');
            });
            
            window.addEventListener('offline', () => {
                this.isOnline = false;
                log('warn', 'Network connection lost');
            });
        }
        
        async makeRequest(endpoint, options = {}) {
            if (!this.isOnline) {
                throw new APIError(ERROR_TYPES.NETWORK_ERROR, 'No network connection');
            }
            
            const url = `${API_CONFIG.baseUrl}${endpoint}`;
            const requestOptions = {
                timeout: API_CONFIG.timeout,
                headers: {
                    'Accept': 'text/html,application/json',
                    ...options.headers
                },
                ...options
            };
            
            log('info', `Making request to ${endpoint}`, requestOptions);
            
            try {
                const response = await this.fetchWithTimeout(url, requestOptions);
                return await this.handleResponse(response, endpoint);
            } catch (error) {
                throw this.handleError(error, endpoint);
            }
        }
        
        async fetchWithTimeout(url, options) {
            const { timeout, ...fetchOptions } = options;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            try {
                const response = await fetch(url, {
                    ...fetchOptions,
                    signal: controller.signal
                });
                return response;
            } finally {
                clearTimeout(timeoutId);
            }
        }
        
        async handleResponse(response, endpoint) {
            log('info', `Response from ${endpoint}:`, {
                status: response.status,
                statusText: response.statusText,
                contentType: response.headers.get('content-type')
            });
            
            // Handle different response types
            const contentType = response.headers.get('content-type') || '';
            let responseData;
            
            if (contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }
            
            if (!response.ok) {
                throw new APIError(
                    this.categorizeError(response.status, responseData),
                    this.extractErrorMessage(responseData),
                    response.status,
                    responseData
                );
            }
            
            log('success', `Successful response from ${endpoint}`);
            return {
                status: response.status,
                data: responseData,
                headers: Object.fromEntries(response.headers.entries())
            };
        }
        
        categorizeError(status, responseData) {
            if (status >= 500) {
                // Check for specific API credit issues
                if (typeof responseData === 'string' && 
                    (responseData.includes('credit balance') || 
                     responseData.includes('anthropic') || 
                     responseData.includes('API call failed'))) {
                    return ERROR_TYPES.API_CREDITS;
                }
                return ERROR_TYPES.SERVER_ERROR;
            }
            
            if (status === 404) return ERROR_TYPES.NOT_FOUND;
            if (status >= 400) return ERROR_TYPES.VALIDATION;
            
            return ERROR_TYPES.SERVER_ERROR;
        }
        
        extractErrorMessage(responseData) {
            if (typeof responseData === 'string') {
                // Extract error from HTML error pages
                const errorMatch = responseData.match(/API error \(\d+\): ({[^}]+})/);
                if (errorMatch) {
                    try {
                        const errorObj = JSON.parse(errorMatch[1]);
                        return errorObj.error || 'Server error';
                    } catch (e) {
                        // Continue with string extraction
                    }
                }
                
                // Extract from HTML content
                if (responseData.includes('credit balance')) {
                    return 'Insufficient API credits. Please check your provider configuration.';
                }
                
                if (responseData.includes('Input is required')) {
                    return 'Input is required for generation.';
                }
                
                // Generic extraction
                const textMatch = responseData.match(/<div[^>]*>([^<]+(?:error|failed)[^<]*)<\/div>/i);
                if (textMatch) {
                    return textMatch[1].trim();
                }
                
                return responseData.length > 200 ? 'Server error occurred' : responseData;
            }
            
            if (responseData && typeof responseData === 'object') {
                return responseData.error || responseData.message || 'Unknown error';
            }
            
            return 'Unknown error occurred';
        }
        
        handleError(error, endpoint) {
            if (error instanceof APIError) {
                return error;
            }
            
            if (error.name === 'AbortError') {
                log('error', `Request timeout for ${endpoint}`);
                return new APIError(ERROR_TYPES.TIMEOUT, `Request to ${endpoint} timed out`);
            }
            
            if (error.message.includes('Failed to fetch')) {
                log('error', `Network error for ${endpoint}:`, error.message);
                return new APIError(ERROR_TYPES.NETWORK_ERROR, 'Network connection failed');
            }
            
            log('error', `Unexpected error for ${endpoint}:`, error);
            return new APIError(ERROR_TYPES.NETWORK_ERROR, error.message);
        }
        
        // Health check with fallback
        async checkHealth() {
            try {
                await this.makeRequest(API_CONFIG.endpoints.health, { method: 'GET' });
                return true;
            } catch (error) {
                log('warn', 'Health check failed, but server may still be working:', error.message);
                return false; // Don't fail completely, server might work for POST requests
            }
        }
        
        // Generate request with proper form encoding
        async generate(input, options = {}) {
            const formData = new URLSearchParams();
            formData.append('input', input);
            formData.append('persona', options.persona || 'generic');
            formData.append('count', options.count || '1');
            
            if (options.max_tokens) {
                formData.append('max_tokens', options.max_tokens.toString());
            }
            
            return await this.makeRequest(API_CONFIG.endpoints.generate, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'text/html'
                },
                body: formData.toString()
            });
        }
    }
    
    // Custom Error Class
    class APIError extends Error {
        constructor(type, message, status = null, response = null) {
            super(message);
            this.name = 'APIError';
            this.type = type;
            this.status = status;
            this.response = response;
        }
        
        isRetryable() {
            return this.type === ERROR_TYPES.TIMEOUT || 
                   this.type === ERROR_TYPES.NETWORK_ERROR ||
                   (this.status >= 500 && this.type !== ERROR_TYPES.API_CREDITS);
        }
        
        getUserMessage() {
            switch (this.type) {
                case ERROR_TYPES.API_CREDITS:
                    return 'API credits insufficient. The visual effects will still work for demonstration.';
                case ERROR_TYPES.NETWORK_ERROR:
                    return 'Network connection failed. Please check your internet connection.';
                case ERROR_TYPES.TIMEOUT:
                    return 'Request timed out. The server may be busy.';
                case ERROR_TYPES.VALIDATION:
                    return this.message;
                case ERROR_TYPES.NOT_FOUND:
                    return 'The requested endpoint was not found.';
                default:
                    return 'A server error occurred. Please try again.';
            }
        }
    }
    
    // Enhanced Error Handler with User Feedback
    class ErrorHandler {
        static handleAPIError(error, context = '') {
            log('error', `Handling API error in ${context}:`, {
                type: error.type,
                message: error.message,
                status: error.status
            });
            
            // Show user-friendly message
            this.showUserError(error, context);
            
            // Trigger visual effects regardless of API failure
            this.triggerFallbackEffects(context);
            
            return error;
        }
        
        static showUserError(error, context) {
            const message = error.getUserMessage();
            
            // Create error notification
            const notification = document.createElement('div');
            notification.className = 'api-error-notification';
            notification.innerHTML = `
                <div class="error-content">
                    <div class="error-icon">⚠️</div>
                    <div class="error-text">
                        <strong>API Error</strong>
                        <p>${message}</p>
                        ${error.type === ERROR_TYPES.API_CREDITS ? 
                          '<p><small>Visual effects will continue for demonstration.</small></p>' : ''
                        }
                    </div>
                    <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;
            
            // Add styles if not present
            this.addErrorStyles();
            
            document.body.appendChild(notification);
            
            // Auto-remove after 8 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 8000);
        }
        
        static addErrorStyles() {
            if (document.getElementById('api-error-styles')) return;
            
            const styles = document.createElement('style');
            styles.id = 'api-error-styles';
            styles.textContent = `
                .api-error-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    max-width: 400px;
                    background: rgba(239, 68, 68, 0.95);
                    color: white;
                    border-radius: 8px;
                    padding: 0;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                    z-index: 10000;
                    animation: slideIn 0.3s ease-out;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .error-content {
                    display: flex;
                    align-items: flex-start;
                    padding: 16px;
                }
                
                .error-icon {
                    font-size: 24px;
                    margin-right: 12px;
                    flex-shrink: 0;
                }
                
                .error-text {
                    flex: 1;
                }
                
                .error-text strong {
                    display: block;
                    margin-bottom: 4px;
                    font-size: 16px;
                }
                
                .error-text p {
                    margin: 4px 0;
                    line-height: 1.4;
                }
                
                .error-text small {
                    opacity: 0.8;
                }
                
                .error-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    margin-left: 8px;
                    flex-shrink: 0;
                }
                
                .error-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        static triggerFallbackEffects(context) {
            // Always trigger visual effects even when API fails
            log('info', 'Triggering fallback visual effects due to API error');
            
            if (window.testGatewayEffects) {
                setTimeout(() => {
                    window.testGatewayEffects.inputVortex();
                }, 200);
                
                setTimeout(() => {
                    window.testGatewayEffects.outputTransmutation();
                }, 3000);
            }
        }
    }
    
    // Initialize and export
    const apiClient = new APIClient();
    
    window.APIClient = APIClient;
    window.APIError = APIError;
    window.ErrorHandler = ErrorHandler;
    window.apiClient = apiClient;
    window.API_CONFIG = API_CONFIG;
    window.ERROR_TYPES = ERROR_TYPES;
    
    log('success', 'API Error Handler initialized with centralized error management');
    
})(); 