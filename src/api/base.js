const { logger } = require('../utils/logger');

/**
 * Base API Provider (Abstract Class)
 * All API providers must extend this class
 */
class BaseAPIProvider {
    constructor(config, providerName) {
        if (new.target === BaseAPIProvider) {
            throw new Error('Cannot instantiate abstract class BaseAPIProvider');
        }

        this.config = config;
        this.name = providerName;
        this.initialized = false;
        this.healthy = false;
        this.lastHealthCheck = null;
    }

    /**
     * Initialize the provider
     * @abstract
     */
    async initialize() {
        throw new Error('Method initialize() must be implemented');
    }

    /**
     * Send a message to the AI
     * @abstract
     * @param {string} message - User message
     * @param {Object} context - Conversation context
     * @returns {Promise<Object>} AI response
     */
    async sendMessage(_message, _context) {
        throw new Error('Method sendMessage() must be implemented');
    }

    /**
     * Stream a message response
     * @abstract
     * @param {string} message - User message
     * @param {Object} context - Conversation context
     * @param {Function} onChunk - Callback for each chunk
     * @returns {Promise<void>}
     */
    async streamMessage(_message, _context, _onChunk) {
        throw new Error('Method streamMessage() must be implemented');
    }

    /**
     * Check provider health
     * @returns {Promise<boolean>} Health status
     */
    async healthCheck() {
        try {
            const startTime = Date.now();

            // Simple test message
            const response = await this.sendMessage('Hello', { messages: [] });

            const latency = Date.now() - startTime;
            this.healthy = !!response && response.success;
            this.lastHealthCheck = new Date();

            logger.debug('Health check completed', {
                provider: this.name,
                healthy: this.healthy,
                latency,
            });

            return this.healthy;
        } catch (error) {
            this.healthy = false;
            this.lastHealthCheck = new Date();
            logger.warn('Health check failed', {
                provider: this.name,
                error: error.message,
            });
            return false;
        }
    }

    /**
     * Get provider capabilities
     * @returns {Object} Capabilities
     */
    getCapabilities() {
        return {
            streaming: false,
            maxTokens: 4096,
            supportedModels: [],
            features: [],
        };
    }

    /**
     * Validate API key format
     * @abstract
     * @param {string} apiKey - API key to validate
     * @returns {boolean} Is valid
     */
    validateApiKey(_apiKey) {
        throw new Error('Method validateApiKey() must be implemented');
    }

    /**
     * Format response to standard format
     * @protected
     */
    formatResponse(content, metadata = {}) {
        return {
            success: true,
            provider: this.name,
            model: metadata.model || 'unknown',
            content,
            usage: metadata.usage || {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
            },
            metadata: {
                requestId: metadata.requestId || this.generateRequestId(),
                timestamp: new Date().toISOString(),
                latency: metadata.latency || 0,
            },
        };
    }

    /**
     * Format error response
     * @protected
     */
    formatError(error, statusCode = 500) {
        return {
            success: false,
            provider: this.name,
            error: {
                message: error.message,
                code: error.code || 'UNKNOWN_ERROR',
                statusCode,
            },
            metadata: {
                requestId: this.generateRequestId(),
                timestamp: new Date().toISOString(),
            },
        };
    }

    /**
     * Generate unique request ID
     * @protected
     */
    generateRequestId() {
        return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Retry with exponential backoff
     * @protected
     */
    async retryWithBackoff(fn, maxRetries = 3) {
        let lastError;
        let delay = 1000;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (attempt === maxRetries) {
                    break;
                }

                logger.debug('Retry attempt', {
                    provider: this.name,
                    attempt: attempt + 1,
                    maxRetries,
                    delay,
                    error: error.message,
                });

                await this.sleep(delay);
                delay = Math.min(delay * 2, 10000); // Max 10 seconds
            }
        }

        throw lastError;
    }

    /**
     * Sleep utility
     * @protected
     */
    sleep(ms) {
        return new Promise((resolve) => { setTimeout(resolve, ms); });
    }

    /**
     * Build context messages for API
     * @protected
     */
    buildContextMessages(message, context) {
        const messages = [];

        // Add previous messages from context
        if (context.messages && Array.isArray(context.messages)) {
            messages.push(...context.messages);
        }

        // Add current message
        messages.push({
            role: 'user',
            content: message,
        });

        return messages;
    }
}

module.exports = { BaseAPIProvider };
