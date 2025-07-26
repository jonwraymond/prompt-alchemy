import React, { useRef, useEffect } from 'react';
import './HexagonGrid.css';

interface HexagonGridProps {
  className?: string;
}

export const HexagonGrid: React.FC<HexagonGridProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Hexagon drawing function
    const drawHexagon = (x: number, y: number, size: number, opacity: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = x + size * Math.cos(angle);
        const hy = y + size * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(hx, hy);
        } else {
          ctx.lineTo(hx, hy);
        }
      }
      ctx.closePath();
      
      // Gradient stroke
      const gradient = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
      gradient.addColorStop(0, `rgba(251, 191, 36, ${opacity * 0.3})`); // Gold
      gradient.addColorStop(0.5, `rgba(16, 185, 129, ${opacity * 0.2})`); // Emerald
      gradient.addColorStop(1, `rgba(139, 92, 246, ${opacity * 0.1})`); // Purple
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    // Animation variables
    let animationId: number;
    let time = 0;

    // Hexagon grid configuration
    const hexSize = 40;
    const hexSpacing = 80;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate grid dimensions
      const cols = Math.ceil(canvas.width / hexSpacing) + 2;
      const rows = Math.ceil(canvas.height / hexSpacing) + 2;
      
      // Draw hexagon grid
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Offset every other row for hexagonal pattern
          const xOffset = (row % 2) * (hexSpacing / 2);
          const x = col * hexSpacing + xOffset - hexSpacing;
          const y = row * hexSpacing * 0.75 - hexSpacing;
          
          // Calculate distance from center for wave effect
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          
          // Create wave effect
          const wave = Math.sin(distance * 0.01 + time * 0.02);
          const opacity = Math.max(0, 0.1 + wave * 0.15);
          
          // Vary size slightly
          const size = hexSize + wave * 5;
          
          if (opacity > 0.05) {
            drawHexagon(x, y, size, opacity);
          }
        }
      }
      
      time += 1;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className={`hexagon-grid ${className}`}>
      <canvas
        ref={canvasRef}
        className="hexagon-canvas"
      />
    </div>
  );
};

export default HexagonGrid;