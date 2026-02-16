// Test setup file
// This file runs before all tests

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

// Setup chai
chai.use(sinonChai);
global.expect = chai.expect;
global.sinon = sinon;

// Suppress console output during tests
if (process.env.NODE_ENV === 'test') {
    global.console = {
        ...console,
        log: () => { },
        info: () => { },
        warn: () => { },
        error: () => { },
    };
}
