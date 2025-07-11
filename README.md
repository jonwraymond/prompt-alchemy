<p align="center">
  <img src="docs/assets/prompt_alchemy.png" alt="Prompt Alchemy" width="300"/>
</p>

<h1 align="center">Prompt Alchemy</h1>

<p align="center">
  <strong>Transform raw ideas into golden prompts through the ancient art of linguistic alchemy. A sophisticated AI system that transmutes concepts through three sacred phases of refinement.</strong>
</p>

<p align="center">
    <a href="https://github.com/jonwraymond/prompt-alchemy/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
    <a href="https://github.com/jonwraymond/prompt-alchemy/issues"><img src="https://img.shields.io/github/issues/jonwraymond/prompt-alchemy" alt="Issues"></a>
</p>

---

## Features

- **⚗️ Alchemical Transformation**: Three sacred phases of transmutation
  - **Prima Materia**: Extract pure essence from raw materials
  - **Solutio**: Dissolve into flowing, natural language
  - **Coagulatio**: Crystallize into refined, potent form
- **🤖 Multi-Provider Support**: OpenAI, Claude (via Anthropic), Gemini, and OpenRouter
- **💾 Smart Storage**: SQLite-based grimoire with context accumulation
- **🎯 Intelligent Ranking**: Advanced scoring based on alchemical principles
- **📊 Performance Tracking**: Track transmutation success rates
- **🔌 MCP Integration**: AI agent-friendly interface for seamless integration
- **⚡ Fast & Efficient**: Parallel alchemical processing
- **📈 Detailed Metadata**: Complete transmutation records including costs
- **🕒 Automated Scheduling**: Easy setup of nightly training jobs via cron/launchd

## System Requirements

### Minimum Requirements
- **Go**: Version 1.23 or higher
- **Operating System**: Linux, macOS, or Windows
- **Memory**: 256 MB RAM minimum, 512 MB recommended
- **Storage**: 100 MB free disk space for application and database
- **Network**: Internet connection required for AI provider access

### Supported Platforms
- **Linux**: x86_64, ARM64 (Ubuntu 20.04+, RHEL 8+, or equivalent)
- **macOS**: Intel and Apple Silicon (macOS 11.0+)
- **Windows**: x86_64 (Windows 10+)

### Dependencies
- **SQLite**: Embedded database (included, no separate installation required)
- **Git**: Required for cloning the repository
- **Make**: Required for using build commands (optional, can build with `go build` directly)
- **No additional system libraries**: Self-contained binary with minimal dependencies

### AI Provider Requirements

To use Prompt Alchemy, you need API access to at least one AI provider:

#### Required API Keys (Choose one or more)
- **OpenAI**: API key from [platform.openai.com](https://platform.openai.com)
  - Supports: GPT models, text embeddings
  - Billing: Pay-per-use, requires credit card
  - Rate limits: Varies by tier
  
- **Anthropic (Claude)**: API key from [console.anthropic.com](https://console.anthropic.com)
  - Supports: Claude models (Sonnet, Haiku, Opus)
  - Billing: Pay-per-use
  - Rate limits: Generous for most use cases
  
- **Google (Gemini)**: API key from [Google AI Studio](https://aistudio.google.com)
  - Supports: Gemini models (Pro, Flash)
  - Billing: Free tier available, then pay-per-use
  - Rate limits: Generous free tier
  
- **OpenRouter**: API key from [openrouter.ai](https://openrouter.ai)
  - Supports: Access to multiple model providers through one API
  - Billing: Pay-per-use with competitive pricing
  - Rate limits: Varies by underlying provider
  
- **Ollama**: Local installation (no API key needed)
  - Supports: Local model execution
  - Requirements: Additional 4-8 GB RAM for models
  - Setup: Install from [ollama.ai](https://ollama.ai)

#### Regional Availability
- OpenAI: Available in most countries (check OpenAI's usage policies)
- Anthropic: Available in US, UK, and select regions
- Google: Available globally with some regional restrictions
- OpenRouter: Global availability (depends on underlying providers)
- Ollama: No restrictions (runs locally)

### Development Requirements (For Contributors)
- **Go**: Version 1.23+ with modules enabled
- **Git**: For version control and contributions
- **Make**: For build automation and testing
- **golangci-lint**: For code quality checks (optional)
- **gosec**: For security scanning (optional)

### Docker Requirements (Optional)
If using Docker deployment:
- **Docker**: Version 20.10+ 
- **Docker Compose**: Version 2.0+ (for multi-container setups)
- **Memory**: 512 MB RAM minimum for container
- **Storage**: 200 MB for Docker image

### Performance Recommendations

#### For Light Usage (< 100 prompts/day)
- 1 CPU core, 512 MB RAM
- Any supported AI provider
- Standard internet connection

#### For Heavy Usage (1000+ prompts/day)
- 2+ CPU cores, 1 GB+ RAM
- Multiple AI provider accounts for redundancy
- Stable, fast internet connection
- Consider local Ollama for reduced API costs

#### For Production Deployment
- 4+ CPU cores, 2 GB+ RAM
- Load balancer for high availability
- Database backup strategy
- Monitoring and alerting setup
- Multiple API keys for rate limit distribution

## Installation

```bash
# Clone the repository
git clone https://github.com/jonwraymond/prompt-alchemy.git
cd prompt-alchemy

# Build the CLI
go build -o prompt-alchemy cmd/promgen/main.go

# Or install directly
go install github.com/jonwraymond/prompt-alchemy/cmd/promgen@latest
```

## Configuration

Create a configuration file at `~/.prompt-alchemy/config.yaml`:

```yaml
# Provider configurations
providers:
  openai:
    api_key: "your-openai-api-key"
    model: "o4-mini"
  
  openrouter:
    api_key: "your-openrouter-api-key"
    model: "openrouter/auto"  # Auto-select best available model
    fallback_models:
      - "anthropic/claude-sonnet-4"
      - "anthropic/claude-3.5-sonnet"
      - "openai/o4-mini"
  
  claude:
    api_key: "your-anthropic-api-key"
    model: "claude-sonnet-4-20250514"  # Latest Claude 4 Sonnet
  
  gemini:
    api_key: "your-google-api-key"
    model: "gemini-2.5-flash"
    timeout: 60  # HTTP timeout in seconds
    safety_threshold: "BLOCK_MEDIUM_AND_ABOVE"  # Safety filter threshold
    max_pro_tokens: 1024   # Max tokens for Pro models
    max_flash_tokens: 512  # Max tokens for Flash models
    default_tokens: 256    # Default token limit
    max_temperature: 2.0   # Maximum temperature allowed

  ollama:
    base_url: "http://localhost:11434"
    model: "gemma3:4b"
    timeout: 60  # HTTP timeout in seconds
    default_embedding_model: "nomic-embed-text"  # Default embedding model
    embedding_timeout: 5     # Embedding timeout in seconds
    generation_timeout: 120  # Generation timeout in seconds

# Alchemical phase configurations
phases:
  prima-materia:
    provider: "openai"     # Extract raw essence
  solutio:
    provider: "anthropic"  # Dissolve into natural form
  coagulatio:
    provider: "google"     # Crystallize to perfection

# Generation settings
generation:
  default_temperature: 0.7
  default_max_tokens: 2000
  default_count: 3
  use_parallel: true
  default_target_model: "claude-sonnet-4-20250514"
  default_embedding_model: "text-embedding-3-small"
  default_embedding_dimensions: 1536
```

### Environment Variables

Alternatively, use environment variables (create a `.env` file or export directly):

```bash
# OpenAI Configuration
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="sk-your-openai-api-key"
export PROMPT_ALCHEMY_PROVIDERS_OPENAI_MODEL="o4-mini"

# OpenRouter Configuration
export PROMPT_ALCHEMY_PROVIDERS_OPENROUTER_API_KEY="sk-or-your-openrouter-api-key"
export PROMPT_ALCHEMY_PROVIDERS_OPENROUTER_MODEL="openrouter/auto"

# Anthropic (Claude) Configuration
export PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key"
export PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_MODEL="claude-sonnet-4-20250514"

# Google (Gemini) Configuration
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY="your-google-api-key"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_MODEL="gemini-2.5-flash"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_TIMEOUT="60"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_SAFETY_THRESHOLD="BLOCK_MEDIUM_AND_ABOVE"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_MAX_PRO_TOKENS="1024"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_MAX_FLASH_TOKENS="512"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_DEFAULT_TOKENS="256"
export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_MAX_TEMPERATURE="2.0"

# Ollama Configuration (Local AI)
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_MODEL="gemma3:4b"
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_BASE_URL="http://localhost:11434"
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_TIMEOUT="60"
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_DEFAULT_EMBEDDING_MODEL="nomic-embed-text"
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_EMBEDDING_TIMEOUT="5"
export PROMPT_ALCHEMY_PROVIDERS_OLLAMA_GENERATION_TIMEOUT="120"
```

**`.env` File Example:** Copy the above exports to a `.env` file (without `export`) for automatic loading.

## Usage

### Generate Prompts

Basic usage:
```bash
prompt-alchemy generate "Create a prompt for writing technical documentation"
```

Advanced options:
```bash
# Specify alchemical phases
prompt-alchemy generate --phases "prima-materia,solutio" "Your raw material"

# Generate multiple transmutations
prompt-alchemy generate --count 5 "Your raw material"

# Custom temperature and tokens
prompt-alchemy generate --temperature 0.8 --max-tokens 3000 "Your prompt idea"

# Add tags for organization
prompt-alchemy generate --tags "technical,documentation" "Your prompt idea"

# Use specific provider for all phases
prompt-alchemy generate --provider openrouter "Your prompt idea"

# Output as JSON with full metadata
prompt-alchemy generate --output json "Your prompt idea"
```

### Search Prompts

```bash
# Search by content (coming soon)
prompt-alchemy search "authentication flow"

# Filter by tags
prompt-alchemy search --tags "technical" "documentation"

# Filter by alchemical phase
prompt-alchemy search --phase solutio "natural language"

# Filter by model
prompt-alchemy search --model "o4-mini"
```

### Automated Learning

Set up automated nightly training to improve prompt rankings over time:

```bash
# Install nightly job at 2 AM (auto-detects best method for your system)
prompt-alchemy schedule --time "0 2 * * *"

# Install at a different time (3:30 AM)
prompt-alchemy schedule --time "30 3 * * *"

# Force use of cron (Linux/macOS)
prompt-alchemy schedule --time "0 2 * * *" --method cron

# Force use of launchd (macOS only)
prompt-alchemy schedule --time "0 2 * * *" --method launchd

# List current scheduled jobs
prompt-alchemy schedule --list

# Uninstall scheduled job
prompt-alchemy schedule --uninstall

# Preview what would be installed
prompt-alchemy schedule --time "0 2 * * *" --dry-run

# Run training manually
prompt-alchemy nightly
```

## The Alchemical Process

Prompt Alchemy follows the ancient principles of transformation through three sacred phases:

1. **Prima Materia (First Matter)** - The raw, unformed potential of your ideas
   - *In practice*: Brainstorming and initial idea extraction
   - *Purpose*: Captures the core concept and explores possibilities

2. **Solutio (Dissolution)** - Breaking down rigid structures into fluid, natural expression
   - *In practice*: Converting ideas into conversational, human-readable language
   - *Purpose*: Makes prompts natural and accessible

3. **Coagulatio (Crystallization)** - Solidifying the essence into its most potent form
   - *In practice*: Refining for technical accuracy, precision, and clarity
   - *Purpose*: Creates the final, polished prompt ready for use

Each phase can be powered by different AI providers, creating a unique alchemical blend optimized for different strengths.

## Testing

Prompt Alchemy includes a comprehensive testing suite to ensure reliability and quality across all components.

### Test Types

- **Unit Tests**: Test individual components and functions in isolation
- **Integration Tests**: Test provider integrations and database operations  
- **End-to-End Tests**: Test complete workflows from CLI to storage
- **Learning Tests**: Test the learning-to-rank system and feedback loops
- **Mock Tests**: Test with simulated provider responses for consistent results

### Running Tests

#### Basic Test Commands
```bash
# Run all tests (unit + integration)
make test

# Run unit tests only
make test-unit

# Run integration tests
make test-integration

# Run CI tests (optimized for automated environments)
make test-ci
```

#### Advanced Test Commands
```bash
# Run end-to-end tests
make test-e2e

# Run learning-to-rank tests
make test-ltr

# Run smoke tests (quick validation)
make test-smoke

# Run comprehensive tests (all features)
make test-comprehensive

# Generate coverage report
make coverage
```

#### Test Management
```bash
# Setup test environment
make test-setup

# Clean test artifacts
make test-clean

# View test results
make test-report
```

### Test Structure

The test suite is organized across several directories:

- **Unit Tests**: Located alongside source files (`*_test.go`)
  - `internal/engine/engine_test.go` - Core generation engine tests
  - `internal/ranking/ranker_test.go` - Prompt ranking algorithm tests
  - `internal/judge/evaluator_test.go` - Quality evaluation tests
  - `internal/learning/learner_test.go` - Learning system tests
  - `pkg/providers/*_test.go` - Provider implementation tests
  - `pkg/models/prompt_test.go` - Data model tests

- **Integration Tests**: `scripts/integration-test.sh`
  - Provider connectivity and API integration
  - Database operations and migrations
  - Configuration loading and validation

- **End-to-End Tests**: `scripts/run-e2e-tests.sh`
  - Complete CLI workflows
  - Multi-phase prompt generation
  - Storage and retrieval operations
  - MCP server functionality

- **Learning Tests**: `scripts/test-learning-to-rank.sh`
  - Feedback processing and pattern detection
  - Ranking weight updates and optimization
  - Nightly training job validation

### Test Configuration

Tests support multiple execution modes:

```bash
# Mock mode (default) - uses simulated responses
make test-e2e

# Live mode - uses real provider APIs (requires API keys)
MOCK_MODE=false make test-e2e

# Specific test levels
make test-smoke      # Basic functionality only
make test-comprehensive  # All features including performance
```

### Coverage

- **Target**: 80%+ code coverage across all components
- **Current Coverage**: Run `make coverage` to generate detailed reports
- **Coverage Reports**: Generated as `coverage.html` for detailed analysis

### CI/CD Pipeline

Automated testing runs on every push and pull request through GitHub Actions:

#### Workflows

- **`test.yml`**: Core testing pipeline
  - Runs on Go 1.23+ across Linux, macOS, and Windows
  - Executes unit, integration, and smoke tests
  - Generates coverage reports
  - Validates code formatting and linting

- **`e2e-tests.yml`**: End-to-end testing
  - Comprehensive workflow testing
  - Provider integration validation
  - Performance benchmarking
  - Learning system verification

- **`ci.yml`**: Continuous integration checks
  - Code quality analysis
  - Security scanning
  - Dependency validation
  - Build verification

- **`release.yml`**: Release automation
  - Multi-platform builds
  - Integration test validation
  - Automated deployment
  - Version tagging

#### Quality Gates

All tests must pass before:
- Merging pull requests
- Creating releases
- Deploying documentation

### Writing Tests

#### Unit Test Example
```go
func TestPromptGeneration(t *testing.T) {
    engine := NewEngine(mockRegistry, logger)
    
    opts := models.GenerateOptions{
        Request: models.PromptRequest{
            Input: "test input",
            Phases: []models.Phase{models.PhasePrimaMaterial},
        },
    }
    
    result, err := engine.Generate(context.Background(), opts)
    assert.NoError(t, err)
    assert.NotEmpty(t, result.Prompts)
}
```

#### Integration Test Guidelines
- Use real database connections with test isolation
- Mock external API calls when possible
- Clean up test data after execution
- Test error conditions and edge cases

#### Test Utilities
- **Mocks**: Located in `internal/mocks/` for consistent test data
- **Fixtures**: Test configurations and sample prompts
- **Helpers**: Common test setup and teardown functions

### Debugging Test Failures

```bash
# Run tests with verbose output
make test-verbose

# Run specific test files
go test -v ./internal/engine/

# Run tests with race detection
go test -race ./...

# Debug with additional logging
LOG_LEVEL=debug make test
```

### Performance Testing

```bash
# Run benchmarks
make bench

# Performance profiling
go test -bench=. -benchmem -cpuprofile=cpu.prof ./...
```

## Architecture

See [ARCHITECTURE.md](docs/architecture.md) for a detailed overview of the alchemical laboratory.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.