#!/bin/bash
# Script to render Mermaid diagrams to SVG for GitHub Pages

# This script requires mermaid-cli (mmdc) to be installed
# Install with: npm install -g @mermaid-js/mermaid-cli

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if mermaid-cli is installed
if ! command -v mmdc &> /dev/null; then
    echo -e "${RED}mermaid-cli (mmdc) is not installed.${NC}"
    echo "Install it with: npm install -g @mermaid-js/mermaid-cli"
    exit 1
fi

# Create assets directory if it doesn't exist
mkdir -p docs/assets/diagrams

echo -e "${GREEN}Rendering Mermaid diagrams to SVG...${NC}"

# Extract and render diagrams from docs/diagrams.md
cat docs/diagrams.md | awk '
/```mermaid/ {
    count++
    getline
    filename = "docs/assets/diagrams/diagram-" count ".mmd"
    print "Creating " filename
    while (getline && $0 != "```") {
        print > filename
    }
}
'

# Render all .mmd files to SVG
for file in docs/assets/diagrams/*.mmd; do
    if [ -f "$file" ]; then
        output="${file%.mmd}.svg"
        echo "Rendering $file to $output"
        mmdc -i "$file" -o "$output" --theme default --backgroundColor transparent
        rm "$file"  # Clean up temporary .mmd file
    fi
done

echo -e "${GREEN}Diagrams rendered successfully!${NC}"
echo "SVG files are in docs/assets/diagrams/"
echo "Update your markdown files to reference these SVG images instead of Mermaid blocks."