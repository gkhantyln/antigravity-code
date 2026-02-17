const { LocalResult } = require('@modelcontextprotocol/sdk/types');
const { Server } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');
const { logger } = require('../utils/logger');
const { AntigravityEngine } = require('../core/engine');

/**
 * Antigravity MCP Server
 * Exposes core capabilities to IDEs like Cursor/Windsurf
 */
class AntigravityMCPServer {
    constructor() {
        this.engine = new AntigravityEngine();
        this.server = new Server({
            name: 'antigravity-code',
            version: '2.0.0',
        }, {
            capabilities: {
                tools: {},
                resources: {},
            },
        });
    }

    async start() {
        await this.engine.initialize();

        this.setupTools();

        const transport = new StdioServerTransport();
        await this.server.connect(transport);

        logger.info('MCP Server started on stdio');
    }

    setupTools() {
        // Expose 'ask_antigravity' tool
        this.server.setRequestHandler('call_tool', async (request) => {
            if (request.params.name === 'ask_antigravity') {
                const query = request.params.arguments.query;
                try {
                    const response = await this.engine.processRequest(query);
                    return {
                        content: [{ type: 'text', text: response.content }],
                    };
                } catch (error) {
                    return {
                        content: [{ type: 'text', text: `Error: ${error.message}` }],
                        isError: true,
                    };
                }
            }
            throw new Error('Tool not found');
        });

        // List tools
        this.server.setRequestHandler('list_tools', async () => {
            return {
                tools: [
                    {
                        name: 'ask_antigravity',
                        description: 'Ask the Antigravity AI Agent to perform a task or answer a question',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: { type: 'string', description: 'The task or question' },
                            },
                            required: ['query'],
                        },
                    },
                ],
            };
        });
    }
}

// Start if run directly
if (require.main === module) {
    const server = new AntigravityMCPServer();
    server.start().catch(console.error);
}

module.exports = { AntigravityMCPServer };
