---
layout: default
title: Multi-Architecture Builds
---

# Multi-Architecture Builds

Prompt Alchemy supports building binaries for multiple operating systems and architectures through our comprehensive CI/CD pipeline and local build system.

## Supported Platforms

### Operating Systems
- **Linux** (amd64, arm64)
- **macOS** (amd64, arm64) 
- **Windows** (amd64)

### Architecture Support
- **AMD64** (x86_64) - Intel/AMD 64-bit processors
- **ARM64** (aarch64) - ARM 64-bit processors (Apple Silicon, ARM servers)

## CI/CD Pipeline Multi-Arch Builds

### GitHub Actions Workflows

#### 1. CI Pipeline (`.github/workflows/ci.yml`)
- **Build Job**: Creates binaries for all supported platforms
- **Integration Tests**: Runs tests on Ubuntu, macOS, and Windows
- **Artifact Management**: Uploads platform-specific binaries with archives

```yaml
strategy:
  matrix:
    include:
      - os: linux, arch: amd64, goos: linux, goarch: amd64
      - os: linux, arch: arm64, goos: linux, goarch: arm64
      - os: darwin, arch: amd64, goos: darwin, goarch: amd64
      - os: darwin, arch: arm64, goos: darwin, goarch: arm64
      - os: windows, arch: amd64, goos: windows, goarch: amd64
```

#### 2. Release Pipeline (`.github/workflows/release.yml`)
- **Automated Releases**: Builds and packages binaries for all platforms
- **Archive Creation**: Creates `.tar.gz` for Unix systems, `.zip` for Windows
- **GitHub Releases**: Automatically uploads binaries to GitHub releases

#### 3. E2E Testing (`.github/workflows/e2e-tests.yml`)
- **Linux-focused**: Primary E2E testing on Linux AMD64
- **Cross-platform validation**: Basic functionality tests on all platforms

### Build Features

#### Version Information Injection
All builds include embedded version information:
```bash
VERSION=$(git describe --tags --always --dirty)
GIT_COMMIT=$(git rev-parse --short HEAD)
GIT_TAG=$(git describe --tags --exact-match)
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
```

#### Optimized Binaries
- **CGO_ENABLED=0**: Static linking for maximum compatibility
- **-ldflags="-s -w"**: Strip debug symbols for smaller binaries
- **Cross-compilation**: Built on Linux runners for all platforms

## Local Multi-Arch Builds

### Makefile Targets

#### Individual Platform Builds
```bash
# Linux builds
make build-linux-amd64    # Linux x86_64
make build-linux-arm64    # Linux ARM64

# macOS builds  
make build-darwin-amd64   # macOS Intel
make build-darwin-arm64   # macOS Apple Silicon

# Windows builds
make build-windows-amd64  # Windows x86_64
```

#### Batch Operations
```bash
make build-all           # Build all platforms
make release-archives    # Create archives for all builds
make release            # Full release: test + build + archive
```

### Build Output Structure
```
bin/
├── prompt-alchemy-linux-amd64
├── prompt-alchemy-linux-arm64
├── prompt-alchemy-darwin-amd64
├── prompt-alchemy-darwin-arm64
├── prompt-alchemy-windows-amd64.exe
├── prompt-alchemy-linux-amd64-v1.0.0.tar.gz
├── prompt-alchemy-linux-arm64-v1.0.0.tar.gz
├── prompt-alchemy-darwin-amd64-v1.0.0.tar.gz
├── prompt-alchemy-darwin-arm64-v1.0.0.tar.gz
└── prompt-alchemy-windows-amd64-v1.0.0.zip
```

## Installation Methods

### 1. GitHub Releases (Recommended)
Download pre-built binaries from [GitHub Releases](https://github.com/jonwraymond/prompt-alchemy/releases):

```bash
# Linux AMD64
wget https://github.com/jonwraymond/prompt-alchemy/releases/download/v1.0.0/prompt-alchemy-linux-amd64-v1.0.0.tar.gz
tar -xzf prompt-alchemy-linux-amd64-v1.0.0.tar.gz
sudo mv prompt-alchemy-linux-amd64 /usr/local/bin/prompt-alchemy

# macOS ARM64 (Apple Silicon)
wget https://github.com/jonwraymond/prompt-alchemy/releases/download/v1.0.0/prompt-alchemy-darwin-arm64-v1.0.0.tar.gz
tar -xzf prompt-alchemy-darwin-arm64-v1.0.0.tar.gz
sudo mv prompt-alchemy-darwin-arm64 /usr/local/bin/prompt-alchemy

# Windows AMD64
# Download and extract the .zip file manually
```

### 2. Go Install (Cross-platform)
```bash
go install github.com/jonwraymond/prompt-alchemy/cmd@latest
```

### 3. Build from Source
```bash
git clone https://github.com/jonwraymond/prompt-alchemy.git
cd prompt-alchemy

# Build for current platform
make build

# Build for specific platform
make build-linux-amd64

# Build for all platforms
make build-all
```

## Platform-Specific Notes

### Linux
- **Static binaries**: No external dependencies required
- **ARM64 support**: Works on ARM servers and Raspberry Pi 4+
- **Distribution agnostic**: Works on Ubuntu, CentOS, Alpine, etc.

### macOS
- **Universal compatibility**: Separate binaries for Intel and Apple Silicon
- **Code signing**: Binaries are not signed (may require security approval)
- **Homebrew**: Future package manager integration planned

### Windows
- **PowerShell support**: Full compatibility with PowerShell and Command Prompt
- **No dependencies**: Self-contained executable
- **Windows Defender**: May require security exception for unsigned binary

## CI/CD Architecture

### Build Matrix Strategy
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    include:
      - os: ubuntu-latest
        binary_name: prompt-alchemy
        artifact_name: prompt-alchemy-linux-amd64
      - os: macos-latest  
        binary_name: prompt-alchemy
        artifact_name: prompt-alchemy-darwin-amd64
      - os: windows-latest
        binary_name: prompt-alchemy.exe
        artifact_name: prompt-alchemy-windows-amd64
```

### Artifact Management
- **Upload/Download**: Efficient artifact sharing between jobs
- **Retention**: 30 days for release artifacts, 7 days for test artifacts
- **Compression**: Automatic archive creation for distribution

### Quality Assurance
- **Cross-platform testing**: Integration tests on all target platforms
- **Binary validation**: Version and functionality verification
- **Performance testing**: Linux-based comprehensive E2E tests

## Troubleshooting

### Common Build Issues

#### 1. CGO Dependencies
```bash
# Error: CGO_ENABLED but no C compiler
CGO_ENABLED=0 go build ...
```

#### 2. Missing Build Tools
```bash
# Install Go build essentials
go mod download
go mod tidy
```

#### 3. Cross-compilation Errors
```bash
# Verify GOOS/GOARCH combination
go tool dist list | grep linux/arm64
```

### Platform-Specific Issues

#### macOS Code Signing
```bash
# Allow unsigned binary
sudo spctl --add /usr/local/bin/prompt-alchemy
# Or disable Gatekeeper temporarily
sudo spctl --master-disable
```

#### Windows Execution Policy
```powershell
# Allow execution of downloaded binaries
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Linux ARM64 Compatibility
```bash
# Verify ARM64 support
uname -m  # Should show aarch64
file prompt-alchemy-linux-arm64  # Should show ARM aarch64
```

## Future Enhancements

### Planned Features
1. **Package Managers**: Homebrew, APT, YUM integration
2. **Docker Images**: Multi-arch container builds
3. **Code Signing**: Windows and macOS binary signing
4. **Auto-updates**: Built-in binary update mechanism

### Architecture Expansion
- **RISC-V**: Experimental support for RISC-V processors
- **FreeBSD**: BSD operating system support
- **Android**: ARM64 Android termux compatibility

## Development Workflow

### Local Development
```bash
# Quick development cycle
make dev                 # Build + test for current platform

# Cross-platform validation
make build-all          # Build for all platforms
make test-smoke         # Quick cross-platform tests
```

### Release Process
```bash
# Prepare release
make pre-release        # Full validation

# Create release
git tag v1.0.0
git push origin v1.0.0  # Triggers automated release

# Manual release
make release            # Local release build
```

### Testing Strategy
- **Unit Tests**: Platform-agnostic Go tests
- **Integration Tests**: Platform-specific CLI validation  
- **E2E Tests**: Comprehensive workflow testing on Linux
- **Smoke Tests**: Quick validation across all platforms

This multi-architecture build system ensures PromGen works seamlessly across all major computing platforms while maintaining high quality and performance standards. 