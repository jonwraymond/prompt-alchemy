#!/usr/bin/env python3
"""
Extract Mermaid diagrams from markdown files and save them as separate .mmd files
"""
import os
import re
import sys

def extract_mermaid_diagrams(input_file, output_dir):
    """Extract all mermaid diagrams from a markdown file"""
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Read the input file
    with open(input_file, 'r') as f:
        content = f.read()
    
    # Find all mermaid code blocks
    mermaid_pattern = r'```mermaid\n(.*?)\n```'
    diagrams = re.findall(mermaid_pattern, content, re.DOTALL)
    
    # Save each diagram
    base_name = os.path.splitext(os.path.basename(input_file))[0]
    diagram_files = []
    
    for i, diagram in enumerate(diagrams, 1):
        output_file = os.path.join(output_dir, f"{base_name}-diagram-{i}.mmd")
        with open(output_file, 'w') as f:
            f.write(diagram)
        diagram_files.append(output_file)
        print(f"Extracted diagram {i} to {output_file}")
    
    return diagram_files

def main():
    if len(sys.argv) < 2:
        print("Usage: extract-mermaid-diagrams.py <markdown-file> [output-dir]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "docs/assets/diagrams/mermaid"
    
    if not os.path.exists(input_file):
        print(f"Error: File {input_file} not found")
        sys.exit(1)
    
    diagram_files = extract_mermaid_diagrams(input_file, output_dir)
    print(f"\nExtracted {len(diagram_files)} diagrams")
    
    # Generate mmdc commands
    print("\nTo render these diagrams, run:")
    for file in diagram_files:
        svg_file = file.replace('.mmd', '.svg')
        print(f"mmdc -i {file} -o {svg_file} --theme default --backgroundColor transparent")

if __name__ == "__main__":
    main()