import { useState } from 'react';
import { TwentyFirstToolbar } from '@21st-extension/toolbar-react';
import { ReactPlugin } from '@21st-extension/react';
// import AlchemicalBackground from './components/AlchemicalBackground';
import AIInputExample from './examples/AIInputExample';
import MagicalHeader from './components/MagicalHeader';
import MagicalHeaderDemo from './examples/MagicalHeaderDemo';
import './components/AIInputComponent.css';

function App() {
  const [showHeaderDemo, setShowHeaderDemo] = useState(false);

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
      {/* Demo Toggle */}
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000,
        display: 'flex',
        gap: '0.5rem'
      }}>
        <button
          onClick={() => setShowHeaderDemo(false)}
          style={{
            background: showHeaderDemo ? 'rgba(42, 42, 44, 0.8)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            color: showHeaderDemo ? '#a1a1aa' : '#000',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Main Demo
        </button>
        <button
          onClick={() => setShowHeaderDemo(true)}
          style={{
            background: showHeaderDemo ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'rgba(42, 42, 44, 0.8)',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            color: showHeaderDemo ? '#000' : '#a1a1aa',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Header Demo
        </button>
      </div>

      {showHeaderDemo ? (
        <MagicalHeaderDemo />
      ) : (
        <>
          <MagicalHeader />
          <AIInputExample />
        </>
      )}
    </div>
  );
}

export default App; 