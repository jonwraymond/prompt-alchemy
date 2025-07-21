# 🎯 Practical Examples for Prompt Alchemy MCP Server

This document provides copy-paste examples for using the prompt-alchemy MCP server with Claude Code.

## 🚀 Ready-to-Use Examples

### Software Development

#### Example 1: REST API Development
```
Use generate_prompts with the following parameters:
- Input: "Build a REST API for user authentication with JWT tokens, rate limiting, and PostgreSQL database"
- Persona: "code"
- Count: 2
- Provider: "openai"
```

#### Example 2: Frontend Component
```
Use generate_prompts:
- Input: "Create a React component for a dashboard with charts, filters, and real-time updates"
- Persona: "code"
- Count: 3
```

#### Example 3: Database Design
```
Use generate_prompts:
- Input: "Design a database schema for an e-commerce platform with products, users, orders, and inventory"
- Persona: "analyst"
- Count: 2
```

### Technical Documentation

#### Example 4: API Documentation
```
Use generate_prompts:
- Input: "Write comprehensive API documentation for a microservices architecture with authentication, rate limiting, and error handling"
- Persona: "writing"
- Count: 2
```

#### Example 5: User Guide
```
Use generate_prompts:
- Input: "Create a user guide for a complex software installation with troubleshooting steps"
- Persona: "writing"
- Count: 2
```

### Data Analysis

#### Example 6: Data Pipeline
```
Use generate_prompts:
- Input: "Build a data pipeline for processing customer analytics with real-time streaming and batch processing"
- Persona: "analyst"
- Count: 2
```

#### Example 7: Machine Learning
```
Use generate_prompts:
- Input: "Create a machine learning model for predictive analytics with feature engineering and model validation"
- Persona: "analyst"
- Count: 3
```

## 🔍 Search Examples

### Finding Similar Patterns

#### Example 8: Search for API Patterns
```
Use search_prompts:
- Query: "REST API authentication security"
- Limit: 10
```

#### Example 9: Search for React Components
```
Use search_prompts:
- Query: "React component dashboard charts"
- Limit: 5
```

#### Example 10: Search for Database Designs
```
Use search_prompts:
- Query: "database schema e-commerce design"
- Limit: 8
```

## ⚡ Optimization Examples

### Meta-Prompting

#### Example 11: Optimize Code Prompt
```
Use optimize_prompt:
- Prompt: "Write a Python function for data processing"
- Task: "Create efficient, well-documented Python functions with error handling and type hints"
- Max iterations: 3
```

#### Example 12: Optimize Documentation Prompt
```
Use optimize_prompt:
- Prompt: "Write API documentation"
- Task: "Create comprehensive, user-friendly API documentation with examples and troubleshooting"
- Max iterations: 2
```

#### Example 13: Optimize Analysis Prompt
```
Use optimize_prompt:
- Prompt: "Analyze customer data"
- Task: "Perform thorough customer data analysis with insights, visualizations, and actionable recommendations"
- Max iterations: 2
```

## 🔄 Batch Generation Examples

### Multiple Related Tasks

#### Example 14: Full-Stack Development
```
Use batch_generate with these inputs:
[
  {"input": "Design React frontend for task management app", "persona": "code"},
  {"input": "Build Node.js backend API for task management", "persona": "code"},
  {"input": "Create PostgreSQL database schema for tasks", "persona": "analyst"},
  {"input": "Write deployment guide for task management system", "persona": "writing"}
]
- Workers: 4
```

#### Example 15: Content Creation Suite
```
Use batch_generate:
[
  {"input": "Write technical blog post about microservices", "persona": "writing"},
  {"input": "Create social media content for tech audience", "persona": "creative"},
  {"input": "Develop presentation slides for architecture overview", "persona": "writing"},
  {"input": "Generate FAQ for common technical questions", "persona": "writing"}
]
- Workers: 3
```

#### Example 16: Data Science Project
```
Use batch_generate:
[
  {"input": "Perform exploratory data analysis on customer dataset", "persona": "analyst"},
  {"input": "Build machine learning model for churn prediction", "persona": "analyst"},
  {"input": "Create data visualization dashboard", "persona": "analyst"},
  {"input": "Write model performance report", "persona": "writing"}
]
- Workers: 2
```

## 📊 Provider Testing Examples

### Different Providers for Different Tasks

#### Example 17: Creative Tasks (OpenAI)
```
Use generate_prompts:
- Input: "Create an engaging story about AI helping humans solve climate change"
- Persona: "creative"
- Provider: "openai"
- Count: 2
```

#### Example 18: Analytical Tasks (Anthropic)
```
Use generate_prompts:
- Input: "Analyze the pros and cons of different database architectures for high-traffic applications"
- Persona: "analyst"
- Provider: "anthropic"
- Count: 2
```

#### Example 19: Technical Tasks (Google)
```
Use generate_prompts:
- Input: "Explain the technical implementation of OAuth 2.0 with PKCE for mobile applications"
- Persona: "code"
- Provider: "google"
- Count: 2
```

## 🎨 Creative Examples

### Content and Design

#### Example 20: Marketing Content
```
Use generate_prompts:
- Input: "Create marketing copy for a new AI-powered development tool that helps developers write better code"
- Persona: "creative"
- Count: 3
```

#### Example 21: UI/UX Design
```
Use generate_prompts:
- Input: "Design user interface patterns for a complex data visualization dashboard with multiple chart types"
- Persona: "creative"
- Count: 2
```

#### Example 22: Creative Problem Solving
```
Use generate_prompts:
- Input: "Brainstorm innovative solutions for reducing code complexity in large software projects"
- Persona: "creative"
- Count: 3
```

## 🏗️ Architecture Examples

### System Design

#### Example 23: Microservices Architecture
```
Use generate_prompts:
- Input: "Design a microservices architecture for a scalable e-commerce platform with event-driven communication"
- Persona: "analyst"
- Count: 2
```

#### Example 24: Cloud Infrastructure
```
Use generate_prompts:
- Input: "Plan AWS cloud infrastructure for a high-availability web application with auto-scaling and disaster recovery"
- Persona: "analyst"
- Count: 2
```

#### Example 25: Security Architecture
```
Use generate_prompts:
- Input: "Design security architecture for a financial application with zero-trust principles and multi-factor authentication"
- Persona: "analyst"
- Count: 2
```

## 🔧 DevOps Examples

### Operations and Deployment

#### Example 26: CI/CD Pipeline
```
Use generate_prompts:
- Input: "Create a CI/CD pipeline for a Node.js application with automated testing, security scanning, and deployment"
- Persona: "code"
- Count: 2
```

#### Example 27: Monitoring and Logging
```
Use generate_prompts:
- Input: "Set up comprehensive monitoring and logging for a distributed microservices application"
- Persona: "code"
- Count: 2
```

#### Example 28: Container Orchestration
```
Use generate_prompts:
- Input: "Configure Kubernetes deployment for a multi-tier application with horizontal scaling and health checks"
- Persona: "code"
- Count: 2
```

## 🎯 Learning Examples

### Building Expertise Over Time

#### Example 29: First Week - Basic Prompts
```
Day 1: Use generate_prompts for "Create a simple web server"
Day 2: Use generate_prompts for "Build a REST API"
Day 3: Use generate_prompts for "Add authentication to API"
Day 4: Use generate_prompts for "Connect API to database"
Day 5: Use generate_prompts for "Add error handling to API"
```

#### Example 30: Second Week - Enhanced Prompts
```
Day 1: Use search_prompts for "web server REST API"
Day 2: Use generate_prompts for "Build scalable web service" (notice enhancement)
Day 3: Use optimize_prompt on yesterday's best result
Day 4: Use generate_prompts for "Create production-ready API"
Day 5: Use batch_generate for multiple related API tasks
```

#### Example 31: Third Week - Advanced Usage
```
Day 1: Search for patterns in your API prompts
Day 2: Generate prompts for advanced API features
Day 3: Use optimize_prompt with specific architectural requirements
Day 4: Batch generate complete system architecture
Day 5: Compare results with Week 1 - notice significant improvement
```

## 📝 Command Templates

### Quick Copy-Paste Templates

#### Basic Generation Template
```
Use generate_prompts with:
- Input: "[Your prompt here]"
- Persona: "[code/writing/analyst/creative]"
- Count: [1-5]
```

#### Search Template
```
Use search_prompts with:
- Query: "[Your search terms]"
- Limit: [5-20]
```

#### Optimization Template
```
Use optimize_prompt with:
- Prompt: "[Your prompt to optimize]"
- Task: "[Specific task description]"
- Max iterations: [1-5]
```

#### Batch Template
```
Use batch_generate with:
[
  {"input": "[First prompt]", "persona": "[persona]"},
  {"input": "[Second prompt]", "persona": "[persona]"},
  {"input": "[Third prompt]", "persona": "[persona]"}
]
- Workers: [2-5]
```

## 💡 Pro Tips

### Maximizing Results
- **Start simple**: Use basic prompts first to build history
- **Be specific**: Include technical details and context
- **Use consistent personas**: Stick to the same style for related tasks
- **Iterate frequently**: Use optimize_prompt on important prompts
- **Search regularly**: Use search_prompts to find relevant patterns

### Common Personas
- **"code"**: For programming and technical implementation
- **"writing"**: For documentation and content creation
- **"analyst"**: For analysis, design, and architecture
- **"creative"**: For brainstorming and innovative solutions

### Provider Recommendations
- **OpenAI**: General purpose, creative tasks, code generation
- **Anthropic**: Analysis, technical writing, complex reasoning
- **Google**: Factual information, technical explanations
- **System learning**: Try different providers to see what works best

---

*Copy any of these examples and modify them for your specific needs. The system will learn from your usage patterns and improve over time!*