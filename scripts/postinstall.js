const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

/**
 * Post-install script
 * Runs after npm install
 */
async function postInstall() {
    console.log();
    console.log(chalk.cyan('🚀 Antigravity-Code Post-Install'));
    console.log();

    try {
        // Create data directory
        const dataDir = path.join(os.homedir(), '.antigravity');

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log(chalk.green('✓'), `Created data directory: ${dataDir}`);
        }

        // Create logs directory
        const logsDir = path.join(dataDir, 'logs');

        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
            console.log(chalk.green('✓'), `Created logs directory: ${logsDir}`);
        }

        // Show next steps
        console.log();
        console.log(chalk.cyan.bold('Next Steps:'));
        console.log();
        console.log(chalk.white('1. Run setup wizard:'));
        console.log(chalk.gray('   $ npm run setup'));
        console.log();
        console.log(chalk.white('2. Or manually create .env file:'));
        console.log(chalk.gray('   $ cp .env.example .env'));
        console.log();
        console.log(chalk.white('3. Start using Antigravity:'));
        console.log(chalk.gray('   $ antigravity'));
        console.log();
    } catch (error) {
        console.log(chalk.red('✗ Post-install failed'));
        console.log(chalk.red(error.message));
        // Don't fail the install
    }
}

postInstall();
