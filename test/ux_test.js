const ui = require('../src/cli/ui');
const { FileSystemTools } = require('../src/tools/filesystem');
const path = require('path');
const fs = require('fs').promises;

// Mock interactons
ui.jsonMode = false;
ui.confirmAction = async (msg) => {
    console.log(`[MockUI] Question: ${msg} -> Auto-answering YES`);
    return true;
};
ui.showDiff = (old, newC, path) => {
    console.log(`[MockUI] Showing diff for ${path}`);
};

async function testInteractive() {
    console.log('--- Interactive UX Test ---');

    const tools = new FileSystemTools(process.cwd());
    const testFile = 'test_ux.txt';

    // 1. Create new file
    console.log('\n[1] Creating new file...');
    await tools.writeFile(testFile, 'Hello World');

    // 2. Modify file
    console.log('\n[2] Modifying file...');
    await tools.writeFile(testFile, 'Hello Brave New World');

    // Cleanup
    await fs.unlink(path.join(process.cwd(), testFile));
    console.log('\n✅ Test Completed');
}

testInteractive();
