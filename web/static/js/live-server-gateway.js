// Live Server Gateway Integration - Fixed Version
(function() {
    'use strict';
    
    console.log('🔌 Live Server Gateway Integration Loading...');
    
    let isInitialized = false;
    let formSubmissionHandler = null;
    
    // Wait for API client to be available
    function waitForAPIClient() {
        return new Promise((resolve) => {
            if (window.apiClient) {
                resolve();
                return;
            }
            
            const checkInterval = setInterval(() => {
                if (window.apiClient) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                console.warn('API client not available, proceeding without it');
                resolve();
            }, 5000);
        });
    }
    
    // Enhanced debug logger
    function log(message, data = null) {
        const timestamp = new Date().toTimeString().split(' ')[0];
        if (data) {
            console.log(`[${timestamp}] 🔌 LIVE: ${message}`, data);
        } else {
            console.log(`[${timestamp}] 🔌 LIVE: ${message}`);
        }
    }
    
    // Check server connectivity using centralized client
    async function checkServerConnection() {
        log('Checking server connection with centralized API client...');
        
        if (!window.apiClient) {
            log('❌ API client not available');
            return false;
        }
        
        try {
            const healthy = await window.apiClient.checkHealth();
            if (healthy) {
                log('✅ Server is healthy and responding');
                return true;
            } else {
                log('⚠️ Health check failed, but server may still work');
                return true; // Don't fail completely
            }
        } catch (error) {
            log('❌ Server connection check failed:', error.message);
            return false;
        }
    }
    
    // Remove all existing form listeners to prevent conflicts
    function removeExistingFormListeners() {
        const form = document.getElementById('generate-form');
        if (!form) return null;
        
        // Clone form to remove all event listeners
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        log('🔄 Removed existing form listeners to prevent conflicts');
        
        return newForm;
    }
    
    // Enhanced form submission with centralized error handling
    function enhanceFormSubmission() {
        if (isInitialized) {
            log('⚠️ Form submission already initialized, skipping');
            return;
        }
        
        const form = removeExistingFormListeners();
        if (!form) {
            log('❌ Generate form not found');
            return;
        }
        
        // Create single form submission handler
        formSubmissionHandler = async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            log('📝 Form submitted - handling with centralized API client');
            
            // Get form data
            const formData = new FormData(form);
            const input = formData.get('input');
            
            if (!input || !input.trim()) {
                log('❌ No input provided');
                if (window.ErrorHandler) {
                    const error = new window.APIError(window.ERROR_TYPES.VALIDATION, 'Input is required');
                    window.ErrorHandler.handleAPIError(error, 'form submission');
                }
                return;
            }
            
            // Trigger input vortex immediately for visual feedback
            triggerInputEffects();
            
            // Prepare request options
            const options = {
                persona: formData.get('persona') || 'generic',
                count: formData.get('count') || '1',
                max_tokens: formData.get('max_tokens') || '2000'
            };
            
            log('📤 Sending request with centralized API client:', { input: input.substring(0, 50) + '...', options });
            
            try {
                if (!window.apiClient) {
                    throw new Error('API client not available');
                }
                
                const response = await window.apiClient.generate(input, options);
                
                log('✅ Server request successful');
                handleSuccessfulResponse(response);
                
            } catch (error) {
                log('❌ Request failed:', error.message);
                
                if (window.ErrorHandler && error instanceof window.APIError) {
                    window.ErrorHandler.handleAPIError(error, 'form submission');
                } else {
                    // Fallback error handling
                    handleFallbackError(error);
                }
            }
        };
        
        // Add the single event listener
        form.addEventListener('submit', formSubmissionHandler);
        
        // Prevent HTMX from handling this form
        form.setAttribute('hx-disable', 'true');
        
        isInitialized = true;
        log('✅ Enhanced form submission installed with conflict prevention');
    }
    
    // Trigger input effects immediately
    function triggerInputEffects() {
        log('🌀 Triggering input gateway effects');
        
        if (window.testGatewayEffects) {
            window.testGatewayEffects.inputVortex();
        }
    }
    
    // Handle successful API response
    function handleSuccessfulResponse(response) {
        log('🎉 Handling successful response');
        
        // Trigger complete animation flow
        triggerCompleteAnimationFlow();
        
        // Update results if available
        updateResultsDisplay(response);
    }
    
    // Trigger complete animation flow with better coordination
    function triggerCompleteAnimationFlow() {
        log('🎬 Starting complete animation flow');
        
        // Use enhanced coordination if available
        if (window.advancedGatewayEffects) {
            window.advancedGatewayEffects.coordinateAdvanced();
        } else if (window.testGatewayEffects) {
            // Fallback to basic effects
            setTimeout(() => {
                window.testGatewayEffects.outputTransmutation();
            }, 2000);
        }
    }
    
    // Update results display
    function updateResultsDisplay(response) {
        const resultsContainer = document.getElementById('results-container') || 
                                document.getElementById('results') ||
                                document.querySelector('.results');
        
        if (resultsContainer && response.data) {
            // Handle HTML response
            if (typeof response.data === 'string' && response.data.includes('<')) {
                resultsContainer.innerHTML = response.data;
                log('✅ Results updated with HTML content');
            } else {
                // Handle other response types
                resultsContainer.innerHTML = `
                    <div class="api-success">
                        <h3>✅ Generation Successful</h3>
                        <p>Response received from server.</p>
                        <p><small>Check console for details.</small></p>
                    </div>
                `;
                log('✅ Results updated with success message');
            }
        }
    }
    
    // Fallback error handling for non-API errors
    function handleFallbackError(error) {
        log('🚨 Handling fallback error:', error.message);
        
        // Still trigger effects for visual feedback
        triggerCompleteAnimationFlow();
        
        // Show generic error if no centralized handler
        if (!window.ErrorHandler) {
            const resultsContainer = document.getElementById('results-container');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="error-message">
                        <h3>Request Error</h3>
                        <p>${error.message}</p>
                        <p>Gateway effects shown for demonstration.</p>
                    </div>
                `;
            }
        }
    }
    
    // Test functions for manual testing
    window.testLiveServerGateway = {
        checkConnection: checkServerConnection,
        
        testWithRealData: async function() {
            log('🧪 Testing with real server data');
            
            const connected = await checkServerConnection();
            if (!connected) {
                log('⚠️ Server connection check failed, but proceeding with test');
            }
            
            const testInput = 'Test prompt for gateway effects: Create a short story about AI discovering creativity';
            
            log('📤 Testing with input:', testInput);
            
            try {
                if (!window.apiClient) {
                    throw new Error('API client not available');
                }
                
                const response = await window.apiClient.generate(testInput, {
                    persona: 'generic',
                    count: '1'
                });
                
                log('✅ Test successful:', response);
                handleSuccessfulResponse(response);
                
            } catch (error) {
                log('❌ Test failed:', error.message);
                
                if (window.ErrorHandler && error instanceof window.APIError) {
                    window.ErrorHandler.handleAPIError(error, 'manual test');
                } else {
                    handleFallbackError(error);
                }
            }
        },
        
        status: async function() {
            const status = {
                initialized: isInitialized,
                apiClientAvailable: !!window.apiClient,
                errorHandlerAvailable: !!window.ErrorHandler,
                formFound: !!document.getElementById('generate-form'),
                gatewayEffectsAvailable: !!window.testGatewayEffects
            };
            
            log('📊 Live server gateway status:', status);
            return status;
        },
        
        reinitialize: async function() {
            log('🔄 Reinitializing live server gateway');
            isInitialized = false;
            await initialize();
            return true;
        }
    };
    
    // Initialize the system
    async function initialize() {
        if (isInitialized) {
            log('⚠️ Already initialized');
            return;
        }
        
        log('🚀 Initializing live server gateway integration');
        
        // Wait for dependencies
        await waitForAPIClient();
        
        // Setup form handling
        enhanceFormSubmission();
        
        log('✅ Live server gateway integration ready');
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // Delay to allow other scripts to load
        setTimeout(initialize, 500);
    }
    
})(); 