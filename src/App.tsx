// import { TwentyFirstToolbar } from '@21st-extension/toolbar-react';
// import { ReactPlugin } from '@21st-extension/react';
import AlchemyInterface from './components/AlchemyInterface';
import './components/AIInputComponent.css';

function App() {
  return (
    <div className="App">
      {/* 21st.dev Toolbar - commented out to remove connection errors */}
      {/* {import.meta.env.DEV && (
        <TwentyFirstToolbar
          config={{
            plugins: [ReactPlugin],
            // Add debugging and activation options
            onInit: () => {
              console.log('✅ 21st Toolbar Initialized Successfully');
              console.log('🔧 ReactPlugin loaded:', ReactPlugin);
            },
            onError: (error: Error) => {
              console.error('❌ 21st Toolbar Error:', error);
            },
            onConnect: () => {
              console.log('🔗 21st Toolbar Connected to VSCode!');
            },
            onDisconnect: () => {
              console.log('🔌 21st Toolbar Disconnected from VSCode');
            }
          } as any}
        />
      )} */}



      {/* Main Content - AlchemyInterface */}
      <AlchemyInterface />
    </div>
  );
}

export default App; 