const chalk = require('chalk');
const ora = require('ora');
const marked = require('marked');
const { markedTerminal } = require('marked-terminal');

// Configure marked with terminal renderer
// eslint-disable-next-line new-cap
const terminalRenderer = new markedTerminal({
    code: chalk.yellow,
    blockquote: chalk.gray.italic,
    html: chalk.gray,
    heading: chalk.green.bold,
    firstHeading: chalk.magenta.underline.bold,
    strong: chalk.bold.cyan,
    em: chalk.italic,
    codespan: chalk.yellow,
    del: chalk.dim.gray.strikethrough,
    link: chalk.blue.underline,
    href: chalk.blue.underline
});

marked.use(terminalRenderer);

/**
 * UI Manager for Antigravity-Code
 * Handles consistent styling, spinners, and markdown rendering
 */
class UIManager {
    constructor() {
        this.spinner = null;
    }

    /**
     * Display the application banner
     */
    showBanner() {
        console.log('');
        console.log(chalk.magenta.bold('🚀 Antigravity-Code v1.1.0'));
        console.log(chalk.gray('   The Agentic AI Coding Assistant'));
        console.log(chalk.gray('   -----------------------------------'));
    }

    /**
     * Start a spinner with a message
     * @param {string} text - Message to display
     * @param {string} color - Spinner color (default: cyan)
     */
    startSpinner(text, color = 'cyan') {
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
     * @param {string} text - Success message
     */
    stopSpinnerSuccess(text) {
        if (this.spinner) {
            this.spinner.succeed(chalk.green(text));
            this.spinner = null;
        }
    }

    /**
     * Stop the spinner with failure message
     * @param {string} text - Failure message
     */
    stopSpinnerFail(text) {
        if (this.spinner) {
            this.spinner.fail(chalk.red(text));
            this.spinner = null;
        }
    }

    /**
     * Log an informational message
     */
    info(message) {
        console.log(chalk.blue('ℹ'), message);
    }

    /**
     * Log a success message
     */
    success(message) {
        console.log(chalk.green('✔'), message);
    }

    /**
     * Log a warning message
     */
    warn(message) {
        console.log(chalk.yellow('⚠'), message);
    }

    /**
     * Log an error message
     */
    error(message) {
        console.log(chalk.red('✖'), message);
    }

    /**
     * Render markdown content to the terminal
     * @param {string} content - Markdown content
     */
    renderMarkdown(content) {
        if (!content) return;
        console.log(marked.parse(content));
    }

    /**
     * Format a tool call for display
     */
    formatToolCall(toolName, args) {
        return `${chalk.blue.bold('🔧 Tool:')} ${chalk.cyan(toolName)} ${chalk.gray(JSON.stringify(args))}`;
    }

    /**
     * Format an AI response header
     */
    formatAIHeader(provider, model) {
        return chalk.magenta.bold(`\n🤖 AI (${provider}/${model}):`);
    }

    /**
     * Display the application banner and welcome message
     */
    welcome(version, provider, model) {
        this.showBanner();
        console.log(chalk.gray(`Connected to: ${chalk.cyan(provider)} (${chalk.yellow(model)})`));
        console.log('');
    }

    /**
     * Clear the console
     */
    clear() {
        console.clear();
    }

    /**
     * Show help information
     */
    help() {
        console.log(chalk.bold('\nAvailable Commands:'));
        const commands = [
            { cmd: '/create', desc: 'Create new features', example: '/create "snake game"' },
            { cmd: '/debug', desc: 'Debug issues', example: '/debug "fix error"' },
            { cmd: '/test', desc: 'Generate tests', example: '/test "app.js"' },
            { cmd: '/model', desc: 'Change Gemini model', example: '/model gemini-1.5-pro' },
            { cmd: '/provider', desc: 'Switch provider', example: '/provider claude' },
            { cmd: '/new', desc: 'Start new chat', example: '/new "My Project"' },
            { cmd: '/clear', desc: 'Clear screen', example: '/clear' },
            { cmd: '/exit', desc: 'Exit', example: '/exit' }
        ];

        commands.forEach(({ cmd, desc, example }) => {
            console.log(`  ${chalk.cyan(cmd.padEnd(12))} ${chalk.white(desc.padEnd(20))} ${chalk.gray(example)}`);
        });
        console.log('');
    }

    /**
     * Show model selection options
     */
    modelSelection(models, current) {
        console.log(chalk.bold('\nAvailable Models:'));
        models.forEach(model => {
            const isCurrent = model === current;
            const prefix = isCurrent ? chalk.green('●') : chalk.gray('○');
            const name = isCurrent ? chalk.green.bold(model) : chalk.white(model);
            console.log(`  ${prefix} ${name}`);
        });
        console.log('');
    }

    /**
     * Show provider information
     */
    providerInfo(providers, current) {
        console.log(chalk.bold('\nAvailable Providers:'));
        providers.forEach(provider => {
            const isCurrent = provider === current.name;
            const prefix = isCurrent ? chalk.green('●') : chalk.gray('○');
            const name = isCurrent ? chalk.green.bold(provider) : chalk.white(provider);
            console.log(`  ${prefix} ${name}`);
        });
        console.log('');
    }

    /**
     * Prompt for user input (fallback if readline is not used directly)
     */
    userPrompt() {
        process.stdout.write(chalk.magenta.bold('AG> '));
    }
}

module.exports = new UIManager();
