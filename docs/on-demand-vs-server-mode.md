---
layout: default
title: On-Demand vs Server Mode
---

# On-Demand vs. Server Modes

Prompt Alchemy offers three distinct operational modes to suit different use cases. This guide explains the differences to help you choose the right one.

## Overview

| Mode | Interface | Primary Use Case | State Management |
|---|---|---|---|
| **On-Demand** | Standard CLI | Manual tasks, scripting, CI/CD | Stateless |
| **MCP Server** | JSON-RPC over stdio | AI Agent Integration | Stateful (per session) |
| **HTTP Server** | RESTful API | Web services, custom apps | Stateless (request/response) |

---

## 1. On-Demand Mode (Default)

This is the standard way to use `prompt-alchemy` from your terminal. Each command runs as a separate, short-lived process.

- **How it Works**: `prompt-alchemy generate "My Idea"`
- **Best for**: Developers, scripters, and CI/CD pipelines.
- **Pros**: Simple, secure (no open ports), zero resource use when idle.
- **Cons**: Higher latency per command due to startup overhead.

---

## 2. MCP Server Mode

This mode starts a persistent process that communicates over its standard input and output using the **Model Context Protocol (MCP)**. It does not open any network ports.

- **How it Works**: `prompt-alchemy serve`
- **Best for**: Deeply integrating with a single AI agent or a parent application that can manage a subprocess.
- **Pros**: Low latency for subsequent requests, allows for stateful, conversational workflows with an agent.
- **Cons**: More complex to manage; requires a client that can handle process I/O.

---

## 3. HTTP Server Mode

This mode starts a persistent web server that exposes a **RESTful API** over HTTP.

- **How it Works**: `prompt-alchemy http-server --port 3456`
- **Best for**: Providing prompt generation capabilities as a network service to multiple clients, such as web UIs or other backend services.
- **Pros**: Easily accessible over the network, follows standard REST patterns, can be scaled behind a load balancer.
- **Cons**: Requires managing a network service, has security implications (authentication, TLS, etc.), and is stateless by nature.

## Key Differences

| Feature | On-Demand (CLI) | MCP Server | HTTP Server |
|---|---|---|---|
| **Network Port** | None | None | Yes (e.g., `:3456`) |
| **Primary Client** | Human User | AI Agent / Parent Process | Any HTTP Client |
| **Communication** | Shell (stdin, stdout, files) | JSON-RPC over stdio | HTTP/S (JSON) |
| **State** | None | Session-based | Request-based |
| **Learning** | Manual (`nightly` command) | Real-time (within a session) | Real-time (requires persistent DB) |
| **Concurrency** | 1 (per command) | 1 Client | Multiple Clients |

## Which Mode Should I Use?

-   **Use On-Demand Mode** for all direct command-line operations and simple scripting.
-   **Use MCP Server Mode** when you need to embed `prompt-alchemy` into another application or AI agent as a dedicated, stateful engine.
-   **Use HTTP Server Mode** when you need to offer prompt generation as a shared service on your network.