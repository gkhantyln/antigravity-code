const ui = require('../src/cli/ui');

// Mock process.argv
process.argv.push('--json');

// Re-instantiate UI to pick up the flag
// (In a real run, node starts with flags)
// We need to bypass the singleton or force reload.
// For testing, we can just manually set jsonMode.
ui.jsonMode = true;

console.log('--- Testing JSON Output ---');
ui.info('This is an info message');
ui.success('This is a success message');
ui.error('This is an error message');
ui.startSpinner('Running task...');
ui.stopSpinnerSuccess('Task finished');
ui.renderMarkdown('# Header\n* Bullet');
