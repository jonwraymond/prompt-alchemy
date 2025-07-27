# StatusIndicator Tooltip Debugging Guide

## Current Status

I've implemented tooltips for the StatusIndicator component with the following features:
- Hover tooltips (200ms delay)
- Click tooltips (toggle on/off)
- Portal-based rendering for proper positioning
- Debug console logging
- Accessibility support (keyboard navigation)

## Test Steps

1. **Open the app** at http://localhost:5174/
2. **Open browser DevTools** (F12) and go to Console tab
3. **Look for the debug component** in the top-left corner (green dot)
4. **Test the simple tooltip first**:
   - Hover over the green dot in the top-left
   - You should see "Test Tooltip - Working!"
   - This confirms tooltips can work in general

5. **Test StatusIndicator tooltips**:
   - Look at bottom-right corner for StatusIndicator
   - Click the main dot to expand (shows 4 system dots)
   - Hover over any system dot for 200ms
   - OR click any system dot

## Expected Console Output

When hovering/clicking dots, you should see:
```
[StatusIndicator] Mouse enter on api
[StatusIndicator] Showing tooltip for api
[StatusIndicator] Tooltip position calculated: {x: 123, y: 456}
[StatusIndicator] Tooltip state changed: {activeTooltip: "api", ...}
```

## Troubleshooting Checklist

### 1. Check if dots are interactive
- Can you click the main dot to expand?
- Do individual dots change on hover?
- Do you see console logs when interacting?

### 2. Check DOM for tooltip element
In DevTools Elements tab, search for:
- `status-tooltip-portal` (the tooltip container)
- `tooltip-api` (specific tooltip IDs)

### 3. Check CSS issues
- Is z-index being applied? (should be 9999)
- Is position:fixed working?
- Are there any parent overflow:hidden styles?

### 4. Check JavaScript errors
Look for any errors in console that might prevent tooltip rendering

## Common Issues & Solutions

### Issue: Tooltips not visible but logs show they're active
**Cause**: CSS positioning or z-index issues
**Solution**: Check computed styles on `.status-tooltip-portal`

### Issue: No console logs when hovering
**Cause**: Event handlers not attached properly
**Solution**: Check if component re-rendered and lost handlers

### Issue: Tooltip appears but immediately disappears
**Cause**: Mouse leave firing too quickly
**Solution**: Check pointer-events CSS property

### Issue: Click works but hover doesn't
**Cause**: Hover delay timeout being cleared
**Solution**: Check timeout handling in mouse events

## Next Steps

1. Test the simple debug tooltip first (top-left green dot)
2. If that works, test StatusIndicator tooltips
3. Check console for any errors or unexpected behavior
4. Use Elements tab to inspect tooltip DOM structure
5. Report back with findings

## Clean Up

After debugging, remove the debug component:
1. Remove `TooltipDebug` import from AlchemyInterface.tsx
2. Remove `<TooltipDebug />` from render
3. Delete src/components/TooltipDebug.tsx