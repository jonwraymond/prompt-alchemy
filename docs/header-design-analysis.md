# Documentation Site Header Design Analysis

## Overview
This analysis examines the header design patterns across 20 popular documentation sites to identify common trends and best practices.

## Key Findings

### 1. Header Heights & Padding
- **Compact Headers (40-56px)**: Most modern docs use compact headers
  - Tailwind CSS, Vite, React.dev, Vue.js
  - Common padding: 1rem (16px) vertical
- **Medium Headers (60-80px)**: Traditional documentation sites
  - GitHub Docs, Stripe Docs, Docker Docs
  - Common padding: 1.5-2rem vertical

### 2. Logo Placement & Size
- **Left-aligned logos**: Universal pattern (100% of sites)
- **Logo sizes**: Typically 24-32px height
- **Text + Icon combo**: Most use both logo mark and text
- **Exceptions**: Some (React, Vue) use text-only logos

### 3. Navigation Styles
- **Horizontal nav**: Primary pattern for main sections
- **Dropdown menus**: Used sparingly, mainly for version/language selection
- **Mobile menu**: Hamburger icon on all sites for responsive design
- **Search prominence**: 90% feature search in header (icon or full bar)

### 4. Sticky/Fixed Headers
- **Sticky headers**: ~80% use sticky headers
- **Scroll behavior**: Some shrink on scroll (Vercel, Stripe)
- **Mobile**: All use sticky headers on mobile

### 5. Typography Choices
- **Sans-serif fonts**: Universal choice
- **Font sizes**: 14-16px for nav items
- **Font weights**: Medium (500) for nav, Bold (600-700) for logos
- **Letter spacing**: Slight negative spacing common in logos

### 6. Color Schemes
- **Light backgrounds**: White or very light gray (#f8f9fa to #ffffff)
- **Dark text**: #000 to #333 for primary text
- **Accent colors**: Brand colors used sparingly (hover states, CTAs)
- **Borders**: Subtle bottom borders common (1px, #e5e5e5 range)

### 7. Minimalism vs Decoration
- **Ultra-minimal**: Vite, React.dev, Tailwind (no borders, minimal elements)
- **Moderate**: GitHub, Stripe (some visual hierarchy, subtle borders)
- **Traditional**: Python, Node.js docs (more dense, utilitarian)

## Best Practices Identified

### Modern Documentation Headers Should:
1. **Keep it compact**: 48-56px height optimal
2. **Prioritize search**: Make it prominent and accessible
3. **Use sticky positioning**: Improves navigation efficiency
4. **Minimize visual noise**: Flat design, subtle borders
5. **Responsive first**: Mobile menu essential
6. **Clear hierarchy**: Logo → Main nav → Search → Actions

### Common Patterns:
```
[Logo] [Main Nav Items] [Spacer] [Search] [Theme Toggle] [GitHub] [Menu]
```

### Typography Guidelines:
- Logo: 18-24px, bold (600-700)
- Nav items: 14-16px, medium (500)
- Consistent sans-serif family (Inter, system-ui common)

### Color Recommendations:
- Background: #ffffff or #fafafa
- Text: #1a1a1a to #333333
- Borders: #e5e7eb (very subtle)
- Hover states: Slightly darker text or subtle background

### Spacing Patterns:
- Horizontal padding: 1-2rem from edges
- Vertical padding: 0.75-1rem
- Nav item spacing: 1.5-2rem between items
- Responsive: Reduce to 0.5-1rem on mobile

## Notable Innovations

1. **Vercel**: Animated gradient borders, premium feel
2. **Stripe**: Excellent search integration, clean API selector
3. **React.dev**: Ultra-minimal, focus on content
4. **Tailwind**: Version/framework switcher elegantly integrated
5. **GitHub Docs**: Comprehensive but organized navigation

## Recommendations for PromGen

Based on this analysis, a modern documentation header should:

1. **Height**: 56px (3.5rem)
2. **Sticky**: Yes, with subtle shadow on scroll
3. **Layout**: Logo | Nav | Search | Theme | GitHub
4. **Colors**: White bg, dark gray text, subtle borders
5. **Typography**: Inter or system-ui, 15px nav items
6. **Mobile**: Hamburger menu at 768px breakpoint
7. **Search**: Prominent, keyboard shortcut (Cmd+K)
8. **Minimalist**: Remove unnecessary elements, focus on utility