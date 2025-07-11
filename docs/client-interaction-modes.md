---
layout: default
title: Client Interaction Modes
---

# Client Interaction Modes

Prompt Alchemy offers four distinct ways for clients to interact with its services, each designed for a different use case. Understanding these modes is key to successful integration.

## 1. On-Demand CLI (The Default)

This is the standard way to use Prompt Alchemy. You run commands directly in your terminal.

- **Command**: `prompt-alchemy generate "..."`
- **Use Case**: Manual use by developers, simple scripts, CI/CD pipelines.
- **How it Works**: A new process is started for each command and terminates upon completion. It is completely stateless.

---

## 2. HTTP API Client (via `http-server`)

This mode involves running the `http-server` and having a separate client application make RESTful API calls to it.

- **Server Command**: `prompt-alchemy http-server --port 3456`
- **Client Action**: `curl -X POST http://localhost:3456/api/v1/prompts/generate -d '{"input": "..."}'`
- **Use Case**: Integrating with web applications, backend services, or any client that can make standard HTTP requests.
- **How it Works**: The `http-server` runs persistently. Any HTTP-capable client can interact with its REST API. This is the most common and flexible method for building services on top of Prompt Alchemy.

---

## 3. CLI in Client Mode (A "Thick" Client)

This is a special variation of the On-Demand CLI where the local `prompt-alchemy` binary acts as a client to a remote `http-server`.

- **Server Command**: `prompt-alchemy http-server --port 3456` (on a remote machine)
- **Client Command**: `prompt-alchemy --server http://remote-host:3456 generate "..."`
- **Use Case**: For users who want the familiar CLI experience but need to offload the actual processing to a more powerful, centralized server.
- **How it Works**: The local CLI command does **not** do the work itself. It simply makes an HTTP API call to the specified `--server`, sends the arguments, and prints the response. It is a "thick client" wrapper around the HTTP API.

---

## 4. MCP Client (via `serve`)

This is the most specialized mode, designed for deep integration with AI agents or other parent processes.

- **Server Command**: `prompt-alchemy serve`
- **Client Action**: A client application must spawn the `prompt-alchemy serve` process and then communicate with it by writing JSON-RPC messages to its `stdin` and reading responses from its `stdout`.
- **Use Case**: A dedicated, stateful engine for a single AI agent (e.g., a VS Code extension, a Copilot agent).
- **How it Works**: This mode does **not** use HTTP or network ports. It is a direct, process-to-process communication channel.

## Comparison Summary

| Interaction Mode | How it Works | Primary Use Case | Protocol | Network |
|---|---|---|---|---|
| **On-Demand CLI** | Direct execution | Manual use, simple scripts | Shell | No |
| **HTTP API Client** | Client calls REST API | Web services, custom apps | HTTP/JSON | Yes |
| **CLI in Client Mode** | CLI calls REST API | Remote execution from CLI | HTTP/JSON | Yes |
| **MCP Client** | Client spawns process | AI Agent Integration | JSON-RPC over stdio | No | 