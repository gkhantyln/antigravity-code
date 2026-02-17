# 🚀 Quick Start Guide

Welcome to **Antigravity-Code**! This guide will help you get up and running with your new AI coding assistant in minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

-   **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
-   **npm** (v9.0.0 or higher) - Included with Node.js
-   **Git** - [Download](https://git-scm.com/)
-   **Ollama** (Optional, for local models) - [Download](https://ollama.com/)

You will also need an API key from at least one provider if you are not using local models exclusively:
-   [Google AI Studio](https://makersuite.google.com/app/apikey) (Gemini)
-   [Anthropic Console](https://console.anthropic.com/) (Claude)
-   [OpenAI Platform](https://platform.openai.com/api-keys) (OpenAI)

## 📥 Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/gkhantyln/antigravity-code.git
    cd antigravity-code
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the Setup Wizard**:
    This interactive script will help you configure your API keys and preferences.
    ```bash
    npm run setup
    ```

4.  **Integrate with Shell**:
    This creates the `ag` alias and adds the tool to your PATH, so you can run it from anywhere.
    ```bash
    npm run integrate
    ```

### 🐳 Running with Docker

If you prefer not to install Node.js locally, you can use Docker:

1.  **Build and Start**:
    ```bash
    docker-compose up -d
    ```

2.  **Run Antigravity**:
    ```bash
    docker-compose exec antigravity ag
    ```

## 🎮 Basic Usage

### Interactive Mode
To start the interactive Agentic session, simply run:
```bash
ag
```
Or:
```bash
antigravity-code
```

### Single Command
You can send a single prompt directly from the terminal:
```bash
ag "Explain the difference between let and const in JS"
```

### Pipe Input
Pipe content from other commands into Antigravity:
```bash
cat package.json | ag "Analyze the dependencies"
```
```bash
git diff | ag "Generate a commit message for these changes"
```

## ⚡ Key Commands

During an interactive session, you can use these slash commands:

-   `/agent "task"` - Start an autonomous agent to plan and execute a complex task.
-   `/ui image.png` - Generate code from a UI screenshot.
-   `/provider [name]` - Switch AI provider (gemini, claude, openai, ollama).
-   `/model [name]` - Switch model for the current provider.
-   `/commit` - Generate a commit message for staged changes.
-   `/help` - View all available commands.

## Next Steps

-   Configure advanced settings in [Configuration](configuration.md).
-   Learn about [Workflows](workflows.md).
-   Understand the [Architecture](architecture.md).
