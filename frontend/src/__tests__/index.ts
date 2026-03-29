/**
 * Main test utilities index file
 *
 * This file exports all testing utilities, mocks, and helpers
 * for easy importing in test files.
 *
 * Usage:
 * ```ts
 * import { renderWithProviders, mockData, setupMockApiResponses } from '../__tests__';
 * ```
 */

// Re-export everything from test utilities
export * from './utils/testUtils';
export * from './utils/mockData';
export * from './utils/helpers';
export * from './utils/customMatchers';
export * from './utils/clipboardTestUtils';

// Re-export mocks
export * from './mocks/apiMocks';
export * from './mocks/routerMocks';
export * from './mocks/externalLibraryMocks';

// Re-export accessibility utilities
export * from './accessibility/utils';

// Export common testing library utilities for convenience
export {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
  cleanup,
  within,
  prettyDOM,
  logRoles,
  getByRole,
  getByText,
  getByLabelText,
  getByPlaceholderText,
  getByTestId,
  getByDisplayValue,
  getByAltText,
  getByTitle,
  getAllByRole,
  getAllByText,
  getAllByLabelText,
  getAllByPlaceholderText,
  getAllByTestId,
  getAllByDisplayValue,
  getAllByAltText,
  getAllByTitle,
  queryByRole,
  queryByText,
  queryByLabelText,
  queryByPlaceholderText,
  queryByTestId,
  queryByDisplayValue,
  queryByAltText,
  queryByTitle,
  queryAllByRole,
  queryAllByText,
  queryAllByLabelText,
  queryAllByPlaceholderText,
  queryAllByTestId,
  queryAllByDisplayValue,
  queryAllByAltText,
  queryAllByTitle,
  findByRole,
  findByText,
  findByLabelText,
  findByPlaceholderText,
  findByTestId,
  findByDisplayValue,
  findByAltText,
  findByTitle,
  findAllByRole,
  findAllByText,
  findAllByLabelText,
  findAllByPlaceholderText,
  findAllByTestId,
  findAllByDisplayValue,
  findAllByAltText,
  findAllByTitle,
} from '@testing-library/react';

export { default as userEvent } from '@testing-library/user-event';

// Default test setup function
export const setupTests = () => {
  // Import setup file side effects
  import('../setupTests');

  // Setup API mocks
  import('./mocks/apiMocks').then(({ setupMockApiResponses }) => {
    setupMockApiResponses();
  });

  // Setup router mocks
  import('./mocks/routerMocks').then(({ resetRouterMocks }) => {
    resetRouterMocks();
  });

  // Setup external library mocks
  import('./mocks/externalLibraryMocks').then(
    ({ resetExternalLibraryMocks }) => {
      resetExternalLibraryMocks();
    }
  );
};

// Cleanup function for tests
export const cleanupTests = () => {
  // Reset all mocks
  jest.clearAllMocks();

  // Clean up DOM
  document.body.innerHTML = '';

  // Reset any global state
  if (typeof window !== 'undefined') {
    window.location.href = 'http://localhost:3000';
  }
};
