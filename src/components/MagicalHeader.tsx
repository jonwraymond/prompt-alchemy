import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MagicalHeader.css';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  velocity: { x: number; y: number };
  life: number;
  maxLife: number;
}

interface MagicalHeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

const MagicalHeader: React.FC<MagicalHeaderProps> = ({
  title = "PROMPT ALCHEMY",
  subtitle = "Transform raw ideas into refined AI prompts",
  className = ""
}) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [activeLetters, setActiveLetters] = useState<Set<number>>(new Set());
  const headerRef = useRef<HTMLDivElement>(null);
  const sparkleIdRef = useRef(0);

  // Generate sparkle colors
  const sparkleColors = [
    '#fbbf24', // Liquid gold
    '#3b82f6', // Liquid blue
    '#10b981', // Liquid emerald
    '#8b5cf6', // Liquid purple
    '#ef4444', // Liquid red
    '#f59e0b', // Amber
    '#06b6d4', // Cyan
    '#84cc16', // Lime
  ];

  // Create a new sparkle
  const createSparkle = useCallback((x: number, y: number, isWand = false) => {
    const sparkle: Sparkle = {
      id: sparkleIdRef.current++,
      x,
      y,
      size: Math.random() * 8 + (isWand ? 12 : 4),
      color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
      velocity: {
        x: (Math.random() - 0.5) * 4 + (isWand ? (Math.random() - 0.5) * 8 : 0),
        y: -Math.random() * 3 - 1 + (isWand ? -Math.random() * 4 : 0)
      },
      life: 1,
      maxLife: Math.random() * 0.5 + 0.5 + (isWand ? 0.3 : 0)
    };
    
    setSparkles(prev => [...prev, sparkle]);
  }, []);

  // Handle mouse movement for cursor tracking
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!headerRef.current) return;
    
    const rect = headerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
    
    // Create sparkles on mouse movement (with reduced frequency)
    if (Math.random() < 0.1) {
      createSparkle(x, y);
    }
  }, [createSparkle]);

  // Handle mouse enter/leave
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setActiveLetters(new Set());
  }, []);

  // Handle letter hover
  const handleLetterHover = useCallback((index: number, e: React.MouseEvent) => {
    setActiveLetters(prev => new Set([...prev, index]));
    
    // Create sparkles around the letter
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    if (headerRef.current) {
      const headerRect = headerRef.current.getBoundingClientRect();
      const x = centerX - headerRect.left;
      const y = centerY - headerRect.top;
      
      // Create multiple sparkles around the letter
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          createSparkle(
            x + (Math.random() - 0.5) * 40,
            y + (Math.random() - 0.5) * 40
          );
        }, i * 50);
      }
    }
  }, [createSparkle]);

  // Handle letter leave
  const handleLetterLeave = useCallback((index: number) => {
    setActiveLetters(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  }, []);

  // Handle wand wave (click effect)
  const handleWandWave = useCallback((e: React.MouseEvent) => {
    if (!headerRef.current) return;
    
    const rect = headerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create a burst of sparkles
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        createSparkle(x, y, true);
      }, i * 30);
    }
  }, [createSparkle]);

  // Animate sparkles
  useEffect(() => {
    const animateSparkles = () => {
      setSparkles(prev => 
        prev
          .map(sparkle => ({
            ...sparkle,
            x: sparkle.x + sparkle.velocity.x,
            y: sparkle.y + sparkle.velocity.y,
            life: sparkle.life - 0.02,
            velocity: {
              ...sparkle.velocity,
              y: sparkle.velocity.y + 0.1 // Gravity
            }
          }))
          .filter(sparkle => sparkle.life > 0)
      );
    };

    const interval = setInterval(animateSparkles, 16); // ~60fps
    return () => clearInterval(interval);
  }, []);

  // Create periodic ambient sparkles
  useEffect(() => {
    if (!isHovering) return;
    
    const ambientInterval = setInterval(() => {
      if (headerRef.current && Math.random() < 0.3) {
        const rect = headerRef.current.getBoundingClientRect();
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        createSparkle(x, y);
      }
    }, 200);

    return () => clearInterval(ambientInterval);
  }, [isHovering, createSparkle]);

  return (
    <div 
      ref={headerRef}
      className={`magical-header ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleWandWave}
    >
      {/* Sparkles */}
      <div className="sparkles-container">
        {sparkles.map(sparkle => (
          <div
            key={sparkle.id}
            className="sparkle"
            style={{
              left: sparkle.x,
              top: sparkle.y,
              width: sparkle.size,
              height: sparkle.size,
              backgroundColor: sparkle.color,
              opacity: sparkle.life,
              transform: `scale(${sparkle.life}) rotate(${sparkle.id * 45}deg)`,
            }}
          />
        ))}
      </div>

      {/* Cursor glow effect */}
      <div 
        className="cursor-glow"
        style={{
          left: mousePosition.x - 50,
          top: mousePosition.y - 50,
          opacity: isHovering ? 0.3 : 0
        }}
      />

      {/* Main title */}
      <h1 className="magical-title">
        {title.split('').map((letter, index) => (
          <span
            key={index}
            className={`magical-letter ${activeLetters.has(index) ? 'active' : ''}`}
            style={{ '--index': index } as React.CSSProperties}
            onMouseEnter={(e) => handleLetterHover(index, e)}
            onMouseLeave={() => handleLetterLeave(index)}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
      </h1>

      {/* Subtitle */}
      <p className="magical-subtitle">
        {subtitle.split('').map((letter, index) => (
          <span
            key={index}
            className="subtitle-letter"
            style={{ '--index': index } as React.CSSProperties}
          >
            {letter}
          </span>
        ))}
      </p>

      {/* Alchemical symbols background */}
      <div className="alchemical-symbols">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="alchemical-symbol"
            style={{ '--delay': i * 0.5 } as React.CSSProperties}
          >
            {['☉', '☽', '♄', '♃', '♂', '♀'][i]}
          </div>
        ))}
      </div>

      {/* Magical particles */}
      <div className="magical-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{ '--delay': i * 0.2 } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
};

export default MagicalHeader; 