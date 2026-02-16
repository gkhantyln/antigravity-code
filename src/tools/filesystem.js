const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * File System Tools
 * Provides safe file system operations for the AI engine
 */
class FileSystemTools {
    constructor(baseDir = process.cwd()) {
        this.baseDir = baseDir;
    }

    /**
     * Resolve and validate path to ensure it's within baseDir
     */
    _resolvePath(filePath) {
        const resolvedPath = path.resolve(this.baseDir, filePath);
        if (!resolvedPath.startsWith(this.baseDir)) {
            throw new Error(`Access denied: Path ${filePath} is outside base directory`);
        }
        return resolvedPath;
    }

    /**
     * Read file content
     */
    async readFile(filePath) {
        try {
            const fullPath = this._resolvePath(filePath);
            const content = await fs.readFile(fullPath, 'utf8');
            logger.debug('File read', { path: filePath });
            return content;
        } catch (error) {
            logger.error('Read file failed', { path: filePath, error: error.message });
            throw new Error(`Failed to read file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Write content to file
     */
    async writeFile(filePath, content) {
        try {
            const fullPath = this._resolvePath(filePath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content, 'utf8');
            logger.info('File written', { path: filePath });
            return `Successfully wrote to ${filePath}`;
        } catch (error) {
            logger.error('Write file failed', { path: filePath, error: error.message });
            throw new Error(`Failed to write file ${filePath}: ${error.message}`);
        }
    }

    /**
     * List directory contents
     */
    async listDir(dirPath = '.') {
        try {
            const fullPath = this._resolvePath(dirPath);
            const files = await fs.readdir(fullPath, { withFileTypes: true });

            const result = files.map(file => ({
                name: file.name,
                type: file.isDirectory() ? 'directory' : 'file',
                path: path.relative(this.baseDir, path.join(fullPath, file.name))
            }));

            logger.debug('Directory listed', { path: dirPath, count: result.length });
            return result;
        } catch (error) {
            logger.error('List directory failed', { path: dirPath, error: error.message });
            throw new Error(`Failed to list directory ${dirPath}: ${error.message}`);
        }
    }

    /**
     * Get tool definitions for AI
     */
    getToolDefinitions() {
        return [
            {
                name: 'read_file',
                description: 'Read the contents of a file',
                parameters: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'Path to the file to read'
                        }
                    },
                    required: ['path']
                }
            },
            {
                name: 'write_file',
                description: 'Write content to a file. Creates directories if needed.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'Path to the file to write'
                        },
                        content: {
                            type: 'string',
                            description: 'Content to write to the file'
                        }
                    },
                    required: ['path', 'content']
                }
            },
            {
                name: 'list_dir',
                description: 'List contents of a directory',
                parameters: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'Path to the directory to list',
                            default: '.'
                        }
                    }
                }
            },
            {
                name: 'delete_file',
                description: 'Delete a file',
                parameters: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'Path to the file to delete'
                        }
                    },
                    required: ['path']
                }
            }
        ];
    }

    /**
     * Delete file
     */
    async deleteFile(filePath) {
        try {
            const fullPath = this._resolvePath(filePath);
            await fs.unlink(fullPath);
            logger.info('File deleted', { path: filePath });
            return `Successfully deleted ${filePath}`;
        } catch (error) {
            logger.error('Delete file failed', { path: filePath, error: error.message });
            throw new Error(`Failed to delete file ${filePath}: ${error.message}`);
        }
    }
}

module.exports = { FileSystemTools };
