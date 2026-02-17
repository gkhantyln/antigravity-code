# 🏗️ Architecture Overview

Antigravity-Code is designed as a modular, failover-resistant AI agent system. It decouples the "brain" (LLM) from the "body" (Tool execution), allowing it to switch brains on the fly without losing context.

## High-Level Architecture

```mermaid
graph TD
    User[User / CLI] --> CommandHandler
    CommandHandler --> Engine[Antigravity Engine]
    
    subgraph Core System
        Engine --> ContextManager[Context Manager]
        Engine --> APIOrchestrator[API Orchestrator]
        Engine --> ToolManager[Tool Manager]
        ContextManager <--> Database[(SQLite DB)]
    end
    
    subgraph Brains (Providers)
        APIOrchestrator --> Gemini[Google Gemini]
        APIOrchestrator --> Claude[Anthropic Claude]
        APIOrchestrator --> OpenAI[OpenAI GPT]
        APIOrchestrator --> Ollama[Local Models]
    end
    
    subgraph Body (Tools)
        ToolManager --> FileSystem[File System]
        ToolManager --> Git[Git Integration]
        ToolManager --> Linter[Linter]
        ToolManager --> Vision[Vision Analysis]
    end
```

## Key Components

### 1. Antigravity Engine (`src/core/engine.js`)
The central nervous system. It initializes all subsystems, manages the lifecycle of a request, and coordinates between the Context Manager and API Orchestrator.

### 2. API Orchestrator (`src/api/orchestrator.js`)
Responsible for:
-   Sending requests to the active AI provider.
-   **Failover Logic**: If the primary provider (e.g., Gemini) fails or times out, it automatically retries with the secondary (Claude), then tertiary (OpenAI).
-   **Standardization**: specific responses from different APIs are normalized into a common format for the Engine.

### 3. Context Manager (`src/core/context.js`)
Manages both short-term conversation history and long-term project context.
-   **Conversation History**: Stored in SQLite.
-   **RAG (Retrieval-Augmented Generation)**: Indexes codebase to provide relevant snippets to the LLM.
-   **Compression**: automatically summarizes old messages to stay within token limits.

### 4. Fractal Agents (`src/core/agents/`)
Implements the "Fractal Agent" pattern where specialized agents work together:
-   **Planner**: Breaks down high-level user requests into a task list.
-   **Coder**: Executes individual tasks (writing code, file ops).
-   **Reviewer**: Validates the output (linting, testing) before marking a task complete.

## Data Flow

1.  **Input**: User types a command (`ag "fix bug"`).
2.  **Context Loading**: Engine retrieves conversation history and relevant files via RAG.
3.  **Planning**: If complex, the Planner Agent creates a plan.
4.  **Execution Loop**:
    -   Engine constructs a prompt with context and tool definitions.
    -   API Orchestrator sends it to the Primary Provider.
    -   **Failover (if needed)**: If Primary fails -> Switch to Secondary.
    -   LLM responds with a Tool Call (e.g., `read_file`).
    -   Engine executes the tool.
    -   Result is fed back to the LLM.
5.  **Output**: Final response is rendered in Markdown to the CLI.

## Security Architecture

-   **API Keys**: Never stored in plain text. Used Windows DPAPI for encryption at rest.
-   **Local Execution**: Filesystem operations are performed locally.
-   **Privacy**: When using Ollama, no data leaves the local machine.
