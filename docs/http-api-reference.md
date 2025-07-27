---
layout: default
title: HTTP API Reference
---

# HTTP API Reference

This document provides a reference for the RESTful API exposed by the `http-server` command. This server provides a simple, stateless way to interact with Prompt Alchemy's core features over HTTP.

## Overview

- **Host**: Configured via the `--host` flag (defaults to `localhost`).
- **Port**: Configured via the `--port` flag (defaults to `3456`).
- **Base URL**: `http://<host>:<port>`

All request and response bodies are in JSON format.

## Recent API Enhancements (v1.1.0)

- **Enhanced Model Tracking**: All responses now include detailed ModelMetadata with cost and performance metrics
- **Complete CRUD Operations**: Full implementation of ListPrompts, GetPrompt, and SearchPrompts endpoints
- **Improved Search**: Text-based search across prompt content and original input
- **Consolidated Types**: Unified request/response schemas for consistency
- **Better Error Handling**: Enhanced error responses with detailed debugging information

---

## Endpoints

### System

#### `GET /health`

Checks the health and status of the server.

- **Method**: `GET`
- **Path**: `/health`
- **Success Response** (`200 OK`):
  ```json
  {
    "status": "ok",
    "version": "1.0.0",
    "uptime": "1h2m3s"
  }
  ```

---

### Providers

#### `GET /api/v1/providers`

Lists all available and configured providers.

- **Method**: `GET`
- **Path**: `/api/v1/providers`
- **Success Response** (`200 OK`):
  ```json
  {
    "providers": [
      {
        "name": "openai",
        "available": true,
        "supports_embeddings": true,
        "models": ["o4-mini", "gpt-4"]
      },
      {
        "name": "anthropic",
        "available": true,
        "supports_embeddings": false,
        "models": ["claude-3-5-sonnet-20241022"]
      },
      {
        "name": "google",
        "available": true,
        "supports_embeddings": false,
        "models": ["gemini-2.5-flash"]
      },
      {
        "name": "openrouter",
        "available": true,
        "supports_embeddings": true,
        "models": ["openrouter/auto"]
      },
      {
        "name": "ollama",
        "available": true,
        "supports_embeddings": true,
        "models": ["llama3.2:3b"]
      }
    ]
  }
  ```

---

### Prompts

#### `POST /api/v1/prompts/generate`

Generates one or more prompts based on an input.

- **Method**: `POST`
- **Path**: `/api/v1/prompts/generate`
- **Request Body**:
  ```json
  {
    "input": "Create a python function to find prime numbers",
    "persona": "code",
    "phases": ["prima-materia", "coagulatio"],
    "count": 2,
    "temperature": 0.8,
    "tags": ["python", "math"]
  }
  ```
- **Success Response** (`200 OK`): Returns a `GenerationResult` object containing the list of generated prompts and their rankings.

#### `POST /api/v1/prompts/search`

Searches for existing prompts in the database.

- **Method**: `POST`
- **Path**: `/api/v1/prompts/search`
- **Request Body**:
  ```json
  {
    "query": "prime numbers",
    "semantic": true,
    "limit": 5,
    "tags": ["python"]
  }
  ```
- **Success Response** (`200 OK`): Returns an array of `Prompt` objects that match the search criteria.

#### `POST /api/v1/prompts/select`

Uses an AI-as-a-judge to select the best prompt from a given list of IDs.

- **Method**: `POST`
- **Path**: `/api/v1/prompts/select`
- **Request Body**:
  ```json
  {
    "prompt_ids": [
      "c7a8b9d0-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
      "d8b9c0d1-2f3a-4b5c-6d7e-8f9a0b1c2d3e"
    ],
    "task_description": "Find the most efficient and readable python function for prime numbers."
  }
  ```
- **Success Response** (`200 OK`): Returns the selected `Prompt` object along with the reasoning for the selection. 