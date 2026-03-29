/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // TypeScript support
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^shared/(.*)$': '<rootDir>/../shared/$1',
    '^react-markdown$': '<rootDir>/src/__mocks__/react-markdown.tsx',
    '^@sentry/react$': '<rootDir>/src/__mocks__/@sentry/react.ts',
    '^@/lib/api$': '<rootDir>/src/__mocks__/api.ts',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub',
  },

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },

  // Transform ES modules in node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(.*(react-markdown|remark|micromark|unist|unified|bail|is-plain-obj|trough|vfile|mdast|ccount|markdown-table|repeat-string|@microsoft|zwitch|longest-streak|property-information|hast-util|web-namespaces|comma-separated-tokens|space-separated-tokens|trim-lines|decode-named-character-reference|character-entities|html-void-elements|github-slugger|devlop).*)/)',
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)',
    '<rootDir>/src/**/*.a11y.test.(ts|tsx|js)',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/**/*.stories.(ts|tsx)',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/**/__tests__/**',
    '!src/**/test-utils.*',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Mock configuration
  clearMocks: true,
  restoreMocks: true,

  // Global setup for import.meta
  globals: {
    'import.meta': {
      env: {
        DEV: false,
        PROD: true,
        MODE: 'test'
      }
    }
  },

  // Verbose output
  verbose: true,

  // Error handling
  errorOnDeprecated: true,

  // Watch configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/coverage/',
  ],

  // Test timeout
  testTimeout: 10000,
};