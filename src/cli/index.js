#!/usr/bin/env node

const { Command } = require('commander');
const inquirer = require('inquirer');
const readline = require('readline');
const { AntigravityEngine } = require('../core/engine');
const { CommandHandler } = require('./commands');
const { ui } = require('./ui');
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
        ui.startSpinner('Initializing Antigravity...');
        await engine.initialize();
        ui.succeedSpinner('Initialized');

        // Show welcome
        const provider = engine.getCurrentProvider();
        ui.welcome(packageJson.version, provider.name, provider.model);

        // Create readline interface
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '',
        });

        // Main REPL loop
        const processInput = async input => {
            const trimmed = input.trim();

            if (!trimmed) {
                ui.userPrompt();
                return;
            }

            // Check if it's a command
            if (commandHandler.isCommand(trimmed)) {
                const result = await commandHandler.executeCommand(trimmed);

                if (result === 'exit') {
                    rl.close();
                    return;
                }

                ui.userPrompt();
                return;
            }

            // Regular message - send to AI
            try {
                ui.startSpinner('Thinking...');

                const response = await engine.processRequest(trimmed);

                ui.stopSpinner();
                ui.aiResponse(response.content, response.provider, response.model);
            } catch (error) {
                ui.failSpinner('Error');
                ui.error(error.message);
                logger.error('Request failed', { error: error.message });
            }

            ui.userPrompt();
        };

        // Handle input
        rl.on('line', async input => {
            rl.pause();
            await processInput(input);
            rl.resume();
        });

        // Handle close
        rl.on('close', async () => {
            console.log();
            ui.info('Goodbye!');
            await engine.shutdown();
            process.exit(0);
        });

        // Handle Ctrl+C
        rl.on('SIGINT', () => {
            rl.close();
        });

        // Show initial prompt
        ui.userPrompt();
    } catch (error) {
        ui.failSpinner('Initialization failed');
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
        ui.startSpinner('Processing...');
        await engine.initialize();

        // Check if input is a command
        if (commandHandler.isCommand(message)) {
            ui.stopSpinner();
            await commandHandler.executeCommand(message);
        } else {
            const response = await engine.processRequest(message);

            ui.stopSpinner(); // Ensure spinner is stopped
            ui.succeedSpinner('Done');
            console.log();
            console.log(response.content);
            console.log();
        }

        await engine.shutdown();
    } catch (error) {
        ui.stopSpinner(); // Ensure spinner is stopped on error
        ui.failSpinner('Error');
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
                ui.error('No input provided');
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
        .option('-s, --stream', 'Stream response')
        .action(async (args, options) => {
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

    program.parse();
}

// Run CLI
main().catch(error => {
    ui.error(`Fatal error: ${error.message}`);
    logger.error('Fatal error', { error: error.message, stack: error.stack });
    process.exit(1);
});
