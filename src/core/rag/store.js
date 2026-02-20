const path = require('path');
const fs = require('fs').promises;
// Polyfill File for Node < 20 (required by vectra/undici)
if (!global.File) {
    const { File } = require('buffer');
    global.File = File;
}
const { LocalIndex } = require('vectra');
// eslint-disable-next-line import/no-unresolved
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../utils/logger');
const { configManager } = require('../config');

/**
 * Vector Store
 * Wrapper around Vectra for local vector storage
 */
class VectorStore {
    constructor() {
        this.index = null;
        this.indexPath = path.join(configManager.get('storage.dataDir'), 'vector_index');
    }

    /**
     * Initialize the vector index
     */
    async initialize() {
        try {
            this.index = new LocalIndex(this.indexPath);

            // Check if index exists on disk by trying to list items (or create if not)
            if (!await this.index.isIndexCreated()) {
                await this.index.createIndex();
                logger.info('Created new Vector Store index');
            } else {
                logger.info('Vector Store index loaded');
            }
        } catch (error) {
            logger.error('Failed to initialize Vector Store', { error: error.message });
            throw error;
        }
    }

    /**
     * Add item to index
     * @param {string} text - The content text
     * @param {Array<number>} embedding - Vector embedding
     * @param {Object} metadata - Additional metadata (filePath, lines)
     */
    async addItem(text, embedding, metadata = {}) {
        if (!this.index) await this.initialize();

        await this.index.insertItem({
            id: uuidv4(),
            vector: embedding,
            metadata: { ...metadata, text }
        });
    }

    /**
     * Query the index
     * @param {Array<number>} vector - Query embedding
     * @param {number} topK - Number of results
     */
    async query(vector, topK = 5) {
        if (!this.index) await this.initialize();

        const results = await this.index.queryItems(vector, topK);

        // Explicitly slice to topK as vectra might return all matches
        return results.slice(0, topK).map(result => ({
            ...result.item.metadata,
            score: result.score
        }));
    }

    /**
     * Clear the index (delete from disk)
     */
    async clearIndex() {
        // const fs = require('fs').promises;
        try {
            if (this.index) {
                // Vectra doesn't have a clear method, so we delete the folder
                await fs.rm(this.indexPath, { recursive: true, force: true });
                this.index = null;
                await this.initialize();
                logger.info('Vector Store index cleared');
            }
        } catch (error) {
            logger.error('Failed to clear vector index', { error: error.message });
        }
    }
}

module.exports = { VectorStore };
