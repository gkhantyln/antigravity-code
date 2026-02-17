# Contributing to Antigravity-Code

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to **Antigravity-Code**. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## 🛠️ Development Setup

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/yourusername/antigravity-code.git
    cd antigravity-code
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Set up environment**:
    ```bash
    cp .env.example .env
    # Edit .env with your API keys for testing
    ```

## 🧪 Testing and Quality

We use `mocha` for testing and `eslint` for linting.

-   **Run all tests**:
    ```bash
    npm test
    ```
-   **Run unit tests only**:
    ```bash
    npm run test:unit
    ```
-   **Run integration tests**:
    ```bash
    npm run test:integration
    ```
-   **Lint your code**:
    ```bash
    npm run lint
    ```
-   **Format code** (Prettier):
    ```bash
    npm run format
    ```

> [!IMPORTANT]
> Please ensure all tests pass and there are no linting errors before submitting a PR.

## 🌿 Branching Strategy

We follow a simple feature-branch workflow:

1.  **Create a new branch** for your feature or fix:
    ```bash
    git checkout -b feature/amazing-feature
    # or
    git checkout -b fix/critical-bug
    ```
2.  **Make your changes**.
3.  **Commit your changes** using conventional commits (optional but recommended):
    ```bash
    git commit -m "feat: add amazing feature"
    ```
4.  **Push to your fork**:
    ```bash
    git push origin feature/amazing-feature
    ```
5.  **Submit a Pull Request**.

## 🏗️ Project Structure

-   `src/core/`: Core logic (Agents, Engine, Context)
-   `src/api/`: API Provider integrations (Gemini, Claude, OpenAI)
-   `src/tools/`: Tool definitions
-   `src/cli/`: CLI entry point and UI

## 📝 Reporting Bugs

If you find a bug, please create an issue on GitHub describing:
1.  Steps to reproduce.
2.  Expected behavior.
3.  Actual behavior.
4.  Your environment (OS, Node version).

## 💡 Feature Requests

Have an idea? Open an issue tagged with `enhancement` or `feature request`.

Thanks for contributing! 🚀
