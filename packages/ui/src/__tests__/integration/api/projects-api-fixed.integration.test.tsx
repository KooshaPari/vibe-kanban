import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../utils/test-utils';

// Mock the API module directly in this test
jest.mock('@/lib/api', () => ({
  projectsApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    openEditor: jest.fn(),
    getBranches: jest.fn(),
    searchFiles: jest.fn(),
    getWithBranch: jest.fn(),
  },
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
    saveConfig: jest.fn(),
  },
  githubAuthApi: {
    checkGithubToken: jest.fn().mockResolvedValue(true),
    start: jest.fn(),
    poll: jest.fn(),
  },
}));

import { projectsApi } from '@/lib/api';

// Type definitions
interface Project {
  id: string;
  name: string;
  description?: string;
  path?: string;
}

// Simple component that uses projects API
const ProjectsTestComponent = () => {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await projectsApi.getAll();
      setProjects(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    setLoading(true);
    setError(null);
    try {
      const newProject = await projectsApi.create({
        name: 'Test Project',
        description: 'Test Description',
        repository: 'https://github.com/test/repo',
        branch: 'main',
      });
      setProjects((prev) => [...prev, newProject]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'idle'}</div>
      <div data-testid="error">{error || 'none'}</div>
      <div data-testid="projects-count">{projects.length}</div>

      <button onClick={loadProjects}>Load Projects</button>
      <button onClick={createProject}>Create Project</button>

      {projects.map((project) => (
        <div key={project.id} data-testid={`project-${project.id}`}>
          <span data-testid={`project-name-${project.id}`}>{project.name}</span>
        </div>
      ))}
    </div>
  );
};

describe('Projects API Integration Tests - Fixed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads projects successfully', async () => {
    const user = userEvent.setup();

    const mockProjects = [
      {
        id: '1',
        name: 'Project 1',
        description: 'First project',
        repository: 'https://github.com/test/repo1',
        branch: 'main',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    projectsApi.getAll.mockResolvedValue(mockProjects);

    render(<ProjectsTestComponent />);

    const loadButton = screen.getByText('Load Projects');
    await user.click(loadButton);

    await waitFor(() => {
      expect(projectsApi.getAll).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('projects-count')).toHaveTextContent('1');
      expect(screen.getByTestId('project-name-1')).toHaveTextContent(
        'Project 1'
      );
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });
  });

  it('handles empty projects list', async () => {
    const user = userEvent.setup();

    projectsApi.getAll.mockResolvedValue([]);

    render(<ProjectsTestComponent />);

    const loadButton = screen.getByText('Load Projects');
    await user.click(loadButton);

    await waitFor(() => {
      expect(screen.getByTestId('projects-count')).toHaveTextContent('0');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });
  });

  it('handles API errors', async () => {
    const user = userEvent.setup();

    projectsApi.getAll.mockRejectedValue(new Error('Network error'));

    render(<ProjectsTestComponent />);

    const loadButton = screen.getByText('Load Projects');
    await user.click(loadButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Network error');
      expect(screen.getByTestId('projects-count')).toHaveTextContent('0');
    });
  });

  it('creates projects successfully', async () => {
    const user = userEvent.setup();

    const newProject = {
      id: 'new-1',
      name: 'Test Project',
      description: 'Test Description',
      repository: 'https://github.com/test/repo',
      branch: 'main',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    };

    projectsApi.create.mockResolvedValue(newProject);

    render(<ProjectsTestComponent />);

    const createButton = screen.getByText('Create Project');
    await user.click(createButton);

    await waitFor(() => {
      expect(projectsApi.create).toHaveBeenCalledWith({
        name: 'Test Project',
        description: 'Test Description',
        repository: 'https://github.com/test/repo',
        branch: 'main',
      });
      expect(screen.getByTestId('projects-count')).toHaveTextContent('1');
      expect(screen.getByTestId('project-name-new-1')).toHaveTextContent(
        'Test Project'
      );
    });
  });

  it('handles create project errors', async () => {
    const user = userEvent.setup();

    projectsApi.create.mockRejectedValue(new Error('Create failed'));

    render(<ProjectsTestComponent />);

    const createButton = screen.getByText('Create Project');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Create failed');
      expect(screen.getByTestId('projects-count')).toHaveTextContent('0');
    });
  });

  it('shows loading states correctly', async () => {
    const user = userEvent.setup();

    // Create a promise that we can control
    let resolvePromise: (value: Project[]) => void;
    const loadingPromise = new Promise<Project[]>((resolve) => {
      resolvePromise = resolve;
    });

    projectsApi.getAll.mockReturnValue(loadingPromise);

    render(<ProjectsTestComponent />);

    const loadButton = screen.getByText('Load Projects');

    // Initially not loading
    expect(screen.getByTestId('loading')).toHaveTextContent('idle');

    await user.click(loadButton);

    // Should show loading immediately
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');

    // Resolve the promise
    if (resolvePromise) {
      resolvePromise([]);
    }

    // Should return to idle
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('idle');
    });
  });
});
