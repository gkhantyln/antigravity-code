const { exec } = require('child_process');
const util = require('util');
const { BaseAgent } = require('./base');
const { logger } = require('../../utils/logger');

const execAsync = util.promisify(exec);

class CoderAgent extends BaseAgent {
    constructor(engine) {
        super('Coder', 'Developer', engine);
    }

    async act(step) {
        logger.info(`Coder executing step ${step.id}: ${step.description}`);

        if (step.type === 'command') {
            return this.executeCommand(step.details);
        } if (step.type === 'code') {
            return this.generateCode(step);
        }
        return { success: true, message: 'Step skipped or handled elsewhere.' };

    }

    async executeCommand(command) {
        try {
            logger.debug(`Running command: ${command}`);
            const { stdout, stderr } = await execAsync(command, { cwd: process.cwd() });
            return {
                success: true,
                output: stdout,
                error: stderr
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async generateCode(step) {
        // In a real agentic loop, we would give this agent tool access (read/write file).
        // For this phase, we'll rely on the engine's tool capability or simulate it.

        // Let's reuse the engine's `processRequest` which has access to tools.
        // We instruct it to use the tools.
        const prompt = `
Task: ${step.description}
Details: ${step.details}

Please execute this task. 
If you need to write a file, use the 'write_file' tool.
If you need to read a file, use the 'read_file' tool.
`;

        const response = await this.engine.processRequest(prompt);
        return {
            success: true,
            output: response.content
        };
    }
}

module.exports = { CoderAgent };
