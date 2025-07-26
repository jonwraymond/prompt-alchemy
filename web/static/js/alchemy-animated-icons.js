/**
 * Alchemy Animated Icons System
 * Magical floating icons with alchemical symbols and animations
 */

class AlchemyAnimatedIcons {
  constructor() {
    // Alchemical symbols and their meanings
    this.alchemySymbols = [
      { symbol: '🜁', name: 'Fire', color: '#ff6b6b', animation: 'flame' },
      { symbol: '🜄', name: 'Water', color: '#4dabf7', animation: 'wave' },
      { symbol: '🜃', name: 'Earth', color: '#8b6914', animation: 'pulse' },
      { symbol: '🜂', name: 'Air', color: '#e8f5ff', animation: 'float' },
      { symbol: '☿', name: 'Mercury', color: '#c0c0c0', animation: 'orbit' },
      { symbol: '🜍', name: 'Sulfur', color: '#ffd43b', animation: 'glow' },
      { symbol: '🜔', name: 'Salt', color: '#ffffff', animation: 'shimmer' },
      { symbol: '⚗', name: 'Alembic', color: '#fab005', animation: 'bubble' },
      { symbol: '🝆', name: 'Philosopher Stone', color: '#ff006e', animation: 'transmute' },
      { symbol: '☽', name: 'Moon', color: '#dee2e6', animation: 'phase' },
      { symbol: '☉', name: 'Sun', color: '#ffd43b', animation: 'rotate' },
      { symbol: '♃', name: 'Jupiter', color: '#9775fa', animation: 'expand' }
    ];
    
    // Emoji alternatives for better browser support
    this.emojiIcons = [
      { emoji: '⚗️', name: 'Alchemy', animation: 'bubble' },
      { emoji: '🔮', name: 'Crystal Ball', animation: 'glow' },
      { emoji: '✨', name: 'Sparkles', animation: 'twinkle' },
      { emoji: '🌟', name: 'Star', animation: 'pulse' },
      { emoji: '💫', name: 'Dizzy', animation: 'orbit' },
      { emoji: '🧪', name: 'Test Tube', animation: 'shake' },
      { emoji: '🌙', name: 'Moon', animation: 'phase' },
      { emoji: '🌞', name: 'Sun', animation: 'rotate' },
      { emoji: '🪄', name: 'Magic Wand', animation: 'wave' },
      { emoji: '🍃', name: 'Leaf', animation: 'float' },
      { emoji: '🔥', name: 'Fire', animation: 'flame' },
      { emoji: '💎', name: 'Gem', animation: 'shimmer' }
    ];
    
    this.init();
  }
  
  init() {
    this.injectStyles();
    this.enhanceExistingIcons();
    this.createFloatingIcons();
    this.setupInteractions();
  }
  
  injectStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      /* Alchemy Icon Animations */
      @keyframes alchemyFloat {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-10px) rotate(5deg); }
        75% { transform: translateY(10px) rotate(-5deg); }
      }
      
      @keyframes alchemyGlow {
        0%, 100% { 
          filter: drop-shadow(0 0 10px currentColor);
          opacity: 0.8;
        }
        50% { 
          filter: drop-shadow(0 0 20px currentColor) drop-shadow(0 0 30px currentColor);
          opacity: 1;
        }
      }
      
      @keyframes alchemyPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }
      
      @keyframes alchemyOrbit {
        from { transform: rotate(0deg) translateX(20px) rotate(0deg); }
        to { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
      }
      
      @keyframes alchemyFlame {
        0%, 100% { transform: scaleY(1) translateY(0); }
        25% { transform: scaleY(1.2) translateY(-5px); }
        75% { transform: scaleY(0.8) translateY(5px); }
      }
      
      @keyframes alchemyWave {
        0%, 100% { transform: translateX(0) rotate(0deg); }
        25% { transform: translateX(-10px) rotate(-10deg); }
        75% { transform: translateX(10px) rotate(10deg); }
      }
      
      @keyframes alchemyBubble {
        0% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-20px) scale(1.1); }
        100% { transform: translateY(-40px) scale(0); opacity: 0; }
      }
      
      @keyframes alchemyShimmer {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
      }
      
      @keyframes alchemyTwinkle {
        0%, 100% { opacity: 1; transform: rotate(0deg) scale(1); }
        25% { opacity: 0.4; transform: rotate(90deg) scale(0.8); }
        50% { opacity: 1; transform: rotate(180deg) scale(1.2); }
        75% { opacity: 0.6; transform: rotate(270deg) scale(0.9); }
      }
      
      @keyframes alchemyTransmute {
        0% { filter: hue-rotate(0deg); transform: scale(1); }
        100% { filter: hue-rotate(360deg); transform: scale(1); }
      }
      
      @keyframes alchemyPhase {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
      
      @keyframes alchemyExpand {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.5); opacity: 0.6; }
      }
      
      @keyframes alchemyShake {
        0%, 100% { transform: translateX(0) rotate(0deg); }
        10% { transform: translateX(-2px) rotate(-5deg); }
        20% { transform: translateX(2px) rotate(5deg); }
        30% { transform: translateX(-2px) rotate(-5deg); }
        40% { transform: translateX(2px) rotate(5deg); }
        50% { transform: translateX(0) rotate(0deg); }
      }
      
      /* Enhanced icon container */
      .alchemy-icons {
        position: absolute;
        top: 1rem;
        right: 1rem;
        display: flex;
        gap: 1rem;
        z-index: 10;
      }
      
      /* Individual icon styling */
      .alchemy-icon {
        font-size: 1.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        display: inline-block;
      }
      
      .alchemy-icon.animated {
        animation: alchemyFloat 3s ease-in-out infinite;
      }
      
      .alchemy-icon:hover {
        transform: scale(1.2) rotate(10deg);
      }
      
      /* Floating background icons */
      .floating-alchemy-icons {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
        overflow: hidden;
      }
      
      .floating-icon {
        position: absolute;
        opacity: 0.1;
        font-size: 2rem;
        animation: floatAcross 20s linear infinite;
      }
      
      @keyframes floatAcross {
        from {
          transform: translateX(-100px) translateY(100vh) rotate(0deg);
        }
        to {
          transform: translateX(calc(100vw + 100px)) translateY(-100px) rotate(360deg);
        }
      }
      
      /* Icon particle effects */
      .icon-particle {
        position: absolute;
        pointer-events: none;
        animation: particleFloat 2s ease-out forwards;
      }
      
      @keyframes particleFloat {
        0% {
          transform: translate(0, 0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(var(--dx), var(--dy)) scale(0);
          opacity: 0;
        }
      }
      
      /* Magical aura effect */
      .alchemy-icon::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 200%;
        height: 200%;
        transform: translate(-50%, -50%);
        background: radial-gradient(circle, 
          rgba(251, 191, 36, 0.2) 0%, 
          transparent 70%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }
      
      .alchemy-icon:hover::before {
        opacity: 1;
      }
    `;
    document.head.appendChild(styleSheet);
  }
  
  enhanceExistingIcons() {
    // Enhance the existing icons in the liquid input container
    const existingIcons = document.querySelectorAll('.alchemy-icon');
    existingIcons.forEach((icon, index) => {
      icon.classList.add('animated');
      
      // Add specific animations based on icon
      const animations = ['float', 'glow', 'pulse', 'orbit', 'twinkle'];
      const randomAnimation = animations[index % animations.length];
      icon.style.animation = `alchemy${randomAnimation.charAt(0).toUpperCase() + randomAnimation.slice(1)} ${2 + Math.random() * 2}s ease-in-out infinite`;
      icon.style.animationDelay = `${index * 0.2}s`;
      
      // Add click interaction
      icon.addEventListener('click', (e) => {
        this.createIconBurst(e);
      });
      
      // Add hover particles
      icon.addEventListener('mouseenter', (e) => {
        this.createHoverParticles(e.target);
      });
    });
  }
  
  createFloatingIcons() {
    const container = document.createElement('div');
    container.className = 'floating-alchemy-icons';
    
    // Create subtle floating background icons
    for (let i = 0; i < 5; i++) {
      const icon = document.createElement('span');
      icon.className = 'floating-icon';
      
      // Use a mix of symbols and emojis
      const allIcons = [...this.emojiIcons, ...this.alchemySymbols];
      const randomIcon = allIcons[Math.floor(Math.random() * allIcons.length)];
      icon.textContent = randomIcon.emoji || randomIcon.symbol;
      
      // Random positioning and timing
      icon.style.left = `${Math.random() * 100}%`;
      icon.style.animationDelay = `${Math.random() * 20}s`;
      icon.style.animationDuration = `${20 + Math.random() * 10}s`;
      icon.style.fontSize = `${1.5 + Math.random() * 1.5}rem`;
      icon.style.opacity = `${0.05 + Math.random() * 0.1}`;
      
      container.appendChild(icon);
    }
    
    document.body.appendChild(container);
  }
  
  createIconBurst(event) {
    const burst = 8;
    const icon = event.target;
    const rect = icon.getBoundingClientRect();
    
    for (let i = 0; i < burst; i++) {
      const particle = document.createElement('span');
      particle.className = 'icon-particle';
      particle.textContent = '✨';
      
      // Calculate spread
      const angle = (Math.PI * 2 * i) / burst;
      const velocity = 50 + Math.random() * 50;
      const dx = Math.cos(angle) * velocity;
      const dy = Math.sin(angle) * velocity;
      
      particle.style.setProperty('--dx', `${dx}px`);
      particle.style.setProperty('--dy', `${dy}px`);
      particle.style.left = `${rect.left + rect.width / 2}px`;
      particle.style.top = `${rect.top + rect.height / 2}px`;
      particle.style.position = 'fixed';
      
      document.body.appendChild(particle);
      
      setTimeout(() => particle.remove(), 2000);
    }
    
    // Add transmutation effect to clicked icon
    icon.style.animation = 'alchemyTransmute 1s ease-out, alchemyPulse 0.5s ease-out';
    setTimeout(() => {
      this.enhanceExistingIcons();
    }, 1000);
  }
  
  createHoverParticles(icon) {
    const particle = document.createElement('span');
    particle.className = 'icon-particle';
    particle.textContent = ['✨', '💫', '⭐'][Math.floor(Math.random() * 3)];
    
    const rect = icon.getBoundingClientRect();
    const offsetX = (Math.random() - 0.5) * 20;
    const offsetY = -Math.random() * 30;
    
    particle.style.setProperty('--dx', `${offsetX}px`);
    particle.style.setProperty('--dy', `${offsetY}px`);
    particle.style.left = `${rect.left + rect.width / 2}px`;
    particle.style.top = `${rect.top + rect.height / 2}px`;
    particle.style.position = 'fixed';
    particle.style.fontSize = '0.8rem';
    
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 2000);
  }
  
  setupInteractions() {
    // Add keyboard shortcut for magical transformation
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        this.performMagicalTransformation();
      }
    });
  }
  
  performMagicalTransformation() {
    const icons = document.querySelectorAll('.alchemy-icon');
    icons.forEach((icon, index) => {
      setTimeout(() => {
        // Change to a different magical symbol
        const newIcon = this.emojiIcons[Math.floor(Math.random() * this.emojiIcons.length)];
        icon.textContent = newIcon.emoji;
        icon.style.animation = `alchemyTransmute 1s ease-out`;
        
        // Create burst effect
        this.createIconBurst({ target: icon });
      }, index * 100);
    });
    
    // Reset after animation
    setTimeout(() => {
      this.enhanceExistingIcons();
    }, 2000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.alchemyIcons = new AlchemyAnimatedIcons();
  console.log('🧙‍♂️ Alchemy Animated Icons initialized!');
  console.log('Press Ctrl+Shift+M for magical transformation!');
});