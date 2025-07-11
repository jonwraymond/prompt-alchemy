---
layout: default
title: Documentation Development
---

# Prompt Alchemy Documentation

This directory contains the documentation for Prompt Alchemy, hosted on GitHub Pages.

## Local Development

To run the documentation locally:

```bash
# Install Jekyll (if not already installed)
gem install bundler jekyll

# Navigate to docs directory
cd docs

# Install dependencies
bundle install

# Run local server
bundle exec jekyll serve

# Visit http://localhost:4000/prompt-alchemy/
```

## Structure

- `_config.yml` - Jekyll configuration
- `_layouts/` - Page layouts
- `_includes/` - Reusable components
- `index.md` - Home page
- `getting-started.md` - Quick start guide
- `installation.md` - Detailed installation
- `usage.md` - Command reference
- `architecture.md` - Technical details
- `api-reference.md` - API documentation

## Deployment

Documentation is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

## Contributing

When adding new documentation:

1. Create a new `.md` file
2. Add front matter with layout and title
3. Update navigation in `_config.yml`
4. Test locally before pushing

## Theme

Using Jekyll's minimal theme for clean, readable documentation.

## Diagrams

The documentation includes architecture diagrams. Since GitHub Pages doesn't support Mermaid diagrams directly, we use static SVG images:

1. Original Mermaid diagrams are stored in `diagrams-mermaid.md`
2. Static versions are in `diagrams.md` with SVG references
3. To regenerate diagrams:
   - Install mermaid-cli: `npm install -g @mermaid-js/mermaid-cli`
   - Run: `scripts/render-diagrams.sh`
   - Or manually extract and render with `scripts/extract-mermaid-diagrams.py`

The SVG diagrams are stored in `assets/diagrams/` for GitHub Pages compatibility.