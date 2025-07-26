import React, { useRef, useCallback } from 'react';
import './SimpleHeader.css';

interface SimpleHeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

const FRAGMENT_RANGE = 16; // pixels - randomized offset range

function randomOffset(seed: number) {
  // Random but deterministic based on index seed.
  const rand = Math.sin(seed + 273.15) * 10000.0;
  return (rand - Math.floor(rand)) * 2 - 1; // [-1, 1]
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
    
    // Create 2-3 sparkles for the current letter
    const sparkleCount = Math.floor(Math.random() * 2) + 2;
    
    // Create sparkles
    for (let i = 0; i < sparkleCount; i++) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (!headerRef.current || currentLetterIndex.current !== letterIndex) return;
          
          const sparkle = document.createElement('div');
          sparkle.className = 'sparkler-spark';
          
          // Gold sparkle colors
          const goldColors = ['#ffd700', '#ffeb3b', '#ffe064', '#ffc02f', '#fff'];
          sparkle.style.background = goldColors[Math.floor(Math.random() * goldColors.length)];
          
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
  }, [fadeOutActiveSparkles]);

  return (
    <div ref={headerRef} className={`simple-header ${className}`}>
      <h1 className="main-title">
        {title.toUpperCase().split('').map((letter, index) => {
          // Compute deterministic falling offsets for each fragment
          const x = Math.round(randomOffset(index) * (FRAGMENT_RANGE/2));
          const y = Math.round(Math.abs(randomOffset(index + 43)) * FRAGMENT_RANGE);

          // Used for a randomized drop and staggered fragment separation
          const style: React.CSSProperties = {
            transform: `translate(${x}px, ${y}px)`,
            // This will be animated on hover via CSS vars
            '--fragment-seed': index,
          } as any;

          return (
            <span
              key={index}
              className="letter fragment"
              data-letter={letter === ' ' ? '\u00A0' : letter}
              data-index={index}
              style={style}
              onMouseEnter={createSparkle}
              tabIndex={-1}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          );
        })}
      </h1>
      <div className="main-subtitle">{subtitle}</div>
    </div>
  );
};

export default SimpleHeader;