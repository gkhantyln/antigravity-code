const { logger } = require('../../utils/logger');
const { VectorStore } = require('./store');

class CodeRetriever {
    constructor() {
        this.extractor = null;
        this.store = new VectorStore();
    }

    async initialize() {
        try {
            const { pipeline } = await import('@xenova/transformers');
            this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

            await this.store.initialize();

            logger.info('RAG Retriever initialized');
        } catch (error) {
            logger.error('Failed to initialize RAG Retriever', { error: error.message });
        }
    }

    async findRelevant(query, topK = 5) {
        if (!this.extractor) await this.initialize();

        try {
            // Generate query embedding
            const output = await this.extractor(query, { pooling: 'mean', normalize: true });
            const queryEmbedding = Array.from(output.data);

            // Query Vector Store
            const results = await this.store.query(queryEmbedding, topK);

            return results.map(item => ({
                filePath: item.filePath,
                startLine: item.startLine,
                endLine: item.endLine,
                content: item.text,
                score: item.score
            }));

        } catch (error) {
            logger.error('Error finding relevant code', { error: error.message });
            return [];
        }
    }
}

module.exports = { CodeRetriever };
