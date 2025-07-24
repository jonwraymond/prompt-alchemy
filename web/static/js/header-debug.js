// Header Debug Script
console.log('🔍 Header Debug Script Loaded');

function debugHeader() {
    console.log('=== HEADER DEBUG ===');
    
    // Check if CSS is loaded
    const styleSheets = Array.from(document.styleSheets);
    const rainbowCSS = styleSheets.find(sheet => 
        sheet.href && sheet.href.includes('header-rainbow-glow.css')
    );
    console.log('Rainbow CSS loaded:', !!rainbowCSS);
    
    // Check header elements
    const mainTitle = document.querySelector('.main-title');
    const letters = document.querySelectorAll('.main-title .letter');
    
    console.log('Main title found:', !!mainTitle);
    console.log('Main title HTML:', mainTitle ? mainTitle.innerHTML.substring(0, 200) + '...' : 'NOT FOUND');
    console.log('Letters found:', letters.length);
    
    // Check data attributes
    letters.forEach((letter, index) => {
        const dataLetter = letter.getAttribute('data-letter');
        console.log(`Letter ${index}: "${dataLetter}" - has data-letter: ${!!dataLetter}`);
    });
    
    // If no letters found, try to create them
    if (letters.length === 0 && mainTitle) {
        console.log('No letters found, creating them...');
        const text = mainTitle.textContent.trim();
        mainTitle.innerHTML = '';
        
        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.className = 'letter';
            span.setAttribute('data-letter', char);
            span.style.setProperty('--index', index);
            span.textContent = char;
            mainTitle.appendChild(span);
        });
        
        console.log('Created', mainTitle.children.length, 'letter elements');
    }
    
    // Test hover effect manually
    const newLetters = document.querySelectorAll('.main-title .letter');
    if (newLetters.length > 0) {
        console.log('Testing hover effect on first letter...');
        const firstLetter = newLetters[0];
        
        // Simulate hover
        firstLetter.dispatchEvent(new MouseEvent('mouseenter'));
        
        setTimeout(() => {
            console.log('Hover effect applied');
            firstLetter.dispatchEvent(new MouseEvent('mouseleave'));
        }, 1000);
    }
    

    
    console.log('=== END HEADER DEBUG ===');
}

// Run debug on DOM ready
document.addEventListener('DOMContentLoaded', debugHeader);

// Also run after a delay to catch any late rendering
setTimeout(debugHeader, 1000);
setTimeout(debugHeader, 2000); 