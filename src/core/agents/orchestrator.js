const { PlannerAgent } = require('./planner');
const { CoderAgent } = require('./coder');
const { ReviewerAgent } = require('./reviewer');
const { logger } = require('../../utils/logger');

class AgentOrchestrator {
    constructor(engine) {
        this.engine = engine;
        this.planner = new PlannerAgent(engine);
        this.coder = new CoderAgent(engine);
        this.reviewer = new ReviewerAgent(engine);
    }

    async execute(userGoal) {
        logger.info('Starting Agentic Workflow', { goal: userGoal });

        // 1. Plan
        console.log('\n🤖 Agent: Planner is thinking...');
        const plan = await this.planner.act(userGoal);
        console.log(`📋 Plan created with ${plan.length} steps.`);

        // 2. Execute Plan
        for (const step of plan) {
            console.log(`\n👉 Step ${step.id}: ${step.description}`);

            let attempts = 0;
            let success = false;

            while (!success && attempts < 3) {
                attempts++;

                // Execute
                console.log(`   🔨 Coder is working (Attempt ${attempts})...`);
                const result = await this.coder.act(step);

                // Review
                console.log(`   🧐 Reviewer is checking...`);
                const review = await this.reviewer.act(result, step);

                if (review.approved) {
                    console.log(`   ✅ Step Verified: ${review.feedback}`);
                    success = true;
                } else {
                    console.log(`   ❌ Step Rejected: ${review.feedback}`);
                    // Add feedback to the step details for the next attempt logic (omitted for brevity)
                    // In a real system, we'd append the feedback to the context for the Coder
                }
            }

            if (!success) {
                throw new Error(`Failed to complete step ${step.id} after 3 attempts.`);
            }
        }

        logger.info('Agentic Workflow Completed');
        return "Workflow completed successfully.";
    }
}

module.exports = { AgentOrchestrator };
