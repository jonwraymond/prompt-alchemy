
# Contributing to Prompt Alchemy

First off, thank you for considering contributing to Prompt Alchemy! It's people like you that make open source such a great community. We welcome any type of contribution, not just code. 

## Ways to Contribute

- **Reporting Bugs**: If you find a bug, please open an issue and provide as much detail as possible.
- **Suggesting Enhancements**: Have an idea for a new feature or an improvement to an existing one? We'd love to hear it. Open an issue to start the discussion.
- **Pull Requests**: If you're ready to contribute code, we're excited to review your work. 
- **Documentation**: Improvements to the documentation are always welcome.

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** to your local machine.
3. **Create a new branch** for your changes.
4. **Make your changes** and commit them with a clear and concise message.
5. **Push your changes** to your fork.
6. **Open a pull request** to the `main` branch of the original repository.

### Backend Development Setup

```bash
# Install Go dependencies
go mod download

# Run tests
make test

# Build the binary
make build
```

### Frontend Development Setup

```bash
# Install Node dependencies
npm install

# Run development server with hot reload
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

## Pull Request Guidelines

- Please make sure your code follows the existing style of the project.
- Ensure that your changes are well-tested.
- Update the documentation if your changes require it.
- Write a clear and descriptive title and description for your pull request.

### Backend Guidelines

- Follow Go conventions and use `go fmt`
- Add unit tests for new functionality
- Update API documentation if adding/changing endpoints
- Run `make lint` before committing

### Frontend Guidelines

- Use TypeScript for all new components
- Follow the existing React patterns and hooks
- Maintain the alchemy theme consistency
- Add proper TypeScript types/interfaces
- Test components with different viewport sizes
- Ensure accessibility (ARIA labels, keyboard navigation)

## Code of Conduct

We have a [Code of Conduct](CODE_OF_CONDUCT.md) that we expect all contributors to adhere to. Please read it before contributing.

Thank you for your contributions!
