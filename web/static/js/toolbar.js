// Injects the 21st Dev Toolbar into the page
document.addEventListener('DOMContentLoaded', () => {
    // Create the toolbar container
    const toolbar = document.createElement('div');
    toolbar.className = 'dev-toolbar';

    // Add branding
    const brand = document.createElement('div');
    brand.className = 'dev-toolbar-brand';
    brand.textContent = '21st Dev Toolbar';
    toolbar.appendChild(brand);

    // Add to the body
    document.body.appendChild(toolbar);
});