const { exec } = require('child_process');
const util = require('util');
const { logger } = require('../utils/logger');
const { configManager } = require('./config');

const execAsync = util.promisify(exec);

/**
 * Execution Provider Interface
 */
class ExecutionProvider {
    async execute(command, cwd) {
        throw new Error('Method execute() must be implemented');
    }
}

/**
 * Local Execution Provider
 * Executes commands on the host machine with safety checks
 */
class LocalExecutionProvider extends ExecutionProvider {
    constructor() {
        super();
        this.blocklist = [
            'rm -rf /',
            'rm -rf ~',
            'format c:',
            ':(){ :|:& };:', // Fork bomb
            '> /dev/sda',
            'mkfs',
            'dd if=/dev/zero'
        ];
    }

    async execute(command, cwd = process.cwd()) {
        const cmdTrimmed = command.trim();

        // Safety Check
        // This is a basic check, a real sandbox needs more robust parsing
        if (this.blocklist.some(blocked => cmdTrimmed.includes(blocked))) {
            throw new Error(`Command blocked for safety: ${command}`);
        }

        logger.debug(`[LocalExecution] Running: ${command} in ${cwd}`);
        return await execAsync(command, { cwd });
    }
}

/**
 * Docker Execution Provider
 * Executes commands inside a Docker container
 */
class DockerExecutionProvider extends ExecutionProvider {
    constructor(image = 'node:18-alpine') {
        super();
        this.image = image;
    }

    async execute(command, cwd = process.cwd()) {
        // We mount the current working directory to /app
        // and set working directory to /app
        // NOTE: This assumes 'cwd' is the project root or subfolder.
        // For simplicity, we mount process.cwd() to /app.

        const hostPath = process.cwd();
        const containerPath = '/app';

        // Construct Docker command
        // -v: Mount volume
        // -w: Workdir
        // --rm: Remove container after exit
        const dockerCmd = `docker run --rm -v "${hostPath}:${containerPath}" -w ${containerPath} ${this.image} /bin/sh -c "${command.replace(/"/g, '\\"')}"`;

        logger.debug(`[DockerExecution] Running: ${dockerCmd}`);
        return await execAsync(dockerCmd);
    }
}

/**
 * Execution Manager factory
 */
class ExecutionManager {
    static getProvider() {
        const mode = configManager.get('execution.mode') || 'local';
        const image = configManager.get('execution.dockerImage') || 'node:18-alpine';

        if (mode === 'docker') {
            return new DockerExecutionProvider(image);
        }
        return new LocalExecutionProvider();
    }
}

module.exports = {
    ExecutionProvider,
    LocalExecutionProvider,
    DockerExecutionProvider,
    ExecutionManager
};
