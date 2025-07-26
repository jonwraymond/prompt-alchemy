# Agent Ruleset: Comprehensive Configuration and Behavioral Guidelines

## Executive Summary

This ruleset formalizes the configuration patterns, behavioral conventions, and architectural principles extracted from the Prompt Alchemy project's `.claude/` directory, `CLAUDE.md` file, and `scripts/` directory. It provides a comprehensive framework for agent setup, operation, and continuous improvement.

## 🏗️ Core Architecture Rules

### 1. Specialized Agent System

#### Agent Hierarchy Structure
```
.claude/agents/
├── README.md                    # System overview and coordination
├── go-backend-specialist.md     # Backend development expert
├── react-frontend-specialist.md # Frontend development expert
├── provider-integration-specialist.md # LLM provider expert
├── testing-qa-specialist.md     # Quality assurance expert
├── docker-devops-specialist.md  # DevOps and deployment expert
└── mcp-integration-specialist.md # Claude Desktop integration expert
```

#### Agent Metadata Template
```yaml
---
name: "{domain}-specialist"
description: "{Domain} expert for {specific area}. Use proactively for {use cases}."
tools: [Read, Write, Edit, MultiEdit, Bash, Grep, Glob, mcp__serena__*]
---

# Core Responsibilities (5 key areas)
1. **Primary Responsibility**: Main focus area
2. **Secondary Responsibility**: Supporting functions
3. **Integration Responsibility**: Cross-system coordination
4. **Quality Responsibility**: Standards and validation
5. **Innovation Responsibility**: Continuous improvement

# Architecture Understanding
- **Key Files**: List critical files and patterns
- **System Integration**: How this domain fits into the whole
- **Dependencies**: What this domain depends on and provides

# Development Patterns
- **Workflow Standards**: Established patterns and approaches
- **Quality Standards**: Code quality and testing requirements
- **Integration Patterns**: How to work with other domains

# Workflow Process
1. **Understand**: Analyze requirements and context
2. **Plan**: Design approach and validate with user
3. **Implement**: Execute with minimal impact
4. **Validate**: Test and verify results
5. **Document**: Update knowledge and documentation
```

#### Agent Activation Rules
- **Automatic Triggers**: Activate based on keywords and context
  - "add new provider" → `provider-integration-specialist`
  - "fix React component" → `react-frontend-specialist`
  - "Docker build issue" → `docker-devops-specialist`
  - "test failure" → `testing-qa-specialist`
  - "engine modification" → `go-backend-specialist`
  - "MCP tool" → `mcp-integration-specialist`

- **Explicit Invocation**: Request specific expertise for domain tasks
- **Multi-Agent Coordination**: Coordinate multiple specialists for complex tasks

### 2. Configuration System

#### Settings Structure (.claude/settings.local.json)
```json
{
  "permissions": {
    "allow": [
      "mcp__serena__search_for_pattern",
      "mcp__serena__activate_project",
      "mcp__serena__read_file",
      "mcp__serena__find_file",
      "mcp__serena__list_dir",
      "mcp__serena__replace_regex",
      "Bash(rm:*)"
    ],
    "deny": []
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit|mcp__serena__create_text_file|mcp__serena__replace_regex",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/auto-commit.sh"
          }
        ]
      }
    ]
  }
}
```

#### Configuration Hierarchy
1. **Default values** in code (lowest priority)
2. **~/.prompt-alchemy/config.yaml** file
3. **Environment variables** (prefix: `PROMPT_ALCHEMY_`)
4. **Command-line flags** (highest priority)

#### Environment Variable Naming Convention
```
PROMPT_ALCHEMY_{SECTION}_{SUBSECTION}_{KEY}
Examples:
- PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY
- PROMPT_ALCHEMY_GENERATION_DEFAULT_TEMPERATURE
- PROMPT_ALCHEMY_LEARNING_NIGHTLY_JOB_ENABLED
```

## 🎯 Behavioral Rules

### 1. Golden Rules (Sacred Developer Pact)

#### Core Principles
1. **ALWAYS USE SPECIALIZED AGENTS FIRST**: Activate domain-specific expertise before any task
2. **Think → Plan → Execute**: Systematic approach to problem-solving
3. **Task Documentation**: Write plans to `tasks/todo.md` with checkable items
4. **Plan Verification**: Check in with user before execution
5. **Simplicity Principle**: Minimal impact, maximum effectiveness
6. **Review Process**: Document changes and rationale in review section
7. **Quality Standards**: No temporary fixes, find root causes
8. **Simplicity Focus**: Impact only necessary code relevant to the task

#### Autonomous Operation Principles
- **Think Before Acting**: Use codebase_search for understanding
- **Learn Continuously**: Update knowledge with each interaction
- **Parallel Processing**: Execute multiple operations simultaneously
- **Memory First**: Check memories before making assumptions
- **Pattern Recognition**: Extract and save reusable patterns

### 2. Serena MCP Integration Rules

#### Primary Tool Usage
- **ALWAYS use Serena for memory management and semantic code operations**
- **Use `activate_project` and `get_active_project` for project context**
- **Use `find_symbol` and `get_symbols_overview` for code understanding**
- **Use `write_memory` and `read_memory` for persistent knowledge**
- **Use thinking tools for self-reflection and quality assurance**

#### Memory Management Workflow
```yaml
memory_operations:
  create:
    trigger: New pattern or learning discovered
    action: write_memory(name="Pattern: [descriptive title]", content="[detailed knowledge]")
  
  read:
    trigger: Need to recall previous learning
    action: read_memory(name="[memory_name]") or list_memories()
  
  update:
    trigger: Existing knowledge needs refinement
    action: delete_memory(name="[old_memory_name]") then write_memory(name="[updated_title]", content="[refined knowledge]")
  
  delete:
    trigger: Knowledge contradicted or obsolete
    action: delete_memory(name="[memory_name]")
```

### 3. Workflow Rules

#### Task Execution Workflow
1. **Agent Activation**: Activate appropriate specialized agent
2. **Project Context**: Set project context with `activate_project`
3. **Memory Check**: Use `list_memories` and `read_memory` for existing knowledge
4. **Understanding**: Use Serena's semantic tools for code structure
5. **Planning**: Create plan in `tasks/todo.md` and verify with user
6. **Execution**: Implement with minimal impact and maximum simplicity
7. **Validation**: Test and verify results
8. **Documentation**: Update knowledge and create review summary

#### Code Change Rules
- **Always search existing code first**: Use `find_symbol` and `find_referencing_code_snippets`
- **Follow established patterns**: Mirror existing code structure and conventions
- **Use semantic editing**: Use `replace_symbol_body` for symbol-aware changes
- **Test changes**: Run relevant tests after modifications
- **Document rationale**: Explain why changes were made

## 🔧 Automation Rules

### 1. Auto-Commit Script Rules

#### Script Structure Template
```bash
#!/bin/bash
set -e  # Exit on error

# Configuration section
LOG_FILE="$HOME/.claude/auto-commit.log"
PROJECT_DIR="$(pwd)"
FEATURE_TOGGLE="${FEATURE_TOGGLE:-false}"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SCRIPT] $1" | tee -a "$LOG_FILE"
}

# Validation checks
# - Environment validation
# - Configuration validation
# - Safety checks

# Processing logic
# - Main functionality
# - Error handling
# - Success confirmation

# Cleanup
# - Resource cleanup
# - Final status reporting
```

#### Auto-Commit Safety Rules
- **Validate git configuration**: Check user.name and user.email
- **Check for large changes**: Skip commits for >1000 files
- **Validate builds**: Run `go build` for Go projects
- **Format code**: Run `go fmt` for Go projects
- **Protected branch warnings**: Warn on main/master branches
- **Comprehensive logging**: Log all activities for troubleshooting

### 2. Hook System Rules

#### Hook Configuration
- **PostToolUse hooks**: Trigger on Write, Edit, MultiEdit, and Serena operations
- **Validation hooks**: Pre-execution validation for safety
- **Notification hooks**: Status updates and error reporting
- **Cleanup hooks**: Resource cleanup and finalization

#### Hook Safety Rules
- **Fail-safe operation**: Hooks should not break normal operation
- **Comprehensive logging**: Log all hook activities
- **Error handling**: Graceful error handling and recovery
- **Performance consideration**: Hooks should not significantly impact performance

### 3. Testing Automation Rules

#### Test Script Structure
```bash
#!/bin/bash
set -e

# Test configuration
TEST_LEVEL="${TEST_LEVEL:-full}"  # smoke, full, comprehensive
MOCK_MODE="${MOCK_MODE:-true}"
VERBOSE="${VERBOSE:-false}"

# Test counters and tracking
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test execution
# - Environment setup
# - Test execution
# - Result validation
# - Report generation
# - Cleanup
```

#### Testing Rules
- **Comprehensive coverage**: Unit, integration, E2E, and performance tests
- **Mock mode support**: Testing without external dependencies
- **Result reporting**: Detailed test reports with success/failure metrics
- **Environment cleanup**: Proper cleanup after test execution

## 🛡️ Security and Quality Rules

### 1. Permission System Rules

#### Permission Structure
- **Allow list**: Explicit permission grants for specific tools
- **Deny list**: Explicit permission blocks for restricted operations
- **Tool restrictions**: Limited tool access per agent specialization
- **Environment isolation**: Separate configurations for different environments

#### Security Rules
- **Principle of least privilege**: Grant minimum necessary permissions
- **Explicit allow/deny**: No implicit permissions
- **Environment isolation**: Separate configs for dev/staging/production
- **Audit logging**: Log all permission-related activities

### 2. Quality Assurance Rules

#### Code Quality Standards
- **Structured logging**: Use built-in logger from `internal/log` package
- **Error handling**: Comprehensive error wrapping and context
- **Testing coverage**: >80% unit test coverage
- **Documentation**: Comprehensive documentation with examples
- **Performance**: Sub-second response times for standard operations

#### Quality Gates
- **All tests must pass**: Before any merge or deployment
- **Coverage thresholds**: Maintain >80% test coverage
- **Performance benchmarks**: Maintain performance standards
- **Security scans**: Clean security scan results

### 3. Error Handling Rules

#### Error Management
- **Wrap errors with context**: Provide meaningful error information
- **Log errors comprehensively**: Include stack traces and context
- **User-friendly messages**: Return actionable error messages
- **Graceful degradation**: Handle errors without breaking functionality
- **Recovery mechanisms**: Implement retry and fallback strategies

## 📁 File and Directory Rules

### 1. Naming Conventions

#### File Naming Rules
- **Agent files**: `{domain}-specialist.md`
- **Scripts**: `{action}-{target}.sh` (e.g., `auto-commit.sh`, `setup-provider.sh`)
- **Configuration**: `settings.local.json` for local overrides
- **Documentation**: `README.md` for system overviews

#### Directory Structure Rules
```
.claude/
├── settings.local.json          # Local configuration overrides
└── agents/                      # Specialized agent definitions
    ├── README.md               # System overview and coordination
    └── {domain}-specialist.md  # Individual agent definitions

scripts/                         # Automation and utilities
├── auto-commit.sh              # Git automation
├── setup-*.sh                  # Environment setup
├── test-*.sh                   # Testing automation
└── debug-*.sh                  # Troubleshooting
```

### 2. Content Organization Rules

#### Agent Content Structure
1. **Metadata header**: YAML frontmatter with name, description, tools
2. **Core responsibilities**: 5 key areas of responsibility
3. **Architecture understanding**: Key files and patterns
4. **Development patterns**: Workflow and quality standards
5. **Workflow process**: Step-by-step approach

#### Documentation Rules
- **Comprehensive coverage**: Document all aspects of the system
- **Usage examples**: Provide real-world examples
- **Troubleshooting guides**: Common issues and solutions
- **Best practices**: Recommended patterns and anti-patterns

## 🔄 Continuous Improvement Rules

### 1. Feedback and Learning Rules

#### Learning Cycle
1. **Explore**: Use codebase_search and semantic tools
2. **Analyze**: Compare findings with existing knowledge
3. **Apply**: Use learned patterns in new contexts
4. **Persist**: Save successful strategies to memory

#### Pattern Recognition
- **Track common requests**: Identify recurring user needs
- **Extract successful patterns**: Document what works well
- **Build domain knowledge**: Accumulate specialized expertise
- **Optimize responses**: Improve based on feedback

### 2. Performance Monitoring Rules

#### Metrics Tracking
- **Agent effectiveness**: Track success rates and user satisfaction
- **Response times**: Monitor performance and optimize
- **Memory usage**: Track knowledge accumulation and retrieval
- **Error rates**: Monitor and reduce error occurrences

#### Optimization Rules
- **Continuous monitoring**: Track performance metrics
- **Performance optimization**: Optimize for speed and efficiency
- **Resource management**: Efficient use of memory and processing
- **Scalability planning**: Plan for growth and increased usage

### 3. Knowledge Management Rules

#### Memory Organization
- **Descriptive naming**: Use searchable, descriptive memory names
- **Categorization**: Organize memories by domain and type
- **Version control**: Track changes and updates to knowledge
- **Cleanup**: Remove outdated or incorrect information

#### Knowledge Validation
- **Fact checking**: Verify information before saving
- **Source tracking**: Track sources of information
- **Update mechanisms**: Regular review and update of knowledge
- **Conflict resolution**: Handle conflicting information appropriately

## 🚀 Implementation Guidelines

### 1. Agent Setup Process

#### New Agent Creation
1. **Identify domain**: Determine specialized area of expertise
2. **Create agent file**: Use template structure in `.claude/agents/`
3. **Define responsibilities**: List 5 core responsibility areas
4. **Specify tools**: Include necessary tools and permissions
5. **Document patterns**: Capture domain-specific patterns and conventions
6. **Test integration**: Verify agent works with existing system
7. **Update documentation**: Update README.md with new agent

#### Agent Maintenance
- **Regular updates**: Keep agent knowledge current
- **Pattern evolution**: Update patterns based on new learnings
- **Tool updates**: Add new tools as needed
- **Performance monitoring**: Track agent effectiveness

### 2. Configuration Management

#### Environment Setup
1. **Create settings.local.json**: Configure local overrides
2. **Set up hooks**: Configure PostToolUse hooks
3. **Configure permissions**: Set appropriate allow/deny lists
4. **Test configuration**: Verify all settings work correctly
5. **Document setup**: Document configuration for team members

#### Configuration Validation
- **Schema validation**: Validate configuration structure
- **Environment testing**: Test in different environments
- **Security review**: Review security implications
- **Performance impact**: Assess performance impact

### 3. Automation Setup

#### Script Development
1. **Follow template**: Use established script structure
2. **Implement safety**: Include comprehensive safety checks
3. **Add logging**: Include detailed logging for troubleshooting
4. **Test thoroughly**: Test in various scenarios
5. **Document usage**: Provide clear usage documentation

#### Hook Configuration
1. **Identify triggers**: Determine when hooks should fire
2. **Implement validation**: Add pre-execution validation
3. **Handle errors**: Implement comprehensive error handling
4. **Monitor performance**: Ensure hooks don't impact performance
5. **Test integration**: Verify hooks work with existing system

## 📋 Compliance and Validation

### 1. Ruleset Compliance

#### Compliance Checklist
- [ ] All agents follow metadata template structure
- [ ] All scripts follow established patterns
- [ ] Configuration follows hierarchy and naming conventions
- [ ] Error handling follows established patterns
- [ ] Logging follows structured format
- [ ] Testing follows comprehensive coverage requirements
- [ ] Documentation follows established standards

#### Validation Process
1. **Automated checks**: Scripts to validate compliance
2. **Manual review**: Regular review of ruleset adherence
3. **Performance monitoring**: Track impact of rules on performance
4. **User feedback**: Collect feedback on ruleset effectiveness

### 2. Continuous Validation

#### Ongoing Monitoring
- **Compliance tracking**: Monitor adherence to ruleset
- **Performance impact**: Track performance impact of rules
- **User satisfaction**: Monitor user satisfaction with system
- **Error rates**: Track error rates and types

#### Improvement Process
1. **Identify issues**: Identify problems with current ruleset
2. **Analyze root cause**: Understand why issues occur
3. **Propose solutions**: Develop solutions to address issues
4. **Test solutions**: Test proposed solutions thoroughly
5. **Implement changes**: Implement validated solutions
6. **Monitor results**: Track impact of changes

## 🎯 Success Metrics

### 1. Performance Metrics

#### Efficiency Metrics
- **Development speed**: 40-80% faster development with specialized agents
- **Error reduction**: Reduced error rates through systematic approaches
- **Quality improvement**: Improved code quality through established patterns
- **User satisfaction**: Higher user satisfaction with consistent results

#### Quality Metrics
- **Test coverage**: >80% test coverage maintained
- **Performance**: Sub-second response times for standard operations
- **Reliability**: Zero critical bugs in core functionality
- **Documentation**: Comprehensive and up-to-date documentation

### 2. Adoption Metrics

#### Usage Metrics
- **Agent activation**: Regular use of specialized agents
- **Memory utilization**: Active use of memory management system
- **Automation usage**: Regular use of automated scripts and hooks
- **Pattern adoption**: Adoption of established patterns and conventions

#### Impact Metrics
- **Development velocity**: Increased development speed
- **Code quality**: Improved code quality and maintainability
- **Team productivity**: Enhanced team productivity and collaboration
- **System reliability**: Improved system reliability and stability

This comprehensive ruleset provides a solid foundation for consistent, high-quality agent operation while maintaining the mystical three-phase alchemical process and embracing modern software engineering practices. Regular review and updates ensure the ruleset remains relevant and effective as the system evolves. 