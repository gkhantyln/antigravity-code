const { glob } = require('glob');
const fs = require('fs').promises;
const path = require('path');
const { pipeline } = require('@xenova/transformers');
const { logger } = require('../../utils/logger');
const { configManager } = require('../config');

class CodeIndexer {
    constructor() {
        this.extractor = null;
        this.index = [];
        this.indexPath = path.join(configManager.get('storage.dataDir'), 'rag_index.json');
    }

    async initialize() {
        try {
            // Initialize the embedding model
            // We use a small, efficient model suitable for code/text
            this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            logger.info('RAG Indexer initialized with Xenova/all-MiniLM-L6-v2');
        } catch (error) {
            logger.error('Failed to initialize RAG Indexer', { error: error.message });
            throw error;
        }
    }

    async indexFiles(rootDir = process.cwd()) {
        if (!this.extractor) await this.initialize();

        logger.info('Starting code indexing...', { rootDir });
        const files = await this.findFiles(rootDir);

        this.index = []; // Reset index

        for (const file of files) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                const chunks = this.chunkFile(content, file);

                for (const chunk of chunks) {
                    const embedding = await this.generateEmbedding(chunk.content);
                    this.index.push({
                        ...chunk,
                        embedding: Array.from(embedding.data), // Convert Float32Array to regular array
                        timestamp: Date.now()
                    });
                }
            } catch (error) {
                logger.warn(`Failed to index file: ${file}`, { error: error.message });
            }
        }

        await this.saveIndex();
        logger.info('Code indexing completed', { chunks: this.index.length });
        return this.index.length;
    }

    async findFiles(rootDir) {
        const options = {
            cwd: rootDir,
            ignore: [
                '**/node_modules/**',
                '**/dist/**',
                '**/build/**',
                '**/.git/**',
                '**/coverage/**',
                '**/*.min.js',
                '**/*.map',
                '**/package-lock.json',
                '**/.env*'
            ],
            nodir: true,
            absolute: true
        };

        // Index common source files
        // Glob v13 returns a promise when no callback is provided
        return glob('**/*.{js,ts,jsx,tsx,py,java,cpp,c,h,cs,php,rb,go,rs,md,txt,json}', options);
    }

    chunkFile(content, filePath) {
        const chunks = [];
        const lines = content.split('\n');
        const CHUNK_SIZE = 50; // Lines per chunk
        const OVERLAP = 10;    // Overlap lines

        for (let i = 0; i < lines.length; i += (CHUNK_SIZE - OVERLAP)) {
            const chunkLines = lines.slice(i, i + CHUNK_SIZE);
            if (chunkLines.length < 5) continue; // Skip very small chunks

            const chunkContent = chunkLines.join('\n');
            chunks.push({
                filePath,
                startLine: i + 1,
                endLine: i + chunkLines.length,
                content: chunkContent
            });
        }

        return chunks;
    }

    async generateEmbedding(text) {
        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        return output;
    }

    async saveIndex() {
        try {
            await fs.mkdir(path.dirname(this.indexPath), { recursive: true });
            await fs.writeFile(this.indexPath, JSON.stringify(this.index, null, 2));
            logger.debug('RAG index saved to disk', { path: this.indexPath });
        } catch (error) {
            logger.error('Failed to save RAG index', { error: error.message });
        }
    }

    async loadIndex() {
        try {
            const data = await fs.readFile(this.indexPath, 'utf-8');
            this.index = JSON.parse(data);
            logger.info('RAG index loaded from disk', { chunks: this.index.length });
            return true;
        } catch (error) {
            logger.warn('No existing RAG index found');
            return false;
        }
    }
}

module.exports = { CodeIndexer };
