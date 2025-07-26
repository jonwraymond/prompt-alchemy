import { useState } from 'react';
import { TwentyFirstToolbar } from '@21st-extension/toolbar-react';
import { ReactPlugin } from '@21st-extension/react';
import AlchemyInterface from './components/AlchemyInterface';
import TestComponent from './components/TestComponent';
import ToolbarStatus from './components/ToolbarStatus';
import './components/AIInputComponent.css';

function App() {
  const [showTest, setShowTest] = useState(false);

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
            onConnect: () => {
              console.log('🔗 21st Toolbar Connected to VSCode!');
            },
            onDisconnect: () => {
              console.log('🔌 21st Toolbar Disconnected from VSCode');
            }
          }}
        />
      )}

      {/* Toolbar Status Indicator */}
      {import.meta.env.DEV && <ToolbarStatus />}

      {/* Mode Toggle for Development */}
      {import.meta.env.DEV && (
        <div style={{ 
          position: 'fixed', 
          top: '10px', 
          right: '10px', 
          zIndex: 1000,
          display: 'flex',
          gap: '10px'
        }}>
          <button 
            onClick={() => setShowTest(false)}
            style={{
              padding: '8px 16px',
              background: !showTest ? '#10b981' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Alchemy
          </button>
          <button 
            onClick={() => setShowTest(true)}
            style={{
              padding: '8px 16px',
              background: showTest ? '#10b981' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Test
          </button>
        </div>
      )}

      {/* Main Content */}
      {showTest ? (
        <TestComponent />
      ) : (
        <AlchemyInterface />
      )}
    </div>
  );
}

export default App; 