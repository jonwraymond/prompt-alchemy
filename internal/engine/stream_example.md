# StreamGenerate WebSocket Protocol

## Overview
The `StreamGenerate` method provides real-time streaming of prompt generation over WebSocket connections. This enables clients to receive incremental updates as prompts are generated through multiple phases.

## Message Types

### Client → Server
The client initiates streaming by sending a `GenerateOptions` JSON object through the WebSocket connection.

### Server → Client Messages

#### 1. Phase Start
```json
{
  "type": "phase_start",
  "phase": "prima-materia",
  "timestamp": 1234567890
}
```

#### 2. Content Chunk
```json
{
  "type": "chunk",
  "phase": "prima-materia",
  "prompt_id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "partial content...",
  "model": "gpt-4",
  "provider": "openai",
  "tokens": 15,
  "timestamp": 1234567891
}
```

#### 3. Prompt Complete
```json
{
  "type": "prompt_complete",
  "phase": "prima-materia",
  "prompt_id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Prompt 1 of 3 completed",
  "timestamp": 1234567892
}
```

#### 4. Phase Complete
```json
{
  "type": "phase_complete",
  "phase": "prima-materia",
  "timestamp": 1234567893
}
```

#### 5. Final Result
```json
{
  "type": "result",
  "content": "{\"prompts\":[...],\"rankings\":[...],\"selected\":{...}}",
  "timestamp": 1234567894
}
```

#### 6. Error
```json
{
  "type": "error",
  "phase": "prima-materia",
  "error": "Failed to get provider: provider not found",
  "timestamp": 1234567895
}
```

## Client Example (JavaScript)

```javascript
const ws = new WebSocket('ws://localhost:8080/stream');

ws.onopen = () => {
  // Send generation options
  ws.send(JSON.stringify({
    request: {
      input: "Create a Python function to calculate fibonacci",
      phases: ["prima-materia", "solutio", "coagulatio"],
      count: 3,
      temperature: 0.7,
      maxTokens: 1000,
      tags: ["python", "algorithm"]
    },
    phaseConfigs: [
      { phase: "prima-materia", provider: "openai" },
      { phase: "solutio", provider: "anthropic" },
      { phase: "coagulatio", provider: "openai" }
    ],
    useParallel: false,
    includeContext: true,
    autoSelect: true
  }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  switch(msg.type) {
    case 'phase_start':
      console.log(`Starting phase: ${msg.phase}`);
      break;
      
    case 'chunk':
      console.log(`[${msg.phase}] Chunk received:`, msg.content);
      // Update UI with streaming content
      break;
      
    case 'prompt_complete':
      console.log(`Prompt ${msg.prompt_id} completed`);
      break;
      
    case 'phase_complete':
      console.log(`Phase ${msg.phase} completed`);
      break;
      
    case 'result':
      const result = JSON.parse(msg.content);
      console.log('Final result:', result);
      // Display complete results
      break;
      
    case 'error':
      console.error(`Error in phase ${msg.phase}:`, msg.error);
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
};
```

## Benefits

1. **Real-time Feedback**: Users see content as it's generated
2. **Progress Tracking**: Clear indication of which phase and prompt is being processed
3. **Error Handling**: Immediate notification of errors with context
4. **Incremental Updates**: Reduces perceived latency for long operations
5. **Resource Efficiency**: Streams data as available rather than waiting for completion

## Integration with Server

To integrate this with an HTTP server:

```go
func handleStreamGenerate(w http.ResponseWriter, r *http.Request) {
    upgrader := websocket.Upgrader{
        CheckOrigin: func(r *http.Request) bool {
            return true // Configure appropriately for production
        },
    }
    
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Printf("WebSocket upgrade failed: %v", err)
        return
    }
    defer conn.Close()
    
    // Read generation options from client
    var opts models.GenerateOptions
    if err := conn.ReadJSON(&opts); err != nil {
        log.Printf("Failed to read options: %v", err)
        return
    }
    
    // Create engine and start streaming
    engine := engine.NewEngine(registry, logger)
    if err := engine.StreamGenerate(r.Context(), opts, conn); err != nil {
        log.Printf("Streaming failed: %v", err)
    }
}
```