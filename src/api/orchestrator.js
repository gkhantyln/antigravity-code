const { GeminiProvider } = require('./gemini');
const { ClaudeProvider } = require('./claude');
const { OpenAIProvider } = require('./openai');
const { OllamaProvider } = require('./ollama');
const { logger } = require('../utils/logger');
const { secureStorage } = require('../utils/crypto');
const { configManager } = require('../core/config');

/**
 * API Orchestrator
 * Manages multiple API providers and handles failover
 */
class APIOrchestrator {
    constructor(database) {
        this.database = database;
        this.providers = new Map();
        this.providerOrder = [];
        this.currentProvider = null;
        this.healthCheckInterval = null;
    }

    /**
     * Initialize orchestrator and load providers
     */
    async initialize() {
        const config = configManager.getAll();

        // Define provider order based on configuration
        this.providerOrder = [
            config.providers.primary,
            config.providers.secondary,
            config.providers.tertiary,
        ].filter(Boolean);

        logger.debug('Initializing API orchestrator', {
            providerOrder: this.providerOrder,
        });

        // Load and initialize providers
        for (const providerName of this.providerOrder) {
            try {
                await this.loadProvider(providerName);
            } catch (error) {
                logger.warn(`Failed to load provider: ${providerName}`, {
                    error: error.message,
                });
            }
        }

        // Set current provider to first available
        this.currentProvider = this.providerOrder.find(name => this.providers.has(name));

        if (!this.currentProvider) {
            throw new Error('No API providers available. Please configure at least one provider.');
        }

        logger.debug('API orchestrator initialized', {
            currentProvider: this.currentProvider,
            availableProviders: Array.from(this.providers.keys()),
        });

        // Start health check monitoring
        if (config.failover.enabled) {
            this.startHealthChecks();
        }
    }

    /**
     * Load a specific provider
     */
    async loadProvider(providerName) {
        // Get API key from secure storage
        const apiKey = await secureStorage.getApiKey(providerName);

        if (!apiKey && providerName !== 'ollama') {
            logger.debug(`No API key found for provider: ${providerName}`);
            return;
        }

        const config = configManager.getAll();
        let provider;

        // Create provider instance
        switch (providerName) {
            case 'gemini':

                provider = new GeminiProvider(apiKey, {
                    model: config.gemini.defaultModel,
                    maxTokens: 8192,
                    temperature: 0.7,
                });
                break;

            case 'claude':
                provider = new ClaudeProvider(apiKey, {
                    model: config.claude.model,
                    maxTokens: config.claude.maxTokens,
                    temperature: 0.7,
                });
                break;

            case 'openai':
                provider = new OpenAIProvider(apiKey, {
                    model: config.openai.model,
                    maxTokens: config.openai.maxTokens,
                    temperature: 0.7,
                });
                break;

            case 'ollama':
                provider = new OllamaProvider({
                    ollama: config.ollama
                });
                break;

            default:
                throw new Error(`Unknown provider: ${providerName}`);
        }

        // Initialize provider
        await provider.initialize();
        this.providers.set(providerName, provider);

        logger.debug(`Provider loaded: ${providerName}`, {
            model: provider.model || provider.getModel?.(),
        });
    }

    /**
     * Send message with automatic failover
     */
    async sendMessage(message, context = {}, options = {}) {
        const config = configManager.getAll();
        const maxRetries = config.failover.maxRetriesPerProvider;

        let lastError;
        const attemptedProviders = [];

        for (const providerName of this.providerOrder) {
            const provider = this.providers.get(providerName);

            if (!provider) {
                logger.debug(`Provider not available: ${providerName}`);
                continue;
            }

            attemptedProviders.push(providerName);

            // Try with retries
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    logger.debug('Attempting message send', {
                        provider: providerName,
                        attempt: attempt + 1,
                        maxRetries,
                    });

                    const response = await provider.sendMessage(message, context, options);

                    // Check for soft errors (success: false)
                    if (!response.success) {
                        throw new Error(response.error?.message || 'Provider returned failure response');
                    }

                    // Log successful API call
                    if (this.database) {
                        await this.database.logAPICall({
                            provider: providerName,
                            requestId: response.metadata?.requestId,
                            success: true,
                            statusCode: 200,
                            latencyMs: response.metadata?.latency,
                            tokensUsed: response.usage?.totalTokens,
                            errorMessage: null,
                        });
                    }

                    // If we switched providers, log failover
                    if (providerName !== this.currentProvider) {
                        await this.handleFailover(this.currentProvider, providerName, 'Provider failure', context);
                    }

                    this.currentProvider = providerName;
                    return response;
                } catch (error) {
                    lastError = error;

                    logger.warn('Provider attempt failed', {
                        provider: providerName,
                        attempt: attempt + 1,
                        error: error.message,
                    });

                    // Log failed API call
                    if (this.database) {
                        await this.database.logAPICall({
                            provider: providerName,
                            requestId: null,
                            success: false,
                            statusCode: error.status || 500,
                            latencyMs: 0,
                            tokensUsed: 0,
                            errorMessage: error.message,
                        });
                    }

                    // Wait before retry (exponential backoff)
                    if (attempt < maxRetries - 1) {
                        const delay = config.failover.retryDelayMs * 2 ** attempt;
                        await this.sleep(delay);
                    }
                }
            }

            logger.warn(`All retries exhausted for provider: ${providerName}`);
        }

        // All providers failed
        logger.error('All providers failed', {
            attemptedProviders,
            lastError: lastError?.message,
        });

        throw new Error(
            `All API providers failed. Attempted: ${attemptedProviders.join(', ')}. Last error: ${lastError?.message}`
        );
    }

    /**
     * Stream message with automatic failover
     */
    async streamMessage(message, onChunk, context = {}) {
        const provider = this.providers.get(this.currentProvider);

        if (!provider) {
            throw new Error(`Current provider not available: ${this.currentProvider}`);
        }

        try {
            await provider.streamMessage(message, onChunk, context);
        } catch (error) {
            logger.error('Streaming failed', {
                provider: this.currentProvider,
                error: error.message,
            });

            // TODO: Implement failover for streaming
            throw error;
        }
    }

    /**
     * Handle failover event
     */
    async handleFailover(fromProvider, toProvider, reason, context) {
        logger.info('Failover triggered', {
            from: fromProvider,
            to: toProvider,
            reason,
        });

        // Calculate context size
        const contextSize = JSON.stringify(context).length;

        // Log failover event
        if (this.database) {
            await this.database.logFailover(fromProvider, toProvider, reason, contextSize, true);
        }
    }

    /**
     * Start periodic health checks
     */
    startHealthChecks() {
        const config = configManager.getAll();
        const interval = config.failover.healthCheckIntervalMs;

        this.healthCheckInterval = setInterval(async () => {
            for (const [name, provider] of this.providers) {
                try {
                    await provider.healthCheck();
                } catch (error) {
                    logger.warn('Health check failed', {
                        provider: name,
                        error: error.message,
                    });
                }
            }
        }, interval);

        logger.debug('Health check monitoring started', { interval });
    }

    /**
     * Stop health checks
     */
    stopHealthChecks() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            logger.info('Health check monitoring stopped');
        }
    }

    /**
     * Get current provider
     */
    getCurrentProvider() {
        return this.providers.get(this.currentProvider);
    }

    /**
     * Get provider by name
     */
    getProvider(name) {
        return this.providers.get(name);
    }

    /**
     * Get all available providers
     */
    getAvailableProviders() {
        return Array.from(this.providers.keys());
    }

    /**
     * Switch to a specific provider
     */
    switchProvider(providerName) {
        if (!this.providers.has(providerName)) {
            throw new Error(`Provider not available: ${providerName}`);
        }

        const oldProvider = this.currentProvider;
        this.currentProvider = providerName;

        logger.info('Provider switched', {
            from: oldProvider,
            to: providerName,
        });
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise((resolve) => { setTimeout(resolve, ms); });
    }

    /**
     * Shutdown orchestrator
     */
    async shutdown() {
        this.stopHealthChecks();
        logger.info('API orchestrator shutdown');
    }
}

module.exports = { APIOrchestrator };
