#!/bin/bash

# Auto-commit script for Claude Code hooks
# Automatically commits code changes when triggered by successful Claude Code operations

set -e

# Configuration
LOG_FILE="$HOME/.claude/auto-commit.log"
PROJECT_DIR="$(pwd)"
AUTO_PUSH="${AUTO_PUSH:-false}"  # Default to local-only, set AUTO_PUSH=true to enable remote push

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [AUTO-COMMIT] $1" | tee -a "$LOG_FILE"
}

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    log "ERROR: Not in a git repository, skipping auto-commit"
    exit 0
fi

# Check if git is configured properly
if [ -z "$(git config user.name)" ] || [ -z "$(git config user.email)" ]; then
    log "ERROR: Git user.name or user.email not configured, skipping auto-commit"
    exit 0
fi

# Check if we're on a protected branch (optional safety check)
current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ "$current_branch" = "main" ] || [ "$current_branch" = "master" ]; then
    log "WARNING: On protected branch '$current_branch', proceeding with caution"
fi

# Check if there are any changes to commit
if [ -z "$(git status --porcelain)" ]; then
    log "No changes to commit"
    exit 0
fi

log "Detected changes, starting auto-commit process"

# Get the list of changed files for commit message
changed_files=$(git status --porcelain | head -5 | awk '{print $2}' | tr '\n' ' ')
file_count=$(git status --porcelain | wc -l | tr -d ' ')

# Skip if this is a really large change (likely initial commit or major cleanup)
if [ "$file_count" -gt 1000 ]; then
    log "Large change detected ($file_count files), skipping auto-commit to prevent huge commits"
    exit 0
fi

# Generate commit message based on changes
if [ "$file_count" -eq 1 ]; then
    # Single file change
    filename=$(echo "$changed_files" | xargs basename)
    commit_msg="feat: update $filename

Auto-committed by Claude Code hook"
elif [ "$file_count" -le 10 ]; then
    # Small number of files - list them
    commit_msg="feat: update multiple files ($file_count files)

Files: $changed_files
Auto-committed by Claude Code hook"
else
    # Many files - don't list them all
    commit_msg="feat: update multiple files ($file_count files)

Auto-committed by Claude Code hook"
fi

# Check if Go project and run basic validation
if [ -f "go.mod" ]; then
    log "Go project detected, running basic validation"
    
    # Check if go build works (quick syntax check)
    if ! go build ./... >/dev/null 2>&1; then
        log "ERROR: Go build failed, skipping auto-commit"
        exit 0
    fi
    
    # Check go fmt
    if [ -n "$(gofmt -l .)" ]; then
        log "Running go fmt to fix formatting"
        gofmt -w .
    fi
fi

# Add all changes
git add -A

# Commit the changes
if git commit -m "$commit_msg"; then
    log "Successfully committed changes: $changed_files"
    
    # Push to remote if configured
    if git remote get-url origin >/dev/null 2>&1; then
        log "Pushing to remote repository"
        if git push origin HEAD; then
            log "Successfully pushed to remote"
        else
            log "WARNING: Failed to push to remote (commit still created locally)"
        fi
    else
        log "No remote configured, commit created locally only"
    fi
else
    log "ERROR: Failed to create commit"
    exit 1
fi

log "Auto-commit process completed successfully"