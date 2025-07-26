import { useState } from 'react';
import { TwentyFirstToolbar } from '@21st-extension/toolbar-react';
import { ReactPlugin } from '@21st-extension/react';
import AlchemyInterface from './components/AlchemyInterface';
import ToolbarStatus from './components/ToolbarStatus';
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

      {/* Main Content - AlchemyInterface */}
      <AlchemyInterface />
    </div>
  );
}

export default App; 