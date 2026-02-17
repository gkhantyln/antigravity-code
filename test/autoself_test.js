const { CoderAgent } = require('../src/core/agents/coder');
const { AntigravityEngine } = require('../src/core/engine');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../src/utils/logger');

// Disable logging for cleaner output
logger.level = 'warn';

async function testSelfHealing() {
    console.log('--- Self-Healing Test ---\n');

    const engine = new AntigravityEngine();
    await engine.initialize();

    const agent = new CoderAgent(engine);
    const brokenScriptPath = path.join(process.cwd(), 'broken_script.js');

    try {
        // 1. Create a broken script (Syntax Error)
        console.log('[1] Creating broken script...');
        const brokenCode = `
function hello() {
    console.log("Hello World" // Missing closing parenthesis and semicolon
}
hello();
`;
        await fs.writeFile(brokenScriptPath, brokenCode);

        // 2. Instruct agent to run it
        console.log('[2] Commanding agent to run the broken script...');
        // The agent should:
        // 1. Run 'node broken_script.js'
        // 2. Fail (SyntaxError)
        // 3. Analyze error
        // 4. Fix 'broken_script.js'
        // 5. Retry and Succeed

        const result = await agent.act({
            id: 'test-1',
            type: 'command',
            description: 'Run the script',
            details: `node ${brokenScriptPath}`
        });

        // 3. Verify Result
        if (result.success) {
            console.log('\n✅ Test PASSED: Agent successfully self-healed!');
            console.log('Final Output:', result.output.trim());
        } else {
            console.log('\n❌ Test FAILED: Agent could not fix the script.');
            console.log('Error:', result.error);
        }

        // 4. Cleanup
        await fs.unlink(brokenScriptPath);

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await engine.shutdown();
    }
}

testSelfHealing();
