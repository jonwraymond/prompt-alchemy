import { useEffect } from 'react';
import { TwentyFirstToolbar, type ToolbarConfig } from '@21st-extension/toolbar-react';
import { ReactPlugin } from '@21st-extension/react';
import AlchemyInterface from './components/AlchemyInterface';
import './components/AIInputComponent.css';

// The toolbar config contract only carries the plugin list; lifecycle logging
// is done in the development-only effect below.
const toolbarConfig: ToolbarConfig = {
  plugins: [ReactPlugin],
};

function App() {
  // Log toolbar availability in development mode.
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('✅ 21st Toolbar Initialized Successfully');
      console.log('🔧 ReactPlugin loaded:', ReactPlugin);
    }
  }, []);

  return (
    <div className="App">
      {/* 21st.dev Toolbar - only in development mode */}
      {import.meta.env.DEV && (
        <TwentyFirstToolbar
          config={toolbarConfig}
        />
      )}



      {/* Main Content - AlchemyInterface */}
      <AlchemyInterface />
    </div>
  );
}

export default App; 