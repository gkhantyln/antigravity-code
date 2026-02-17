const chalk = require('chalk');
const ora = require('ora');
const marked = require('marked');
const { markedTerminal } = require('marked-terminal');
const diff = require('diff');
const readline = require('readline');

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
        this.jsonMode = process.argv.includes('--json');
    }

    /**
     * Display the application banner
     */
    showBanner() {
        if (this.jsonMode) return;
        console.log('');
        console.log(chalk.magenta.bold('🚀 Antigravity-Code v2.0.0'));
        console.log(chalk.gray('   The Agentic AI Coding Assistant'));
        console.log(chalk.gray('   -----------------------------------'));
    }

    /**
     * Start a spinner with a message
     * @param {string} text - Message to display
     * @param {string} color - Spinner color (default: cyan)
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
     * @param {string} text - Success message
     */
    stopSpinnerSuccess(text) {
        if (this.jsonMode) {
            console.log(JSON.stringify({ type: 'progress', status: 'success', message: text }));
            return;
        }

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
        if (this.jsonMode) {
            console.log(JSON.stringify({ type: 'progress', status: 'failed', message: text }));
            return;
        }

        if (this.spinner) {
            this.spinner.fail(chalk.red(text));
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
        console.log(chalk.blue('ℹ'), message);
    }

    /**
     * Log a success message
     */
    success(message) {
        if (this.jsonMode) {
            console.log(JSON.stringify({ type: 'success', message }));
            return;
        }
        console.log(chalk.green('✔'), message);
    }

    /**
     * Log a warning message
     */
    warn(message) {
        if (this.jsonMode) {
            console.log(JSON.stringify({ type: 'warning', message }));
            return;
        }
        console.log(chalk.yellow('⚠'), message);
    }

    /**
     * Log an error message
     */
    error(message) {
        if (this.jsonMode) {
            console.log(JSON.stringify({ type: 'error', message }));
            return;
        }
        console.log(chalk.red('✖'), message);
    }

    /**
     * Render markdown content to the terminal
     * @param {string} content - Markdown content
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
            // This method usually returns a string for logging, not logs itself.
            // If used within a log call, it's fine. 
            // If jsonMode, we probably shouldn't be calling this for display purposes 
            // but rather logging the tool object directly.
            // For now, return a plain string representation.
            return `Tool: ${toolName}`;
        }
        return `${chalk.blue.bold('🔧 Tool:')} ${chalk.cyan(toolName)} ${chalk.gray(JSON.stringify(args))}`;
    }

    /**
     * Format an AI response header
     */
    formatAIHeader(provider, model) {
        if (this.jsonMode) return '';
        return chalk.magenta.bold(`\n🤖 AI (${provider}/${model}):`);
    }

    /**
     * Display the application banner and welcome message
     */
    welcome(version, provider, model) {
        if (this.jsonMode) {
            console.log(JSON.stringify({ type: 'welcome', version, provider, model }));
            return;
        }
        this.showBanner();
        console.log(chalk.gray(`Connected to: ${chalk.cyan(provider)} (${chalk.yellow(model)})`));
        console.log('');
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
    help() {
        if (this.jsonMode) return;
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
        if (this.jsonMode) return;
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
        if (this.jsonMode) return;
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
        if (this.jsonMode) return;
        process.stdout.write(chalk.magenta.bold('AG> '));
    }

    /**
     * Show a colorized diff between old and new content
     */
    showDiff(oldContent, newContent, filePath) {
        if (this.jsonMode) return;

        console.log(chalk.bold(`\n📝 Proposed changes for: ${chalk.cyan(filePath)}`));

        // If file didn't exist (new file)
        if (oldContent === null) {
            console.log(chalk.green('  (New File Created)'));
            // Show first few lines
            const lines = newContent.split('\n').slice(0, 10);
            lines.forEach(line => console.log(chalk.green(`+ ${line}`)));
            if (lines.length < newContent.split('\n').length) {
                console.log(chalk.gray(`  ... and ${newContent.split('\n').length - 10} more lines`));
            }
            return;
        }

        const changes = diff.diffLines(oldContent, newContent);

        changes.forEach(part => {
            let color = chalk.gray;
            let prefix = '  ';
            if (part.added) {
                color = chalk.green;
                prefix = '+ ';
            } else if (part.removed) {
                color = chalk.red;
                prefix = '- ';
            }

            // Limit large diffs for unchanged parts
            if (!part.added && !part.removed && part.count > 5) {
                console.log(chalk.gray(`  ... (${part.count} unchanged lines) ...`));
                return;
            }

            // Print lines
            part.value.split('\n').forEach(line => {
                if (line) console.log(color(prefix + line));
            });
        });
        console.log('');
    }

    /**
     * Ask for user confirmation
     */
    async confirmAction(message) {
        if (this.jsonMode) return true; // Auto-confirm in JSON mode (usually CI/Extension)

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise(resolve => {
            rl.question(chalk.yellow.bold(`❓ ${message} (Y/n) `), (answer) => {
                rl.close();
                resolve(answer.toLowerCase() !== 'n');
            });
        });
    }
}

module.exports = new UIManager();
