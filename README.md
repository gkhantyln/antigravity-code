<div align="center">

# 🚀 Antigravity-Code v2.2.0

### Multi-API Agentic AI Coding Assistant
**Agentic Workflow • RAG Memory • Vision • Local Models • Smart Failover**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Docker-blue)](https://www.microsoft.com/windows)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

**Never lose productivity to API downtime again!**

[Features](#-features) • [Installation](#-installation) • [Quick Start](#-quick-start) • [New in v2.0](#-new-capabilities-v20) • [Documentation](#-documentation)

</div>

---

## 🌟 Overview

**Antigravity-Code** is a powerful terminal-based AI coding assistant designed for Windows developers. Unlike traditional AI assistants that rely on a single provider, Antigravity features **intelligent multi-API architecture** with automatic failover, ensuring uninterrupted coding assistance even when individual AI providers experience downtime.

With **v2.0**, Antigravity evolves into a fully **Agentic System**. It doesn't just write code; it plans, implements, reviews, and fixes it for you using a team of specialized AI agents. It also gains sight (Vision), memory (RAG), and complete privacy with Local Models (Ollama).

### Why Antigravity?

- 🔄 **99.9% Uptime** - Automatic failover across 3 AI providers
- 🤖 **Agentic Workflow** - Autonomous Planner, Coder, and Reviewer agents
- 🧠 **RAG Memory** - Indexes your codebase for intelligent context retrieval
- 👁️ **Vision & UI** - Converts screenshots directly to HTML/CSS code
- 🏠 **Local & Private** - Run 100% offline with Ollama (Llama 3, Mistral, etc.)
- 🎯 **85+ AI Models** - Choose from Gemini, Claude, and OpenAI
- ⏮️ **Checkpoint System** - Time-travel through file changes with snapshots
- 🔒 **Permission Modes** - 3 control modes (default, auto-edit, plan-only)
- 📦 **Batch Operations** - Visual file tree with multi-file approval
- 🌿 **Session Forking** - Branch conversations without losing context
- 🛡️ **Zero Context Loss** - Seamless provider switching mid-conversation
- 🔒 **Privacy First** - Local storage, encrypted keys, no telemetry
- ⚡ **Lightning Fast** - Native Windows terminal integration
- 🎨 **Beautiful CLI** - Colorized output with progress indicators

---

## ✨ Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| 🤖 **Agentic Mode** | Autonomous planning, coding, and reviewing workflow |
| 💻 **Code Generation** | Write clean, efficient code in any language |
| 👁️ **Vision Analysis** | Analyze images and generated code from screenshots |
| 🧠 **RAG Context** | Index entire codebase for accurate answers |
| 📂 **File System Ops** | Read, write, and delete files directly |
| ⏮️ **Checkpoint System** | **NEW!** Time-travel file snapshots with `/rewind` and `/checkpoints` |
| 🔒 **Permission Modes** | **NEW!** 3 control modes: default, auto-edit, plan-only |
| 📦 **Batch Operations** | **NEW!** Visual file tree with multi-file approval/rejection |
| 🌿 **Session Forking** | **NEW!** Branch conversations with `/fork` command |
| 📊 **Context Management** | **NEW!** Smart compaction with `/compact` and `/context` |
| 🐛 **Intelligent Debugging** | Find and fix bugs systematically using Linter and Auto-Fix |
| 🔄 **Smart Commit** | Auto-generate conventional commit messages from git diff |
| 🧪 **Test Generation** | Automated unit tests written to disk |
| 📝 **Documentation** | Auto-generate comprehensive docs |
| 🔄 **Refactoring** | Improve code quality and structure |
| 🧠 **Context Awareness** | Auto-detects project type (Node, Python, etc.) |
| 🏗️ **Project Scaffolding** | Auto-generate Fractal Agent structure with `/init` |
| 🛡️ **Self-Healing** | Autonomous error detection and fixing loop |
| 📦 **Safe Execution** | Sandboxed execution with blocklist & user confirmation |
| 🔌 **IDE Integration** | MCP Server & JSON output for VS Code/Cursor |

### Advanced Features

- **🏠 Local Model Support**: Full support for Ollama (Llama 3, etc.) for offline coding.
- **🔄 Intelligent Failover**: Automatic switching between Gemini → Claude → OpenAI.
- **🎨 Rich CLI**: Vibrant colors, animated spinners, and markdown rendering.
- **🐚 Shell Integration**: Native `ag` alias and system PATH setup.
- **📊 Context Management**: Smart conversation history with 5MB compression.
- **🛠️ Extensible Skills**: Custom skills for specialized tasks.
- **🚀 Workflow Automation**: Pre-defined workflows (`/create`, `/debug`, `/test`).
- **🔐 Secure Storage**: Windows DPAPI encryption for API keys.

### New in v2.2.0 🎉

- **⏮️ Checkpoint System**: Automatic file snapshots before every edit. Rewind to any previous state with `/rewind <checkpoint_id>`. List all checkpoints with `/checkpoints`.
- **🔒 Permission Modes**: Control AI behavior with 3 modes:
  - `default`: Ask before each action
  - `auto-edit`: Automatically apply all changes
  - `plan-only`: Show plans without executing
- **📦 Visual File Tree**: Beautiful tree visualization for multi-file operations with status icons (✏️ Modified, ➕ New, ❌ Deleted).
- **🎯 Batch Operations**: When AI proposes multiple file changes, see them all at once and choose:
  - `[A] Apply All` - Accept all changes instantly
  - `[R] Review Each` - Review files one by one
  - `[C] Cancel` - Reject all changes
- **🌿 Session Forking**: Branch your conversation with `/fork` to explore different approaches without losing the original context.
- **📊 Context Management**: Smart context compaction prioritizes important messages. Use `/compact` to optimize and `/context` to view statistics.

---

## 📦 Installation

### Prerequisites

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0.0 or higher
- **Windows** 10/11 with PowerShell 5.1+
- **Git** installed and available in PATH
- (Optional) **Ollama** for local models ([Download](https://ollama.com/))
- **API Key** from at least one provider (if not using Ollama):
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
antigravity-code
```

### 🐳 Docker Quick Start

Run Antigravity in a container without installing Node.js:

```bash
# Build and run
docker-compose up -d
docker-compose exec antigravity ag
```

**Example Session:**

```
🚀 Antigravity-Code v2.0
Connected to: gemini (gemini-2.5-flash)

AG> /agent "Refactor the auth middleware to use JWT"

🤖 Planner: Creating execution plan...
1. [ ] Install jsonwebtoken package
2. [ ] Update middleware/auth.js
3. [ ] Update routes/auth.js

🤖 Coder: Executing step 1...
✓ Installed jsonwebtoken

🤖 Reviewer: Checking code changes...
✓ Linting passed. functionality verified.

> /commit
AI: Suggested message: "refactor(auth): migrate to JWT authentication"
Commit? (y/n): y
✓ Committed.
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
| `/agent` | Start autonomous agentic workflow | `/agent "Build a todo app"` |
| `/ui` | Convert screenshot to HTML/CSS code | `/ui mockup.png` |
| `/see` | Analyze an image | `/see error_screenshot.png` |
| `/commit` | Smart git commit message generation | `/commit` (auto-detects changes) |
| `/index` | Index codebase for RAG | `/index` |
| `/init` | Initialize Fractal Agent scaffolding | `/init my-app` |
| `/rewind` | **NEW!** Revert file to checkpoint | `/rewind abc123` |
| `/checkpoints` | **NEW!** List recent file checkpoints | `/checkpoints` |
| `/permission` | **NEW!** Change permission mode | `/permission auto-edit` |
| `/fork` | **NEW!** Fork current conversation | `/fork` |
| `/compact` | **NEW!** Compact conversation context | `/compact` |
| `/context` | **NEW!** Show context statistics | `/context` |
| `/create` | Create new features/files directly | `/create "snake game in python"` |
| `/debug` | Debug and fix code issues | `/debug "fix this error"` |
| `/test` | Generate and save unit tests | `/test "app.js"` |
| `/model` | Change Gemini/Ollama model | `/model llama3` |
| `/provider` | Switch AI provider | `/provider ollama` |
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

### Ollama (Local Provider) - **NEW!**
- `llama3`
- `mistral`
- `codellama`
- *Any model pulled via `ollama pull <model>`*

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
PRIMARY_PROVIDER=gemini # or ollama
SECONDARY_PROVIDER=claude
TERTIARY_PROVIDER=openai

# Gemini Configuration
GEMINI_DEFAULT_MODEL=gemini-2.5-flash

# Ollama Configuration (NEW)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

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

**Switch to Local Mode:**
```bash
> /provider ollama
✓ Switched to provider: ollama

> /model llama3
✓ Changed Ollama model to: llama3
```

---

## 🛡️ Security

Antigravity-Code prioritizes your security and privacy:

- 🔐 **Encrypted API Keys** - Windows DPAPI encryption
- 🏠 **Local Mode** - Use Ollama for complete data privacy (no data leaves your machine)
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

### Example 4: Agentic Workflow (NEW)
```bash
> /agent "Implement a User Profile page with React"
🤖 Planner: Creating execution plan...
1. [ ] Create Profile.js component
2. [ ] Add CSS definitions
3. [ ] Update App.js router
...
```

### Example 5: Vision Analysis (NEW)
```bash
> /see diagram.png "Explain this database schema"
AI: This diagram shows a relational database with 3 tables...
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
│   │   ├── ollama.js        # Ollama (Local Models)
│   │   └── orchestrator.js  # Failover logic
│   ├── cli/                  # CLI interface
│   ├── core/                 # Core engine
│   ├── tools/                # AI Tools
│   │   ├── filesystem.js    # File System ops
│   │   ├── git.js           # Git operations
│   │   └── linter.js        # Linter integration
│   └── utils/                # Utilities
├── scripts/
│   └── setup.js              # Setup wizard
├── test/                     # Tests
└── package.json
```

---

## 📊 Roadmap

### Version 2.2.0 (Current) ✅
- ✅ **Checkpoint System** (File snapshots with `/rewind` and `/checkpoints`)
- ✅ **Permission Modes** (3 modes: default, auto-edit, plan-only)
- ✅ **Session Forking** (Branch conversations with `/fork`)
- ✅ **Context Compaction** (Smart memory management)
- ✅ **Visual File Tree** (Beautiful tree rendering with status icons)
- ✅ **Batch Operations** (Multi-file approval with [Apply All] [Review Each] [Cancel])

### Version 2.1.0 ✅
- ✅ **Autonomous Self-Healing** (Auto-fix errors)
- ✅ **Safe Execution** (Sandboxing & Blocklist)
- ✅ **UX Polish** (Colorized Diffs & Confirmations)
- ✅ **IDE Readiness** (MCP Server & JSON Output)

### Version 2.0 (Current) ✅
- ✅ **Agentic Workflow** (Planner, Coder, Reviewer)
- ✅ **RAG Memory** (Codebase Indexing)
- ✅ **Vision Support** (Image Analysis & UI Gen)
- ✅ **Local Models** (Ollama Integration)
- ✅ **Git Integration** (Smart Commit)
- ✅ **Proactive Debugging** (Linting)
- ✅ **Project Scaffolding** (Fractal Agent /init)

### Version 1.1 (Completed) ✅
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

---

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

We use **Changesets** for version management and **Husky** for git hooks to ensure code quality.

---

## 🐛 Troubleshooting

### Common Issues

**Problem:** "Ollama connection failed"
```bash
# Solution: Ensure Ollama is running
ollama serve
```

**Problem:** "Invalid API key"
```bash
# Solution: Re-run setup
npm run setup
```

For more help, see [Troubleshooting Guide](docs/troubleshooting.md)

---

## 📄 License

MIT License © 2026 gkhantyln

---

## 🙏 Acknowledgments

Special thanks to:
- [Google AI](https://ai.google.dev/) for Gemini API
- [Anthropic](https://www.anthropic.com/) for Claude API
- [OpenAI](https://openai.com/) for OpenAI API
- [Ollama](https://ollama.com/) for Local LLM support
- All contributors and supporters of this project

---

## 🥊 The Ultimate Showdown: Antigravity vs Claude Code

Why limit yourself to one brain when you can have the entire hive mind? **Antigravity-Code** is engineered to be **Anti-Fragile**, correcting itself and adapting to any situation.

| Feature Strategy | 🚀 **Antigravity-Code** (The Hive Mind) | 🤖 Claude Code (The Solitary Cloud) |
| :--- | :--- | :--- |
| **🧠 Intelligence Architecture** | **Fractal Agent Swarm**<br>(Planner + Coder + Reviewer agents working in parallel) | Linear Chain<br>(One-step thinking) |
| **🛡️ Resilience Strategy** | **Unstoppable Failover**<br>(Auto-switches: Gemini → Claude → OpenAI if one fails) | **Single Point of Failure**<br>(If Anthropic is down, you stop coding) |
| **🔒 Data Sovereignty** | **100% Private & Offline Capable**<br>(Run locally via Ollama with zero data leak) | **Cloud Locked**<br>(Your code always leaves your machine) |
| **⚡ Performance** | **Native Shell Speed**<br>(Interacts directly with OS kernel & filesystem) | API Latency Dependent |
| **👁️ Sensory Input** | **True Multi-Modal Vision**<br>(Sees screenshots, diagrams, and UI mockups) | Text-Based constraints |
| **🔄 DevOps Integration** | **Smart Context Awareness**<br>(Auto-detects environment, git state, and project type) | Standard CLI inputs |
| **💸 Economy** | **Cost-Agnostic**<br>(Switch to free local models to save $) | Pay-per-token only |
| **🏗️ Scaffolding** | **Fractal Core Injection** (`/init`)<br>(Instantly builds enterprise-grade agent structure) | Basic file creation |

### 🏆 The Verdict: **Antigravity-Code Dominates**
> *While Claude Code is a brilliant tool, **Antigravity-Code is a Platform.** It gives you the freedom of Open Source, the power of Multi-Model orchestration, and the security of Local Execution. Don't just code; **Antigravity**.*

## 📞 Contact & Support

<div align="center">

### Get in Touch

[![Email](https://img.shields.io/badge/Email-tylngkhn@gmail.com-red?style=for-the-badge&logo=gmail&logoColor=white)](mailto:tylngkhn@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-gkhantyln-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/gkhantyln)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gkhantyln/)

**Need help?**
- 📧 Email: [tylngkhn@gmail.com](mailto:tylngkhn@gmail.com)
- 🐛 Issues: [GitHub Issues](https://github.com/gkhantyln/antigravity-code/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/gkhantyln/antigravity-code/discussions)
- 💼 LinkedIn: [Gökhan TAYLAN](https://www.linkedin.com/in/gkhantyln/)

</div>

---

<div align="center">

### Developed with 💡 by [gkhantyln](https://github.com/gkhantyln)

**Made with ❤️ for developers who never stop coding**

[![Star this repo](https://img.shields.io/github/stars/gkhantyln/antigravity-code?style=social)](https://github.com/gkhantyln/antigravity-code)
[![Follow on GitHub](https://img.shields.io/github/followers/gkhantyln?style=social)](https://github.com/gkhantyln)

---

**© 2026 Antigravity-Code | MIT License**

[⬆ Back to Top](#-antigravity-code-v20)

</div>
