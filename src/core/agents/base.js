const { EventEmitter } = require('events');
const { logger } = require('../../utils/logger');

/**
 * Base Agent Class
 * Foundation for all specialized agents in the Swarm
 */
class BaseAgent extends EventEmitter {
    /**
     * @param {AntigravityEngine} engine - The core AI engine
     * @param {Object} config - Agent configuration
     */
    constructor(engine, config = {}) {
        super();
        this.engine = engine;
        this.name = config.name || 'BaseAgent';
        this.role = config.role || 'Assistant';
        this.color = config.color || 'cyan'; // For UI usage
        this.systemPrompt = config.systemPrompt || 'You are a helpful AI assistant.';
        this.memory = []; // Local message history
        this.initialized = false;
    }

    /**
     * Initialize the agent
     */
    async initialize() {
        if (this.initialized) return;

        logger.info(`Initializing agent: ${this.name} (${this.role})`);
        this.initialized = true;
        this.emit('initialized');
    }

    /**
     * Send a message to the agent
     * @param {string} message - User input
     * @param {Object} context - Additional context
     */
    async sendMessage(message, context = {}) {
        if (!this.initialized) await this.initialize();

        // 1. Add to local memory
        this.memory.push({ role: 'user', content: message });

        this.emit('think_start', { message });

        try {
            // 2. Construct Prompt with Persona
            // We prepend the system prompt to ensure the AI adopts the correct persona.
            // In the future, we might pass this as a distinct 'system' parameter if the Engine supports it.
            const fullPrompt = `[System Instruction: ${this.systemPrompt}]\n\n[User Request: ${message}]`;

            // 3. Call Core Engine
            // We use the engine to handle the actual LLM call and tool execution.
            const response = await this.engine.processRequest(fullPrompt, context);

            // 4. Update Memory
            this.memory.push({
                role: 'assistant',
                content: response.content,
                metadata: response.metadata
            });

            this.emit('think_end', { response });

            return {
                content: response.content,
                metadata: response.metadata || {},
                intermediateSteps: response.toolCalls || []
            };

        } catch (error) {
            logger.error(`Agent ${this.name} failed`, { error: error.message });
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * format the history for display or debugging
     */
    getHistory() {
        return this.memory;
    }

    /**
     * Clear agent memory
     */
    clearMemory() {
        this.memory = [];
        logger.debug(`Memory cleared for agent: ${this.name}`);
    }
}

module.exports = { BaseAgent };
