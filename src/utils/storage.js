const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { logger } = require('./logger');

/**
 * Generate unique ID
 */
function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Database wrapper class
 */
class Database {
    constructor(dbPath) {
        this.dbPath = dbPath || path.join(os.homedir(), '.antigravity', 'data.db');
        this.db = null;
    }

    /**
     * Initialize database connection and create tables
     */
    async initialize() {
        // Ensure directory exists
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, async err => {
                if (err) {
                    logger.error('Failed to open database', { error: err.message });
                    reject(err);
                    return;
                }

                logger.info('Database connected', { path: this.dbPath });

                // Promisify methods
                this.run = promisify(this.db.run.bind(this.db));
                this.get = promisify(this.db.get.bind(this.db));
                this.all = promisify(this.db.all.bind(this.db));

                try {
                    await this.createTables();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Create database tables
     */
    async createTables() {
        // Conversations table
        await this.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        title TEXT,
        metadata TEXT
      )
    `);

        await this.run(`
      CREATE INDEX IF NOT EXISTS idx_conversations_updated 
      ON conversations(updated_at DESC)
    `);

        // Messages table
        await this.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        provider TEXT,
        model TEXT,
        tokens INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      )
    `);

        await this.run(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation 
      ON messages(conversation_id, created_at)
    `);

        // Context files table
        await this.run(`
      CREATE TABLE IF NOT EXISTS context_files (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        content TEXT,
        language TEXT,
        size INTEGER,
        last_modified DATETIME,
        relevance_score REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      )
    `);

        // API logs table
        await this.run(`
      CREATE TABLE IF NOT EXISTS api_logs (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        request_id TEXT,
        success BOOLEAN,
        status_code INTEGER,
        latency_ms INTEGER,
        tokens_used INTEGER,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await this.run(`
      CREATE INDEX IF NOT EXISTS idx_api_logs_provider 
      ON api_logs(provider, created_at DESC)
    `);

        // Config table
        await this.run(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Failover events table
        await this.run(`
      CREATE TABLE IF NOT EXISTS failover_events (
        id TEXT PRIMARY KEY,
        from_provider TEXT NOT NULL,
        to_provider TEXT NOT NULL,
        reason TEXT,
        context_size INTEGER,
        success BOOLEAN,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        logger.info('Database tables created');
    }

    /**
     * Create a new conversation
     */
    async createConversation(title = 'New Conversation', metadata = {}) {
        const id = generateId();
        await this.run(
            `INSERT INTO conversations (id, title, metadata) VALUES (?, ?, ?)`,
            [id, title, JSON.stringify(metadata)]
        );
        logger.debug('Conversation created', { id, title });
        return id;
    }

    /**
     * Get conversation by ID
     */
    async getConversation(id) {
        return this.get(`SELECT * FROM conversations WHERE id = ?`, [id]);
    }

    /**
     * Update conversation
     */
    async updateConversation(id, updates) {
        const { title, metadata } = updates;
        await this.run(
            `UPDATE conversations SET title = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [title, JSON.stringify(metadata), id]
        );
    }

    /**
     * Add message to conversation
     */
    async addMessage(conversationId, role, content, provider = null, model = null, tokens = null, metadata = {}) {
        const id = generateId();
        await this.run(
            `INSERT INTO messages (id, conversation_id, role, content, provider, model, tokens, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, conversationId, role, content, provider, model, tokens, JSON.stringify(metadata)]
        );

        // Update conversation timestamp
        await this.run(
            `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [conversationId]
        );

        logger.debug('Message added', { conversationId, role, provider });
        return id;
    }

    /**
     * Get messages for conversation
     */
    async getMessages(conversationId, limit = 50) {
        return this.all(
            `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?`,
            [conversationId, limit]
        );
    }

    /**
     * Log API call
     */
    async logAPICall(log) {
        const id = generateId();
        await this.run(
            `INSERT INTO api_logs (id, provider, request_id, success, status_code, latency_ms, tokens_used, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                log.provider,
                log.requestId,
                log.success ? 1 : 0,
                log.statusCode,
                log.latencyMs,
                log.tokensUsed,
                log.errorMessage,
            ]
        );
    }

    /**
     * Log failover event
     */
    async logFailover(fromProvider, toProvider, reason, contextSize, success) {
        const id = generateId();
        await this.run(
            `INSERT INTO failover_events (id, from_provider, to_provider, reason, context_size, success)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [id, fromProvider, toProvider, reason, contextSize, success ? 1 : 0]
        );
        logger.info('Failover logged', { fromProvider, toProvider, reason });
    }

    /**
     * Get config value
     */
    async getConfig(key) {
        const row = await this.get(`SELECT value FROM config WHERE key = ?`, [key]);
        return row ? JSON.parse(row.value) : null;
    }

    /**
     * Set config value
     */
    async setConfig(key, value) {
        await this.run(`INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)`, [
            key,
            JSON.stringify(value),
        ]);
    }

    /**
     * Close database connection
     */
    async close() {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            this.db.close(err => {
                if (err) {
                    logger.error('Failed to close database', { error: err.message });
                    reject(err);
                } else {
                    logger.info('Database closed');
                    resolve();
                }
            });
        });
    }
}

module.exports = { Database, generateId };
