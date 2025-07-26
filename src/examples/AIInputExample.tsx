import React, { useState } from 'react';
import AIInputComponent from '../components/AIInputComponent';

const AIInputExample: React.FC = () => {
  const [currentValue, setCurrentValue] = useState('');
  const [submissions, setSubmissions] = useState<string[]>([]);

  const handleSubmit = (value: string) => {
    console.log('Form submitted with value:', value);
    setSubmissions(prev => [...prev, value]);
    
    // Here you would typically make an API call
    // Example: await fetch('/api/generate', { method: 'POST', body: JSON.stringify({ prompt: value }) })
  };

  const handleValueChange = (value: string) => {
    setCurrentValue(value);
    console.log('Input value changed:', value);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--metal-surface, #0a0a0a)', 
      padding: '2rem',
      color: 'var(--liquid-gold, #fbbf24)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          color: 'var(--liquid-gold, #fbbf24)'
        }}>
          AI Input Component Demo
        </h1>

        <AIInputComponent
          placeholder="Describe your prompt or ask a question..."
          maxLength={5000}
          enableSuggestions={true}
          enableThinking={true}
          onSubmit={handleSubmit}
          onValueChange={handleValueChange}
          className="demo-input"
        />

        {/* Display current value */}
        <div style={{ marginTop: '1rem' }}>
          <h3>Current Value:</h3>
          <pre style={{ 
            background: 'rgba(42, 42, 44, 0.5)', 
            padding: '1rem', 
            borderRadius: '8px',
            overflow: 'auto'
          }}>
            {currentValue || 'No input yet...'}
          </pre>
        </div>

        {/* Display submissions */}
        {submissions.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Submissions History:</h3>
            {submissions.map((submission, index) => (
              <div key={index} style={{ 
                background: 'rgba(42, 42, 44, 0.3)', 
                padding: '1rem', 
                borderRadius: '8px',
                marginBottom: '0.5rem',
                border: '1px solid var(--metal-border, #2a2a2c)'
              }}>
                <strong>Submission #{index + 1}:</strong>
                <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                  {submission}
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* Feature showcase */}
        <div style={{ marginTop: '3rem' }}>
          <h2>Features Demonstrated:</h2>
          <ul style={{ 
            lineHeight: '1.6',
            color: 'var(--metal-muted, #71717a)'
          }}>
            <li>✨ <strong>Smart Suggestions:</strong> Click the dropdown arrow next to Generate button</li>
            <li>🔧 <strong>Advanced Options:</strong> Click the gear icon for configuration</li>
            <li>📎 <strong>File Attachments:</strong> Click the plus icon to attach files</li>
            <li>⌨️ <strong>Keyboard Shortcuts:</strong> Cmd/Ctrl+Enter to submit</li>
            <li>🎯 <strong>Auto-resize:</strong> Textarea expands as you type</li>
            <li>🎨 <strong>Alchemy Theme:</strong> Dark theme with gold accents and animations</li>
            <li>📱 <strong>Responsive Design:</strong> Works on desktop and mobile</li>
            <li>🔄 <strong>Loading States:</strong> Visual feedback during processing</li>
            <li>🎮 <strong>Interactive Elements:</strong> Right-click Generate for presets</li>
            <li>📊 <strong>Character Counter:</strong> Shows current length vs maximum</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AIInputExample; 