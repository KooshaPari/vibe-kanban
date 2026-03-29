import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockFetch } from '../../utils/test-utils';
import { projectsApi } from '@/lib/api';

// Type definitions
interface Project {
  id: string;
  name: string;
  description?: string;
  path?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProjectCreateData {
  name: string;
  description?: string;
  path?: string;
}

// Component that uses projects API
const ProjectsApiTestComponent = () => {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(
    null
  );

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

  const createProject = async (projectData: ProjectCreateData) => {
    setLoading(true);
    setError(null);
    try {
      const newProject = await projectsApi.create(projectData);
      setProjects((prev) => [...prev, newProject]);
      return newProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedProject = await projectsApi.update(id, updates);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? updatedProject : p))
      );
      if (selectedProject?.id === id) {
        setSelectedProject(updatedProject);
      }
      return updatedProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await projectsApi.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const project = await projectsApi.getById(id);
      setSelectedProject(project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load project failed');
    } finally {
      setLoading(false);
    }
  };

  const searchFiles = async (projectId: string, query: string) => {
    try {
      const result = await projectsApi.searchFiles(projectId, query);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      throw err;
    }
  };

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'idle'}</div>
      <div data-testid="error">{error || 'none'}</div>

      <button onClick={loadProjects}>Load Projects</button>
      <button
        onClick={() =>
          createProject({
            name: 'Test Project',
            description: 'Test Description',
            path: '/test/path',
          })
        }
      >
        Create Project
      </button>

      <div data-testid="projects-count">{projects.length}</div>

      {projects.map((project) => (
        <div key={project.id} data-testid={`project-${project.id}`}>
          <span data-testid={`project-name-${project.id}`}>{project.name}</span>
          <button onClick={() => loadProject(project.id)}>View Details</button>
          <button
            onClick={() => updateProject(project.id, { name: 'Updated Name' })}
          >
            Update
          </button>
          <button onClick={() => deleteProject(project.id)}>Delete</button>
        </div>
      ))}

      {selectedProject && (
        <div data-testid="selected-project">
          <div data-testid="selected-project-name">{selectedProject.name}</div>
          <div data-testid="selected-project-description">
            {selectedProject.description}
          </div>
        </div>
      )}

      <button onClick={() => searchFiles('1', 'test')}>Search Files</button>
    </div>
  );
};

describe('Projects API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects', () => {
    it('fetches projects successfully', async () => {
      const user = userEvent.setup();
      const { projectsApi } = await import('@/lib/api');

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
        {
          id: '2',
          name: 'Project 2',
          description: 'Second project',
          repository: 'https://github.com/test/repo2',
          branch: 'main',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      projectsApi.getAll.mockResolvedValue(mockProjects);

      render(<ProjectsApiTestComponent />);

      const loadButton = screen.getByText('Load Projects');
      await user.click(loadButton);

      // Should call API
      await waitFor(() => {
        expect(projectsApi.getAll).toHaveBeenCalledTimes(1);
      });

      // Should display projects
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('idle');
        expect(screen.getByTestId('projects-count')).toHaveTextContent('2');
        expect(screen.getByTestId('project-name-1')).toHaveTextContent(
          'Project 1'
        );
        expect(screen.getByTestId('project-name-2')).toHaveTextContent(
          'Project 2'
        );
      });
    });

    it('handles empty projects response', async () => {
      const user = userEvent.setup();
      const { projectsApi } = await import('@/lib/api');

      projectsApi.getAll.mockResolvedValue([]);

      render(<ProjectsApiTestComponent />);

      const loadButton = screen.getByText('Load Projects');
      await user.click(loadButton);

      await waitFor(() => {
        expect(screen.getByTestId('projects-count')).toHaveTextContent('0');
        expect(screen.getByTestId('error')).toHaveTextContent('none');
      });
    });

    it('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<ProjectsApiTestComponent />);

      const loadButton = screen.getByText('Load Projects');
      await user.click(loadButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network error');
        expect(screen.getByTestId('loading')).toHaveTextContent('idle');
      });
    });
  });

  describe('POST /api/projects', () => {
    it('creates project successfully', async () => {
      const user = userEvent.setup();
      const newProject = {
        id: 'new-1',
        name: 'Test Project',
        description: 'Test Description',
        path: '/test/path',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      };

      mockFetch(newProject);

      render(<ProjectsApiTestComponent />);

      const createButton = screen.getByText('Create Project');
      await user.click(createButton);

      // Should make API call with correct data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Project',
            description: 'Test Description',
            path: '/test/path',
          }),
        });
      });

      // Should add project to list
      await waitFor(() => {
        expect(screen.getByTestId('projects-count')).toHaveTextContent('1');
        expect(screen.getByTestId('project-name-new-1')).toHaveTextContent(
          'Test Project'
        );
      });
    });

    it('handles creation validation errors', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Path already exists' }),
      });

      render(<ProjectsApiTestComponent />);

      const createButton = screen.getByText('Create Project');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Create failed');
      });
    });
  });

  describe('GET /api/projects/:id', () => {
    it('fetches individual project details', async () => {
      const user = userEvent.setup();
      const project = {
        id: '1',
        name: 'Detailed Project',
        description: 'Detailed description',
        path: '/detailed/path',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        settings: {
          auto_save: true,
          branch_protection: false,
        },
      };

      // First load projects list
      mockFetch([project]);

      render(<ProjectsApiTestComponent />);

      const loadButton = screen.getByText('Load Projects');
      await user.click(loadButton);

      await waitFor(() => {
        expect(screen.getByTestId('project-name-1')).toHaveTextContent(
          'Detailed Project'
        );
      });

      // Then load individual project details
      mockFetch(project);

      const viewDetailsButton = screen.getByText('View Details');
      await user.click(viewDetailsButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenLastCalledWith('/api/projects/1', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
      });

      // Should show detailed project info
      await waitFor(() => {
        expect(screen.getByTestId('selected-project-name')).toHaveTextContent(
          'Detailed Project'
        );
        expect(
          screen.getByTestId('selected-project-description')
        ).toHaveTextContent('Detailed description');
      });
    });

    it('handles project not found error', async () => {
      const user = userEvent.setup();
      const project = {
        id: '1',
        name: 'Test Project',
        description: 'Test',
        path: '/test',
      };

      // Load projects first
      mockFetch([project]);

      render(<ProjectsApiTestComponent />);

      const loadButton = screen.getByText('Load Projects');
      await user.click(loadButton);

      await waitFor(() => {
        expect(screen.getByTestId('project-name-1')).toHaveTextContent(
          'Test Project'
        );
      });

      // Mock 404 for project details
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Project not found' }),
      });

      const viewDetailsButton = screen.getByText('View Details');
      await user.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Load project failed'
        );
      });
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('updates project successfully', async () => {
      const user = userEvent.setup();
      const originalProject = {
        id: '1',
        name: 'Original Name',
        description: 'Original description',
        path: '/original/path',
      };
      const updatedProject = {
        ...originalProject,
        name: 'Updated Name',
      };

      // Load projects first
      mockFetch([originalProject]);

      render(<ProjectsApiTestComponent />);

      const loadButton = screen.getByText('Load Projects');
      await user.click(loadButton);

      await waitFor(() => {
        expect(screen.getByTestId('project-name-1')).toHaveTextContent(
          'Original Name'
        );
      });

      // Update project
      mockFetch(updatedProject);

      const updateButton = screen.getByText('Update');
      await user.click(updateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenLastCalledWith('/api/projects/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated Name' }),
        });
      });

      // Should update project in list
      await waitFor(() => {
        expect(screen.getByTestId('project-name-1')).toHaveTextContent(
          'Updated Name'
        );
      });
    });

    it('handles concurrent update conflicts', async () => {
      const user = userEvent.setup();
      const project = {
        id: '1',
        name: 'Test Project',
        description: 'Test',
        path: '/test',
      };

      // Load projects first
      mockFetch([project]);

      render(<ProjectsApiTestComponent />);

      const loadButton = screen.getByText('Load Projects');
      await user.click(loadButton);

      await waitFor(() => {
        expect(screen.getByTestId('project-name-1')).toHaveTextContent(
          'Test Project'
        );
      });

      // Mock conflict error
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Project was modified by another user' }),
      });

      const updateButton = screen.getByText('Update');
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Update failed');
      });
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('deletes project successfully', async () => {
      const user = userEvent.setup();
      const projects = [
        { id: '1', name: 'Project 1', description: 'First', path: '/path1' },
        { id: '2', name: 'Project 2', description: 'Second', path: '/path2' },
      ];

      // Load projects first
      mockFetch(projects);

      render(<ProjectsApiTestComponent />);

      const loadButton = screen.getByText('Load Projects');
      await user.click(loadButton);

      await waitFor(() => {
        expect(screen.getByTestId('projects-count')).toHaveTextContent('2');
      });

      // Delete project
      mockFetch(undefined, 204); // No content response

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenLastCalledWith('/api/projects/1', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
      });

      // Should remove project from list
      await waitFor(() => {
        expect(screen.getByTestId('projects-count')).toHaveTextContent('1');
        expect(screen.queryByTestId('project-1')).not.toBeInTheDocument();
      });
    });

    it('handles delete dependencies error', async () => {
      const user = userEvent.setup();
      const project = {
        id: '1',
        name: 'Project 1',
        description: 'First',
        path: '/path1',
      };

      // Load projects first
      mockFetch([project]);

      render(<ProjectsApiTestComponent />);

      const loadButton = screen.getByText('Load Projects');
      await user.click(loadButton);

      await waitFor(() => {
        expect(screen.getByTestId('projects-count')).toHaveTextContent('1');
      });

      // Mock dependency error
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Project has active tasks' }),
      });

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Delete failed');
        expect(screen.getByTestId('projects-count')).toHaveTextContent('1'); // Should still be there
      });
    });
  });

  describe('POST /api/projects/validate', () => {
    it('validates project path successfully', async () => {
      const user = userEvent.setup();
      const validationResult = { valid: true, error: null };

      mockFetch(validationResult);

      render(<ProjectsApiTestComponent />);

      const validateButton = screen.getByText('Validate Path');
      await user.click(validateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: '/test/path' }),
        });
      });

      // Should not show error for valid path
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('none');
      });
    });

    it('handles validation errors', async () => {
      const user = userEvent.setup();
      const validationResult = { valid: false, error: 'Path does not exist' };

      mockFetch(validationResult);

      render(<ProjectsApiTestComponent />);

      const validateButton = screen.getByText('Validate Path');
      await user.click(validateButton);

      // For this test, we expect the validation to return an error result
      // but not throw an exception, so error should remain 'none'
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('none');
      });
    });
  });

  describe('API Request Headers and Authentication', () => {
    it('includes proper headers in all requests', async () => {
      const user = userEvent.setup();
      mockFetch([]);

      render(<ProjectsApiTestComponent />);

      const loadButton = screen.getByText('Load Projects');
      await user.click(loadButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
      });
    });

    it('handles unauthorized access', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      render(<ProjectsApiTestComponent />);

      const loadButton = screen.getByText('Load Projects');
      await user.click(loadButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network error');
      });
    });
  });

  describe('Error Response Handling', () => {
    it('handles malformed JSON responses', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      render(<ProjectsApiTestComponent />);

      const loadButton = screen.getByText('Load Projects');
      await user.click(loadButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid JSON');
      });
    });

    it('handles network timeout errors', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });

      render(<ProjectsApiTestComponent />);

      const loadButton = screen.getByText('Load Projects');
      await user.click(loadButton);

      await waitFor(
        () => {
          expect(screen.getByTestId('error')).toHaveTextContent(
            'Request timeout'
          );
        },
        { timeout: 1000 }
      );
    });
  });
});
