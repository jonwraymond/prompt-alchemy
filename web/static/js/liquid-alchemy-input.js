/**
 * Liquid Alchemy Input Component
 * Enhanced with magical liquid effects and transparency
 */

class LiquidAlchemyInput {
  constructor(container) {
    this.container = container;
    this.mouseX = 0;
    this.mouseY = 0;
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.startAnimations();
  }

  render() {
    this.container.innerHTML = `
      <div class="liquid-alchemy-wrapper">
        <div class="liquid-input-container" id="liquid-container">
          <!-- Alchemy Icons -->
          <div class="alchemy-icons">
            ${window.getIcon ? window.getIcon('science') : ''}
            ${window.getIcon ? window.getIcon('crystal') : ''}
            ${window.getIcon ? window.getIcon('sparkle') : ''}
          </div>
          
          <!-- Main Input -->
          <textarea 
            class="liquid-alchemy-input" 
            id="liquid-input"
            placeholder="Transmute your ideas into powerful prompts..."
            rows="3"
          ></textarea>
          
          <!-- Controls -->
          <div class="liquid-controls">
            <button class="liquid-generate-btn" id="liquid-generate">
              ${window.getIcon ? window.getIcon('transmute', 'btn-icon') : ''}
              <span>Transmute</span>
              ${window.getIcon ? window.getIcon('wand', 'btn-icon') : ''}
            </button>
            
            <div class="liquid-extra-controls">
              <button class="liquid-icon-btn" title="Add Attachment">
                ${window.getIcon ? window.getIcon('attach', 'btn-icon') : ''}
              </button>
              <button class="liquid-icon-btn" title="Advanced Options">
                ${window.getIcon ? window.getIcon('settings', 'btn-icon') : ''}
              </button>
              <button class="liquid-icon-btn" title="Alchemy Presets">
                ${window.getIcon ? window.getIcon('science', 'btn-icon') : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const container = document.getElementById('liquid-container');
    const input = document.getElementById('liquid-input');
    const generateBtn = document.getElementById('liquid-generate');

    // Mouse tracking for cursor glow effect
    const wrapper = document.querySelector('.liquid-alchemy-wrapper');
    
    const updateCursorGlow = (e, element) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update CSS variables for glow position
      element.style.setProperty('--cursor-x', `${x}px`);
      element.style.setProperty('--cursor-y', `${y}px`);
    };
    
    wrapper.addEventListener('mousemove', (e) => {
      updateCursorGlow(e, wrapper);
    });
    
    container.addEventListener('mousemove', (e) => {
      updateCursorGlow(e, container);
      
      // Also update wrapper glow when hovering container
      updateCursorGlow(e, wrapper);
    });

    // Ripple effect on click
    container.addEventListener('click', (e) => {
      if (e.target === container) {
        this.createRipple(e);
      }
    });

    // Auto-resize textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = input.scrollHeight + 'px';
    });

    // Generate button click
    generateBtn.addEventListener('click', () => {
      this.handleGenerate();
    });

    // Enter key to submit
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleGenerate();
      }
    });

    // Focus effects
    input.addEventListener('focus', () => {
      container.classList.add('focused');
    });

    input.addEventListener('blur', () => {
      container.classList.remove('focused');
    });
  }

  createRipple(e) {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const ripple = document.createElement('div');
    const size = 50;
    
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    
    container.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  }

  handleGenerate() {
    const input = document.getElementById('liquid-input');
    const value = input.value.trim();
    
    if (!value) {
      this.showNotification('Please enter a prompt to transmute');
      return;
    }

    console.log('🎯 Transmute button clicked');
    console.log('Input value:', value);

    // Create magical animation
    this.showTransmutationEffect();
    
    // Get the form and submit it
    const form = document.getElementById('generate-form');
    console.log('Form found:', !!form);
    
    if (form) {
      // Copy value to hidden form
      const hiddenInput = form.querySelector('#input');
      console.log('Hidden input found:', !!hiddenInput);
      
      if (hiddenInput) {
        hiddenInput.value = value;
        console.log('Value copied to hidden input');
        
        // Submit form using htmx
        console.log('Triggering htmx submit...');
        htmx.trigger(form, 'submit');
        
        // Show success notification
        setTimeout(() => {
          this.showNotification('✨ Transmuting your prompt...');
        }, 100);
      } else {
        console.error('❌ Hidden input not found');
      }
    } else {
      console.error('❌ Form not found');
    }
  }

  showTransmutationEffect() {
    const container = document.getElementById('liquid-container');
    container.classList.add('transmuting');
    
    // Create magical particles
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        this.createMagicalParticle();
      }, i * 50);
    }
    
    setTimeout(() => {
      container.classList.remove('transmuting');
    }, 2000);
  }

  createMagicalParticle() {
    const container = document.getElementById('liquid-container');
    const particle = document.createElement('div');
    particle.className = 'magical-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 0.5 + 's';
    particle.innerHTML = window.getIcon ? window.getIcon('sparkle', 'magical-particle-icon') : '✨';
    
    container.appendChild(particle);
    
    setTimeout(() => particle.remove(), 2000);
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'liquid-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(251, 191, 36, 0.9);
      color: white;
      padding: 1rem 2rem;
      border-radius: 12px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.3s ease;
      z-index: 1000;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideDown 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  startAnimations() {
    // Rotating border gradient
    let angle = 0;
    setInterval(() => {
      angle = (angle + 1) % 360;
      const container = document.getElementById('liquid-container');
      if (container) {
        container.style.setProperty('--angle', `${angle}deg`);
      }
    }, 50);
  }
}

// Animation keyframes
const existingStyles = document.querySelector('#liquid-alchemy-animation-styles');
if (!existingStyles) {
  const animationStyles = document.createElement('style');
  animationStyles.id = 'liquid-alchemy-animation-styles';
  animationStyles.textContent = `
    @keyframes slideUp {
      from { transform: translate(-50%, 100%); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    
    @keyframes slideDown {
      from { transform: translate(-50%, 0); opacity: 1; }
      to { transform: translate(-50%, 100%); opacity: 0; }
    }
    
    .magical-particle {
      position: absolute;
      bottom: 0;
      font-size: 1.5rem;
      animation: floatUp 2s ease-out forwards;
      pointer-events: none;
    }
    
    @keyframes floatUp {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(-200px) rotate(360deg);
        opacity: 0;
      }
    }
    
    .liquid-input-container.transmuting {
      animation: pulse 0.5s ease infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
    
    .liquid-input-container.focused {
      box-shadow: 
        0 12px 48px rgba(251, 191, 36, 0.3),
        0 0 100px rgba(251, 191, 36, 0.1),
        inset 0 0 60px rgba(251, 191, 36, 0.05);
    }
  `;
  document.head.appendChild(animationStyles);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('alchemical-input-container');
  if (container) {
    new LiquidAlchemyInput(container);
  }
});