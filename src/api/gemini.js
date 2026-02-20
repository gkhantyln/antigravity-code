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
        this.model = options.model || 'gemini-1.5-pro';
        this.maxTokens = options.maxTokens || 8192;
        this.temperature = options.temperature || 0.7;
        this.client = null;
        this.generativeModel = null;

        // Available Gemini models
        this.availableModels = [
            // Gemini 3.1 Series (New Release)
            'gemini-3.1-pro',           // Son sürüm güçlü model
            'gemini-3.1-flash',         // Son sürüm hızlı model
            'gemini-3.1-pro-image',     // Son sürüm görsel yetenekli

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
            // Use v1beta API version to access newer models like gemini-2.5 and gemini-1.5
            this.generativeModel = this.client.getGenerativeModel({
                model: this.model
            }, {
                apiVersion: 'v1beta'
            });
            this.initialized = true;
            this.healthy = true;

            logger.debug('Gemini provider initialized', { model: this.model });
            return true;
        } catch (error) {
            logger.error('Failed to initialize Gemini provider', { error: error.message });
            throw error;
        }
    }

    /**
     * Send message to Gemini
     */
    async sendMessage(message, context = {}, options = {}) {
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
                tools: options.tools ? options.tools.length : 0
            });

            // Build chat history
            const history = this.buildGeminiHistory(context);

            // Prepare tools if provided
            let toolsConfig;
            if (options.tools && options.tools.length > 0) {
                toolsConfig = [{
                    functionDeclarations: options.tools.map(tool => ({
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.parameters
                    }))
                }];
                // DEBUG LOG

            }

            // Create chat session
            const chatObj = {
                history,
                generationConfig: {
                    maxOutputTokens: this.maxTokens,
                    temperature: this.temperature,
                },
            };

            if (toolsConfig) {
                chatObj.tools = toolsConfig;
            }

            const chat = this.generativeModel.startChat(chatObj);

            // Prepare message content (Text + Images)
            let messageContent = message;

            if (options.images && options.images.length > 0) {
                messageContent = [message];
                for (const image of options.images) {
                    messageContent.push({
                        inlineData: {
                            data: image.data, // Base64 string
                            mimeType: image.mimeType || 'image/png'
                        }
                    });
                }
            }

            // Send message
            const result = await chat.sendMessage(messageContent);
            const response = await result.response;

            // Check for function calls
            const toolCalls = this.extractToolCalls(response);
            const text = response.text ? response.text() : '';

            const latency = Date.now() - startTime;

            // Extract token usage
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
                toolCalls: toolCalls ? toolCalls.length : 0
            });

            return {
                success: true,
                content: text,
                toolCalls,
                provider: 'gemini',
                model: this.model,
                usage,
                metadata: {
                    requestId,
                    latency,
                }
            };
        } catch (error) {
            const latency = Date.now() - startTime;

            // Parse and simplify error messages for users
            let userMessage = error.message;
            let logMessage = error.message;

            // Rate limit / Quota errors
            if (userMessage.includes('429') || userMessage.includes('quota') || userMessage.includes('rate limit')) {
                userMessage = '⏱️ Gemini API rate limit reached. Please wait a few seconds and try again.';
                logMessage = 'Rate limit exceeded';
            }
            // API Key errors
            else if (userMessage.includes('API_KEY_INVALID') || userMessage.includes('API key not valid') || userMessage.includes('401')) {
                userMessage = '🔑 Invalid Gemini API key. Please check your configuration.';
                logMessage = 'Invalid API key';
            }
            // Network/timeout errors
            else if (userMessage.includes('timeout') || userMessage.includes('ETIMEDOUT') || userMessage.includes('ECONNREFUSED')) {
                userMessage = '🌐 Cannot connect to Gemini API. Please check your internet connection.';
                logMessage = 'Connection timeout';
            }
            // Generic errors - show only first line
            else {
                userMessage = `❌ Gemini API error: ${userMessage.split('\n')[0].substring(0, 100)}`;
            }

            // Log simplified version
            logger.error('Gemini API error', {
                requestId,
                error: logMessage,
                latency,
            });

            // Create user-friendly error
            const friendlyError = new Error(userMessage);
            friendlyError.code = error.code || 'GEMINI_ERROR';

            const statusCode = this.mapErrorToStatusCode(error);
            return this.formatError(friendlyError, statusCode);
        }
    }

    /**
     * Extract tool calls from Gemini response
     */
    extractToolCalls(response) {
        if (!response || !response.functionCalls) return null;
        const calls = typeof response.functionCalls === 'function' ? response.functionCalls() : [];


        if (!calls || calls.length === 0) {
            return null;
        }

        return calls.map(call => ({
            id: `call_${Math.random().toString(36).substr(2, 9)}`,
            name: call.name,
            arguments: call.args
        }));
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
        this.generativeModel = this.client.getGenerativeModel({
            model: this.model
        }, {
            apiVersion: 'v1beta'
        });
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
                // Handle tool results (stored as system role)
                if (msg.role === 'system' && msg.metadata && msg.metadata.type === 'tool_result') {
                    history.push({
                        role: 'function',
                        parts: [{
                            functionResponse: {
                                name: msg.metadata.toolName,
                                response: {
                                    name: msg.metadata.toolName,
                                    content: msg.content // Pass as content field in response object
                                }
                            }
                        }]
                    });
                    continue;
                }

                // Skip other system messages
                if (msg.role === 'system') continue;

                // Handle Assistant messages with Tool Calls
                if (msg.role === 'assistant' && msg.metadata && msg.metadata.toolCalls) {
                    const parts = [];

                    // Add text content if present
                    if (msg.content) {
                        parts.push({ text: msg.content });
                    }

                    // Add function calls
                    msg.metadata.toolCalls.forEach(call => {
                        parts.push({
                            functionCall: {
                                name: call.name,
                                args: call.arguments
                            }
                        });
                    });

                    history.push({
                        role: 'model',
                        parts
                    });
                    continue;
                }

                // Regular messages
                const role = msg.role === 'assistant' ? 'model' : 'user';
                history.push({
                    role,
                    parts: [{ text: msg.content || '' }], // Ensure string
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
