// Test setup file
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Override database settings for testing
process.env.DB_NAME = process.env.DB_TEST_NAME || 'msa_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_for_jenkins';

// Global test timeout
jest.setTimeout(30000);

// Console log suppression for cleaner test output (but allow errors)
if (process.env.NODE_ENV === 'test') {
  const originalConsoleError = console.error;
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  // Keep console.error for debugging test issues
  console.error = originalConsoleError;
}