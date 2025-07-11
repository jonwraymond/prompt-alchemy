# Contributing to Prompt Alchemy

> We're excited that you're interested in contributing to this project! Your help is essential for keeping it great. This document will guide you through the process to make contributing as easy and transparent as possible.
> 

---

## 🚀 Getting Started

Before you begin, please take a moment to read our Code of Conduct to understand what we expect from our community members. All participants are expected to uphold this code.

## 📜 Code of Conduct

This project and everyone participating in it is governed by the [Prompt Alchemy Code of Conduct](https://github.com/jonwraymond/prompt-alchemy/blob/main/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🐛 Issue Reporting

Found a bug? We'd love to hear about it! A well-documented issue helps us fix problems faster.

### Before Reporting an Issue

To help us out, please check the following steps before submitting your report:

- [ ]  Have you checked the troubleshooting guide?
- [ ]  Have you searched the existing GitHub issues to avoid creating a duplicate?
- [ ]  Have you tried to enable debug logging to collect more information?
- [ ]  Have you tested the issue with a minimal configuration?
- [ ]  Have you verified that all prerequisites are met?

### When Submitting Your Report

When you're ready to create the issue, please include the following information. The more details you provide, the better!

- Operating system and version
- Go version (you can get this by running `go version`)
- Prompt Alchemy version (run `prompt-alchemy version`)
- Your configuration file (with any secret API keys redacted)
- The complete error message and stack trace
- Clear, step-by-step instructions to reproduce the issue
- Relevant debug logs (with any sensitive data removed)

## 👉 Pull Request Process

1. **Fork the repository** to your own GitHub account.
2. **Create a new branch** from `main` for your changes.
3. **Make your changes** and write clear, descriptive commit messages.
4. **Push your changes** to your forked repository.
5. **Open a Pull Request (PR)** to the original repository's `main` branch.
6. In your PR, **clearly explain** what you did and why.
7. Remember to **link the PR** to the issue it resolves.

## 💻 Development Setup

To contribute to Prompt Alchemy, you'll need the following prerequisites installed on your system:

- **Go:** Version 1.23 or higher
- **Git:** For version control
- **Make:** For running build and test commands

Once you have the prerequisites, follow these steps to set up your local development environment:

1. Clone your forked repository to your local machine:
    
    ```bash
    git clone [<https://github.com/YOUR-USERNAME/prompt-alchemy.git>](<https://github.com/YOUR-USERNAME/prompt-alchemy.git>)
    
    ```
    
2. Navigate into the project directory:
    
    ```bash
    cd prompt-alchemy
    
    ```
    
3. Build the project using the provided Makefile:
    
    ```bash
    make build
    
    ```
    

## 🧪 Testing Guidelines

We take testing seriously to ensure the quality and stability of the project. Before submitting a pull request, please make sure your changes pass all the necessary checks.

The primary command to run the complete test suite (including both unit and integration tests) is:

```bash
make test
```

This project has a comprehensive set of advanced tests for different scenarios (e.g., `make test-unit`, `make test-e2e`). While you probably only need to run `make test`, feel free to explore the `Makefile` if your changes require more specific testing.

## ✨ Code Style

To maintain a consistent and clean codebase, we use a linter to enforce style conventions. This project uses `golangci-lint` for automated code quality checks.

Before submitting your pull request, please run the linter to ensure your changes adhere to our standards. You can run it with the following command:

```bash
make lint
```

## 📖 Documentation Standards

We believe clear and consistent documentation is just as important as clean code. Please adhere to the following standards when writing any documentation, including code comments.

- **Language:** All documentation must be written in clear, concise English.
- **Formatting:** We use Markdown (`.md`) for all documentation files. Please make use of formatting elements like headers, lists, and code blocks to improve readability.
- **Code Comments:** When adding comments to the code, explain the *why*, not just the *what*. Good comments describe the purpose and intent behind a piece of code, especially if it's complex.

## Let's Build Together

We are excited to see your contributions and look forward to building something great with you. Thank you for being a part of our community!
