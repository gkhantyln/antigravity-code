const { ArchitectAgent } = require('./architect');
const { CoderAgent } = require('./coder');
const { ReviewerAgent } = require('./reviewer');
const { logger } = require('../../utils/logger');
const ui = require('../../cli/ui');

/**
 * Agent Orchestrator
 * Manages the Swarm: Architect -> Coder -> Reviewer
 */
class AgentOrchestrator {
    constructor(engine) {
        this.engine = engine;
        this.agents = {};
        this.initialized = false;
    }

    /**
     * Initialize all agents
     */
    async initialize() {
        if (this.initialized) return;

        logger.info('Initializing Agent Swarm...');

        this.agents.architect = new ArchitectAgent(this.engine);
        this.agents.coder = new CoderAgent(this.engine);
        this.agents.reviewer = new ReviewerAgent(this.engine);

        await Promise.all(Object.values(this.agents).map(a => a.initialize()));

        this.initialized = true;
        logger.info('Agent Swarm fully initialized');
    }

    /**
     * Run the swarm on a task
     * @param {string} task - The user's high-level request
     */
    async startMission(task) {
        if (!this.initialized) await this.initialize();

        logger.info(`Starting swarm mission: ${task}`);
        ui.info('🚀 Starting Agent Swarm Mission...');

        try {
            // 1. Architect: Logic & Plan
            ui.drawBox('Step 1: Architect', 'Analyzing requirements and designing system...', { borderColor: 'blue' });
            const plan = await this.agents.architect.sendMessage(task);

            // 2. Coder: Implementation
            ui.drawBox('Step 2: Coder', 'Implementing the plan...', { borderColor: 'green' });
            // We pass the plan explicitly to ensure focus
            const code = await this.agents.coder.sendMessage(
                `Here is the Architect's plan:\n${plan.content}\n\nPlease implement this exactly.`
            );

            // 3. Reviewer: QA
            ui.drawBox('Step 3: Reviewer', 'Reviewing implementation...', { borderColor: 'magenta' });
            const review = await this.agents.reviewer.sendMessage(
                `Here is the implementation:\n${code.content}\n\nPlease review this against the original plan.`
            );

            return {
                plan,
                code,
                review
            };

        } catch (error) {
            logger.error('Swarm mission failed', { error: error.message });
            throw error;
        }
    }
}

module.exports = { AgentOrchestrator };
