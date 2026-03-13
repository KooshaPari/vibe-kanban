# Testing Infrastructure Documentation

This document provides comprehensive information about the testing setup and utilities available in this project.

## Overview

This project includes a robust testing infrastructure built around Jest and React Testing Library, with extensive utilities for mocking, accessibility testing, and common test scenarios.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## File Structure

```
src/__tests__/
├── index.ts                     # Main exports file
├── example.test.tsx             # Example test demonstrating utilities
├── utils/
│   ├── testUtils.tsx            # Custom render functions and utilities
│   ├── mockData.ts              # Mock data for all entities
│   ├── helpers.ts               # Common testing helper functions
│   ├── customMatchers.ts        # Custom Jest matchers
│   └── clipboardTestUtils.ts    # Clipboard testing utilities
├── mocks/
│   ├── apiMocks.ts              # API mocking utilities
│   ├── routerMocks.ts           # React Router mocks
│   └── externalLibraryMocks.ts  # External library mocks
└── accessibility/
    └── utils.ts                 # Accessibility testing utilities
```

## Core Testing Utilities

### Custom Render Functions

```tsx
import { renderWithProviders, renderWithRouter, renderWithTheme } from '../__tests__';

// Render with all providers (recommended)
renderWithProviders(<MyComponent />, {
  config: { theme: 'dark' },
  taskDetailsContext: { projectId: 'test-id' }
});

// Render with just router
renderWithRouter(<MyComponent />);

// Render with just theme
renderWithTheme(<MyComponent />, 'dark');
```

### Mock Data

```tsx
import { mockData } from '../__tests__';

// Use pre-built mock objects
const project = mockData.project;
const task = mockData.task;
const attachment = mockData.attachment;

// Access mock IDs for consistency
const projectId = mockData.ids.project;
const taskId = mockData.ids.task;
```

### API Mocking

```tsx
import { setupMockApiResponses, mockedApi, mockApiError } from '../__tests__';

beforeEach(() => {
  setupMockApiResponses(); // Sets up all default API responses
});

// Mock specific API failures
mockApiError(mockedApi.projectsApi.getById, 'Project not found', 404);

// Verify API calls
expect(mockedApi.projectsApi.getAll).toHaveBeenCalledTimes(1);
```

## Helper Functions

### User Interactions

```tsx
import { clickElement, typeInInput, hoverElement } from '../__tests__';

// Type in input fields
await typeInInput(inputElement, 'test text');

// Click elements
await clickElement(buttonElement);

// Hover over elements
await hoverElement(tooltipTrigger);
```

### File Operations

```tsx
import { createMockFile, createMockImageFile, uploadFiles } from '../__tests__';

// Create mock files
const textFile = createMockFile('test.txt', 'content', 'text/plain');
const imageFile = createMockImageFile('image.jpg', 100, 100);

// Simulate file upload
await uploadFiles(dropzoneElement, [textFile, imageFile]);
```

### Clipboard Testing

```tsx
import { simulateCopy, simulatePaste, mockClipboardAPI } from '../__tests__';

// Mock clipboard API
const clipboard = mockClipboardAPI();

// Simulate copy/paste
await simulateCopy('text to copy');
await simulatePaste(inputElement, 'pasted text');
```

## Accessibility Testing

### Basic Accessibility Checks

```tsx
import { a11y, keyboard, aria } from '../__tests__';

// Check if element has accessible name
expect(a11y.hasAccessibleName(button)).toBe(true);

// Check form labels
expect(a11y.hasProperFormLabel(input)).toBe(true);

// Check keyboard accessibility
expect(a11y.isKeyboardAccessible(button)).toBe(true);

// Check tab order
expect(keyboard.testTabOrder(container)).toBe(true);

// Check ARIA attributes
expect(aria.hasValidAriaAttributes(element)).toBe(true);
```

### Screen Reader Testing

```tsx
import { screenReader } from '../__tests__';

// Get accessible name
const name = screenReader.getAccessibleName(element);

// Check if announced
expect(screenReader.isAnnounced(element)).toBe(true);
```

## Custom Matchers

```tsx
// Visibility
expect(element).toBeVisible();
expect(element).toBeHidden();

// Accessibility
expect(element).toHaveAccessibleName('Submit');
expect(element).toHaveRole('button');

// Form states
expect(input).toBeRequired();
expect(input).toBeValid();
expect(input).toBeInvalid();

// Content
expect(element).toHaveTextContent('Hello World');
expect(input).toHaveValue('test value');

// API testing
expect(mockFn).toBeCalledWithApiError('Error message', 500);
expect(mockFn).toHaveBeenCalledWithFormData({ key: 'value' });
```

## Writing Tests

### Basic Component Test

```tsx
import { renderWithProviders, screen, mockData } from '../__tests__';
import { MyComponent } from '../components/MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    setupMockApiResponses();
  });

  it('should render correctly', () => {
    renderWithProviders(<MyComponent />);
    
    expect(screen.getByTestId('my-component')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    const { container } = renderWithProviders(<MyComponent />);
    
    expect(a11y.hasProperHeadingHierarchy(container)).toBe(true);
    expect(keyboard.testTabOrder(container)).toBe(true);
  });
});
```

### Testing User Interactions

```tsx
it('should handle user input', async () => {
  const onSubmit = jest.fn();
  renderWithProviders(<MyForm onSubmit={onSubmit} />);
  
  const input = screen.getByLabelText('Name');
  const button = screen.getByRole('button', { name: 'Submit' });
  
  await typeInInput(input, 'John Doe');
  await clickElement(button);
  
  expect(onSubmit).toHaveBeenCalledWith({ name: 'John Doe' });
});
```

### Testing API Integration

```tsx
it('should load data from API', async () => {
  renderWithProviders(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText(mockData.project.name)).toBeInTheDocument();
  });
  
  expect(mockedApi.projectsApi.getAll).toHaveBeenCalled();
});
```

### Testing Error States

```tsx
it('should handle API errors', async () => {
  mockApiError(mockedApi.projectsApi.getAll, 'Network error', 500);
  
  renderWithProviders(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Failed to load projects')).toBeInTheDocument();
  });
});
```

## Best Practices

### 1. Use Semantic Queries
```tsx
// ✅ Good - semantic queries
screen.getByRole('button', { name: 'Submit' });
screen.getByLabelText('Email address');

// ❌ Avoid - implementation details
screen.getByClassName('btn-primary');
```

### 2. Test User Behavior
```tsx
// ✅ Good - test what user does
await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
expect(screen.getByText('Item deleted')).toBeInTheDocument();

// ❌ Avoid - test implementation
expect(component.state.items).toHaveLength(0);
```

### 3. Use Custom Render Functions
```tsx
// ✅ Good - includes necessary providers
renderWithProviders(<MyComponent />);

// ❌ Avoid - missing context
render(<MyComponent />);
```

### 4. Mock External Dependencies
```tsx
// ✅ Good - mock at module level
jest.mock('../api', () => ({ getProjects: jest.fn() }));

// ✅ Good - use provided mocks
setupMockApiResponses();
```

### 5. Test Accessibility
```tsx
// ✅ Always check accessibility
expect(a11y.hasAccessibleName(button)).toBe(true);
expect(keyboard.testTabOrder(container)).toBe(true);
```

## Configuration

### Jest Configuration
The `jest.config.js` file includes:
- TypeScript support
- Module path mapping
- Coverage configuration
- Custom matchers setup

### Setup Files
- `setupTests.ts` - Global test setup and mocks
- Custom matchers registration
- Browser API mocks

## Debugging Tests

### Debug Rendered Output
```tsx
import { screen, prettyDOM } from '../__tests__';

// Print entire DOM
console.log(prettyDOM());

// Print specific element
console.log(prettyDOM(screen.getByTestId('my-element')));
```

### Debug Queries
```tsx
// Show available roles
screen.logRoles();

// Show available text content
console.log(screen.getByText.toString());
```

### Debug Events
```tsx
// Enable user event debugging
const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
```

## Common Issues and Solutions

### 1. "Not wrapped in act()" warnings
```tsx
// ✅ Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### 2. Timer-related issues
```tsx
// ✅ Mock timers when needed
jest.useFakeTimers();
jest.advanceTimersByTime(1000);
jest.useRealTimers();
```

### 3. Accessibility violations
```tsx
// ✅ Use accessibility utilities
expect(a11y.hasAccessibleName(element)).toBe(true);
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contributing

When adding new utilities:
1. Add them to the appropriate file in `__tests__/utils/`
2. Export them from `__tests__/index.ts`
3. Add examples to this documentation
4. Write tests for complex utilities
5. Update mock data when adding new entities