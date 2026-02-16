const { logger } = require('../utils/logger');
const { ui } = require('./ui');
const inquirer = require('inquirer');

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

        ui.startSpinner('Generating...');
        try {
            const aiPrompt = `Please create the following: ${prompt}\n\nProvide the code and a brief explanation.`;
            const response = await this.engine.processRequest(aiPrompt);
            ui.stopSpinner();
            ui.aiResponse(response.content, response.provider, response.model);
        } catch (error) {
            ui.failSpinner('Generation failed');
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

        ui.startSpinner('Analyzing...');
        try {
            const aiPrompt = `Please debug this issue:\n${issue}\n\nAnalyze the problem and provide a solution.`;
            const response = await this.engine.processRequest(aiPrompt);
            ui.stopSpinner();
            ui.aiResponse(response.content, response.provider, response.model);
        } catch (error) {
            ui.failSpinner('Debugging failed');
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
                    message: 'Enter the code or filename to test:',
                    validate: input => input.trim() !== '' || 'Please provide code to test.',
                },
            ]);
            code = answer.code;
        }

        ui.startSpinner('Generating tests...');
        try {
            const aiPrompt = `Please generate unit tests for the following:\n${code}\n\nInclude test cases for edge cases and typical usage.`;
            const response = await this.engine.processRequest(aiPrompt);
            ui.stopSpinner();
            ui.aiResponse(response.content, response.provider, response.model);
        } catch (error) {
            ui.failSpinner('Test generation failed');
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
    handleHelp() {
        ui.help();
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
            case '/create':
                await this.handleCreate(args);
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
            case '/clear':
                this.handleClear();
                break;
            case '/help':
                this.handleHelp();
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
