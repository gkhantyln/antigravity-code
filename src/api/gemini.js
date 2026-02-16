const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BaseAPIProvider } = require('./base');
const { logger } = require('../utils/logger');

/**
 * Gemini API Provider
 */
class GeminiProvider extends BaseAPIProvider {
    constructor(apiKey, options = {}) {
        super(options, 'gemini');
        this.apiKey = apiKey;
        this.model = options.model || 'gemini-3-flash';
        this.maxTokens = options.maxTokens || 8192;
        this.temperature = options.temperature || 0.7;
        this.client = null;
        this.generativeModel = null;

        // Available Gemini models
        this.availableModels = [
            // Gemini 3 Series (Latest)
            'gemini-3-flash',           // Hız + Akışkan multimodal
            'gemini-3-pro',             // En güçlü genel model
            'gemini-3-pro-image',       // Görsel + metin
            'gemini-3-deep-think',      // İleri analiz / premium

            // Gemini 2.5 Series
            'gemini-2.5-pro',           // Üretim ve güçlü genel kullanım
            'gemini-2.5-flash',         // Hızlı & ekonomik
            'gemini-2.5-flash-tts',     // Metin → ses

            // Legacy Models (Önceki Nesil)
            'gemini-2.0-flash-exp',     // Experimental
            'gemini-2.0-flash',         // Stable
            'gemini-2.0-flash-lite',    // Lightweight
            'gemini-1.5-pro',           // Previous generation pro
            'gemini-1.5-flash',         // Previous generation flash
            'gemini-1.0-pro',           // Legacy
        ];
    }

    /**
     * Initialize Gemini client
     */
    async initialize() {
        try {
            this.client = new GoogleGenerativeAI(this.apiKey);
            this.generativeModel = this.client.getGenerativeModel({ model: this.model });
            this.initialized = true;
            this.healthy = true;

            logger.info('Gemini provider initialized', { model: this.model });
            return true;
        } catch (error) {
            logger.error('Failed to initialize Gemini provider', { error: error.message });
            throw error;
        }
    }

    /**
     * Send message to Gemini
     */
    async sendMessage(message, context = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const startTime = Date.now();
        const requestId = this.generateRequestId();

        try {
            logger.debug('Sending message to Gemini', {
                requestId,
                model: this.model,
                messageLength: message.length,
            });

            // Build chat history
            const history = this.buildGeminiHistory(context);

            // Create chat session
            const chat = this.generativeModel.startChat({
                history,
                generationConfig: {
                    maxOutputTokens: this.maxTokens,
                    temperature: this.temperature,
                },
            });

            // Send message
            const result = await chat.sendMessage(message);
            const response = await result.response;
            const text = response.text();

            const latency = Date.now() - startTime;

            // Extract token usage (if available)
            const usage = {
                promptTokens: response.usageMetadata?.promptTokenCount || 0,
                completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
                totalTokens: response.usageMetadata?.totalTokenCount || 0,
            };

            logger.info('Gemini response received', {
                requestId,
                model: this.model,
                latency,
                tokens: usage.totalTokens,
            });

            return this.formatResponse(text, {
                model: this.model,
                usage,
                requestId,
                latency,
            });
        } catch (error) {
            const latency = Date.now() - startTime;

            logger.error('Gemini API error', {
                requestId,
                error: error.message,
                latency,
            });

            // Map Gemini errors to standard format
            const statusCode = this.mapErrorToStatusCode(error);
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
            logger.debug('Streaming message to Gemini', {
                requestId,
                model: this.model,
            });

            // Build chat history
            const history = this.buildGeminiHistory(context);

            // Create chat session
            const chat = this.generativeModel.startChat({
                history,
                generationConfig: {
                    maxOutputTokens: this.maxTokens,
                    temperature: this.temperature,
                },
            });

            // Send message with streaming
            const result = await chat.sendMessageStream(message);

            // Process chunks
            for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text && onChunk) {
                    onChunk(text);
                }
            }

            logger.info('Gemini streaming completed', { requestId });
        } catch (error) {
            logger.error('Gemini streaming error', {
                requestId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Validate Gemini API key format
     */
    validateApiKey(apiKey) {
        // Gemini API keys start with "AIza" and are typically 39 characters
        return /^AIza[a-zA-Z0-9_-]{35}$/.test(apiKey);
    }

    /**
     * Get provider capabilities
     */
    getCapabilities() {
        return {
            streaming: true,
            maxTokens: this.maxTokens,
            supportedModels: this.availableModels,
            features: ['chat', 'code-generation', 'multimodal'],
        };
    }

    /**
     * Set model (allows user to switch between Gemini models)
     */
    setModel(model) {
        if (!this.availableModels.includes(model)) {
            throw new Error(`Invalid Gemini model: ${model}. Available: ${this.availableModels.join(', ')}`);
        }

        this.model = model;
        this.generativeModel = this.client.getGenerativeModel({ model: this.model });
        logger.info('Gemini model changed', { model: this.model });
    }

    /**
     * Get current model
     */
    getModel() {
        return this.model;
    }

    /**
     * Get available models
     */
    getAvailableModels() {
        return this.availableModels;
    }

    /**
     * Build Gemini chat history from context
     * @private
     */
    buildGeminiHistory(context) {
        const history = [];

        if (context.messages && Array.isArray(context.messages)) {
            for (const msg of context.messages) {
                // Gemini uses 'user' and 'model' roles
                const role = msg.role === 'assistant' ? 'model' : 'user';

                // Skip system messages (Gemini doesn't support them in history)
                if (msg.role === 'system') continue;

                history.push({
                    role,
                    parts: [{ text: msg.content }],
                });
            }
        }

        return history;
    }

    /**
     * Map Gemini errors to HTTP status codes
     * @private
     */
    mapErrorToStatusCode(error) {
        const message = error.message.toLowerCase();

        if (message.includes('api key')) return 401;
        if (message.includes('quota') || message.includes('rate limit')) return 429;
        if (message.includes('not found')) return 404;
        if (message.includes('invalid')) return 400;
        if (message.includes('timeout')) return 408;

        return 500;
    }
}

module.exports = { GeminiProvider };
