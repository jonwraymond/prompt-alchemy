---
layout: default
title: Learning Mode
---

# Learning Mode

Prompt Alchemy's learning mode implements a feedback-driven system to improve prompt ranking and recommendations over time. This document explains how it works and how to use it.

## Overview

When learning mode is enabled, Prompt Alchemy:
- Allows users to record feedback on prompt effectiveness using the `record_feedback` tool.
- Uses this feedback to adjust the ranking weights for prompt searches.
- Provides AI-powered recommendations for new prompts based on successful patterns.
- Relies on a `nightly` command, scheduled by the user, to process feedback and update its learning model.

## Enabling Learning Mode

To enable learning mode, set the following in your `config.yaml`:

```yaml
learning:
  enabled: true
```

You can also enable it for a single server session with a flag:
```bash
prompt-alchemy serve --learning-enabled
```

## How It Works: The Feedback Loop

The learning system operates on a simple, powerful feedback loop:

1.  **Generate & Use**: You generate and use prompts as usual.
2.  **Record Feedback**: You use the `record_feedback` MCP tool to provide a score for a specific prompt's effectiveness.
3.  **Nightly Training**: You run the `nightly` command (ideally as a scheduled job) to process all the feedback collected since the last run.
4.  **Weight Adjustment**: The `nightly` job analyzes the feedback and adjusts the ranking weights in your `config.yaml` file to favor the characteristics of effective prompts.
5.  **Improved Ranking**: The next time you search for prompts, the ranking will be influenced by the newly learned weights, improving the relevance of the results over time.

This entire process is local and does not rely on any external services.

## Available Learning Tools

When learning is enabled, the following MCP tools become available.

*These examples show the JSON object that should be sent to the server's `stdin`.*

### 1. record_feedback

Records user feedback about a prompt's effectiveness.

**JSON-RPC Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "record_feedback",
    "arguments": {
      "prompt_id": "b17deed2-f9f7-443f-a879-ca87941c9308",
      "effectiveness": 0.9,
      "rating": 5,
      "context": "Worked perfectly for generating API documentation."
    }
  }
}
```

### 2. get_recommendations

Gets AI-powered prompt recommendations based on learned patterns.

**JSON-RPC Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_recommendations",
    "arguments": {
      "input": "Create a chatbot for customer service",
      "limit": 3
    }
  }
}
```

### 3. get_learning_stats

Views the current statistics from the learning engine.

**JSON-RPC Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "get_learning_stats",
    "arguments": {
      "include_patterns": true
    }
  }
}
```

## Automated Training

The learning system does not run any background processes on its own. It relies on the user to schedule the `nightly` command.

Use the `schedule` command to set up a recurring job:
```bash
# Schedule the nightly job to run daily at 2 AM
prompt-alchemy schedule --time "0 2 * * *"

# Run the job manually at any time
prompt-alchemy nightly
```

## Best Practices

1.  **Consistent Feedback**: The more feedback you provide, the better the system learns.
2.  **Meaningful Scores**: Use the full `effectiveness` score range (0.0 to 1.0) to provide clear signals.
3.  **Schedule Training**: Set up the `nightly` job to run regularly to keep your ranking model up-to-date.
4.  **Monitor Stats**: Use `get_learning_stats` to understand how the system is learning.