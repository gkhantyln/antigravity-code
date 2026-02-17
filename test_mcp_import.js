try {
    const { Server } = require('@modelcontextprotocol/sdk/server');
    console.log('Server import successful:', typeof Server);
} catch (error) {
    console.error('Server import failed:', error.message);
}
try {
    const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
    console.log('Stdio import successful (with .js):', typeof StdioServerTransport);
} catch (error) {
    console.error('Stdio import failed (with .js):', error.message);
}
