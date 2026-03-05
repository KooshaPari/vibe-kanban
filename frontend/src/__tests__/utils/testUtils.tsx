import React, { ReactElement } from 'react';
import { render, RenderOptions, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock task data for testing
export const mockTask = {
  id: 'test-task-1',
  title: 'Test Task',
  description: 'This is a test task',
  status: 'todo',
  project_id: 'test-project-1',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  kanban_order: 1,
  attempt_count: 0,
  current_attempt_id: null,
};

export const mockProject = {
  id: 'test-project-1',
  name: 'Test Project',
  description: 'This is a test project',
  path: '/test/project',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

export const mockAttempt = {
  id: 'test-attempt-1',
  task_id: 'test-task-1',
  status: 'pending',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  conversation: [],
  has_diff: false,
  diff_summary: null,
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  withRouter?: boolean;
}

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

export const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { withRouter = true, ...renderOptions } = options;

  const Wrapper = withRouter ? AllTheProviders : undefined;

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { userEvent };

// Custom render as default export
export { customRender as render };

// Utility functions for common test scenarios
export const waitForLoadingToFinish = () =>
  waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

export const expectAccessibleName = (element: HTMLElement, name: string) => {
  expect(element).toHaveAccessibleName(name);
};

export const expectAccessibleDescription = (
  element: HTMLElement,
  description: string
) => {
  expect(element).toHaveAccessibleDescription(description);
};

// Helper for testing keyboard navigation
export const testKeyboardNavigation = async (
  elements: HTMLElement[],
  user: ReturnType<typeof userEvent.setup>
) => {
  // Focus first element
  await user.tab();
  expect(elements[0]).toHaveFocus();

  // Tab through all elements
  for (let i = 1; i < elements.length; i++) {
    await user.tab();
    expect(elements[i]).toHaveFocus();
  }

  // Shift+Tab back through elements
  for (let i = elements.length - 2; i >= 0; i--) {
    await user.tab({ shift: true });
    expect(elements[i]).toHaveFocus();
  }
};

// Helper for testing ARIA attributes
export const expectAriaAttributes = (
  element: HTMLElement,
  attributes: Record<string, string | boolean | null>
) => {
  Object.entries(attributes).forEach(([attr, value]) => {
    if (value === null) {
      expect(element).not.toHaveAttribute(attr);
    } else {
      expect(element).toHaveAttribute(attr, value.toString());
    }
  });
};

// Mock API responses
export const mockApi = {
  tasks: {
    getAll: () => Promise.resolve([mockTask]),
    getById: (_id: string) => Promise.resolve(mockTask),
    create: (data: any) => Promise.resolve({ ...mockTask, ...data }),
    update: (_id: string, data: any) =>
      Promise.resolve({ ...mockTask, ...data }),
    delete: (_id: string) => Promise.resolve(),
  },
  projects: {
    getAll: () => Promise.resolve([mockProject]),
    getById: (_id: string) => Promise.resolve(mockProject),
    create: (data: any) => Promise.resolve({ ...mockProject, ...data }),
    update: (_id: string, data: any) =>
      Promise.resolve({ ...mockProject, ...data }),
    delete: (_id: string) => Promise.resolve(),
  },
  attempts: {
    getByTaskId: (_taskId: string) => Promise.resolve([mockAttempt]),
    create: (data: any) => Promise.resolve({ ...mockAttempt, ...data }),
  },
};

// Helper for testing component accessibility
export const testAccessibility = async (component: ReactElement) => {
  const { container } = customRender(component);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Helper for testing error boundaries
export const TestErrorBoundary: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const errorHandler = (_error: ErrorEvent) => {
      setHasError(true);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return <div>Something went wrong!</div>;
  }

  return <>{children}</>;
};

// Helper for mocking localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    length: Object.keys(store).length,
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
};

// Helper for mocking fetch
export const mockFetch = (responses: Record<string, any>) => {
  global.fetch = jest.fn((url: string) => {
    const response = responses[url];
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    } as Response);
  });
};
