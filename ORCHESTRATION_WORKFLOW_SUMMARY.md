# Orchestration Workflow Summary

## Overview

I've designed and implemented a comprehensive orchestration workflow that enables delegation of responses to the second-opinion-generator agent, which then triggers appropriate sub-agents for analysis, solution strategy, and automated corrections.

## Key Deliverables

### 1. ✅ Second Opinion Orchestration Framework
**File**: `/Users/jraymond/.claude/SECOND_OPINION_ORCHESTRATION.md`

- Complete workflow architecture for second-opinion delegation
- Response collection and tracking system
- Domain matching algorithm for agent routing
- Correction approval policies (auto-apply, prompt, manual)
- Audit and tracking mechanisms

### 2. ✅ Slash Commands Reference
**File**: `/Users/jraymond/.claude/SLASH_COMMANDS_REFERENCE.md`

- Comprehensive documentation of ALL slash commands
- Organized by category (Development, Analysis, Quality, etc.)
- Includes new review commands:
  - `/second-opinion [response_id]` - Single response review
  - `/orchestrate-review [batch_id]` - Batch review workflow
  - `/review-status [review_id]` - Check progress
  - `/review-report` - Generate analytics
- Flag reference and advanced usage examples

### 3. ✅ Enhanced Second-Opinion Generator
**File**: `/Users/jraymond/.claude/agents/second-opinion-generator.md`

- Added orchestration integration capabilities
- Issue identification and domain matching
- Delegation workflow implementation
- Added Task tool for agent coordination
- Integration with approval policies

### 4. ✅ Updated Global Commands
**File**: `/Users/jraymond/.claude/COMMANDS.md`

- Added new "Review & Quality Orchestration Commands" section
- Documented all second-opinion related commands
- Integrated with existing command structure

## Orchestration Workflow

### Core Flow
```
1. Trigger → 2. Analysis → 3. Routing → 4. Execution → 5. Validation → 6. Application
```

### Detailed Process

1. **Response Capture**
   - Manual: `/second-opinion [response_id]`
   - Batch: `/orchestrate-review [batch_id]`
   - Auto: Quality score < 0.8

2. **Second Opinion Generation**
   - Analyzes response quality
   - Identifies specific issues
   - Creates comprehensive review package
   - Saves to `.claude/prompts/[category]/`

3. **Agent Routing**
   - Maps issues to domain specialists
   - UI issues → react-frontend-specialist
   - API issues → go-backend-specialist
   - Test issues → testing-qa-specialist
   - etc.

4. **Parallel/Sequential Execution**
   - Independent issues processed in parallel
   - Dependent issues handled sequentially
   - Timeout and retry mechanisms

5. **Correction Approval**
   - **Auto-Apply**: High confidence (>0.95), low risk
   - **Prompt**: Medium confidence (0.7-0.95)
   - **Manual**: Low confidence (<0.7), high risk

6. **Audit Trail**
   - Complete tracking of all changes
   - Review session logs
   - Performance metrics

## Configuration

### Approval Policy Configuration
```yaml
# .claude/orchestration.yaml
second_opinion:
  correction_policy:
    default: "prompt_confirmation"
    overrides:
      - domain: "testing"
        policy: "auto_apply"
      - domain: "security"
        policy: "manual_review"
```

### Example Workflows

#### Single Response Review
```bash
/second-opinion resp_12345
# → Analyzes response
# → Finds missing error handling
# → Routes to go-backend-specialist
# → Prompts for approval
# → Applies fix
```

#### Batch Review with Auto-Correction
```bash
/orchestrate-review --period today --auto-apply
# → Gathers 15 responses
# → Parallel analysis
# → Routes to multiple specialists
# → Auto-applies high-confidence fixes
# → Reports results
```

## Benefits

1. **Quality Assurance**: Automated review of all AI responses
2. **Efficient Routing**: Issues go to the right specialists
3. **Flexible Approval**: Configurable correction policies
4. **Complete Tracking**: Full audit trail of all changes
5. **Parallel Processing**: Fast correction of multiple issues

## Next Steps

1. **Test the Workflow**:
   ```bash
   # Try a single review
   /second-opinion last
   
   # Try batch review
   /orchestrate-review --period today --dry-run
   ```

2. **Configure Policies**:
   - Set domain-specific approval rules
   - Adjust confidence thresholds
   - Configure parallel limits

3. **Monitor Performance**:
   ```bash
   /review-report --period week
   /agent-performance
   ```

## Technical Implementation

### Key Components

1. **Review Session Tracking**:
   - Unique IDs for each review
   - Status tracking (pending → analyzing → correcting → complete)
   - Structured storage in `.claude/reviews/`

2. **Domain Matching Algorithm**:
   - Keyword-based scoring
   - Multi-domain support
   - Confidence scoring

3. **Delegation Strategies**:
   - Single issue → Direct delegation
   - Multi-domain → Parallel delegation
   - Complex → Sequential with dependencies
   - Uncertain → Orchestrator triage

4. **Audit System**:
   - Comprehensive logging
   - Performance metrics
   - User satisfaction tracking

## Integration Points

- **Wave System**: Complex reviews trigger wave orchestration
- **Persona System**: Auto-activates relevant personas
- **MCP Servers**: Uses Sequential for analysis, Context7 for patterns
- **Task Tool**: Enables multi-agent coordination

---

This orchestration workflow provides a robust system for continuous quality improvement through automated review and correction delegation. The flexible approval policies ensure that changes are applied appropriately based on confidence and risk levels.