const Anthropic = require('@anthropic-ai/sdk');
const { BaseAPIProvider } = require('./base');
const { logger } = require('../utils/logger');

/**
 * Claude API Provider
 */
class ClaudeProvider extends BaseAPIProvider {
    constructor(apiKey, options = {}) {
        super(options, 'claude');
        this.apiKey = apiKey;
        this.model = options.model || 'claude-sonnet-4.5';
        this.maxTokens = options.maxTokens || 8192;
        this.temperature = options.temperature || 0.7;
        this.client = null;

        // Available Claude models
        this.availableModels = [
            // Opus Series (En Yeni & En Güçlü)
            'claude-opus-4.6',
            'claude-opus-4.1',
            'claude-opus-4',

            // Sonnet Series (Dengeli / Genel Amaçlı)
            'claude-sonnet-4.5',
            'claude-sonnet-4',
            'claude-sonnet-3.7',
            'claude-sonnet-3.5',

            // Haiku Series (Önceki Nesiller / Daha Ucuz)
            'claude-haiku-4.5',
            'claude-haiku-3.5',
            'claude-haiku-3',
        ];
    }

    /**
     * Initialize Claude client
     */
    async initialize() {
        try {
            this.client = new Anthropic({
                apiKey: this.apiKey,
            });
            this.initialized = true;
            this.healthy = true;

            logger.info('Claude provider initialized', { model: this.model });
            return true;
        } catch (error) {
            logger.error('Failed to initialize Claude provider', { error: error.message });
            throw error;
        }
    }

    /**
     * Send message to Claude
     */
    async sendMessage(message, context = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const startTime = Date.now();
        const requestId = this.generateRequestId();

        try {
            logger.debug('Sending message to Claude', {
                requestId,
                model: this.model,
                messageLength: message.length,
            });

            // Build messages array
            const messages = this.buildContextMessages(message, context);

            // Send to Claude API
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: this.maxTokens,
                temperature: this.temperature,
                messages,
            });

            const latency = Date.now() - startTime;

            // Extract content
            const content = response.content[0]?.text || '';

            // Extract token usage
            const usage = {
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            };

            logger.info('Claude response received', {
                requestId,
                model: this.model,
                latency,
                tokens: usage.totalTokens,
            });

            return this.formatResponse(content, {
                model: this.model,
                usage,
                requestId,
                latency,
            });
        } catch (error) {
            const latency = Date.now() - startTime;

            // Simplify error messages for users
            let userMessage = error.message;
            if (userMessage.includes('429') || userMessage.includes('quota') || userMessage.includes('rate limit')) {
                userMessage = '⏱️ Claude API rate limit reached. Please wait and try again.';
            } else if (userMessage.includes('401') || userMessage.includes('authentication')) {
                userMessage = '🔑 Invalid Claude API key. Please check your configuration.';
            } else if (userMessage.includes('timeout') || userMessage.includes('ETIMEDOUT')) {
                userMessage = '🌐 Cannot connect to Claude API. Check your internet connection.';
            } else {
                userMessage = `❌ Claude API error: ${userMessage.split('\n')[0].substring(0, 100)}`;
            }

            logger.error('Claude API error', {
                requestId,
                error: userMessage.substring(0, 100),
                latency,
            });

            // Map Claude errors to standard format
            const statusCode = error.status || 500;
            const friendlyError = new Error(userMessage);
            return this.formatError(friendlyError, statusCode);
        }
    }

    /**
     * Stream message response
     */
    async streamMessage(message, onChunk, context = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const requestId = this.generateRequestId();

        try {
            logger.debug('Streaming message to Claude', {
                requestId,
                model: this.model,
            });

            // Build messages array
            const messages = this.buildContextMessages(message, context);

            // Stream from Claude API
            const stream = await this.client.messages.create({
                model: this.model,
                max_tokens: this.maxTokens,
                temperature: this.temperature,
                messages,
                stream: true,
            });

            // Process chunks
            for await (const event of stream) {
                if (event.type === 'content_block_delta') {
                    const text = event.delta?.text;
                    if (text && onChunk) {
                        onChunk(text);
                    }
                }
            }

            logger.info('Claude streaming completed', { requestId });
        } catch (error) {
            logger.error('Claude streaming error', {
                requestId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Validate Claude API key format
     */
    validateApiKey(apiKey) {
        // Claude API keys start with "sk-ant-" and are 99 characters total
        return /^sk-ant-[a-zA-Z0-9-_]{95}$/.test(apiKey);
    }

    /**
     * Get provider capabilities
     */
    getCapabilities() {
        return {
            streaming: true,
            maxTokens: this.maxTokens,
            supportedModels: [
                // Opus Series
                'claude-opus-4.6',
                'claude-opus-4.1',
                'claude-opus-4',
                // Sonnet Series
                'claude-sonnet-4.5',
                'claude-sonnet-4',
                'claude-sonnet-3.7',
                'claude-sonnet-3.5',
                // Haiku Series
                'claude-haiku-4.5',
                'claude-haiku-3.5',
                'claude-haiku-3',
            ],
            features: ['chat', 'code-generation', 'function-calling'],
        };
    }
}

module.exports = { ClaudeProvider };
