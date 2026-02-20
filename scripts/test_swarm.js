const { AntigravityEngine } = require('../src/core/engine');
const { logger } = require('../src/utils/logger');

async function testSwarm() {
    console.log('Initializing Engine...');
    const engine = new AntigravityEngine();
    await engine.initialize();

    console.log('Starting Swarm Mission...');
    try {
        const result = await engine.agentOrchestrator.startMission('Create a simple Hello World Node.js script named hello.js');

        console.log('\n--- Mission Complete ---');
        console.log('Architect Plan:', result.plan.content.substring(0, 50) + '...');
        console.log('Coder Output:', result.code.content.substring(0, 50) + '...');
        console.log('Reviewer Report:', result.review.content.substring(0, 50) + '...');

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testSwarm();
