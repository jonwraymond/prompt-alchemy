import React, { useState } from 'react';

const TestComponent: React.FC = () => {
  const [count, setCount] = useState(0);
  const [inputValue, setInputValue] = useState('');

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>21st.dev Toolbar Test Component</h1>
      <p>This component has interactive elements for the toolbar to work with.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Counter: {count}</h3>
        <button 
          onClick={() => setCount(count + 1)}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Increment
        </button>
        <button 
          onClick={() => setCount(0)}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Input Field</h3>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type something here..."
          style={{
            padding: '10px',
            width: '100%',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '16px'
          }}
        />
        <p>You typed: {inputValue}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Form Elements</h3>
        <select 
          style={{
            padding: '10px',
            marginRight: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        >
          <option value="">Select an option</option>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </select>

        <label style={{ marginRight: '10px' }}>
          <input type="checkbox" /> Check me
        </label>

        <label style={{ marginRight: '10px' }}>
          <input type="radio" name="radio" /> Radio 1
        </label>
        <label>
          <input type="radio" name="radio" /> Radio 2
        </label>
      </div>

      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        border: '1px solid #dee2e6'
      }}>
        <h3>Instructions for 21st.dev Toolbar</h3>
        <ol>
          <li>Look for the gray bar at the bottom of the page</li>
          <li>Click on the bar to activate the toolbar</li>
          <li>Try selecting different elements on this page</li>
          <li>Look for a prompt area or comment interface</li>
          <li>Check the browser console for any messages</li>
        </ol>
      </div>
    </div>
  );
};

export default TestComponent; 