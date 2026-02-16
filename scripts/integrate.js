const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');
const chalk = require('chalk');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BIN_PATH = path.join(PROJECT_ROOT, 'src', 'cli', 'index.js');
const AG_BAT_PATH = path.join(PROJECT_ROOT, 'bin', 'ag.bat');
const AD_BAT_PATH = path.join(PROJECT_ROOT, 'bin', 'antigravity.bat');

async function main() {
    console.log(chalk.magenta.bold('\n🚀 Antigravity-Code Integration Setup\n'));

    try {
        // 1. Ensure bin directory exists
        const binDir = path.join(PROJECT_ROOT, 'bin');
        await fs.mkdir(binDir, { recursive: true });

        // 2. Create batch files for Windows
        console.log(chalk.cyan('📝 Creating shell aliases...'));

        const batContent = `@echo off\r\nnode "${BIN_PATH}" %*`;

        await fs.writeFile(AG_BAT_PATH, batContent);
        await fs.writeFile(AD_BAT_PATH, batContent);

        console.log(chalk.green('✔ created ag.bat'));
        console.log(chalk.green('✔ created antigravity.bat'));

        // 3. Add to PATH (User specific)
        console.log(chalk.cyan('\n🔗 Adding to System PATH...'));

        const userPath = execSync('powershell -command "[Environment]::GetEnvironmentVariable(\'Path\', \'User\')"').toString().trim();

        if (!userPath.includes(binDir)) {
            console.log(chalk.yellow('  Adding bin directory to User PATH...'));

            // Use setx to update PATH persistently
            // Note: This only affects future terminal sessions
            execSync(`setx PATH "${userPath};${binDir}"`);

            console.log(chalk.green('✔ PATH updated successfully'));
            console.log(chalk.gray('  (You may need to restart your terminal)'));
        } else {
            console.log(chalk.green('✔ Already in PATH'));
        }

        console.log(chalk.magenta.bold('\n✨ Integration Complete!'));
        console.log(chalk.white('You can now run:'));
        console.log(chalk.cyan('  ag'));
        console.log(chalk.cyan('  antigravity'));

    } catch (error) {
        console.error(chalk.red('\n✖ Integration failed:'), error.message);
        process.exit(1);
    }
}

main();
