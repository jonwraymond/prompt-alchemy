---
layout: default
title: Release Automation Guide
---

# Release Automation and Semantic Versioning

This guide covers the automated release system for Prompt Alchemy, including semantic versioning, changelog generation, and GitHub releases.

## Overview

Prompt Alchemy uses a sophisticated release automation system that:

- **Follows Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH` format
- **Uses Conventional Commits**: Structured commit messages for automated versioning
- **Generates Changelogs**: Automatically categorized release notes
- **Creates Cross-Platform Binaries**: Linux, macOS, and Windows builds
- **Updates Documentation**: Automatic version updates in docs

## Semantic Versioning

We follow [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features (backward compatible)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes (backward compatible)

### Version Determination

Version bumps are automatically determined by commit messages:

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `feat:` | Minor | `feat(auth): add OAuth2 support` |
| `fix:` | Patch | `fix(api): resolve memory leak` |
| `feat!:` or `BREAKING CHANGE:` | Major | `feat!: remove deprecated API` |
| `docs:`, `style:`, `refactor:`, `test:`, `chore:` | No release | Documentation/maintenance |

## Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) for structured commit messages:

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system changes
- **ci**: CI/CD changes
- **chore**: Maintenance tasks
- **revert**: Revert previous commit

### Examples
```bash
# New feature (minor version bump)
feat(providers): add support for Anthropic Claude 3.5

# Bug fix (patch version bump)
fix(storage): resolve database connection timeout

# Breaking change (major version bump)
feat!: remove support for deprecated config format

# With scope and body
feat(cli): add interactive prompt generation mode

Add an interactive mode that guides users through prompt creation
with step-by-step questions and real-time preview.

Closes #123
```

### Setting Up Commit Template

Configure git to use our commit message template:

```bash
git config commit.template .gitmessage
```

## Release Triggers

### Automatic Releases

Releases are automatically triggered on pushes to `main` when:

1. Commits since last tag contain `feat:`, `fix:`, or breaking changes
2. All tests pass
3. Code quality checks pass

### Manual Releases

You can manually trigger releases via GitHub Actions:

1. Go to **Actions** → **Release** → **Run workflow**
2. Choose version bump type: `patch`, `minor`, or `major`
3. Optionally mark as pre-release

## Release Process

### Automated Workflow

The release process includes these steps:

#### 1. **Release Condition Check**
- Analyzes commits since last tag
- Determines if release is needed
- Calculates new version number

#### 2. **Quality Assurance**
- Runs full test suite
- Executes linting and security scans
- Validates code quality

#### 3. **Changelog Generation**
- Categorizes commits by type
- Generates structured release notes
- Lists contributors

#### 4. **Cross-Platform Builds**
- Builds binaries for all platforms:
  - Linux (amd64, arm64)
  - macOS (amd64, arm64)
  - Windows (amd64)
- Embeds version information

#### 5. **GitHub Release Creation**
- Creates git tag
- Publishes GitHub release
- Uploads binary artifacts
- Includes generated changelog

#### 6. **Documentation Updates**
- Updates installation instructions
- Bumps version references
- Commits changes back to main

### Manual Release Commands

#### Local Development

```bash
# Check current version
make version

# Run pre-release checks
make pre-release

# Build release binaries locally
make release

# Create and push a tag manually
make tag TAG=v1.2.3
```

#### Version Information

The binary includes embedded version information:

```bash
# Show version details
./prompt-alchemy version

# JSON output
./prompt-alchemy version --json

# Short version only
./prompt-alchemy version --short
```

## Changelog Format

Automatically generated changelogs include:

### Structure
```markdown
## What's Changed

### 💥 Breaking Changes
* feat!: remove deprecated API endpoints (abc123)

### ✨ New Features
* feat(auth): add OAuth2 authentication (def456)
* feat(cli): add interactive mode (ghi789)

### 🐛 Bug Fixes
* fix(api): resolve null pointer exception (jkl012)
* fix(storage): fix memory leak in cache (mno345)

### 🔧 Other Changes
* docs: update installation guide (pqr678)
* chore: update dependencies (stu901)

### 👥 Contributors
Thanks to: @jraymond, @contributor1, @contributor2

**Full Changelog**: https://github.com/org/repo/compare/v1.0.0...v1.1.0
```

## Version Management

### Build-time Version Injection

Version information is injected at build time using Go's `-ldflags`:

```go
// internal/cmd/version.go
var (
    Version   = "dev"       // Set via ldflags
    GitCommit = "unknown"   // Set via ldflags  
    GitTag    = "unknown"   // Set via ldflags
    BuildDate = "unknown"   // Set via ldflags
)
```

### Makefile Integration

The Makefile automatically detects version information:

```makefile
VERSION ?= $(shell git describe --tags --always --dirty)
GIT_COMMIT ?= $(shell git rev-parse --short HEAD)
BUILD_DATE ?= $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
```

## Release Artifacts

Each release includes:

### Binary Distributions
- `prompt-alchemy-v1.2.3-linux-amd64.tar.gz`
- `prompt-alchemy-v1.2.3-linux-arm64.tar.gz`
- `prompt-alchemy-v1.2.3-darwin-amd64.tar.gz`
- `prompt-alchemy-v1.2.3-darwin-arm64.tar.gz`
- `prompt-alchemy-v1.2.3-windows-amd64.zip`

### Checksums
- SHA256 checksums for all artifacts
- GPG signatures (if configured)

### Installation Scripts
- Automated installation scripts
- Package manager configurations

## Branch Strategy

### Main Branch
- All releases are created from `main`
- Must pass all CI checks
- Requires conventional commit messages

### Feature Branches
- Use descriptive names: `feat/oauth-integration`
- Squash merge to main with conventional commit message
- Delete after merge

### Hotfix Branches
- For critical fixes: `hotfix/security-patch`
- Can be fast-tracked if urgent
- Use `fix:` commit type for patch releases

## Best Practices

### Commit Messages
1. **Use conventional commit format**
2. **Be descriptive but concise**
3. **Include scope when relevant**: `feat(auth):`, `fix(api):`
4. **Reference issues**: `Closes #123`, `Fixes #456`

### Release Planning
1. **Group related features** in releases
2. **Communicate breaking changes** early
3. **Test pre-releases** with stakeholders
4. **Document migration paths** for major versions

### Version Strategy
- **Patch releases**: Bug fixes, security patches
- **Minor releases**: New features, enhancements
- **Major releases**: Breaking changes, architecture updates

## Troubleshooting

### Common Issues

#### No Release Created
**Problem**: Push to main doesn't trigger release

**Solutions**:
- Check commit messages use conventional format
- Ensure commits contain `feat:`, `fix:`, or breaking changes
- Verify all CI checks pass

#### Build Failures
**Problem**: Release workflow fails during build

**Solutions**:
- Check Go version compatibility
- Verify all dependencies are available
- Review build logs in GitHub Actions

#### Version Conflicts
**Problem**: Version calculation is incorrect

**Solutions**:
- Check git tags are properly formatted (`v1.2.3`)
- Ensure working directory is clean
- Verify conventional commit format

### Manual Recovery

If automated release fails:

```bash
# 1. Create tag manually
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3

# 2. Build artifacts locally
make release

# 3. Create GitHub release manually
# Upload artifacts via GitHub UI
```

## Configuration

### GitHub Actions Secrets

No special secrets required - uses `GITHUB_TOKEN` automatically.

### Repository Settings

Enable these settings:
- **Actions**: Allow GitHub Actions
- **Pages**: Enable for documentation
- **Releases**: Allow creation

### Branch Protection

Recommended branch protection for `main`:
- Require pull request reviews
- Require status checks to pass
- Require up-to-date branches
- Include administrators

## Integration with Other Tools

### Renovate Integration
- Renovate respects semantic versioning
- Dependency updates trigger appropriate version bumps
- Security updates get priority handling

### Documentation Updates
- Version references automatically updated
- Installation instructions stay current
- API documentation includes version info

### Package Managers
Ready for integration with:
- Homebrew formulas
- APT/YUM repositories  
- Go module proxy
- Docker Hub

## Future Enhancements

Planned improvements:
- **Automated security scanning** of releases
- **Performance benchmarking** in releases
- **Docker image publishing**
- **Package manager integration**
- **Release approval workflows** for major versions

## Support

For release automation issues:
- Check GitHub Actions logs
- Review this documentation
- Open issue with `release` label
- Contact maintainers for urgent issues 