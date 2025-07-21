---
layout: default
title: Self-Learning System
description: Discover how Prompt Alchemy's self-learning system uses vector embeddings and historical data to continuously improve prompt generation quality.
keywords: self-learning AI, vector embeddings, prompt optimization, machine learning, historical analysis, pattern recognition
---

# Self-Learning and Database Lookups

## Overview

Prompt Alchemy includes a sophisticated self-learning system that leverages historical prompt data to improve generation quality. When enabled, the system automatically:

1. **Searches for similar prompts** using vector embeddings
2. **Extracts successful patterns** from high-scoring historical prompts
3. **Incorporates best examples** into the generation context
4. **Provides insights** based on what has worked well in the past

## How It Works

### During Generation

When you generate a new prompt, the self-learning engine:

1. **Creates an embedding** of your input using the configured embedding provider
2. **Searches the vector database** for similar prompts with high relevance scores (>0.7)
3. **Filters by phase** to ensure relevance (e.g., prima-materia examples for prima-materia generation)
4. **Analyzes patterns** including:
   - Structural patterns (bullet points, numbered lists, sections)
   - Linguistic patterns (common phrases that work well)
   - Optimization patterns (successful personas and target models)
5. **Enhances the input** with historical insights before generation

### Example Enhancement

Original input:
```
Create a prompt for analyzing code quality
```

Enhanced input with self-learning:
```
Create a prompt for analyzing code quality

## Historical Insights:
- Provider 'openai' has been most successful for prima-materia phase (8/10 prompts)
- Average successful prompt length: 450 tokens
- Average successful temperature: 0.75

## Successful Patterns:
- Numbered lists are effective (70% success rate)
- Phrase 'step by step' appears frequently (60% success rate)
- Section headers improve clarity (80% success rate)

## Reference Examples:

### Example 1 (Score: 0.95):
Analyze the following code for quality issues, focusing on:
1. Code structure and organization
2. Naming conventions and readability
3. Potential bugs or anti-patterns...

### Example 2 (Score: 0.92):
## Code Quality Analysis Request
Please perform a comprehensive analysis of the provided code...
```

## Configuration

### Enabling Self-Learning

Self-learning is automatically enabled when:
1. Storage is configured (SQLite + chromem-go)
2. An embedding provider is available
3. Historical prompts exist in the database

### Environment Variables

```bash
# Configure embedding provider for self-learning
export PROMPT_ALCHEMY_EMBEDDINGS_PROVIDER="openai"
export PROMPT_ALCHEMY_EMBEDDINGS_MODEL="text-embedding-3-small"
export PROMPT_ALCHEMY_EMBEDDINGS_DIMENSIONS=1536
```

### Configuration File

```yaml
# Enable self-learning features
generation:
  use_self_learning: true  # Default: true when storage is available
  min_relevance_score: 0.7  # Minimum score for historical prompts
  max_examples: 3          # Maximum examples to include

# Embedding configuration
embeddings:
  provider: "openai"
  model: "text-embedding-3-small"
  dimensions: 1536
```

## Benefits

### 1. **Improved Quality**
By learning from successful prompts, the system generates higher-quality outputs that follow proven patterns.

### 2. **Consistency**
Patterns extracted from historical data ensure consistent prompt structure and style.

### 3. **Optimization Insights**
The system learns which providers, models, and parameters work best for different types of prompts.

### 4. **Reduced Iteration**
By incorporating successful examples, fewer iterations are needed to achieve desired results.

## Pattern Types

### Structural Patterns
- Use of bullet points or numbered lists
- Section headers and organization
- Common formatting elements

### Linguistic Patterns
- Effective phrases ("step by step", "comprehensive", "detailed")
- Tone and style elements
- Domain-specific terminology

### Optimization Patterns
- Best-performing providers for specific phases
- Optimal temperature settings
- Successful persona and target model combinations

## Monitoring Self-Learning

The logs provide detailed information about self-learning:

```
INFO[0001] Enhancing prompt with historical data        input="Create a prompt for..." phase=prima-materia
INFO[0002] Successfully enhanced prompt with historical data  enhanced_length=850 examples_found=3 insights_found=3 original_length=35 patterns_found=5
```

## Best Practices

1. **Build History**: The more high-quality prompts in your database, the better the self-learning
2. **Rate Prompts**: Use the feedback system to mark successful prompts
3. **Consistent Tagging**: Tag prompts consistently to improve pattern recognition
4. **Regular Optimization**: Use the optimize flag to continuously improve prompt quality
5. **Monitor Patterns**: Review extracted patterns to understand what works

## Troubleshooting

### No Historical Enhancement

If prompts aren't being enhanced:
1. Check that embeddings are configured correctly
2. Verify prompts exist in the database
3. Ensure the embedding provider is available
4. Check logs for any errors

### Poor Pattern Recognition

If patterns aren't helpful:
1. Ensure you have enough historical data (>10 prompts per phase)
2. Verify prompts have good relevance scores
3. Check that similar prompts exist for your use case

## Future Enhancements

The self-learning system is continuously evolving:
- **Adaptive learning rates** based on success metrics
- **Cross-phase pattern analysis** for holistic improvements
- **Real-time feedback integration** for immediate learning
- **Collaborative learning** across multiple instances