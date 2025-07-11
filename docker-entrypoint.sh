#!/bin/sh
# Docker entrypoint script to handle environment variable mapping

# Map environment variables to the format expected by the application
# The app uses viper which expects underscores in env vars

# Map standard API key env vars to viper format if they exist
if [ -n "$OPENAI_API_KEY" ]; then
    export PROMPT_ALCHEMY_PROVIDERS_OPENAI_API_KEY="$OPENAI_API_KEY"
fi

if [ -n "$ANTHROPIC_API_KEY" ]; then
    export PROMPT_ALCHEMY_PROVIDERS_ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
fi

if [ -n "$GOOGLE_API_KEY" ]; then
    export PROMPT_ALCHEMY_PROVIDERS_GOOGLE_API_KEY="$GOOGLE_API_KEY"
fi

if [ -n "$OPENROUTER_API_KEY" ]; then
    export PROMPT_ALCHEMY_PROVIDERS_OPENROUTER_API_KEY="$OPENROUTER_API_KEY"
fi

# Execute the command
exec "$@"