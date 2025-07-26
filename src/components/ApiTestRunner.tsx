import React, { useState, useEffect } from 'react';
import { testApiConnectivity, api } from '../utils/api';
import './ApiTestRunner.css';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  duration: number;
  details?: any;
}

interface ApiTestRunnerProps {
  onConnectionStatus?: (healthy: boolean) => void;
}

export const ApiTestRunner: React.FC<ApiTestRunnerProps> = ({ onConnectionStatus }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [overallHealth, setOverallHealth] = useState<boolean | null>(null);
  const [autoTestEnabled, setAutoTestEnabled] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      const testResults = await testApiConnectivity();
      setResults(testResults.tests);
      setOverallHealth(testResults.healthy);
      onConnectionStatus?.(testResults.healthy);
    } catch (error) {
      console.error('Failed to run API tests:', error);
      setOverallHealth(false);
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
        details: response.data
      };
      
      setResults(prev => [...prev, newResult]);
      
    } catch (error) {
      const newResult: TestResult = {
        name: 'Prompt Generation Test',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: 0
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

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  const getHealthIcon = () => {
    if (overallHealth === null) return '🔄';
    return overallHealth ? '🟢' : '🔴';
  };

  const formatDuration = (ms: number) => {
    return `${ms}ms`;
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
        </div>
      </div>

      {overallHealth !== null && (
        <div className={`health-summary ${overallHealth ? 'healthy' : 'unhealthy'}`}>
          <strong>
            {overallHealth ? '✅ All systems operational' : '❌ Integration issues detected'}
          </strong>
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
                className={`test-result-item ${result.success ? 'success' : 'failure'}`}
              >
                <div className="result-header">
                  <span className="result-icon">{getStatusIcon(result.success)}</span>
                  <span className="result-name">{result.name}</span>
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