import React from 'react';
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
  return (
    <div className={`simple-header ${className}`}>
      <h1 className="main-title">
        {title.split('').map((letter, index) => (
          <span 
            key={index} 
            className="letter"
            data-letter={letter === ' ' ? '\u00A0' : letter}
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