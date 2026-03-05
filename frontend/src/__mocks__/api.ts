/**
 * Comprehensive API mocks for testing
 * Provides mock implementations for all API endpoints used in the application
 */

import type {
  Project,
  ProjectWithBranch,
  Task,
  TaskWithAttemptStatus,
  TaskAttempt,
  TaskAttemptState,
  TaskTemplate,
  Config,
  GitBranch,
  BranchStatus,
  WorktreeDiff,
  ExecutionProcess,
  ExecutionProcessSummary,
  ProcessLogsResponse,
  DeviceStartResponse,
  CreateProject,
  CreateTask,
  CreateTaskAndStart,
  CreateTaskAttempt,
  CreateTaskTemplate,
  CreateFollowUpAttempt,
  UpdateProject,
  UpdateTask,
  UpdateTaskTemplate,
  DirectoryEntry,
  EditorType,
} from 'shared/types';

import type {
  ApiResponse,
  FollowUpResponse,
  FileSearchResult,
  DirectoryListResponse,
  TaskAttachment,
  TaskComment,
  CreateTaskComment,
  UpdateTaskComment,
} from '@/lib/api';

// Mock data factories
export const createMockProject = (
  overrides: Partial<Project> = {}
): Project => ({
  id: '1',
  name: 'Test Project',
  git_repo_path: '/path/to/repo',
  setup_script: null,
  dev_script: null,
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
});

export const createMockProjectWithBranch = (
  overrides: Partial<ProjectWithBranch> = {}
): ProjectWithBranch => ({
  ...createMockProject(),
  current_branch: 'main',
  ...overrides,
});

export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: '1',
  project_id: '1',
  title: 'Test Task',
  description: 'A test task',
  status: 'todo',
  parent_task_attempt: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockTaskWithAttemptStatus = (
  overrides: Partial<TaskWithAttemptStatus> = {}
): TaskWithAttemptStatus => ({
  ...createMockTask(),
  has_in_progress_attempt: false,
  has_merged_attempt: false,
  last_attempt_failed: false,
  latest_attempt_executor: null,
  ...overrides,
});

export const createMockTaskAttempt = (
  overrides: Partial<TaskAttempt> = {}
): TaskAttempt => ({
  id: '1',
  task_id: '1',
  worktree_path: '/tmp/worktree',
  branch: 'task-branch',
  base_branch: 'main',
  merge_commit: null,
  executor: null,
  pr_url: null,
  pr_number: null,
  pr_status: null,
  pr_merged_at: null,
  worktree_deleted: false,
  setup_completed_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockTaskTemplate = (
  overrides: Partial<TaskTemplate> = {}
): TaskTemplate => ({
  id: '1',
  project_id: null,
  title: 'Test Template',
  description: 'A test template',
  template_name: 'test-template',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockConfig = (overrides: Partial<Config> = {}): Config => ({
  theme: 'light',
  executor: {
    type: 'claude',
  },
  disclaimer_acknowledged: false,
  onboarding_acknowledged: false,
  github_login_acknowledged: false,
  telemetry_acknowledged: false,
  sound_alerts: false,
  sound_file: 'abstract-sound1',
  push_notifications: false,
  editor: {
    editor_type: 'vscode',
    custom_command: null,
  },
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

export const createMockTaskAttachment = (
  overrides: Partial<TaskAttachment> = {}
): TaskAttachment => ({
  id: '1',
  task_id: '1',
  filename: 'test.jpg',
  original_name: 'test.jpg',
  file_path: '/uploads/test.jpg',
  file_size: 1024,
  mime_type: 'image/jpeg',
  file_type: 'image',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockTaskComment = (
  overrides: Partial<TaskComment> = {}
): TaskComment => ({
  id: '1',
  task_id: '1',
  author: 'Test User',
  content: 'Test comment',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  attachments: [],
  ...overrides,
});

// Mock API responses
export const createApiResponse = <T>(
  data: T,
  success = true
): ApiResponse<T> => ({
  success,
  data,
  message: success ? undefined : 'API Error',
});

// Mock API implementations
export const mockProjectsApi = {
  getAll: jest.fn().mockResolvedValue([createMockProject()]),
  getById: jest.fn().mockResolvedValue(createMockProject()),
  getWithBranch: jest.fn().mockResolvedValue(createMockProjectWithBranch()),
  create: jest.fn().mockResolvedValue(createMockProject()),
  update: jest.fn().mockResolvedValue(createMockProject()),
  delete: jest.fn().mockResolvedValue(undefined),
  openEditor: jest.fn().mockResolvedValue(undefined),
  getBranches: jest.fn().mockResolvedValue([]),
  searchFiles: jest.fn().mockResolvedValue([]),
};

export const mockTasksApi = {
  getAll: jest.fn().mockResolvedValue([createMockTaskWithAttemptStatus()]),
  getById: jest.fn().mockResolvedValue(createMockTask()),
  create: jest.fn().mockResolvedValue(createMockTask()),
  createAndStart: jest
    .fn()
    .mockResolvedValue(createMockTaskWithAttemptStatus()),
  update: jest.fn().mockResolvedValue(createMockTask()),
  delete: jest.fn().mockResolvedValue(undefined),
  getChildren: jest.fn().mockResolvedValue([]),
};

export const mockAttemptsApi = {
  getAll: jest.fn().mockResolvedValue([createMockTaskAttempt()]),
  create: jest.fn().mockResolvedValue(createMockTaskAttempt()),
  getState: jest.fn().mockResolvedValue({} as TaskAttemptState),
  stop: jest.fn().mockResolvedValue(undefined),
  followUp: jest.fn().mockResolvedValue(undefined),
  getDiff: jest.fn().mockResolvedValue({} as WorktreeDiff),
  deleteFile: jest.fn().mockResolvedValue(undefined),
  openEditor: jest.fn().mockResolvedValue(undefined),
  getBranchStatus: jest.fn().mockResolvedValue({} as BranchStatus),
  merge: jest.fn().mockResolvedValue(undefined),
  rebase: jest.fn().mockResolvedValue(undefined),
  createPR: jest.fn().mockResolvedValue('https://github.com/test/repo/pull/1'),
  startDevServer: jest.fn().mockResolvedValue(undefined),
  getExecutionProcesses: jest.fn().mockResolvedValue([]),
  stopExecutionProcess: jest.fn().mockResolvedValue(undefined),
  getDetails: jest.fn().mockResolvedValue(createMockTaskAttempt()),
  getAllLogs: jest.fn().mockResolvedValue([]),
};

export const mockExecutionProcessesApi = {
  getDetails: jest.fn().mockResolvedValue({} as ExecutionProcess),
};

export const mockFileSystemApi = {
  list: jest.fn().mockResolvedValue({
    entries: [],
    current_path: '/',
  } as DirectoryListResponse),
};

export const mockConfigApi = {
  getConfig: jest.fn().mockResolvedValue(createMockConfig()),
  saveConfig: jest.fn().mockResolvedValue(createMockConfig()),
};

export const mockGithubAuthApi = {
  checkGithubToken: jest.fn().mockResolvedValue(true),
  start: jest.fn().mockResolvedValue({
    device_code: 'test_device_code',
    user_code: 'TEST-CODE',
    verification_uri: 'https://github.com/login/device',
    expires_in: 900,
    interval: 5,
  } as DeviceStartResponse),
  poll: jest.fn().mockResolvedValue('test_token'),
};

export const mockTemplatesApi = {
  list: jest.fn().mockResolvedValue([createMockTaskTemplate()]),
  listGlobal: jest.fn().mockResolvedValue([createMockTaskTemplate()]),
  listByProject: jest.fn().mockResolvedValue([createMockTaskTemplate()]),
  get: jest.fn().mockResolvedValue(createMockTaskTemplate()),
  create: jest.fn().mockResolvedValue(createMockTaskTemplate()),
  update: jest.fn().mockResolvedValue(createMockTaskTemplate()),
  delete: jest.fn().mockResolvedValue(undefined),
};

export const mockMcpServersApi = {
  load: jest.fn().mockResolvedValue({}),
  save: jest.fn().mockResolvedValue(undefined),
};

export const mockGalleryApi = {
  getAttachments: jest.fn().mockResolvedValue([createMockTaskAttachment()]),
  uploadAttachment: jest.fn().mockResolvedValue(createMockTaskAttachment()),
  deleteAttachment: jest.fn().mockResolvedValue(undefined),
  getAttachmentUrl: jest
    .fn()
    .mockReturnValue('/api/tasks/1/attachments/1/file'),
  getComments: jest.fn().mockResolvedValue([createMockTaskComment()]),
  createComment: jest.fn().mockResolvedValue(createMockTaskComment()),
  updateComment: jest.fn().mockResolvedValue(createMockTaskComment()),
  deleteComment: jest.fn().mockResolvedValue(undefined),
};

// Complete API mock
export const mockApi = {
  projectsApi: mockProjectsApi,
  tasksApi: mockTasksApi,
  attemptsApi: mockAttemptsApi,
  executionProcessesApi: mockExecutionProcessesApi,
  fileSystemApi: mockFileSystemApi,
  configApi: mockConfigApi,
  githubAuthApi: mockGithubAuthApi,
  templatesApi: mockTemplatesApi,
  mcpServersApi: mockMcpServersApi,
  galleryApi: mockGalleryApi,
};

// Helper function to reset all mocks
export const resetAllApiMocks = () => {
  Object.values(mockApi).forEach((apiSection) => {
    Object.values(apiSection).forEach((mockFn) => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockClear();
      }
    });
  });
};

// Default module exports for Jest auto-mocking
export const projectsApi = mockProjectsApi;
export const tasksApi = mockTasksApi;
export const attemptsApi = mockAttemptsApi;
export const executionProcessesApi = mockExecutionProcessesApi;
export const fileSystemApi = mockFileSystemApi;
export const configApi = mockConfigApi;
export const githubAuthApi = mockGithubAuthApi;
export const templatesApi = mockTemplatesApi;
export const mcpServersApi = mockMcpServersApi;
export const galleryApi = mockGalleryApi;

// Mock fetch implementation
export const mockMakeRequest = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue(createApiResponse({})),
});

export const makeRequest = mockMakeRequest;

// Mock error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Export all types for convenience
export type {
  Project,
  ProjectWithBranch,
  Task,
  TaskWithAttemptStatus,
  TaskAttempt,
  TaskAttemptState,
  TaskTemplate,
  Config,
  GitBranch,
  BranchStatus,
  WorktreeDiff,
  ExecutionProcess,
  ExecutionProcessSummary,
  ProcessLogsResponse,
  DeviceStartResponse,
  CreateProject,
  CreateTask,
  CreateTaskAndStart,
  CreateTaskAttempt,
  CreateTaskTemplate,
  CreateFollowUpAttempt,
  UpdateProject,
  UpdateTask,
  UpdateTaskTemplate,
  DirectoryEntry,
  EditorType,
  ApiResponse,
  FollowUpResponse,
  FileSearchResult,
  DirectoryListResponse,
  TaskAttachment,
  TaskComment,
  CreateTaskComment,
  UpdateTaskComment,
};
