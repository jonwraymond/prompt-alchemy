document.addEventListener('DOMContentLoaded', () => {
    const alchemyText = document.querySelector('.alchemy-text');
    const text = alchemyText.dataset.text;
    alchemyText.textContent = '';

    text.split('').forEach(char => {
        const letter = document.createElement('span');
        letter.className = 'letter';
        letter.textContent = char === ' ' ? '\u00A0' : char;
        alchemyText.appendChild(letter);
    });

    const container = document.querySelector('.alchemy-container');

    alchemyText.addEventListener('mousemove', (e) => {
        if (Math.random() > 0.95) {
            createParticle(e.clientX, e.clientY, container);
        }
    });
});

function createParticle(x, y, container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = Math.random() * 15 + 5;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    const rect = container.getBoundingClientRect();
    particle.style.left = `${x - rect.left}px`;
    particle.style.top = `${y - rect.top}px`;

    const animationDuration = Math.random() * 2 + 3;
    particle.style.animationDuration = `${animationDuration}s`;

    container.appendChild(particle);

    particle.addEventListener('animationend', () => {
        particle.remove();
    });
}
