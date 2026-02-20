const { BaseAgent } = require('./base');

/**
 * Reviewer Agent
 * Responsible for QA, security, and code review
 */
class ReviewerAgent extends BaseAgent {
    constructor(engine) {
        super(engine, {
            name: 'Reviewer',
            role: 'QA & Security Expert',
            color: 'magenta',
            systemPrompt: `You are a QA Lead and Security Expert.
Your goal is to review the implementation provided by the Coder.

You must:
1. Analyze the written code for bugs, syntax errors, and logic flaws.
2. Check for security vulnerabilities (injection, auth issues, etc.).
3. Verify that the implementation matches the Architect's plan.
4. If issues are found, list them clearly with suggested fixes.
5. If the implementation is perfect, confirm approval.`
        });
    }
}

module.exports = { ReviewerAgent };
