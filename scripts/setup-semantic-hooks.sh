#!/bin/bash

# Setup script for semantic tool compliance hooks
# This script installs pre-commit hooks and validation tools

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}        Semantic Tool Compliance Hook Installation              ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "Error: Not in a git repository root directory"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Make hook scripts executable
chmod +x scripts/semantic-search-hooks/pre-commit-semantic-validation.sh
chmod +x scripts/semantic-search-hooks/validate-semantic-compliance.sh

# Install pre-commit hook
echo -e "${YELLOW}Installing pre-commit hook...${NC}"
cp scripts/semantic-search-hooks/pre-commit-semantic-validation.sh .git/hooks/pre-commit

# Create a composite pre-commit hook if one already exists
if [ -f .git/hooks/pre-commit.bak ]; then
    echo -e "${YELLOW}Existing pre-commit hook found. Creating composite hook...${NC}"
    
    # Create a new composite hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Composite pre-commit hook

# Run existing hook
if [ -f .git/hooks/pre-commit.bak ]; then
    .git/hooks/pre-commit.bak
    if [ $? -ne 0 ]; then
        exit 1
    fi
fi

# Run semantic validation hook
./scripts/semantic-search-hooks/pre-commit-semantic-validation.sh
exit $?
EOF
    chmod +x .git/hooks/pre-commit
else
    # Direct installation
    ln -sf ../../scripts/semantic-search-hooks/pre-commit-semantic-validation.sh .git/hooks/pre-commit
fi

# Create semantic exemptions file template
if [ ! -f .semantic-exemptions ]; then
    echo -e "${YELLOW}Creating semantic exemptions file...${NC}"
    cat > .semantic-exemptions << 'EOF'
# Semantic Tool Compliance Exemptions
# Add file patterns or specific violations that are approved exemptions
# Format: <file_pattern> <reason>
# Example: scripts/legacy/*.sh "Legacy scripts pending migration"

EOF
fi

# Create CI/CD validation workflow
echo -e "${YELLOW}Creating GitHub Actions workflow...${NC}"
mkdir -p .github/workflows

cat > .github/workflows/semantic-compliance.yml << 'EOF'
name: Semantic Tool Compliance Check

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches: [main, develop]

jobs:
  semantic-compliance:
    name: Validate Semantic Tool Usage
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup validation environment
      run: |
        chmod +x scripts/semantic-search-hooks/validate-semantic-compliance.sh
        mkdir -p reports/semantic-compliance
    
    - name: Run semantic compliance validation
      id: validation
      run: |
        ./scripts/semantic-search-hooks/validate-semantic-compliance.sh || echo "VALIDATION_FAILED=true" >> $GITHUB_ENV
    
    - name: Upload compliance report
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: semantic-compliance-report
        path: reports/semantic-compliance/
    
    - name: Comment PR with results
      if: github.event_name == 'pull_request' && env.VALIDATION_FAILED == 'true'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const report = fs.readFileSync('reports/semantic-compliance/compliance-report-*.md', 'utf8');
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: '## ❌ Semantic Tool Compliance Check Failed\n\n' + report
          });
    
    - name: Fail if non-compliant
      if: env.VALIDATION_FAILED == 'true'
      run: exit 1
EOF

# Add validation to Makefile
echo -e "${YELLOW}Adding validation target to Makefile...${NC}"
if ! grep -q "semantic-validate" Makefile; then
    cat >> Makefile << 'EOF'

# Semantic tool compliance validation
.PHONY: semantic-validate
semantic-validate:
	@echo "Running semantic tool compliance validation..."
	@chmod +x scripts/semantic-search-hooks/validate-semantic-compliance.sh
	@scripts/semantic-search-hooks/validate-semantic-compliance.sh

# Setup semantic hooks
.PHONY: setup-semantic-hooks
setup-semantic-hooks:
	@echo "Setting up semantic tool compliance hooks..."
	@chmod +x scripts/setup-semantic-hooks.sh
	@scripts/setup-semantic-hooks.sh
EOF
fi

# Create documentation
echo -e "${YELLOW}Creating documentation...${NC}"
cat > scripts/semantic-search-hooks/README.md << 'EOF'
# Semantic Tool Compliance Hooks

This directory contains hooks and scripts to enforce the AI Navigation & Memory Policy defined in CLAUDE.md.

## Overview

The semantic tool compliance system ensures that all code navigation, analysis, and memory operations use the approved semantic tools:
- **Serena MCP**: For project activation, symbol search, and memory CRUD
- **code2prompt CLI**: For codebase context generation
- **ast-grep**: For structural pattern matching
- **grep/ripgrep**: Only as a last resort with justification

## Components

### Pre-commit Hook
`pre-commit-semantic-validation.sh` - Validates staged files for compliance before allowing commits.

### Validation Script
`validate-semantic-compliance.sh` - Comprehensive codebase audit for non-compliant patterns.

### Setup Script
`setup-semantic-hooks.sh` - Installs hooks and configures the validation system.

## Usage

### Initial Setup
```bash
./scripts/setup-semantic-hooks.sh
```

### Manual Validation
```bash
./scripts/semantic-search-hooks/validate-semantic-compliance.sh
```

### Bypass Hook (Emergency Only)
```bash
git commit --no-verify -m "Emergency fix"
```

### Add Exemptions
Edit `.semantic-exemptions` to add approved exemptions with justification.

## Validation Rules

### Prohibited Patterns
- Direct file reading: `cat`, `head`, `tail`, `less`, `more` on code files
- Direct grep usage without semantic tool attempt
- `find` command for code discovery
- Manual file operations in code

### Required Patterns
- Serena MCP activation and usage
- code2prompt for context generation
- ast-grep for pattern matching
- Documented justification for grep usage

## Reports

Validation reports are saved to `reports/semantic-compliance/` with timestamps.

## CI/CD Integration

The system includes GitHub Actions workflow for automated PR validation.

## Troubleshooting

### False Positives
Add legitimate exceptions to `.semantic-exemptions` with clear justification.

### Hook Not Running
Ensure the hook is executable: `chmod +x .git/hooks/pre-commit`

### Performance Issues
The validation script can be run in parallel mode by setting `PARALLEL_SCAN=1`
EOF

echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo "Semantic tool compliance hooks have been installed:"
echo "- Pre-commit hook: Validates files before commit"
echo "- Validation script: Full codebase compliance audit"
echo "- GitHub Actions: Automated PR validation"
echo "- Makefile targets: make semantic-validate"
echo ""
echo "To run a compliance check now:"
echo -e "${BLUE}./scripts/semantic-search-hooks/validate-semantic-compliance.sh${NC}"
echo ""
echo "To temporarily bypass (not recommended):"
echo -e "${YELLOW}git commit --no-verify${NC}"