# 🔥 Advanced Features (v2.1.0)

Antigravity-Code v2.1.0 introduces powerful agentic capabilities that set it apart from standard coding assistants.

## 1. 🛡️ Autonomous Self-Healing

The **CoderAgent** is no longer just a code generator; it is a resilient problem solver.

### How it Works
1.  **Execution**: You run a command (e.g., `/create "snake game"`).
2.  **Detection**: If the code fails to run (syntax error, missing module, runtime crash), the agent intercepts the error.
3.  **Analysis**: The agent analyzes the `stderr` output to understand *why* it failed.
4.  **Auto-Fix**: It autonomously edits the file or installs the missing package to fix the issue.
5.  **Retry**: It retries the operation (up to 2 times).

> **Result**: You get working code, not just "generated" code.

---

## 2. 📦 Safe Execution (Sandboxing)

We prioritize the security of your local machine.

### Execution Providers
Antigravity uses an `ExecutionProvider` abstraction to isolate running commands.

-   **Local Provider (Default)**: Runs commands on your host machine but enforces a strict **Blocklist**.
    -   *Blocked*: `rm -rf /`, `format c:`, `:(){ :|:& };:`, etc.
    -   *Interactive*: For high-risk but allowed actions, it asks for your permission.
-   **Docker Provider**: (Experimental) Runs all commands inside a disposable Docker container.
    -   Host filesystem is mounted as a volume.
    -   Isolates dependencies and runtime side-effects.

---

## 3. 🔌 IDE Integration (MCP Server)

Antigravity-Code is designed to play nice with your favorite tools.

### Model Context Protocol (MCP)
We implement the [Model Context Protocol](https://modelcontextprotocol.io/), allowing Antigravity to serve as a "Tool Backend" for AI-powered editors like **Cursor**, **Windsurf**, or **Claude Desktop**.

**Capabilities Exposed:**
-   `coder`: Trigger the Coder Agent from your IDE.
-   `retriever`: Search your codebase using Antigravity's RAG index.

### JSON Output
Use the `--json` flag to get machine-readable logs.
```bash
ag --json "Fix bug"
# Output: {"type": "progress", "status": "started", ...}
```

---

## 4. 🎨 UX Polish & Safety

We believe powerful tools should also be beautiful and safe.

### Colorized Diffs
Before applying any AI-generated change to your files, Antigravity shows you a Git-style diff.
-   **Green**: Lines being added.
-   **Red**: Lines being removed.

### Interactive Confirmation
You are always in control. Critical actions require your explicit approval:
-   *Write to file? (Y/n)*
-   *Execute command? (Y/n)*

---

## 5. 🧬 Fractal Agent Scaffolding

Start new projects with a powerful, standardized structure designed for AI collaboration.

### The `/init` Command
Instantly generate a `Fractal Agent` project structure:
```bash
ag /init "my-new-agent"
```

**What you get:**
-   **`.agent/`**: Brain of your project.
-   **`skills/`**: Reusable capabilities for the agent.
-   **`workflows/`**: Defined processes (like "deploy" or "test").
-   **`GEMINI.md`**: Pre-configured identity and rules for the Assistant.

---

## 6. 🐚 Deep Shell Integration

Antigravity isn't just a CLI tool; it becomes part of your shell.

### Seamless Workflow
-   **`ag` Alias**: Run commands quickly (e.g., `ag "fix this"`).
-   **Context Awareness**: It automatically detects your project type (Node, Python, Rust) and adjusts its behavior.
-   **Smart PATH**: Accessibility from any directory.

Run `npm run integrate` to set this up automatically.

---

## 7. 🛠️ Enhanced Developer Experience

We've baked in best practices so you don't have to configure them every time.

-   **CI/CD Ready**: GitHub Actions for automated testing and linting.
-   **Git Hooks**: Husky ensures code quality before every commit.
-   **Docker Support**: Ready-to-use `Dockerfile` and `docker-compose.yml` for isolated environments.

---

## 8. ❤️ Human-Centric Error Handling

We know API errors can be frustrating. Antigravity translates cryptic technical failures into clear, actionable advice.

-   **Rate Limits**: "You're going too fast. We'll wait a moment and retry."
-   **Auth Errors**: "It looks like your API key is invalid. Let's fix that."
-   **Network Issues**: "Connection dropped. Retrying..."

