const chalk = require('chalk');
const ora = require('ora');

/**
 * Terminal UI Utilities
 */
class TerminalUI {
    constructor() {
        this.spinner = null;
    }

    /**
     * Print welcome message
     */
    welcome(version, provider, model) {
        console.log();
        console.log(chalk.cyan.bold('🚀 Antigravity-Code') + chalk.gray(` v${version}`));
        console.log(chalk.gray(`Connected to: ${chalk.green(provider)} (${model})`));
        console.log();
    }

    /**
     * Print info message
     */
    info(message) {
        console.log(chalk.blue('ℹ'), message);
    }

    /**
     * Print success message
     */
    success(message) {
        console.log(chalk.green('✓'), message);
    }

    /**
     * Print warning message
     */
    warn(message) {
        console.log(chalk.yellow('⚠'), message);
    }

    /**
     * Print error message
     */
    error(message) {
        console.log(chalk.red('✗'), message);
    }

    /**
     * Print AI response
     */
    aiResponse(content, provider, model) {
        console.log();
        console.log(chalk.gray(`[${provider}/${model}]`));
        console.log(content);
        console.log();
    }

    /**
     * Print user prompt
     */
    userPrompt() {
        process.stdout.write(chalk.cyan('> '));
    }

    /**
     * Start spinner
     */
    startSpinner(text = 'Processing...') {
        this.spinner = ora({
            text,
            color: 'cyan',
        }).start();
    }

    /**
     * Update spinner text
     */
    updateSpinner(text) {
        if (this.spinner) {
            this.spinner.text = text;
        }
    }

    /**
     * Stop spinner with success
     */
    succeedSpinner(text) {
        if (this.spinner) {
            this.spinner.succeed(text);
            this.spinner = null;
        }
    }

    /**
     * Stop spinner with failure
     */
    failSpinner(text) {
        if (this.spinner) {
            this.spinner.fail(text);
            this.spinner = null;
        }
    }

    /**
     * Stop spinner
     */
    stopSpinner() {
        if (this.spinner) {
            this.spinner.stop();
            this.spinner = null;
        }
    }

    /**
     * Print code block
     */
    codeBlock(code, language = '') {
        console.log();
        console.log(chalk.gray(`\`\`\`${language}`));
        console.log(code);
        console.log(chalk.gray('```'));
        console.log();
    }

    /**
     * Print divider
     */
    divider() {
        console.log(chalk.gray('─'.repeat(60)));
    }

    /**
     * Clear screen
     */
    clear() {
        console.clear();
    }

    /**
     * Print help
     */
    help() {
        console.log();
        console.log(chalk.cyan.bold('Available Commands:'));
        console.log();
        console.log(chalk.yellow('/create') + '  - Create new features');
        console.log(chalk.yellow('/debug') + '   - Debug issues');
        console.log(chalk.yellow('/test') + '    - Generate tests');
        console.log(chalk.yellow('/config') + '  - Configuration management');
        console.log(chalk.yellow('/model') + '   - Change Gemini model');
        console.log(chalk.yellow('/provider') + ' - Switch provider');
        console.log(chalk.yellow('/new') + '     - Start new conversation');
        console.log(chalk.yellow('/clear') + '   - Clear screen');
        console.log(chalk.yellow('/help') + '    - Show this help');
        console.log(chalk.yellow('/exit') + '    - Exit Antigravity');
        console.log();
    }

    /**
     * Print provider info
     */
    providerInfo(providers, current) {
        console.log();
        console.log(chalk.cyan.bold('Available Providers:'));
        console.log();

        providers.forEach(provider => {
            const isCurrent = provider === current.name;
            const marker = isCurrent ? chalk.green('●') : chalk.gray('○');
            const name = isCurrent ? chalk.green.bold(provider) : chalk.white(provider);
            const model = isCurrent ? chalk.gray(`(${current.model})`) : '';

            console.log(`${marker} ${name} ${model}`);
        });

        console.log();
    }

    /**
     * Print model selection
     */
    modelSelection(models, current) {
        console.log();
        console.log(chalk.cyan.bold('Available Gemini Models:'));
        console.log();

        models.forEach(model => {
            const isCurrent = model === current;
            const marker = isCurrent ? chalk.green('●') : chalk.gray('○');
            const name = isCurrent ? chalk.green.bold(model) : chalk.white(model);

            console.log(`${marker} ${name}`);
        });

        console.log();
    }
}

// Create singleton instance
const ui = new TerminalUI();

module.exports = { TerminalUI, ui };
