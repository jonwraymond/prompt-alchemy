# GitHub Actions CI/CD Pipeline

This directory contains the GitHub Actions workflows for the Prompt Alchemy project.

## Workflows

### CI Pipeline (`.github/workflows/ci.yml`)

A comprehensive continuous integration pipeline that runs on every push and pull request to `main` and `develop` branches.

#### Jobs

1. **Test** 🧪
   - Runs on Go 1.20 and 1.21 (matrix strategy)
   - Executes all unit tests with race detection
   - Generates coverage reports
   - Uploads coverage to Codecov
   - Archives test results as artifacts

2. **Lint** 🔍
   - Runs golangci-lint with comprehensive checks
   - Executes `go vet` for static analysis
   - Checks code formatting with `go fmt`
   - Detects ineffectual assignments
   - Checks for misspellings

3. **Security** 🔒
   - Runs Gosec security scanner
   - Uploads security results to GitHub Security tab
   - Checks for known vulnerabilities with govulncheck
   - Scans dependencies with Nancy
   - Detects hardcoded secrets with TruffleHog

4. **Build** 🏗️
   - Builds the application binary
   - Tests the binary functionality
   - Uploads build artifacts
   - Only runs if test, lint, and security jobs pass

5. **Benchmark** 📊
   - Runs performance benchmarks
   - Only executes on pushes to main branch
   - Uploads benchmark results

6. **Notify** 📢
   - Provides summary of all job results
   - Reports success/failure status

#### Features

- **Caching**: Go modules and build cache for faster runs
- **Matrix Testing**: Tests against multiple Go versions
- **Artifact Upload**: Preserves test results and build artifacts
- **Security Integration**: Results appear in GitHub Security tab
- **Coverage Reporting**: Integration with Codecov
- **Manual Triggers**: Can be triggered manually via workflow_dispatch

#### Triggers

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual workflow dispatch

#### Environment Variables

- `GO_VERSION`: Default Go version (1.21)

#### Required Secrets

For full functionality, configure these repository secrets:

- `CODECOV_TOKEN`: For coverage reporting (optional)

#### Status Badges

Add these badges to your README:

```markdown
[![CI](https://github.com/jonwraymond/prompt-alchemy/workflows/CI%20Pipeline/badge.svg)](https://github.com/jonwraymond/prompt-alchemy/actions)
[![codecov](https://codecov.io/gh/jonwraymond/prompt-alchemy/branch/main/graph/badge.svg)](https://codecov.io/gh/jonwraymond/prompt-alchemy)
```

## Dependabot Configuration (`.github/dependabot.yml`)

Automated dependency updates for:

- **Go modules**: Weekly updates on Mondays
- **GitHub Actions**: Weekly updates on Mondays

### Features

- Automatic pull requests for dependency updates
- Configurable review and assignment
- Semantic commit messages
- Rate limiting to prevent spam

## Security Features

### Static Analysis
- **Gosec**: Go security checker
- **govulncheck**: Known vulnerability scanner
- **Nancy**: Dependency vulnerability scanner
- **TruffleHog**: Secret detection

### Results Integration
- Security findings appear in GitHub Security tab
- SARIF format for detailed reporting
- Automated security alerts

## Performance Monitoring

### Benchmarks
- Automated performance testing
- Benchmark result archival
- Performance regression detection

### Coverage Tracking
- Line and branch coverage reporting
- Historical coverage trends
- Coverage requirement enforcement

## Local Development

### Running CI Checks Locally

```bash
# Run tests
go test -v -race -coverprofile=coverage.out ./...

# Run linting
golangci-lint run --timeout=5m

# Run security checks
gosec ./...
govulncheck ./...

# Check formatting
go fmt ./...
go vet ./...
```

### Pre-commit Hooks

Consider setting up pre-commit hooks to run these checks before committing:

```bash
#!/bin/sh
# .git/hooks/pre-commit
go test ./...
go vet ./...
go fmt ./...
```

## Customization

### Adding New Linters

Edit the lint job in `.github/workflows/ci.yml`:

```yaml
- name: Custom Linter
  run: |
    go install example.com/linter@latest
    linter ./...
```

### Adding Security Scanners

Add new security tools to the security job:

```yaml
- name: Custom Security Tool
  run: |
    security-tool scan ./...
```

### Modifying Test Matrix

Update the strategy matrix in the test job:

```yaml
strategy:
  matrix:
    go-version: ['1.20', '1.21', '1.22']
    os: [ubuntu-latest, windows-latest, macos-latest]
```

## Troubleshooting

### Common Issues

1. **Test Failures**: Check test logs in the Actions tab
2. **Lint Errors**: Run `golangci-lint run` locally
3. **Security Alerts**: Review security tab for details
4. **Build Failures**: Check Go version compatibility

### Debug Mode

Enable debug logging by setting `ACTIONS_STEP_DEBUG: true` in repository secrets.

## Best Practices

1. **Keep Dependencies Updated**: Dependabot handles this automatically
2. **Review Security Alerts**: Address security findings promptly
3. **Monitor Coverage**: Maintain high test coverage
4. **Check Performance**: Review benchmark results regularly
5. **Use Semantic Commits**: Follow conventional commit format

## Support

For issues with the CI/CD pipeline:

1. Check the Actions tab for detailed logs
2. Review this documentation
3. Check GitHub Actions documentation
4. Open an issue with the `ci` label 