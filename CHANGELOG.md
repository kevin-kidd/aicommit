# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.7] - 2024-03-26

### Added

- Initial release of AI Commit monorepo
- CLI tool for generating commit messages
- VS Code extension for seamless integration within the editor
- Support for multiple AI providers (OpenAI, Anthropic, OpenRouter, Groq, and OpenAI-compatible)
- LazyGit integration for streamlined Git operations

### CLI Tool

- Command to generate commit messages
- Configuration options for AI provider, model, and other settings
- Integration setup command for LazyGit

### VS Code Extension

- Command to generate commit messages directly from the Source Control view
- Configuration options for AI provider, model, max tokens, and number of commit messages
- Secure storage of API keys
- Commands for updating and testing API keys

### Core Functionality

- Support for OpenAI, Anthropic, OpenRouter, Groq, and OpenAI-compatible providers
- Customizable AI models and token limits
- Generation of multiple commit message options

### Documentation

- README with installation and usage instructions for CLI and VS Code extension
- Contribution guidelines and development setup instructions
