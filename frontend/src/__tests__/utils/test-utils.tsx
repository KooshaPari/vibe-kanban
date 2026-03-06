/**
 * Enhanced test utilities for integration tests
 * Provides comprehensive testing setup with providers, mocks, and utilities
 */

import React, { ReactElement } from 'react';
import {
  render as rtlRender,
  RenderOptions,
  RenderResult,
} from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
// Mock providers for testing
const MockConfigProvider = ({ children }: any) => (
  <div data-testid="config-provider">{children}</div>
);
const MockThemeProvider = ({ children }: any) => (
  <div data-testid="theme-provider">{children}</div>
);
import type { Config } from 'shared/types';
import { createMockConfig } from '../../__mocks__/api';

// Global fetch mock setup
const createMockResponse = (data: any, status = 200, ok = true) => ({
  ok,
  status,
  json: jest.fn().mockResolvedValue({
    success: ok,
    data: data,
    message: ok ? undefined : 'API Error',
  }),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  blob: jest.fn().mockResolvedValue(new Blob([JSON.stringify(data)])),
  headers: new Headers(),
  redirected: false,
  statusText: ok ? 'OK' : 'Error',
  type: 'basic' as ResponseType,
  url: '',
  clone: jest.fn(),
  body: null,
  bodyUsed: false,
  arrayBuffer: jest.fn(),
  formData: jest.fn(),
});

// Enhanced mock fetch function
export const mockFetch = (data: any, status = 200, ok = true) => {
  const mockResponse = createMockResponse(data, status, ok);
  (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
  return mockResponse;
};

// Mock fetch with multiple responses for sequence testing
export const mockFetchSequence = (
  responses: Array<{ data: any; status?: number; ok?: boolean }>
) => {
  responses.forEach((response) => {
    mockFetch(response.data, response.status, response.ok);
  });
};

// Mock fetch with error
export const mockFetchError = (error: Error) => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(error);
};

// No query client needed for this project

// Provider wrapper for tests
interface AllTheProvidersProps {
  children: React.ReactNode;
  initialConfig?: Config;
  initialRoute?: string;
  useMemoryRouter?: boolean;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({
  children,
  initialConfig,
  initialRoute = '/',
  useMemoryRouter = true,
}) => {
  const config = initialConfig || createMockConfig();

  const RouterComponent = useMemoryRouter
    ? ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
      )
    : BrowserRouter;

  return (
    <MockConfigProvider initialConfig={config}>
      <MockThemeProvider>
        <RouterComponent>{children}</RouterComponent>
      </MockThemeProvider>
    </MockConfigProvider>
  );
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialConfig?: Config;
  initialRoute?: string;
  useMemoryRouter?: boolean;
}

export const render = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { initialConfig, initialRoute, useMemoryRouter, ...renderOptions } =
    options;

  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders
        initialConfig={initialConfig}
        initialRoute={initialRoute}
        useMemoryRouter={useMemoryRouter}
      >
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Re-export everything from testing-library/react
export * from '@testing-library/react';

// Custom render overrides the default export
export { render as default };

// Test data generators
export const generateMockProjects = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `${index + 1}`,
    name: `Project ${index + 1}`,
    description: `Description for project ${index + 1}`,
    repository: `https://github.com/test/repo${index + 1}`,
    branch: 'main',
    created_at: new Date(2024, 0, index + 1).toISOString(),
    updated_at: new Date(2024, 0, index + 1).toISOString(),
  }));
};

export const generateMockTasks = (count: number, projectId = '1') => {
  return Array.from({ length: count }, (_, index) => ({
    id: `${index + 1}`,
    project_id: projectId,
    title: `Task ${index + 1}`,
    description: `Description for task ${index + 1}`,
    status: ['pending', 'in_progress', 'completed'][index % 3] as const,
    current_attempt_id: null,
    current_attempt_status: null,
    created_at: new Date(2024, 0, index + 1).toISOString(),
    updated_at: new Date(2024, 0, index + 1).toISOString(),
  }));
};

// API response helpers
export const createSuccessResponse = function <T>(data: T) {
  return {
    success: true,
    data,
  };
};

export const createErrorResponse = (message: string) => ({
  success: false,
  message,
});

// File upload test utilities
export const createMockFile = (
  name: string = 'test.txt',
  content: string = 'test content',
  type: string = 'text/plain'
): File => {
  const file = new File([content], name, { type });
  return file;
};

export const createMockImageFile = (
  name: string = 'test.jpg',
  width: number = 100,
  height: number = 100
): File => {
  const imageData = `Mock image data ${width}x${height}`;
  const blob = new Blob([imageData], { type: 'image/jpeg' });
  return new File([blob], name, { type: 'image/jpeg' });
};

// Drag and drop test utilities
export const createMockDragEvent = (
  type: string,
  files: File[] = []
): DragEvent => {
  const event = new Event(type) as DragEvent;
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files,
      items: files.map((file) => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file,
      })),
      types: ['Files'],
    },
  });
  return event;
};

// Form testing utilities
export const fillForm = async (formData: Record<string, string>, user: any) => {
  for (const [fieldName, value] of Object.entries(formData)) {
    const field = document.querySelector(
      `[name="${fieldName}"]`
    ) as HTMLInputElement;
    if (field) {
      await user.clear(field);
      await user.type(field, value);
    }
  }
};

// Wait utilities
export const waitForAsyncOperation = (ms: number = 0): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const waitForNextTick = (): Promise<void> => {
  return new Promise((resolve) => process.nextTick(resolve));
};

// Error boundary test component
export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">Something went wrong</div>;
    }

    return this.props.children;
  }
}

// Local storage mock utilities
export const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

export const setupLocalStorageMock = () => {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
};

// Session storage mock utilities
export const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

export const setupSessionStorageMock = () => {
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
  });
};

// Window location mock utilities
export const mockWindowLocation = (href: string = 'http://localhost:3000/') => {
  delete (window as any).location;
  window.location = {
    href,
    origin: new URL(href).origin,
    protocol: new URL(href).protocol,
    host: new URL(href).host,
    hostname: new URL(href).hostname,
    port: new URL(href).port,
    pathname: new URL(href).pathname,
    search: new URL(href).search,
    hash: new URL(href).hash,
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    toString: () => href,
  } as any;
};

// Intersection Observer mock
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });
  window.IntersectionObserver = mockIntersectionObserver;
  global.IntersectionObserver = mockIntersectionObserver;
};

// Resize Observer mock
export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });
  window.ResizeObserver = mockResizeObserver;
  global.ResizeObserver = mockResizeObserver;
};

// Cleanup utilities
export const cleanupAfterTest = () => {
  // Clear all mocks
  jest.clearAllMocks();

  // Reset fetch mock
  if (global.fetch && jest.isMockFunction(global.fetch)) {
    (global.fetch as jest.Mock).mockClear();
  }

  // Clear local/session storage mocks
  if (mockLocalStorage.clear) {
    mockLocalStorage.clear();
  }
  if (mockSessionStorage.clear) {
    mockSessionStorage.clear();
  }
};

// Setup function for common test environment
export const setupTestEnvironment = () => {
  // Setup fetch mock
  global.fetch = jest.fn();

  // Setup storage mocks
  setupLocalStorageMock();
  setupSessionStorageMock();

  // Setup observer mocks
  mockIntersectionObserver();
  mockResizeObserver();

  // Setup window location
  mockWindowLocation();

  // Setup console mocks for cleaner test output
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    cleanupAfterTest();
  });
};
