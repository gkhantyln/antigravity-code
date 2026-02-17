const { logger } = require('../../utils/logger');

/**
 * Base Agent Class
 * Foundation for all specialized agents
 */
class BaseAgent {
    constructor(name, role, engine) {
        this.name = name;
        this.role = role;
        this.engine = engine;
    }

    /**
     * Think about the task (Internal reasoning)
     * @param {string} task - The task or goal
     * @param {object} context - Additional context
     */
    async think(task, context = {}) {
        logger.debug(`${this.name} (${this.role}) is thinking...`);
        // Default implementation just returns the task, subclasses should override
        return task;
    }

    /**
     * Act on the task
     * @param {string} task - The task to execute
     */
    async act(task) {
        throw new Error('Method act() must be implemented by subclasses');
    }

    /**
     * Send a prompt to the AI engine
     * @param {string} systemPrompt - System instruction for the agent
     * @param {string} userPrompt - Specific task for the AI
     * @returns {Promise<object>} - AI response
     */
    async callAI(systemPrompt, userPrompt) {
        try {
            // We construct a specific prompt structure for the agent
            const fullPrompt = `${systemPrompt}\n\nTask:\n${userPrompt}`;

            // Re-use the engine's processRequest for now, but in future might need specific agent config
            // Note: We might want to pass specific history or context here
            const response = await this.engine.processRequest(fullPrompt);

            return response;
        } catch (error) {
            logger.error(`${this.name} AI call failed`, { error: error.message });
            throw error;
        }
    }
}

module.exports = { BaseAgent };
