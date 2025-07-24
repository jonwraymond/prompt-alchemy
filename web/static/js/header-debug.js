// Header Debug Script
console.log('🔍 Header Debug Script Loaded');

document.addEventListener('DOMContentLoaded', function() {
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
    console.log('Letters found:', letters.length);
    
    // Check data attributes
    letters.forEach((letter, index) => {
        const dataLetter = letter.getAttribute('data-letter');
        console.log(`Letter ${index}: "${dataLetter}" - has data-letter: ${!!dataLetter}`);
    });
    
    // Test hover effect manually
    if (letters.length > 0) {
        console.log('Testing hover effect on first letter...');
        const firstLetter = letters[0];
        
        // Simulate hover
        firstLetter.dispatchEvent(new MouseEvent('mouseenter'));
        
        setTimeout(() => {
            console.log('Hover effect applied');
            firstLetter.dispatchEvent(new MouseEvent('mouseleave'));
        }, 1000);
    }
    
    // Add test button
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Rainbow Effect';
    testButton.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; padding: 10px; background: #333; color: white; border: none; border-radius: 5px; cursor: pointer;';
    testButton.onclick = function() {
        console.log('Manual test triggered');
        letters.forEach((letter, index) => {
            setTimeout(() => {
                letter.dispatchEvent(new MouseEvent('mouseenter'));
                setTimeout(() => {
                    letter.dispatchEvent(new MouseEvent('mouseleave'));
                }, 500);
            }, index * 200);
        });
    };
    document.body.appendChild(testButton);
    
    console.log('=== END HEADER DEBUG ===');
}); 