import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { Mock } from 'jest';

// Mock Response for test environment
global.Response = class MockResponse {
  status: number;
  ok: boolean;
  statusText: string;
  
  constructor(body?: any, init?: { status?: number; statusText?: string }) {
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.ok = this.status >= 200 && this.status < 300;
  }

  async text() { return ''; }
  async json() { return {}; }
} as any;
import {
  makeRequest,
  ApiError,
  projectsApi,
  tasksApi,
  attemptsApi,
  configApi,
  githubAuthApi,
  templatesApi,
  mcpServersApi,
  galleryApi,
} from '../lib/api';
import type {
  Project,
  CreateProject,
  UpdateProject,
  Task,
  CreateTask,
  UpdateTask,
  TaskAttempt,
  CreateTaskAttempt,
  Config,
  DeviceStartResponse,
  TaskTemplate,
  CreateTaskTemplate,
  UpdateTaskTemplate,
  TaskAttachment,
  TaskComment,
  CreateTaskComment,
  UpdateTaskComment,
} from 'shared/types';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as Mock;

describe('API Functions', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('makeRequest', () => {
    it('should make a request with JSON content type by default', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: 'test' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await makeRequest('/test', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
      });

      expect(mockFetch).toHaveBeenCalledWith('/test', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should not set Content-Type for FormData', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: 'test' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const formData = new FormData();
      formData.append('file', new File(['test'], 'test.txt'));

      await makeRequest('/test', {
        method: 'POST',
        body: formData,
      });

      expect(mockFetch).toHaveBeenCalledWith('/test', {
        method: 'POST',
        body: formData,
        headers: {},
      });
    });

    it('should merge custom headers', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: 'test' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await makeRequest('/test', {
        headers: {
          Authorization: 'Bearer token',
          'X-Custom': 'value',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith('/test', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token',
          'X-Custom': 'value',
        },
      });
    });
  });

  describe('ApiError', () => {
    it('should create ApiError with message, status, and response', () => {
      const mockResponse = new Response();
      const error = new ApiError('Test error', 400, mockResponse);

      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.response).toBe(mockResponse);
    });
  });

  describe('projectsApi', () => {
    const mockProject: Project = {
      id: '1',
      name: 'Test Project',
      git_repo_path: '/path/to/repo',
      setup_script: null,
      dev_script: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should get all projects', async () => {
      const mockResponse = {
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ success: true, data: [mockProject] }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await projectsApi.getAll();

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual([mockProject]);
    });

    it('should get project by id', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: mockProject }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await projectsApi.getById('1');

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/1', {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockProject);
    });

    it('should create a project', async () => {
      const createData: CreateProject = {
        name: 'New Project',
        git_repo_path: '/path/to/new/repo',
        use_existing_repo: false,
        setup_script: null,
        dev_script: null,
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: mockProject }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await projectsApi.create(createData);

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        body: JSON.stringify(createData),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockProject);
    });

    it('should update a project', async () => {
      const updateData: UpdateProject = {
        name: 'Updated Project',
        git_repo_path: null,
        setup_script: null,
        dev_script: null,
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: mockProject }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await projectsApi.update('1', updateData);

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockProject);
    });

    it('should delete a project', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: null }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await projectsApi.delete('1');

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        url: '/api/projects/999',
        json: jest.fn().mockResolvedValue({ message: 'Project not found' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(projectsApi.getById('999')).rejects.toThrow(ApiError);
      await expect(projectsApi.getById('999')).rejects.toThrow(
        'Project not found'
      );
    });

    it('should search files in a project', async () => {
      const mockSearchResults = [
        { path: 'src/index.ts', name: 'index.ts' },
        { path: 'src/utils.ts', name: 'utils.ts' },
      ];

      const mockResponse = {
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ success: true, data: mockSearchResults }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await projectsApi.searchFiles('1', 'test query');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/1/search?q=test%20query',
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      expect(result).toEqual(mockSearchResults);
    });
  });

  describe('tasksApi', () => {
    const mockTask: Task = {
      id: '1',
      project_id: '1',
      title: 'Test Task',
      description: 'Test description',
      status: 'todo',
      parent_task_attempt: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    it('should get all tasks for a project', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: [mockTask] }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await tasksApi.getAll('1');

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/1/tasks', {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual([mockTask]);
    });

    it('should create a task', async () => {
      const createData: CreateTask = {
        project_id: '1',
        title: 'New Task',
        description: 'New description',
        parent_task_attempt: null,
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: mockTask }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await tasksApi.create('1', createData);

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/1/tasks', {
        method: 'POST',
        body: JSON.stringify(createData),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockTask);
    });

    it('should update a task', async () => {
      const updateData: UpdateTask = {
        title: 'Updated Task',
        description: null,
        status: 'inprogress',
        parent_task_attempt: null,
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: mockTask }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await tasksApi.update('1', '1', updateData);

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/1/tasks/1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockTask);
    });
  });

  describe('attemptsApi', () => {
    const mockAttempt: TaskAttempt = {
      id: '1',
      task_id: '1',
      worktree_path: '/path/to/worktree',
      branch: 'feature/test',
      base_branch: 'main',
      merge_commit: null,
      executor: 'claude',
      pr_url: null,
      pr_number: null,
      pr_status: null,
      pr_merged_at: null,
      worktree_deleted: false,
      setup_completed_at: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    it('should get all attempts for a task', async () => {
      const mockResponse = {
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ success: true, data: [mockAttempt] }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await attemptsApi.getAll('1', '1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/1/tasks/1/attempts',
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      expect(result).toEqual([mockAttempt]);
    });

    it('should create an attempt', async () => {
      const createData: CreateTaskAttempt = {
        executor: 'claude',
        base_branch: 'main',
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: mockAttempt }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await attemptsApi.create('1', '1', createData);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/1/tasks/1/attempts',
        {
          method: 'POST',
          body: JSON.stringify(createData),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      expect(result).toEqual(mockAttempt);
    });

    it('should stop an attempt', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: null }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await attemptsApi.stop('1', '1', '1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/1/tasks/1/attempts/1/stop',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    it('should create a PR', async () => {
      const prData = {
        title: 'Test PR',
        body: 'Test PR body',
        base_branch: 'main',
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: 'https://github.com/repo/pull/1',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await attemptsApi.createPR('1', '1', '1', prData);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/1/tasks/1/attempts/1/create-pr',
        {
          method: 'POST',
          body: JSON.stringify(prData),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      expect(result).toBe('https://github.com/repo/pull/1');
    });
  });

  describe('configApi', () => {
    const mockConfig: Config = {
      theme: 'dark',
      executor: { type: 'claude' },
      disclaimer_acknowledged: true,
      onboarding_acknowledged: true,
      github_login_acknowledged: true,
      telemetry_acknowledged: true,
      sound_alerts: true,
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
      analytics_enabled: null,
    };

    it('should get config', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: mockConfig }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await configApi.getConfig();

      expect(mockFetch).toHaveBeenCalledWith('/api/config', {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockConfig);
    });

    it('should save config', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: mockConfig }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await configApi.saveConfig(mockConfig);

      expect(mockFetch).toHaveBeenCalledWith('/api/config', {
        method: 'POST',
        body: JSON.stringify(mockConfig),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockConfig);
    });
  });

  describe('githubAuthApi', () => {
    it('should check github token - valid', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: null }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await githubAuthApi.checkGithubToken();

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/github/check', {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toBe(true);
    });

    it('should check github token - invalid', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
          message: 'github_token_invalid',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await githubAuthApi.checkGithubToken();

      expect(result).toBe(false);
    });

    it('should check github token - network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await githubAuthApi.checkGithubToken();

      expect(result).toBeUndefined();
    });

    it('should start device auth', async () => {
      const mockDeviceResponse: DeviceStartResponse = {
        device_code: 'device123',
        user_code: 'USER123',
        verification_uri: 'https://github.com/login/device',
        expires_in: 900,
        interval: 5,
      };

      const mockResponse = {
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ success: true, data: mockDeviceResponse }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await githubAuthApi.start();

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/github/device/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockDeviceResponse);
    });

    it('should poll device auth', async () => {
      const mockResponse = {
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ success: true, data: 'access_token_123' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await githubAuthApi.poll('device123');

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/github/device/poll', {
        method: 'POST',
        body: JSON.stringify({ device_code: 'device123' }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toBe('access_token_123');
    });
  });

  describe('templatesApi', () => {
    const mockTemplate: TaskTemplate = {
      id: '1',
      project_id: '1',
      title: 'Test Template',
      description: 'Test template description',
      template_name: 'test-template',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    it('should list all templates', async () => {
      const mockResponse = {
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ success: true, data: [mockTemplate] }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await templatesApi.list();

      expect(mockFetch).toHaveBeenCalledWith('/api/templates', {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual([mockTemplate]);
    });

    it('should create a template', async () => {
      const createData: CreateTaskTemplate = {
        project_id: '1',
        title: 'New Template',
        description: 'New template description',
        template_name: 'new-template',
      };

      const mockResponse = {
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ success: true, data: mockTemplate }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await templatesApi.create(createData);

      expect(mockFetch).toHaveBeenCalledWith('/api/templates', {
        method: 'POST',
        body: JSON.stringify(createData),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockTemplate);
    });

    it('should update a template', async () => {
      const updateData: UpdateTaskTemplate = {
        title: 'Updated Template',
        description: 'Updated description',
        template_name: 'updated-template',
      };

      const mockResponse = {
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ success: true, data: mockTemplate }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await templatesApi.update('1', updateData);

      expect(mockFetch).toHaveBeenCalledWith('/api/templates/1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockTemplate);
    });

    it('should delete a template', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: null }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await templatesApi.delete('1');

      expect(mockFetch).toHaveBeenCalledWith('/api/templates/1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('mcpServersApi', () => {
    const mockServersConfig = {
      servers: {
        'test-server': {
          command: 'node',
          args: ['server.js'],
        },
      },
    };

    it('should load MCP servers', async () => {
      const mockResponse = {
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ success: true, data: mockServersConfig }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await mcpServersApi.load('claude');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/mcp-servers?executor=claude',
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      expect(result).toEqual(mockServersConfig);
    });

    it('should save MCP servers', async () => {
      const mockResponse = { ok: true };
      mockFetch.mockResolvedValue(mockResponse);

      await mcpServersApi.save('claude', mockServersConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/mcp-servers?executor=claude',
        {
          method: 'POST',
          body: JSON.stringify(mockServersConfig),
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    it('should handle save errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ message: 'Invalid configuration' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        mcpServersApi.save('claude', mockServersConfig)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('galleryApi', () => {
    const mockAttachment: TaskAttachment = {
      id: '1',
      task_id: '1',
      filename: 'test.jpg',
      original_name: 'test.jpg',
      file_path: '/uploads/test.jpg',
      file_size: 1024,
      mime_type: 'image/jpeg',
      file_type: 'image',
      created_at: '2023-01-01T00:00:00Z',
    };

    const mockComment: TaskComment = {
      id: '1',
      task_id: '1',
      author: 'testuser',
      content: 'Test comment',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      attachments: [],
    };

    it('should get attachments', async () => {
      const mockResponse = {
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ success: true, data: [mockAttachment] }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await galleryApi.getAttachments('1');

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1/attachments', {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual([mockAttachment]);
    });

    it('should upload attachment', async () => {
      const file = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      const mockResponse = {
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ success: true, data: mockAttachment }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await galleryApi.uploadAttachment('1', file);

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1/attachments', {
        method: 'POST',
        body: expect.any(FormData),
        headers: {},
      });
      expect(result).toEqual(mockAttachment);
    });

    it('should reject large files', async () => {
      // Create a file that exceeds 50MB
      const largeFile = new File([''], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 51 * 1024 * 1024 });

      await expect(galleryApi.uploadAttachment('1', largeFile)).rejects.toThrow(
        'File size exceeds 50MB limit'
      );
    });

    it('should reject empty files', async () => {
      const emptyFile = new File([''], 'empty.jpg', { type: 'image/jpeg' });

      await expect(galleryApi.uploadAttachment('1', emptyFile)).rejects.toThrow(
        'File is empty'
      );
    });

    it('should handle upload errors', async () => {
      const file = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      const mockResponse = {
        ok: false,
        status: 413,
        json: jest.fn().mockResolvedValue({ message: 'File too large' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(galleryApi.uploadAttachment('1', file)).rejects.toThrow(
        'File too large'
      );
    });

    it('should delete attachment', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: null }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await galleryApi.deleteAttachment('1', '1');

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1/attachments/1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should get attachment URL', () => {
      const url = galleryApi.getAttachmentUrl('1', '1');
      expect(url).toBe('/api/tasks/1/attachments/1/file');
    });

    it('should get comments', async () => {
      const mockResponse = {
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ success: true, data: [mockComment] }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await galleryApi.getComments('1');

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1/comments', {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual([mockComment]);
    });

    it('should create comment', async () => {
      const createData: CreateTaskComment = {
        task_id: '1',
        author: 'testuser',
        content: 'New comment',
        attachment_ids: [],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: mockComment }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await galleryApi.createComment('1', createData);

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1/comments', {
        method: 'POST',
        body: JSON.stringify(createData),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockComment);
    });

    it('should update comment', async () => {
      const updateData: UpdateTaskComment = {
        content: 'Updated comment',
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: mockComment }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await galleryApi.updateComment('1', '1', updateData);

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1/comments/1', {
        method: 'POST',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockComment);
    });

    it('should delete comment', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: null }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await galleryApi.deleteComment('1', '1');

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1/comments/1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(projectsApi.getAll()).rejects.toThrow('Network error');
    });

    it('should handle response with error message', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        url: '/api/test',
        json: jest.fn().mockResolvedValue({ message: 'Custom error message' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(projectsApi.getAll()).rejects.toThrow(
        'Custom error message'
      );
    });

    it('should handle response without error message', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        url: '/api/test',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(projectsApi.getAll()).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('should handle API response with success: false', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        url: '/api/test',
        json: jest
          .fn()
          .mockResolvedValue({ success: false, message: 'API error' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(projectsApi.getAll()).rejects.toThrow('API error');
    });
  });
});
