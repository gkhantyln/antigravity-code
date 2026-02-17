# 📚 API & Command Reference

This document serves as a reference for both the CLI commands available to users and the internal API for contributors.

## 💻 CLI Command Reference

### Interactive Commands (Slash Commands)
Used within the `ag` REPL session.

| Command | Arguments | Description |
|---------|-----------|-------------|
| `/agent` | `[prompt]` | Start the autonomous agentic workflow for complex tasks. |
| `/ui` | `[image_path]` | Analyze a UI screenshot and generate HTML/CSS code. |
| `/see` | `[image_path] [prompt]` | Analyze an image with a specific prompt. |
| `/commit` | - | Analyze staged git changes and generate a commit message. |
| `/index` | - | Force re-indexing of the codebase for RAG. |
| `/init` | `[name]` | Scaffolding tool to initialize a new Fractal Agent project. |
| `/create` | `[prompt]` | Quick scaffolding for files/features. |
| `/debug` | `[prompt]` | Debugging workflow triggering. |
| `/test` | `[file]` | Generate unit tests for a specific file. |
| `/provider` | `[name]` | Switch AI provider (gemini, claude, openai, ollama). |
| `/model` | `[name]` | Switch model for the current provider. |
| `/config` | - | Display current configuration. |
| `/new` | - | Clear context and start a new conversation. |
| `/clear` | - | Clear the terminal screen. |
| `/help` | - | Show help menu. |
| `/exit` | - | Exit the application. |

## 🧩 Internal API Reference

### Core Engine (`src/core/engine.js`)

#### `class AntigravityEngine`

-   **`initialize()`**
    -   Initializes database, context manager, and API orchestrator.
    -   Returns: `Promise<void>`

-   **`processRequest(message, options)`**
    -   Main entry point for handling user messages.
    -   `message`: string
    -   `options`: object (e.g., `{ image: 'path/to/img' }`)
    -   Returns: `Promise<ResponseObject>`

-   **`shutdown()`**
    -   Gracefully closes database connections and saves state.

### Context Manager (`src/core/context.js`)

#### `class ContextManager`

-   **`getContext()`**
    -   Retrieves current conversation context, formatted for the LLM.
    -   Returns: `Promise<Array<Message>>`

-   **`addAssistantMessage(content, provider, model)`**
    -   Adds an AI response to history.

-   **`addUserMessage(content)`**
    -   Adds a user message to history.

### API Orchestrator (`src/api/orchestrator.js`)

#### `class APIOrchestrator`

-   **`sendMessage(message, context, options)`**
    -   Sends request to the active provider. Handles failover logic automatically.
    -   Returns: `Promise<Response>`

-   **`switchProvider(providerName)`**
    -   Manually switches the active provider.
    -   `providerName`: 'gemini' | 'claude' | 'openai' | 'ollama'

### Tools System (`src/tools/`)

All tools follow a standard interface:
```javascript
{
    name: "tool_name",
    description: "Description",
    parameters: { ...JSON Schema... },
    execute: async (args) => { ... }
}
```

Registered tools include:
-   `read_file`
-   `write_file`
-   `list_dir`
-   `run_command`
-   `browser_action`
