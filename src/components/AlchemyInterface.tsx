import React, { useState, useCallback } from 'react';
import { AlchemyInputComponent } from './AlchemyInputComponent';
import { SimpleHeader } from './SimpleHeader';
import { HexagonGrid } from './HexagonGrid';
import AlchemyHexGrid from './AlchemyHexGrid/AlchemyHexGrid';
import { ApiTestRunner } from './ApiTestRunner';
import { StatusIndicator } from './StatusIndicator';
import { UserFlowTester } from './UserFlowTester';
import { api } from '../utils/api';
import './AlchemyInterface.css';

interface AlchemyResult {
  id: string;
  input: string;
  output: string;
  phase: string;
  timestamp: string;
  score?: number;
}

interface AlchemyInterfaceProps {
  className?: string;
}

export const AlchemyInterface: React.FC<AlchemyInterfaceProps> = ({ className = '' }) => {
  const [results, setResults] = useState<AlchemyResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showApiTests, setShowApiTests] = useState(false);
  const [showUserFlowTests, setShowUserFlowTests] = useState(false);
  const [showHexGrid, setShowHexGrid] = useState(false);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [testResults, setTestResults] = useState<{ passed: number; failed: number; total: number } | null>(null);

  // Handle prompt generation
  const handleGenerate = useCallback(async (input: string, options?: any) => {
    if (!input.trim()) return;

    setIsGenerating(true);
    setError('');
    
    try {
      // Phase 1: Prima Materia
      setCurrentPhase('Prima Materia - Extracting essence...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Phase 2: Solutio  
      setCurrentPhase('Solutio - Dissolving barriers...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Phase 3: Coagulatio
      setCurrentPhase('Coagulatio - Crystallizing form...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Use the API client for better error handling
      const response = await api.generatePrompts({
        input,
        phases: ['prima_materia', 'solutio', 'coagulatio'],
        count: 1,
        persona: options?.persona || 'creative',
        temperature: options?.temperature || 0.7,
        ...options
      });

      if (!response.success) {
        throw new Error(response.error || 'Generation failed');
      }

      const data = response.data;
      
      // Create result
      const newResult: AlchemyResult = {
        id: Date.now().toString(),
        input,
        output: data?.prompts?.[0]?.content || 'Generation completed',
        phase: 'Complete',
        timestamp: new Date().toISOString(),
        score: data?.prompts?.[0]?.score || 0
      };

      setResults(prev => [newResult, ...prev]);
      setCurrentPhase('✨ Transmutation Complete!');
      
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Generation failed');
      setCurrentPhase('');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setCurrentPhase(''), 2000);
    }
  }, []);

  return (
    <div className={`alchemy-interface ${className}`}>
      {/* Hexagon Background */}
      <HexagonGrid />
      
      <div className="alchemy-container">
        {/* Simple Header */}
        <SimpleHeader 
          title="PROMPT ALCHEMY"
          subtitle="Transform raw ideas into refined AI prompts"
        />

        {/* AI Status Indicator */}
        <div className="ai-header">
          <div className="ai-header-content">
            <span className="ai-indicator">🤖</span>
            <span className="ai-header-text">
              {isGenerating ? currentPhase : 'AI-Powered Prompt Generation Ready'}
            </span>
            {testResults && (
              <span className="test-results-indicator">
                🧪 {testResults.passed}/{testResults.total} tests passing
              </span>
            )}
          </div>
          
          <div className="ai-header-actions">
            <button
              className="test-flow-btn"
              onClick={() => setShowHexGrid(!showHexGrid)}
              title="View alchemical process visualization"
            >
              {showHexGrid ? 'Hide Grid' : '⬡ Hex Grid'}
            </button>
            <button
              className="test-flow-btn"
              onClick={() => setShowUserFlowTests(!showUserFlowTests)}
              title="Run comprehensive user flow tests"
            >
              {showUserFlowTests ? 'Hide Tests' : '🧪 Test Flows'}
            </button>
          </div>
        </div>

        {/* Main Input Component */}
        <div className="alchemy-input-section">
          <AlchemyInputComponent 
            onSubmit={handleGenerate}
            isLoading={isGenerating}
            placeholder="✨ Describe your magical prompt idea..."
            disabled={isGenerating}
          />
          
          {error && (
            <div className="alchemy-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
              {!apiHealthy && (
                <button
                  className="show-tests-btn"
                  onClick={() => setShowApiTests(!showApiTests)}
                >
                  {showApiTests ? 'Hide' : 'Show'} API Tests
                </button>
              )}
            </div>
          )}
        </div>

        {/* Alchemy Hex Grid Visualization */}
        {showHexGrid && (
          <div className="alchemy-hex-grid-section">
            <AlchemyHexGrid 
              width={800}
              height={600}
              onNodeClick={(node) => console.log('Node clicked:', node)}
              animationSpeed={1}
              initialZoom={1}
              enableZoomControls={true}
              enablePan={true}
            />
          </div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div className="alchemy-results">
            <h3 className="results-title">
              <span className="results-icon">📜</span>
              Transmutation Results
            </h3>
            
            <div className="results-grid">
              {results.map((result) => (
                <div key={result.id} className="result-card">
                  <div className="result-header">
                    <span className="result-phase">{result.phase}</span>
                    <span className="result-timestamp">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="result-input">
                    <strong>Input:</strong> {result.input}
                  </div>
                  
                  <div className="result-output">
                    <strong>Generated Prompt:</strong>
                    <div className="output-content">{result.output}</div>
                  </div>
                  
                  {result.score && (
                    <div className="result-score">
                      Score: {result.score}/10
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Test Runner */}
        {showApiTests && (
          <ApiTestRunner onConnectionStatus={setApiHealthy} />
        )}

        {/* User Flow Test Runner */}
        {showUserFlowTests && (
          <UserFlowTester onTestResults={setTestResults} />
        )}

        {/* Phase Indicators */}
        {isGenerating && (
          <div className="phase-indicators">
            <div className="phase-item active">
              <div className="phase-icon">🌱</div>
              <div className="phase-name">Prima Materia</div>
            </div>
            <div className="phase-item">
              <div className="phase-icon">🌊</div>
              <div className="phase-name">Solutio</div>
            </div>
            <div className="phase-item">
              <div className="phase-icon">💎</div>
              <div className="phase-name">Coagulatio</div>
            </div>
          </div>
        )}
      </div>

      {/* Status Indicator - Fixed position overlay */}
      <StatusIndicator 
        position="bottom-right"
        autoRefresh={true}
        refreshInterval={30000}
        showTooltips={true}
      />
      
    </div>
  );
};

export default AlchemyInterface;