const { BaseAgent } = require('./base');

/**
 * Coder Agent
 * Responsible for implementing code based on plans
 */
class CoderAgent extends BaseAgent {
    constructor(engine) {
        super(engine, {
            name: 'Coder',
            role: 'Senior Developer',
            color: 'green',
            systemPrompt: `You are an Expert Software Developer.
Your goal is to implement the system designed by the Architect.

You must:
1. Follow the Architect's plan strictly.
2. Write clean, efficient, and well-documented code.
3. Use the 'write_file' tool to save your code to files.
4. Ensure all necessary files are created and populated.
5. Handle edge cases and errors gracefully.

Focus on writing production-ready code.`
        });
    }
}

module.exports = { CoderAgent };
