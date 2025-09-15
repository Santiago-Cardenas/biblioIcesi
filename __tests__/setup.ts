// Test setup file
import mongoose from 'mongoose';

// Mock environment variables
process.env.SECRET = 'test_secret_key';
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(async () => {
  // Close any open handles
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
