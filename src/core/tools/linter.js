// eslint-disable-next-line import/no-extraneous-dependencies
const { ESLint } = require('eslint');
// eslint-disable-next-line import/no-extraneous-dependencies
const prettier = require('prettier');
const fs = require('fs').promises;
const { logger } = require('../../utils/logger');

class LintingTool {
    constructor() {
        this.eslint = new ESLint();
    }

    /**
     * Lint a file and return errors/warnings
     * @param {string} filePath 
     * @returns {Promise<Array>} Array of error messages
     */
    async lintFile(filePath) {
        try {
            const results = await this.eslint.lintFiles([filePath]);
            const formatter = await this.eslint.loadFormatter('stylish');
            const resultText = formatter.format(results);

            if (results[0].errorCount > 0 || results[0].warningCount > 0) {
                return {
                    valid: false,
                    output: resultText,
                    errors: results[0].messages.map(m => `Line ${m.line}: ${m.message} (${m.ruleId})`)
                };
            }

            return { valid: true, output: 'No linting errors found.' };
        } catch (error) {
            logger.error('Linting failed', { error: error.message });
            return { valid: false, output: `Linting tool failed: ${error.message}` };
        }
    }

    /**
     * Fix linting errors and format code
     * @param {string} filePath 
     */
    async fixFile(filePath) {
        try {
            // 1. ESLint Fix
            const results = await this.eslint.lintFiles([filePath]);
            await ESLint.outputFixes(results);

            // 2. Prettier Format
            const content = await fs.readFile(filePath, 'utf-8');
            const options = await prettier.resolveConfig(filePath) || {};
            const formatted = await prettier.format(content, { ...options, filepath: filePath });
            await fs.writeFile(filePath, formatted);

            logger.info(`Fixed and formatted: ${filePath}`);
            return true;
        } catch (error) {
            logger.error('Auto-fix failed', { error: error.message });
            return false;
        }
    }
}

module.exports = { LintingTool };
