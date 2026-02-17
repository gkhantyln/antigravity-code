const axios = require('axios');
const { BaseAPIProvider } = require('./base');
const { logger } = require('../utils/logger');

class OllamaProvider extends BaseAPIProvider {
    constructor(config) {
        super(config, 'ollama');
        this.baseUrl = config.ollama?.baseUrl || 'http://localhost:11434';
        this.defaultModel = config.ollama?.model || 'llama3';
    }

    async initialize() {
        this.initialized = true;
        logger.info('OllamaProvider initialized', { baseUrl: this.baseUrl, model: this.defaultModel });
        return true;
    }

    validateApiKey(_apiKey) {
        // Ollama usually doesn't require an API key for local use
        return true;
    }

    async sendMessage(message, context) {
        if (!this.initialized) await this.initialize();

        const messages = this.buildContextMessages(message, context);
        const requestBody = {
            model: this.defaultModel,
            messages,
            stream: false,
            options: {
                // Approximate mapping of config to Ollama options
                num_predict: this.config.ollama?.maxTokens || 4096,
                temperature: 0.7
            }
        };

        const startTime = Date.now();

        try {
            const response = await axios.post(`${this.baseUrl}/api/chat`, requestBody);
            const { data } = response;

            // Ollama response format:
            // { model: 'llama3', created_at: '...', message: { role: 'assistant', content: '...' }, done: true, ... }

            if (!data || !data.message) {
                throw new Error('Invalid response from Ollama');
            }

            return this.formatResponse(data.message.content, {
                model: data.model,
                usage: {
                    promptTokens: data.prompt_eval_count || 0,
                    completionTokens: data.eval_count || 0,
                    totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                },
                latency: Date.now() - startTime
            });

        } catch (error) {
            logger.error('Ollama API request failed', { error: error.message });

            // Handle connection refused (Ollama likely not running)
            if (error.code === 'ECONNREFUSED') {
                return this.formatError(new Error(`Connection refused. Is Ollama running on ${this.baseUrl}?`));
            }

            return this.formatError(error);
        }
    }

    // Explicitly override healthCheck to be more robust
    async healthCheck() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/tags`);
            if (response.status === 200) {
                this.healthy = true;
                this.lastHealthCheck = new Date();
                return true;
            }
            return false;
        } catch (e) {
            this.healthy = false;
            return false;
        }
    }
}

module.exports = { OllamaProvider };
