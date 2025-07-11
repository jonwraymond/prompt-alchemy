---
layout: default
title: Database Architecture
---

# Database

Prompt Alchemy uses SQLite for storage.

## Schema
- prompts: id, content, phase, provider, embedding, etc.
- model_metadata: prompt_id, generation_model, total_tokens
- metrics: prompt_id, token_usage, response_time
- enhancement_history: id, prompt_id, updated_content, updated_at

## Migrations
prompt-alchemy migrate

// Match exact schema from code