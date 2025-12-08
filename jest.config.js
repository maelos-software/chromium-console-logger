module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts', // CLI entry point - difficult to test in isolation
    '!src/chrome-remote-interface.d.ts', // Type definitions only
    '!src/tui.tsx', // React component - requires different test setup
    '!src/tui-runner.mjs', // TUI runner - requires terminal environment
    '!src/playwright-tui.tsx', // Playwright TUI - on separate branch
    '!src/playwright-tui-runner.mjs', // Playwright TUI runner - on separate branch
    '!src/playwrightReporter.ts', // Playwright reporter - on separate branch
  ],
  coverageDirectory: 'coverage',
  coverageThresholds: {
    global: {
      statements: 45,
      branches: 40,
      functions: 45,
      lines: 45,
    },
  },
  verbose: true,
};
