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
  const activeSparkles = useRef<HTMLElement[]>([]);
  const currentLetterIndex = useRef<number>(-1);

  // Gradually fade out existing sparkles
  const fadeOutActiveSparkles = useCallback(() => {
    activeSparkles.current.forEach(sparkle => {
      if (sparkle.parentNode) {
        // Add fade-out class for smooth transition
        sparkle.classList.add('sparkler-fade-out');
        // Remove after fade completes
        setTimeout(() => {
          if (sparkle.parentNode) {
            sparkle.parentNode.removeChild(sparkle);
          }
        }, 200);
      }
    });
    activeSparkles.current = [];
  }, []);

  // Single-letter sparkle effect with animation cancellation
  const createSparkle = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
    if (!headerRef.current) return;
    
    const letterIndex = parseInt(e.currentTarget.getAttribute('data-index') || '0');
    
    // If moving to a different letter, fade out previous sparkles
    if (currentLetterIndex.current !== letterIndex) {
      fadeOutActiveSparkles();
      currentLetterIndex.current = letterIndex;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const headerRect = headerRef.current.getBoundingClientRect();
    
    // Create 2-3 sparkles + electric crackles for the current letter
    const sparkleCount = Math.floor(Math.random() * 2) + 2;
    const crackleCount = Math.floor(Math.random() * 2) + 1; // 1-2 electric crackles
    
    // Create regular sparkles
    for (let i = 0; i < sparkleCount; i++) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (!headerRef.current || currentLetterIndex.current !== letterIndex) return;
          
          const sparkle = document.createElement('div');
          sparkle.className = 'sparkler-spark';
          
          // Create electric sparks with more dynamic colors
          const electricColors = ['#00ffff', '#0080ff', '#4040ff', '#8000ff', '#ff00ff', '#ffd700', '#ffeb3b', '#fff'];
          sparkle.style.background = electricColors[Math.floor(Math.random() * electricColors.length)];
          
          // Position relative to the letter
          const startX = rect.left - headerRect.left + rect.width / 2;
          const startY = rect.top - headerRect.top + rect.height / 2;
          
          // Random trajectory for sparkler effect
          const sparkX = (Math.random() - 0.5) * 25;
          const sparkY = -(Math.random() * 20 + 8);
          
          sparkle.style.left = `${startX}px`;
          sparkle.style.top = `${startY}px`;
          sparkle.style.setProperty('--spark-x', `${sparkX}px`);
          sparkle.style.setProperty('--spark-y', `${sparkY}px`);
          sparkle.style.animationDelay = `${Math.random() * 0.1}s`;
          
          headerRef.current.appendChild(sparkle);
          activeSparkles.current.push(sparkle);
          
          // Remove sparkle after animation completes
          setTimeout(() => {
            if (sparkle.parentNode) {
              sparkle.parentNode.removeChild(sparkle);
            }
            // Remove from active sparkles array
            const index = activeSparkles.current.indexOf(sparkle);
            if (index > -1) {
              activeSparkles.current.splice(index, 1);
            }
          }, 1000);
        }, i * 30);
      });
    }
    
    // Create electric crackle effects
    for (let i = 0; i < crackleCount; i++) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (!headerRef.current || currentLetterIndex.current !== letterIndex) return;
          
          const crackle = document.createElement('div');
          crackle.className = 'electric-crackle';
          
          // Position relative to the letter
          const startX = rect.left - headerRect.left + rect.width / 2;
          const startY = rect.top - headerRect.top + rect.height / 2;
          
          // Random electric bolt trajectory
          const crackleX = (Math.random() - 0.5) * 40;
          const crackleY = -(Math.random() * 30 + 10);
          
          crackle.style.left = `${startX}px`;
          crackle.style.top = `${startY}px`;
          crackle.style.setProperty('--crackle-x', `${crackleX}px`);
          crackle.style.setProperty('--crackle-y', `${crackleY}px`);
          crackle.style.animationDelay = `${Math.random() * 0.2}s`;
          
          headerRef.current.appendChild(crackle);
          activeSparkles.current.push(crackle);
          
          // Remove crackle after animation
          setTimeout(() => {
            if (crackle.parentNode) {
              crackle.parentNode.removeChild(crackle);
            }
            const index = activeSparkles.current.indexOf(crackle);
            if (index > -1) {
              activeSparkles.current.splice(index, 1);
            }
          }, 800);
        }, (i + sparkleCount) * 30);
      });
    }
  }, [fadeOutActiveSparkles]);

  return (
    <div ref={headerRef} className={`simple-header ${className}`}>
      <h1 className="main-title">
        {title.split('').map((letter, index) => (
          <span 
            key={index} 
            className="letter"
            data-letter={letter === ' ' ? '\u00A0' : letter}
            data-index={index}
            onMouseEnter={createSparkle}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
      </h1>
      <p className="main-subtitle">
        {subtitle.toUpperCase().split('').map((letter, index) => {
          // Calculate initial drop offset for animation
          const rand = Math.sin(index * 12.567) * 10000;
          const offset = (rand - Math.floor(rand)) * 2 - 1;
          const dropY = Math.round(Math.abs(offset) * 30 + 20); // 20-50px drop
          
          return (
            <span
              key={index}
              className="subtitle-letter"
              style={{
                '--drop-y': `${dropY}px`,
                '--drop-delay': `${index * 0.03}s`
              } as React.CSSProperties}
              data-letter={letter === ' ' ? '\u00A0' : letter}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          );
        })}
      </p>
    </div>
  );
};

export default SimpleHeader;