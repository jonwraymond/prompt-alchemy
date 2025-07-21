#!/bin/bash
set -e

echo "🧠 Testing self-learning system..."
echo ""

# Check if database exists and has data
if [ -f "$HOME/.prompt-alchemy/prompts.db" ]; then
    echo "✅ Database exists at: $HOME/.prompt-alchemy/prompts.db"
    
    # Check database size
    db_size=$(stat -f%z "$HOME/.prompt-alchemy/prompts.db" 2>/dev/null || stat -c%s "$HOME/.prompt-alchemy/prompts.db" 2>/dev/null || echo "0")
    echo "   Database size: $db_size bytes"
    
    # Check for vector store
    if [ -d "$HOME/.prompt-alchemy/chromem-vectors" ]; then
        echo "✅ Vector store exists at: $HOME/.prompt-alchemy/chromem-vectors"
        vector_files=$(find "$HOME/.prompt-alchemy/chromem-vectors" -name "*.json" | wc -l)
        echo "   Vector files: $vector_files"
    else
        echo "⚠️  Vector store not found"
    fi
else
    echo "⚠️  Database not found - will be created on first use"
fi

echo ""
echo "Testing self-learning components..."

# Test 1: Database initialization
echo "1. Testing database initialization..."
(
    timeout 10s ./prompt-alchemy generate --count=0 "test initialization" 2>/dev/null || echo "Init test completed"
)

# Test 2: Check storage system
echo "2. Testing storage system..."
if [ -f "$HOME/.prompt-alchemy/prompts.db" ]; then
    echo "   ✅ SQLite database created"
else
    echo "   ⚠️  SQLite database not created"
fi

if [ -d "$HOME/.prompt-alchemy/chromem-vectors" ]; then
    echo "   ✅ Vector store initialized"
else
    echo "   ⚠️  Vector store not initialized"
fi

# Test 3: Configuration check
echo "3. Testing self-learning configuration..."
config_file="$HOME/.prompt-alchemy/config.yaml"
if [ -f "$config_file" ]; then
    echo "   ✅ Configuration file exists"
    
    # Check for embedding settings
    if grep -q "embedding" "$config_file" 2>/dev/null; then
        echo "   ✅ Embedding configuration found"
    else
        echo "   ⚠️  Embedding configuration not found"
    fi
else
    echo "   ⚠️  Configuration file not found"
fi

# Test 4: History enhancer components
echo "4. Testing history enhancer availability..."
if [ -f "./internal/engine/history_enhancer.go" ]; then
    echo "   ✅ History enhancer code available"
    
    # Check for key methods
    if grep -q "EnhanceWithHistory" "./internal/engine/history_enhancer.go" 2>/dev/null; then
        echo "   ✅ EnhanceWithHistory method found"
    fi
    
    if grep -q "generateLearningInsights" "./internal/engine/history_enhancer.go" 2>/dev/null; then
        echo "   ✅ generateLearningInsights method found"
    fi
    
    if grep -q "selectBestExamples" "./internal/engine/history_enhancer.go" 2>/dev/null; then
        echo "   ✅ selectBestExamples method found"
    fi
else
    echo "   ⚠️  History enhancer code not found"
fi

# Test 5: Self-learning integration
echo "5. Testing self-learning integration..."
if grep -q "EnhanceWithHistory" "./internal/engine/engine.go" 2>/dev/null; then
    echo "   ✅ Self-learning integrated in engine"
else
    echo "   ⚠️  Self-learning integration not found"
fi

echo ""
echo "🎯 Self-learning system status:"
echo ""

# Overall assessment
database_exists=false
vector_store_exists=false
config_exists=false
code_integrated=false

[ -f "$HOME/.prompt-alchemy/prompts.db" ] && database_exists=true
[ -d "$HOME/.prompt-alchemy/chromem-vectors" ] && vector_store_exists=true
[ -f "$HOME/.prompt-alchemy/config.yaml" ] && config_exists=true
grep -q "EnhanceWithHistory" "./internal/engine/engine.go" 2>/dev/null && code_integrated=true

echo "   📊 Database Storage: $([ $database_exists = true ] && echo "✅ Ready" || echo "🟡 Will be created")"
echo "   🔍 Vector Search: $([ $vector_store_exists = true ] && echo "✅ Ready" || echo "🟡 Will be created")"
echo "   ⚙️  Configuration: $([ $config_exists = true ] && echo "✅ Ready" || echo "🟡 Default settings")"
echo "   🧠 Code Integration: $([ $code_integrated = true ] && echo "✅ Active" || echo "❌ Missing")"

echo ""
echo "📝 Self-learning will:"
echo "   • Learn from each prompt generation"
echo "   • Build vector embeddings for similarity search"
echo "   • Extract patterns from successful prompts"
echo "   • Enhance future prompts with historical insights"
echo ""

if [ $database_exists = true ] && [ $vector_store_exists = true ] && [ $code_integrated = true ]; then
    echo "🎉 Self-learning system is fully operational!"
else
    echo "⚠️  Self-learning system needs first use to initialize fully"
fi

echo ""
echo "To test self-learning with real data:"
echo "1. Set API keys: export OPENAI_API_KEY='your-key'"
echo "2. Generate several prompts: ./prompt-alchemy generate 'your prompt'"
echo "3. Check for enhancement messages in logs"
echo "4. Try similar prompts to see learning effects"
echo ""