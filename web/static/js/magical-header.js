// Magical Header JavaScript - Liquid Gold Theme (Performance Optimized)

class MagicalHeader {
    constructor() {
        this.sparkles = [];
        this.mousePosition = { x: 0, y: 0 };
        this.isHovering = false;
        this.activeLetters = new Set();
        this.sparkleId = 0;
        this.animationFrame = null;
        // Only use gold for sparkles
        this.sparkleColor = '#fbbf24';
        this.init();
    }
    
    init() {
        this.header = document.querySelector('.magical-header');
        if (!this.header) {
            console.warn('Magical header not found');
            return;
        }
        this.createHeaderElements();
        this.setupEventListeners();
        this.startAnimation();
    }
    
    createHeaderElements() {
        // Create sparkles container
        this.sparklesContainer = document.createElement('div');
        this.sparklesContainer.className = 'sparkles-container';
        this.header.appendChild(this.sparklesContainer);
    }
    
    setupEventListeners() {
        // Letter hover events
        const letters = this.header.querySelectorAll('.magical-letter');
        letters.forEach((letter, index) => {
            letter.addEventListener('mouseenter', (e) => this.handleLetterHover(index, e));
            letter.addEventListener('mouseleave', () => this.handleLetterLeave(index));
        });
    }
    
    handleLetterHover(index, e) {
        this.activeLetters.add(index);
        const letter = e.currentTarget;
        letter.classList.add('active');
        // Create gold sparkles around the letter
        const rect = letter.getBoundingClientRect();
        const headerRect = this.header.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2 - headerRect.left;
        const centerY = rect.top + rect.height / 2 - headerRect.top;
        // Create a few subtle gold sparkles
        for (let i = 0; i < 2; i++) {
            setTimeout(() => {
                this.createSparkle(
                    centerX + (Math.random() - 0.5) * 24,
                    centerY + (Math.random() - 0.5) * 24
                );
            }, i * 40);
        }
    }
    
    handleLetterLeave(index) {
        this.activeLetters.delete(index);
        const letters = this.header.querySelectorAll('.magical-letter');
        if (letters[index]) {
            letters[index].classList.remove('active');
        }
    }
    
    createSparkle(x, y) {
        const sparkle = {
            id: this.sparkleId++,
            x: x,
            y: y,
            size: Math.random() * 6 + 6,
            color: this.sparkleColor,
            velocity: {
                x: (Math.random() - 0.5) * 1.5,
                y: -Math.random() * 1.5 - 0.5
            },
            life: 1,
            maxLife: Math.random() * 0.3 + 0.5
        };
        this.sparkles.push(sparkle);
        // Create DOM element
        const sparkleElement = document.createElement('div');
        sparkleElement.className = 'sparkle';
        sparkleElement.style.left = x + 'px';
        sparkleElement.style.top = y + 'px';
        sparkleElement.style.width = sparkle.size + 'px';
        sparkleElement.style.height = sparkle.size + 'px';
        sparkleElement.style.backgroundColor = sparkle.color;
        sparkleElement.style.opacity = sparkle.life;
        sparkleElement.style.boxShadow = `0 0 8px 2px #fbbf24, 0 0 24px 4px #fbbf2455`;
        this.sparklesContainer.appendChild(sparkleElement);
        sparkle.element = sparkleElement;
    }
    
    startAnimation() {
        const animate = () => {
            // Update sparkles
            this.sparkles = this.sparkles.filter(sparkle => {
                sparkle.x += sparkle.velocity.x;
                sparkle.y += sparkle.velocity.y;
                sparkle.life -= 0.03;
                sparkle.velocity.y += 0.05; // Gravity
                if (sparkle.life > 0 && sparkle.element) {
                    sparkle.element.style.left = sparkle.x + 'px';
                    sparkle.element.style.top = sparkle.y + 'px';
                    sparkle.element.style.opacity = sparkle.life;
                    sparkle.element.style.transform = `scale(${sparkle.life})`;
                    return true;
                } else {
                    if (sparkle.element) {
                        sparkle.element.remove();
                    }
                    return false;
                }
            });
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }
    
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.sparkles.forEach(sparkle => {
            if (sparkle.element) {
                sparkle.element.remove();
            }
        });
        this.sparkles = [];
    }
}

// Initialize magical header when DOM is loaded
// (Header replacement logic unchanged)
document.addEventListener('DOMContentLoaded', () => {
    const existingHeader = document.querySelector('.main-header');
    if (existingHeader) {
        const titleElement = existingHeader.querySelector('.main-title');
        const subtitleElement = existingHeader.querySelector('.main-subtitle');
        const title = titleElement ? titleElement.textContent.trim() : 'PROMPT ALCHEMY';
        const subtitle = subtitleElement ? subtitleElement.textContent.trim() : 'Transform raw ideas into refined AI prompts';
        const magicalHeader = document.createElement('header');
        magicalHeader.className = 'magical-header';
        const magicalTitle = document.createElement('h1');
        magicalTitle.className = 'magical-title';
        title.split('').forEach((letter, index) => {
            const letterSpan = document.createElement('span');
            letterSpan.className = 'magical-letter';
            letterSpan.style.setProperty('--index', index);
            letterSpan.textContent = letter === ' ' ? '\u00A0' : letter;
            magicalTitle.appendChild(letterSpan);
        });
        const magicalSubtitle = document.createElement('p');
        magicalSubtitle.className = 'magical-subtitle';
        subtitle.split('').forEach((letter, index) => {
            const letterSpan = document.createElement('span');
            letterSpan.className = 'subtitle-letter';
            letterSpan.style.setProperty('--index', index);
            letterSpan.textContent = letter;
            magicalSubtitle.appendChild(letterSpan);
        });
        magicalHeader.appendChild(magicalTitle);
        magicalHeader.appendChild(magicalSubtitle);
        existingHeader.parentNode.replaceChild(magicalHeader, existingHeader);
        new MagicalHeader();
    }
}); 