const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);
const { logger } = require('../../utils/logger');

class GitTool {
    constructor() {
        this.cwd = process.cwd();
    }

    async run(command) {
        try {
            const { stdout } = await execAsync(command, { cwd: this.cwd });
            return stdout.trim();
        } catch (error) {
            logger.error(`Git command failed: ${command}`, { error: error.message });
            throw error;
        }
    }

    async status() {
        return this.run('git status --porcelain');
    }

    async diff(staged = false) {
        const flag = staged ? '--staged' : '';
        return this.run(`git diff ${flag}`);
    }

    async add(files = '.') {
        return this.run(`git add ${files}`);
    }

    async commit(message) {
        // Escape quotes in message to prevent shell issues
        const escapedMessage = message.replace(/"/g, '\\"');
        return this.run(`git commit -m "${escapedMessage}"`);
    }

    async log(limit = 5) {
        return this.run(`git log -n ${limit} --oneline`);
    }

    async getCurrentBranch() {
        return this.run('git rev-parse --abbrev-ref HEAD');
    }
}

module.exports = { GitTool };
