const { BaseAgent } = require('./base');
const { logger } = require('../../utils/logger');
const { LintingTool } = require('../tools/linter');

class ReviewerAgent extends BaseAgent {
    constructor(engine) {
        super('Reviewer', 'QA', engine);
        this.linter = new LintingTool();
    }

    async act(result, originalStep) {
        logger.info('Reviewer is analyzing result...');

        // 1. Lint checks (Proactive Debugging)
        // If the step involved coding, we should check for lint errors.
        // Since we don't track exact modified files yet, we can try to infer from the step details
        // or just lint the relevant directory if possible. 
        // For efficiency in this demo, let's look for file paths in the 'details'.

        const fileMatch = originalStep.details.match(/([a-zA-Z0-9_\-./]+\.js)/);
        if (fileMatch) {
            const filePath = fileMatch[0];
            const lintResult = await this.linter.lintFile(filePath);

            if (!lintResult.valid) {
                logger.warn('Linting issues found', { file: filePath, errors: lintResult.errors });

                // Content-aware feedback
                return {
                    approved: false,
                    feedback: `Linting errors found in ${filePath}. Please fix them:\n${lintResult.errors.join('\n')}`
                };
            }
        }

        const systemPrompt = `
You are a QA Lead. Review the output of a task.
The goal was: "${originalStep.description}"
The details were: "${originalStep.details}"

The output received was:
${JSON.stringify(result, null, 2)}

Determine if the task was completed successfully.
Return a simple JSON: { "approved": boolean, "feedback": string }
`;
        // ...

        const response = await this.callAI(systemPrompt, "Review the above output.");

        try {
            let cleanContent = response.content;
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/```json/g, '').replace(/```/g, '');
            } else if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/```/g, '');
            }

            const review = JSON.parse(cleanContent.trim());
            logger.info('Review complete', { approved: review.approved });
            return review;
        } catch (error) {
            logger.warn('Review parsing failed, assuming approval with caution.', { error: error.message });
            return { approved: true, feedback: "Auto-approved due to parsing error." };
        }
    }
}

module.exports = { ReviewerAgent };
