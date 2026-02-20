// const { logger } = require('../../utils/logger');

/**
 * Semantic Chunker
 * Splits code into meaningful chunks based on structure (Functions, Classes)
 */
class SemanticChunker {
    constructor() {
        // Regex patterns for different languages
        this.patterns = {
            javascript: [
                // Class definition
                /class\s+\w+\s*(?:extends\s+\w+)?\s*\{/g,
                // Function definition (various forms)
                /(?:async\s+)?function\s+\w+\s*\(/g,
                /(?:async\s+)?\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=]+)\s*=>/g,
                // Class method
                /(?:async\s+)?\w+\s*\([^)]*\)\s*\{/g,
            ],
            python: [
                /class\s+\w+(?:\(.*\))?:/g,
                /def\s+\w+\(.*\):/g,
            ]
        };
    }

    /**
     * Chunk content based on file type
     */
    chunk(content, filePath) {
        const ext = filePath.split('.').pop().toLowerCase();
        let chunks = [];

        if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) {
            chunks = this.chunkByStructure(content, this.patterns.javascript, filePath);
        } else if (['py'].includes(ext)) {
            chunks = this.chunkByStructure(content, this.patterns.python, filePath);
        } else {
            // Fallback to line-based chunking for others
            chunks = this.chunkByLines(content, filePath);
        }

        // Filter out very small chunks
        return chunks.filter(c => c.content.split('\n').length > 3);
    }

    /**
     * Structure-based chunking
     * Identifies code blocks and captures them
     */
    chunkByStructure(content, patterns, filePath) {
        const lines = content.split('\n');
        const chunks = [];
        let currentChunk = {
            startLine: 1,
            content: [],
            type: 'code'
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let isStartOfBlock = false;

            // Check if line matches any pattern
            for (const pattern of patterns) {
                if (pattern.test(line)) {
                    isStartOfBlock = true;
                    break;
                }
            }

            // If new block starts and current chunk has content, save it
            if (isStartOfBlock && currentChunk.content.length > 0) {
                // Determine end line of previous chunk
                const endLine = currentChunk.startLine + currentChunk.content.length - 1;

                chunks.push({
                    filePath,
                    startLine: currentChunk.startLine,
                    endLine,
                    content: currentChunk.content.join('\n')
                });

                // Start new chunk
                currentChunk = {
                    startLine: i + 1,
                    content: [],
                    type: 'code'
                };
            }

            currentChunk.content.push(line);
        }

        // Push last chunk
        if (currentChunk.content.length > 0) {
            chunks.push({
                filePath,
                startLine: currentChunk.startLine,
                endLine: currentChunk.startLine + currentChunk.content.length - 1,
                content: currentChunk.content.join('\n')
            });
        }

        return chunks;
    }

    /**
     * Fallback line-based chunking
     */
    chunkByLines(content, filePath) {
        const chunks = [];
        const lines = content.split('\n');
        const CHUNK_SIZE = 50;
        const OVERLAP = 10;

        for (let i = 0; i < lines.length; i += (CHUNK_SIZE - OVERLAP)) {
            const chunkLines = lines.slice(i, i + CHUNK_SIZE);
            if (chunkLines.length < 5) continue;

            chunks.push({
                filePath,
                startLine: i + 1,
                endLine: i + chunkLines.length,
                content: chunkLines.join('\n')
            });
        }

        return chunks;
    }
}

module.exports = { SemanticChunker };
