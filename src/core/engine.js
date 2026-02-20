const { APIOrchestrator } = require('../api/orchestrator');
const { ContextManager } = require('./context');
const { Database } = require('../utils/storage');
const { configManager } = require('./config');
const { logger } = require('../utils/logger');
const { FileSystemTools } = require('../tools/filesystem');
const { PermissionManager } = require('./permissions');
const { AgentOrchestrator } = require('./agents/orchestrator');
const ui = require('../cli/ui');

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
        this.apiOrchestrator = null;
        this.fileSystemTools = null;
        this.permissionManager = null;
        this.agentOrchestrator = null;
        this.initialized = false;
    }

    /**
     * Initialize the engine
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        logger.debug('Initializing Antigravity Engine');

        // Load configuration
        const config = configManager.load();
        configManager.validate();

        // Initialize database
        this.database = new Database(config.storage.dbPath);
        await this.database.initialize();

        // Initialize context manager
        this.contextManager = new ContextManager(this.database);

        // Initialize file system tools with database for checkpoints
        this.fileSystemTools = new FileSystemTools(process.cwd(), this.database);

        // Initialize permission manager
        this.permissionManager = new PermissionManager(configManager);

        // Initialize API orchestrator
        this.apiOrchestrator = new APIOrchestrator(this.database);
        await this.apiOrchestrator.initialize();

        // Initialize Agent Orchestrator
        this.agentOrchestrator = new AgentOrchestrator(this);
        // We don't await initialization here, it's lazy loaded or we can await it
        // await this.agentOrchestrator.initialize();

        this.initialized = true;

        logger.debug('Antigravity Engine initialized', {
            primaryProvider: config.providers.primary,
            dbPath: config.storage.dbPath,
            toolsInitialized: true,
            permissionMode: this.permissionManager.getMode()
        });
    }


    /**
     * Set the working directory for file operations
     */
    setWorkingDirectory(dir) {
        if (!this.fileSystemTools) {
            throw new Error('File system tools not initialized');
        }
        this.fileSystemTools.setBaseDir(dir);
        logger.info('Engine working directory updated', { dir });
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
            return await this._executeWithTools(message, context, tools, options);

        } catch (error) {
            logger.error('Request processing failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Execute request with tool support
     */
    async _executeWithTools(message, context, tools, options = {}) {
        // Send to API with failover support
        // Use empty string for continuation if message is null
        let msgToSend = message || '';

        // Inject project context if it's the first turn (message is present)
        if (message) {
            const projectContext = await this.contextManager.getProjectContext();
            msgToSend = `[System Context]\n${projectContext}\n\n${message}`;
        }

        const sendOptions = { ...options, tools };
        // eslint-disable-next-line arrow-body-style
        const response = await this.apiOrchestrator.sendMessage(msgToSend, context, sendOptions);

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
            // Collect write_file operations for batch processing
            const writeOperations = response.toolCalls.filter(tc => tc.name === 'write_file');
            const otherOperations = response.toolCalls.filter(tc => tc.name !== 'write_file');

            // Execute non-write operations immediately
            for (const toolCall of otherOperations) {
                const result = await this._executeTool(toolCall.name, toolCall.arguments);
                await this.contextManager.addToolResultMessage(toolCall.id, toolCall.name, result);
            }

            // Handle write operations in batch if multiple
            if (writeOperations.length > 1) {
                await this._executeBatchWrite(writeOperations);
            } else if (writeOperations.length === 1) {
                // Single write operation - execute normally
                const toolCall = writeOperations[0];
                const result = await this._executeTool(toolCall.name, toolCall.arguments);
                await this.contextManager.addToolResultMessage(toolCall.id, toolCall.name, result);
            }

            // Update context with the new tool results and recurse
            const updatedContext = await this.contextManager.getContext();
            return this._executeWithTools(null, updatedContext, tools, options);
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
     * Execute batch write operations
     */
    async _executeBatchWrite(writeOperations) {

        // Prepare file list for UI
        const files = writeOperations.map(op => ({
            path: op.arguments.path,
            status: 'modified',
            stats: { added: 0, removed: 0 }
        }));

        // Check permission mode
        const mode = this.permissionManager.getMode();

        let choice = 'apply_all';
        if (mode === 'plan-only') {
            ui.showFileTree(files, 'Proposed Changes (Plan-Only Mode)');
            ui.warn('Plan-only mode: No files will be modified');

            for (const toolCall of writeOperations) {
                await this.contextManager.addToolResultMessage(
                    toolCall.id,
                    toolCall.name,
                    'Skipped: Plan-only mode'
                );
            }
            return;
        }

        if (mode === 'default') {
            choice = await ui.confirmBatchOperation(files);
        }

        if (choice === 'cancel') {
            ui.warn('Batch operation cancelled');
            for (const toolCall of writeOperations) {
                await this.contextManager.addToolResultMessage(
                    toolCall.id,
                    toolCall.name,
                    'Cancelled by user'
                );
            }
            return;
        }

        const results = [];

        if (choice === 'apply_all') {
            ui.startSpinner(`Applying ${writeOperations.length} file changes...`, 'cyan');

            for (const toolCall of writeOperations) {
                try {
                    const result = await this.fileSystemTools.writeFile(
                        toolCall.arguments.path,
                        toolCall.arguments.content,
                        true
                    );

                    results.push({ path: toolCall.arguments.path, success: true });
                    await this.contextManager.addToolResultMessage(toolCall.id, toolCall.name, result);
                } catch (error) {
                    results.push({ path: toolCall.arguments.path, success: false, error: error.message });
                    await this.contextManager.addToolResultMessage(toolCall.id, toolCall.name, `Error: ${error.message}`);
                }
            }

            ui.stopSpinnerSuccess('Batch operation complete');
            ui.showBatchResults(results);

        } else if (choice === 'review_each') {
            for (const toolCall of writeOperations) {
                try {
                    const result = await this._executeTool(toolCall.name, toolCall.arguments);
                    results.push({ path: toolCall.arguments.path, success: true });
                    await this.contextManager.addToolResultMessage(toolCall.id, toolCall.name, result);
                } catch (error) {
                    results.push({ path: toolCall.arguments.path, success: false, error: error.message });
                    await this.contextManager.addToolResultMessage(toolCall.id, toolCall.name, `Error: ${error.message}`);
                }
            }

            ui.showBatchResults(results);
        }
    }

    /**
     * Stream a user request
     */
    async streamRequest(message, onChunk, _options = {}) {
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
            await this.apiOrchestrator.streamMessage(message, chunk => {
                fullResponse += chunk;
                if (onChunk) {
                    onChunk(chunk);
                }
            }, context);

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
     * Update conversation details
     */
    async updateConversation(id, updates) {
        return this.contextManager.updateConversation(id, updates);
    }

    /**
     * Get current conversation summary
     */
    async getConversationSummary() {
        return this.contextManager.getConversationSummary();
    }

    /**
     * Get recent conversations
     */
    async getRecentConversations(limit) {
        return this.contextManager.getRecentConversations(limit);
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
