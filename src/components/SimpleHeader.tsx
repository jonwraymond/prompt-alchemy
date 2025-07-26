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
  const lastSparkleTime = useRef<{ [key: number]: number }>({});

  // Optimized sparkle effect with throttling
  const createSparkle = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
    if (!headerRef.current) return;
    
    const letterIndex = parseInt(e.currentTarget.getAttribute('data-index') || '0');
    const now = Date.now();
    
    // Throttle sparkles to max one per letter per 200ms
    if (lastSparkleTime.current[letterIndex] && now - lastSparkleTime.current[letterIndex] < 200) {
      return;
    }
    lastSparkleTime.current[letterIndex] = now;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const headerRect = headerRef.current.getBoundingClientRect();
    
    // Reduce sparkle count for smoother performance
    const sparkleCount = Math.floor(Math.random() * 2) + 2; // 2-3 sparkles instead of 3-5
    
    // Create sparkles with requestAnimationFrame for smooth performance
    for (let i = 0; i < sparkleCount; i++) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (!headerRef.current) return;
          
          const sparkle = document.createElement('div');
          sparkle.className = 'sparkler-spark';
          
          // Create the spark as a small glowing dot
          sparkle.style.background = ['#ffd700', '#ffeb3b', '#fff', '#ffa500', '#ffcc02'][Math.floor(Math.random() * 5)];
          
          // Position relative to the letter
          const startX = rect.left - headerRect.left + rect.width / 2;
          const startY = rect.top - headerRect.top + rect.height / 2;
          
          // Random trajectory for sparkler effect
          const sparkX = (Math.random() - 0.5) * 25; // Reduced spread
          const sparkY = -(Math.random() * 20 + 8); // Reduced range
          
          sparkle.style.left = `${startX}px`;
          sparkle.style.top = `${startY}px`;
          sparkle.style.setProperty('--spark-x', `${sparkX}px`);
          sparkle.style.setProperty('--spark-y', `${sparkY}px`);
          sparkle.style.animationDelay = `${Math.random() * 0.1}s`; // Reduced delay
          
          headerRef.current.appendChild(sparkle);
          
          // Remove sparkle after animation with cleanup check
          setTimeout(() => {
            if (sparkle.parentNode) {
              sparkle.parentNode.removeChild(sparkle);
            }
          }, 1200); // Shorter duration
        }, i * 50); // Reduced stagger
      });
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