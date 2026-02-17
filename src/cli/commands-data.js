/**
 * Centralized Command Definitions
 * used for generating help and validating commands
 */

const COMMANDS = [
    {
        name: '/agent',
        description: 'Manage AI Agents',
        usage: '/agent <action> [args]',
        example: '/agent create "ResearchAgent"',
        category: 'Agents',
        details: 'Create, list, and manage autonomous AI agents to perform complex tasks.'
    },
    {
        name: '/commit',
        description: 'Smart Commit with AI message generation',
        usage: '/commit [message]',
        example: '/commit "fix: update login logic"',
        category: 'Development',
        details: 'If no message is provided, AI analyzes your staged changes and suggests a conventional commit message.'
    },
    {
        name: '/config',
        description: 'View or modify configuration',
        usage: '/config <action>',
        example: '/config show',
        category: 'System',
        details: 'Manage tool settings, API keys, and other preferences. Actions: show, provider, set.'
    },
    {
        name: '/create',
        description: 'Generate code or files',
        usage: '/create <description>',
        example: '/create "A snake game in Python"',
        category: 'Development',
        details: 'Generates code based on your description and saves it to a file. Prompts for description if not provided.'
    },
    {
        name: '/debug',
        description: 'Analyze and fix errors',
        usage: '/debug <error_or_issue>',
        example: '/debug "TypeError: undefined is not a function in app.js"',
        category: 'Development',
        details: 'Analyzes the provided error message or issue description and suggests a fix. Can read files to understand context.'
    },
    {
        name: '/help',
        description: 'Show this help menu',
        usage: '/help [command]',
        example: '/help create',
        category: 'System',
        details: 'Displays a list of all available commands. Provide a command name to see detailed usage information.'
    },
    {
        name: '/index',
        description: 'Index codebase for RAG',
        usage: '/index',
        example: '/index',
        category: 'System',
        details: 'scans your codebase and creates a vector index to improve AI understanding of your project.'
    },
    {
        name: '/init',
        description: 'Initialize project structure',
        usage: '/init [path]',
        example: '/init .',
        category: 'System',
        details: 'Scaffolds a new project structure, including the .agent directory and default configuration files.'
    },
    {
        name: '/model',
        description: 'Change AI Model',
        usage: '/model <model_name>',
        example: '/model gemini-2.5-flash',
        category: 'Configuration',
        details: 'Switch between available AI models for the current provider.'
    },
    {
        name: '/new',
        description: 'Start a new conversation',
        usage: '/new [title]',
        example: '/new "Refactoring Database"',
        category: 'System',
        details: 'Resets the current conversation context and starts a new session. Ideally used when switching tasks.'
    },
    {
        name: '/provider',
        description: 'Switch AI Provider',
        usage: '/provider <name>',
        example: '/provider openai',
        category: 'Configuration',
        details: 'Switch between different AI providers (e.g., Gemini, OpenAI, Claude, Local).'
    },
    {
        name: '/see',
        description: 'Analyze an image',
        usage: '/see <path> [prompt]',
        example: '/see ./screenshot.png "What is this?"',
        category: 'Vision',
        details: 'Uses the AI vision capabilities to analyze an image and answer questions about it.'
    },
    {
        name: '/test',
        description: 'Generate unit tests',
        usage: '/test <filename>',
        example: '/test src/utils.js',
        category: 'Development',
        details: 'Generates comprehensive unit tests for the specified file.'
    },
    {
        name: '/ui',
        description: 'Convert screenshot to code',
        usage: '/ui <path>',
        example: '/ui ./design.png',
        category: 'Vision',
        details: 'Analyzes a UI screenshot and generates the corresponding HTML/CSS/React code.'
    },
    {
        name: '/clear',
        description: 'Clear the console',
        usage: '/clear',
        example: '/clear',
        category: 'System',
        details: 'Clears the terminal screen and redraws the dashboard.'
    },
    {
        name: '/rewind',
        description: 'Revert file to checkpoint',
        usage: '/rewind [checkpoint_id]',
        example: '/rewind 1234567890_abc',
        category: 'System',
        details: 'Reverts a file to a previous checkpoint. If no ID is provided, shows recent checkpoints.'
    },
    {
        name: '/checkpoints',
        description: 'List recent checkpoints',
        usage: '/checkpoints',
        example: '/checkpoints',
        category: 'System',
        details: 'Displays a list of recent file checkpoints that can be reverted.'
    },
    {
        name: '/permission',
        description: 'Change permission mode',
        usage: '/permission <mode>',
        example: '/permission auto-edit',
        category: 'System',
        details: 'Set permission mode: default (ask first), auto-edit (auto file edits), plan-only (read-only). Use Shift+Tab to cycle modes.'
    },
    {
        name: '/fork',
        description: 'Fork current conversation',
        usage: '/fork [title]',
        example: '/fork "Testing new approach"',
        category: 'System',
        details: 'Creates a new conversation branch with all messages from the current conversation.'
    },
    {
        name: '/compact',
        description: 'Compact conversation context',
        usage: '/compact',
        example: '/compact',
        category: 'System',
        details: 'Removes old tool outputs and compacts context to reduce token usage.'
    },
    {
        name: '/context',
        description: 'Show context usage',
        usage: '/context',
        example: '/context',
        category: 'System',
        details: 'Displays current context size and message count.'
    },
    {
        name: '/exit',
        description: 'Exit the application',
        usage: '/exit',
        example: '/exit',
        category: 'System',
        details: 'Closes the Antigravity CLI.'
    }
];

module.exports = { COMMANDS };
