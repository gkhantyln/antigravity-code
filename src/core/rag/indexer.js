const { glob } = require('glob');
const fs = require('fs').promises;
const { logger } = require('../../utils/logger');
const { SemanticChunker } = require('./chunker');
const { VectorStore } = require('./store');

class CodeIndexer {
    constructor() {
        this.extractor = null;
        this.chunker = new SemanticChunker();
        this.store = new VectorStore();
    }

    async initialize() {
        try {
            // Initialize embedding model
            const { pipeline } = await import('@xenova/transformers');
            this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

            // Initialize Vector Store
            await this.store.initialize();

            logger.info('RAG Indexer initialized (Vectra + Semantic Chunking)');
        } catch (error) {
            logger.error('Failed to initialize RAG Indexer', { error: error.message });
            throw error;
        }
    }

    async indexFiles(rootDir = process.cwd()) {
        if (!this.extractor) await this.initialize();

        logger.info('Starting code indexing...', { rootDir });
        const files = await this.findFiles(rootDir);

        let totalChunks = 0;

        for (const file of files) {
            try {
                // logger.debug(`Indexing file: ${file}`);
                console.log(`Processing: ${file}`);
                const content = await fs.readFile(file, 'utf-8');
                const chunks = this.chunker.chunk(content, file);

                for (const chunk of chunks) {
                    const embedding = await this.generateEmbedding(chunk.content);

                    await this.store.addItem(chunk.content, Array.from(embedding.data), {
                        filePath: file,
                        startLine: chunk.startLine,
                        endLine: chunk.endLine,
                        timestamp: Date.now()
                    });
                    totalChunks++;
                }
            } catch (error) {
                logger.warn(`Failed to index file: ${file}`, { error: error.message });
            }
        }

        logger.info('Code indexing completed', { totalChunks });
        return totalChunks;
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
                '**/.env*',
                '**/.gemini/**' // Ignore brain/memory folders
            ],
            nodir: true,
            absolute: true
        };

        return glob('**/*.{js,ts,jsx,tsx,py,java,cpp,c,h,cs,php,rb,go,rs,md,txt,json}', options);
    }

    async generateEmbedding(text) {
        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        return output;
    }
}

module.exports = { CodeIndexer };
