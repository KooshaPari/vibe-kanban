/** @type {import('jest').Config} */
export default {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  
  // Module name mapping for assets and styles
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
        moduleResolution: 'node',
        allowImportingTsExtensions: true,
        strict: true
      }
    }]
  },
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js|jsx)'
  ],
  
  // Coverage configuration for 100% requirement
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**/*',
    '!src/**/__mocks__/**/*'
  ],
  
  // 100% coverage thresholds
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    // Per-directory thresholds
    './src/components/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './src/hooks/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './src/lib/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './src/pages/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json-summary',
    'clover'
  ],
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Fail tests if coverage is below threshold
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.next/',
    '/coverage/'
  ],
  
  // Test timeout for comprehensive tests
  testTimeout: 30000,
  
  // Globals
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  
  // Extensions to try when resolving modules
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output for detailed test results
  verbose: true,
  
  // Error on deprecated features
  errorOnDeprecated: true,
  
  // ESM support
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Additional Jest configuration for React Testing Library
  testEnvironmentOptions: {
    customExportConditions: [''],
  }
};
