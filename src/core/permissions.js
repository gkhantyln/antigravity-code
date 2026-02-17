const { logger } = require('../utils/logger');

/**
 * Permission Modes
 */
const PERMISSION_MODES = {
    DEFAULT: 'default',       // Ask for everything
    AUTO_EDIT: 'auto-edit',   // Auto-approve file edits
    PLAN_ONLY: 'plan-only'    // Read-only, no execution
};

/**
 * Permission Manager
 * Controls what actions the AI can perform automatically
 */
class PermissionManager {
    constructor(config) {
        this.config = config;
        this.mode = PERMISSION_MODES.DEFAULT;
        this.loadMode();
    }

    /**
     * Load permission mode from config
     */
    loadMode() {
        const savedMode = this.config.get('permissionMode');
        if (savedMode && Object.values(PERMISSION_MODES).includes(savedMode)) {
            this.mode = savedMode;
            logger.debug('Permission mode loaded', { mode: this.mode });
        }
    }

    /**
     * Set permission mode
     */
    async setMode(mode) {
        if (!Object.values(PERMISSION_MODES).includes(mode)) {
            throw new Error(`Invalid permission mode: ${mode}`);
        }

        this.mode = mode;
        await this.config.set('permissionMode', mode);
        logger.info('Permission mode changed', { mode });
    }

    /**
     * Cycle through permission modes (for Shift+Tab)
     */
    async cycleMode() {
        const modes = Object.values(PERMISSION_MODES);
        const currentIndex = modes.indexOf(this.mode);
        const nextIndex = (currentIndex + 1) % modes.length;
        await this.setMode(modes[nextIndex]);
        return this.mode;
    }

    /**
     * Get current mode
     */
    getMode() {
        return this.mode;
    }

    /**
     * Get mode display name
     */
    getModeDisplay() {
        const displays = {
            [PERMISSION_MODES.DEFAULT]: '🔒 Ask First',
            [PERMISSION_MODES.AUTO_EDIT]: '⚡ Auto-Edit',
            [PERMISSION_MODES.PLAN_ONLY]: '📋 Plan Only'
        };
        return displays[this.mode] || this.mode;
    }

    /**
     * Request permission for an action
     * @param {string} action - Action type (file_edit, file_delete, command_execute, etc.)
     * @param {object} details - Action details
     * @param {function} promptFn - Function to prompt user (async)
     * @returns {Promise<boolean>} Whether action is allowed
     */
    async requestPermission(action, details, promptFn) {
        // Plan-only mode: block all write operations
        if (this.mode === PERMISSION_MODES.PLAN_ONLY) {
            const readOnlyActions = ['file_read', 'list_dir', 'search'];
            if (!readOnlyActions.includes(action)) {
                logger.debug('Action blocked in plan-only mode', { action });
                return false;
            }
            return true;
        }

        // Auto-edit mode: auto-approve file edits
        if (this.mode === PERMISSION_MODES.AUTO_EDIT) {
            const autoApproveActions = ['file_edit', 'file_write'];
            if (autoApproveActions.includes(action)) {
                logger.debug('Action auto-approved', { action, mode: this.mode });
                return true;
            }
        }

        // Default mode: ask user
        if (promptFn) {
            const message = this._formatPermissionMessage(action, details);
            const approved = await promptFn(message);
            logger.debug('Permission requested', { action, approved });
            return approved;
        }

        // No prompt function provided, default to allow
        return true;
    }

    /**
     * Format permission message for user
     */
    _formatPermissionMessage(action, details) {
        const messages = {
            file_edit: `Allow AI to edit ${details.path}?`,
            file_delete: `Allow AI to delete ${details.path}?`,
            file_write: `Allow AI to write to ${details.path}?`,
            command_execute: `Allow AI to execute: ${details.command}?`,
            web_request: `Allow AI to make web request to ${details.url}?`
        };

        return messages[action] || `Allow AI to perform ${action}?`;
    }

    /**
     * Check if action is allowed in current mode (without prompting)
     */
    isActionAllowed(action) {
        if (this.mode === PERMISSION_MODES.PLAN_ONLY) {
            const readOnlyActions = ['file_read', 'list_dir', 'search'];
            return readOnlyActions.includes(action);
        }

        return true; // Default and auto-edit allow all actions
    }
}

module.exports = { PermissionManager, PERMISSION_MODES };
