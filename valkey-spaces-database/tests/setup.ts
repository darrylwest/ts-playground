/**
 * Global test setup and configuration
 */

import { jest } from '@jest/globals';

// Set test timeout to 30 seconds for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  // Only show console output in debug mode
  if (process.env.DEBUG_TESTS !== 'true') {
    console.log = jest.fn();
    console.warn = jest.fn(); 
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

// Skip integration tests by default in CI
if (process.env.CI && !process.env.RUN_INTEGRATION_TESTS) {
  process.env.SKIP_INTEGRATION_TESTS = 'true';
  process.env.SKIP_CLI_TESTS = 'true';
}