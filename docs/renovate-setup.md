---
layout: default
title: Renovate Setup Guide
---

# Renovate Dependency Management Setup

This guide covers the setup and configuration of Renovate for automated dependency updates in the Prompt Alchemy project.

## What is Renovate?

Renovate is a powerful, free dependency update tool that automatically creates pull requests to update your dependencies. It's more feature-rich and flexible than GitHub's Dependabot, offering:

- **Advanced Configuration**: Highly customizable rules and schedules
- **Intelligent Grouping**: Related dependencies updated together
- **Security Focus**: Immediate security updates with proper labeling
- **Multi-Platform Support**: Go modules, GitHub Actions, Docker, and more
- **Stability Checks**: Configurable delays to ensure updates are stable
- **Auto-merge Capabilities**: Safe automatic merging of patch updates

## Installation Steps

### 1. Install the Renovate GitHub App

1. Visit [https://github.com/apps/renovate](https://github.com/apps/renovate)
2. Click "Install" or "Configure"
3. Choose your account/organization
4. Select repositories:
   - **Recommended**: "Selected repositories" → Choose `PromGen`
   - **Alternative**: "All repositories" (if you want Renovate on all repos)
5. Click "Install"

### 2. Grant Permissions

Renovate needs the following permissions:
- **Read**: Repository metadata, issues, pull requests
- **Write**: Issues, pull requests, repository contents
- **Admin**: Repository (for auto-merge features)

### 3. Initial Onboarding

After installation, Renovate will:
1. Create an onboarding PR within a few minutes
2. The PR will contain a basic `renovate.json` configuration
3. **Important**: Our custom configuration is already in place, so you can close the onboarding PR

## Configuration Overview

Our `renovate.json` configuration includes:

### Core Settings
```json
{
  "schedule": ["before 9am on monday"],
  "timezone": "America/New_York",
  "prConcurrentLimit": 5,
  "prHourlyLimit": 2,
  "labels": ["dependencies"],
  "assignees": ["jraymond"],
  "reviewers": ["jraymond"]
}
```

### Dependency Categories

#### 1. Go Modules
- **Patches**: Auto-merge after 1 day stability
- **Minor**: 3 days stability, grouped updates
- **Major**: 7 days stability, requires review
- **Labels**: `go`, `dependencies`

#### 2. AI/ML SDKs (Critical)
- **All Updates**: 7 days stability, manual review required
- **Packages**: `anthropic-sdk-go`, `openai-go`, `ollama`
- **Labels**: `ai-sdk`, `critical`
- **Priority**: High (10)

#### 3. Database Dependencies (Critical)
- **All Updates**: 5 days stability, manual review required
- **Packages**: `sqlx`, `go-sqlite3`
- **Labels**: `database`, `critical`
- **Priority**: High (8)

#### 4. GitHub Actions
- **Patches**: Auto-merge after immediate validation
- **Minor**: 2 days stability
- **Major**: 5 days stability
- **Labels**: `github-actions`, `ci`

#### 5. Security Updates
- **All Types**: Immediate processing, highest priority
- **Schedule**: "at any time" (overrides normal schedule)
- **Labels**: `security`, `vulnerability`
- **Priority**: Highest (20)

### Auto-merge Strategy

**Safe Auto-merge Enabled For**:
- Patch updates for non-critical dependencies
- Testing dependencies
- Utility dependencies
- GitHub Actions patches
- Lock file maintenance

**Manual Review Required For**:
- Major version updates
- AI/ML SDK updates
- Database dependency updates
- Any security-related changes

## Monitoring and Management

### Dependency Dashboard

Renovate creates a special issue called "🤖 Dependency Dashboard" that provides:
- Overview of all pending updates
- Failed update logs
- Manual trigger options
- Configuration validation status

**Access**: Check your Issues tab for the dashboard issue.

### Pull Request Labels

Updates are automatically labeled for easy filtering:
- `dependencies` - All dependency updates
- `go` - Go module updates
- `github-actions` - CI/CD updates
- `ai-sdk` - AI/ML SDK updates (critical)
- `database` - Database updates (critical)
- `security` - Security updates (urgent)
- `testing` - Test dependency updates
- `utilities` - Utility dependency updates

### Manual Triggers

You can manually trigger Renovate in several ways:

1. **Comment on Dependency Dashboard**: `@renovatebot run`
2. **GitHub Actions**: Use the manual workflow dispatch
3. **Check boxes**: In the dependency dashboard issue

## Advanced Features

### Semantic Commits

All Renovate commits follow semantic commit conventions:
- `deps(go): update module-name to v1.2.3`
- `ci(actions): update action-name to v2.1.0`
- `deps(ai-sdk): update anthropic-sdk-go to v1.5.1`

### Intelligent Grouping

Related dependencies are updated together:
- All Go dependencies in one PR (when possible)
- GitHub Actions grouped by type
- Testing dependencies combined
- Utility dependencies combined

### Stability Checks

Updates wait for stability before being proposed:
- **Patches**: 1 day (except security)
- **Minor**: 2-3 days depending on category
- **Major**: 5-7 days depending on criticality
- **Security**: 0 days (immediate)

### Custom Regex Managers

Renovate also updates versions in:
- GitHub Actions workflow files
- Makefile Go version references
- Documentation version references
- Dockerfile Go base images

## Troubleshooting

### Common Issues

1. **No PRs Created**
   - Check if Renovate app is installed and has permissions
   - Verify configuration in dependency dashboard
   - Look for errors in dashboard issue

2. **Auto-merge Not Working**
   - Ensure branch protection rules allow auto-merge
   - Check that CI passes before merge
   - Verify repository settings allow auto-merge

3. **Too Many PRs**
   - Adjust `prConcurrentLimit` and `prHourlyLimit`
   - Enable more grouping rules
   - Increase stability days for non-critical updates

4. **Missing Updates**
   - Check `ignoreDeps` and `ignorePaths` in config
   - Verify package names in `matchPackageNames`
   - Look for errors in Renovate logs

### Configuration Validation

The repository includes a GitHub Actions workflow that validates the Renovate configuration on every change. Check the Actions tab for validation results.

### Manual Validation

You can validate the configuration locally:

```bash
# Install Renovate CLI
npm install -g renovate

# Validate configuration
renovate-config-validator renovate.json

# Test configuration (dry run)
renovate --dry-run --print-config
```

## Best Practices

### Security
- Review all security updates promptly
- Enable auto-merge only for trusted, non-critical dependencies
- Monitor the dependency dashboard regularly

### Performance
- Use grouping to reduce PR noise
- Set appropriate stability days for your risk tolerance
- Leverage auto-merge for safe updates

### Maintenance
- Review and update package rules quarterly
- Monitor Renovate logs for errors
- Adjust schedules based on team availability

## Migration from Dependabot

If migrating from Dependabot:

1. **Keep Both Temporarily**: Run both for a week to compare
2. **Review Differences**: Check what each tool catches
3. **Disable Dependabot**: Remove `.github/dependabot.yml`
4. **Update Documentation**: Reference Renovate instead

### Key Differences from Dependabot

| Feature | Dependabot | Renovate |
|---------|------------|----------|
| Configuration | Limited YAML | Rich JSON with advanced rules |
| Grouping | Basic | Intelligent, multi-dimensional |
| Auto-merge | Basic | Advanced with stability checks |
| Security Updates | Separate alerts | Integrated with priority |
| Custom Rules | Limited | Extensive regex and custom managers |
| Scheduling | Basic | Cron-like with timezone support |
| Ecosystem Support | GitHub-focused | Multi-platform |

## Support and Resources

- **Renovate Documentation**: [docs.renovatebot.com](https://docs.renovatebot.com/)
- **Configuration Reference**: [docs.renovatebot.com/configuration-options](https://docs.renovatebot.com/configuration-options/)
- **Community**: [GitHub Discussions](https://github.com/renovatebot/renovate/discussions)
- **Issues**: Report problems in the dependency dashboard issue

## Configuration Reference

For the complete configuration file, see [`renovate.json`](../renovate.json) in the repository root.

Key configuration sections:
- **Base Configuration**: Extends recommended presets
- **Scheduling**: Monday mornings, Eastern Time
- **Package Rules**: Dependency-specific handling
- **Auto-merge**: Safe automation rules
- **Regex Managers**: Custom version detection
- **Security**: Immediate vulnerability handling 