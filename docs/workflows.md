# 🔄 Workflows Guide

Workflows in Antigravity-Code are structured sequences of actions that the agent can execute to perform complex tasks reliably. They are defined as Markdown files in the `.agent/workflows` directory.

## What are Workflows?

A workflow is essentially a specific "recipe" for the AI to follow. Instead of relying on general problem-solving, a workflow provides step-by-step instructions for common tasks, ensuring consistency and best practices.

## 🚀 Built-in Workflows

Antigravity comes with several pre-defined workflows:

### 1. Create Feature (`/create`)
**File:** `.agent/workflows/create.md`
Used for scaffolding new features or files. It prompts the user for requirements and then systematically creates the necessary file structure and code.

**Usage:**
```bash
ag /create "A new authentication middleware"
```

### 2. Project Scaffolding (`/init`)
**File:** `.agent/workflows/init.md` (Internal)
Starts a new project with the Fractal Agent structure, setting up directories, config files, and the agent's identity.

**Usage:**
```bash
ag /init "my-new-project"
```

### 3. Debugging (`/debug`)
**File:** `.agent/workflows/debug.md`
A systematic debugging process that analyzes errors, checks logs, and proposes fixes.

**Usage:**
```bash
ag /debug "Fix the crash in the login route"
```

### 4. CI/CD & Automation
Antigravity includes GitHub Actions workflows for:
-   **Testing**: Runs `npm test` on every push.
-   **Linting**: checks code style.
-   **Release**: Automates versioning and publishing.

These are defined in `.github/workflows/`.

## 🛠️ Creating Custom Workflows

You can extend Antigravity by adding your own workflows.

1.  **Create a new Markdown file** in `.agent/workflows/`:
    ```bash
    touch .agent/workflows/deployment.md
    ```

2.  **Define the Workflow Steps**:
    Use standard Markdown to describe the process. The agent will read this context when the workflow is triggered.

    **(Example: deployment.md)**
    ```markdown
    ---
    description: Deploy application to staging
    ---
    # Deployment Workflow

    1. Run tests: `npm test`
    2. Build project: `npm run build`
    3. Check git status is clean.
    4. Push to staging branch: `git push origin staging`
    ```

3.  **Triggering the Workflow**:
    Once created, you can reference it by name (filename without extension) or via the `/agent` command with the workflow intent.

    ```bash
    ag /agent "deploy the app"
    # Agent will detect the 'deployment' workflow and follow it.
    ```

## ⚡ Turbo Mode

In your workflow files, you can use special annotations to speed up execution:

-   `// turbo`: Auto-runs the specific command step without asking for user confirmation.
-   `// turbo-all`: Auto-runs ALL command steps in the workflow.

**Example:**
```markdown
1. Setup directory
// turbo
2. mkdir -p src/utils

3. Create file
// turbo
4. touch src/utils/helpers.js
```

## Best Practices

-   **Be Specific**: Clear instructions lead to better results.
-   **Step-by-Step**: Break down complex tasks into atomic steps.
-   **Context**: simpler workflows are better. If it's too complex, break it into multiple workflows.
