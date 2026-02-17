const { APIOrchestrator } = require('../api/orchestrator');
const { ContextManager } = require('./context');
const { Database } = require('../utils/storage');
const { configManager } = require('./config');
const { logger } = require('../utils/logger');
const { FileSystemTools } = require('../tools/filesystem');

/**
 * Antigravity Engine
 * Main orchestration engine
 */
class AntigravityEngine {
    constructor() {
        this.database = null;
        this.contextManager = null;
        this.apiOrchestrator = null;
        this.fileSystemTools = null;
        this.initialized = false;
    }

    /**
     * Initialize the engine
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        logger.info('Initializing Antigravity Engine');

        // Load configuration
        const config = configManager.load();
        configManager.validate();

        // Initialize database
        this.database = new Database(config.storage.dbPath);
        await this.database.initialize();

        // Initialize context manager
        this.contextManager = new ContextManager(this.database);

        // Initialize file system tools
        this.fileSystemTools = new FileSystemTools();

        // Initialize API orchestrator
        this.apiOrchestrator = new APIOrchestrator(this.database);
        await this.apiOrchestrator.initialize();

        this.initialized = true;

        logger.info('Antigravity Engine initialized', {
            primaryProvider: config.providers.primary,
            dbPath: config.storage.dbPath,
            toolsInitialized: true
        });
    }

    /**
     * Process a user request
     */
    async processRequest(message, options = {}) {
        if (!this.initialized) {
            throw new Error('Engine not initialized');
        }

        try {
            // Add user message to context
            await this.contextManager.addUserMessage(message);

            // Get conversation context
            const context = await this.contextManager.getContext();

            // Prepare tools
            const tools = this.fileSystemTools.getToolDefinitions();

            // Send to API with failover support and tools
            // Note: detailed tool execution logic handles the loop
            return await this._executeWithTools(message, context, tools);

        } catch (error) {
            logger.error('Request processing failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Execute request with tool support
     */
    async _executeWithTools(message, context, tools) {
        // Send to API with failover support
        // Use empty string for continuation if message is null
        let msgToSend = message || '';

        // Inject project context if it's the first turn (message is present)
        if (message) {
            const projectContext = await this.contextManager.getProjectContext();
            msgToSend = `[System Context]\n${projectContext}\n\n${message}`;
        }

        // Merge options (for images) with tools
        const sendOptions = { ...options, tools };
        let response = await this.apiOrchestrator.sendMessage(msgToSend, context, sendOptions);

        if (!response.success) {
            throw new Error(response.error?.message || 'API request failed');
        }

        // Add assistant response to context immediately
        await this.contextManager.addAssistantMessage(
            response.content,
            response.provider,
            response.model,
            response.usage?.totalTokens,
            response.toolCalls
        );

        // Check if tool call requested
        if (response.toolCalls && response.toolCalls.length > 0) {
            for (const toolCall of response.toolCalls) {
                const result = await this._executeTool(toolCall.name, toolCall.arguments);

                // Add tool result to context
                await this.contextManager.addToolResultMessage(toolCall.id, toolCall.name, result);
            }

            // Update context with the new tool results and recurse
            context = await this.contextManager.getContext();
            return await this._executeWithTools(null, context, tools);
        }

        return {
            content: response.content,
            provider: response.provider,
            model: response.model,
            usage: response.usage,
        };
    }

    /**
     * Execute a specific tool
     */
    async _executeTool(name, args) {
        logger.info(`Executing tool: ${name}`, args);
        try {
            switch (name) {
                case 'read_file':
                    return await this.fileSystemTools.readFile(args.path);
                case 'write_file':
                    return await this.fileSystemTools.writeFile(args.path, args.content);
                case 'list_dir':
                    return await this.fileSystemTools.listDir(args.path);
                case 'delete_file':
                    return await this.fileSystemTools.deleteFile(args.path);
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        } catch (error) {
            logger.error(`Tool execution failed: ${name}`, error);
            return `Error: ${error.message}`;
        }
    }

    /**
     * Stream a user request
     */
    async streamRequest(message, onChunk, options = {}) {
        if (!this.initialized) {
            throw new Error('Engine not initialized');
        }

        try {
            // Add user message to context
            await this.contextManager.addUserMessage(message);

            // Get conversation context
            const context = await this.contextManager.getContext();

            let fullResponse = '';

            // Stream from API
            await this.apiOrchestrator.streamMessage(message, context, chunk => {
                fullResponse += chunk;
                if (onChunk) {
                    onChunk(chunk);
                }
            });

            // Add complete response to context
            const currentProvider = this.apiOrchestrator.getCurrentProvider();
            await this.contextManager.addAssistantMessage(
                fullResponse,
                this.apiOrchestrator.currentProvider,
                currentProvider.model || currentProvider.getModel?.()
            );

            return fullResponse;
        } catch (error) {
            logger.error('Stream processing failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Start a new conversation
     */
    async newConversation(title) {
        return this.contextManager.createConversation(title);
    }

    /**
     * Load an existing conversation
     */
    async loadConversation(conversationId) {
        return this.contextManager.loadConversation(conversationId);
    }

    /**
     * Get current conversation summary
     */
    async getConversationSummary() {
        return this.contextManager.getConversationSummary();
    }

    /**
     * Get available providers
     */
    getAvailableProviders() {
        return this.apiOrchestrator.getAvailableProviders();
    }

    /**
     * Get current provider
     */
    getCurrentProvider() {
        const provider = this.apiOrchestrator.getCurrentProvider();
        return {
            name: this.apiOrchestrator.currentProvider,
            model: provider.model || provider.getModel?.(),
            capabilities: provider.getCapabilities(),
        };
    }

    /**
     * Switch provider
     */
    switchProvider(providerName) {
        this.apiOrchestrator.switchProvider(providerName);
        logger.info('Provider switched', { provider: providerName });
    }

    /**
     * Change Gemini model (if Gemini is current provider)
     */
    changeGeminiModel(model) {
        const provider = this.apiOrchestrator.getProvider('gemini');

        if (!provider) {
            throw new Error('Gemini provider not available');
        }

        provider.setModel(model);
        logger.info('Gemini model changed', { model });
    }

    /**
     * Get Gemini available models
     */
    getGeminiModels() {
        const provider = this.apiOrchestrator.getProvider('gemini');

        if (!provider) {
            return [];
        }

        return provider.getAvailableModels();
    }

    /**
     * Shutdown the engine
     */
    async shutdown() {
        logger.info('Shutting down Antigravity Engine');

        if (this.apiOrchestrator) {
            await this.apiOrchestrator.shutdown();
        }

        if (this.database) {
            await this.database.close();
        }

        this.initialized = false;
        logger.info('Antigravity Engine shutdown complete');
    }
}

module.exports = { AntigravityEngine };
