const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { logger } = require('./logger');

/**
 * Secure storage using Windows DPAPI
 */
class SecureStorage {
    constructor(storagePath) {
        this.storagePath =
            storagePath || path.join(os.homedir(), '.antigravity', 'keys.json');
        this.ensureStorageDir();
    }

    /**
     * Ensure storage directory exists
     */
    ensureStorageDir() {
        const dir = path.dirname(this.storagePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    /**
     * Encrypt and store API key using Windows DPAPI
     */
    async storeApiKey(provider, apiKey) {
        try {
            // Escape special characters for PowerShell
            const escapedKey = apiKey.replace(/"/g, '`"').replace(/'/g, "''");

            // Use PowerShell to encrypt with DPAPI
            const script = `
        Add-Type -AssemblyName System.Security
        $plaintext = "${escapedKey}"
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($plaintext)
        $encrypted = [System.Security.Cryptography.ProtectedData]::Protect(
          $bytes,
          $null,
          [System.Security.Cryptography.DataProtectionScope]::CurrentUser
        )
        [Convert]::ToBase64String($encrypted)
      `;

            const encrypted = execSync(`powershell -Command "${script}"`, {
                encoding: 'utf8',
                windowsHide: true,
            }).trim();

            // Store encrypted key
            const storage = this.loadStorage();
            storage[provider] = encrypted;
            this.saveStorage(storage);

            logger.info('API key stored', { provider });
            return true;
        } catch (error) {
            logger.error('Failed to store API key', { provider, error: error.message });
            throw new Error(`Failed to store API key: ${error.message}`);
        }
    }

    /**
     * Retrieve and decrypt API key
     */
    async getApiKey(provider) {
        try {
            const storage = this.loadStorage();
            const encrypted = storage[provider];

            if (!encrypted) {
                // Fallback: Try to read from .env file
                const envKey = this.getApiKeyFromEnv(provider);
                if (envKey) {
                    logger.info('API key loaded from .env file', { provider });
                    return envKey;
                }
                return null;
            }

            // Use PowerShell to decrypt with DPAPI
            const script = `
        Add-Type -AssemblyName System.Security
        $encrypted = [Convert]::FromBase64String("${encrypted}")
        $decrypted = [System.Security.Cryptography.ProtectedData]::Unprotect(
          $encrypted,
          $null,
          [System.Security.Cryptography.DataProtectionScope]::CurrentUser
        )
        [System.Text.Encoding]::UTF8.GetString($decrypted)
      `;

            const decrypted = execSync(`powershell -Command "${script}"`, {
                encoding: 'utf8',
                windowsHide: true,
            }).trim();

            return decrypted;
        } catch (error) {
            logger.error('Failed to retrieve API key', { provider, error: error.message });
            // Fallback: Try to read from .env file
            const envKey = this.getApiKeyFromEnv(provider);
            if (envKey) {
                logger.info('API key loaded from .env file (fallback)', { provider });
                return envKey;
            }
            throw new Error(`Failed to retrieve API key: ${error.message}`);
        }
    }

    /**
     * Get API key from environment variables
     */
    getApiKeyFromEnv(provider) {
        const envVars = {
            gemini: 'GEMINI_API_KEY',
            claude: 'CLAUDE_API_KEY',
            openai: 'OPENAI_API_KEY',
        };

        const envVar = envVars[provider];
        if (!envVar) {
            return null;
        }

        return (process.env[envVar] || '').trim() || null;
    }

    /**
     * Delete stored API key
     */
    async deleteApiKey(provider) {
        const storage = this.loadStorage();
        delete storage[provider];
        this.saveStorage(storage);
        logger.info('API key deleted', { provider });
    }

    /**
     * List stored providers
     */
    listProviders() {
        const storage = this.loadStorage();
        return Object.keys(storage);
    }

    /**
     * Check if provider has stored key
     */
    hasApiKey(provider) {
        const storage = this.loadStorage();
        return !!storage[provider];
    }

    /**
     * Load storage file
     */
    loadStorage() {
        if (!fs.existsSync(this.storagePath)) {
            return {};
        }
        try {
            const content = fs.readFileSync(this.storagePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            logger.error('Failed to load storage', { error: error.message });
            return {};
        }
    }

    /**
     * Save storage file
     */
    saveStorage(storage) {
        try {
            fs.writeFileSync(this.storagePath, JSON.stringify(storage, null, 2));
        } catch (error) {
            logger.error('Failed to save storage', { error: error.message });
            throw error;
        }
    }
}

/**
 * Validate API key format
 */
function validateApiKey(provider, apiKey) {
    const patterns = {
        claude: /^sk-ant-[a-zA-Z0-9-_]{95}$/,
        gemini: /^AIza[a-zA-Z0-9_-]{35}$/,
        openai: /^sk-[a-zA-Z0-9]{48}$/,
    };

    const pattern = patterns[provider];
    if (!pattern) {
        logger.warn('Unknown provider for validation', { provider });
        return true; // Allow unknown providers
    }

    return pattern.test(apiKey);
}

// Create singleton instance
const secureStorage = new SecureStorage();

module.exports = { SecureStorage, secureStorage, validateApiKey };
