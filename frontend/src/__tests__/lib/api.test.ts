/**
 * Comprehensive unit tests for API functions
 * Testing all API endpoints and error handling scenarios
 */

import { makeRequest, projectsApi, tasksApi, configApi } from '@/lib/api';
import type { Config, Project, Task } from 'shared/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('makeRequest utility', () => {
    it('should make GET request with default headers', async () => {
      const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({ data: 'test' }) };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await makeRequest('/api/test');

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle FormData without Content-Type header', async () => {
      const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({ data: 'test' }) };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const formData = new FormData();
      await makeRequest('/api/upload', {
        method: 'POST',
        body: formData,
      });

      expect(fetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {},
      });
    });

    it('should merge custom headers with defaults', async () => {
      const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({ data: 'test' }) };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await makeRequest('/api/test', {
        headers: { 'Authorization': 'Bearer token' },
      });

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token',
        },
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(makeRequest('/api/test')).rejects.toThrow('Network error');
    });
  });

  describe('projectsApi', () => {
    describe('getAll', () => {
      it('should fetch all projects successfully', async () => {
        const mockProjects: Project[] = [
          {
            id: '1',
            name: 'Test Project',
            git_repo_path: '/path/to/repo',
            setup_script: null,
            dev_script: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ];
        
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockProjects),
        });

        const result = await projectsApi.getAll();

        expect(fetch).toHaveBeenCalledWith('/api/projects');
        expect(result).toEqual(mockProjects);
      });

      it('should handle API errors', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        });

        await expect(projectsApi.getAll()).rejects.toThrow();
      });
    });

    describe('getById', () => {
      it('should fetch project by id successfully', async () => {
        const mockProject: Project = {
          id: '1',
          name: 'Test Project',
          git_repo_path: '/path/to/repo',
          setup_script: null,
          dev_script: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
        
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockProject),
        });

        const result = await projectsApi.getById('1');

        expect(fetch).toHaveBeenCalledWith('/api/projects/1');
        expect(result).toEqual(mockProject);
      });

      it('should handle 404 errors', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        });

        await expect(projectsApi.getById('999')).rejects.toThrow();
      });
    });

    describe('create', () => {
      it('should create project successfully', async () => {
        const newProject = {
          name: 'New Project',
          git_repo_path: '/new/path',
          setup_script: null,
          dev_script: null,
        };

        const createdProject: Project = {
          id: '2',
          ...newProject,
          created_at: new Date(),
          updated_at: new Date(),
        };
        
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(createdProject),
        });

        const result = await projectsApi.create(newProject);

        expect(fetch).toHaveBeenCalledWith('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProject),
        });
        expect(result).toEqual(createdProject);
      });

      it('should handle validation errors', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: jest.fn().mockResolvedValue({
            error: 'Project name is required',
          }),
        });

        await expect(projectsApi.create({
          name: '',
          git_repo_path: '/path',
          setup_script: null,
          dev_script: null,
        })).rejects.toThrow();
      });
    });

    describe('update', () => {
      it('should update project successfully', async () => {
        const updateData = {
          name: 'Updated Project',
          git_repo_path: '/updated/path',
          setup_script: null,
          dev_script: null,
        };

        const updatedProject: Project = {
          id: '1',
          ...updateData,
          created_at: new Date(),
          updated_at: new Date(),
        };
        
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(updatedProject),
        });

        const result = await projectsApi.update('1', updateData);

        expect(fetch).toHaveBeenCalledWith('/api/projects/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });
        expect(result).toEqual(updatedProject);
      });
    });

    describe('delete', () => {
      it('should delete project successfully', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({}),
        });

        await projectsApi.delete('1');

        expect(fetch).toHaveBeenCalledWith('/api/projects/1', {
          method: 'DELETE',
        });
      });

      it('should handle delete conflicts', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 409,
          statusText: 'Conflict',
          json: jest.fn().mockResolvedValue({
            error: 'Cannot delete project with active tasks',
          }),
        });

        await expect(projectsApi.delete('1')).rejects.toThrow();
      });
    });

    describe('validateProject', () => {
      it('should validate project path successfully', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({ valid: true }),
        });

        const result = await projectsApi.validateProject({ path: '/valid/path' });

        expect(fetch).toHaveBeenCalledWith('/api/projects/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: '/valid/path' }),
        });
        expect(result).toEqual({ valid: true });
      });

      it('should return validation errors', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({
            valid: false,
            error: 'Path does not exist',
          }),
        });

        const result = await projectsApi.validateProject({ path: '/invalid/path' });

        expect(result).toEqual({
          valid: false,
          error: 'Path does not exist',
        });
      });
    });
  });

  describe('tasksApi', () => {
    describe('getAll', () => {
      it('should fetch all tasks for project', async () => {
        const mockTasks: Task[] = [
          {
            id: '1',
            project_id: 'project-1',
            title: 'Test Task',
            description: 'A test task',
            status: 'todo',
            parent_task_attempt: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ];
        
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockTasks),
        });

        const result = await tasksApi.getAll('project-1');

        expect(fetch).toHaveBeenCalledWith('/api/projects/project-1/tasks');
        expect(result).toEqual(mockTasks);
      });

      it('should handle empty task list', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue([]),
        });

        const result = await tasksApi.getAll('project-1');

        expect(result).toEqual([]);
      });
    });

    describe('create', () => {
      it('should create task successfully', async () => {
        const newTask = {
          title: 'New Task',
          description: 'A new task',
          status: 'todo' as const,
          parent_task_attempt: null,
        };

        const createdTask: Task = {
          id: '2',
          project_id: 'project-1',
          ...newTask,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };
        
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(createdTask),
        });

        const result = await tasksApi.create('project-1', newTask);

        expect(fetch).toHaveBeenCalledWith('/api/projects/project-1/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask),
        });
        expect(result).toEqual(createdTask);
      });
    });

    describe('update', () => {
      it('should update task successfully', async () => {
        const updateData = {
          title: 'Updated Task',
          description: 'Updated description',
          status: 'in_progress' as const,
        };

        const updatedTask: Task = {
          id: '1',
          project_id: 'project-1',
          parent_task_attempt: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T12:00:00Z',
          ...updateData,
        };
        
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(updatedTask),
        });

        const result = await tasksApi.update('1', updateData);

        expect(fetch).toHaveBeenCalledWith('/api/tasks/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });
        expect(result).toEqual(updatedTask);
      });
    });

    describe('delete', () => {
      it('should delete task successfully', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({}),
        });

        await tasksApi.delete('1');

        expect(fetch).toHaveBeenCalledWith('/api/tasks/1', {
          method: 'DELETE',
        });
      });
    });
  });

  describe('configApi', () => {
    describe('getConfig', () => {
      it('should fetch config successfully', async () => {
        const mockConfig: Config = {
          disclaimer_acknowledged: true,
          onboarding_acknowledged: true,
          telemetry_acknowledged: true,
          github_login_acknowledged: true,
          analytics_enabled: false,
          executors: {
            claude: { is_valid: true, validation_error: null },
            openai: { is_valid: false, validation_error: 'Invalid API key' },
          },
          github: {
            token: null,
            username: null,
            primary_email: null,
            default_pr_base: null,
          },
          editor: {
            editor_type: 'vscode',
            custom_command: null,
          },
        };
        
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockConfig),
        });

        const result = await configApi.getConfig();

        expect(fetch).toHaveBeenCalledWith('/api/config');
        expect(result).toEqual(mockConfig);
      });

      it('should handle config loading errors', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        });

        await expect(configApi.getConfig()).rejects.toThrow();
      });
    });

    describe('saveConfig', () => {
      it('should save config successfully', async () => {
        const configUpdate = {
          analytics_enabled: true,
          disclaimer_acknowledged: true,
        };
        
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({}),
        });

        await configApi.saveConfig(configUpdate);

        expect(fetch).toHaveBeenCalledWith('/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(configUpdate),
        });
      });

      it('should handle save errors', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
        });

        await expect(configApi.saveConfig({})).rejects.toThrow();
      });
    });
  });

  describe('Error handling patterns', () => {
    it('should handle malformed JSON responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      await expect(projectsApi.getAll()).rejects.toThrow('Invalid JSON');
    });

    it('should handle timeout scenarios', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(projectsApi.getAll()).rejects.toThrow('Request timeout');
    });

    it('should preserve original error information', async () => {
      const mockError = new Error('Original error');
      (global.fetch as jest.Mock).mockRejectedValue(mockError);

      await expect(projectsApi.getAll()).rejects.toThrow('Original error');
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle concurrent requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue([]),
      });

      const promises = [
        projectsApi.getAll(),
        projectsApi.getAll(),
        projectsApi.getAll(),
      ];

      await Promise.all(promises);

      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle empty request bodies correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      await configApi.saveConfig({});

      expect(fetch).toHaveBeenCalledWith('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    });

    it('should handle special characters in URLs', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      await projectsApi.getById('test-project-with-dashes');

      expect(fetch).toHaveBeenCalledWith('/api/projects/test-project-with-dashes');
    });
  });
});