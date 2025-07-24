// Header diagnostic script
console.log('🔍 Checking header content...');

document.addEventListener('DOMContentLoaded', function() {
    // Check for main header
    const mainHeader = document.querySelector('.main-header');
    const mainTitle = document.querySelector('.main-title');
    const mainSubtitle = document.querySelector('.main-subtitle');
    
    console.log('Main header element:', mainHeader);
    console.log('Main title element:', mainTitle);
    console.log('Main title text:', mainTitle ? mainTitle.textContent : 'NOT FOUND');
    console.log('Main subtitle text:', mainSubtitle ? mainSubtitle.textContent : 'NOT FOUND');
    
    // Check if there's any other h1 on the page
    const allH1s = document.querySelectorAll('h1');
    console.log('\nAll H1 elements on page:');
    allH1s.forEach((h1, index) => {
        console.log(`  H1 #${index + 1}: "${h1.textContent.trim()}" (class: ${h1.className})`);
    });
    
    // Check page title
    console.log('\nPage title:', document.title);
    
    // Force correct header text if wrong
    if (mainTitle && mainTitle.textContent !== 'Prompt Alchemy') {
        console.warn('⚠️ Wrong header text detected! Current:', mainTitle.textContent);
        console.log('Forcing correct header text...');
        mainTitle.textContent = 'Prompt Alchemy';
    }
    
    if (mainSubtitle && mainSubtitle.textContent !== 'Transform raw ideas into refined AI prompts') {
        console.warn('⚠️ Wrong subtitle text detected! Current:', mainSubtitle.textContent);
        mainSubtitle.textContent = 'Transform raw ideas into refined AI prompts';
    }
}); 