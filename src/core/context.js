const { logger } = require('../utils/logger');
const { generateId } = require('../utils/storage');

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
    async addAssistantMessage(content, provider, model, tokens) {
        if (!this.currentConversationId) {
            await this.createConversation();
        }

        await this.database.addMessage(
            this.currentConversationId,
            'assistant',
            content,
            provider,
            model,
            tokens
        );

        logger.debug('Assistant message added', {
            conversationId: this.currentConversationId,
            provider,
            model,
            tokens,
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
        const formattedMessages = chronologicalMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
        }));

        return {
            conversationId: this.currentConversationId,
            messages: formattedMessages,
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
    clearConversation() {
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
}

module.exports = { ContextManager };
