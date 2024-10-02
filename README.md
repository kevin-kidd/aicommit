# AI Commit

[![Bun](https://img.shields.io/badge/Bun-000000?style=flat-square&logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

AI Commit is a powerful tool that generates Git commit messages using AI, supporting various models and providers. Integrate with LazyGit and VS Code, making it easy to incorporate AI-generated commit messages into your workflow.

## Features

- 🤖 Generate commit messages using AI
- 🔄 Support for multiple AI providers (OpenAI, Anthropic, OpenRouter, Groq, and OpenAI-compatible)
- 🖥️ CLI tool for easy integration into your workflow
- 📝 VS Code extension for seamless integration within the editor
- 🔗 LazyGit integration for streamlined Git operations

## Requirements

- [Bun](https://bun.sh/)
- [Git](https://git-scm.com/)

## Installation

### CLI Tool

```bash
bun add -g @kkidd/aicommit
```

### VS Code Extension

The VS Code extension will be available in the marketplace in the next month.

## Usage

### CLI Commands

```bash
# Generate commit messages
aic generate [--amount <number>]

# Configure AI provider and model
aic config [options]

# View current configuration
aic view-config

# Set up integrations
aic integrate
```

### Configuration Options

- `--provider`: AI provider (openai, openai-compatible, anthropic, openrouter, groq)
- `--model`: AI model to use
- `--api-key`: API key for the selected provider
- `--endpoint`: Endpoint for OpenAI compatible providers
- `--tokens`: Maximum number of tokens to generate

## Integrations

### LazyGit

To set up the LazyGit integration:

1. Run `aic integrate`
2. Choose "LazyGit" from the options
3. Follow the prompts to configure your LazyGit config file

### VS Code (coming soon)

To set up the VS Code integration:

1. Install the AI Commit extension from the VS Code marketplace
2. Configure the extension settings in VS Code:
   - AI provider
   - API key
   - Model
   - Max tokens
   - Number of commit messages to generate

## Configuration

AI Commit uses a configuration file to store your preferences. You can edit this file directly or use the `aic config` command to update your settings.

Example configuration:

```json
{
  "provider": "openai",
  "model": "gpt-4",
  "apiKey": "your-api-key-here",
  "maxTokens": 256
}
```

## TODO

- [x] CLI tool for generating commit messages
- [x] Support for multiple AI providers
- [x] LazyGit integration
- [ ] VS Code Extension
- [ ] Custom prompt template
- [ ] Support for custom non-OpenAI compatible providers
- [ ] Localization support for multiple languages
- [ ] Integration with other Git GUI clients

## Development

To set up the development environment:

1. Clone the repository
2. Install dependencies: ```bun install```
3. Build the project: ```bun run build```
4. Run tests: ```bun test```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/CoolFeature`)
3. Commit your changes (`git commit -m 'Add some CoolFeature'`)
4. Push to the branch (`git push origin feature/CoolFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any problems or have any questions, please open an issue on the [GitHub repository](https://github.com/kevin-kidd/aicommit).

## Acknowledgements

- [OpenAI](https://openai.com/) for providing the OpenAI SDK
- [Anthropic](https://www.anthropic.com/) for their client SDK
- [OpenRouter](https://openrouter.ai/) for additional AI model access
- [Groq](https://groq.com/) for their client SDK
