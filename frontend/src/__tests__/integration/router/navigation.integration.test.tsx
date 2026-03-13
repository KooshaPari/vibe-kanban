import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import App from '@/App';
import { ConfigProvider } from '@/components/config-provider';
import { ThemeProvider } from '@/components/theme-provider';

// Mock the API module
jest.mock('@/lib/api', () => ({
  projectsApi: {
    getProjects: jest.fn(),
    getProject: jest.fn(),
  },
  tasksApi: {
    getTasks: jest.fn(),
  },
  configApi: {
    getConfig: jest.fn(),
    saveConfig: jest.fn(),
  },
  mcpServersApi: {
    getServers: jest.fn(),
  },
}));

// Mock Sentry
jest.mock('@sentry/react', () => ({
  ...jest.requireActual('@sentry/react'),
  init: jest.fn(),
  setTag: jest.fn(),
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  withSentryReactRouterV6Routing: (component: React.ComponentType) => component,
}));

const mockConfig = {
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
};

const renderWithRouter = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ConfigProvider initialConfig={mockConfig}>
        <ThemeProvider initialTheme="light">
          <App />
        </ThemeProvider>
      </ConfigProvider>
    </MemoryRouter>
  );
};

describe('Router Navigation Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Route Navigation', () => {
    it('navigates to projects page from root', async () => {
      const { configApi, projectsApi } = await import('@/lib/api');
      (configApi.getConfig as jest.Mock).mockResolvedValue(mockConfig);
      (projectsApi.getProjects as jest.Mock).mockResolvedValue([]);

      renderWithRouter('/');

      await waitFor(() => {
        expect(screen.getByText(/projects/i)).toBeInTheDocument();
      });

      // Should display projects page content
      expect(screen.getByText(/create project/i)).toBeInTheDocument();
    });

    it('navigates between different app sections', async () => {
      const user = userEvent.setup();
      const { configApi, projectsApi, mcpServersApi } = await import(
        '@/lib/api'
      );

      (configApi.getConfig as jest.Mock).mockResolvedValue(mockConfig);
      (projectsApi.getProjects as jest.Mock).mockResolvedValue([]);
      (mcpServersApi.getServers as jest.Mock).mockResolvedValue([]);

      renderWithRouter('/');

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/projects/i)).toBeInTheDocument();
      });

      // Navigate to settings
      const settingsLink =
        screen.getByRole('link', { name: /settings/i }) ||
        screen.getByText(/settings/i);
      await user.click(settingsLink);

      await waitFor(() => {
        expect(screen.getByText(/application settings/i)).toBeInTheDocument();
      });

      // Navigate to MCP servers
      const mcpLink =
        screen.getByRole('link', { name: /mcp servers/i }) ||
        screen.getByText(/mcp servers/i);
      await user.click(mcpLink);

      await waitFor(() => {
        expect(screen.getByText(/mcp servers/i)).toBeInTheDocument();
      });

      // Navigate back to projects
      const projectsLink =
        screen.getByRole('link', { name: /projects/i }) ||
        screen.getByText(/projects/i);
      await user.click(projectsLink);

      await waitFor(() => {
        expect(screen.getByText(/create project/i)).toBeInTheDocument();
      });
    });
  });

  describe('Project-specific Navigation', () => {
    const mockProject = {
      id: '1',
      name: 'Test Project',
      description: 'A test project',
      path: '/path/to/project',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    it('navigates to specific project', async () => {
      const { configApi, projectsApi } = await import('@/lib/api');
      (configApi.getConfig as jest.Mock).mockResolvedValue(mockConfig);
      (projectsApi.getProjects as jest.Mock).mockResolvedValue([mockProject]);

      renderWithRouter('/projects/1');

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Should show project-specific content
      expect(screen.getByText('A test project')).toBeInTheDocument();
    });

    it('navigates to project tasks', async () => {
      const { configApi, projectsApi, tasksApi } = await import('@/lib/api');
      (configApi.getConfig as jest.Mock).mockResolvedValue(mockConfig);
      (projectsApi.getProject as jest.Mock).mockResolvedValue(mockProject);
      (tasksApi.getTasks as jest.Mock).mockResolvedValue([]);

      renderWithRouter('/projects/1/tasks');

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Should show task board
      expect(screen.getByText(/to do/i)).toBeInTheDocument();
      expect(screen.getByText(/in progress/i)).toBeInTheDocument();
      expect(screen.getByText(/done/i)).toBeInTheDocument();
    });

    it('navigates to specific task details', async () => {
      const { configApi, projectsApi, tasksApi } = await import('@/lib/api');
      const mockTask = {
        id: 'task-1',
        project_id: '1',
        title: 'Test Task',
        description: 'A test task',
        status: 'todo',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (configApi.getConfig as jest.Mock).mockResolvedValue(mockConfig);
      (projectsApi.getProject as jest.Mock).mockResolvedValue(mockProject);
      (tasksApi.getTasks as jest.Mock).mockResolvedValue([mockTask]);
      (tasksApi.getTaskDetails as jest.Mock).mockResolvedValue(mockTask);

      renderWithRouter('/projects/1/tasks/task-1');

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });

      // Should show task details panel
      expect(screen.getByText(/task details/i)).toBeInTheDocument();
    });
  });

  describe('Route Protection and Error Handling', () => {
    it('handles invalid project routes', async () => {
      const { configApi, projectsApi } = await import('@/lib/api');
      (configApi.getConfig as jest.Mock).mockResolvedValue(mockConfig);
      (projectsApi.getProject as jest.Mock).mockRejectedValue(
        new Error('Project not found')
      );

      renderWithRouter('/projects/invalid-id');

      await waitFor(() => {
        expect(screen.getByText(/project not found/i)).toBeInTheDocument();
      });
    });

    it('handles invalid task routes', async () => {
      const { configApi, projectsApi, tasksApi } = await import('@/lib/api');
      const mockProject = {
        id: '1',
        name: 'Test Project',
        description: 'A test project',
        path: '/path/to/project',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (configApi.getConfig as jest.Mock).mockResolvedValue(mockConfig);
      (projectsApi.getProject as jest.Mock).mockResolvedValue(mockProject);
      (tasksApi.getTasks as jest.Mock).mockResolvedValue([]);
      (tasksApi.getTaskDetails as jest.Mock).mockRejectedValue(
        new Error('Task not found')
      );

      renderWithRouter('/projects/1/tasks/invalid-task-id');

      await waitFor(() => {
        expect(screen.getByText(/task not found/i)).toBeInTheDocument();
      });
    });

    it('redirects unknown routes to home', async () => {
      const { configApi, projectsApi } = await import('@/lib/api');
      (configApi.getConfig as jest.Mock).mockResolvedValue(mockConfig);
      (projectsApi.getProjects as jest.Mock).mockResolvedValue([]);

      renderWithRouter('/unknown-route');

      // Should redirect to home/projects page
      await waitFor(() => {
        expect(screen.getByText(/projects/i)).toBeInTheDocument();
      });
    });
  });

  describe('Deep Linking', () => {
    it('supports deep linking to specific project task', async () => {
      const { configApi, projectsApi, tasksApi } = await import('@/lib/api');
      const mockProject = {
        id: 'project-123',
        name: 'Deep Link Project',
        description: 'A project for deep linking',
        path: '/path/to/deep/project',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      const mockTask = {
        id: 'task-456',
        project_id: 'project-123',
        title: 'Deep Link Task',
        description: 'A task for deep linking',
        status: 'in_progress',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (configApi.getConfig as jest.Mock).mockResolvedValue(mockConfig);
      (projectsApi.getProject as jest.Mock).mockResolvedValue(mockProject);
      (tasksApi.getTasks as jest.Mock).mockResolvedValue([mockTask]);
      (tasksApi.getTaskDetails as jest.Mock).mockResolvedValue(mockTask);

      renderWithRouter('/projects/project-123/tasks/task-456');

      // Should load and display the specific project and task
      await waitFor(() => {
        expect(screen.getByText('Deep Link Project')).toBeInTheDocument();
        expect(screen.getByText('Deep Link Task')).toBeInTheDocument();
      });

      // Should show task details panel
      expect(screen.getByText(/task details/i)).toBeInTheDocument();
    });

    it('maintains URL state during navigation', async () => {
      const user = userEvent.setup();
      const { configApi, projectsApi, tasksApi } = await import('@/lib/api');

      const mockProject = {
        id: '1',
        name: 'URL State Project',
        description: 'A project for URL state testing',
        path: '/path/to/project',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (configApi.getConfig as jest.Mock).mockResolvedValue(mockConfig);
      (projectsApi.getProject as jest.Mock).mockResolvedValue(mockProject);
      (tasksApi.getTasks as jest.Mock).mockResolvedValue([]);

      renderWithRouter('/projects/1/tasks');

      await waitFor(() => {
        expect(screen.getByText('URL State Project')).toBeInTheDocument();
      });

      // Navigate away and back
      const settingsLink =
        screen.getByRole('link', { name: /settings/i }) ||
        screen.getByText(/settings/i);
      await user.click(settingsLink);

      await waitFor(() => {
        expect(screen.getByText(/application settings/i)).toBeInTheDocument();
      });

      // Use browser back button (simulate)
      const backButton = screen.getByRole('button', { name: /back/i });
      if (backButton) {
        await user.click(backButton);
      }

      // Should return to original URL state
      await waitFor(() => {
        expect(screen.getByText('URL State Project')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Performance', () => {
    it('loads routes without unnecessary re-renders', async () => {
      const { configApi, projectsApi } = await import('@/lib/api');
      (configApi.getConfig as jest.Mock).mockResolvedValue(mockConfig);
      (projectsApi.getProjects as jest.Mock).mockResolvedValue([]);

      const { rerender } = renderWithRouter('/');

      await waitFor(() => {
        expect(screen.getByText(/projects/i)).toBeInTheDocument();
      });

      // Verify API was called only once
      expect(projectsApi.getProjects).toHaveBeenCalledTimes(1);

      // Re-render should not trigger additional API calls
      rerender(
        <MemoryRouter initialEntries={['/']}>
          <ConfigProvider initialConfig={mockConfig}>
            <ThemeProvider initialTheme="light">
              <App />
            </ThemeProvider>
          </ConfigProvider>
        </MemoryRouter>
      );

      expect(projectsApi.getProjects).toHaveBeenCalledTimes(1);
    });

    it('caches route data appropriately', async () => {
      const user = userEvent.setup();
      const { configApi, projectsApi } = await import('@/lib/api');

      (configApi.getConfig as jest.Mock).mockResolvedValue(mockConfig);
      (projectsApi.getProjects as jest.Mock).mockResolvedValue([]);

      renderWithRouter('/');

      await waitFor(() => {
        expect(screen.getByText(/projects/i)).toBeInTheDocument();
      });

      // Navigate away
      const settingsLink =
        screen.getByRole('link', { name: /settings/i }) ||
        screen.getByText(/settings/i);
      await user.click(settingsLink);

      // Navigate back
      const projectsLink =
        screen.getByRole('link', { name: /projects/i }) ||
        screen.getByText(/projects/i);
      await user.click(projectsLink);

      // Should use cached data (API called only once)
      expect(projectsApi.getProjects).toHaveBeenCalledTimes(1);
    });
  });
});
