#!/usr/bin/env node

const { Command } = require('commander');
const readline = require('readline');
const { AntigravityEngine } = require('../core/engine');
const { CommandHandler } = require('./commands');
const ui = require('./ui');
const { logger } = require('../utils/logger');
const packageJson = require('../../package.json');

const program = new Command();

/**
 * Interactive REPL mode
 */
async function interactiveMode() {
    const engine = new AntigravityEngine();
    const commandHandler = new CommandHandler(engine);

    try {
        // Initialize engine
        // (Spinner removed to avoid clearing dashboard immediately, or handled inside dashboard flow if needed)
        // For now, we'll keep the spinner but clear after
        ui.startSpinner('Initializing Antigravity Engine...', 'magenta');
        await engine.initialize();
        ui.stopSpinnerSuccess('Engine Ready');

        // Show connection info
        // Show Dashboard
        const provider = engine.getCurrentProvider();
        ui.showDashboard(provider, provider.model);

        // Create readline interface
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: `${ui.theme.accent('> ')} `,
        });

        // Main REPL loop
        const processInput = async input => {
            const trimmed = input.trim();

            if (!trimmed) {
                const currentProvider = engine.getCurrentProvider();
                ui.printPromptTop({ cwd: process.cwd(), provider: currentProvider });
                rl.prompt();
                return;
            }

            // Check if it's a command
            if (commandHandler.isCommand(trimmed)) {
                try {
                    const result = await commandHandler.executeCommand(trimmed);
                    if (result === 'exit') {
                        rl.close();
                        process.exit(0);
                    }
                } catch (error) {
                    ui.error(error.message);
                }

                const currentProvider = engine.getCurrentProvider();
                ui.printPromptTop({ cwd: process.cwd(), provider: currentProvider });
                rl.prompt();
                return;
            }

            // Regular message - send to AI
            try {
                ui.startSpinner('Thinking...', 'cyan');

                const response = await engine.processRequest(trimmed);

                ui.stopSpinnerSuccess('Response received');

                // Show AI Header
                console.log(ui.formatAIHeader(response.provider, response.model));

                // Render Markdown content
                ui.renderMarkdown(response.content);

            } catch (error) {
                ui.stopSpinnerFail('Request Failed');
                ui.error(error.message);
                logger.error('Request failed', { error: error.message });
            }

            const currentProvider = engine.getCurrentProvider();
            ui.printPromptTop({ cwd: process.cwd(), provider: currentProvider });
            rl.prompt();
        };

        // Handle input
        rl.on('line', async input => {
            ui.printPromptBottom();
            await processInput(input);
        });

        // Handle close
        rl.on('close', async () => {
            console.log();
            ui.info('Shutting down... Goodbye!');
            await engine.shutdown();
            process.exit(0);
        });

        // Show initial prompt
        ui.printPromptTop({ cwd: process.cwd(), provider });
        rl.prompt();

    } catch (error) {
        ui.stopSpinnerFail('Initialization Failed');
        ui.error(error.message);
        logger.error('Initialization failed', { error: error.message });
        process.exit(1);
    }
}

/**
 * Single command mode
 */
async function singleCommandMode(message) {
    const engine = new AntigravityEngine();
    const commandHandler = new CommandHandler(engine);

    try {
        ui.startSpinner('Initializing...', 'magenta');
        await engine.initialize();
        ui.stopSpinnerSuccess('Ready');

        // Check if input is a command
        if (commandHandler.isCommand(message)) {
            await commandHandler.executeCommand(message);
        } else {
            ui.startSpinner('Processing Request...', 'cyan');
            const response = await engine.processRequest(message);

            ui.stopSpinnerSuccess('Done');
            console.log(ui.formatAIHeader(response.provider, response.model));
            ui.renderMarkdown(response.content);
        }

        await engine.shutdown();
    } catch (error) {
        ui.stopSpinnerFail('Error');
        ui.error(error.message);
        logger.error('Command failed', { error: error.message });
        process.exit(1);
    }
}

/**
 * Pipe mode (read from stdin)
 */
async function pipeMode() {
    return new Promise((resolve, reject) => {
        let input = '';

        process.stdin.on('data', chunk => {
            input += chunk.toString();
        });

        process.stdin.on('end', async () => {
            if (!input.trim()) {
                ui.error('No input provided via pipe');
                process.exit(1);
            }

            try {
                await singleCommandMode(input.trim());
                resolve();
            } catch (error) {
                reject(error);
            }
        });

        process.stdin.on('error', reject);
    });
}

/**
 * Main CLI entry point
 */
async function main() {
    program
        .name('antigravity')
        .description('Multi-API AI Coding Assistant with Intelligent Failover')
        .version(packageJson.version)
        .argument('[args...]', 'Message to send to AI')
        .action(async (args) => {
            const message = args.join(' ');

            // Check if input is piped
            if (!process.stdin.isTTY && !message) {
                await pipeMode();
                return;
            }

            // Single command mode
            if (message) {
                await singleCommandMode(message);
                return;
            }

            // Interactive mode
            await interactiveMode();
        });

    await program.parseAsync(process.argv);
}

// Run CLI
main().catch(error => {
    ui.error(`Fatal error: ${error.message}`);
    logger.error('Fatal error', { error: error.message, stack: error.stack });
    process.exit(1);
});
