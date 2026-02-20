const chalk = require('chalk');
const ora = require('ora');
const marked = require('marked');
const { markedTerminal } = require('marked-terminal');
const readline = require('readline');
const path = require('path');
const gradient = require('gradient-string');
const figlet = require('figlet');
const boxen = require('boxen');
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

        const text = Array.isArray(content) ? content.join('\n') : content;
        
        console.log(boxen(text, {
            title: title,
            titleAlignment: 'center',
            padding: 1,
            margin: 0,
            borderColor: options.borderColor ? options.borderColor.replace(/\x1B\[[0-9;]*m/g, '') : 'blue', // boxen expects color name or hex
            borderStyle: 'round',
            dimBorder: true,
            float: 'left'
        }));
    }

    /**
     * Display the main dashboard
     */
    showDashboard(provider, model) {
        if (this.jsonMode) return;

        console.clear();
        
        // 1. ASCII Banner with Gradient
        const bannerText = figlet.textSync('ANTIGRAVITY', {
            font: 'Standard',
            horizontalLayout: 'default',
            verticalLayout: 'default',
        });
        
        // Custom cool gradient (Blue -> Purple -> Pink)
        console.log(gradient.pastel.multiline(bannerText));
        
        // 2. Welcome & Status Box using Boxen
        const welcomeMsg = [
            chalk.bold.white('Welcome to the Future of Coding.'),
            chalk.dim('Multi-Model AI Agent with Intelligent Failover'),
            '',
            `${chalk.bold.cyan('⚡ Provider:')} ${provider.name}`,
            `${chalk.bold.magenta('🧠 Model:')}    ${model}`,
            ''
        ].join('\n');

        console.log(boxen(welcomeMsg, {
            padding: 1,
            margin: { top: 1, bottom: 1 },
            borderStyle: 'round',
            borderColor: 'cyan',
            title: ' System Status ',
            titleAlignment: 'center'
        }));

        // 3. Hints Box
        const hints = [
            `${chalk.green('➜ /help')}   Show commands`,
            `${chalk.green('➜ /init')}   Start project`,
            `${chalk.green('➜ /create')} Generate code`,
            `${chalk.green('➜ /debug')}  Fix errors`,
            `${chalk.green('➜ /audit')}  Security scan`,
            ``,
            chalk.dim('Type your request below...')
        ].join('\n');

        console.log(boxen(hints, {
            padding: 1,
            margin: { bottom: 1 },
            borderStyle: 'classic',
            borderColor: 'gray',
            title: ' Quick Tips ',
            titleAlignment: 'center'
        }));
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
        
        // Simple, clean status bar similar to Gemini CLI
        const cwd = status.cwd ? path.basename(status.cwd) : 'root';
        const providerName = status.provider ? status.provider.name : 'AI';
        
        console.log('');
        // "📂 project_learn  ⚡ gemini  🕒 12:00"
        console.log(
            chalk.cyan.bold(`📂 ${cwd}`) + 
            chalk.dim(' │ ') + 
            chalk.magenta.bold(`⚡ ${providerName}`) +
            chalk.dim(' │ ') +
            chalk.gray(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        );
        console.log(chalk.dim('─'.repeat(50)));
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
