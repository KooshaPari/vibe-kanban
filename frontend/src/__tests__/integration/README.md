# Integration Tests

This directory contains comprehensive integration tests for the Vibe Kanban application frontend. These tests verify complete user workflows and component interactions across the entire application stack.

## Test Structure

### 📁 Test Organization

```
src/__tests__/
├── setup.ts                           # Test environment setup
├── utils/
│   └── test-utils.tsx                  # Custom render utilities and mocks
└── integration/
    ├── pages/                          # Page component integration tests
    │   ├── projects-page.integration.test.tsx
    │   └── project-tasks.integration.test.tsx
    ├── router/                         # Router and navigation tests
    │   └── navigation.integration.test.tsx
    ├── context/                        # Context provider integration tests
    │   ├── config-provider.integration.test.tsx
    │   └── task-details-context.integration.test.tsx
    ├── api/                           # API integration with components
    │   ├── projects-api.integration.test.tsx
    │   └── tasks-api.integration.test.tsx
    └── forms/                         # Form submission workflows
        ├── project-form.integration.test.tsx
        └── task-form.integration.test.tsx
```

## Test Categories

### 🖥️ Page Component Integration Tests

**Files:** `pages/*.integration.test.tsx`

These tests verify complete page functionality including:

- Data loading and display
- User interactions
- State management
- Error handling
- Real-time updates

**Example workflows tested:**

- Projects page: Create, read, update, delete projects
- Project tasks page: Kanban board operations, task management
- Task details: Tab navigation, file uploads, logs viewing

### 🧭 Router Integration Tests

**Files:** `router/navigation.integration.test.tsx`

Tests navigation and routing functionality:

- Route changes and URL updates
- Deep linking support
- Route protection and error handling
- Browser history management
- Performance optimization

### 🔄 Context Provider Integration

**Files:** `context/*.integration.test.tsx`

Tests React Context providers and their integration:

- Configuration management
- Task details state management
- Provider isolation
- Real-time state updates
- Error recovery

### 🌐 API Integration Tests

**Files:** `api/*.integration.test.tsx`

Tests API interactions with UI components:

- HTTP request/response handling
- Error states and recovery
- Loading states
- Data persistence
- Concurrent operations

### 📝 Form Integration Tests

**Files:** `forms/*.integration.test.tsx`

Tests complete form submission workflows:

- Field validation
- File uploads
- Real-time validation
- Error handling
- Success/failure states
- Accessibility compliance

## Running Tests

### 🚀 Quick Start

```bash
# Run all integration tests
npm test

# Run specific test category
npm test -- --testPathPattern=integration/pages
npm test -- --testPathPattern=integration/api
npm test -- --testPathPattern=integration/forms

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### 🔍 Advanced Testing

```bash
# Run specific test file
npm test projects-page.integration.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="Project Creation"

# Debug mode with verbose output
npm test -- --verbose --no-cache

# Run accessibility tests only
npm run test:a11y
```

## Test Utilities

### 🛠️ Custom Render Function

The `test-utils.tsx` file provides a custom render function that wraps components with necessary providers:

```typescript
import { render } from '../utils/test-utils';

// Automatically includes:
// - BrowserRouter
// - ConfigProvider
// - ThemeProvider
// - TaskDetailsContextProvider
```

### 🎭 Mock API Responses

```typescript
import { mockFetch, mockApiResponses } from '../utils/test-utils';

// Mock successful API responses
mockFetch(mockApiResponses.projects);

// Mock error responses
mockFetchError('Network error', 500);
```

### ⏳ Async Testing Helpers

```typescript
import { waitForLoadingToFinish } from '../utils/test-utils';

// Wait for async operations
await waitForLoadingToFinish();

// Wait for specific conditions
await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

## Test Patterns

### 🎯 Testing User Workflows

```typescript
describe('Complete Project Creation Workflow', () => {
  it('creates project from start to finish', async () => {
    const user = userEvent.setup();

    // 1. Render component
    render(<ProjectsPage />);

    // 2. Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/create project/i)).toBeInTheDocument();
    });

    // 3. User interaction
    await user.click(screen.getByText('Create Project'));

    // 4. Form submission
    await user.type(screen.getByLabelText(/project name/i), 'New Project');
    await user.click(screen.getByText('Submit'));

    // 5. Verify result
    await waitFor(() => {
      expect(screen.getByText('Project created successfully')).toBeInTheDocument();
    });
  });
});
```

### 🔍 Testing Error Scenarios

```typescript
describe('Error Handling', () => {
  it('handles API errors gracefully', async () => {
    // Mock API failure
    mockFetchError('Server error');

    render(<Component />);

    // Verify error display
    await waitFor(() => {
      expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
    });

    // Verify retry functionality
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
  });
});
```

### 📱 Testing Responsive Behavior

```typescript
describe('Responsive Design', () => {
  it('adapts to mobile viewport', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375 });

    render(<ResponsiveComponent />);

    // Verify mobile layout
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
  });
});
```

## Best Practices

### ✅ Do's

- **Test user workflows, not implementation details**
- **Use semantic queries** (`getByRole`, `getByLabelText`)
- **Wait for async operations** with `waitFor`
- **Mock external dependencies** (APIs, timers)
- **Test error scenarios** and edge cases
- **Verify accessibility** compliance
- **Keep tests focused** and independent

### ❌ Don'ts

- **Don't test internal component state**
- **Don't rely on timeouts** for async operations
- **Don't test styling details**
- **Don't create overly complex test setups**
- **Don't ignore loading states**
- **Don't forget to clean up** after tests

## Coverage Requirements

Integration tests maintain **70% minimum coverage** across:

- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

### 📊 Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

## Debugging Tests

### 🐛 Common Issues

1. **Async operations not awaited**

   ```typescript
   // ❌ Wrong
   fireEvent.click(button);
   expect(screen.getByText('Result')).toBeInTheDocument();

   // ✅ Correct
   await user.click(button);
   await waitFor(() => {
     expect(screen.getByText('Result')).toBeInTheDocument();
   });
   ```

2. **Missing provider context**

   ```typescript
   // ❌ Wrong
   render(<Component />);

   // ✅ Correct
   render(<Component />, { initialConfig: mockConfig });
   ```

3. **Unmocked API calls**

   ```typescript
   // ❌ Wrong - real API call
   render(<Component />);

   // ✅ Correct - mocked API
   mockFetch(mockData);
   render(<Component />);
   ```

### 🔧 Debug Mode

```bash
# Run tests with debug output
npm test -- --verbose

# Run single test with debugging
npm test -- --testNamePattern="specific test" --no-cache

# Debug with browser tools
npm test -- --inspect-brk
```

## Contributing

When adding new integration tests:

1. **Follow naming conventions:** `*.integration.test.tsx`
2. **Use descriptive test names** that explain the workflow
3. **Group related tests** in describe blocks
4. **Include error scenarios** alongside happy paths
5. **Document complex test setups** with comments
6. **Ensure tests are deterministic** and independent

### 📝 Test Checklist

- [ ] Tests complete user workflows
- [ ] Includes error handling scenarios
- [ ] Uses semantic queries
- [ ] Waits for async operations
- [ ] Mocks external dependencies
- [ ] Verifies accessibility
- [ ] Maintains good coverage
- [ ] Runs consistently
- [ ] Has clear documentation

---

For questions about testing patterns or debugging help, refer to the [Testing Documentation](../../../docs/testing.md) or reach out to the development team.
