const { CodeIndexer } = require('../src/core/rag/indexer');
const { CodeRetriever } = require('../src/core/rag/retriever');
const { logger } = require('../src/utils/logger');

async function testRAG() {
    console.log('--- Testing Advanced RAG System ---');

    console.log('\nStep 1: Indexing Codebase (SKIPPED)');
    /*
    const indexer = new CodeIndexer();
    try {
        await indexer.initialize();
        console.log('Clearing old index...');
        await indexer.store.clearIndex();
        
        const count = await indexer.indexFiles(process.cwd());
        console.log(`Successfully indexed ${count} chunks.`);
    } catch (error) {
        console.error('Indexing failed:', error);
        return;
    }
    */
    console.log('Using existing index from previous run.');

    console.log('\nStep 2: Retrieving Context...');
    const retriever = new CodeRetriever();
    try {
        await retriever.initialize();

        const query = 'How does the Agent Swarm work?';
        console.log(`Query: "${query}"`);

        const results = await retriever.findRelevant(query, 3);

        console.log('\nTop Results:');
        if (results.length === 0) {
            console.log('No results found.');
        }
        results.forEach((res, i) => {
            console.log(`\n[${i + 1}] Score: ${res.score.toFixed(4)}`);
            console.log(`File: ${res.filePath}`);
            console.log(`Content Preview: ${res.content.substring(0, 100).replace(/\n/g, ' ')}...`);
        });

    } catch (error) {
        console.error('Retrieval failed:', error);
    }
}

testRAG();
