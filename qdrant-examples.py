#!/usr/bin/env python3
"""
Qdrant Vector Database Examples
Following the official quickstart guide: https://qdrant.tech/documentation/quickstart/
"""

import requests
import json
from typing import List, Dict, Any

# Qdrant connection settings
QDRANT_HOST = "localhost"
QDRANT_PORT = 6333
QDRANT_URL = f"http://{QDRANT_HOST}:{QDRANT_PORT}"

class QdrantClient:
    def __init__(self, url: str = QDRANT_URL):
        self.url = url
        
    def health_check(self) -> bool:
        """Check if Qdrant is healthy"""
        try:
            response = requests.get(f"{self.url}/health")
            return response.status_code == 200 and response.json().get("status") == "ok"
        except Exception as e:
            print(f"Health check failed: {e}")
            return False
    
    def create_collection(self, collection_name: str, vector_size: int = 1536) -> bool:
        """Create a new collection for vectors"""
        collection_config = {
            "vectors": {
                "size": vector_size,
                "distance": "Cosine"
            }
        }
        
        try:
            response = requests.put(
                f"{self.url}/collections/{collection_name}",
                json=collection_config
            )
            return response.status_code in [200, 201]
        except Exception as e:
            print(f"Failed to create collection: {e}")
            return False
    
    def list_collections(self) -> List[str]:
        """List all collections"""
        try:
            response = requests.get(f"{self.url}/collections")
            if response.status_code == 200:
                data = response.json()
                return [col["name"] for col in data.get("result", {}).get("collections", [])]
        except Exception as e:
            print(f"Failed to list collections: {e}")
        return []
    
    def upsert_points(self, collection_name: str, points: List[Dict[str, Any]]) -> bool:
        """Insert or update vectors in a collection"""
        payload = {"points": points}
        
        try:
            response = requests.put(
                f"{self.url}/collections/{collection_name}/points",
                json=payload
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Failed to upsert points: {e}")
            return False
    
    def search_points(self, collection_name: str, query_vector: List[float], 
                     limit: int = 5, score_threshold: float = 0.5) -> List[Dict]:
        """Search for similar vectors"""
        search_payload = {
            "vector": query_vector,
            "limit": limit,
            "score_threshold": score_threshold,
            "with_payload": True,
            "with_vector": False
        }
        
        try:
            response = requests.post(
                f"{self.url}/collections/{collection_name}/points/search",
                json=search_payload
            )
            if response.status_code == 200:
                return response.json().get("result", [])
        except Exception as e:
            print(f"Search failed: {e}")
        return []

def main():
    print("🔍 Qdrant Vector Database Examples")
    print("="*50)
    
    # Initialize client
    client = QdrantClient()
    
    # Health check
    print("1. Health Check...")
    if client.health_check():
        print("✅ Qdrant is healthy!")
    else:
        print("❌ Qdrant is not responding")
        return
    
    # List existing collections
    print("\n2. Listing Collections...")
    collections = client.list_collections()
    print(f"📦 Found {len(collections)} collections: {collections}")
    
    # Create a test collection for prompts
    collection_name = "prompt_embeddings"
    print(f"\n3. Creating Collection: {collection_name}")
    if client.create_collection(collection_name, vector_size=1536):
        print("✅ Collection created successfully!")
    else:
        print("⚠️  Collection might already exist or creation failed")
    
    # Example vectors (normally these would be from OpenAI embeddings)
    print("\n4. Adding Sample Vectors...")
    sample_points = [
        {
            "id": 1,
            "vector": [0.1] * 1536,  # Mock embedding vector
            "payload": {
                "text": "Generate a REST API for user authentication",
                "type": "prompt",
                "phase": "coagulatio",
                "score": 8.5
            }
        },
        {
            "id": 2,
            "vector": [0.2] * 1536,  # Mock embedding vector
            "payload": {
                "text": "Create a Python function for data validation",
                "type": "prompt", 
                "phase": "solutio",
                "score": 7.8
            }
        },
        {
            "id": 3,
            "vector": [0.3] * 1536,  # Mock embedding vector
            "payload": {
                "text": "Write unit tests for authentication system",
                "type": "prompt",
                "phase": "prima-materia",
                "score": 9.1
            }
        }
    ]
    
    if client.upsert_points(collection_name, sample_points):
        print("✅ Sample vectors added successfully!")
    else:
        print("❌ Failed to add sample vectors")
    
    # Search for similar vectors
    print("\n5. Searching for Similar Vectors...")
    query_vector = [0.15] * 1536  # Mock query vector
    results = client.search_points(collection_name, query_vector, limit=3)
    
    print(f"🔍 Found {len(results)} similar vectors:")
    for i, result in enumerate(results, 1):
        print(f"  {i}. Score: {result['score']:.3f}")
        print(f"     Text: {result['payload']['text']}")
        print(f"     Phase: {result['payload']['phase']}")
        print(f"     Quality: {result['payload']['score']}")
        print()
    
    print("🎉 Qdrant examples completed successfully!")
    print("\n💡 Next steps:")
    print("  - Integrate with OpenAI embeddings API")
    print("  - Connect to prompt-alchemy storage system")
    print("  - Implement semantic search for prompts")

if __name__ == "__main__":
    main()