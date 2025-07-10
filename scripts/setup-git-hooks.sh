#!/bin/bash

# Setup Git Hooks for Prompt Alchemy
# This script configures git hooks to support conventional commits and release automation

set -e

echo "🔧 Setting up Git hooks for Prompt Alchemy..."

# Ensure we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Set up commit message template
echo "📝 Setting up commit message template..."
git config commit.template .gitmessage
echo "✅ Commit template configured"

# Create commit-msg hook for conventional commits validation
echo "🎯 Creating commit-msg hook..."
cat > .git/hooks/commit-msg << 'EOF'
#!/bin/bash

# Conventional Commits validation hook
# Validates commit messages follow conventional commit format

commit_regex='^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?:\s.{1,50}'

error_msg="❌ Invalid commit message format!

Commit message must follow Conventional Commits format:
<type>[optional scope]: <description>

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
Examples:
  feat(auth): add OAuth2 authentication
  fix(api): resolve memory leak  
  feat!: remove deprecated API endpoints

For breaking changes, add '!' after type or include 'BREAKING CHANGE:' in footer."

if ! grep -qE "$commit_regex" "$1"; then
    echo "$error_msg" >&2
    exit 1
fi

# Check for breaking change indicators
if grep -qE "(BREAKING CHANGE|!:)" "$1"; then
    echo "⚠️  Breaking change detected - this will trigger a major version bump"
fi

echo "✅ Commit message format is valid"
EOF

# Make commit-msg hook executable
chmod +x .git/hooks/commit-msg

# Create pre-commit hook for basic checks
echo "🔍 Creating pre-commit hook..."
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Pre-commit hook for basic code quality checks

echo "🔍 Running pre-commit checks..."

# Check if go fmt needs to be run
if [ -n "$(gofmt -l .)" ]; then
    echo "❌ Code is not formatted. Please run 'go fmt ./...'"
    echo "Files that need formatting:"
    gofmt -l .
    exit 1
fi

# Check for common issues
if grep -r "TODO\|FIXME\|XXX" --include="*.go" . >/dev/null 2>&1; then
    echo "⚠️  Found TODO/FIXME/XXX comments. Consider addressing them before committing:"
    grep -rn "TODO\|FIXME\|XXX" --include="*.go" . | head -5
    echo ""
fi

# Check for debug prints (optional warning)
if grep -r "fmt.Print\|log.Print" --include="*.go" . >/dev/null 2>&1; then
    echo "⚠️  Found debug print statements. Consider removing them:"
    grep -rn "fmt.Print\|log.Print" --include="*.go" . | head -3
    echo ""
fi

echo "✅ Pre-commit checks passed"
EOF

# Make pre-commit hook executable
chmod +x .git/hooks/pre-commit

# Create prepare-commit-msg hook to help with conventional commits
echo "💡 Creating prepare-commit-msg hook..."
cat > .git/hooks/prepare-commit-msg << 'EOF'
#!/bin/bash

# Prepare commit message hook
# Adds helpful hints for conventional commits

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

# Only add hints for regular commits (not merges, rebases, etc.)
if [ -z "$COMMIT_SOURCE" ]; then
    # Check if the commit message is empty or just contains comments
    if ! grep -q '^[^#]' "$COMMIT_MSG_FILE" 2>/dev/null; then
        # Add helpful template at the top
        cat > "$COMMIT_MSG_FILE.tmp" << 'TEMPLATE'

# Conventional Commits format:
# <type>[optional scope]: <description>
#
# Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
# Examples:
#   feat(auth): add OAuth2 authentication
#   fix(api): resolve memory leak
#   feat!: remove deprecated API endpoints (breaking change)
#
# Uncomment and edit one of the examples below:
# feat: 
# fix: 
# docs: 
# refactor: 
# test: 

TEMPLATE
        cat "$COMMIT_MSG_FILE" >> "$COMMIT_MSG_FILE.tmp"
        mv "$COMMIT_MSG_FILE.tmp" "$COMMIT_MSG_FILE"
    fi
fi
EOF

# Make prepare-commit-msg hook executable
chmod +x .git/hooks/prepare-commit-msg

# Set up additional git configuration
echo "⚙️  Configuring additional git settings..."

# Configure git to use the hooks
git config core.hooksPath .git/hooks

# Set up useful aliases
git config alias.conventional-log "log --oneline --grep='^feat\\|^fix\\|^docs\\|^style\\|^refactor\\|^perf\\|^test\\|^build\\|^ci\\|^chore\\|^revert'"
git config alias.release-log "log --oneline --grep='^feat\\|^fix\\|BREAKING CHANGE'"

echo ""
echo "🎉 Git hooks setup complete!"
echo ""
echo "📋 What was configured:"
echo "  ✅ Commit message template (.gitmessage)"
echo "  ✅ Commit message validation (conventional commits)"
echo "  ✅ Pre-commit formatting checks"
echo "  ✅ Helpful commit message preparation"
echo "  ✅ Git aliases for conventional commits"
echo ""
echo "🚀 Usage:"
echo "  git commit                    # Uses template and validation"
echo "  git conventional-log          # Show conventional commits"
echo "  git release-log              # Show release-worthy commits"
echo ""
echo "💡 Tips:"
echo "  - Use 'feat:' for new features (minor version bump)"
echo "  - Use 'fix:' for bug fixes (patch version bump)"  
echo "  - Use 'feat!:' or 'BREAKING CHANGE:' for breaking changes (major version bump)"
echo "  - Include scope when relevant: 'feat(auth):', 'fix(api):'"
echo ""
echo "🔗 More info: docs/release-automation.md" 