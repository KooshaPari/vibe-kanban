import '@testing-library/jest-dom';
import { beforeAll, afterAll, beforeEach } from '@jest/globals';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock IntersectionObserver which is not available in jsdom
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver which is not available in jsdom
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock matchMedia which is not available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo which is not available in jsdom
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Mock scrollIntoView which is not available in jsdom
Element.prototype.scrollIntoView = jest.fn();

// Mock URL.createObjectURL and URL.revokeObjectURL for file uploads
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mocked-url'),
});
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

// Mock clipboard API (initialized in beforeEach to avoid conflicts)
const mockClipboard = () => {
  const clipboardDescriptor = Object.getOwnPropertyDescriptor(
    navigator,
    'clipboard'
  );
  if (!clipboardDescriptor || clipboardDescriptor.configurable !== false) {
    try {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: jest.fn().mockResolvedValue(undefined),
          readText: jest.fn().mockResolvedValue(''),
          write: jest.fn().mockResolvedValue(undefined),
          read: jest.fn().mockResolvedValue([]),
        },
        writable: true,
        configurable: true,
      });
    } catch (error) {
      // Silently ignore if clipboard is already defined and not configurable
    }
  }
};

// Mock HTMLElement methods that might not be available in jsdom
HTMLElement.prototype.scrollIntoView = jest.fn();
HTMLElement.prototype.hasPointerCapture = jest.fn();
HTMLElement.prototype.releasePointerCapture = jest.fn();
HTMLElement.prototype.setPointerCapture = jest.fn();

// Mock fetch if not available globally
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock useConfig hook
jest.mock('@/components/config-provider', () => ({
  useConfig: () => ({
    config: {
      disclaimer_acknowledged: true,
      onboarding_acknowledged: true,
      telemetry_acknowledged: true,
      github_login_acknowledged: true,
      analytics_enabled: false,
      theme: 'light',
      executor: {
        type: 'local',
        local: { is_valid: true, validation_error: null },
        anthropic: { is_valid: false, validation_error: null },
        openai: { is_valid: false, validation_error: null },
      },
      editor: { editor_type: 'vs_code', custom_command: null },
    },
    updateConfig: jest.fn(),
    updateAndSaveConfig: jest.fn(),
    saveConfig: jest.fn().mockResolvedValue(true),
    loading: false,
    githubTokenInvalid: false,
  }),
}));

// Mock API modules
jest.mock('@/lib/api', () => ({
  configApi: {
    getConfig: jest.fn().mockResolvedValue({
      disclaimer_acknowledged: true,
      onboarding_acknowledged: true,
      telemetry_acknowledged: true,
      github_login_acknowledged: true,
      analytics_enabled: false,
      theme: 'light',
      executor: {
        type: 'local',
        local: { is_valid: true, validation_error: null },
        anthropic: { is_valid: false, validation_error: null },
        openai: { is_valid: false, validation_error: null },
      },
      editor: { editor_type: 'vs_code', custom_command: null },
    }),
    updateConfig: jest.fn().mockResolvedValue(true),
  },
  projectsApi: {
    getProjects: jest.fn().mockResolvedValue([]),
    createProject: jest
      .fn()
      .mockResolvedValue({ id: '1', name: 'Test Project' }),
    updateProject: jest
      .fn()
      .mockResolvedValue({ id: '1', name: 'Updated Project' }),
    deleteProject: jest.fn().mockResolvedValue(true),
  },
  tasksApi: {
    getTasks: jest.fn().mockResolvedValue([]),
    createTask: jest
      .fn()
      .mockResolvedValue({ id: 'task-1', title: 'Test Task' }),
    updateTask: jest
      .fn()
      .mockResolvedValue({ id: 'task-1', title: 'Updated Task' }),
    deleteTask: jest.fn().mockResolvedValue(true),
  },
  githubAuthApi: {
    getAuthUrl: jest
      .fn()
      .mockResolvedValue('https://github.com/login/oauth/authorize'),
    exchangeToken: jest.fn().mockResolvedValue({ token: 'mock-token' }),
    validateToken: jest.fn().mockResolvedValue(true),
  },
}));

// Setup console warnings/errors suppression for tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: React.createFactory') ||
        args[0].includes('Warning: componentWillReceiveProps'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

beforeEach(() => {
  mockClipboard();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockLocalStorage,
});
