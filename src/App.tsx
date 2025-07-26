import { useState } from 'react';
import { TwentyFirstToolbar } from '@21st-extension/toolbar-react';
import { ReactPlugin } from '@21st-extension/react';
import TestComponent from './components/TestComponent';
import './components/AIInputComponent.css';

function App() {
  return (
    <div className="App">
      {/* 21st.dev Toolbar - only in development mode */}
      {import.meta.env.DEV && (
        <TwentyFirstToolbar
          config={{
            plugins: [ReactPlugin],
            // Add debugging and activation options
            onInit: () => {
              console.log('✅ 21st Toolbar Initialized Successfully');
              console.log('🔧 ReactPlugin loaded:', ReactPlugin);
            },
            onError: (error) => {
              console.error('❌ 21st Toolbar Error:', error);
            },
            onActivate: () => {
              console.log('🎯 21st Toolbar Activated - Prompt area should be visible');
            },
            // Enable more verbose logging
            debug: true,
            // Force activation
            autoActivate: true,
          }}
          enabled={true}
        />
      )}

      {/* Test Component with interactive elements */}
      <TestComponent />
    </div>
  );
}

export default App; 