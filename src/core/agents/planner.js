const { BaseAgent } = require('./base');
const { logger } = require('../../utils/logger');

class PlannerAgent extends BaseAgent {
    constructor(engine) {
        super('Planner', 'Architect', engine);
    }

    async act(goal) {
        logger.info('Planner is creating a plan for:', { goal });

        const systemPrompt = `
You are a Senior Software Architect. Your job is to break down a high-level user request into a specific, step-by-step implementation plan.
Output the plan ONLY as a valid JSON array of objects. Do not add markdown formatting or extra text.

Each step object should have:
- "id": number
- "type": "command" | "code" | "review"
- "description": string (what to do)
- "details": string (specifics, e.g., file paths, commands to run)

Example Input: "Create a React app"
Example Output:
[
  { "id": 1, "type": "command", "description": "Initialize Vite project", "details": "npm create vite@latest my-app -- --template react" },
  { "id": 2, "type": "command", "description": "Install dependencies", "details": "cd my-app && npm install" }
]
`;

        const response = await this.callAI(systemPrompt, goal);

        try {
            // Clean up potentially messy AI output (e.g. if it included backticks)
            let cleanContent = response.content;
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/```json/g, '').replace(/```/g, '');
            } else if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/```/g, '');
            }

            const plan = JSON.parse(cleanContent.trim());
            logger.info('Plan created', { steps: plan.length });
            return plan;
        } catch (error) {
            logger.error('Failed to parse plan', { error: error.message, content: response.content });
            throw new Error('Planner failed to produce a valid JSON plan.');
        }
    }
}

module.exports = { PlannerAgent };
