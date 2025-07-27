import React, { useState } from 'react';
import { api } from '../utils/api';
import './UserFlowTester.css';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'generation' | 'providers' | 'search' | 'edge-cases';
  testFn: () => Promise<TestResult>;
}

interface TestResult {
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface UserFlowTesterProps {
  onTestResults?: (results: { passed: number; failed: number; total: number }) => void;
}

export const UserFlowTester: React.FC<UserFlowTesterProps> = ({ onTestResults }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [runningTest, setRunningTest] = useState<string | null>(null);

  // Define test cases
  const testCases: TestCase[] = [
    // Generation Tests
    {
      id: 'basic-generation',
      name: 'Basic Prompt Generation',
      description: 'Test simple prompt generation with default settings',
      category: 'generation',
      testFn: async () => {
        const start = Date.now();
        const response = await api.generatePrompts({
          input: 'Create a simple greeting message',
          count: 1,
          persona: 'creative',
          temperature: 0.7
        });
        return {
          success: response.success,
          duration: Date.now() - start,
          error: response.error,
          details: response.data
        };
      }
    },
    {
      id: 'custom-phases',
      name: 'Custom Phase Selection',
      description: 'Test generation with specific phase configuration',
      category: 'generation',
      testFn: async () => {
        const start = Date.now();
        const response = await api.generatePrompts({
          input: 'Write a technical documentation',
          phases: ['prima_materia', 'coagulatio'],
          count: 1,
          persona: 'technical',
          temperature: 0.5
        });
        return {
          success: response.success,
          duration: Date.now() - start,
          error: response.error,
          details: response.data
        };
      }
    },
    {
      id: 'multiple-prompts',
      name: 'Multiple Prompt Generation',
      description: 'Test generating multiple prompts at once',
      category: 'generation',
      testFn: async () => {
        const start = Date.now();
        const response = await api.generatePrompts({
          input: 'Create a marketing slogan',
          count: 3,
          persona: 'creative',
          temperature: 0.8
        });
        return {
          success: response.success && ((response.data?.prompts?.length || 0) >= 1),
          duration: Date.now() - start,
          error: response.error,
          details: { 
            ...response.data, 
            actualCount: response.data?.prompts?.length 
          }
        };
      }
    },

    // Provider Tests
    {
      id: 'provider-list',
      name: 'Provider Availability',
      description: 'Test retrieving available LLM providers',
      category: 'providers',
      testFn: async () => {
        const start = Date.now();
        const response = await api.getProviders();
        return {
          success: response.success && Array.isArray(response.data?.providers),
          duration: Date.now() - start,
          error: response.error,
          details: {
            providerCount: response.data?.providers?.length,
            availableProviders: response.data?.providers?.filter(p => p.available).length
          }
        };
      }
    },

    // Search Tests
    {
      id: 'search-functionality',
      name: 'Prompt Search',
      description: 'Test searching existing prompts',
      category: 'search',
      testFn: async () => {
        const start = Date.now();
        const response = await api.searchPrompts('test', { limit: 5 });
        return {
          success: response.success,
          duration: Date.now() - start,
          error: response.error,
          details: response.data
        };
      }
    },
    {
      id: 'list-prompts',
      name: 'List Prompts',
      description: 'Test listing stored prompts with pagination',
      category: 'search',
      testFn: async () => {
        const start = Date.now();
        const response = await api.listPrompts({ page: 1, limit: 10 });
        return {
          success: response.success,
          duration: Date.now() - start,
          error: response.error,
          details: response.data
        };
      }
    },

    // Edge Cases
    {
      id: 'empty-input',
      name: 'Empty Input Handling',
      description: 'Test graceful handling of empty input',
      category: 'edge-cases',
      testFn: async () => {
        const start = Date.now();
        const response = await api.generatePrompts({
          input: '',
          count: 1
        });
        return {
          success: !response.success || false, // Should fail gracefully
          duration: Date.now() - start,
          error: response.error,
          details: response.data
        };
      }
    },
    {
      id: 'very-long-input',
      name: 'Long Input Handling',
      description: 'Test handling of very long input text',
      category: 'edge-cases',
      testFn: async () => {
        const start = Date.now();
        const longInput = 'A'.repeat(10000); // 10k characters
        const response = await api.generatePrompts({
          input: longInput,
          count: 1,
          persona: 'creative'
        });
        return {
          success: response.success || (response.error?.includes('too long') || response.error?.includes('limit')) || false,
          duration: Date.now() - start,
          error: response.error,
          details: { inputLength: longInput.length }
        };
      }
    },
    {
      id: 'invalid-temperature',
      name: 'Invalid Temperature',
      description: 'Test handling of invalid temperature values',
      category: 'edge-cases',
      testFn: async () => {
        const start = Date.now();
        const response = await api.generatePrompts({
          input: 'Test prompt',
          temperature: 5.0, // Invalid temperature
          count: 1
        });
        return {
          success: response.success || response.error?.includes('temperature') || false,
          duration: Date.now() - start,
          error: response.error,
          details: response.data
        };
      }
    }
  ];

  const runSingleTest = async (testCase: TestCase): Promise<void> => {
    setRunningTest(testCase.id);
    try {
      const result = await testCase.testFn();
      setResults(prev => ({
        ...prev,
        [testCase.id]: result
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testCase.id]: {
          success: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      setRunningTest(null);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults({});
    
    const filteredTests = selectedCategory === 'all' 
      ? testCases 
      : testCases.filter(test => test.category === selectedCategory);

    for (const testCase of filteredTests) {
      await runSingleTest(testCase);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calculate summary
    const testResults = Object.values(results);
    const passed = testResults.filter(r => r.success).length;
    const failed = testResults.filter(r => !r.success).length;
    
    onTestResults?.({
      passed,
      failed,
      total: testResults.length
    });

    setIsRunning(false);
  };

  const getTestStatus = (testId: string) => {
    if (runningTest === testId) return 'running';
    if (!results[testId]) return 'pending';
    return results[testId].success ? 'passed' : 'failed';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '🔄';
      case 'passed': return '✅';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  const filteredTests = selectedCategory === 'all' 
    ? testCases 
    : testCases.filter(test => test.category === selectedCategory);

  const testResultsArray = Object.values(results);
  const passedCount = testResultsArray.filter(r => r.success).length;
  const failedCount = testResultsArray.filter(r => !r.success).length;

  return (
    <div className="user-flow-tester">
      <div className="tester-header">
        <h3>🧪 User Flow Testing Suite</h3>
        
        <div className="tester-controls">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={isRunning}
            className="category-select"
          >
            <option value="all">All Tests</option>
            <option value="generation">Generation</option>
            <option value="providers">Providers</option>
            <option value="search">Search</option>
            <option value="edge-cases">Edge Cases</option>
          </select>
          
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="run-tests-btn"
          >
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </button>
        </div>
      </div>

      {testResultsArray.length > 0 && (
        <div className="test-summary">
          <div className="summary-stats">
            <span className="stat passed">✅ {passedCount} Passed</span>
            <span className="stat failed">❌ {failedCount} Failed</span>
            <span className="stat total">📊 {testResultsArray.length} Total</span>
          </div>
        </div>
      )}

      <div className="test-cases">
        {filteredTests.map((testCase) => {
          const status = getTestStatus(testCase.id);
          const result = results[testCase.id];
          
          return (
            <div
              key={testCase.id}
              className={`test-case ${status}`}
            >
              <div className="test-header">
                <span className="test-icon">{getStatusIcon(status)}</span>
                <div className="test-info">
                  <h4 className="test-name">{testCase.name}</h4>
                  <p className="test-description">{testCase.description}</p>
                </div>
                <div className="test-meta">
                  <span className="test-category">{testCase.category}</span>
                  {result && (
                    <span className="test-duration">{result.duration}ms</span>
                  )}
                </div>
              </div>
              
              {result && (
                <div className="test-details">
                  {result.error && (
                    <div className="test-error">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                  
                  {result.details && (
                    <div className="test-result-data">
                      <strong>Details:</strong>
                      <pre>{JSON.stringify(result.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={() => runSingleTest(testCase)}
                disabled={isRunning}
                className="run-single-test"
              >
                {status === 'running' ? 'Running...' : 'Run Test'}
              </button>
            </div>
          );
        })}
      </div>

      {isRunning && (
        <div className="running-indicator">
          <div className="progress-spinner"></div>
          <span>Running user flow tests...</span>
        </div>
      )}
    </div>
  );
};

export default UserFlowTester;