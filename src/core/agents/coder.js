const { BaseAgent } = require('./base');
const { logger } = require('../../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class CoderAgent extends BaseAgent {
    constructor(engine) {
        super('Coder', 'Developer', engine);
    }

    async act(step) {
        logger.info(`Coder executing step ${step.id}: ${step.description}`);

        if (step.type === 'command') {
            return await this.executeCommand(step.details);
        } else if (step.type === 'code') {
            return await this.generateCode(step);
        } else {
            return { success: true, message: 'Step skipped or handled elsewhere.' };
        }
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
        const systemPrompt = `
You are an Expert Developer. Your task is to write code based on the instructions.
You must return the code. If the user asks to save it to a file, use the 'write_file' format or just provide the code and I will handle saving if you specify the filename in a specific block.

For now, please just provide the complete code content.
If the step implies modifying an existing file, provide the full new content of the file.
`;
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
