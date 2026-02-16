<div align="center">

# 🚀 Antigravity-Code

### Multi-API AI Coding Assistant with Intelligent Failover

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/platform-Windows-blue)](https://www.microsoft.com/windows)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Never lose productivity to API downtime again!**

[Features](#-features) • [Installation](#-installation) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Models](#-supported-models)

</div>

---

## 🌟 Overview

**Antigravity-Code** is a powerful terminal-based AI coding assistant designed for Windows developers. Unlike traditional AI assistants that rely on a single provider, Antigravity features **intelligent multi-API architecture** with automatic failover, ensuring uninterrupted coding assistance even when individual AI providers experience downtime.

### Why Antigravity?

- 🔄 **99.9% Uptime** - Automatic failover across 3 AI providers
- 🎯 **85+ AI Models** - Choose from Gemini, Claude, and OpenAI
- 🛡️ **Zero Context Loss** - Seamless provider switching mid-conversation
- 🔒 **Privacy First** - Local storage, encrypted keys, no telemetry
- ⚡ **Lightning Fast** - Native Windows terminal integration
- 🎨 **Beautiful CLI** - Colorized output with progress indicators

---

## ✨ Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| 💻 **Code Generation** | Write clean, efficient code in any language |
| 📂 **File System Ops** | Read, write, and delete files directly |
| 🐛 **Intelligent Debugging** | Find and fix bugs systematically |
| 🧪 **Test Generation** | Automated unit tests written to disk |
| 📝 **Documentation** | Auto-generate comprehensive docs |
| 🔄 **Refactoring** | Improve code quality and structure |
| 🧠 **Context Awareness** | **NEW!** Auto-detects project type (Node, Python, etc.) |

### Advanced Features

- **🔄 Intelligent Failover**: Automatic switching between Gemini → Claude → OpenAI
- **🎨 Rich CLI (v1.1)**: Vibrant colors, animated spinners, and markdown rendering
- **🐚 Shell Integration**: Native `ag` alias and system PATH setup
- **📊 Context Management**: Smart conversation history with 5MB compression
- **🛠️ Extensible Skills**: Custom skills for specialized tasks
- **🚀 Workflow Automation**: Pre-defined workflows (`/create`, `/debug`, `/test`)
- **🔐 Secure Storage**: Windows DPAPI encryption for API keys

---

## 📦 Installation

### Prerequisites

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0.0 or higher
- **Windows** 10/11 with PowerShell 5.1+
- **API Key** from at least one provider:
  - [Google AI Studio](https://makersuite.google.com/app/apikey) (Gemini - Recommended)
  - [Anthropic Console](https://console.anthropic.com/) (Claude)
  - [OpenAI Platform](https://platform.openai.com/api-keys) (OpenAI)

### Quick Install

```bash
# Clone the repository
git clone https://github.com/gkhantyln/antigravity-code.git
cd antigravity-code

# Install dependencies
npm install

# Run setup wizard
npm run setup

# Integrate with shell (Path & Aliases)
npm run integrate
```

The setup wizard will guide you through:
1. ✅ API key configuration (encrypted storage)
2. ✅ Model selection for each provider
3. ✅ Environment setup
4. ✅ Shell integration (`ag` alias)

---

## 🚀 Quick Start

### Interactive Mode (REPL)

```bash
ag
# or
antigravity
```

**Example Session:**

```
🚀 Antigravity-Code v1.1.0
Connected to: gemini (gemini-2.5-flash)

AG> Write a function to validate email addresses

🤖 AI (gemini/gemini-2.5-flash):
Here's a robust email validation function:

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Usage
console.log(validateEmail('user@example.com')); // true
console.log(validateEmail('invalid.email'));     // false

> /model gemini-3-pro
✓ Changed Gemini model to: gemini-3-pro

> /help
Available Commands:
/create   - Create features & files
/debug    - Debug issues
/test     - Generate & save tests
/model    - Change Gemini model
/provider - Switch provider
/exit     - Exit
```

### Single Command Mode

```bash
ag "Explain async/await in JavaScript"
```

### Pipe Mode

```bash
git diff | ag "Explain these changes"
cat error.log | ag "Debug this error"
```

---

## 🎯 Available Commands

### Interactive Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/create` | Create new features/files directly | `/create "snake game in python"` |
| `/debug` | Debug and fix code issues | `/debug "fix this error"` |
| `/test` | Generate and save unit tests | `/test "app.js"` |
| `/model` | Change Gemini model | `/model gemini-3-pro` |
| `/provider` | Switch AI provider | `/provider claude` |
| `/config` | View/update configuration | `/config` |
| `/new` | Start new conversation | `/new` |
| `/clear` | Clear screen | `/clear` |
| `/help` | Show help | `/help` |
| `/exit` | Exit Antigravity | `/exit` |

---

## 🤖 Supported Models

### Gemini (Primary Provider) - 14 Models

**Gemini 3 Series (Latest)**
- `gemini-3-flash` - Fast & fluid multimodal
- `gemini-3-pro` - Most powerful general model
- `gemini-3-pro-image` - Visual + text
- `gemini-3-deep-think` - Advanced analysis

**Gemini 2.5 Series**
- `gemini-2.5-pro` - Production & powerful
- `gemini-2.5-flash` ⭐ **Default** - Fast & economical
- `gemini-2.5-flash-tts` - Text-to-speech

**Legacy Models**
- `gemini-2.0-flash-exp`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`
- `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-1.0-pro`

### Claude (Secondary Provider) - 11 Models

**Opus Series (Most Powerful)**
- `claude-opus-4.6` - Latest & most capable
- `claude-opus-4.1`, `claude-opus-4`

**Sonnet Series (Balanced)**
- `claude-sonnet-4.5` - Recommended
- `claude-sonnet-4`, `claude-sonnet-3.7`, `claude-sonnet-3.5`

**Haiku Series (Fast & Economical)**
- `claude-haiku-4.5`, `claude-haiku-3.5`, `claude-haiku-3`

### OpenAI (Tertiary Provider) - 60+ Models

**GPT-5.x Series**
- `gpt-5.3-codex`, `gpt-5.3-codex-spark` (Latest)
- `gpt-5.2`, `gpt-5.2-pro`, `gpt-5.2-codex`
- `gpt-5.1`, `gpt-5.1-codex`, `gpt-5.1-codex-max`
- `gpt-5`, `gpt-5-pro`, `gpt-5-codex`, `gpt-5-mini`, `gpt-5-nano`

**o-Series (Reasoning)**
- `o3`, `o3-pro`, `o3-mini`, `o4-mini-deep-research`

**GPT-4.1 Series**
- `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`

**Specialized Models**
- Multimodal: `gpt-image-1`, `gpt-image-1-mini`
- Audio: `gpt-audio`, `gpt-realtime`, `whisper`
- Embedding: `text-embedding-3-large`, `text-embedding-3-small`
- Utility: `tts-1`, `tts-1-hd`, `omni-moderation`

---

## ⚙️ Configuration

### Environment Variables

Edit `.env` file:

```env
# Provider Priority
PRIMARY_PROVIDER=gemini
SECONDARY_PROVIDER=claude
TERTIARY_PROVIDER=openai

# Gemini Configuration
GEMINI_DEFAULT_MODEL=gemini-2.5-flash

# Failover Settings
FAILOVER_ENABLED=true
MAX_RETRIES_PER_PROVIDER=3
RETRY_DELAY_MS=1000
HEALTH_CHECK_INTERVAL_MS=30000

# Context Settings
MAX_CONVERSATION_MESSAGES=50
MAX_FILE_CONTEXT=10
MAX_CONTEXT_SIZE_MB=5
```

### Model Switching

**Change Gemini Model:**
```bash
> /model gemini-3-pro
✓ Changed Gemini model to: gemini-3-pro
```

**Switch Provider:**
```bash
> /provider claude
✓ Switched to provider: claude
```

---

## 🛡️ Security

Antigravity-Code prioritizes your security and privacy:

- 🔐 **Encrypted API Keys** - Windows DPAPI encryption
- 💾 **Local Storage** - All data stored locally on your machine
- 🚫 **No Telemetry** - Zero data collection or analytics
- 🔒 **Secure Logging** - Automatic secret redaction in logs
- 🛡️ **Input Sanitization** - Protection against injection attacks

**API Key Storage:**
- Location: `C:\Users\<username>\.antigravity\keys.json`
- Encryption: Windows DPAPI (tied to your user account)
- Security: Keys cannot be transferred to other machines/users

---

## 📚 Documentation

### User Guides
- [Quick Start Guide](docs/quick-start.md) - Get started in 5 minutes
- [Configuration Guide](docs/configuration.md) - Advanced settings
- [Workflow Guide](docs/workflows.md) - Using workflows effectively

### Developer Documentation
- [Architecture Overview](docs/architecture.md) - System design
- [API Reference](docs/api-reference.md) - API documentation
- [Contributing Guide](CONTRIBUTING.md) - How to contribute

---

## 🎨 Examples

### Example 1: Create a REST API

```bash
> /create

AI: What feature would you like to create?
You: REST API for user management with JWT auth

AI: I'll create `src/routes/auth.js` and `src/controllers/authController.js` with:
- User CRUD operations
- JWT authentication
- Input validation

Proceed? (y/n): y
✓ Files created successfully.
```

### Example 2: Debug an Error

```bash
> /debug

AI: What issue are you experiencing?
You: Getting "Cannot read property 'map' of undefined"

AI: Let me analyze...
[Provides detailed analysis and fix]
```

### Example 3: Generate Tests

```bash
> /test "src/utils/validator.js"

AI: I will generate unit tests for `validator.js`.
✓ Created `tests/validator.test.js` with 5 test cases.
```

---

## 🏗️ Project Structure

```
antigravity-code/
├── .agent/                    # Fractal Architecture
│   ├── GEMINI.md             # Agent configuration
│   ├── rules/                # Coding rules
│   ├── skills/               # AI skills
│   └── workflows/            # Automation workflows
├── src/
│   ├── api/                  # API providers
│   │   ├── gemini.js        # Gemini (14 models)
│   │   ├── claude.js        # Claude (11 models)
│   │   ├── openai.js        # OpenAI (60+ models)
│   │   └── orchestrator.js  # Failover logic
│   ├── cli/                  # CLI interface
│   ├── core/                 # Core engine
│   ├── tools/                # AI Tools
│   │   └── filesystem.js    # File System ops
│   └── utils/                # Utilities
├── scripts/
│   └── setup.js              # Setup wizard
├── test/                     # Tests
└── package.json
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💻 Make your changes
4. ✅ Run tests (`npm test`)
5. 📝 Commit your changes (`git commit -m 'Add amazing feature'`)
6. 🚀 Push to the branch (`git push origin feature/amazing-feature`)
7. 🎉 Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and development process.

---

## 📊 Roadmap

### Version 1.1 (Current) ✅
- ✅ Rich CLI with `chalk` & `ora`
- ✅ Deep Shell Integration (`ag` alias)
- ✅ Intelligent Context Awareness
- ✅ Markdown Rendering

### Version 1.0 (Completed) ✅
- ✅ Multi-API support (Gemini, Claude, OpenAI)
- ✅ 85+ AI models
- ✅ Intelligent failover
- ✅ Terminal interface
- ✅ Skills and workflows

### Version 2.0 (Planned)
- [ ] GUI interface (Electron)
- [ ] Team collaboration
- [ ] Cloud sync (optional)
- [ ] Plugin marketplace
- [ ] Voice commands

### Version 3.0 (Future)
- [ ] Self-hosted AI models
- [ ] Custom model fine-tuning
- [ ] Advanced analytics
- [ ] IDE integrations (VS Code, JetBrains)

---

## 🐛 Troubleshooting

### Common Issues

**Problem:** "Invalid API key"
```bash
# Solution: Re-run setup
npm run setup
```

**Problem:** "Failed to connect to API"
```bash
# Solution: Check internet connection and try switching provider
> /provider claude
```

**Problem:** "Model not available"
```bash
# Solution: Check available models
> /model
```

For more help, see [Troubleshooting Guide](docs/troubleshooting.md)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 gkhantyln

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

Special thanks to:
- [Google AI](https://ai.google.dev/) for Gemini API
- [Anthropic](https://www.anthropic.com/) for Claude API
- [OpenAI](https://openai.com/) for OpenAI API
- All contributors and supporters of this project

---

## 📞 Contact & Support

<div align="center">

### Get in Touch

[![Email](https://img.shields.io/badge/Email-tylngkhn@gmail.com-red?style=for-the-badge&logo=gmail&logoColor=white)](mailto:tylngkhn@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-gkhantyln-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/gkhantyln)

**Need help?**
- 📧 Email: [tylngkhn@gmail.com](mailto:tylngkhn@gmail.com)
- 🐛 Issues: [GitHub Issues](https://github.com/gkhantyln/antigravity-code/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/gkhantyln/antigravity-code/discussions)

</div>

---

<div align="center">

### Developed with 💡 by [gkhantyln](https://github.com/gkhantyln)

**Made with ❤️ for developers who never stop coding**

[![Star this repo](https://img.shields.io/github/stars/gkhantyln/antigravity-code?style=social)](https://github.com/gkhantyln/antigravity-code)
[![Follow on GitHub](https://img.shields.io/github/followers/gkhantyln?style=social)](https://github.com/gkhantyln)

---

**© 2026 Antigravity-Code | MIT License**

[⬆ Back to Top](#-antigravity-code)

</div>
