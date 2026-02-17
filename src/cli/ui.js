const chalk = require('chalk');
const ora = require('ora');
const marked = require('marked');
const { markedTerminal } = require('marked-terminal');
const readline = require('readline');
const path = require('path');
const { FileTree } = require('./file-tree');
const { COMMANDS } = require('./commands-data');

// Theme Configuration
const THEME = {
    primary: chalk.cyan,
    secondary: chalk.blue,
    accent: chalk.magenta,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    dim: chalk.gray,
    box: {
        border: chalk.blue.dim,
        title: chalk.cyan.bold,
    }
};

// Configure marked with terminal renderer
// eslint-disable-next-line new-cap
const terminalRenderer = new markedTerminal({
    code: THEME.warning,
    blockquote: THEME.dim.italic,
    html: THEME.dim,
    heading: THEME.success.bold,
    firstHeading: THEME.accent.underline.bold,
    strong: THEME.primary.bold,
    em: chalk.italic,
    codespan: THEME.warning,
    del: THEME.dim.strikethrough,
    link: THEME.secondary.underline,
    href: THEME.secondary.underline
});

marked.use(terminalRenderer);

/**
 * UI Manager for Antigravity-Code
 * Handles consistent styling, spinners, and markdown rendering
 */
class UIManager {
    constructor() {
        this.spinner = null;
        this.jsonMode = process.argv.includes('--json');
    }

    /**
     * Draw a box with a title and content
     */
    drawBox(title, content, options = {}) {
        if (this.jsonMode) return;

        const width = options.width || 60;
        const padding = options.padding || 1;
        const borderColor = options.borderColor || THEME.box.border;
        const titleColor = options.titleColor || THEME.box.title;

        const hLine = '─'.repeat(width);
        // unused: const emptyLine = ' '.repeat(width);

        // Top border
        console.log(borderColor(`┌${hLine}┐`));

        // Title (if present)
        if (title) {
            const titleText = ` ${title} `;
            const titleLen = titleText.length;
            const leftPad = Math.floor((width - titleLen) / 2);
            const rightPad = width - titleLen - leftPad;

            console.log(borderColor('│') + ' '.repeat(leftPad) + titleColor(titleText) + ' '.repeat(rightPad) + borderColor('│'));
            console.log(borderColor(`├${hLine}┤`));
        }

        // Content
        const contentLines = Array.isArray(content) ? content : content.split('\n');

        contentLines.forEach(line => {
            // Basic wrapping (naive implementation, but functional for simple lists)
            const maxContentWidth = width - (padding * 2);
            let currentLine = line;

            // Handle lines that are too long
            while (currentLine.length > 0) {
                // Note: This naive slice doesn't handle ANSI codes correctly for length calculation
                // For a robust CLI, we'd use 'strip-ansi' and 'wrap-ansi' packages. 
                // Assuming content here is mostly controlled or short.
                // We will truncate for now to avoid breaking box alignment if line is super long.

                let chunk = currentLine.substring(0, maxContentWidth);
                // Check if we split in the middle of a word (simple heuristic)
                if (currentLine.length > maxContentWidth && chunk.lastIndexOf(' ') > 0) {
                    chunk = chunk.substring(0, chunk.lastIndexOf(' '));
                }

                const p = ' '.repeat(padding);
                // eslint-disable-next-line no-control-regex
                const extraSpace = width - (padding * 2) - chunk.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').length; // Rough ansi strip for padding calc

                // If extraSpace is negative (due to ANSI codes messing up length), standard padding usually covers it visually 
                // but perfect alignment requires stripping ansi.
                // We will just print simply for now.

                console.log(borderColor('│') + p + chunk + ' '.repeat(Math.max(0, extraSpace)) + p + borderColor('│'));

                currentLine = currentLine.substring(chunk.length).trim();
            }
        });

        // Bottom border
        console.log(borderColor(`└${hLine}┘`));
    }

    /**
     * Display the main dashboard
     */
    showDashboard(provider, model) {
        if (this.jsonMode) return;

        console.clear();
        console.log('');

        const width = 60;
        const hLine = '─'.repeat(width);
        const topParams = THEME.box.border(`┌${hLine}┐`);
        const midParams = THEME.box.border(`├${hLine}┤`);
        const botParams = THEME.box.border(`└${hLine}┘`);
        const border = THEME.box.border('│');

        // Header
        console.log(topParams);
        const title = 'Antigravity-Code v2.2.0';
        const leftPad = Math.floor((width - title.length) / 2);
        console.log(border + ' '.repeat(leftPad) + THEME.accent.bold(title) + ' '.repeat(width - title.length - leftPad) + border);
        console.log(midParams);

        // Welcome Msg
        const welcome = "Welcome back! Ready to code?";
        console.log(border + ' '.repeat(2) + THEME.primary(welcome) + ' '.repeat(width - welcome.length - 2) + border);

        // Context
        const context = `${provider.name} • ${model}`;
        console.log(border + ' '.repeat(2) + THEME.dim(context) + ' '.repeat(width - context.length - 2) + border);

        console.log(midParams);

        const hints = [
            '• Type /help for all commands',
            '• Type /init to start project',
            '• Type /create to generate',
            '• Type /debug to fix errors',
            '• Type /audit to analyze security',
            '• Type /session to manage history',
            '• Type /test to run tests'
        ];

        console.log(`${border} ${THEME.box.title('Recent Activity / Hints:')}${' '.repeat(width - 25)}${border}`);
        hints.forEach(hint => {
            const pad = width - hint.length - 1;
            console.log(`${border} ${THEME.dim(hint)}${' '.repeat(Math.max(0, pad))}${border}`);
        });

        console.log(botParams);
        console.log(THEME.dim('Type your request below...'));
        console.log('');
    }

    /**
     * Start a spinner with a message
     */
    startSpinner(text, color = 'cyan') {
        if (this.jsonMode) {
            console.log(JSON.stringify({ type: 'progress', status: 'started', message: text }));
            return;
        }

        if (this.spinner) {
            this.spinner.stop();
        }
        this.spinner = ora({
            text,
            color,
            spinner: 'dots'
        }).start();
    }

    /**
     * Stop the spinner with success message
     */
    stopSpinnerSuccess(text) {
        if (this.jsonMode) {
            console.log(JSON.stringify({ type: 'progress', status: 'success', message: text }));
            return;
        }

        if (this.spinner) {
            this.spinner.succeed(THEME.success(text));
            this.spinner = null;
        }
    }

    /**
     * Stop the spinner with failure message
     */
    stopSpinnerFail(text) {
        if (this.jsonMode) {
            console.log(JSON.stringify({ type: 'progress', status: 'failed', message: text }));
            return;
        }

        if (this.spinner) {
            this.spinner.fail(THEME.error(text));
            this.spinner = null;
        }
    }

    /**
     * Log an informational message
     */
    info(message) {
        if (this.jsonMode) {
            console.log(JSON.stringify({ type: 'info', message }));
            return;
        }
        console.log(THEME.secondary('ℹ'), message);
    }

    /**
     * Log a success message
     */
    success(message) {
        if (this.jsonMode) {
            console.log(JSON.stringify({ type: 'success', message }));
            return;
        }
        console.log(THEME.success('✔'), message);
    }

    /**
     * Log a warning message
     */
    warn(message) {
        if (this.jsonMode) {
            console.log(JSON.stringify({ type: 'warning', message }));
            return;
        }
        console.log(THEME.warning('⚠'), message);
    }

    /**
     * Log an error message
     */
    error(message) {
        if (this.jsonMode) {
            console.log(JSON.stringify({ type: 'error', message }));
            return;
        }
        console.log(THEME.error('✖'), message);
    }

    /**
     * Render markdown content to the terminal
     */
    renderMarkdown(content) {
        if (!content) return;

        if (this.jsonMode) {
            console.log(JSON.stringify({ type: 'markdown', content }));
            return;
        }

        console.log(marked.parse(content));
    }

    /**
     * Format a tool call for display
     */
    formatToolCall(toolName, args) {
        if (this.jsonMode) {
            return `Tool: ${toolName}`;
        }
        return `${THEME.secondary.bold('🔧 Tool:')} ${THEME.primary(toolName)} ${THEME.dim(JSON.stringify(args))}`;
    }

    /**
     * Format an AI response header
     */
    formatAIHeader(provider, model) {
        if (this.jsonMode) return '';
        // More subtle header
        return `\n${THEME.accent.bold('🤖 AI')} ${THEME.dim(`(${provider}/${model})`)}\n${THEME.dim('─'.repeat(40))}`;
    }

    /**
     * Clear the console
     */
    clear() {
        if (this.jsonMode) return;
        console.clear();
    }

    /**
     * Show help information
     */
    help(commandName = null) {
        if (this.jsonMode) return;

        if (commandName) {
            // Specific command help
            const cmd = COMMANDS.find(c => c.name === commandName || c.name === `/${commandName}`);
            if (!cmd) {
                this.error(`Command not found: ${commandName}`);
                return;
            }

            console.log('');
            console.log(`${THEME.primary.bold(cmd.name)} - ${cmd.description}`);
            console.log(THEME.dim('─'.repeat(40)));
            console.log(`${THEME.secondary.bold('Usage:')}   ${cmd.usage}`);
            console.log(`${THEME.secondary.bold('Example:')} ${cmd.example}`);
            console.log(`${THEME.secondary.bold('Category:')} ${cmd.category}`);
            if (cmd.details) {
                console.log('');
                console.log(cmd.details);
            }
            console.log('');
        } else {
            // List all commands
            console.log(THEME.primary.bold('\nAvailable Commands:'));
            console.log(THEME.dim('Type /help <command> for details\n'));

            // Group by category
            const categories = {};
            COMMANDS.forEach(cmd => {
                if (!categories[cmd.category]) categories[cmd.category] = [];
                categories[cmd.category].push(cmd);
            });

            Object.keys(categories).forEach(cat => {
                console.log(THEME.secondary.bold(cat));
                categories[cat].forEach(cmd => {
                    console.log(`  ${THEME.primary(cmd.name.padEnd(12))} ${THEME.dim(cmd.description)}`);
                });
                console.log('');
            });
        }
    }

    /**
     * Show model selection options
     */
    modelSelection(models, current) {
        if (this.jsonMode) return;
        console.log(THEME.primary.bold('\nAvailable Models:'));
        models.forEach(model => {
            const isCurrent = model === current;
            const prefix = isCurrent ? THEME.success('●') : THEME.dim('○');
            const name = isCurrent ? THEME.success.bold(model) : chalk.white(model);
            console.log(`  ${prefix} ${name}`);
        });
        console.log('');
    }

    /**
     * Show provider information
     */
    providerInfo(providers, current) {
        if (this.jsonMode) return;
        console.log(THEME.primary.bold('\nAvailable Providers:'));
        providers.forEach(provider => {
            const isCurrent = provider === current.name;
            const prefix = isCurrent ? THEME.success('●') : THEME.dim('○');
            const name = isCurrent ? THEME.success.bold(provider) : chalk.white(provider);
            console.log(`  ${prefix} ${name}`);
        });
        console.log('');
    }

    /**
     * Prompt for user input (fallback if readline is not used directly)
     */
    userPrompt() {
        if (this.jsonMode) return;
        process.stdout.write(THEME.accent.bold('AG> '));
    }

    /**
     * Print the top of the prompt frame with status info
     */
    printPromptTop(status = {}) {
        if (this.jsonMode) return;
        const width = 60;

        // Status items
        // Status items
        const cwd = status.cwd ? path.basename(status.cwd) : 'root';
        const providerName = status.provider ? status.provider.name : 'AI';
        // unused: const modelName = status.provider ? status.provider.model : '';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Format labels
        const labelCwd = `${THEME.accent(`📂 ${cwd}`)}`;
        const labelAI = `${THEME.secondary(`⚡ ${providerName}`)}`;
        const labelTime = `${THEME.dim(`🕒 ${time}`)}`;

        // Calculate spacing
        // We need to estimate visual length (stripping ansi for calculation is best, but we'll approximate)
        // eslint-disable-next-line no-unused-vars, no-control-regex
        const strip = (s) => s.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

        const rawCwd = `📂 ${cwd}`;
        const rawAI = `⚡ ${providerName}`;
        const rawTime = `🕒 ${time}`;

        const totalContentLen = rawCwd.length + rawAI.length + rawTime.length + 8; // 8 for separators/spaces
        const fillerLen = width - totalContentLen - 2; // -2 for corners
        const safeFillerLen = Math.max(0, fillerLen);

        // Separator
        const sep = THEME.box.border(' │ ');
        const line = THEME.box.border('─'.repeat(safeFillerLen));

        console.log('');
        // "── 📂 cwd │ ⚡ AI ────── 🕒 time ──" style

        const topParams = `${THEME.box.border('── ')}${labelCwd}${sep}${labelAI}${sep}${labelTime} ${line}`;

        console.log(topParams);
    }

    /**
     * Print the bottom of the prompt frame (Empty as requested)
     */
    printPromptBottom() {
        // No bottom border
    }

    /**
     * Ask for user confirmation
     */
    async confirmAction(message) {
        if (this.jsonMode) return true;

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise(resolve => {
            rl.question(THEME.warning.bold(`❓ ${message} (Y/n) `), (answer) => {
                rl.close();
                resolve(answer.toLowerCase() !== 'n');
            });
        });
    }

    // Export theme color for use in other files
    get theme() {
        return THEME;
    }

    /**
     * Show batch operation confirmation
     */
    async confirmBatchOperation(files) {
        if (this.jsonMode) return 'apply_all';

        const fileTree = new FileTree();

        // Show file tree
        const treeLines = fileTree.render(files);
        treeLines.forEach(line => console.log(line));

        // Show options
        console.log(chalk.bold.cyan('Options:'));
        console.log(`  ${chalk.green('[A]')} Apply All Changes`);
        console.log(`  ${chalk.yellow('[R]')} Review Each File`);
        console.log(`  ${chalk.red('[C]')} Cancel`);
        console.log('');

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise(resolve => {
            rl.question(chalk.bold('Your choice: '), answer => {
                rl.close();
                const choice = answer.trim().toLowerCase();

                if (choice === 'a' || choice === 'apply') {
                    resolve('apply_all');
                } else if (choice === 'r' || choice === 'review') {
                    resolve('review_each');
                } else {
                    resolve('cancel');
                }
            });
        });
    }

    /**
     * Show batch operation results
     */
    showBatchResults(results) {
        if (this.jsonMode) return;

        console.log('');
        console.log(chalk.bold.cyan('📊 Batch Operation Results:'));
        console.log(chalk.dim('─'.repeat(60)));

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        if (successful.length > 0) {
            console.log(chalk.green(`✓ ${successful.length} file${successful.length !== 1 ? 's' : ''} applied successfully`));
            successful.forEach(r => {
                console.log(`  ${chalk.dim('•')} ${r.path}`);
            });
        }

        if (failed.length > 0) {
            console.log('');
            console.log(chalk.red(`✗ ${failed.length} file${failed.length !== 1 ? 's' : ''} failed`));
            failed.forEach(r => {
                console.log(`  ${chalk.dim('•')} ${r.path}: ${r.error}`);
            });
        }

        console.log('');
    }

    /**
     * Show file tree
     */
    showFileTree(files, title) {
        if (this.jsonMode) return;

        const fileTree = new FileTree();
        const lines = fileTree.render(files, title);
        lines.forEach(line => console.log(line));
    }
}

module.exports = new UIManager();
