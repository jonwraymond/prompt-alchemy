# Qdrant Vector Database Setup for Prompt Alchemy

This guide sets up Qdrant vector database using Docker, following the [official quickstart guide](https://qdrant.tech/documentation/quickstart/).

## Quick Start

### 1. Automated Setup
```bash
# One-command setup
./setup-qdrant.sh
```

### 2. Manual Setup
```bash
# Start Qdrant with Docker Compose
docker-compose -f docker-compose.qdrant.yml up -d

# Check health
curl http://localhost:6333/health
```

## Configuration

### Docker Compose Services

- **qdrant**: Main vector database service
  - REST API: `http://localhost:6333`
  - gRPC API: `localhost:6334`
  - Persistent storage via Docker volume
  - Health checks enabled

- **qdrant-backup**: Backup service (profile: `backup`)
  - Creates backups to `./backups` directory
  - Run with: `docker-compose -f docker-compose.qdrant.yml --profile backup up qdrant-backup`

### Environment Variables

```bash
QDRANT__SERVICE__HTTP_PORT=6333
QDRANT__SERVICE__GRPC_PORT=6334
QDRANT__LOG_LEVEL=INFO
```

## Usage Examples

### Python Client
```bash
# Install dependencies
pip install requests

# Run examples
python3 qdrant-examples.py
```

### REST API Examples

#### Health Check
```bash
curl http://localhost:6333/health
```

#### Create Collection
```bash
curl -X PUT http://localhost:6333/collections/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 1536,
      "distance": "Cosine"
    }
  }'
```

#### Insert Vector
```bash
curl -X PUT http://localhost:6333/collections/prompts/points \
  -H "Content-Type: application/json" \
  -d '{
    "points": [
      {
        "id": 1,
        "vector": [0.1, 0.2, 0.3, ...],
        "payload": {
          "text": "Generate REST API prompt",
          "type": "prompt",
          "score": 8.5
        }
      }
    ]
  }'
```

#### Search Vectors
```bash
curl -X POST http://localhost:6333/collections/prompts/points/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, 0.3, ...],
    "limit": 5,
    "with_payload": true
  }'
```

## Integration with Prompt Alchemy

### Vector Storage Strategy

1. **Embeddings Generation**
   - Use OpenAI `text-embedding-3-small` (1536 dimensions)
   - Generate embeddings for prompt content
   - Store alongside metadata

2. **Collection Structure**
   ```json
   {
     "collection_name": "prompt_embeddings",
     "vectors": {
       "size": 1536,
       "distance": "Cosine"
     },
     "payload_schema": {
       "text": "string",
       "phase": "string",
       "persona": "string", 
       "score": "float",
       "provider": "string",
       "created_at": "datetime"
     }
   }
   ```

3. **Search Capabilities**
   - Semantic similarity search
   - Filter by phase, persona, or score
   - Hybrid search (vector + metadata filters)

### Code Integration Points

```go
// Example Go integration (pseudo-code)
type QdrantClient struct {
    baseURL string
    client  *http.Client
}

func (q *QdrantClient) StorePromptEmbedding(
    promptID string,
    embedding []float64,
    metadata map[string]interface{},
) error {
    // Implementation for storing prompt embeddings
}

func (q *QdrantClient) SearchSimilarPrompts(
    queryEmbedding []float64,
    filters map[string]interface{},
    limit int,
) ([]SearchResult, error) {
    // Implementation for semantic search
}
```

## Management Commands

### Start/Stop
```bash
# Start
docker-compose -f docker-compose.qdrant.yml up -d

# Stop
docker-compose -f docker-compose.qdrant.yml down

# Logs
docker-compose -f docker-compose.qdrant.yml logs -f qdrant
```

### Backup/Restore
```bash
# Create backup
docker-compose -f docker-compose.qdrant.yml --profile backup up qdrant-backup

# List backups
ls -la ./backups/

# Manual backup
docker exec qdrant-vector-db tar -czf /tmp/backup.tar.gz /qdrant/storage
docker cp qdrant-vector-db:/tmp/backup.tar.gz ./backups/
```

### Monitoring
```bash
# Health status
curl http://localhost:6333/health

# Collection info
curl http://localhost:6333/collections

# Cluster info
curl http://localhost:6333/cluster

# Metrics (if enabled)
curl http://localhost:6333/metrics
```

## Performance Tuning

### Production Configuration
```yaml
# docker-compose.prod.yml
services:
  qdrant:
    image: qdrant/qdrant:latest
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2'
    environment:
      - QDRANT__STORAGE__PERFORMANCE__MAX_SEARCH_THREADS=4
      - QDRANT__STORAGE__PERFORMANCE__MAX_OPTIMIZATION_THREADS=2
```

### Indexing Optimization
- Use HNSW index for large datasets
- Adjust `ef_construct` and `M` parameters
- Consider quantization for memory efficiency

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Check if container is running
   docker ps | grep qdrant
   
   # Check logs
   docker-compose -f docker-compose.qdrant.yml logs qdrant
   ```

2. **Out of Memory**
   ```bash
   # Increase Docker memory limits
   # Check Docker Desktop settings
   docker stats qdrant-vector-db
   ```

3. **Slow Searches**
   ```bash
   # Check collection size
   curl http://localhost:6333/collections/prompts
   
   # Consider indexing optimization
   # Use filters to reduce search space
   ```

## Security Considerations

### Production Setup
- Enable authentication
- Use HTTPS/TLS
- Network segmentation
- Regular backups
- Monitor access logs

### Environment Variables
```bash
QDRANT__SERVICE__ENABLE_CORS=false
QDRANT__TELEMETRY_DISABLED=true
QDRANT__SERVICE__ENABLE_TLS=true
```

## Next Steps

1. **Integrate with Prompt Alchemy**
   - Add Qdrant client to Go codebase
   - Implement embedding generation pipeline
   - Add semantic search to MCP tools

2. **Enhanced Features**
   - Vector search in `search_prompts` MCP tool
   - Similarity-based prompt recommendations
   - Clustering and topic discovery

3. **Monitoring & Analytics**
   - Search performance metrics
   - Usage analytics
   - Quality scoring improvements

## Resources

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [REST API Reference](https://qdrant.tech/documentation/interfaces/)
- [Python Client](https://github.com/qdrant/qdrant-client)
- [Go Client](https://github.com/qdrant/go-client)