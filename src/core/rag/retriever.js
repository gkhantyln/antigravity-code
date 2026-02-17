const path = require('path');
const fs = require('fs').promises;

const { logger } = require('../../utils/logger');
const { configManager } = require('../config');

class CodeRetriever {
    constructor() {
        this.extractor = null;
        this.index = [];
        this.indexPath = path.join(configManager.get('storage.dataDir'), 'rag_index.json');
    }

    async initialize() {
        try {
            // Load index from disk
            try {
                const data = await fs.readFile(this.indexPath, 'utf-8');
                this.index = JSON.parse(data);
                logger.info('RAG index loaded', { chunks: this.index.length });
            } catch (error) {
                logger.warn('No RAG index found, retrieval will not work until indexed.');
                this.index = [];
            }

            // Initialize embedding model for query encoding
            const { pipeline } = await import('@xenova/transformers');
            this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            logger.info('RAG Retriever initialized');
        } catch (error) {
            logger.error('Failed to initialize RAG Retriever', { error: error.message });
        }
    }

    async findRelevant(query, topK = 5) {
        if (!this.extractor || this.index.length === 0) {
            return [];
        }

        try {
            // Generate query embedding
            const output = await this.extractor(query, { pooling: 'mean', normalize: true });
            const queryEmbedding = Array.from(output.data);

            // Calculate cosine similarity for all chunks
            const scoredChunks = this.index.map(chunk => ({
                ...chunk,
                score: this.cosineSimilarity(queryEmbedding, chunk.embedding)
            }));

            // Sort by score (descending) and take top K
            return scoredChunks
                .sort((a, b) => b.score - a.score)
                .slice(0, topK)
                .map(chunk => ({
                    filePath: chunk.filePath,
                    startLine: chunk.startLine,
                    endLine: chunk.endLine,
                    content: chunk.content,
                    score: chunk.score
                }));

        } catch (error) {
            logger.error('Error finding relevant code', { error: error.message });
            return [];
        }
    }

    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}

module.exports = { CodeRetriever };
