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