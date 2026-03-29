import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { ConfigProvider, useConfig } from '@/components/config-provider';
import type { Config, EditorType, ExecutorConfig } from 'shared/types';

// Mock the API module directly in this test
jest.mock('@/lib/api', () => ({
  configApi: {
    getConfig: jest.fn(),
    saveConfig: jest.fn(),
  },
  githubAuthApi: {
    checkGithubToken: jest.fn().mockResolvedValue(true),
    start: jest.fn(),
    poll: jest.fn(),
  },
}));

const mockConfig: Config = {
  disclaimer_acknowledged: false,
  onboarding_acknowledged: false,
  telemetry_acknowledged: false,
  github_login_acknowledged: false,
  analytics_enabled: false,
  theme: 'light',
  executor: {
    type: 'local',
    local: {
      is_valid: true,
      validation_error: null,
    },
    anthropic: {
      is_valid: false,
      validation_error: null,
    },
    openai: {
      is_valid: false,
      validation_error: null,
    },
  },
  editor: {
    editor_type: 'vs_code',
    custom_command: null,
  },
};

// Test component that uses the config context
const TestConfigConsumer = () => {
  const { config, updateConfig, loading } = useConfig();

  if (loading) return <div>Loading...</div>;
  if (!config) return <div>No config</div>;

  const handleUpdateTheme = () => {
    // Cycle through: light -> dark -> system -> light
    let nextTheme: 'light' | 'dark' | 'system';
    if (config.theme === 'light') {
      nextTheme = 'dark';
    } else if (config.theme === 'dark') {
      nextTheme = 'system';
    } else {
      nextTheme = 'light';
    }
    updateConfig({ theme: nextTheme });
  };

  const handleUpdateExecutor = () => {
    const newExecutor: ExecutorConfig = {
      ...config.executor,
      type: config.executor.type === 'local' ? 'anthropic' : 'local',
    };
    updateConfig({ executor: newExecutor });
  };

  const handleAcknowledgeDisclaimer = () => {
    updateConfig({ disclaimer_acknowledged: true });
  };

  return (
    <div>
      <div data-testid="theme">Theme: {config.theme}</div>
      <div data-testid="executor">Executor: {config.executor.type}</div>
      <div data-testid="disclaimer">
        Disclaimer:{' '}
        {config.disclaimer_acknowledged ? 'acknowledged' : 'not acknowledged'}
      </div>
      <div data-testid="onboarding">
        Onboarding:{' '}
        {config.onboarding_acknowledged ? 'acknowledged' : 'not acknowledged'}
      </div>
      <div data-testid="telemetry">
        Telemetry:{' '}
        {config.telemetry_acknowledged ? 'acknowledged' : 'not acknowledged'}
      </div>
      <div data-testid="github">
        GitHub:{' '}
        {config.github_login_acknowledged ? 'acknowledged' : 'not acknowledged'}
      </div>
      <div data-testid="analytics">
        Analytics: {config.analytics_enabled ? 'enabled' : 'disabled'}
      </div>
      <div data-testid="editor">
        Editor: {config.editor.editor_type}
        {config.editor.custom_command && ` (${config.editor.custom_command})`}
      </div>

      <button onClick={handleUpdateTheme}>Toggle Theme</button>
      <button onClick={handleUpdateExecutor}>Toggle Executor</button>
      <button onClick={handleAcknowledgeDisclaimer}>
        Acknowledge Disclaimer
      </button>
    </div>
  );
};

describe('Config Provider Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Configuration Loading', () => {
    it('loads configuration from API on mount', async () => {
      const { configApi } = await import('@/lib/api');
      configApi.getConfig.mockResolvedValue(mockConfig);

      render(
        <ConfigProvider>
          <TestConfigConsumer />
        </ConfigProvider>
      );

      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Should load config from API
      await waitFor(() => {
        expect(configApi.getConfig).toHaveBeenCalledTimes(1);
      });

      // Should display loaded config
      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('Theme: light');
        expect(screen.getByTestId('executor')).toHaveTextContent(
          'Executor: local'
        );
        expect(screen.getByTestId('disclaimer')).toHaveTextContent(
          'Disclaimer: not acknowledged'
        );
      });
    });

    it('uses initial config when provided', async () => {
      const initialConfig = { ...mockConfig, theme: 'dark' as const };

      render(
        <ConfigProvider initialConfig={initialConfig}>
          <TestConfigConsumer />
        </ConfigProvider>
      );

      // Should use initial config immediately
      expect(screen.getByTestId('theme')).toHaveTextContent('Theme: dark');
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
      const { configApi } = await import('@/lib/api');
      configApi.getConfig.mockRejectedValue(new Error('API Error'));

      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <ConfigProvider>
          <TestConfigConsumer />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('No config')).toBeInTheDocument();
      });

      expect(consoleError).toHaveBeenCalledWith(
        'Error loading config:',
        expect.any(Error)
      );
      consoleError.mockRestore();
    });
  });

  describe('Configuration Updates', () => {
    it('updates configuration locally and persists to API', async () => {
      const user = userEvent.setup();
      const { configApi } = await import('@/lib/api');

      configApi.getConfig.mockResolvedValue(mockConfig);
      configApi.saveConfig.mockResolvedValue(undefined);

      render(
        <ConfigProvider>
          <TestConfigConsumer />
        </ConfigProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('Theme: light');
      });

      // Update theme
      const toggleThemeButton = screen.getByText('Toggle Theme');
      await user.click(toggleThemeButton);

      // Should update locally immediately
      expect(screen.getByTestId('theme')).toHaveTextContent('Theme: dark');

      // Should persist to API
      await waitFor(() => {
        expect(configApi.saveConfig).toHaveBeenCalledWith({
          ...mockConfig,
          theme: 'dark',
        });
      });
    });

    it('handles multiple rapid updates correctly', async () => {
      const user = userEvent.setup();
      const { configApi } = await import('@/lib/api');

      configApi.getConfig.mockResolvedValue(mockConfig);
      configApi.saveConfig.mockResolvedValue(undefined);

      render(
        <ConfigProvider>
          <TestConfigConsumer />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('Theme: light');
      });

      // Rapidly toggle theme multiple times
      const toggleThemeButton = screen.getByText('Toggle Theme');
      await user.click(toggleThemeButton); // light -> dark
      await user.click(toggleThemeButton); // dark -> system
      await user.click(toggleThemeButton); // system -> light

      // Should end up with light theme
      expect(screen.getByTestId('theme')).toHaveTextContent('Theme: light');

      // Should debounce API calls
      await waitFor(() => {
        expect(configApi.saveConfig).toHaveBeenCalledWith({
          ...mockConfig,
          theme: 'light',
        });
      });
    });

    it('handles nested configuration updates', async () => {
      const user = userEvent.setup();
      const { configApi } = await import('@/lib/api');

      configApi.getConfig.mockResolvedValue(mockConfig);
      configApi.saveConfig.mockResolvedValue(undefined);

      render(
        <ConfigProvider>
          <TestConfigConsumer />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('executor')).toHaveTextContent(
          'Executor: local'
        );
      });

      // Update executor type
      const toggleExecutorButton = screen.getByText('Toggle Executor');
      await user.click(toggleExecutorButton);

      // Should update executor configuration
      expect(screen.getByTestId('executor')).toHaveTextContent(
        'Executor: anthropic'
      );

      // Should persist nested update
      await waitFor(() => {
        expect(configApi.saveConfig).toHaveBeenCalledWith({
          ...mockConfig,
          executor: {
            ...mockConfig.executor,
            type: 'anthropic',
          },
        });
      });
    });
  });

  describe('Onboarding Flow Integration', () => {
    it('manages onboarding acknowledgment flow', async () => {
      const user = userEvent.setup();
      const { configApi } = await import('@/lib/api');

      const unacknowledgedConfig = {
        ...mockConfig,
        disclaimer_acknowledged: false,
        onboarding_acknowledged: false,
        telemetry_acknowledged: false,
        github_login_acknowledged: false,
      };

      configApi.getConfig.mockResolvedValue(unacknowledgedConfig);
      configApi.saveConfig.mockResolvedValue(undefined);

      render(
        <ConfigProvider>
          <TestConfigConsumer />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('disclaimer')).toHaveTextContent(
          'Disclaimer: not acknowledged'
        );
      });

      // Acknowledge disclaimer
      const acknowledgeButton = screen.getByText('Acknowledge Disclaimer');
      await user.click(acknowledgeButton);

      // Should update disclaimer acknowledgment
      expect(screen.getByTestId('disclaimer')).toHaveTextContent(
        'Disclaimer: acknowledged'
      );

      // Should persist the change
      await waitFor(() => {
        expect(configApi.saveConfig).toHaveBeenCalledWith({
          ...unacknowledgedConfig,
          disclaimer_acknowledged: true,
        });
      });
    });

    it('handles complete onboarding workflow', async () => {
      const { configApi: _configApi } = await import('@/lib/api');

      const completeConfig = {
        ...mockConfig,
        disclaimer_acknowledged: true,
        onboarding_acknowledged: true,
        telemetry_acknowledged: true,
        github_login_acknowledged: true,
        analytics_enabled: false,
      };

      render(
        <ConfigProvider initialConfig={completeConfig}>
          <TestConfigConsumer />
        </ConfigProvider>
      );

      // Should show all acknowledgments complete from the start with initialConfig
      expect(screen.getByTestId('disclaimer')).toHaveTextContent(
        'Disclaimer: acknowledged'
      );
      expect(screen.getByTestId('onboarding')).toHaveTextContent(
        'Onboarding: acknowledged'
      );
      expect(screen.getByTestId('telemetry')).toHaveTextContent(
        'Telemetry: acknowledged'
      );
      expect(screen.getByTestId('github')).toHaveTextContent(
        'GitHub: acknowledged'
      );
    });
  });

  describe('Theme and Preference Management', () => {
    it('manages theme preferences correctly', async () => {
      const user = userEvent.setup();
      const { configApi } = await import('@/lib/api');

      configApi.getConfig.mockResolvedValue({ ...mockConfig, theme: 'system' });
      configApi.saveConfig.mockResolvedValue(undefined);

      render(
        <ConfigProvider>
          <TestConfigConsumer />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('Theme: system');
      });

      // Toggle to light theme (system -> light)
      const toggleButton = screen.getByText('Toggle Theme');
      await user.click(toggleButton);

      expect(screen.getByTestId('theme')).toHaveTextContent('Theme: light');

      // Toggle to dark theme (light -> dark)
      await user.click(toggleButton);

      expect(screen.getByTestId('theme')).toHaveTextContent('Theme: dark');
    });

    it('manages editor preferences', async () => {
      const { configApi } = await import('@/lib/api');

      const editorConfig = {
        ...mockConfig,
        editor: {
          editor_type: 'custom' as EditorType,
          custom_command: 'code --wait',
        },
      };

      configApi.getConfig.mockResolvedValue(editorConfig);

      render(
        <ConfigProvider>
          <TestConfigConsumer />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('editor')).toHaveTextContent(
          'Editor: custom (code --wait)'
        );
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('handles save configuration errors gracefully', async () => {
      const user = userEvent.setup();
      const { configApi } = await import('@/lib/api');

      configApi.getConfig.mockResolvedValue(mockConfig);
      configApi.saveConfig.mockRejectedValue(new Error('Save failed'));

      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <ConfigProvider>
          <TestConfigConsumer />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('Theme: light');
      });

      // Try to update theme
      const toggleButton = screen.getByText('Toggle Theme');
      await user.click(toggleButton);

      // Should update locally even if save fails
      expect(screen.getByTestId('theme')).toHaveTextContent('Theme: dark');

      // Should log error
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Error saving config:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('retries failed configuration saves', async () => {
      const user = userEvent.setup();
      const { configApi } = await import('@/lib/api');

      configApi.getConfig.mockResolvedValue(mockConfig);
      configApi.saveConfig
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      render(
        <ConfigProvider>
          <TestConfigConsumer />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('Theme: light');
      });

      // Update theme
      const toggleButton = screen.getByText('Toggle Theme');
      await user.click(toggleButton);

      // Should eventually succeed on retry (wait longer for retries)
      await waitFor(
        () => {
          expect(configApi.saveConfig).toHaveBeenCalledTimes(2);
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Context Provider Isolation', () => {
    it('maintains separate config state for multiple providers', async () => {
      const { configApi } = await import('@/lib/api');
      configApi.getConfig.mockResolvedValue(mockConfig);

      const config1 = { ...mockConfig, theme: 'light' as const };
      const config2 = { ...mockConfig, theme: 'dark' as const };

      render(
        <div>
          <ConfigProvider initialConfig={config1}>
            <div data-testid="provider1">
              <TestConfigConsumer />
            </div>
          </ConfigProvider>
          <ConfigProvider initialConfig={config2}>
            <div data-testid="provider2">
              <TestConfigConsumer />
            </div>
          </ConfigProvider>
        </div>
      );

      // Each provider should maintain its own state
      const provider1 = screen.getByTestId('provider1');
      const provider2 = screen.getByTestId('provider2');

      expect(within(provider1).getByTestId('theme')).toHaveTextContent(
        'Theme: light'
      );
      expect(within(provider2).getByTestId('theme')).toHaveTextContent(
        'Theme: dark'
      );
    });
  });
});

// Helper to access within from testing library
function within(element: HTMLElement) {
  return {
    getByTestId: (testId: string) => {
      const found = element.querySelector(`[data-testid="${testId}"]`);
      if (!found)
        throw new Error(`Unable to find element with testid: ${testId}`);
      return found;
    },
  };
}
