# Semantic Tool Compliance Documentation

## Overview

This document describes the semantic tool compliance system implemented for the Prompt Alchemy project to enforce the AI Navigation & Memory Policy defined in CLAUDE.md.

## Purpose

The compliance system ensures that all code navigation, analysis, and memory operations use approved semantic tools:
- **Serena MCP**: Primary tool for project activation, symbol search, and memory CRUD operations
- **code2prompt CLI**: Codebase context generation for LLM prompts
- **ast-grep**: Structural pattern matching and code analysis
- **grep/ripgrep**: Only as a last resort with documented justification

## Components

### 1. Pre-commit Hook
**File**: `scripts/semantic-search-hooks/pre-commit-semantic-validation.sh`

Validates staged files before allowing commits by checking for:
- Direct file operations (cat, head, tail, less, more) on code files
- grep usage without attempting semantic tools first
- find command for code discovery
- Scripts that analyze code without using semantic tools

### 2. Compliance Validation Script
**File**: `scripts/semantic-search-hooks/validate-semantic-compliance.sh`

Comprehensive codebase audit that:
- Scans all code files for non-compliant patterns
- Generates detailed compliance reports
- Tracks violations and warnings
- Provides remediation recommendations

### 3. Setup Script
**File**: `scripts/setup-semantic-hooks.sh`

One-time installation script that:
- Installs pre-commit hooks
- Creates GitHub Actions workflow
- Adds Makefile targets
- Sets up exemptions file

### 4. GitHub Actions Workflow
**File**: `.github/workflows/semantic-compliance.yml`

Automated CI/CD validation that:
- Runs on all pull requests
- Validates semantic tool usage
- Comments on PRs with violations
- Uploads compliance reports as artifacts

## Usage

### Initial Setup
```bash
# Install compliance hooks
./scripts/setup-semantic-hooks.sh
```

### Manual Validation
```bash
# Run full codebase audit
./scripts/semantic-search-hooks/validate-semantic-compliance.sh

# Or use Makefile
make semantic-validate
```

### View Reports
```bash
# List compliance reports
ls -la reports/semantic-compliance/

# View latest report
cat reports/semantic-compliance/compliance-report-*.md | tail -1
```

### Add Exemptions
Edit `.semantic-exemptions` to add approved exceptions:
```
# Format: <file_pattern> <reason>
scripts/debug-helper.sh "Log analysis requires grep for error patterns"
```

## Enforcement Rules

### Prohibited Patterns
1. **Direct File Reading**: `cat`, `head`, `tail`, `less`, `more` on code files
2. **Direct grep Usage**: Without attempting semantic tools first
3. **find Command**: For code discovery instead of semantic search
4. **Manual Navigation**: Browsing code without semantic tools

### Required Patterns
1. **Serena Activation**: Start sessions with `activate_project`
2. **Semantic Search**: Use `find_symbol`, `search_for_pattern`
3. **Memory Operations**: Use `write_memory`, `read_memory`
4. **Context Generation**: Use `code2prompt` for LLM prompts

## Emergency Bypass

For critical hotfixes only (requires documentation):
```bash
# Bypass pre-commit hook
git commit --no-verify -m "EMERGENCY: [reason]"

# Must add exemption immediately after
echo "path/to/file 'Emergency fix - [ticket]'" >> .semantic-exemptions
```

## Compliance Metrics

The validation system tracks:
- Total files scanned
- Critical violations (blocking)
- Warnings (non-blocking)
- Compliance percentage
- Trend over time

## Integration Points

### Makefile
```bash
make semantic-validate     # Run validation
make setup-semantic-hooks  # Install hooks
```

### CI/CD Pipeline
- Pull requests automatically validated
- Compliance reports attached to PR
- Non-compliant PRs blocked from merging

### IDE Integration
- Pre-commit hooks work with all Git clients
- VS Code tasks available for validation
- IntelliJ IDEA git hooks supported

## Best Practices

1. **Always Start with Serena**: Activate project before any navigation
2. **Use Semantic Tools First**: Try Serena/ast-grep before falling back to grep
3. **Document Fallbacks**: If grep is necessary, add comment explaining why
4. **Review Reports**: Check compliance reports regularly
5. **Update Exemptions**: Keep exemptions file current with clear justifications

## Troubleshooting

### Hook Not Running
```bash
# Ensure hook is executable
chmod +x .git/hooks/pre-commit

# Check hook is linked correctly
ls -la .git/hooks/pre-commit
```

### False Positives
1. Check if pattern is in exemptions file
2. Verify the violation is actually non-compliant
3. Add exemption with clear justification

### Performance Issues
```bash
# Run validation in parallel mode
PARALLEL_SCAN=1 ./scripts/semantic-search-hooks/validate-semantic-compliance.sh
```

## Future Enhancements

1. **Automated Fixes**: Script to automatically replace non-compliant patterns
2. **IDE Plugins**: Real-time validation in editors
3. **Metrics Dashboard**: Web interface for compliance trends
4. **Learning Mode**: Suggest semantic tool alternatives based on context

## References

- [CLAUDE.md](../CLAUDE.md) - AI Navigation & Memory Policy
- [Serena MCP Documentation](https://github.com/serena/mcp)
- [code2prompt Documentation](https://github.com/mufeedvh/code2prompt)
- [ast-grep Documentation](https://ast-grep.github.io/)