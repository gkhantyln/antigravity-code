const chalk = require('chalk');
const path = require('path');

/**
 * File Tree Visualizer
 * Renders file trees with status indicators in terminal
 */
class FileTree {
    constructor() {
        // Box-drawing characters
        this.chars = {
            branch: '├─',
            lastBranch: '└─',
            vertical: '│',
            horizontal: '─',
            space: ' '
        };

        // Status icons
        this.icons = {
            modified: '✏️ ',
            new: '➕',
            deleted: '❌',
            folder: '📝',
            file: '📄'
        };

        // Colors
        this.colors = {
            modified: chalk.yellow,
            new: chalk.green,
            deleted: chalk.red,
            folder: chalk.blue,
            unchanged: chalk.gray
        };
    }

    /**
     * Build tree structure from file list
     */
    buildTree(files) {
        const tree = {};

        files.forEach(file => {
            const parts = file.path.split(path.sep);
            let current = tree;

            parts.forEach((part, index) => {
                if (!current[part]) {
                    current[part] = {
                        isFile: index === parts.length - 1,
                        status: file.status,
                        stats: file.stats || {},
                        children: {}
                    };
                }
                current = current[part].children;
            });
        });

        return tree;
    }

    /**
     * Render tree structure
     */
    renderTree(tree, prefix = '', _isLast = true) {
        const lines = [];
        const entries = Object.entries(tree);

        entries.forEach(([name, node], index) => {
            const isLastEntry = index === entries.length - 1;
            const connector = isLastEntry ? this.chars.lastBranch : this.chars.branch;
            const icon = this.getIcon(node);
            const color = this.getColor(node.status);
            const stats = this.formatStats(node.stats);

            // Current line
            const line = `${prefix}${connector} ${icon} ${color(name)}${stats}`;
            lines.push(line);

            // Recurse for children
            if (Object.keys(node.children).length > 0) {
                const childPrefix = prefix + (isLastEntry ? '   ' : `${this.chars.vertical}  `);
                const childLines = this.renderTree(node.children, childPrefix, isLastEntry);
                lines.push(...childLines);
            }
        });

        return lines;
    }

    /**
     * Get icon for node
     */
    getIcon(node) {
        if (!node.isFile) {
            return this.icons.folder;
        }

        switch (node.status) {
            case 'modified':
                return this.icons.modified;
            case 'new':
                return this.icons.new;
            case 'deleted':
                return this.icons.deleted;
            default:
                return this.icons.file;
        }
    }

    /**
     * Get color for status
     */
    getColor(status) {
        return this.colors[status] || this.colors.unchanged;
    }

    /**
     * Format statistics
     */
    formatStats(stats) {
        if (!stats.added && !stats.removed) {
            return '';
        }

        const parts = [];
        if (stats.added) parts.push(chalk.green(`+${stats.added}`));
        if (stats.removed) parts.push(chalk.red(`-${stats.removed}`));

        return parts.length > 0 ? ` (${parts.join(' ')})` : '';
    }

    /**
     * Render complete file tree with header and summary
     */
    render(files, title = 'Proposed Changes') {
        if (!files || files.length === 0) {
            return ['No files to display'];
        }

        const lines = [];

        // Header
        lines.push('');
        lines.push(chalk.bold.cyan(`📦 ${title}:`));

        // Build and render tree
        const tree = this.buildTree(files);
        const treeLines = this.renderTree(tree);
        lines.push(...treeLines);

        // Summary
        lines.push('');
        const summary = this.getSummary(files);
        lines.push(chalk.dim(summary));
        lines.push('');

        return lines;
    }

    /**
     * Get summary statistics
     */
    getSummary(files) {
        const stats = {
            total: files.length,
            new: 0,
            modified: 0,
            deleted: 0,
            linesAdded: 0,
            linesRemoved: 0
        };

        files.forEach(file => {
            if (file.status === 'new') stats.new++;
            if (file.status === 'modified') stats.modified++;
            if (file.status === 'deleted') stats.deleted++;
            if (file.stats) {
                stats.linesAdded += file.stats.added || 0;
                stats.linesRemoved += file.stats.removed || 0;
            }
        });

        const parts = [];
        parts.push(`${stats.total} file${stats.total !== 1 ? 's' : ''}`);

        if (stats.linesAdded > 0) {
            parts.push(chalk.green(`+${stats.linesAdded} lines`));
        }
        if (stats.linesRemoved > 0) {
            parts.push(chalk.red(`-${stats.linesRemoved} lines`));
        }

        return parts.join(' • ');
    }

    /**
     * Render compact summary (single line)
     */
    renderCompact(files) {
        if (!files || files.length === 0) {
            return 'No changes';
        }

        const statusCounts = {
            new: 0,
            modified: 0,
            deleted: 0
        };

        files.forEach(file => {
            if (statusCounts[file.status] !== undefined) {
                statusCounts[file.status]++;
            }
        });

        const parts = [];
        if (statusCounts.new > 0) {
            parts.push(chalk.green(`${statusCounts.new} new`));
        }
        if (statusCounts.modified > 0) {
            parts.push(chalk.yellow(`${statusCounts.modified} modified`));
        }
        if (statusCounts.deleted > 0) {
            parts.push(chalk.red(`${statusCounts.deleted} deleted`));
        }

        return parts.join(', ');
    }
}

module.exports = { FileTree };
