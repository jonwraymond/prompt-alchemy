# Semantic Search Hooks User Configuration Template
# Copy this to ~/.claude/semantic-search-config.sh and customize as needed

# ============================================
# VISIBILITY SETTINGS - Show hook activity in Claude Code chat
# ============================================

# Enable basic hook activity visibility (recommended)
HOOK_VERBOSE="true"

# Show detailed debugging information (use when troubleshooting)
HOOK_DEBUG="false"

# Show which tools are selected for each operation
SHOW_TOOL_SELECTION="true"

# Show performance metrics (timing and token usage)
SHOW_PERFORMANCE="true"

# ============================================
# TOOL PREFERENCES
# ============================================

# Tool priorities (higher = preferred)
# Uncomment and modify as needed:

# TOOL_PRIORITIES["serena"]=10      # LSP-based semantic understanding
# TOOL_PRIORITIES["ast-grep"]=7     # AST-aware pattern matching  
# TOOL_PRIORITIES["code2prompt"]=5  # Context generation
# TOOL_PRIORITIES["grep"]=3         # Text search fallback

# ============================================
# TOKEN MANAGEMENT
# ============================================

# Token budgets by operation type
# Uncomment and modify as needed:

# TOKEN_BUDGETS["file_context"]=3000
# TOKEN_BUDGETS["project_overview"]=8000
# TOKEN_BUDGETS["simple_query"]=1000
# TOKEN_BUDGETS["complex_query"]=10000

# ============================================
# PERFORMANCE TUNING
# ============================================

# Tool timeouts (seconds)
# Uncomment and modify as needed:

# TIMEOUTS["serena"]=30
# TIMEOUTS["ast-grep"]=15
# TIMEOUTS["code2prompt"]=45
# TIMEOUTS["grep"]=10

# Cache settings
# CACHE_TTL=3600        # 1 hour
# CACHE_MAX_SIZE=100    # Max cached items per type

# ============================================
# LOGGING PREFERENCES
# ============================================

# Log level (debug, info, warn, error)
LOG_LEVEL="info"

# Custom log file location (optional)
# LOG_FILE="$HOME/.claude/my-semantic-search.log"

# ============================================
# EXAMPLES FOR DIFFERENT VISIBILITY LEVELS
# ============================================

# Minimal visibility (just see when hooks run):
# HOOK_VERBOSE="true"
# SHOW_TOOL_SELECTION="false"
# SHOW_PERFORMANCE="false"

# Full visibility (see everything):
# HOOK_VERBOSE="true"
# HOOK_DEBUG="true" 
# SHOW_TOOL_SELECTION="true"
# SHOW_PERFORMANCE="true"

# Debug mode (for troubleshooting):
# HOOK_VERBOSE="true"
# HOOK_DEBUG="true"
# LOG_LEVEL="debug"

# Silent mode (no chat output, logs only):
# HOOK_VERBOSE="false"
# SHOW_TOOL_SELECTION="false"
# SHOW_PERFORMANCE="false"