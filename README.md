# Prompt Alchemy 🧪

A sophisticated AI prompt generation system that transforms raw ideas into optimized prompts through a three-phase alchemical process. Features both a powerful Go backend API and a beautiful React frontend with an alchemy-inspired dark theme.

![Prompt Alchemy Architecture](./Prompt_Alchemy_Detailed_Architecture.svg)

## 🌟 Features

### Backend (Go)
- **Three-Phase Alchemical Process**: Prima Materia → Solutio → Coagulatio transformation
- **Multi-Provider Support**: OpenAI, Anthropic, Google, OpenRouter, Ollama
- **Intelligent Ranking**: Learning engine with feedback processing
- **Vector Search**: Embeddings-based similarity search
- **MCP Server**: Model Context Protocol integration
- **REST API**: Full-featured API with WebSocket support
- **CLI & Server Modes**: Flexible deployment options

### Frontend (React)
- **AI-Powered Input**: Smart suggestions and prompt enhancement
- **Alchemy Theme**: Dark theme with golden accents and mystical animations
- **3D Visualizations**: React Three Fiber hexagon grid effects
- **File Attachments**: Drag & drop support
- **Keyboard Shortcuts**: Productivity-focused navigation
- **TypeScript**: Full type safety
- **Responsive Design**: Mobile-first approach

## 🏗️ Architecture

The project consists of:
- **Go Backend**: Core prompt generation engine with provider abstraction
- **React Frontend**: Beautiful UI with 3D visualizations
- **Docker Support**: Full containerization with docker-compose
- **MCP Integration**: Claude Desktop integration via Model Context Protocol

## 🚀 Quick Start

See our [Quick Start Guide](QUICKSTART.md) for the fastest way to get up and running!

```bash
# 1. Configure a provider (interactive wizard)
./scripts/setup-provider.sh

# 2. Start the system
docker-compose --profile hybrid up -d

# 3. Open the UI
open http://localhost:5173

# Test auto-commit hook system
echo "Auto-commit hook system active!"
```

## 📦 Installation

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/prompt-alchemy.git
cd prompt-alchemy

# Install Go dependencies
go mod download

# Build the binary
make build

# Or use Docker
docker-compose --profile hybrid up -d
```

### Frontend Setup

```bash
# Install frontend dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build
```

## 🚀 Quick Start

### Using the CLI

```bash
# Generate a prompt
prompt-alchemy generate "Create a REST API for user management"

# Start the API server
prompt-alchemy serve

# Run as MCP server
prompt-alchemy serve-mcp
```

### Using Docker

```bash
# Start all services
docker-compose --profile hybrid up -d

# Access the web UI at http://localhost:8080
```

### Frontend Integration

```tsx
import React from 'react';
import { AIInputComponent } from './components/AIInputComponent';

function App() {
  const handleSubmit = async (value: string) => {
    // Call the Prompt Alchemy API
    const response = await fetch('http://localhost:8080/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: value })
    });
    const result = await response.json();
    console.log('Generated prompt:', result.prompt);
  };

  return (
    <div className="alchemy-container">
      <AIInputComponent
        placeholder="Describe your prompt idea..."
        onSubmit={handleSubmit}
        enableSuggestions={true}
        enableThinking={true}
      />
    </div>
  );
}
```

## 📡 API Documentation

### REST API Endpoints

#### Generate Prompt
```http
POST /api/generate
Content-Type: application/json

{
  "input": "Create a REST API for user management",
  "persona": "code",
  "provider": "openai",
  "temperature": 0.7
}
```

#### Search Prompts
```http
GET /api/search?q=API&limit=10
```

#### Get Prompt by ID
```http
GET /api/prompts/{id}
```

### MCP Tools

- `generate_prompts`: Create new prompts from ideas
- `optimize_prompt`: Improve existing prompts
- `search_prompts`: Search prompt database
- `batch_generate`: Generate multiple prompts

## 🎮 Component API

### Frontend Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialValue` | `string` | `''` | Initial input value |
| `placeholder` | `string` | `'Describe your prompt...'` | Placeholder text |
| `maxLength` | `number` | `5000` | Maximum character limit |
| `enableSuggestions` | `boolean` | `true` | Enable AI suggestions |
| `enableThinking` | `boolean` | `true` | Show thinking animation |
| `onSubmit` | `(value: string) => void` | - | Submit handler |
| `onValueChange` | `(value: string) => void` | - | Change handler |

## 🎨 Styling & Theming

The component uses CSS custom properties for theming. You can customize the appearance by overriding these variables:

```css
:root {
  /* Alchemy theme colors */
  --liquid-gold: #fbbf24;
  --liquid-red: #ff6b6b;
  --liquid-blue: #3b82f6;
  --liquid-emerald: #45b7d1;
  --metal-surface: #0a0a0a;
  --metal-border: #2a2a2c;
  --metal-muted: #71717a;
}
```

### Custom Styling

```css
/* Override component styles */
.ai-input-container {
  max-width: 1200px; /* Custom max width */
}

.ai-input-wrapper {
  border-radius: 20px; /* Custom border radius */
}

/* Custom button colors */
.ai-generate-btn-container {
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
}
```

## ⌨️ Keyboard Shortcuts

- **Cmd/Ctrl + Enter**: Submit the form
- **Arrow Up/Down**: Navigate suggestions when dropdown is open
- **Enter**: Select highlighted suggestion
- **Escape**: Close all dropdowns and panels

## 🔧 Advanced Usage

### Custom Suggestion Handling

```tsx
import { AIInputComponent } from './src/components/AIInputComponent';

function AdvancedExample() {
  const handleSubmit = async (value: string) => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: value })
      });
      
      const result = await response.json();
      console.log('AI Response:', result);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  return (
    <AIInputComponent
      placeholder="Ask me anything..."
      maxLength={10000}
      onSubmit={handleSubmit}
      className="custom-ai-input"
    />
  );
}
```

### Integration with Form Libraries

```tsx
import { useForm, Controller } from 'react-hook-form';
import { AIInputComponent } from './src/components/AIInputComponent';

function FormExample() {
  const { control, handleSubmit } = useForm();

  const onSubmit = (data: any) => {
    console.log('Form data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="prompt"
        control={control}
        render={({ field }) => (
          <AIInputComponent
            initialValue={field.value}
            onValueChange={field.onChange}
            onSubmit={(value) => field.onChange(value)}
          />
        )}
      />
    </form>
  );
}
```

## 📱 Responsive Design

The component is fully responsive and adapts to different screen sizes:

- **Desktop**: Full-width layout with side-by-side controls
- **Tablet**: Adjusted spacing and button sizes
- **Mobile**: Stacked layout with full-width buttons

## ♿ Accessibility

- Full keyboard navigation support
- Screen reader compatible
- ARIA labels and roles
- High contrast color schemes
- Focus management

## 🎯 Interactive Features

### Smart Suggestions
Click the dropdown arrow next to the Generate button to access:
- ✨ Enhance with more detail
- 🔧 Add technical specifications  
- 🎨 Make more creative
- 💡 Optimize for clarity

### File Attachments
- Click the attachment button to select files
- Supports images, PDFs, text files, and documents
- Visual file list with removal option

### Right-click Presets
Right-click the Generate button for quick preset templates:
- 📊 Analysis Template
- 📋 Tutorial Template
- 💡 Brainstorm Template

## 📈 Recent Updates

### Backend Improvements
- **Storage Layer Complete**: Implemented missing methods (ListPrompts, GetPrompt, SearchPrompts)
- **Enhanced Prompt Models**: New `ModelMetadata` tracking with cost, token usage, and processing metrics
- **Type Consolidation**: Unified GenerateRequest/Response types in shared models package
- **Code Quality**: Comprehensive internal cleanup with TODO resolution and duplicate elimination
- **MCP Integration**: Model Context Protocol support for Claude Desktop
- **Provider Updates**: Enhanced support for multiple LLM providers
- **Performance Optimization**: Faster response times and caching
- **Docker Support**: Improved containerization with docker-compose

### Frontend Enhancements
- **3D Hexagon Grid Effects**: Interactive background with React Three Fiber
- **Enhanced Animations**: Liquid metal effects and hover states
- **Responsive Design**: Improved mobile experience
- **TypeScript Migration**: Full type safety across components

### Code Quality & Architecture
- **Internal Directory Cleanup**: Resolved 17 TODO comments and consolidated duplicate types
- **Enhanced Testing**: Improved test coverage for security and validation
- **Database Schema**: New model metadata tracking for comprehensive analytics

## 🏗️ Development Setup

1. **Clone and install dependencies**:
```bash
git clone https://github.com/yourusername/prompt-alchemy.git
cd prompt-alchemy
npm install
```

2. **Install React types** (if using TypeScript):
```bash
npm install --save-dev @types/react @types/react-dom
```

3. **Start development server**:
```bash
npm run dev
```

4. **Build for production**:
```bash
npm run build
```

## 📋 Browser Support

- Chrome/Edge 88+
- Firefox 87+
- Safari 14+
- iOS Safari 14+
- Android Chrome 88+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit: `git commit -am 'Add feature'`
5. Push: `git push origin feature-name`
6. Create a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Credits

Inspired by modern AI interfaces and alchemical themes. Built with:
- React 18+
- TypeScript
- CSS Custom Properties
- Modern CSS animations

---

**Made with ✨ and ⚗️ for the AI community**