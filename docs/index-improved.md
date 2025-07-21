---
layout: default
title: Prompt Alchemy - AI Prompt Generation and Optimization Toolkit
description: Transform raw ideas into high-quality prompts for AI systems through a three-phase refinement process. Supports OpenAI, Anthropic, Google, and more.
keywords: AI prompts, prompt engineering, OpenAI, Anthropic, Google, prompt optimization, machine learning, CLI tool, API
og:
  title: Prompt Alchemy - Transform Ideas into Golden Prompts
  description: AI prompt generation toolkit with three-phase refinement process
  image: /prompt-alchemy/assets/prompt_alchemy2.png
  type: website
---

# Prompt Alchemy ✨

<div class="hero-section">
  <p class="hero-tagline">Transform your raw ideas into high-quality prompts for AI systems through the ancient art of linguistic alchemy.</p>
  
  <div class="quick-actions">
    <a href="{{ site.baseurl }}/getting-started" class="btn btn-primary">🚀 Get Started</a>
    <a href="{{ site.baseurl }}/installation" class="btn btn-secondary">📦 Install Now</a>
    <a href="#quick-demo" class="btn btn-outline">👀 See Demo</a>
  </div>
</div>

## 🎯 What You'll Accomplish

- **Generate better prompts** with our three-phase refinement process
- **Integrate with multiple AI providers** (OpenAI, Anthropic, Google, OpenRouter, Ollama)
- **Improve results over time** with machine learning and adaptive feedback
- **Scale your workflow** with CLI tools and server integration

## ⚡ Key Features

<div class="features-grid">
  <div class="feature-card">
    <h3>🔄 Three-Phase Refinement</h3>
    <p>Transforms your ideas through idea extraction, natural language flow, and precision tuning</p>
  </div>
  
  <div class="feature-card">
    <h3>🤖 Multiple AI Providers</h3>
    <p>Works with OpenAI, Anthropic, Google, OpenRouter, and local Ollama models</p>
  </div>
  
  <div class="feature-card">
    <h3>🎯 Intelligent Selection</h3>
    <p>Uses AI to automatically choose the best prompt variants</p>
  </div>
  
  <div class="feature-card">
    <h3>🚀 Flexible Deployment</h3>
    <p>Run as a CLI tool for quick tasks or as a server for AI agent integration</p>
  </div>
  
  <div class="feature-card">
    <h3>📈 Adaptive Learning</h3>
    <p>Improves recommendations over time based on your feedback</p>
  </div>
  
  <div class="feature-card">
    <h3>🔒 Local Storage</h3>
    <p>Keeps all your data in a local SQLite database for privacy and speed</p>
  </div>
</div>

## <span id="quick-demo">🎬 Quick Demo</span>

### Generate a Prompt (CLI)
```bash
# Generate a prompt with all three refinement phases
prompt-alchemy generate "A blog post about the future of AI" --persona=writing

# Output:
# Generated 3 refined prompts:
# 1. [prima-materia] Extract core concepts about AI's future impact
# 2. [solutio] Transform into flowing, engaging blog post structure  
# 3. [coagulatio] Refine for accuracy, SEO, and reader engagement
```

### Start Server for AI Agents
```bash
# Start the MCP server for AI agent integration
prompt-alchemy serve mcp

# AI agents can now connect via stdin/stdout with JSON-RPC calls
```

## 🎨 How the Alchemical Process Works

<div class="process-flow">
  <div class="phase">
    <h3>1. Prima Materia 🌱</h3>
    <p><strong>Extract Core Concepts</strong><br>
    Identifies and structures the key ideas from your raw input</p>
  </div>
  
  <div class="arrow">→</div>
  
  <div class="phase">
    <h3>2. Solutio 🌊</h3>
    <p><strong>Create Natural Flow</strong><br>
    Transforms concepts into readable, flowing natural language</p>
  </div>
  
  <div class="arrow">→</div>
  
  <div class="phase">
    <h3>3. Coagulatio ⚡</h3>
    <p><strong>Add Precision</strong><br>
    Refines the prompt for accuracy, effectiveness, and clarity</p>
  </div>
</div>

Each phase can use a different AI provider for optimal results, and the system learns from your feedback to improve future generations.

## 🚀 Choose Your Path

<div class="user-paths">
  <div class="path-card">
    <h3>🏃‍♂️ I'm New Here</h3>
    <p>Start with the basics and get up to speed quickly</p>
    <a href="{{ site.baseurl }}/getting-started" class="btn btn-primary">Begin Journey</a>
    <ul class="path-steps">
      <li>Getting Started Guide</li>
      <li>Installation Instructions</li>
      <li>First Examples</li>
      <li>Basic Usage</li>
    </ul>
  </div>
  
  <div class="path-card">
    <h3>👨‍💻 I'm a Developer</h3>
    <p>Dive into APIs, integrations, and technical details</p>
    <a href="{{ site.baseurl }}/cli-reference" class="btn btn-primary">Explore APIs</a>
    <ul class="path-steps">
      <li>CLI Reference</li>
      <li>HTTP API Documentation</li>
      <li>MCP Integration</li>
      <li>Architecture Overview</li>
    </ul>
  </div>
  
  <div class="path-card">
    <h3>⚙️ I'm DevOps/SRE</h3>
    <p>Focus on deployment, scaling, and operations</p>
    <a href="{{ site.baseurl }}/deployment-guide" class="btn btn-primary">Deploy Now</a>
    <ul class="path-steps">
      <li>Deployment Guide</li>
      <li>On-Demand vs Server Mode</li>
      <li>Scheduling & Automation</li>
      <li>Monitoring & Metrics</li>
    </ul>
  </div>
</div>

## 🌟 Why Choose Prompt Alchemy?

Unlike manual prompt engineering, Prompt Alchemy provides a **consistent, measurable approach**:

- **🔄 Repeatable Process**: Every prompt goes through the same proven refinement steps
- **🎯 Provider Flexibility**: Use the best AI model for each phase of improvement  
- **📊 Performance Tracking**: Monitor success rates and identify what works best
- **📈 Continuous Improvement**: The system learns from your feedback to get better over time
- **🔒 Privacy First**: All data stays local in your SQLite database
- **⚡ Fast & Efficient**: Optimized for speed with intelligent caching

## 📚 Documentation Navigator

<div class="docs-navigator">
  <div class="nav-section">
    <h3>🚀 Getting Started</h3>
    <ul>
      <li><a href="{{ site.baseurl }}/getting-started">Quick Start Guide</a></li>
      <li><a href="{{ site.baseurl }}/installation">Installation</a></li>
      <li><a href="{{ site.baseurl }}/usage">Usage Examples</a></li>
      <li><a href="{{ site.baseurl }}/mode-quick-reference">Quick Reference</a></li>
    </ul>
  </div>
  
  <div class="nav-section">
    <h3>📖 API Reference</h3>
    <ul>
      <li><a href="{{ site.baseurl }}/cli-reference">CLI Commands</a></li>
      <li><a href="{{ site.baseurl }}/http-api-reference">HTTP API</a></li>
      <li><a href="{{ site.baseurl }}/mcp-api-reference">MCP API</a></li>
      <li><a href="{{ site.baseurl }}/mcp-integration">MCP Integration</a></li>
    </ul>
  </div>
  
  <div class="nav-section">
    <h3>🏗️ Architecture</h3>
    <ul>
      <li><a href="{{ site.baseurl }}/architecture">System Design</a></li>
      <li><a href="{{ site.baseurl }}/database">Database Schema</a></li>
      <li><a href="{{ site.baseurl }}/vector-embeddings">Vector Search</a></li>
      <li><a href="{{ site.baseurl }}/diagrams">Visual Diagrams</a></li>
    </ul>
  </div>
  
  <div class="nav-section">
    <h3>🚀 Deployment</h3>
    <ul>
      <li><a href="{{ site.baseurl }}/deployment-guide">Deployment Guide</a></li>
      <li><a href="{{ site.baseurl }}/on-demand-vs-server-mode">Mode Comparison</a></li>
      <li><a href="{{ site.baseurl }}/learning-mode">Learning Mode</a></li>
      <li><a href="{{ site.baseurl }}/scheduling">Automation</a></li>
    </ul>
  </div>
</div>

## 🤝 Community & Support

<div class="community-section">
  <div class="support-card">
    <h3>🐛 Issues & Bug Reports</h3>
    <p>Found a bug or have a feature request?</p>
    <a href="https://github.com/jonwraymond/prompt-alchemy/issues" class="btn btn-outline">GitHub Issues</a>
  </div>
  
  <div class="support-card">
    <h3>💡 Contributing</h3>
    <p>Want to contribute to the project?</p>
    <a href="https://github.com/jonwraymond/prompt-alchemy/blob/main/CONTRIBUTING.md" class="btn btn-outline">Contributing Guide</a>
  </div>
  
  <div class="support-card">
    <h3>📈 Roadmap</h3>
    <p>See what's coming next</p>
    <a href="https://github.com/jonwraymond/prompt-alchemy/projects" class="btn btn-outline">View Roadmap</a>
  </div>
</div>

## 📄 License

Prompt Alchemy is open source software licensed under the **MIT License**.

---

<div class="footer-cta">
  <h2>Ready to Transform Your Ideas into Golden Prompts? ✨</h2>
  <p>Join thousands of developers, writers, and AI enthusiasts who are already using Prompt Alchemy to create better prompts.</p>
  <a href="{{ site.baseurl }}/getting-started" class="btn btn-primary btn-large">Start Your Alchemical Journey</a>
</div>

<style>
.hero-section {
  text-align: center;
  margin: 2rem 0;
  padding: 2rem;
  background: linear-gradient(135deg, #FFF8DC, #F5F5DC);
  border-radius: 12px;
  border: 2px solid #C9A96E;
}

.hero-tagline {
  font-size: 1.3rem;
  color: #2C1810;
  margin-bottom: 2rem;
  font-weight: 500;
}

.quick-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.btn-primary {
  background: #C9A96E;
  color: #2C1810;
  border-color: #C9A96E;
}

.btn-primary:hover {
  background: #DAA520;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #8B4513;
  color: white;
  border-color: #8B4513;
}

.btn-outline {
  background: transparent;
  color: #8B4513;
  border-color: #8B4513;
}

.btn-outline:hover {
  background: #8B4513;
  color: white;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.feature-card {
  background: #FFF8DC;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #C9A96E;
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(201, 169, 110, 0.3);
}

.process-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.phase {
  flex: 1;
  min-width: 200px;
  background: #FFF8DC;
  padding: 1.5rem;
  border-radius: 8px;
  border: 2px solid #C9A96E;
  text-align: center;
}

.arrow {
  font-size: 2rem;
  color: #C9A96E;
  font-weight: bold;
}

.user-paths {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.path-card {
  background: #FFF8DC;
  padding: 2rem;
  border-radius: 12px;
  border: 2px solid #C9A96E;
  text-align: center;
}

.path-steps {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

.path-steps li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #E5E5E5;
}

.path-steps li:last-child {
  border-bottom: none;
}

.docs-navigator {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.nav-section ul {
  list-style: none;
  padding: 0;
}

.nav-section li {
  margin: 0.5rem 0;
}

.nav-section a {
  color: #8B4513;
  text-decoration: none;
  padding: 0.25rem 0;
  display: block;
  transition: color 0.3s ease;
}

.nav-section a:hover {
  color: #C9A96E;
  text-decoration: underline;
}

.community-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.support-card {
  background: #FFF8DC;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #C9A96E;
  text-align: center;
}

.footer-cta {
  text-align: center;
  margin: 3rem 0;
  padding: 2rem;
  background: linear-gradient(135deg, #C9A96E, #DAA520);
  border-radius: 12px;
  color: #2C1810;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .process-flow {
    flex-direction: column;
  }
  
  .arrow {
    transform: rotate(90deg);
  }
  
  .quick-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 300px;
  }
}
</style>