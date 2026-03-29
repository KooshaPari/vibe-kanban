import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./src/setupTests.ts'],
    
    // Global test configuration
    globals: true,
    
    // Coverage configuration for 100% requirement
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      
      // 100% coverage thresholds
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100
      },
      
      // Include all source files
      include: ['src/**/*.{ts,tsx}'],
      
      // Exclude test files and other non-source files
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/__tests__/**/*',
        'src/**/__mocks__/**/*',
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ],
      
      // Report uncovered lines
      skipFull: false,
      
      // Fail on coverage below threshold
      checkCoverage: true
    },
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}'
    ],
    
    // Test timeout
    testTimeout: 30000,
    hookTimeout: 30000,
    
    // Reporters
    reporter: ['verbose', 'html', 'json'],
    outputFile: {
      html: './test-results/vitest-report.html',
      json: './test-results/vitest-results.json'
    },
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    
    // Performance configuration
    isolate: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    },
    
    // Browser testing configuration
    browser: {
      enabled: false, // Set to true if you want browser tests
      name: 'chrome',
      headless: true
    }
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  
  // Define global variables for tests
  define: {
    'import.meta.vitest': undefined
  }
});