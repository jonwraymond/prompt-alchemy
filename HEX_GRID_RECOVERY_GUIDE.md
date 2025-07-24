# Hex Grid Recovery Guide

## Issue
The hex grid and header for Prompt Alchemy are not displaying properly.

## Recovery Steps Applied

### 1. Added Debug Script
Created `/web/static/js/hex-debug-fix.js` which:
- Diagnoses visibility issues for all key elements
- Forces elements to display if they're hidden
- Creates fallback hex nodes if none exist
- Provides debug functions in the browser console

### 2. Added Fix CSS
Created `/web/static/css/hex-grid-fix.css` which:
- Forces all key elements to display with `!important` rules
- Overrides any conflicting CSS
- Ensures proper sizing and positioning
- Provides debug borders option

### 3. Updated HTML Template
Modified `/web/templates/alchemy-index.html` to include:
- Missing `hex-flow-board.css` stylesheet
- Debug script `hex-debug-fix.js`
- Emergency fix CSS `hex-grid-fix.css`

## Browser Console Commands

Open your browser's developer console (F12) and run these commands:

```javascript
// Run full diagnostic
hexDebug.diagnose()

// Force all elements visible
hexDebug.forceDisplay()

// Reinitialize hex flow system
hexDebug.reinitialize()

// Create fallback nodes if needed
hexDebug.createFallback()

// Add debug borders to see element boundaries
document.body.classList.add('debug-borders')
```

## What to Check in Console

1. **Diagnostic Report** - Look for:
   - ❌ Red X marks indicate missing elements
   - ⚠️ Warning signs indicate hidden elements
   - Display/visibility/opacity values
   - Number of hex nodes found

2. **CSS Files** - Ensure all are loaded:
   - alchemy.css
   - modern-alchemy.css
   - hex-flow-board.css
   - hex-flow-board-unified.css

3. **JavaScript Initialization**:
   - `window.unifiedHexFlow` should be truthy
   - Look for any error messages

## Common Issues and Solutions

### Issue: "hex-flow-container not found"
**Solution**: The HTML structure is missing. Check that the server is rendering the template correctly.

### Issue: "No hex nodes found"
**Solution**: The JavaScript initialization failed. Try `hexDebug.reinitialize()` or `hexDebug.createFallback()`

### Issue: Elements exist but are invisible
**Solution**: CSS conflicts. The fix CSS should override these, but check for:
- `display: none`
- `visibility: hidden`
- `opacity: 0`
- Extremely small dimensions

### Issue: Console shows CSS files not loaded
**Solution**: Check your server's static file serving configuration.

## Permanent Fix

Once you identify the root cause:

1. Remove the emergency CSS by deleting this line from `alchemy-index.html`:
   ```html
   <link rel="stylesheet" href="/static/css/hex-grid-fix.css">
   ```

2. Fix the underlying issue (likely one of):
   - Missing CSS file reference
   - JavaScript initialization order
   - CSS rule conflicts
   - Server template rendering issue

3. Remove the debug script reference:
   ```html
   <script src="/static/js/hex-debug-fix.js" defer></script>
   ```

## Testing

After applying fixes:

1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Open developer console
3. Load the page
4. Check console for any errors
5. Run `hexDebug.diagnose()` to verify everything is working

## Expected Result

You should see:
- "Prompt Alchemy" header at the top
- AI thought process header below it
- Hex grid visualization with interconnected nodes
- No console errors 