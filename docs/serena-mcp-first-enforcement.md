# Serena MCP-First Enforcement Documentation

## Overview

This document describes the enhanced Serena MCP-first enforcement system that ensures ALL code navigation, analysis, and memory operations use Serena MCP as the primary tool.

## Golden Rule

**NO project domain or code context exploration, structure mapping, or memory usage is allowed except via Serena MCP tools, unless and until explicit Serena error is logged, and then fallback is documented.**

## Enforcement Components

### 1. Enhanced Pre-commit Hook
**File**: `scripts/semantic-search-hooks/pre-commit-semantic-validation.sh`

#### Key Features:
- **Serena Activation Check**: Verifies all scripts start with `serena activate_project`
- **Operation Validation**: Checks every file operation for Serena usage
- **Fallback Documentation**: Requires `# SERENA_FALLBACK:` for any non-Serena operation
- **Critical Violations**: Blocks commits with Serena violations

#### Enforcement Rules:
```bash
# MANDATORY sequence for all operations:
serena activate_project .          # Always first
serena search_for_pattern "..."    # For searching
serena find_symbol "..."           # For symbol lookup
serena get_symbols_overview "..."  # For browsing
serena write_memory "..."          # For saving context
serena read_memory "..."           # For retrieving context
```

### 2. Serena-First Validator Script
**File**: `scripts/semantic-search-hooks/serena-first-validator.sh`

#### Validation Checks:
- Scripts must activate Serena within first 30 lines
- All file operations must show Serena attempt first
- Memory operations are Serena-only (no exceptions)
- Fallbacks require explicit error documentation

#### Running Validation:
```bash
# Run comprehensive Serena-first validation
make serena-validate

# Run all compliance checks
make compliance-check
```

### 3. Updated CLAUDE.md Policy

#### Core Requirements:
1. **SERENA MCP IS MANDATORY FOR ALL OPERATIONS**
2. **FALLBACK ONLY WITH EXPLICIT JUSTIFICATION**
3. **Direct file operations are BLOCKED without Serena failure**

#### Fallback Documentation Format:
```bash
# Attempt Serena first
serena search_for_pattern "handleRequest"

# If failed, document before fallback
# SERENA_FALLBACK: Connection refused after 3 retries (error: ECONNREFUSED)
ast-grep run -p 'func handleRequest' --lang go
```

### 4. GitHub Actions Workflow
**File**: `.github/workflows/serena-compliance.yml`

#### CI/CD Enforcement:
- Runs on all PRs and main branch pushes
- Validates Serena-first compliance
- Blocks merge if critical violations found
- Comments on PR with violation details
- Uploads compliance reports as artifacts

### 5. Orchestrator Agent Updates
**File**: `~/.claude/agents/orchestrator-agent.md`

#### Mandatory Workflow:
```bash
# Every orchestration MUST start with:
1. serena activate_project .
2. serena onboarding
3. serena get_symbols_overview .
4. serena search_for_pattern "main|app|index"
5. serena write_memory "orchestration-discovery" "[results]"
```

## Compliance Workflow Examples

### Example 1: Compliant Code Search
```bash
#!/bin/bash
# COMPLIANT: Proper Serena-first workflow

# Start with activation
serena activate_project .

# Use Serena for search
serena search_for_pattern "GeneratePrompt"

# Save results
serena write_memory "search-results" "Found 3 instances in engine.go"
```

### Example 2: Compliant with Fallback
```bash
#!/bin/bash
# COMPLIANT: Documented fallback after Serena failure

# Activate project
serena activate_project .

# Attempt search
serena find_symbol "handleAuth"
# SERENA_FALLBACK: Server returned 500 - Internal Server Error
# Falling back to ast-grep after Serena failure
ast-grep run -p 'func handleAuth' --lang go
```

### Example 3: NON-COMPLIANT (Blocked)
```bash
#!/bin/bash
# NON-COMPLIANT: Direct grep without Serena

# This will be BLOCKED by pre-commit hooks
grep -r "TODO" internal/
cat internal/engine/engine.go
```

## Exemption Process

### Adding Exemptions
Edit `.semantic-exemptions`:
```
# Format: <file_pattern> <reason>
scripts/semantic-search-hooks/*.sh "Validation scripts need grep to check violations"
```

### Emergency Override
```bash
# Only with manager approval and documentation
git commit --no-verify -m "EMERGENCY: [justification]"

# Must immediately add exemption
echo "path/to/file 'Emergency fix - [ticket]'" >> .semantic-exemptions
```

## Validation Commands

### Manual Validation
```bash
# Check Serena-first compliance
make serena-validate

# Check all semantic compliance
make compliance-check

# View reports
ls -la reports/serena-compliance/
```

### Pre-commit Testing
```bash
# Test hook on staged files
./scripts/semantic-search-hooks/pre-commit-semantic-validation.sh
```

## Metrics and Reporting

### Report Contents:
- Total files scanned
- Critical violations (operations without Serena)
- Documented fallbacks count
- Compliance percentage
- Required remediation actions

### Report Locations:
- `reports/serena-compliance/` - Serena-specific reports
- `reports/semantic-compliance/` - General compliance reports
- `/tmp/semantic-compliance-*.log` - Temporary validation logs
- `/tmp/semantic-fallback-*.log` - Fallback justification logs

## Best Practices

### Always Start with Serena
```bash
# Every script/session/workflow begins with:
serena activate_project .
```

### Document All Failures
```bash
# When Serena fails, always document:
# SERENA_FALLBACK: [specific error message and context]
```

### Use Serena for Memory
```bash
# Never use files/localStorage/other storage:
serena write_memory "context-key" "value"
serena read_memory "context-key"
```

### Batch Serena Operations
```bash
# Efficient Serena usage:
serena activate_project .
serena list_memories
serena read_memory "last-analysis"
serena search_for_pattern "pattern1"
serena search_for_pattern "pattern2"
serena write_memory "batch-results" "[combined results]"
```

## Troubleshooting

### Common Issues

1. **"Missing Serena activation"**
   - Add `serena activate_project .` at script start

2. **"Operation without Serena MCP"**
   - Replace direct operation with Serena equivalent
   - Or document Serena failure before fallback

3. **"Memory operation without Serena"**
   - All memory ops must use `serena write_memory`/`read_memory`
   - No localStorage, files, or other storage allowed

### Getting Help

1. Check validation logs for specific violations
2. Review this documentation for examples
3. Consult `.semantic-exemptions` for approved exceptions
4. Contact team lead for emergency overrides

## Summary

The Serena MCP-first enforcement ensures:
- All code operations start with Serena
- Fallbacks require explicit error documentation
- Memory operations are Serena-exclusive
- Compliance is automatically validated
- Violations block commits and PRs

This system guarantees consistent, traceable, and compliant code navigation across the entire development workflow.