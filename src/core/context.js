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
     * Compact context intelligently
     * Removes old tool outputs and keeps important messages
     */
    async compactContext(context = null) {
        const ctx = context || await this.getContext();
        const json = JSON.stringify(ctx);
        const sizeMB = Buffer.byteLength(json, 'utf8') / (1024 * 1024);

        if (sizeMB <= this.maxContextSizeMB) {
            return ctx;
        }

        logger.warn('Context too large, compacting', {
            sizeMB: sizeMB.toFixed(2),
            maxSizeMB: this.maxContextSizeMB,
        });

        // Prioritize messages
        const prioritized = ctx.messages.map((msg, index) => {
            let priority = 0;

            // Keep all user messages (highest priority)
            if (msg.role === 'user') priority = 10;

            // Keep recent assistant messages
            if (msg.role === 'assistant') priority = 5;

            // Tool results have lower priority (can be summarized)
            if (msg.role === 'system' && msg.metadata?.type === 'tool_result') {
                priority = 1;
            }

            // Recent messages are more important
            const recencyBonus = index / ctx.messages.length;
            priority += recencyBonus * 3;

            return { ...msg, priority, index };
        });

        // Sort by priority and keep top messages
        const sorted = prioritized.sort((a, b) => b.priority - a.priority);
        const kept = sorted.slice(0, this.maxMessages);

        // Re-sort by original index to maintain chronological order
        const compactedMessages = kept.sort((a, b) => a.index - b.index).map(({ priority: _priority, index: _index, ...msg }) => msg);

        logger.info('Context compacted', {
            originalCount: ctx.messages.length,
            compactedCount: compactedMessages.length,
            originalSizeMB: sizeMB.toFixed(2)
        });

        return {
            ...ctx,
            messages: compactedMessages,
            compacted: true,
        };
    }

    /**
     * Get context size in tokens (approximate)
     */
    getContextSize(context) {
        const json = JSON.stringify(context);
        // Rough approximation: 1 token ≈ 4 characters
        return Math.ceil(json.length / 4);
    }

    /**
     * Clear current conversation
     */
    async clearConversation() {
        this.currentConversationId = null;
        logger.info('Conversation cleared');
    }

    /**
     * Fork current conversation
     * Creates a new conversation with all messages from the current one
     */
    async forkConversation(title = null) {
        if (!this.currentConversationId) {
            throw new Error('No active conversation to fork');
        }

        // Get current conversation
        const originalConversation = await this.database.getConversation(this.currentConversationId);
        const originalMessages = await this.database.getMessages(this.currentConversationId, 1000);

        // Create new conversation
        const forkTitle = title || `Fork of ${originalConversation.title}`;
        const newConversationId = await this.database.createConversation(forkTitle);

        // Copy all messages to new conversation
        for (const msg of originalMessages.reverse()) {
            let metadata = {};
            try {
                metadata = JSON.parse(msg.metadata || '{}');
            } catch (e) {
                // Ignore parse errors
            }

            await this.database.addMessage(
                newConversationId,
                msg.role,
                msg.content,
                msg.provider,
                msg.model,
                msg.tokens,
                metadata
            );
        }

        logger.info('Conversation forked', {
            originalId: this.currentConversationId,
            newId: newConversationId,
            messageCount: originalMessages.length
        });

        // Switch to forked conversation
        this.currentConversationId = newConversationId;

        return {
            originalId: originalConversation.id,
            newId: newConversationId,
            title: forkTitle,
            messageCount: originalMessages.length
        };
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
