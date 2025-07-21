#!/bin/bash
set -e

echo "🎯 Prompt Alchemy MCP Server - Demo Workflow"
echo "=============================================="
echo ""
echo "This script demonstrates the complete workflow of the prompt-alchemy MCP server"
echo "including self-learning capabilities and meta-prompting."
echo ""

# Check if API key is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: OPENAI_API_KEY is not set."
    echo "This demo will show the workflow structure but won't make actual API calls."
    echo ""
    echo "To run with real API calls, set your API key:"
    echo "export OPENAI_API_KEY='your-key-here'"
    echo ""
fi

echo "📋 Demo Workflow Steps:"
echo "1. Generate initial prompts for a coding task"
echo "2. Search for similar patterns in history"
echo "3. Optimize the best prompt with meta-prompting"
echo "4. Batch generate related prompts"
echo "5. Show self-learning progression"
echo ""

# Function to simulate MCP tool usage
demo_tool() {
    local tool_name="$1"
    local description="$2"
    local example_input="$3"
    
    echo "🔧 Step: $tool_name"
    echo "   Description: $description"
    echo "   Example input: $example_input"
    echo ""
    
    # In a real scenario, Claude Code would execute the MCP tool
    echo "   → In Claude Code, you would say:"
    echo "     \"Use $tool_name with $example_input\""
    echo ""
    
    # Simulate some processing time
    sleep 1
    
    echo "   ✅ Tool would execute and return enhanced results"
    echo "   💡 Self-learning: Historical patterns would be applied"
    echo ""
}

# Demo workflow
echo "🚀 Starting Demo Workflow"
echo "=========================="
echo ""

# Step 1: Generate initial prompts
demo_tool "generate_prompts" \
    "Create enhanced prompts through 3 alchemical phases" \
    "input: 'Build a REST API for user authentication', persona: 'code', count: 2"

# Step 2: Search for patterns
demo_tool "search_prompts" \
    "Find similar prompts in historical data" \
    "query: 'REST API authentication', limit: 5"

# Step 3: Optimize with meta-prompting
demo_tool "optimize_prompt" \
    "Improve prompt quality with AI-powered optimization" \
    "prompt: 'Write API code', task: 'Create production-ready API', max_iterations: 3"

# Step 4: Batch generate
demo_tool "batch_generate" \
    "Generate multiple related prompts concurrently" \
    "inputs: [{'input': 'API endpoints'}, {'input': 'Database schema'}], workers: 2"

# Step 5: Show progression
echo "📈 Self-Learning Progression Example"
echo "===================================="
echo ""
echo "First use (Week 1):"
echo "  Input: 'Create a web API'"
echo "  Output: Basic prompt structure"
echo "  Context: No historical data"
echo ""
echo "After learning (Week 4):"
echo "  Input: 'Create a web API'"
echo "  Output: Enhanced prompt with:"
echo "    • Best practices from successful patterns"
echo "    • Optimal provider recommendations"
echo "    • Relevant examples from history"
echo "    • Learned parameter settings"
echo ""
echo "Advanced usage (Week 8):"
echo "  Input: 'Create a web API'"
echo "  Output: Sophisticated prompt including:"
echo "    • Domain-specific insights"
echo "    • Cross-referenced successful patterns"
echo "    • Predictive provider selection"
echo "    • Contextual learning insights"
echo ""

echo "🎉 Demo Complete!"
echo "================"
echo ""
echo "Real Usage Instructions:"
echo "1. Set API keys: export OPENAI_API_KEY='your-key'"
echo "2. Restart Claude Code to load MCP server"
echo "3. In Claude Code conversations, use the tools:"
echo "   - generate_prompts for enhanced prompt creation"
echo "   - search_prompts for finding similar patterns"
echo "   - optimize_prompt for meta-prompting improvements"
echo "   - batch_generate for multiple concurrent tasks"
echo ""
echo "📊 Expected Benefits:"
echo "• Improved prompt quality over time"
echo "• Intelligent pattern recognition"
echo "• Personalized optimization based on your usage"
echo "• Cross-domain learning and application"
echo ""
echo "🔄 Self-Learning Features:"
echo "• Vector embeddings for similarity search"
echo "• Historical pattern extraction"
echo "• Provider performance learning"
echo "• Contextual enhancement based on success patterns"
echo ""
echo "📁 Data Storage:"
echo "• Database: ~/.prompt-alchemy/prompts.db"
echo "• Vectors: ~/.prompt-alchemy/chromem-vectors/"
echo "• Config: ~/.prompt-alchemy/config.yaml"
echo ""
echo "For detailed examples, see:"
echo "• /examples/workflows.md - Complete workflow patterns"
echo "• /examples/practical-examples.md - Copy-paste examples"
echo "• /docs/claude-code-deployment.md - Technical documentation"
echo ""
echo "Start using the tools and watch the system learn and improve!"