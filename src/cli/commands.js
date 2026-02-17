const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const ui = require('./ui');
const { logger } = require('../utils/logger');
const { CodeIndexer } = require('../core/rag/indexer');
const { GitTool } = require('../core/tools/git');

/**
 * Command Handlers
 */
class CommandHandler {
    constructor(engine) {
        this.engine = engine;
    }

    /**
     * Handle /create command
     */
    async handleCreate(args) {
        let prompt = args && args.length > 0 ? args.join(' ') : '';

        if (!prompt) {
            const answer = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'prompt',
                    message: 'What would you like to create?',
                    validate: input => input.trim() !== '' || 'Please provide a description.',
                },
            ]);
            prompt = answer.prompt;
        }

        ui.startSpinner('Generating...', 'cyan');
        try {
            const aiPrompt = `Please create the following: ${prompt}\n\nCRITICAL: You MUST use the 'write_file' function to save the code to a file. Do not just print the code. Call 'write_file' with the 'path' and 'content'.`;
            const response = await this.engine.processRequest(aiPrompt);
            ui.stopSpinnerSuccess('Generation Complete');

            console.log(ui.formatAIHeader(response.provider, response.model));
            ui.renderMarkdown(response.content);
        } catch (error) {
            ui.stopSpinnerFail('Generation Failed');
            ui.error(error.message);
        }
    }

    /**
     * Handle /debug command
     */
    async handleDebug(args) {
        let issue = args && args.length > 0 ? args.join(' ') : '';

        if (!issue) {
            const answer = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'issue',
                    message: 'Describe the issue or paste the error message:',
                    validate: input => input.trim() !== '' || 'Please provide an issue description.',
                },
            ]);
            issue = answer.issue;
        }

        ui.startSpinner('Analyzing...', 'cyan');
        try {

            const aiPrompt = `Please debug this issue:\n${issue}\n\nAnalyze the problem and provide a solution. If you need to read a file to understand the context, use the 'read_file' tool.`;
            const response = await this.engine.processRequest(aiPrompt);
            ui.stopSpinnerSuccess('Analysis Complete');

            console.log(ui.formatAIHeader(response.provider, response.model));
            ui.renderMarkdown(response.content);
        } catch (error) {
            ui.stopSpinnerFail('Debugging Failed');
            ui.error(error.message);
        }
    }

    /**
     * Handle /test command
     */
    async handleTest(args) {
        let code = args && args.length > 0 ? args.join(' ') : '';

        if (!code) {
            const answer = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'code',
                    message: 'Enter the filename to test:',
                    validate: input => input.trim() !== '' || 'Please provide a filename.',
                },
            ]);
            code = answer.code;
        }

        ui.startSpinner('Generating tests...', 'cyan');
        try {
            const aiPrompt = `Please generate unit tests for the file: ${code}\n\n1. Use 'read_file' to read the content of '${code}'.\n2. Generate comprehensive tests.\n3. Use 'write_file' to save the tests to a new file (e.g., test_${code} or similar).`;
            const response = await this.engine.processRequest(aiPrompt);
            ui.stopSpinnerSuccess('Tests Generated');

            console.log(ui.formatAIHeader(response.provider, response.model));
            ui.renderMarkdown(response.content);
        } catch (error) {
            ui.stopSpinnerFail('Test Generation Failed');
            ui.error(error.message);
        }
    }

    /**
     * Handle /config command
     */
    async handleConfig(args) {
        if (!args || args.length === 0) {
            ui.info('Configuration commands:');
            ui.info('  /config show - Show current configuration');
            ui.info('  /config provider - Show provider information');
            return;
        }

        const subcommand = args[0];

        switch (subcommand) {
            case 'show':
                await this.showConfig();
                break;
            case 'provider':
                await this.showProviders();
                break;
            default:
                ui.warn(`Unknown config command: ${subcommand}`);
        }
    }

    /**
     * Show current configuration
     */
    async showConfig() {
        const provider = this.engine.getCurrentProvider();
        const summary = await this.engine.getConversationSummary();

        console.log();
        ui.info(`Current Provider: ${provider.name}`);
        ui.info(`Current Model: ${provider.model}`);

        if (summary) {
            ui.info(`Conversation: ${summary.title}`);
            ui.info(`Messages: ${summary.messageCount}`);
        }

        console.log();
    }

    /**
     * Show available providers
     */
    async showProviders() {
        const providers = this.engine.getAvailableProviders();
        const current = this.engine.getCurrentProvider();

        ui.providerInfo(providers, current);
    }

    /**
     * Handle /provider command
     */
    async handleProvider(args) {
        if (!args || args.length === 0) {
            await this.showProviders();
            ui.info('Usage: /provider <name>');
            ui.info('Example: /provider claude');
            return;
        }

        const providerName = args[0];

        try {
            this.engine.switchProvider(providerName);
            ui.success(`Switched to provider: ${providerName}`);
        } catch (error) {
            ui.error(`Failed to switch provider: ${error.message}`);
        }
    }

    /**
     * Handle /model command (Gemini model selection)
     */
    async handleModel(args) {
        const models = this.engine.getGeminiModels();

        if (models.length === 0) {
            ui.warn('Gemini provider not available');
            return;
        }

        const current = this.engine.getCurrentProvider();
        const currentModel = current.name === 'gemini' ? current.model : null;

        if (!args || args.length === 0) {
            ui.modelSelection(models, currentModel);
            ui.info('Usage: /model <model-name>');
            ui.info('Example: /model gemini-1.5-pro');
            return;
        }

        const modelName = args[0];

        try {
            this.engine.changeGeminiModel(modelName);
            ui.success(`Changed Gemini model to: ${modelName}`);
        } catch (error) {
            ui.error(`Failed to change model: ${error.message}`);
        }
    }

    /**
     * Handle /new command
     */
    async handleNew(args) {
        const title = args && args.length > 0 ? args.join(' ') : 'New Conversation';

        try {
            const conversationId = await this.engine.newConversation(title);
            ui.success(`New conversation started: ${title}`);
            logger.debug('New conversation', { id: conversationId });
        } catch (error) {
            ui.error(`Failed to create conversation: ${error.message}`);
        }
    }

    /**
     * Handle /index command
     */
    async handleIndex() {
        ui.startSpinner('Indexing codebase...', 'cyan');
        try {
            const indexer = new CodeIndexer();
            const count = await indexer.indexFiles();
            ui.stopSpinnerSuccess(`Indexing Complete. Processed ${count} chunks.`);
        } catch (error) {
            ui.stopSpinnerFail('Indexing Failed');
            ui.error(error.message);
        }
    }

    /**
     * Handle /checkpoints command
     */
    async handleCheckpoints() {
        try {
            const { checkpointManager } = this.engine.fileSystemTools;

            if (!checkpointManager) {
                ui.warn('Checkpoint system not available');
                return;
            }

            const checkpoints = await checkpointManager.listCheckpoints();

            if (checkpoints.length === 0) {
                ui.info('No checkpoints found');
                return;
            }

            console.log(ui.theme.primary.bold('\nRecent Checkpoints:'));
            console.log(ui.theme.dim('─'.repeat(60)));

            checkpoints.forEach((cp, index) => {
                console.log(`${ui.theme.accent(`${index + 1}.`)} ${ui.theme.secondary(cp.id)}`);
                console.log(`   ${ui.theme.dim('File:')} ${cp.filePath}`);
                console.log(`   ${ui.theme.dim('Age:')} ${cp.age}`);
                console.log('');
            });

            ui.info('Use /rewind <checkpoint_id> to restore a file');
        } catch (error) {
            ui.error(`Failed to list checkpoints: ${error.message}`);
        }
    }

    /**
     * Handle /rewind command
     */
    async handleRewind(args) {
        try {
            const { checkpointManager } = this.engine.fileSystemTools;

            if (!checkpointManager) {
                ui.warn('Checkpoint system not available');
                return;
            }

            if (!args || args.length === 0) {
                // Show checkpoints if no ID provided
                await this.handleCheckpoints();
                return;
            }

            const checkpointId = args[0];

            ui.startSpinner('Reverting to checkpoint...', 'cyan');
            const result = await checkpointManager.revertToCheckpoint(checkpointId);
            ui.stopSpinnerSuccess('File Reverted');

            ui.success(`Restored: ${result.filePath}`);
        } catch (error) {
            ui.stopSpinnerFail('Revert Failed');
            ui.error(`Failed to revert: ${error.message}`);
        }
    }

    /**
     * Handle /permission command
     */
    async handlePermission(args) {
        try {
            const { permissionManager } = this.engine;

            if (!permissionManager) {
                ui.warn('Permission system not available');
                return;
            }

            if (!args || args.length === 0) {
                // Show current mode
                const display = permissionManager.getModeDisplay();

                console.log(ui.theme.primary.bold('\nPermission Modes:'));
                console.log(ui.theme.dim('─'.repeat(60)));
                console.log(`${ui.theme.accent('•')} default - Ask before every action`);
                console.log(`${ui.theme.accent('•')} auto-edit - Auto-approve file edits`);
                console.log(`${ui.theme.accent('•')} plan-only - Read-only, no execution`);
                console.log('');
                console.log(`${ui.theme.secondary('Current mode:')} ${display}`);
                console.log('');
                ui.info('Use /permission <mode> to change or Shift+Tab to cycle');
                return;
            }

            const newMode = args[0];
            await permissionManager.setMode(newMode);
            const display = permissionManager.getModeDisplay();
            ui.success(`Permission mode changed to: ${display}`);
        } catch (error) {
            ui.error(`Failed to change permission mode: ${error.message}`);
        }
    }

    /**
     * Handle /fork command
     */
    async handleFork(args) {
        try {
            const title = args && args.length > 0 ? args.join(' ') : null;

            ui.startSpinner('Forking conversation...', 'cyan');
            const result = await this.engine.contextManager.forkConversation(title);
            ui.stopSpinnerSuccess('Conversation Forked');

            console.log(ui.theme.primary.bold('\nConversation Forked:'));
            console.log(ui.theme.dim('─'.repeat(60)));
            console.log(`${ui.theme.accent('Original:')} ${result.originalId}`);
            console.log(`${ui.theme.accent('New Fork:')} ${result.newId}`);
            console.log(`${ui.theme.accent('Title:')} ${result.title}`);
            console.log(`${ui.theme.accent('Messages:')} ${result.messageCount}`);
            console.log('');
            ui.success('Now working in forked conversation');
        } catch (error) {
            ui.stopSpinnerFail('Fork Failed');
            ui.error(`Failed to fork conversation: ${error.message}`);
        }
    }

    /**
     * Handle /compact command
     */
    async handleCompact() {
        try {
            ui.startSpinner('Compacting context...', 'cyan');
            const context = await this.engine.contextManager.getContext();
            const compacted = await this.engine.contextManager.compactContext(context);
            ui.stopSpinnerSuccess('Context Compacted');

            console.log(ui.theme.primary.bold('\nContext Compaction:'));
            console.log(ui.theme.dim('─'.repeat(60)));
            console.log(`${ui.theme.accent('Original messages:')} ${context.messages.length}`);
            console.log(`${ui.theme.accent('Compacted messages:')} ${compacted.messages.length}`);
            console.log(`${ui.theme.accent('Removed:')} ${context.messages.length - compacted.messages.length}`);
            console.log('');
            ui.success('Context optimized for better performance');
        } catch (error) {
            ui.stopSpinnerFail('Compaction Failed');
            ui.error(`Failed to compact context: ${error.message}`);
        }
    }

    /**
     * Handle /context command
     */
    async handleContext() {
        try {
            const context = await this.engine.contextManager.getContext();
            const size = this.engine.contextManager.getContextSize(context);
            const sizeMB = (JSON.stringify(context).length / (1024 * 1024)).toFixed(2);

            console.log(ui.theme.primary.bold('\nContext Usage:'));
            console.log(ui.theme.dim('─'.repeat(60)));
            console.log(`${ui.theme.accent('Messages:')} ${context.messages.length}`);
            console.log(`${ui.theme.accent('Approx. tokens:')} ${size.toLocaleString()}`);
            console.log(`${ui.theme.accent('Size:')} ${sizeMB} MB`);
            console.log(`${ui.theme.accent('Compacted:')} ${context.compacted ? 'Yes' : 'No'}`);
            console.log('');

            if (size > 100000) {
                ui.warn('Context is large. Consider using /compact to optimize.');
            } else {
                ui.info('Context size is healthy');
            }
        } catch (error) {
            ui.error(`Failed to get context info: ${error.message}`);
        }
    }

    /**
     * Handle /agent command
     */
    async handleAgent(_args) {
        // ... (existing implementation)
    }

    /**
     * Handle /commit command (Smart Commit)
     */
    async handleCommit(args) {
        const git = new GitTool();
        const message = args && args.length > 0 ? args.join(' ') : '';

        // If message provided, just commit
        if (message) {
            try {
                await git.commit(message);
                ui.success(`Committed: ${message}`);
            } catch (error) {
                ui.error(`Commit failed: ${error.message}`);
            }
            return;
        }

        // Smart Commit Flow
        ui.startSpinner('Analyzing changes...', 'cyan');
        try {
            // 1. Check status
            const status = await git.status();
            if (!status) {
                ui.stopSpinnerFail('No changes to commit.');
                return;
            }

            // 2. Stage all changes (for simplicity in this flow, or asking user first is better)
            // Let's assume user wants to commit everything they see in 'git status'
            await git.add('.');

            // 3. Get Diff
            const diff = await git.diff(true); // Get staged diff
            if (!diff) {
                ui.stopSpinnerFail('No changes detected in diff.');
                return;
            }

            // 4. Generate Message
            const prompt = `
Generate a concise, conventional commit message for these changes.
Format: <type>(<scope>): <subject>

Diff:
${diff}

Return ONLY the commit message.
`;
            const response = await this.engine.processRequest(prompt);
            const suggestedMessage = response.content.trim().replace(/^['"]|['"]$/g, ''); // Clean quotes

            ui.stopSpinnerSuccess('Analysis Complete');

            // 5. Confirm
            const answer = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Suggested Message: "${suggestedMessage}"\nCommit now?`,
                    default: true
                }
            ]);

            if (answer.confirm) {
                await git.commit(suggestedMessage);
                ui.success(`Committed: ${suggestedMessage}`);
            } else {
                ui.info('Commit cancelled.');
            }

        } catch (error) {
            ui.stopSpinnerFail('Smart Commit Failed');
            ui.error(error.message);
        }
    }

    /**
     * Handle /see command (Vision)
     */
    async handleSee(args) {
        if (!args || args.length === 0) {
            ui.warn('Usage: /see <path/to/image> [prompt]');
            return;
        }

        const imagePath = args[0];
        // Combine remaining args as prompt, or default
        const prompt = args.length > 1 ? args.slice(1).join(' ') : 'Describe this image and analyze its contents.';

        if (!fs.existsSync(imagePath)) {
            ui.error(`File not found: ${imagePath}`);
            return;
        }

        ui.startSpinner('Analyzing Image...', 'cyan');
        try {
            // Read image and convert to base64
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');
            const mimeType = path.extname(imagePath) === '.png' ? 'image/png' : 'image/jpeg';

            const response = await this.engine.processRequest(prompt, {
                images: [{
                    data: base64Image,
                    mimeType
                }]
            });

            ui.stopSpinnerSuccess('Analysis Complete');
            console.log(ui.formatAIHeader(response.provider, response.model));
            ui.renderMarkdown(response.content);

        } catch (error) {
            ui.stopSpinnerFail('Vision Analysis Failed');
            ui.error(error.message);
        }
    }

    /**
     * Handle /ui command (Screenshot to Code)
     */
    async handleUI(args) {
        if (!args || args.length === 0) {
            ui.warn('Usage: /ui <path/to/screenshot>');
            return;
        }

        const imagePath = args[0];
        if (!fs.existsSync(imagePath)) {
            ui.error(`File not found: ${imagePath}`);
            return;
        }

        ui.startSpinner('Converting Screenshot to Code...', 'cyan');
        try {
            // Read image and convert to base64
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');
            const mimeType = path.extname(imagePath) === '.png' ? 'image/png' : 'image/jpeg';

            const systemPrompt = `
You are an expert Front-End Developer.
Your task is to convert this screenshot into clean, responsive HTML and CSS code.
1. Analyze the UI components, layout, colors, and typography.
2. Generate the HTML structure.
3. Generate the CSS styles (you can use Tailwind CSS classes or raw CSS).
4. Output the full code in a single file or clear blocks.
5. Do not include verbose explanations, just the code.
`;

            const response = await this.engine.processRequest(systemPrompt, {
                images: [{
                    data: base64Image,
                    mimeType
                }]
            });

            ui.stopSpinnerSuccess('Code Generation Complete');
            console.log(ui.formatAIHeader(response.provider, response.model));
            ui.renderMarkdown(response.content);

        } catch (error) {
            ui.stopSpinnerFail('UI Generation Failed');
            ui.error(error.message);
        }
    }

    /**
     * Handle /session command (Session Management)
     */
    async handleSession(args) {
        const subcommand = args && args.length > 0 ? args[0].toLowerCase() : 'info';

        try {
            switch (subcommand) {
                case 'list':
                    ui.startSpinner('Fetching recent sessions...');
                    const conversations = await this.engine.getRecentConversations(10);
                    ui.stopSpinnerSuccess('Recent Sessions:');

                    if (conversations.length === 0) {
                        ui.info('No recent sessions found.');
                    } else {
                        // Simple list for now
                        conversations.forEach(c => {
                            const date = new Date(c.updated_at).toLocaleString();
                            console.log(ui.theme.dim(`[${c.id}]`) + ` ${ui.theme.primary.bold(c.title || 'Untitled')} (${date})`);
                        });
                    }
                    break;

                case 'load':
                    if (args.length < 2) {
                        ui.error('Usage: /session load <session_id>');
                        return;
                    }
                    const loadId = args[1];
                    ui.startSpinner('Loading session...');
                    await this.engine.loadConversation(loadId);
                    ui.stopSpinnerSuccess(`Session loaded: ${loadId}`);
                    break;

                case 'save':
                case 'rename':
                    if (args.length < 2) {
                        ui.error('Usage: /session save <new_title>');
                        return;
                    }
                    let newTitle = args.slice(1).join(' ');
                    // Strip quotes if present
                    if ((newTitle.startsWith('"') && newTitle.endsWith('"')) ||
                        (newTitle.startsWith("'") && newTitle.endsWith("'"))) {
                        newTitle = newTitle.slice(1, -1);
                    }

                    const current = await this.engine.getConversationSummary();
                    if (!current) {
                        ui.error('No active session to save.');
                        return;
                    }
                    await this.engine.updateConversation(current.id, { title: newTitle });
                    ui.success(`Session saved as: "${newTitle}"`);
                    break;

                case 'new':
                    await this.engine.newConversation();
                    ui.success('New session started.');
                    break;

                case 'info':
                default:
                    const summary = await this.engine.getConversationSummary();
                    if (summary) {
                        ui.drawBox('Session Info', [
                            `ID:      ${summary.id}`,
                            `Title:   ${summary.title || 'Untitled'}`,
                            `Msgs:    ${summary.messageCount}`,
                            `Updated: ${new Date(summary.updatedAt).toLocaleString()}`
                        ]);
                    } else {
                        ui.info('No active session.');
                    }
                    break;
            }
        } catch (error) {
            ui.stopSpinnerFail('Session operation failed');
            ui.error(error.message);
        }
    }

    /**
     * Handle /audit command (Code Analysis)
     */
    async handleAudit(args) {
        let target = args && args.length > 0 ? args[0] : '.';

        // Resolve target path
        const fullPath = path.resolve(process.cwd(), target);

        if (!fs.existsSync(fullPath)) {
            ui.error(`File or directory not found: ${target}`);
            return;
        }

        ui.startSpinner('Auditing Code...', 'cyan');

        try {
            let codeContent = '';
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                // For directories, maybe list files or read critical ones?
                // For simplicity in this version, let's just warn or pick index/main files
                // or read all known text files up to a limit.
                // Let's keep it simple: "Audit this file" for now, or "Audit this directory" (file listing + summary)
                ui.stopSpinnerFail('Directory audit not fully supported in this version. Please specify a file.');
                return;
            } else {
                codeContent = fs.readFileSync(fullPath, 'utf-8');
            }

            if (!codeContent) {
                ui.stopSpinnerFail('File is empty.');
                return;
            }

            const prompt = `
You are an expert Security and Code Quality Auditor.
Please audit the following code file: ${target}

Analyze it for:
1. **Security Vulnerabilities** (Critical, High, Medium, Low)
2. **Code Quality Issues** (Complexity, Maintainability, Performance)
3. **Best Practice Violations** (Standards, Conventions)

Format your response in Markdown with:
- A summary table of issues found.
- Detailed explanation for each issue.
- **Specific code fixes** or refactoring suggestions for critical/high issues.

Code Content:
\`\`\`
${codeContent.substring(0, 8000)} 
\`\`\`
(Note: Code may be truncated for context limits)
`;

            const response = await this.engine.processRequest(prompt);

            ui.stopSpinnerSuccess('Audit Complete');
            console.log(ui.formatAIHeader(response.provider, response.model));
            ui.renderMarkdown(response.content);

        } catch (error) {
            ui.stopSpinnerFail('Audit Failed');
            ui.error(error.message);
        }
    }

    /**
     * Handle /init command (Project Scaffolding)
     */
    async handleInit(args) {
        const targetDir = args && args.length > 0 ? args[0] : '.';
        const projectDescription = args && args.length > 1 ? args.slice(1).join(' ') : 'This project is initialized with the Fractal Agent architecture.';
        const fullPath = path.resolve(process.cwd(), targetDir);

        ui.startSpinner('Initializing Fractal Agent Scaffolding...', 'cyan');

        try {
            // 1. Create Directories
            const dirs = [
                '.agent',
                '.agent/.shared',
                '.agent/rules',
                '.agent/skills',
                '.agent/workflows'
            ];

            dirs.forEach(dir => {
                const dirPath = path.join(fullPath, dir);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
            });

            // 2. Create GEMINI.md
            const geminiContent = `# 🧠 GEMINI AGENT IDENTITY

## 🆔 Core Identity
- **Name**: Antigravity Assistant
- **Role**: Senior Full-Stack Developer & Architect
- **Mission**: To build scalable, maintainable, and high-quality software.

## ⚙️ Configuration
- **Language**: English (Primary), Turkish (Secondary)
- **Style**: Concise, Professional, Educational

## 📂 Context
${projectDescription}
`;
            fs.writeFileSync(path.join(fullPath, 'GEMINI.md'), geminiContent);

            // 3. Generate Content with AI
            ui.stopSpinnerSuccess('Directories Created');
            ui.startSpinner('Generating .agent content with AI...', 'cyan');

            let generatedFiles = {};
            const placeholders = {
                '.agent/.shared/README.md': '# ⛩ Core Library\nShared API, DB, and Security standards.',
                '.agent/rules/README.md': '# ⚖️ Governance\nProject rules, compliance, and context.',
                '.agent/skills/README.md': '# 🛠 Mastery\nSpecialized AI skills and tools.',
                '.agent/workflows/README.md': '# 🚀 Ops\nOperational workflows (CI/CD, scripts).'
            };

            try {
                const aiPrompt = `
You are an expert software architect.
I am initializing a new project with the following description: "${projectDescription}"

Please generate specific, high-quality content for the following files in the .agent directory.
The content should be in Markdown format.

1. .agent/.shared/README.md (Core Library & Standards)
2. .agent/rules/README.md (Project Rules & Governance)
3. .agent/skills/README.md (Required Skills & Tools)
4. .agent/workflows/README.md (Operational Workflows)

Return the response as a valid JSON object where keys are the file paths and values are the file contents.
Do not use markdown code blocks for the JSON. Just return the raw JSON.
Example format:
{
  ".agent/.shared/README.md": "# Content...",
  ".agent/rules/README.md": "# Content...",
  ".agent/skills/README.md": "# Content...",
  ".agent/workflows/README.md": "# Content..."
}
`;

                const response = await this.engine.processRequest(aiPrompt);

                // Attempt to parse JSON from response
                const jsonStr = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
                generatedFiles = JSON.parse(jsonStr);

                // Validate keys
                const requiredKeys = Object.keys(placeholders);
                const hasAllKeys = requiredKeys.every(k => Object.keys(generatedFiles).includes(k));

                if (!hasAllKeys) {
                    throw new Error('Incomplete AI response');
                }

            } catch (e) {
                // Fallback if AI fails or JSON parsing fails
                ui.warn(`AI Generation failed: ${e.message}. Using default placeholders.`);
                generatedFiles = placeholders;
            }

            // Write files
            Object.entries(generatedFiles).forEach(([file, content]) => {
                const filePath = path.join(fullPath, file);
                fs.writeFileSync(filePath, content);
            });

            ui.stopSpinnerSuccess('Project Initialized Successfully');
            ui.info(`Fractal Agent structure created in: ${targetDir}`);
            if (projectDescription !== 'This project is initialized with the Fractal Agent architecture.') {
                ui.info(`Context set: ${projectDescription}`);
            }

            // Auto-navigate to the new directory
            try {
                process.chdir(fullPath);
                ui.success(`Switched working directory to: ${targetDir}`);
            } catch (err) {
                ui.warn(`Could not switch directory: ${err.message}`);
            }

        } catch (error) {
            ui.stopSpinnerFail('Initialization Failed');
            ui.error(error.message);
        }
    }

    /**
     * Handle /clear command
     */
    handleClear() {
        ui.clear();
        const provider = this.engine.getCurrentProvider();
        ui.welcome('1.0.0', provider.name, provider.model);
    }

    /**
     * Handle /help command
     */
    handleHelp(args) {
        const commandName = args && args.length > 0 ? args[0] : null;
        ui.help(commandName);
    }

    /**
     * Check if input is a command
     */
    isCommand(input) {
        return input.trim().startsWith('/');
    }

    /**
     * Parse command
     */
    parseCommand(input) {
        const trimmed = input.trim();
        const parts = trimmed.split(/\s+/);
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        return { command, args };
    }

    /**
     * Execute command
     */
    async executeCommand(input) {
        const { command, args } = this.parseCommand(input);

        switch (command) {
            case '/agent':
                await this.handleAgent(args);
                break;
            case '/commit':
                await this.handleCommit(args);
                break;
            case '/see':
                await this.handleSee(args);
                break;
            case '/ui':
                await this.handleUI(args);
                break;
            case '/init':
                await this.handleInit(args);
                break;
            case '/create':
                await this.handleCreate(args);
                break;
            case '/audit':
                await this.handleAudit(args);
                break;
            case '/session':
                await this.handleSession(args);
                break;
            case '/debug':
                await this.handleDebug(args);
                break;
            case '/test':
                await this.handleTest(args);
                break;
            case '/config':
                await this.handleConfig(args);
                break;
            case '/provider':
                await this.handleProvider(args);
                break;
            case '/model':
                await this.handleModel(args);
                break;
            case '/new':
                await this.handleNew(args);
                break;
            case '/index':
                await this.handleIndex();
                break;
            case '/checkpoints':
                await this.handleCheckpoints();
                break;
            case '/rewind':
                await this.handleRewind(args);
                break;
            case '/permission':
                await this.handlePermission(args);
                break;
            case '/fork':
                await this.handleFork(args);
                break;
            case '/compact':
                await this.handleCompact();
                break;
            case '/context':
                await this.handleContext();
                break;
            case '/clear':
                this.handleClear();
                break;
            case '/help':
                this.handleHelp(args);
                break;
            case '/exit':
            case '/quit':
                return 'exit';
            default:
                ui.warn(`Unknown command: ${command}`);
                ui.info('Type /help for available commands');
        }

        return 'continue';
    }
}

module.exports = { CommandHandler };
