import React, { useState, useEffect } from 'react';
import { testApiConnectivity, testSpecificFeature, api, logApiResponse } from '../utils/api';
import './ApiTestRunner.css';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  duration: number;
  details?: any;
  critical: boolean;
}

interface ConnectivityResult {
  healthy: boolean;
  tests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    critical_failures: number;
    total_duration: number;
  };
}

interface ApiTestRunnerProps {
  onConnectionStatus?: (healthy: boolean) => void;
}

export const ApiTestRunner: React.FC<ApiTestRunnerProps> = ({ onConnectionStatus }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [overallHealth, setOverallHealth] = useState<boolean | null>(null);
  const [testSummary, setTestSummary] = useState<ConnectivityResult['summary'] | null>(null);
  const [autoTestEnabled, setAutoTestEnabled] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setTestSummary(null);
    
    try {
      const testResults = await testApiConnectivity();
      setResults(testResults.tests);
      setOverallHealth(testResults.healthy);
      setTestSummary(testResults.summary);
      onConnectionStatus?.(testResults.healthy);
      
      // Log results to console for debugging
      logApiResponse('connectivity-test', {
        success: testResults.healthy,
        data: testResults,
      }, testResults.summary.total_duration);
    } catch (error) {
      console.error('Failed to run API tests:', error);
      setOverallHealth(false);
      setTestSummary(null);
      onConnectionStatus?.(false);
    } finally {
      setIsRunning(false);
    }
  };

  const testPromptGeneration = async () => {
    setIsRunning(true);
    
    try {
      const testInput = "Test prompt generation for integration verification";
      const startTime = Date.now();
      
      const response = await api.generatePrompts({
        input: testInput,
        phases: ['prima_materia', 'solutio', 'coagulatio'],
        count: 1,
        persona: 'creative',
        temperature: 0.7
      });
      
      const duration = Date.now() - startTime;
      
      const newResult: TestResult = {
        name: 'Prompt Generation Test',
        success: response.success,
        error: response.error,
        duration,
        details: response.data,
        critical: true
      };
      
      setResults(prev => [...prev, newResult]);
      
      // Log the test result
      logApiResponse('generate-test', response, duration);
      
    } catch (error) {
      const newResult: TestResult = {
        name: 'Prompt Generation Test',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: 0,
        critical: true
      };
      setResults(prev => [...prev, newResult]);
    } finally {
      setIsRunning(false);
    }
  };

  const testSpecificFeatureHandler = async (feature: 'generation' | 'providers' | 'search') => {
    setIsRunning(true);
    
    try {
      const startTime = Date.now();
      const response = await testSpecificFeature(feature);
      const duration = Date.now() - startTime;
      
      const newResult: TestResult = {
        name: `${feature.charAt(0).toUpperCase() + feature.slice(1)} Feature Test`,
        success: response.success,
        error: response.error,
        duration,
        details: response.data,
        critical: feature === 'generation' // Only generation is critical
      };
      
      setResults(prev => [...prev, newResult]);
      
      // Log the test result
      logApiResponse(`${feature}-feature-test`, response, duration);
      
    } catch (error) {
      const newResult: TestResult = {
        name: `${feature.charAt(0).toUpperCase() + feature.slice(1)} Feature Test`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: 0,
        critical: feature === 'generation'
      };
      setResults(prev => [...prev, newResult]);
    } finally {
      setIsRunning(false);
    }
  };

  // Auto-test on component mount if enabled
  useEffect(() => {
    if (autoTestEnabled) {
      runTests();
    }
  }, [autoTestEnabled]);

  const getStatusIcon = (success: boolean, critical?: boolean) => {
    if (success) return '✅';
    return critical ? '🔴' : '⚠️';
  };

  const getHealthIcon = () => {
    if (overallHealth === null) return '🔄';
    return overallHealth ? '🟢' : '🔴';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getCriticalityLabel = (critical: boolean) => {
    return critical ? 'Critical' : 'Non-critical';
  };

  const getCriticalityClass = (critical: boolean) => {
    return critical ? 'critical' : 'non-critical';
  };

  return (
    <div className="api-test-runner">
      <div className="test-header">
        <h3>
          <span className="health-icon">{getHealthIcon()}</span>
          API Integration Status
        </h3>
        
        <div className="test-controls">
          <label className="auto-test-toggle">
            <input
              type="checkbox"
              checked={autoTestEnabled}
              onChange={(e) => setAutoTestEnabled(e.target.checked)}
            />
            Auto-test on load
          </label>
          
          <button
            onClick={runTests}
            disabled={isRunning}
            className="test-btn primary"
          >
            {isRunning ? 'Testing...' : 'Run Connection Tests'}
          </button>
          
          <button
            onClick={testPromptGeneration}
            disabled={isRunning}
            className="test-btn secondary"
          >
            Test Prompt Generation
          </button>

          <button
            onClick={() => testSpecificFeatureHandler('providers')}
            disabled={isRunning}
            className="test-btn secondary"
          >
            Test Providers
          </button>

          <button
            onClick={() => testSpecificFeatureHandler('search')}
            disabled={isRunning}
            className="test-btn secondary"
          >
            Test Search
          </button>
        </div>
      </div>

      {overallHealth !== null && (
        <div className={`health-summary ${overallHealth ? 'healthy' : 'unhealthy'}`}>
          <strong>
            {overallHealth ? '✅ All systems operational' : '❌ Integration issues detected'}
          </strong>
          {testSummary && (
            <div className="test-summary-stats">
              <span className="stat">
                Total: {testSummary.total}
              </span>
              <span className="stat passed">
                Passed: {testSummary.passed}
              </span>
              <span className="stat failed">
                Failed: {testSummary.failed}
              </span>
              {testSummary.critical_failures > 0 && (
                <span className="stat critical-failures">
                  Critical Failures: {testSummary.critical_failures}
                </span>
              )}
              <span className="stat duration">
                Duration: {formatDuration(testSummary.total_duration)}
              </span>
            </div>
          )}
          {!overallHealth && (
            <p>Check the details below and ensure the backend server is running on port 8080.</p>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div className="test-results">
          <h4>Test Results</h4>
          <div className="results-list">
            {results.map((result, index) => (
              <div
                key={index}
                className={`test-result-item ${result.success ? 'success' : 'failure'} ${getCriticalityClass(result.critical)}`}
              >
                <div className="result-header">
                  <span className="result-icon">{getStatusIcon(result.success, result.critical)}</span>
                  <span className="result-name">{result.name}</span>
                  <span className="result-criticality">{getCriticalityLabel(result.critical)}</span>
                  <span className="result-duration">{formatDuration(result.duration)}</span>
                </div>
                
                {result.error && (
                  <div className="result-error">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
                
                {result.details && (
                  <div className="result-details">
                    <strong>Response:</strong>
                    <pre>{JSON.stringify(result.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isRunning && (
        <div className="testing-indicator">
          <div className="spinner"></div>
          <span>Running API tests...</span>
        </div>
      )}
    </div>
  );
};

export default ApiTestRunner;