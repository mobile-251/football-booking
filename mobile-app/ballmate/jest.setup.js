// jest.setup.js
// Global test setup for React Native / Expo

// Mock expo modules that cause issues in Jest
jest.mock('expo/src/winter/runtime.native', () => ({}), { virtual: true });
jest.mock('expo/src/winter/installGlobal', () => ({}), { virtual: true });

// Mock @testing-library/jest-native if available
try {
  require('@testing-library/jest-native/extend-expect');
} catch (e) {
  // Ignore if not available
}

// Silence console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

