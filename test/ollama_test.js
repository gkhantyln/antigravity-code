const { OllamaProvider } = require('../src/api/ollama');


async function testOllama() {
    console.log('--- Ollama Integration Test ---');

    const config = {
        ollama: {
            baseUrl: 'http://localhost:11434',
            model: 'llama3', // Ensure you have this model pulled: 'ollama pull llama3'
            maxTokens: 100
        }
    };

    const provider = new OllamaProvider(config);

    console.log('[1] Initializing...');
    await provider.initialize();

    console.log('[2] Checking Health...');
    const healthy = await provider.healthCheck();
    console.log(`Health Status: ${healthy ? 'ONLINE' : 'OFFLINE (Is Ollama running?)'}`);

    if (healthy) {
        console.log('[3] Sending Test Message...');
        try {
            const response = await provider.sendMessage('Hello, are you running locally?', { messages: [] });
            console.log('Response:', response.content);
            console.log('Model Used:', response.model);
        } catch (error) {
            console.error('Message failed:', error.message);
        }
    } else {
        console.log('Skipping message test due to offline status.');
    }
}

testOllama();
