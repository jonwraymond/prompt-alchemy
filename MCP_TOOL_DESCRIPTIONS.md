# MCP Tool Descriptions - Enhanced for AI Agents

## Overview
This document shows the enhanced MCP tool descriptions that help AI agents make informed decisions about which tool to use and when.

## Enhanced Tool Descriptions

### 1. generate_prompts
**Original**: "Generate AI prompts using phased approach"

**Enhanced**: "Generate refined AI prompts through a systematic three-phase alchemical process. Use this when you need to create new prompts from raw ideas or improve existing concepts. The tool transforms vague ideas into precise, effective prompts optimized for AI models. Supports different strategies: 'best' selects top prompts from each phase, 'cascade' progressively refines through phases, 'all' returns everything. Ideal for creating prompts for coding, writing, analysis, or any AI task."

**Key Decision Points**:
- Use when: Creating new prompts from scratch
- Use when: Have a vague idea that needs refinement
- Use when: Need multiple variations of a prompt
- Strategy selection helps AI choose the right approach

### 2. search_prompts
**Original**: "Search existing prompts"

**Enhanced**: "Search through your stored prompt library to find previously generated or optimized prompts. Use this to avoid regenerating similar prompts and to learn from past successful patterns. The search uses both text matching and semantic similarity (via embeddings) to find relevant prompts. Returns prompts with metadata including scores, phases used, and creation dates. Useful for finding inspiration or reusing effective prompts for similar tasks."

**Key Decision Points**:
- Use before: Generating new prompts (check if similar exists)
- Use when: Looking for inspiration
- Use when: Need to reuse successful patterns
- Leverages semantic search for better results

### 3. get_prompt
**Original**: "Get a specific prompt by ID"

**Enhanced**: "Retrieve the complete details of a specific prompt using its unique ID. Use this when you have a prompt ID from search results or previous generations and need to access its full content, metadata, and generation history. Returns comprehensive information including the prompt text, phase details, provider used, generation parameters, and performance metrics. Essential for examining successful prompts in detail or sharing specific prompts."

**Key Decision Points**:
- Use after: search_prompts to get full details
- Use when: Need complete metadata
- Use when: Sharing or examining specific prompts
- Provides full context and history

### 4. list_providers
**Original**: "List available AI providers"

**Enhanced**: "List all configured and available AI providers (OpenAI, Anthropic, Google, Grok, OpenRouter, Ollama). Use this to check which providers are properly configured with valid API keys, their supported models, and current status. Helps in troubleshooting connection issues and choosing the best provider for specific tasks. Shows provider capabilities, rate limits, and whether they support embeddings. Essential for understanding your available AI resources before generating prompts."

**Key Decision Points**:
- Use before: Starting any generation task
- Use when: Troubleshooting failures
- Use when: Choosing optimal provider for task
- Shows capabilities and limitations

### 5. optimize_prompt
**Original**: "Optimize a prompt using AI-powered meta-prompting"

**Enhanced**: "Optimize an existing prompt using advanced AI-powered meta-prompting techniques. Use this to iteratively improve prompt quality through multiple refinement cycles until reaching a target quality score. The AI judge evaluates prompts based on clarity, specificity, and effectiveness for the intended task. Supports targeting specific models and personas. Ideal for critical prompts that need maximum effectiveness. Can transform mediocre prompts into highly effective ones through systematic improvement."

**Key Decision Points**:
- Use when: Have a prompt that needs improvement
- Use when: Critical tasks requiring high-quality prompts
- Use when: Targeting specific models
- Iterative improvement with quality metrics

### 6. batch_generate
**Original**: "Generate multiple prompts in batch mode"

**Enhanced**: "Generate multiple prompts efficiently in parallel batch processing mode. Use this when you need to create prompts for multiple related tasks or variations of a concept. Processes inputs concurrently using worker pools for optimal performance. Each input can have its own configuration (phases, count, persona). Returns organized results with success/error tracking. Perfect for generating prompt sets for testing, creating variations for A/B testing, or processing lists of ideas. Supports progress tracking for long operations."

**Key Decision Points**:
- Use when: Have multiple ideas to process
- Use when: Need variations for testing
- Use when: Processing lists or sets
- Efficient parallel processing

## AI Agent Decision Tree

```
User wants prompt help?
├── Check existing prompts first → search_prompts
│   └── Found relevant? → get_prompt (for details)
├── Need to create new? → list_providers (check resources)
│   └── Then → generate_prompts
├── Have prompt to improve? → optimize_prompt
└── Have multiple tasks? → batch_generate
```

## Benefits of Enhanced Descriptions

1. **Context-Aware**: AI agents understand when to use each tool
2. **Efficiency**: Prevents redundant operations (search before generate)
3. **Optimization**: Guides toward best tool for the task
4. **Error Prevention**: Helps check providers before operations
5. **User Experience**: Better tool selection = better results

These descriptions help AI agents like Claude, ChatGPT, and others make intelligent decisions about tool usage, improving the overall prompt engineering workflow.