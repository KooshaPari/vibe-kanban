import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import type {
  Config,
  TaskStatus,
  ExecutorConfig,
  EditorType,
} from 'shared/types';

// Type definitions
interface TaskOverrides {
  id?: string;
  project_id?: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

interface TaskTemplateOverrides {
  id?: string;
  project_id?: string;
  title?: string;
  description?: string;
  template_name?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

interface DeviceResponseOverrides {
  device_code?: string;
  user_code?: string;
  verification_uri?: string;
  expires_in?: number;
  interval?: number;
  [key: string]: unknown;
}

// Mock implementations and helpers for testing

export const createMockConfig = (overrides?: Partial<Config>): Config => ({
  theme: 'light',
  executor: { type: 'claude' },
  disclaimer_acknowledged: true,
  onboarding_acknowledged: true,
  github_login_acknowledged: true,
  telemetry_acknowledged: true,
  sound_alerts: false,
  sound_file: 'abstract-sound1',
  push_notifications: false,
  editor: { editor_type: 'vscode', custom_command: null },
  github: {
    pat: null,
    token: null,
    username: null,
    primary_email: null,
    default_pr_base: null,
  },
  analytics_enabled: false,
  ...overrides,
});

export const createMockTask = (overrides?: TaskOverrides) => ({
  id: '1',
  project_id: 'project-1',
  title: 'Test Task',
  description: 'Test description',
  status: 'todo' as TaskStatus,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides,
});

export const createMockTaskTemplate = (overrides?: TaskTemplateOverrides) => ({
  id: 'template-1',
  project_id: 'project-1',
  title: 'Template Task',
  description: 'Template description',
  template_name: 'Test Template',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides,
});

export const createMockDeviceResponse = (
  overrides?: DeviceResponseOverrides
) => ({
  device_code: 'device_code_123',
  user_code: 'USER123',
  verification_uri: 'https://github.com/login/device',
  expires_in: 900,
  interval: 5,
  ...overrides,
});

export const createMockExecutorConfig = (
  type: string = 'claude'
): ExecutorConfig => {
  switch (type) {
    case 'echo':
      return { type: 'echo' };
    case 'claude':
      return { type: 'claude' };
    case 'amp':
      return { type: 'amp' };
    case 'gemini':
      return { type: 'gemini' };
    case 'charm-opencode':
      return { type: 'charm-opencode' };
    case 'claude-code-router':
      return { type: 'claude-code-router' };
    case 'setup-script':
      return { type: 'setup-script', script: 'echo "test"' };
    default:
      return { type: 'claude' };
  }
};

export const createMockEditorConfig = (
  editorType: EditorType = 'vscode',
  customCommand?: string
) => ({
  editor_type: editorType,
  custom_command: editorType === 'custom' ? customCommand || null : null,
});

// Helper for testing form validation
export const expectFormValidation = {
  toBeValid: (element: HTMLElement) => {
    expect(element).not.toHaveAttribute('aria-invalid', 'true');
    expect(element).not.toHaveClass('error', 'invalid');
  },
  toBeInvalid: (element: HTMLElement) => {
    expect(element).toHaveAttribute('aria-invalid', 'true');
  },
  toShowError: (container: HTMLElement, errorMessage: string) => {
    expect(container).toHaveTextContent(errorMessage);
  },
};

// Helper for testing async operations
export const waitForLoadingToFinish = async () => {
  const { queryByText } = await import('@testing-library/react');
  // Wait for common loading indicators to disappear
  const loadingIndicators = [
    'Loading…',
    'Creating...',
    'Updating...',
    'Starting…',
    'Creating & Starting...',
  ];

  for (const indicator of loadingIndicators) {
    await new Promise<void>((resolve) => {
      const checkLoading = () => {
        if (!queryByText(indicator)) {
          resolve();
        } else {
          setTimeout(checkLoading, 10);
        }
      };
      checkLoading();
    });
  }
};

// Helper for testing keyboard shortcuts
export const simulateKeyboardShortcut = (
  key: string,
  modifiers?: { ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean }
) => {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: modifiers?.ctrl || false,
    metaKey: modifiers?.meta || false,
    shiftKey: modifiers?.shift || false,
    altKey: modifiers?.alt || false,
    bubbles: true,
  });

  document.dispatchEvent(event);
  return event;
};

// Helper for testing clipboard operations
export const mockClipboard = () => {
  const writeText = jest.fn(() => Promise.resolve());
  const readText = jest.fn(() => Promise.resolve('mocked text'));

  Object.assign(navigator, {
    clipboard: {
      writeText,
      readText,
    },
  });

  return { writeText, readText };
};

// Helper for testing timers
export const advanceTimersAndWait = async (ms: number) => {
  jest.advanceTimersByTime(ms);
  await new Promise((resolve) => setImmediate(resolve));
};

// Custom render function that can be extended with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, options);

export * from '@testing-library/react';
export { customRender as render };
