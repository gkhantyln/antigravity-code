const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * Checkpoint Manager
 * Manages file snapshots for undo/rewind functionality
 */
class CheckpointManager {
    constructor(database) {
        this.database = database;
    }

    /**
     * Create a checkpoint before file modification
     * @param {string} filePath - Path to the file
     * @returns {Promise<string>} Checkpoint ID
     */
    async createCheckpoint(filePath) {
        try {
            // Read current file content
            let content = null;
            let fileExists = false;

            try {
                content = await fs.readFile(filePath, 'utf8');
                fileExists = true;
            } catch (error) {
                // File doesn't exist yet, that's okay
                logger.debug('Creating checkpoint for new file', { path: filePath });
            }

            // Save checkpoint to database
            const checkpointId = await this.database.saveCheckpoint({
                filePath,
                content,
                fileExists,
                timestamp: Date.now()
            });

            logger.info('Checkpoint created', { checkpointId, path: filePath });
            return checkpointId;
        } catch (error) {
            logger.error('Failed to create checkpoint', { path: filePath, error: error.message });
            throw error;
        }
    }

    /**
     * Revert file to a specific checkpoint
     * @param {string} checkpointId - Checkpoint ID
     */
    async revertToCheckpoint(checkpointId) {
        try {
            const checkpoint = await this.database.getCheckpoint(checkpointId);

            if (!checkpoint) {
                throw new Error(`Checkpoint ${checkpointId} not found`);
            }

            const { filePath, content, fileExists } = checkpoint;

            if (fileExists && content !== null) {
                // Restore file content
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, content, 'utf8');
                logger.info('File reverted to checkpoint', { checkpointId, path: filePath });
            } else {
                // File didn't exist at checkpoint time, delete it
                try {
                    await fs.unlink(filePath);
                    logger.info('File deleted (did not exist at checkpoint)', { checkpointId, path: filePath });
                } catch (error) {
                    // File already doesn't exist, that's fine
                }
            }

            return { filePath, restored: true };
        } catch (error) {
            logger.error('Failed to revert checkpoint', { checkpointId, error: error.message });
            throw error;
        }
    }

    /**
     * List all checkpoints for current session
     * @param {number} limit - Maximum number of checkpoints to return
     */
    async listCheckpoints(limit = 20) {
        try {
            const checkpoints = await this.database.getRecentCheckpoints(limit);
            return checkpoints.map(cp => ({
                id: cp.id,
                filePath: cp.file_path,
                timestamp: cp.timestamp,
                age: this._formatAge(Date.now() - cp.timestamp)
            }));
        } catch (error) {
            logger.error('Failed to list checkpoints', { error: error.message });
            throw error;
        }
    }

    /**
     * Clear old checkpoints (older than 24 hours)
     */
    async clearOldCheckpoints() {
        try {
            const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
            const deleted = await this.database.deleteCheckpointsBefore(cutoffTime);
            logger.info('Old checkpoints cleared', { count: deleted });
            return deleted;
        } catch (error) {
            logger.error('Failed to clear old checkpoints', { error: error.message });
            throw error;
        }
    }

    /**
     * Format age in human-readable format
     */
    _formatAge(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return `${seconds}s ago`;
    }
}

module.exports = { CheckpointManager };
