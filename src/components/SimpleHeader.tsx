import React, { useRef, useCallback } from 'react';
import './SimpleHeader.css';

interface SimpleHeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export const SimpleHeader: React.FC<SimpleHeaderProps> = ({
  title = "PROMPT ALCHEMY",
  subtitle = "Transform raw ideas into refined AI prompts",
  className = ""
}) => {
  const headerRef = useRef<HTMLDivElement>(null);

  // Create sparkle effect on letter hover
  const createSparkle = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
    if (!headerRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const headerRect = headerRef.current.getBoundingClientRect();
    
    // Create 3-5 sparkles around the letter
    const sparkleCount = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < sparkleCount; i++) {
      setTimeout(() => {
        const sparkle = document.createElement('div');
        sparkle.className = 'magical-sparkle';
        sparkle.innerHTML = ['✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 4)];
        
        // Position relative to the letter
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 40;
        const x = rect.left - headerRect.left + rect.width / 2 + offsetX;
        const y = rect.top - headerRect.top + rect.height / 2 + offsetY;
        
        sparkle.style.left = `${x}px`;
        sparkle.style.top = `${y}px`;
        sparkle.style.animationDelay = `${Math.random() * 0.3}s`;
        
        headerRef.current.appendChild(sparkle);
        
        // Remove sparkle after animation
        setTimeout(() => {
          if (sparkle.parentNode) {
            sparkle.parentNode.removeChild(sparkle);
          }
        }, 1500);
      }, i * 100);
    }
  }, []);

  return (
    <div ref={headerRef} className={`simple-header ${className}`}>
      <h1 className="main-title">
        {title.split('').map((letter, index) => (
          <span 
            key={index} 
            className="letter"
            data-letter={letter === ' ' ? '\u00A0' : letter}
            onMouseEnter={createSparkle}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
      </h1>
      <p className="main-subtitle">{subtitle}</p>
    </div>
  );
};

export default SimpleHeader;