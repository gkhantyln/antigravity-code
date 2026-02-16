const { logger } = require('../utils/logger');
const { ui } = require('./ui');

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
    async handleCreate() {
        ui.info('Create workflow not yet implemented');
        ui.info('This will guide you through creating new features');
        // TODO: Implement create workflow
    }

    /**
     * Handle /debug command
     */
    async handleDebug() {
        ui.info('Debug workflow not yet implemented');
        ui.info('This will help you debug issues systematically');
        // TODO: Implement debug workflow
    }

    /**
     * Handle /test command
     */
    async handleTest() {
        ui.info('Test workflow not yet implemented');
        ui.info('This will generate tests for your code');
        // TODO: Implement test workflow
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
                await this.handleCreate();
                break;
            case '/debug':
                await this.handleDebug();
                break;
            case '/test':
                await this.handleTest();
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
