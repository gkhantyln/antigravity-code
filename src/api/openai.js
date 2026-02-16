const OpenAI = require('openai');
const { BaseAPIProvider } = require('./base');
const { logger } = require('../utils/logger');

/**
 * OpenAI API Provider
 */
class OpenAIProvider extends BaseAPIProvider {
    constructor(apiKey, options = {}) {
        super(options, 'openai');
        this.apiKey = apiKey;
        this.model = options.model || 'gpt-5.2';
        this.maxTokens = options.maxTokens || 8192;
        this.temperature = options.temperature || 0.7;
        this.client = null;

        // Available OpenAI models
        this.availableModels = [
            // GPT-5.3 Series (EN YENİ)
            'gpt-5.3-codex',
            'gpt-5.3-codex-spark',

            // GPT-5.2 Series
            'gpt-5.2',
            'gpt-5.2-pro',
            'gpt-5.2-codex',

            // GPT-5.1 Series
            'gpt-5.1',
            'gpt-5.1-codex',
            'gpt-5.1-codex-max',

            // GPT-5.0 Series
            'gpt-5',
            'gpt-5-pro',
            'gpt-5-codex',
            'gpt-5-mini',
            'gpt-5-nano',

            // Reasoning / Araştırma (o-Serisi)
            'o3',
            'o3-pro',
            'o3-mini',
            'o4-mini-deep-research',

            // GPT-4.1 Series
            'gpt-4.1',
            'gpt-4.1-mini',
            'gpt-4.1-nano',

            // Multimodal / Görsel
            'gpt-image-1',
            'gpt-image-1-mini',

            // Ses / Realtime
            'gpt-audio',
            'gpt-audio-mini',
            'gpt-realtime',
            'gpt-realtime-mini',

            // Embedding
            'text-embedding-3-large',
            'text-embedding-3-small',

            // Speech / Utility
            'whisper',
            'tts-1',
            'tts-1-hd',
            'omni-moderation',

            // Open-Weight (Açık Ağırlık)
            'gpt-oss-120b',
            'gpt-oss-20b',
        ];
    }

    /**
     * Initialize OpenAI client
     */
    async initialize() {
        try {
            this.client = new OpenAI({
                apiKey: this.apiKey,
            });
            this.initialized = true;
            this.healthy = true;

            logger.info('OpenAI provider initialized', { model: this.model });
            return true;
        } catch (error) {
            logger.error('Failed to initialize OpenAI provider', { error: error.message });
            throw error;
        }
    }

    /**
     * Send message to OpenAI
     */
    async sendMessage(message, context = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const startTime = Date.now();
        const requestId = this.generateRequestId();

        try {
            logger.debug('Sending message to OpenAI', {
                requestId,
                model: this.model,
                messageLength: message.length,
            });

            // Build messages array
            const messages = this.buildContextMessages(message, context);

            // Send to OpenAI API
            const response = await this.client.chat.completions.create({
                model: this.model,
                max_tokens: this.maxTokens,
                temperature: this.temperature,
                messages,
            });

            const latency = Date.now() - startTime;

            // Extract content
            const content = response.choices[0]?.message?.content || '';

            // Extract token usage
            const usage = {
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
                totalTokens: response.usage.total_tokens,
            };

            logger.info('OpenAI response received', {
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

            logger.error('OpenAI API error', {
                requestId,
                error: error.message,
                latency,
            });

            // Map OpenAI errors to standard format
            const statusCode = error.status || 500;
            return this.formatError(error, statusCode);
        }
    }

    /**
     * Stream message response
     */
    async streamMessage(message, context = {}, onChunk) {
        if (!this.initialized) {
            await this.initialize();
        }

        const requestId = this.generateRequestId();

        try {
            logger.debug('Streaming message to OpenAI', {
                requestId,
                model: this.model,
            });

            // Build messages array
            const messages = this.buildContextMessages(message, context);

            // Stream from OpenAI API
            const stream = await this.client.chat.completions.create({
                model: this.model,
                max_tokens: this.maxTokens,
                temperature: this.temperature,
                messages,
                stream: true,
            });

            // Process chunks
            for await (const chunk of stream) {
                const text = chunk.choices[0]?.delta?.content;
                if (text && onChunk) {
                    onChunk(text);
                }
            }

            logger.info('OpenAI streaming completed', { requestId });
        } catch (error) {
            logger.error('OpenAI streaming error', {
                requestId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Validate OpenAI API key format
     */
    validateApiKey(apiKey) {
        // OpenAI API keys start with "sk-" and are typically 51 characters
        return /^sk-[a-zA-Z0-9]{48}$/.test(apiKey);
    }

    /**
     * Get provider capabilities
     */
    getCapabilities() {
        return {
            streaming: true,
            maxTokens: this.maxTokens,
            supportedModels: [
                // GPT-5.3 Series
                'gpt-5.3-codex',
                'gpt-5.3-codex-spark',
                // GPT-5.2 Series
                'gpt-5.2',
                'gpt-5.2-pro',
                'gpt-5.2-codex',
                // GPT-5.1 Series
                'gpt-5.1',
                'gpt-5.1-codex',
                'gpt-5.1-codex-max',
                // GPT-5.0 Series
                'gpt-5',
                'gpt-5-pro',
                'gpt-5-codex',
                'gpt-5-mini',
                'gpt-5-nano',
                // o-Series
                'o3',
                'o3-pro',
                'o3-mini',
                'o4-mini-deep-research',
                // GPT-4.1 Series
                'gpt-4.1',
                'gpt-4.1-mini',
                'gpt-4.1-nano',
            ],
            features: ['chat', 'code-generation', 'function-calling', 'vision', 'audio', 'embedding'],
        };
    }
}

module.exports = { OpenAIProvider };
