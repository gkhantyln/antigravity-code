const path = require('path');
const { CodeIndexer } = require('../src/core/rag/indexer');
const { CodeRetriever } = require('../src/core/rag/retriever');


async function testRAG() {
    console.log('--- RAG System Test ---');

    const indexer = new CodeIndexer();
    const retriever = new CodeRetriever();

    // 1. Indexing
    console.log('\n[1] Starting Indexing...');
    const startTime = Date.now();

    // Index specific directory (e.g., src/core) to be fast
    const targetDir = path.join(process.cwd(), 'src', 'core');
    console.log(`Target Directory: ${targetDir}`);

    try {
        const count = await indexer.indexFiles(targetDir);
        console.log(`Indexing completed in ${(Date.now() - startTime) / 1000}s. Indexed chunks: ${count}`);
    } catch (error) {
        console.error('Indexing failed:', error);
        process.exit(1);
    }

    // 2. Retrieval
    console.log('\n[2] Starting Retrieval...');
    const query = 'How does the configuration manager work?';
    console.log(`Query: "${query}"`);

    try {
        await retriever.initialize();
        const results = await retriever.findRelevant(query, 3);

        console.log(`Found ${results.length} relevant chunks:`);
        results.forEach((chunk, i) => {
            console.log(`\n--- Result ${i + 1} (Score: ${chunk.score.toFixed(4)}) ---`);
            console.log(`File: ${path.relative(process.cwd(), chunk.filePath)}:${chunk.startLine}-${chunk.endLine}`);
            console.log(`Preview: ${chunk.content.substring(0, 100).replace(/\n/g, ' ')}...`);
        });

        if (results.length > 0 && results[0].score > 0.3) {
            console.log('\nTEST PASSED: Relevant content found.');
        } else {
            console.log('\nTEST WARNING: No highly relevant content found (score might be low).');
        }

    } catch (error) {
        console.error('Retrieval failed:', error);
        process.exit(1);
    }
}

testRAG();
