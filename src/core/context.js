const fs = require('fs').promises;
const { logger } = require('../utils/logger');


const { CodeRetriever } = require('./rag/retriever');

/**
 * Context Manager
 * Manages conversation history and file context
 */
class ContextManager {
    constructor(database) {
        this.database = database;
        this.currentConversationId = null;
        this.maxMessages = 50;
        this.maxFileContext = 10;
        this.maxContextSizeMB = 5;
        this.retriever = new CodeRetriever();
    }

    /**
     * Create a new conversation
     */
    async createConversation(title = 'New Conversation') {
        this.currentConversationId = await this.database.createConversation(title);
        logger.info('Conversation created', { id: this.currentConversationId });
        return this.currentConversationId;
    }

    /**
     * Load existing conversation
     */
    async loadConversation(conversationId) {
        const conversation = await this.database.getConversation(conversationId);

        if (!conversation) {
            throw new Error(`Conversation not found: ${conversationId}`);
        }

        this.currentConversationId = conversationId;
        logger.info('Conversation loaded', { id: conversationId });
        return conversation;
    }

    /**
     * Add user message to conversation
     */
    async addUserMessage(content) {
        if (!this.currentConversationId) {
            await this.createConversation();
        }

        await this.database.addMessage(
            this.currentConversationId,
            'user',
            content
        );

        logger.debug('User message added', {
            conversationId: this.currentConversationId,
            length: content.length,
        });
    }

    /**
     * Add assistant message to conversation
     */
    async addAssistantMessage(content, provider, model, tokens, toolCalls = null) {
        if (!this.currentConversationId) {
            await this.createConversation();
        }

        const metadata = toolCalls ? { toolCalls } : {};

        await this.database.addMessage(
            this.currentConversationId,
            'assistant',
            content || '', // Content might be empty if it's just a tool call
            provider,
            model,
            tokens,
            metadata
        );

        logger.debug('Assistant message added', {
            conversationId: this.currentConversationId,
            provider,
            model,
            tokens,
            hasToolCalls: !!toolCalls
        });
    }

    /**
     * Add tool result message to conversation
     */
    async addToolResultMessage(toolCallId, toolName, result) {
        if (!this.currentConversationId) {
            await this.createConversation();
        }

        // We use 'system' role for tool results (to satisfy DB constraints)
        // detailed info is in metadata
        await this.database.addMessage(
            this.currentConversationId,
            'system',
            typeof result === 'string' ? result : JSON.stringify(result),
            'system',
            null,
            0,
            { type: 'tool_result', toolCallId, toolName }
        );

        logger.debug('Tool result message added', {
            conversationId: this.currentConversationId,
            toolCallId,
            toolName,
        });
    }

    /**
     * Get conversation context
     */
    async getContext(limit = null) {
        if (!this.currentConversationId) {
            return { messages: [] };
        }

        const messageLimit = limit || this.maxMessages;
        const messages = await this.database.getMessages(
            this.currentConversationId,
            messageLimit
        );

        // Reverse to get chronological order
        const chronologicalMessages = messages.reverse();

        // Format messages for API
        const formattedMessages = chronologicalMessages.map(msg => {
            let metadata = {};
            try {
                metadata = JSON.parse(msg.metadata || '{}');
            } catch (e) {
                logger.warn('Failed to parse message metadata', { id: msg.id });
            }

            return {
                role: msg.role,
                content: msg.content,
                metadata,
            };
        });

        // Fetch relevant code chunks via RAG
        let relevantCode = [];
        try {
            // Find user query from the last message
            const lastUserMessage = chronologicalMessages
                .filter(m => m.role === 'user')
                .pop();

            if (lastUserMessage) {
                await this.retriever.initialize();
                relevantCode = await this.retriever.findRelevant(lastUserMessage.content);
            }
        } catch (error) {
            logger.warn('Failed to retrieve relevant code', { error: error.message });
        }

        return {
            conversationId: this.currentConversationId,
            messages: formattedMessages,
            relevantCode // Add RAG context
        };
    }

    /**
     * Serialize context for failover
     */
    async serializeContext() {
        const context = await this.getContext();

        const serialized = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            conversationId: this.currentConversationId,
            messages: context.messages,
        };

        const json = JSON.stringify(serialized);
        const sizeKB = Buffer.byteLength(json, 'utf8') / 1024;

        logger.debug('Context serialized', {
            conversationId: this.currentConversationId,
            messages: context.messages.length,
            sizeKB: sizeKB.toFixed(2),
        });

        return serialized;
    }

    /**
     * Deserialize context after failover
     */
    async deserializeContext(serialized) {
        if (!serialized || serialized.version !== '1.0') {
            throw new Error('Invalid serialized context');
        }

        this.currentConversationId = serialized.conversationId;

        logger.debug('Context deserialized', {
            conversationId: this.currentConversationId,
            messages: serialized.messages.length,
        });

        return {
            conversationId: this.currentConversationId,
            messages: serialized.messages,
        };
    }

    /**
     * Compress context if too large
     */
    async compressContext(context) {
        const json = JSON.stringify(context);
        const sizeMB = Buffer.byteLength(json, 'utf8') / (1024 * 1024);

        if (sizeMB <= this.maxContextSizeMB) {
            return context;
        }

        logger.warn('Context too large, compressing', {
            sizeMB: sizeMB.toFixed(2),
            maxSizeMB: this.maxContextSizeMB,
        });

        // Keep only recent messages
        const compressedMessages = context.messages.slice(-this.maxMessages);

        return {
            ...context,
            messages: compressedMessages,
            compressed: true,
        };
    }

    /**
     * Clear current conversation
     */
    async clearConversation() {
        this.currentConversationId = null;
        logger.info('Conversation cleared');
    }

    /**
     * Get conversation summary
     */
    async getConversationSummary() {
        if (!this.currentConversationId) {
            return null;
        }

        const conversation = await this.database.getConversation(this.currentConversationId);
        const messages = await this.database.getMessages(this.currentConversationId);

        return {
            id: conversation.id,
            title: conversation.title,
            messageCount: messages.length,
            createdAt: conversation.created_at,
            updatedAt: conversation.updated_at,
        };
    }

    /**
     * Detect project type based on files
     */
    async detectProjectType(dir = process.cwd()) {
        try {
            const files = await fs.readdir(dir);

            if (files.includes('package.json')) return 'Node.js';
            if (files.includes('requirements.txt') || files.includes('pyproject.toml')) return 'Python';
            if (files.includes('Cargo.toml')) return 'Rust';
            if (files.includes('go.mod')) return 'Go';
            if (files.includes('pom.xml') || files.includes('build.gradle')) return 'Java';
            if (files.includes('composer.json')) return 'PHP';
            if (files.includes('Gemfile')) return 'Ruby';

            return 'Unknown';
        } catch (error) {
            logger.warn('Failed to detect project type', { error: error.message });
            return 'Unknown';
        }
    }

    /**
     * Get project context summary
     */
    async getProjectContext() {
        const type = await this.detectProjectType();
        return `Project Type: ${type}\nWorking Directory: ${process.cwd()}`;
    }
}

module.exports = { ContextManager };
