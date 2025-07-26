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
        sparkle.className = 'sparkler-spark';
        
        // Create the spark as a small glowing dot
        sparkle.style.background = ['#ffd700', '#ffeb3b', '#fff', '#ffa500', '#ffcc02'][Math.floor(Math.random() * 5)];
        
        // Position relative to the letter
        const startX = rect.left - headerRect.left + rect.width / 2;
        const startY = rect.top - headerRect.top + rect.height / 2;
        
        // Random trajectory for sparkler effect
        const sparkX = (Math.random() - 0.5) * 30;
        const sparkY = -(Math.random() * 25 + 10); // Always upward
        
        sparkle.style.left = `${startX}px`;
        sparkle.style.top = `${startY}px`;
        sparkle.style.setProperty('--spark-x', `${sparkX}px`);
        sparkle.style.setProperty('--spark-y', `${sparkY}px`);
        sparkle.style.animationDelay = `${Math.random() * 0.2}s`;
        
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