# Sub-Agent Orchestration Architecture Design

## Overview
This document presents a comprehensive design for implementing the sub-agent orchestration system that users expect based on the documentation. The architecture addresses all three pain points: reliable execution, context inheritance, and reduced user effort.

## Core Architecture Components

### 1. Agent Definition System

#### 1.1 Agent Definition Schema (YAML-based)
```yaml
# .claude/agents/example-agent.yaml
apiVersion: agents/v1
kind: Agent
metadata:
  name: go-backend-specialist
  description: Go backend development expert
  priority: 100  # Higher priority agents execute first
  tags:
    - backend
    - golang
    - api
spec:
  triggers:
    keywords:
      - "backend"
      - "API"
      - "Go"
    patterns:
      - regex: "implement.*endpoint"
      - regex: "fix.*backend"
    files:
      - "*.go"
      - "internal/**/*.go"
  
  capabilities:
    tools:
      - read_file
      - write_file
      - search_code
      - execute_command
    maxTokens: 50000
    timeout: 300s
  
  execution:
    mode: autonomous  # autonomous, guided, validation
    preChecks:
      - name: "go-installed"
        command: "go version"
    postActions:
      - name: "format-code"
        command: "go fmt ./..."
      - name: "run-tests"
        command: "go test ./..."
  
  context:
    inherit:
      - project_structure
      - recent_changes
      - user_preferences
    share:
      - discovered_patterns
      - code_insights
```

### 2. Agent Runtime Architecture

#### 2.1 Core Interfaces
```go
// pkg/agents/interfaces.go
package agents

import (
    "context"
    "time"
)

// Agent represents a specialized AI agent
type Agent interface {
    GetMetadata() AgentMetadata
    Validate() error
    Execute(ctx context.Context, input AgentInput) (AgentOutput, error)
}

// AgentMetadata contains agent identification and configuration
type AgentMetadata struct {
    Name        string
    Description string
    Priority    int
    Tags        []string
    Version     string
}

// AgentInput represents input to an agent
type AgentInput struct {
    Task        string
    Context     AgentContext
    Tools       []Tool
    Constraints ExecutionConstraints
}

// AgentOutput represents agent execution results
type AgentOutput struct {
    Success     bool
    Results     []Result
    Context     AgentContext  // Updated context
    Metrics     ExecutionMetrics
    NextActions []Action
}

// AgentContext manages shared state between agents
type AgentContext struct {
    SharedMemory map[string]interface{}
    History      []HistoryEntry
    Artifacts    map[string]Artifact
    mutex        sync.RWMutex
}

// Tool represents a capability available to agents
type Tool interface {
    GetName() string
    GetDescription() string
    Execute(ctx context.Context, params map[string]interface{}) (interface{}, error)
}
```

#### 2.2 Agent Executor
```go
// pkg/agents/executor.go
package agents

// AgentExecutor manages agent lifecycle and execution
type AgentExecutor struct {
    registry    *AgentRegistry
    context     *ContextManager
    policy      *PolicyEngine
    monitor     *ExecutionMonitor
    toolBridge  *ToolBridge
}

// ExecuteAgent runs a single agent with full lifecycle management
func (e *AgentExecutor) ExecuteAgent(ctx context.Context, agentName string, input AgentInput) (AgentOutput, error) {
    // 1. Load agent definition
    agent, err := e.registry.GetAgent(agentName)
    if err != nil {
        return AgentOutput{}, err
    }
    
    // 2. Validate execution policy
    if err := e.policy.ValidateExecution(agent, input); err != nil {
        return AgentOutput{}, err
    }
    
    // 3. Create execution context with inherited data
    execCtx := e.context.CreateExecutionContext(ctx, agent, input.Context)
    
    // 4. Setup monitoring
    monitor := e.monitor.StartExecution(agent.GetMetadata().Name)
    defer monitor.Complete()
    
    // 5. Execute pre-checks
    if err := e.runPreChecks(execCtx, agent); err != nil {
        return AgentOutput{}, err
    }
    
    // 6. Execute agent
    output, err := agent.Execute(execCtx, input)
    if err != nil {
        monitor.RecordError(err)
        return output, err
    }
    
    // 7. Run post-actions
    if err := e.runPostActions(execCtx, agent, output); err != nil {
        output.Success = false
    }
    
    // 8. Update shared context
    e.context.MergeContext(input.Context, output.Context)
    
    return output, nil
}
```

### 3. Context Inheritance System

#### 3.1 Context Manager
```go
// pkg/agents/context.go
package agents

// ContextManager handles context creation, inheritance, and sharing
type ContextManager struct {
    store       ContextStore
    policies    []ContextPolicy
    serializer  ContextSerializer
}

// CreateExecutionContext creates a new context with inherited data
func (cm *ContextManager) CreateExecutionContext(parent context.Context, agent Agent, sharedCtx AgentContext) context.Context {
    // 1. Create base context
    ctx := context.WithValue(parent, "agent", agent.GetMetadata().Name)
    
    // 2. Apply inheritance policies
    inherited := cm.applyInheritancePolicies(agent, sharedCtx)
    
    // 3. Create isolated workspace
    workspace := cm.createWorkspace(agent)
    
    // 4. Setup context with inherited data and workspace
    execCtx := &ExecutionContext{
        Context:   ctx,
        Shared:    inherited,
        Workspace: workspace,
        Agent:     agent,
    }
    
    return context.WithValue(ctx, "execution", execCtx)
}

// Context inheritance rules
type ContextInheritanceRule struct {
    Pattern     string   // Pattern to match context keys
    Policy      string   // inherit, copy, reference, isolate
    Transform   func(interface{}) interface{}
}

// Example inheritance configuration
var defaultInheritanceRules = []ContextInheritanceRule{
    {Pattern: "project_*", Policy: "inherit"},      // Full inheritance
    {Pattern: "user_*", Policy: "copy"},           // Deep copy
    {Pattern: "secret_*", Policy: "isolate"},      // No access
    {Pattern: "tool_*", Policy: "reference"},      // Reference only
}
```

### 4. Agent Orchestration Layer

#### 4.1 Orchestrator
```go
// pkg/agents/orchestrator.go
package agents

// AgentOrchestrator coordinates multi-agent workflows
type AgentOrchestrator struct {
    executor    *AgentExecutor
    scheduler   *AgentScheduler
    coordinator *WorkflowCoordinator
}

// ExecuteWorkflow runs a multi-agent workflow
func (o *AgentOrchestrator) ExecuteWorkflow(ctx context.Context, workflow Workflow) (WorkflowResult, error) {
    // 1. Parse workflow definition
    dag, err := o.parseWorkflow(workflow)
    if err != nil {
        return WorkflowResult{}, err
    }
    
    // 2. Schedule agents based on dependencies
    schedule := o.scheduler.CreateSchedule(dag)
    
    // 3. Execute agents in parallel where possible
    results := make(map[string]AgentOutput)
    var wg sync.WaitGroup
    
    for _, stage := range schedule.Stages {
        // Execute all agents in this stage in parallel
        for _, agentTask := range stage.Tasks {
            wg.Add(1)
            go func(task AgentTask) {
                defer wg.Done()
                
                // Build input from previous results
                input := o.buildAgentInput(task, results)
                
                // Execute agent
                output, err := o.executor.ExecuteAgent(ctx, task.Agent, input)
                if err != nil {
                    o.handleAgentError(task, err)
                    return
                }
                
                // Store results
                o.storeResults(task.ID, output, results)
            }(agentTask)
        }
        wg.Wait()
    }
    
    return o.aggregateResults(results), nil
}
```

#### 4.2 Workflow Definition
```yaml
# .claude/workflows/feature-implementation.yaml
apiVersion: workflows/v1
kind: Workflow
metadata:
  name: feature-implementation
  description: Implement a new feature with tests
spec:
  agents:
    - id: analyzer
      agent: code-analyzer
      input:
        task: "Analyze existing code structure"
        
    - id: designer  
      agent: architect
      dependsOn: [analyzer]
      input:
        task: "Design feature architecture"
        
    - id: backend
      agent: go-backend-specialist
      dependsOn: [designer]
      input:
        task: "Implement backend logic"
        
    - id: frontend
      agent: react-frontend-specialist  
      dependsOn: [designer]
      input:
        task: "Implement UI components"
        
    - id: tests
      agent: testing-qa-specialist
      dependsOn: [backend, frontend]
      input:
        task: "Create comprehensive tests"
        
    - id: reviewer
      agent: best-practices-enforcer
      dependsOn: [tests]
      input:
        task: "Review implementation"
```

### 5. Tool Bridge System

#### 5.1 Tool Delegation
```go
// pkg/agents/tools.go
package agents

// ToolBridge manages tool access for agents
type ToolBridge struct {
    registry    ToolRegistry
    validator   ToolValidator
    interceptor ToolInterceptor
}

// CreateToolSet creates a filtered tool set for an agent
func (tb *ToolBridge) CreateToolSet(agent Agent, allowed []string) ([]Tool, error) {
    tools := make([]Tool, 0, len(allowed))
    
    for _, toolName := range allowed {
        // Get base tool
        tool, err := tb.registry.GetTool(toolName)
        if err != nil {
            continue
        }
        
        // Validate agent can use this tool
        if err := tb.validator.ValidateAccess(agent, tool); err != nil {
            continue
        }
        
        // Wrap with interceptor for monitoring/control
        wrapped := tb.interceptor.Wrap(tool, agent)
        tools = append(tools, wrapped)
    }
    
    return tools, nil
}

// ToolInterceptor adds monitoring and control to tool execution
type ToolInterceptor struct {
    monitor     *ToolMonitor
    limiter     *RateLimiter
    validator   *InputValidator
}

func (ti *ToolInterceptor) Wrap(tool Tool, agent Agent) Tool {
    return &InterceptedTool{
        Tool:      tool,
        agent:     agent,
        monitor:   ti.monitor,
        limiter:   ti.limiter,
        validator: ti.validator,
    }
}
```

### 6. Policy Framework

#### 6.1 Policy Engine
```go
// pkg/agents/policy.go
package agents

// PolicyEngine enforces execution policies
type PolicyEngine struct {
    policies    []Policy
    evaluator   PolicyEvaluator
    enforcer    PolicyEnforcer
}

// Policy configuration example
type ExecutionPolicy struct {
    Name        string
    Description string
    Rules       []PolicyRule
    Actions     []PolicyAction
}

// Example policy definition
var defaultPolicies = []ExecutionPolicy{
    {
        Name: "resource-limits",
        Rules: []PolicyRule{
            {Type: "max_tokens", Value: 100000},
            {Type: "max_duration", Value: "5m"},
            {Type: "max_memory", Value: "1GB"},
        },
    },
    {
        Name: "tool-access",  
        Rules: []PolicyRule{
            {Type: "deny_tool", Value: "execute_command", Condition: "agent.tags contains 'untrusted'"},
            {Type: "require_approval", Value: "write_file", Condition: "file.path contains 'critical'"},
        },
    },
}
```

#### 6.2 Policy Configuration
```yaml
# .claude/policy.yaml
apiVersion: policy/v1
kind: PolicySet
metadata:
  name: default-policies
spec:
  global:
    resource_limits:
      max_execution_time: 10m
      max_tokens: 100000
      max_parallel_agents: 5
    
    security:
      sandbox_mode: true
      allowed_commands:
        - "go test"
        - "go fmt"
        - "npm test"
      forbidden_paths:
        - "/etc/**"
        - "/System/**"
        - "**/.git/**"
  
  agent_policies:
    - agent: "*"
      rules:
        - type: require_review
          condition: "output contains changes to critical files"
          
    - agent: "best-practices-enforcer"
      rules:
        - type: mandatory_execution
          condition: "any agent modified code"
```

### 7. Integration Architecture

#### 7.1 Engine Integration Points
```go
// internal/engine/agent_integration.go
package engine

// AgentEngine integrates with the main generation engine
type AgentEngine struct {
    baseEngine   *Engine
    orchestrator *agents.AgentOrchestrator
    mode         AgentMode
}

// GenerateWithAgents enhances generation with agent orchestration
func (ae *AgentEngine) GenerateWithAgents(ctx context.Context, input string, opts GenerationOptions) (*Generation, error) {
    // 1. Determine if agents should be involved
    if ae.shouldUseAgents(input, opts) {
        // 2. Create agent workflow based on task
        workflow := ae.createWorkflow(input, opts)
        
        // 3. Execute agent workflow
        result, err := ae.orchestrator.ExecuteWorkflow(ctx, workflow)
        if err != nil {
            return nil, err
        }
        
        // 4. Extract enhanced input from agent results
        enhancedInput := ae.extractEnhancedInput(result)
        opts = ae.updateOptions(result, opts)
    }
    
    // 5. Continue with standard generation
    return ae.baseEngine.Generate(ctx, enhancedInput, opts)
}
```

## Implementation Patterns

### 1. Agent Loading Pattern
```go
// Load agent from YAML definition
func LoadAgent(path string) (Agent, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, err
    }
    
    var def AgentDefinition
    if err := yaml.Unmarshal(data, &def); err != nil {
        return nil, err
    }
    
    return NewAgent(def)
}
```

### 2. Context Sharing Pattern  
```go
// Share context between agents
func (ctx *AgentContext) Share(key string, value interface{}, policy SharingPolicy) error {
    ctx.mutex.Lock()
    defer ctx.mutex.Unlock()
    
    // Apply sharing policy
    processed := policy.Process(value)
    
    // Store in shared memory
    ctx.SharedMemory[key] = processed
    
    // Record in history
    ctx.History = append(ctx.History, HistoryEntry{
        Timestamp: time.Now(),
        Action:    "share",
        Key:       key,
        Agent:     ctx.CurrentAgent(),
    })
    
    return nil
}
```

### 3. Tool Delegation Pattern
```go
// Delegate tool execution with monitoring
func (t *InterceptedTool) Execute(ctx context.Context, params map[string]interface{}) (interface{}, error) {
    // Rate limiting
    if err := t.limiter.Wait(ctx); err != nil {
        return nil, err
    }
    
    // Input validation
    if err := t.validator.Validate(params); err != nil {
        return nil, err
    }
    
    // Monitor start
    span := t.monitor.StartOperation(t.GetName(), t.agent)
    defer span.End()
    
    // Execute actual tool
    result, err := t.Tool.Execute(ctx, params)
    
    // Record metrics
    span.RecordResult(result, err)
    
    return result, err
}
```

## Benefits of This Architecture

### 1. Addresses Pain Point 1: Reliable Execution
- Dedicated executor with lifecycle management
- Pre-checks and post-actions for validation
- Monitoring and error handling built-in
- Resource limits and timeouts enforced

### 2. Addresses Pain Point 2: Context Inheritance
- Sophisticated context management system
- Configurable inheritance policies
- Shared memory with access control
- Context transformation capabilities

### 3. Addresses Pain Point 3: Reduced User Effort
- Automatic agent activation based on triggers
- Workflow orchestration for complex tasks
- Policy-based mandatory execution
- Tool access managed automatically

### 4. Additional Benefits
- Extensible through YAML definitions
- No code changes needed to add agents
- Testable with mock implementations
- Observable through monitoring hooks
- Secure with sandboxing and policies

## Migration Path from Current System

### Phase 1: Foundation (Week 1-2)
1. Implement core interfaces and registry
2. Create basic executor without orchestration
3. Add simple context manager
4. Implement YAML loader for agents

### Phase 2: Integration (Week 3-4)
1. Integrate with existing engine
2. Add tool bridge system
3. Implement basic policies
4. Create first working agent

### Phase 3: Orchestration (Week 5-6)
1. Add workflow coordinator
2. Implement parallel execution
3. Add dependency management
4. Create monitoring system

### Phase 4: Polish (Week 7-8)
1. Add comprehensive testing
2. Create debugging tools
3. Document system
4. Migration existing "agents" to new format

This architecture provides a solid foundation for implementing the sub-agent system users expect while maintaining compatibility with the existing three-phase generation engine.