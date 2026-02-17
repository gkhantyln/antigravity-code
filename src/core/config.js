const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { logger } = require('../utils/logger');

// Load environment variables with override enabled
dotenv.config({ override: true });

/**
 * Configuration Manager
 */
class ConfigManager {
    constructor() {
        this.config = {};
        this.loaded = false;
    }

    /**
     * Load configuration from environment and files
     */
    load() {
        if (this.loaded) return this.config;

        // Provider configuration
        this.config.providers = {
            primary: process.env.PRIMARY_PROVIDER || 'gemini',
            secondary: process.env.SECONDARY_PROVIDER || 'claude',
            tertiary: process.env.TERTIARY_PROVIDER || 'openai',
        };

        // Gemini model selection
        this.config.gemini = {
            defaultModel: process.env.GEMINI_DEFAULT_MODEL || 'gemini-1.5-pro',
            availableModels: [
                // Gemini 3 Series (Latest)
                'gemini-3-flash',
                'gemini-3-pro',
                'gemini-3-pro-image',
                'gemini-3-deep-think',
                // Gemini 2.5 Series
                'gemini-2.5-pro',
                'gemini-2.5-flash',
                'gemini-2.5-flash-tts',
                // Legacy Models
                'gemini-2.0-flash-exp',
                'gemini-2.0-flash',
                'gemini-2.0-flash-lite',
                'gemini-1.5-pro',
                'gemini-1.5-flash',
                'gemini-1.0-pro',
            ],
        };

        // Claude configuration
        this.config.claude = {
            model: process.env.CLAUDE_MODEL || 'claude-sonnet-4.5',
            maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '8192', 10),
            availableModels: [
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
        };

        // OpenAI configuration
        this.config.openai = {
            model: process.env.OPENAI_MODEL || 'gpt-5.2',
            maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '8192', 10),
            availableModels: [
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
                // o-Series (Reasoning)
                'o3',
                'o3-pro',
                'o3-mini',
                'o4-mini-deep-research',
                // GPT-4.1 Series
                'gpt-4.1',
                'gpt-4.1-mini',
                'gpt-4.1-nano',
            ],
        };

        // Failover settings
        this.config.failover = {
            enabled: process.env.FAILOVER_ENABLED !== 'false',
            maxRetriesPerProvider: parseInt(process.env.MAX_RETRIES_PER_PROVIDER || '3', 10),
            retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000', 10),
            healthCheckIntervalMs: parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '30000', 10),
        };

        // Context settings
        this.config.context = {
            maxConversationMessages: parseInt(process.env.MAX_CONVERSATION_MESSAGES || '50', 10),
            maxFileContext: parseInt(process.env.MAX_FILE_CONTEXT || '10', 10),
            maxContextSizeMB: parseInt(process.env.MAX_CONTEXT_SIZE_MB || '5', 10),
            compressionEnabled: process.env.CONTEXT_COMPRESSION_ENABLED !== 'false',
        };

        // Storage paths
        this.config.storage = {
            dataDir: process.env.DATA_DIR || path.join(os.homedir(), '.antigravity'),
            dbPath: process.env.DB_PATH || path.join(os.homedir(), '.antigravity', 'data.db'),
            logDir: process.env.LOG_DIR || path.join(os.homedir(), '.antigravity', 'logs'),
        };

        // Logging
        this.config.logging = {
            level: process.env.LOG_LEVEL || 'info',
            fileEnabled: process.env.LOG_FILE_ENABLED !== 'false',
            consoleEnabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
            apiCalls: process.env.LOG_API_CALLS !== 'false',
        };

        // Performance
        this.config.performance = {
            cacheEnabled: process.env.CACHE_ENABLED !== 'false',
            cacheTTLSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10),
            maxCacheSizeMB: parseInt(process.env.MAX_CACHE_SIZE_MB || '100', 10),
            requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10),
        };

        // Security
        this.config.security = {
            telemetryEnabled: process.env.TELEMETRY_ENABLED === 'true',
            analyticsEnabled: process.env.ANALYTICS_ENABLED === 'true',
            autoUpdateCheck: process.env.AUTO_UPDATE_CHECK !== 'false',
        };

        // UI
        this.config.ui = {
            colorScheme: process.env.COLOR_SCHEME || 'auto',
            useIcons: process.env.USE_ICONS !== 'false',
            progressIndicators: process.env.PROGRESS_INDICATORS !== 'false',
            syntaxHighlighting: process.env.SYNTAX_HIGHLIGHTING !== 'false',
        };

        this.loaded = true;
        logger.info('Configuration loaded', {
            primary: this.config.providers.primary,
            geminiModel: this.config.gemini.defaultModel,
        });

        return this.config;
    }

    /**
     * Get configuration value
     */
    get(key) {
        if (!this.loaded) this.load();

        const keys = key.split('.');
        let value = this.config;

        for (const k of keys) {
            if (value[k] === undefined) return null;
            value = value[k];
        }

        return value;
    }

    /**
     * Set configuration value
     */
    set(key, value) {
        if (!this.loaded) this.load();

        const keys = key.split('.');
        let obj = this.config;

        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!obj[k]) obj[k] = {};
            obj = obj[k];
        }

        obj[keys[keys.length - 1]] = value;
        logger.debug('Configuration updated', { key, value });
    }

    /**
     * Validate configuration
     */
    validate() {
        const errors = [];

        // Validate providers
        const validProviders = ['claude', 'gemini', 'openai', 'ollama'];
        if (!validProviders.includes(this.config.providers.primary)) {
            errors.push(`Invalid primary provider: ${this.config.providers.primary}`);
        }

        // Validate numeric values
        if (this.config.failover.maxRetriesPerProvider < 1) {
            errors.push('maxRetriesPerProvider must be >= 1');
        }

        if (this.config.context.maxConversationMessages < 1) {
            errors.push('maxConversationMessages must be >= 1');
        }

        if (errors.length > 0) {
            logger.error('Configuration validation failed', { errors });
            throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
        }

        logger.info('Configuration validated');
        return true;
    }

    /**
     * Get all configuration
     */
    getAll() {
        if (!this.loaded) this.load();
        return this.config;
    }
}

// Create singleton instance
const configManager = new ConfigManager();

module.exports = { ConfigManager, configManager };
