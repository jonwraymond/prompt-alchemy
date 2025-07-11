---
layout: default
title: Mode Selection FAQ
---

# Mode Selection FAQ

## General Questions

### Q: What's the main difference between On-Demand and Server modes?
**A:** On-Demand mode runs as a command-line tool that executes and exits, while Server mode runs continuously as a service. Think of On-Demand as a calculator you pick up when needed, and Server mode as a dedicated assistant always ready to help.

### Q: Can I switch between modes easily?
**A:** Yes! The same installation supports both modes. You can use On-Demand for development and Server for production, or switch based on your current needs. Data is compatible between modes.

### Q: Which mode is better for beginners?
**A:** On-Demand mode is generally better for beginners because:
- Simpler mental model (run command → get result)
- No process management required
- Easier to debug and understand
- Lower complexity overall

### Q: Do both modes use the same AI providers?
**A:** Yes, both modes support the same providers (OpenAI, Anthropic, Google, Ollama, OpenRouter) and use the same configuration format.

## Performance Questions

### Q: How much faster is Server mode really?
**A:** For individual requests:
- On-Demand: 100-500ms startup + processing time
- Server: 0ms startup + processing time

For 100 requests:
- On-Demand: ~30-50 seconds (sequential)
- Server: ~5-10 seconds (with caching and parallelism)

### Q: When does the performance difference matter?
**A:** Server mode performance benefits are significant when:
- Making more than 10 requests per minute
- Building interactive applications
- Need sub-second response times
- Running batch operations frequently

### Q: What about memory usage?
**A:** 
- On-Demand: 0MB when idle, 50-100MB when running
- Server: 50-200MB constant (increases with cache size)

For reference, 200MB is less than a single Chrome tab.

## Feature Questions

### Q: What features are exclusive to Server mode?
**A:** Server mode exclusive features:
- Real-time adaptive learning
- WebSocket support
- Session management
- Background optimization
- In-memory caching
- Pattern recognition
- Multi-user support
- Hot configuration reload

### Q: Can On-Demand mode learn from usage?
**A:** Limited learning is possible through:
- Usage statistics saved to database
- Manual feedback recording
- Batch analysis of results

However, real-time adaptive learning requires Server mode.

### Q: Is the output quality different between modes?
**A:** No, the core prompt generation engine is identical. Server mode may provide better results over time through learning, but initial quality is the same.

## Integration Questions

### Q: Which mode works better with CI/CD?
**A:** On-Demand mode is ideal for CI/CD because:
- Clean process lifecycle
- Exit codes for success/failure
- No persistent state required
- Easy to containerize
- Simple resource management

### Q: Can I use Server mode in serverless functions?
**A:** Not recommended. Serverless is better suited for On-Demand mode. For serverless with Server mode benefits, consider:
- API Gateway → Server mode instance
- Edge functions → Server mode endpoint
- Managed container services

### Q: How do I integrate with VS Code or other IDEs?
**A:** Both modes work, but differently:
- On-Demand: IDE spawns process for each operation
- Server: IDE maintains connection to running server

Server mode is generally better for IDE integration due to lower latency.

## Deployment Questions

### Q: Which mode is easier to deploy?
**A:** On-Demand mode is simpler:
- Copy binary → done
- No service management
- No port configuration
- No monitoring setup

Server mode requires additional setup but provides better operational visibility.

### Q: Can I run multiple Server instances?
**A:** Yes, with considerations:
- Use shared storage for learning data
- Configure session affinity for WebSockets
- Implement cache synchronization
- Use external load balancer

### Q: What about security?
**A:** Security comparison:

| Aspect | On-Demand | Server Mode |
|--------|-----------|-------------|
| Network exposure | None | Configurable |
| Authentication | OS-level | Application-level |
| Attack surface | Minimal | Requires hardening |
| Secrets management | Environment | Multiple options |

## Cost Questions

### Q: Which mode is more cost-effective?
**A:** Depends on usage patterns:

**On-Demand is cheaper when:**
- < 100 requests/day
- Sporadic usage
- Running on personal machines
- Shared infrastructure

**Server mode is cheaper when:**
- > 1000 requests/day  
- Continuous usage
- Dedicated infrastructure
- Need caching benefits

### Q: How do API costs compare?
**A:** API costs are similar, but Server mode can reduce them through:
- Intelligent caching
- Request deduplication  
- Batch processing
- Learning-based optimization

## Migration Questions

### Q: How do I migrate from On-Demand to Server?
**A:** Simple process:
1. Export data: `prompt-alchemy export`
2. Update config to enable server mode
3. Start server: `prompt-alchemy serve`
4. Update integrations to use MCP client
5. Import data if needed

### Q: What about migrating from Server to On-Demand?
**A:** Also straightforward:
1. Export learned patterns via API
2. Stop server gracefully
3. Update scripts to use CLI
4. Continue with same database

### Q: Can I run both modes simultaneously?
**A:** Yes, but:
- Use different ports for Server mode
- Be aware of potential database conflicts
- Consider read-only mode for one instance
- Synchronize configuration changes

## Troubleshooting Questions

### Q: My On-Demand commands are slow, should I switch to Server?
**A:** First try:
- Check API key validity
- Verify network connectivity
- Use `--no-update-check` flag
- Ensure database isn't corrupted

If consistently slow with many requests, then consider Server mode.

### Q: Server mode memory usage keeps growing, is this normal?
**A:** Some growth is normal due to:
- Learning pattern accumulation
- Cache expansion
- Session storage

Configure limits:
```yaml
cache:
  max_size: 1000
  ttl: 3600
learning:
  pattern_limit: 10000
  cleanup_interval: 6h
```

### Q: Which mode is better for debugging?
**A:** On-Demand is generally easier to debug:
- Clear start/stop boundaries
- Simple stdout/stderr
- No concurrent operations
- Easier to reproduce issues

Server mode provides better observability through metrics and structured logs.

## Best Practices Questions

### Q: Should I use Server mode in development?
**A:** Consider your workflow:
- Frequent prompt generation → Server mode
- Occasional usage → On-Demand
- Team development → Server mode (shared instance)
- Personal projects → Either works

### Q: How do I choose for production?
**A:** Production decision factors:

**Choose On-Demand if:**
- Batch processing workflows
- Scheduled jobs (cron)
- Simple integrations
- Resource constraints

**Choose Server if:**
- User-facing applications
- Real-time requirements
- Need learning capabilities
- Multiple integrations

### Q: Can I start with one mode and switch later?
**A:** Absolutely! This is the recommended approach:
1. Start with On-Demand for simplicity
2. Evaluate usage patterns
3. Switch to Server when benefits justify complexity
4. Keep On-Demand for scripts/automation

## Advanced Questions

### Q: How does learning work differently between modes?
**A:** Learning comparison:

| Feature | On-Demand | Server Mode |
|---------|-----------|-------------|
| Usage tracking | ✅ Basic | ✅ Comprehensive |
| Pattern detection | ❌ | ✅ Real-time |
| Adaptation | ❌ | ✅ Continuous |
| Feedback loop | Manual | Automatic |
| Optimization | ❌ | ✅ Background |

### Q: What about horizontal scaling?
**A:** Scaling strategies:

**On-Demand:**
- Scale by running parallel processes
- Use job queues (Celery, Sidekiq)
- Distribute via container orchestration

**Server Mode:**
- Built-in concurrent request handling
- Support for load balancer health checks
- Session affinity for learning context
- Shared cache layer (Redis)

### Q: Which mode is better for compliance/auditing?
**A:** Both support auditing, differently:

**On-Demand:**
- Process-level audit trails
- Simple log correlation
- Clear execution boundaries

**Server Mode:**
- Centralized logging
- Request tracing
- Comprehensive metrics
- Session tracking

Choose based on your compliance requirements.

---

*Still have questions? Check the [comprehensive comparison](./on-demand-vs-server-mode) or [quick reference](./mode-quick-reference).*