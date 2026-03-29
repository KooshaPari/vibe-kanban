# Jest Configuration Setup

This document describes the Jest configuration setup for the Vibe Kanban frontend.

## Overview

Jest has been configured with full TypeScript support, React Testing Library integration, and comprehensive mocking capabilities for browser APIs.

## Configuration Files

### 1. jest.config.cjs
Main Jest configuration file with:
- TypeScript support via ts-jest
- jsdom test environment for DOM APIs
- Module path mapping for `@/` and `shared/` aliases
- CSS and asset mocking
- Coverage reporting configuration
- Test file pattern matching

### 2. src/setupTests.ts
Test environment setup file that provides:
- Jest DOM matchers from @testing-library/jest-dom
- Mocked browser APIs (IntersectionObserver, ResizeObserver, matchMedia, etc.)
- File upload API mocks (URL.createObjectURL, clipboard API)
- Console warning/error suppression for known React warnings
- Local/Session storage mocks

### 3. src/test-utils.ts
Test utility functions including:
- API response mocking utilities
- File creation helpers (text and image files)
- Drag & drop event mocking
- Project and task data factories
- Async operation utilities

## Available Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI (no watch, with coverage)
npm run test:ci

# Run accessibility tests only
npm run test:a11y
```

## Test File Patterns

Jest will automatically find and run tests in:
- `src/**/__tests__/**/*.(ts|tsx|js)`
- `src/**/*.(test|spec).(ts|tsx|js)`

## Dependencies Added

### Core Testing
- `jest` - Test framework
- `ts-jest` - TypeScript support for Jest
- `jest-environment-jsdom` - DOM environment for browser testing

### React Testing
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Additional Jest matchers for DOM
- `@testing-library/user-event` - User interaction simulation

### Mocking & Assets
- `identity-obj-proxy` - CSS module mocking
- `jest-transform-stub` - Asset file mocking

### Type Support
- `@types/jest` - TypeScript definitions for Jest
- `@jest/globals` - Global Jest types

## Coverage Configuration

- **Threshold**: 70% for statements, branches, functions, and lines
- **Reports**: Text, LCOV, HTML, and JSON formats
- **Directory**: `coverage/`
- **Excludes**: 
  - `*.d.ts` files
  - `*.stories.*` files
  - `main.tsx`
  - `vite-env.d.ts`
  - Test files and utilities

## Mocked APIs

The setup includes mocks for common browser APIs that aren't available in jsdom:

- **IntersectionObserver** - For visibility detection
- **ResizeObserver** - For element resize detection  
- **matchMedia** - For responsive design testing
- **scrollTo/scrollIntoView** - For scroll behavior
- **URL.createObjectURL/revokeObjectURL** - For file handling
- **navigator.clipboard** - For clipboard operations
- **Local/Session Storage** - For browser storage

## Example Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { createMockFile, mockApiResponse } from '../test-utils';

describe('Component', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles file upload', async () => {
    const file = createMockFile('test.txt', 'content');
    // Test file upload logic
  });

  it('handles API calls', async () => {
    const mockData = await mockApiResponse({ id: 1, name: 'Test' });
    // Test API integration
  });
});
```

## Notes

- All tests run in jsdom environment with DOM APIs available
- Console warnings for deprecated React features are suppressed in tests
- File upload testing uses mock File objects
- Complex canvas operations are simplified for testing
- ES modules are supported with proper TypeScript compilation