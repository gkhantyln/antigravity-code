# ⚙️ Configuration Guide

Antigravity-Code is highly configurable via environment variables. The setup wizard (`npm run setup`) handles the basics, but you can finetune the behavior by editing the `.env` file in the project root.

## Environment Variables

### 🔑 API Keys
These keys are encrypted when using the setup wizard, but can be set manually for development.

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Your Google Gemini API key. |
| `CLAUDE_API_KEY` | Your Anthropic Claude API key. |
| `OPENAI_API_KEY` | Your OpenAI API key. |

### 🤖 Web Providers Setup

Configure which provider to use and their priority.

| Variable | Description | Default |
|----------|-------------|---------|
| `PRIMARY_PROVIDER` | First choice provider (`gemini`, `claude`, `openai`, `ollama`). | `gemini` |
| `SECONDARY_PROVIDER` | Fallback if primary fails. | `claude` |
| `TERTIARY_PROVIDER` | Final fallback option. | `openai` |

### 🧠 Model Configuration

Set the specific models for each provider.

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_DEFAULT_MODEL` | Model for Gemini. | `gemini-3-flash` |
| `CLAUDE_MODEL` | Model for Claude. | `claude-sonnet-4.5` |
| `OPENAI_MODEL` | Model for OpenAI. | `gpt-5.2` |
| `OLLAMA_MODEL` | Model for Ollama (Local). | `llama3` |
| `OLLAMA_BASE_URL` | URL for Ollama instance. | `http://localhost:11434` |

### 🛡️ Failover System

Antigravity automatically switches providers if one is down or rate-limited.

| Variable | Description | Default |
|----------|-------------|---------|
| `FAILOVER_ENABLED` | Enable/Disable automatic switching. | `true` |
| `MAX_RETRIES_PER_PROVIDER` | How many times to retry before switching. | `3` |
| `RETRY_DELAY_MS` | Delay between retries (milliseconds). | `1000` |
| `HEALTH_CHECK_INTERVAL_MS`| How often to check API health. | `30000` |

### 📂 Context & Memory

Control how much context the AI remembers.

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_CONVERSATION_MESSAGES` | Number of messages to keep in history. | `50` |
| `MAX_FILE_CONTEXT` | Max number of files to read into context. | `10` |
| `MAX_CONTEXT_SIZE_MB` | Max size of context to prevent token overflow. | `5` |
| `CONTEXT_COMPRESSION_ENABLED`| Enable smart context summarization. | `true` |

### 💾 Storage Paths

Customize where data is stored.

| Variable | Description | Default |
|----------|-------------|---------|
| `DATA_DIR` | Main data directory. | `~/.antigravity` |
| `DB_PATH` | Path to SQLite database. | `~/.antigravity/data.db` |
| `LOG_DIR` | Path to log files. | `~/.antigravity/logs` |

### 🎨 UI & Logging

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging detail (`debug`, `info`, `warn`, `error`). | `info` |
| `COLOR_SCHEME` | CLI color theme (`auto`, `dark`, `light`). | `auto` |
| `SYNTAX_HIGHLIGHTING` | Enable code syntax highlighting. | `true` |

## 🛠️ CLI Configuration Command

You can also view current configuration directly from the CLI using:

```bash
ag /config
```

This will display the currently active settings, loaded from both your `.env` file and any runtime overrides.

### 🐳 Docker Configuration

When running in Docker, environment variables can be passed via `docker-compose.yml` or the command line.

-   **Mounting Keys**: The easiest way to provide API keys is to mount your local `.env` file or pass them as environment variables.
-   **Volumes**: The default configuration mounts the current directory to `/app` for live development.
