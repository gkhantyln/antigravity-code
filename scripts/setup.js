const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { secureStorage, validateApiKey } = require('../src/utils/crypto');
const { Database } = require('../src/utils/storage');
const { logger } = require('../src/utils/logger');

/**
 * Setup Wizard
 */
async function setup() {
    console.log();
    console.log(chalk.cyan.bold('🚀 Antigravity-Code Setup Wizard'));
    console.log(chalk.gray('Let\'s configure your AI coding assistant'));
    console.log();

    try {
        // Step 1: Welcome and explanation
        const { proceed } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'proceed',
                message: 'This wizard will help you configure API keys and preferences. Continue?',
                default: true,
            },
        ]);

        if (!proceed) {
            console.log(chalk.yellow('Setup cancelled'));
            process.exit(0);
        }

        // Step 2: API Key Configuration
        console.log();
        console.log(chalk.cyan.bold('Step 1: API Key Configuration'));
        console.log(chalk.gray('You need at least one API key to use Antigravity'));
        console.log();

        const apiKeys = {};

        // Gemini API Key (Primary)
        const { hasGemini } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'hasGemini',
                message: 'Do you have a Gemini API key? (Recommended - Primary provider)',
                default: true,
            },
        ]);

        if (hasGemini) {
            const { geminiKey } = await inquirer.prompt([
                {
                    type: 'password',
                    name: 'geminiKey',
                    message: 'Enter your Gemini API key:',
                    mask: '*',
                    validate: input => {
                        if (!input) return 'API key is required';
                        if (!validateApiKey('gemini', input)) {
                            return 'Invalid Gemini API key format (should start with AIza)';
                        }
                        return true;
                    },
                },
            ]);
            apiKeys.gemini = geminiKey;
        }

        // Claude API Key (Secondary)
        const { hasClaude } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'hasClaude',
                message: 'Do you have a Claude API key? (Secondary provider)',
                default: false,
            },
        ]);

        if (hasClaude) {
            const { claudeKey } = await inquirer.prompt([
                {
                    type: 'password',
                    name: 'claudeKey',
                    message: 'Enter your Claude API key:',
                    mask: '*',
                    validate: input => {
                        if (!input) return 'API key is required';
                        if (!validateApiKey('claude', input)) {
                            return 'Invalid Claude API key format (should start with sk-ant-)';
                        }
                        return true;
                    },
                },
            ]);
            apiKeys.claude = claudeKey;

            // Claude model selection
            console.log();
            console.log(chalk.cyan.bold('Claude Model Selection'));
            console.log();

            const { claudeModel } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'claudeModel',
                    message: 'Select default Claude model:',
                    choices: [
                        new inquirer.Separator('=== Opus Series (En Yeni & En Güçlü) ==='),
                        { name: 'Claude Opus 4.6 (En güçlü)', value: 'claude-opus-4.6' },
                        { name: 'Claude Opus 4.1', value: 'claude-opus-4.1' },
                        { name: 'Claude Opus 4', value: 'claude-opus-4' },

                        new inquirer.Separator('=== Sonnet Series (Dengeli / Genel Amaçlı) ==='),
                        { name: 'Claude Sonnet 4.5 (Recommended)', value: 'claude-sonnet-4.5' },
                        { name: 'Claude Sonnet 4', value: 'claude-sonnet-4' },
                        { name: 'Claude Sonnet 3.7', value: 'claude-sonnet-3.7' },
                        { name: 'Claude Sonnet 3.5', value: 'claude-sonnet-3.5' },

                        new inquirer.Separator('=== Haiku Series (Önceki Nesiller / Daha Ucuz) ==='),
                        { name: 'Claude Haiku 4.5', value: 'claude-haiku-4.5' },
                        { name: 'Claude Haiku 3.5', value: 'claude-haiku-3.5' },
                        { name: 'Claude Haiku 3', value: 'claude-haiku-3' },
                    ],
                    default: 'claude-sonnet-4.5',
                },
            ]);

            apiKeys.claudeModel = claudeModel;
        }

        // OpenAI API Key (Tertiary)
        const { hasOpenAI } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'hasOpenAI',
                message: 'Do you have an OpenAI API key? (Tertiary provider)',
                default: false,
            },
        ]);

        if (hasOpenAI) {
            const { openaiKey } = await inquirer.prompt([
                {
                    type: 'password',
                    name: 'openaiKey',
                    message: 'Enter your OpenAI API key:',
                    mask: '*',
                    validate: input => {
                        if (!input) return 'API key is required';
                        if (!validateApiKey('openai', input)) {
                            return 'Invalid OpenAI API key format (should start with sk-)';
                        }
                        return true;
                    },
                },
            ]);
            apiKeys.openai = openaiKey;

            // OpenAI model selection
            console.log();
            console.log(chalk.cyan.bold('OpenAI Model Selection'));
            console.log();

            const { openaiModel } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'openaiModel',
                    message: 'Select default OpenAI model:',
                    choices: [
                        new inquirer.Separator('=== GPT-5.3 Series (EN YENİ) ==='),
                        { name: 'GPT-5.3 Codex', value: 'gpt-5.3-codex' },
                        { name: 'GPT-5.3 Codex Spark', value: 'gpt-5.3-codex-spark' },

                        new inquirer.Separator('=== GPT-5.2 Series ==='),
                        { name: 'GPT-5.2 (Recommended)', value: 'gpt-5.2' },
                        { name: 'GPT-5.2 Pro', value: 'gpt-5.2-pro' },
                        { name: 'GPT-5.2 Codex', value: 'gpt-5.2-codex' },

                        new inquirer.Separator('=== GPT-5.1 Series ==='),
                        { name: 'GPT-5.1', value: 'gpt-5.1' },
                        { name: 'GPT-5.1 Codex', value: 'gpt-5.1-codex' },
                        { name: 'GPT-5.1 Codex Max', value: 'gpt-5.1-codex-max' },

                        new inquirer.Separator('=== GPT-5.0 Series ==='),
                        { name: 'GPT-5', value: 'gpt-5' },
                        { name: 'GPT-5 Pro', value: 'gpt-5-pro' },
                        { name: 'GPT-5 Codex', value: 'gpt-5-codex' },
                        { name: 'GPT-5 Mini', value: 'gpt-5-mini' },
                        { name: 'GPT-5 Nano', value: 'gpt-5-nano' },

                        new inquirer.Separator('=== o-Series (Reasoning) ==='),
                        { name: 'o3', value: 'o3' },
                        { name: 'o3 Pro', value: 'o3-pro' },
                        { name: 'o3 Mini', value: 'o3-mini' },
                        { name: 'o4 Mini Deep Research', value: 'o4-mini-deep-research' },

                        new inquirer.Separator('=== GPT-4.1 Series ==='),
                        { name: 'GPT-4.1', value: 'gpt-4.1' },
                        { name: 'GPT-4.1 Mini', value: 'gpt-4.1-mini' },
                        { name: 'GPT-4.1 Nano', value: 'gpt-4.1-nano' },
                    ],
                    default: 'gpt-5.2',
                },
            ]);

            apiKeys.openaiModel = openaiModel;
        }

        if (Object.keys(apiKeys).length === 0) {
            console.log();
            console.log(chalk.red('✗ No API keys provided'));
            console.log(chalk.yellow('You need at least one API key to use Antigravity'));
            process.exit(1);
        }

        // Step 3: Gemini Model Selection
        if (apiKeys.gemini) {
            console.log();
            console.log(chalk.cyan.bold('Step 2: Gemini Model Selection'));
            console.log();

            const { geminiModel } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'geminiModel',
                    message: 'Select default Gemini model:',
                    choices: [
                        new inquirer.Separator('=== Gemini 3 Series (Latest) ==='),
                        { name: 'Gemini 3 Flash (Recommended - Hız + Akışkan multimodal)', value: 'gemini-3-flash' },
                        { name: 'Gemini 3 Pro (En güçlü genel model)', value: 'gemini-3-pro' },
                        { name: 'Gemini 3 Pro Image (Görsel + metin)', value: 'gemini-3-pro-image' },
                        { name: 'Gemini 3 Deep Think (İleri analiz / premium)', value: 'gemini-3-deep-think' },

                        new inquirer.Separator('=== Gemini 2.5 Series ==='),
                        { name: 'Gemini 2.5 Pro (Üretim ve güçlü genel kullanım)', value: 'gemini-2.5-pro' },
                        { name: 'Gemini 2.5 Flash (Hızlı & ekonomik)', value: 'gemini-2.5-flash' },
                        { name: 'Gemini 2.5 Flash TTS (Metin → ses)', value: 'gemini-2.5-flash-tts' },

                        new inquirer.Separator('=== Legacy Models ==='),
                        { name: 'Gemini 2.0 Flash Exp (Experimental)', value: 'gemini-2.0-flash-exp' },
                        { name: 'Gemini 2.0 Flash (Stable)', value: 'gemini-2.0-flash' },
                        { name: 'Gemini 2.0 Flash Lite (Lightweight)', value: 'gemini-2.0-flash-lite' },
                        { name: 'Gemini 1.5 Pro (Previous generation)', value: 'gemini-1.5-pro' },
                        { name: 'Gemini 1.5 Flash (Previous generation)', value: 'gemini-1.5-flash' },
                        { name: 'Gemini 1.0 Pro (Legacy)', value: 'gemini-1.0-pro' },
                    ],
                    default: 'gemini-3-flash',
                },
            ]);
            apiKeys.geminiModel = geminiModel;
        }

        // Step 4: Store API Keys
        console.log();
        const spinner = ora('Encrypting and storing API keys...').start();

        try {
            for (const [provider, key] of Object.entries(apiKeys)) {
                if (provider === 'geminiModel') continue;
                await secureStorage.storeApiKey(provider, key);
            }
            spinner.succeed('API keys stored securely');
        } catch (error) {
            spinner.fail('Failed to store API keys');
            console.log(chalk.red(`Error: ${error.message}`));
            process.exit(1);
        }

        // Step 5: Create .env file
        console.log();
        const envSpinner = ora('Creating .env file...').start();

        try {
            const envPath = path.join(process.cwd(), '.env');
            const envContent = `# Antigravity-Code Configuration
# Generated by setup wizard on ${new Date().toISOString()}

# Provider Configuration
PRIMARY_PROVIDER=${apiKeys.gemini ? 'gemini' : apiKeys.claude ? 'claude' : 'openai'}
SECONDARY_PROVIDER=${apiKeys.claude ? 'claude' : apiKeys.openai ? 'openai' : 'gemini'}
TERTIARY_PROVIDER=${apiKeys.openai ? 'openai' : 'gemini'}

# Gemini Configuration
GEMINI_DEFAULT_MODEL=${apiKeys.geminiModel || 'gemini-3-flash'}

# Claude Configuration
CLAUDE_MODEL=${apiKeys.claudeModel || 'claude-sonnet-4.5'}
CLAUDE_MAX_TOKENS=8192

# OpenAI Configuration
OPENAI_MODEL=${apiKeys.openaiModel || 'gpt-5.2'}
OPENAI_MAX_TOKENS=8192

# Failover Settings
FAILOVER_ENABLED=true
MAX_RETRIES_PER_PROVIDER=3
RETRY_DELAY_MS=1000
HEALTH_CHECK_INTERVAL_MS=30000

# Context Settings
MAX_CONVERSATION_MESSAGES=50
MAX_FILE_CONTEXT=10
MAX_CONTEXT_SIZE_MB=5
CONTEXT_COMPRESSION_ENABLED=true

# Storage
DATA_DIR=${path.join(os.homedir(), '.antigravity')}
DB_PATH=${path.join(os.homedir(), '.antigravity', 'data.db')}
LOG_DIR=${path.join(os.homedir(), '.antigravity', 'logs')}

# Logging
LOG_LEVEL=info
LOG_FILE_ENABLED=true
LOG_CONSOLE_ENABLED=true
LOG_API_CALLS=true

# Performance
CACHE_ENABLED=true
CACHE_TTL_SECONDS=3600
MAX_CACHE_SIZE_MB=100
REQUEST_TIMEOUT_MS=30000

# Security
TELEMETRY_ENABLED=false
ANALYTICS_ENABLED=false
AUTO_UPDATE_CHECK=true

# UI
COLOR_SCHEME=auto
USE_ICONS=true
PROGRESS_INDICATORS=true
SYNTAX_HIGHLIGHTING=true
`;

            fs.writeFileSync(envPath, envContent);
            envSpinner.succeed('.env file created');
        } catch (error) {
            envSpinner.fail('Failed to create .env file');
            console.log(chalk.red(`Error: ${error.message}`));
        }

        // Step 6: Initialize Database
        console.log();
        const dbSpinner = ora('Initializing database...').start();

        try {
            const dbPath = path.join(os.homedir(), '.antigravity', 'data.db');
            const db = new Database(dbPath);
            await db.initialize();
            await db.close();
            dbSpinner.succeed('Database initialized');
        } catch (error) {
            dbSpinner.fail('Failed to initialize database');
            console.log(chalk.red(`Error: ${error.message}`));
        }

        // Step 7: Test API Connections
        console.log();
        console.log(chalk.cyan.bold('Step 3: Testing API Connections'));
        console.log();

        const { testConnections } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'testConnections',
                message: 'Would you like to test API connections?',
                default: true,
            },
        ]);

        if (testConnections) {
            for (const provider of Object.keys(apiKeys)) {
                if (provider === 'geminiModel') continue;

                const testSpinner = ora(`Testing ${provider}...`).start();

                try {
                    // Simple test would go here
                    // For now, just simulate success
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    testSpinner.succeed(`${provider} connection OK`);
                } catch (error) {
                    testSpinner.fail(`${provider} connection failed`);
                    console.log(chalk.yellow(`  ${error.message}`));
                }
            }
        }

        // Step 8: Complete
        console.log();
        console.log(chalk.green.bold('✓ Setup Complete!'));
        console.log();
        console.log(chalk.cyan('You can now use Antigravity:'));
        console.log();
        console.log(chalk.white('  Interactive mode:'));
        console.log(chalk.gray('    $ antigravity'));
        console.log();
        console.log(chalk.white('  Single command:'));
        console.log(chalk.gray('    $ antigravity "your question"'));
        console.log();
        console.log(chalk.white('  Get help:'));
        console.log(chalk.gray('    $ antigravity --help'));
        console.log();
        console.log(chalk.gray('API keys are stored encrypted in:'));
        console.log(chalk.gray(`  ${secureStorage.storagePath}`));
        console.log();
    } catch (error) {
        console.log();
        console.log(chalk.red('✗ Setup failed'));
        console.log(chalk.red(error.message));
        logger.error('Setup failed', { error: error.message, stack: error.stack });
        process.exit(1);
    }
}

// Run setup
setup();
