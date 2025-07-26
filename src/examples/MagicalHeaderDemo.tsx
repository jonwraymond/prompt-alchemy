import React, { useState } from 'react';
import MagicalHeader from '../components/MagicalHeader';

const MagicalHeaderDemo: React.FC = () => {
  const [customTitle, setCustomTitle] = useState('PROMPT ALCHEMY');
  const [customSubtitle, setCustomSubtitle] = useState('Transform raw ideas into refined AI prompts');
  const [showControls, setShowControls] = useState(false);

  const headerVariants = [
    {
      title: 'PROMPT ALCHEMY',
      subtitle: 'Transform raw ideas into refined AI prompts'
    },
    {
      title: 'MAGICAL TRANSFORMATION',
      subtitle: 'Where words become golden spells'
    },
    {
      title: 'ALCHEMICAL WISDOM',
      subtitle: 'Ancient knowledge meets modern AI'
    },
    {
      title: 'SPARKLE & SHINE',
      subtitle: 'Interactive magic at your fingertips'
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f0f10 0%, #1a1a1c 50%, #0f0f10 100%)',
      padding: '2rem',
      color: '#d4d4d8',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Demo Controls */}
        <div style={{ 
          marginBottom: '2rem',
          padding: '1rem',
          background: 'rgba(42, 42, 44, 0.5)',
          borderRadius: '12px',
          border: '1px solid rgba(251, 191, 36, 0.2)'
        }}>
          <button
            onClick={() => setShowControls(!showControls)}
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              color: '#000',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: showControls ? '1rem' : '0'
            }}
          >
            {showControls ? 'Hide' : 'Show'} Demo Controls
          </button>

          {showControls && (
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fbbf24' }}>
                  Custom Title:
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(26, 26, 28, 0.8)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fbbf24' }}>
                  Custom Subtitle:
                </label>
                <input
                  type="text"
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(26, 26, 28, 0.8)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Demo Header */}
        <MagicalHeader 
          title={customTitle}
          subtitle={customSubtitle}
        />

        {/* Header Variants */}
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '2rem',
            color: '#fbbf24',
            fontSize: '2rem'
          }}>
            Header Variants
          </h2>
          
          <div style={{ display: 'grid', gap: '2rem' }}>
            {headerVariants.map((variant, index) => (
              <div key={index} style={{ 
                padding: '1rem',
                background: 'rgba(42, 42, 44, 0.3)',
                borderRadius: '12px',
                border: '1px solid rgba(251, 191, 36, 0.1)'
              }}>
                <MagicalHeader 
                  title={variant.title}
                  subtitle={variant.subtitle}
                  className="variant-header"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Feature Showcase */}
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '2rem',
            color: '#fbbf24',
            fontSize: '2rem'
          }}>
            Magical Features
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
          }}>
            <div style={{ 
              padding: '1.5rem',
              background: 'rgba(42, 42, 44, 0.5)',
              borderRadius: '12px',
              border: '1px solid rgba(251, 191, 36, 0.2)'
            }}>
              <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>✨ Sparkle Effects</h3>
              <p>Move your cursor over the header to create magical sparkles. Each letter interaction generates unique sparkle patterns.</p>
            </div>
            
            <div style={{ 
              padding: '1.5rem',
              background: 'rgba(42, 42, 44, 0.5)',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <h3 style={{ color: '#3b82f6', marginBottom: '1rem' }}>🎯 Cursor Tracking</h3>
              <p>A glowing orb follows your cursor, creating a magical trail effect as you move around the header.</p>
            </div>
            
            <div style={{ 
              padding: '1.5rem',
              background: 'rgba(42, 42, 44, 0.5)',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>🔮 Wand Wave</h3>
              <p>Click anywhere on the header to create a burst of sparkles, simulating a magical wand wave effect.</p>
            </div>
            
            <div style={{ 
              padding: '1.5rem',
              background: 'rgba(42, 42, 44, 0.5)',
              borderRadius: '12px',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <h3 style={{ color: '#8b5cf6', marginBottom: '1rem' }}>☉ Alchemical Symbols</h3>
              <p>Floating alchemical symbols (☉☽♄♃♂♀) create an ancient mystical atmosphere in the background.</p>
            </div>
            
            <div style={{ 
              padding: '1.5rem',
              background: 'rgba(42, 42, 44, 0.5)',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>🌟 Letter Interactions</h3>
              <p>Hover over individual letters to see them glow, scale, and create localized sparkle effects.</p>
            </div>
            
            <div style={{ 
              padding: '1.5rem',
              background: 'rgba(42, 42, 44, 0.5)',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}>
              <h3 style={{ color: '#f59e0b', marginBottom: '1rem' }}>🎨 Responsive Design</h3>
              <p>Fully responsive with smooth animations that adapt to different screen sizes and accessibility preferences.</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ 
          marginTop: '3rem',
          padding: '2rem',
          background: 'rgba(251, 191, 36, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(251, 191, 36, 0.3)'
        }}>
          <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>How to Interact:</h3>
          <ul style={{ 
            lineHeight: '1.6',
            color: '#a1a1aa',
            paddingLeft: '1.5rem'
          }}>
            <li><strong>Move your cursor</strong> over the header to create sparkles</li>
            <li><strong>Hover over letters</strong> to see them glow and sparkle</li>
            <li><strong>Click anywhere</strong> on the header for a wand wave effect</li>
            <li><strong>Use the controls above</strong> to customize the title and subtitle</li>
            <li><strong>Try different screen sizes</strong> to see the responsive design</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MagicalHeaderDemo; 