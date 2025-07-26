#!/bin/bash

# Interactive provider setup script for Prompt Alchemy

set -e  # Exit on error

# Configuration section
LOG_FILE="$HOME/.claude/setup-provider.log"
PROJECT_DIR="$(pwd)"
FEATURE_TOGGLE="${FEATURE_TOGGLE:-false}"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SETUP-PROVIDER] $1" | tee -a "$LOG_FILE"
}

# Error handling function
handle_error() {
    log "ERROR: $1"
    exit 1
}

# Validation function
validate_environment() {
    log "Validating environment..."
    if [ ! -d "$PROJECT_DIR" ]; then
        handle_error "Invalid project directory: $PROJECT_DIR"
    fi
}

# Function to test provider connection
test_provider() {
    local provider=$1
    log "Testing $provider connection..."
    
    # Try the API endpoint
    response=$(curl -s -X POST http://localhost:5747/api/v1/providers \
        -H "Content-Type: application/json" \
        -d '{}' 2>/dev/null)
    
    if [[ $response == *"$provider"* ]]; then
        log "✅ SUCCESS: $provider connection test passed"
        return 0
    else
        log "❌ FAILED: $provider connection test failed"
        return 1
    fi
}

# Function to save configuration
save_config() {
    local provider=$1
    local key=$2
    
    log "Saving configuration for $provider"
    
    # Create config directory if it doesn't exist
    mkdir -p ~/.prompt-alchemy
    
    # Check if config.yaml exists
    if [ ! -f ~/.prompt-alchemy/config.yaml ]; then
        log "Creating new config file..."
        cat > ~/.prompt-alchemy/config.yaml <<EOF
# Prompt Alchemy Configuration
providers:
  $provider:
    api_key: "$key"

generation:
  default_provider: "$provider"
  default_temperature: 0.7

embeddings:
  provider: "openai"
EOF
    else
        log "Updating existing config file..."
        # This is a simple append - in production you'd want proper YAML parsing
        echo "Note: Manual editing of ~/.prompt-alchemy/config.yaml may be needed for complex setups"
    fi
    
    # Also create/update .env file
    log "Creating .env file..."
    cat > .env <<EOF
# Prompt Alchemy Environment Variables
PROMPT_ALCHEMY_PROVIDERS_${provider^^}_API_KEY=$key
PROMPT_ALCHEMY_GENERATION_DEFAULT_PROVIDER=$provider
EOF
    
    log "✅ Configuration saved to:"
    log "   - ~/.prompt-alchemy/config.yaml"
    log "   - ./.env"
}

# Main execution function
main() {
    log "Starting provider setup wizard"
    validate_environment
    
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║         Prompt Alchemy Provider Setup Wizard              ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "This wizard will help you configure at least one LLM provider."
    echo "You need at least one provider configured for the system to work."
    echo ""

    # Main menu
    echo "Which provider would you like to configure?"
    echo ""
    echo "1) OpenAI (Recommended - includes embeddings)"
    echo "2) Anthropic Claude"
    echo "3) Google Gemini"
    echo "4) Ollama (Local - no API key needed)"
    echo "5) OpenRouter"
    echo "6) Skip setup (not recommended)"
    echo ""
    read -p "Select an option (1-6): " choice

    case $choice in
        1)
            provider="openai"
            echo ""
            echo "=== OpenAI Setup ==="
            echo "Get your API key from: https://platform.openai.com/api-keys"
            echo ""
            read -p "Enter your OpenAI API key (sk-...): " api_key
            
            if [[ $api_key == sk-* ]]; then
                export PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="$api_key"
                save_config "openai" "$api_key"
                
                # Restart containers to pick up new config
                echo ""
                echo "Restarting services with new configuration..."
                docker-compose --profile hybrid down
                docker-compose --profile hybrid up -d
                
                # Wait for services to start
                echo "Waiting for services to start..."
                sleep 5
                
                # Test connection
                test_provider "openai"
            else
                echo "❌ Invalid API key format. OpenAI keys should start with 'sk-'"
                exit 1
            fi
            ;;
            
        2)
            provider="anthropic"
            echo ""
            echo "=== Anthropic Claude Setup ==="
            echo "Get your API key from: https://console.anthropic.com/account/keys"
            echo ""
            read -p "Enter your Anthropic API key (sk-ant-...): " api_key
            
            if [[ $api_key == sk-ant-* ]]; then
                export PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY="$api_key"
                save_config "anthropic" "$api_key"
                
                echo ""
                echo "⚠️  Note: Anthropic doesn't support embeddings."
                echo "You'll need OpenAI configured as well for full functionality."
                echo ""
                
                # Restart and test
                docker-compose --profile hybrid restart
                sleep 5
                test_provider "anthropic"
            else
                echo "❌ Invalid API key format. Anthropic keys should start with 'sk-ant-'"
                exit 1
            fi
            ;;
            
        3)
            provider="google"
            echo ""
            echo "=== Google Gemini Setup ==="
            echo "Get your API key from: https://makersuite.google.com/app/apikey"
            echo ""
            read -p "Enter your Google API key (AIza...): " api_key
            
            if [[ $api_key == AIza* ]]; then
                export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY="$api_key"
                save_config "google" "$api_key"
                
                echo ""
                echo "⚠️  Note: Google doesn't support embeddings."
                echo "You'll need OpenAI configured as well for full functionality."
                echo ""
                
                # Restart and test
                docker-compose --profile hybrid restart
                sleep 5
                test_provider "google"
            else
                echo "❌ Invalid API key format. Google keys should start with 'AIza'"
                exit 1
            fi
            ;;
            
        4)
            provider="ollama"
            echo ""
            echo "=== Ollama Setup ==="
            echo "Ollama runs locally and doesn't need an API key."
            echo ""
            echo "1) First, install Ollama from: https://ollama.ai"
            echo "2) Then run: ollama pull llama3"
            echo ""
            read -p "Have you installed Ollama? (y/n): " installed
            
            if [[ $installed == "y" || $installed == "Y" ]]; then
                # Check if Ollama is running
                if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
                    echo "✅ Ollama is running!"
                    
                    # Save config without API key
                    mkdir -p ~/.prompt-alchemy
                    cat > ~/.prompt-alchemy/config.yaml <<EOF
providers:
  ollama:
    base_url: "http://localhost:11434"

generation:
  default_provider: "ollama"
  default_temperature: 0.7
EOF
                    
                    # Create .env
                    cat > .env <<EOF
PROMPT_ALCHEMY_PROVIDERS_OLLAMA_BASE_URL=http://localhost:11434
PROMPT_ALCHEMY_GENERATION_DEFAULT_PROVIDER=ollama
EOF
                    
                    echo "✅ Ollama configured successfully!"
                else
                    echo "❌ Ollama is not running. Please start it with: ollama serve"
                    exit 1
                fi
            else
                echo "Please install Ollama first from https://ollama.ai"
                exit 1
            fi
            ;;
            
        5)
            provider="openrouter"
            echo ""
            echo "=== OpenRouter Setup ==="
            echo "Get your API key from: https://openrouter.ai/keys"
            echo ""
            read -p "Enter your OpenRouter API key (sk-or-...): " api_key
            
            if [[ $api_key == sk-or-* ]]; then
                export PROMPT_ALCHEMY_PROVIDERS_OPENROUTER_API_KEY="$api_key"
                save_config "openrouter" "$api_key"
                
                # Restart and test
                docker-compose --profile hybrid restart
                sleep 5
                test_provider "openrouter"
            else
                echo "❌ Invalid API key format. OpenRouter keys should start with 'sk-or-'"
                exit 1
            fi
            ;;
            
        6)
            echo ""
            echo "⚠️  WARNING: No provider configured!"
            echo "The system will not function without at least one provider."
            echo ""
            echo "You can configure providers later by:"
            echo "1. Setting environment variables"
            echo "2. Creating ~/.prompt-alchemy/config.yaml"
            echo "3. Running this script again: ./scripts/setup-provider.sh"
            exit 0
            ;;
            
        *)
            echo "Invalid option. Please run the script again."
            exit 1
            ;;
    esac

    # Final test
    echo ""
    echo "=== Testing Prompt Generation ==="
    echo "Attempting to generate a test prompt..."
    echo ""

    # Test generation
    test_response=$(curl -s -X POST http://localhost:5747/api/v1/prompts/generate \
        -H "Content-Type: application/json" \
        -d '{"input": "Create a hello world function"}' 2>/dev/null)

    if [[ $test_response == *"output"* ]]; then
        echo "✅ SUCCESS! Prompt generation is working!"
        echo ""
        echo "You can now:"
        echo "1. Access the web UI at: http://localhost:5173"
        echo "2. Use the CLI: prompt-alchemy generate 'your prompt idea'"
        echo "3. Check system status: ./monitoring/monitor.sh"
    else
        echo "⚠️  Generation test failed. Please check:"
        echo "1. Docker containers are running: docker-compose ps"
        echo "2. API logs: docker-compose logs prompt-alchemy-api"
        echo "3. Provider configuration in ~/.prompt-alchemy/config.yaml"
    fi

    echo ""
    echo "Setup complete! 🎉"
}

main