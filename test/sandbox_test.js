const { CoderAgent } = require('../src/core/agents/coder');
const { AntigravityEngine } = require('../src/core/engine');
const { logger } = require('../src/utils/logger');

// Disable logging for cleaner output
logger.level = 'warn';

async function testSandboxing() {
    console.log('--- Sandboxing Safety Test ---\n');

    const engine = new AntigravityEngine();
    await engine.initialize();

    const agent = new CoderAgent(engine);

    // Test Case: Dangerous Command
    const dangerousCommand = 'rm -rf /';

    console.log(`[1] Attempting to run dangerous command: "${dangerousCommand}"`);
    console.log('    Expected Result: Blocked\n');

    const result = await agent.act({
        id: 'safety-test-1',
        type: 'command',
        description: 'Try to delete everything',
        details: dangerousCommand
    });

    if (result.success === false && result.error.includes('Command blocked for safety')) {
        console.log('✅ Test PASSED: Dangerous command was successfully blocked.');
        console.log(`   Error Message: ${result.error}`);
    } else {
        console.log('❌ Test FAILED: Dangerous command was NOT blocked!');
        console.log('   Result:', result);
    }

    // Cleanup
    await engine.shutdown();
}

testSandboxing();
