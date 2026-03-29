import {
  Project,
  ProjectWithBranch,
  Task,
  TaskWithAttemptStatus,
  TaskAttempt,
  TaskAttemptState,
  TaskTemplate,
  GitBranch,
  Config,
  ExecutionProcess,
  ExecutionProcessSummary,
  ProcessLogsResponse,
  WorktreeDiff,
  FileDiff,
  DiffChunk,
  BranchStatus,
  NormalizedConversation,
  NormalizedEntry,
  DirectoryEntry,
  DeviceStartResponse,
  ThemeMode,
  TaskStatus,
  ExecutionState,
  ExecutionProcessStatus,
  ExecutionProcessType,
} from 'shared/types';
import { TaskAttachment, TaskComment } from '../../lib/api';

// Mock IDs for consistent testing
export const mockIds = {
  project: 'proj-123',
  task: 'task-456',
  attempt: 'attempt-789',
  attachment: 'attach-abc',
  comment: 'comment-def',
  process: 'proc-ghi',
  template: 'templ-jkl',
} as const;

// Mock dates
export const mockDates = {
  created: '2023-01-01T00:00:00Z',
  updated: '2023-01-02T00:00:00Z',
  started: '2023-01-01T10:00:00Z',
  completed: '2023-01-01T11:00:00Z',
} as const;

// Mock Config
export const mockConfig: Config = {
  theme: 'light' as ThemeMode,
  executor: { type: 'claude' },
  disclaimer_acknowledged: true,
  onboarding_acknowledged: true,
  github_login_acknowledged: true,
  telemetry_acknowledged: true,
  sound_alerts: false,
  sound_file: 'abstract-sound1',
  push_notifications: false,
  editor: {
    editor_type: 'vscode',
    custom_command: null,
  },
  github: {
    pat: 'github_pat_test_token',
    token: 'github_oauth_token',
    username: 'testuser',
    primary_email: 'test@example.com',
    default_pr_base: 'main',
  },
  analytics_enabled: false,
};

// Mock Projects
export const mockProject: Project = {
  id: mockIds.project,
  name: 'Test Project',
  git_repo_path: '/path/to/test-project',
  setup_script: 'npm install',
  dev_script: 'npm run dev',
  created_at: new Date(mockDates.created),
  updated_at: new Date(mockDates.updated),
};

export const mockProjectWithBranch: ProjectWithBranch = {
  ...mockProject,
  current_branch: 'main',
};

export const mockProjects: Project[] = [
  mockProject,
  {
    ...mockProject,
    id: 'proj-124',
    name: 'Another Project',
    git_repo_path: '/path/to/another-project',
    setup_script: null,
    dev_script: null,
  },
];

// Mock Git Branches
export const mockGitBranches: GitBranch[] = [
  {
    name: 'main',
    is_current: true,
    is_remote: false,
    last_commit_date: new Date(mockDates.updated),
  },
  {
    name: 'feature/new-feature',
    is_current: false,
    is_remote: false,
    last_commit_date: new Date(mockDates.created),
  },
  {
    name: 'origin/main',
    is_current: false,
    is_remote: true,
    last_commit_date: new Date(mockDates.updated),
  },
];

// Mock Tasks
export const mockTask: Task = {
  id: mockIds.task,
  project_id: mockIds.project,
  title: 'Test Task',
  description: 'This is a test task description',
  status: 'todo' as TaskStatus,
  parent_task_attempt: null,
  created_at: mockDates.created,
  updated_at: mockDates.updated,
};

export const mockTaskWithAttemptStatus: TaskWithAttemptStatus = {
  ...mockTask,
  has_in_progress_attempt: false,
  has_merged_attempt: false,
  has_failed_attempt: false,
  latest_attempt_executor: 'claude',
};

export const mockTasks: TaskWithAttemptStatus[] = [
  mockTaskWithAttemptStatus,
  {
    ...mockTaskWithAttemptStatus,
    id: 'task-457',
    title: 'In Progress Task',
    status: 'inprogress' as TaskStatus,
    has_in_progress_attempt: true,
  },
  {
    ...mockTaskWithAttemptStatus,
    id: 'task-458',
    title: 'Completed Task',
    status: 'done' as TaskStatus,
    has_merged_attempt: true,
  },
];

// Mock Task Attempts
export const mockTaskAttempt: TaskAttempt = {
  id: mockIds.attempt,
  task_id: mockIds.task,
  worktree_path: '/tmp/worktree/test-branch',
  branch: 'feature/test-branch',
  base_branch: 'main',
  merge_commit: null,
  executor: 'claude',
  pr_url: null,
  pr_number: null,
  pr_status: null,
  pr_merged_at: null,
  worktree_deleted: false,
  setup_completed_at: mockDates.completed,
  created_at: mockDates.created,
  updated_at: mockDates.updated,
};

export const mockTaskAttemptState: TaskAttemptState = {
  execution_state: 'Complete' as ExecutionState,
  has_changes: true,
  has_setup_script: true,
  setup_process_id: mockIds.process,
  coding_agent_process_id: 'proc-coding-123',
};

// Mock Branch Status
export const mockBranchStatus: BranchStatus = {
  is_behind: false,
  commits_behind: 0,
  commits_ahead: 2,
  up_to_date: false,
  merged: false,
  has_uncommitted_changes: true,
  base_branch_name: 'main',
};

// Mock Execution Processes
export const mockExecutionProcess: ExecutionProcess = {
  id: mockIds.process,
  task_attempt_id: mockIds.attempt,
  process_type: 'codingagent' as ExecutionProcessType,
  executor_type: 'claude',
  status: 'completed' as ExecutionProcessStatus,
  command: 'claude execute',
  args: '--task="implement feature"',
  working_directory: '/tmp/worktree/test-branch',
  stdout: 'Task completed successfully',
  stderr: null,
  exit_code: BigInt(0),
  started_at: mockDates.started,
  completed_at: mockDates.completed,
  created_at: mockDates.created,
  updated_at: mockDates.updated,
};

export const mockExecutionProcessSummary: ExecutionProcessSummary = {
  id: mockExecutionProcess.id,
  task_attempt_id: mockExecutionProcess.task_attempt_id,
  process_type: mockExecutionProcess.process_type,
  executor_type: mockExecutionProcess.executor_type,
  status: mockExecutionProcess.status,
  command: mockExecutionProcess.command,
  args: mockExecutionProcess.args,
  working_directory: mockExecutionProcess.working_directory,
  exit_code: mockExecutionProcess.exit_code,
  started_at: mockExecutionProcess.started_at,
  completed_at: mockExecutionProcess.completed_at,
  created_at: mockExecutionProcess.created_at,
  updated_at: mockExecutionProcess.updated_at,
};

// Mock Normalized Conversation
export const mockNormalizedEntry: NormalizedEntry = {
  timestamp: mockDates.created,
  entry_type: { type: 'user_message' },
  content: 'Please implement the new feature',
};

export const mockNormalizedConversation: NormalizedConversation = {
  entries: [
    mockNormalizedEntry,
    {
      timestamp: mockDates.updated,
      entry_type: { type: 'assistant_message' },
      content: 'I will implement the feature for you.',
    },
    {
      timestamp: mockDates.completed,
      entry_type: {
        type: 'tool_use',
        tool_name: 'file_write',
        action_type: {
          action: 'file_write',
          path: 'src/feature.ts',
        },
      },
      content: 'Created new feature file',
    },
  ],
  session_id: 'session-123',
  executor_type: 'claude',
  prompt: 'Implement new feature',
  summary: 'Successfully implemented the requested feature',
};

export const mockProcessLogsResponse: ProcessLogsResponse = {
  id: mockIds.process,
  process_type: 'codingagent',
  command: 'claude execute',
  executor_type: 'claude',
  status: 'completed',
  normalized_conversation: mockNormalizedConversation,
};

// Mock Diff Data
export const mockDiffChunk: DiffChunk = {
  chunk_type: 'Insert',
  content: '+ console.log("Hello World");',
};

export const mockFileDiff: FileDiff = {
  path: 'src/feature.ts',
  chunks: [
    { chunk_type: 'Equal', content: 'export function feature() {' },
    mockDiffChunk,
    { chunk_type: 'Equal', content: '}' },
  ],
};

export const mockWorktreeDiff: WorktreeDiff = {
  files: [
    mockFileDiff,
    {
      path: 'src/test.ts',
      chunks: [
        { chunk_type: 'Delete', content: '- oldFunction();' },
        { chunk_type: 'Insert', content: '+ newFunction();' },
      ],
    },
  ],
};

// Mock Task Templates
export const mockTaskTemplate: TaskTemplate = {
  id: mockIds.template,
  project_id: mockIds.project,
  title: 'Feature Template',
  description: 'Template for creating new features',
  template_name: 'feature',
  created_at: mockDates.created,
  updated_at: mockDates.updated,
};

export const mockTaskTemplates: TaskTemplate[] = [
  mockTaskTemplate,
  {
    ...mockTaskTemplate,
    id: 'templ-jkm',
    project_id: null, // Global template
    title: 'Bug Fix Template',
    description: 'Template for fixing bugs',
    template_name: 'bugfix',
  },
];

// Mock Gallery Data
export const mockTaskAttachment: TaskAttachment = {
  id: mockIds.attachment,
  task_id: mockIds.task,
  filename: 'screenshot.jpg',
  original_name: 'screenshot.jpg',
  file_path: '/uploads/screenshot.jpg',
  file_size: 256000,
  mime_type: 'image/jpeg',
  file_type: 'image',
  created_at: mockDates.created,
};

export const mockTaskAttachments: TaskAttachment[] = [
  mockTaskAttachment,
  {
    ...mockTaskAttachment,
    id: 'attach-bcd',
    filename: 'document.pdf',
    original_name: 'requirements.pdf',
    file_path: '/uploads/document.pdf',
    file_size: 512000,
    mime_type: 'application/pdf',
    file_type: 'document',
  },
  {
    ...mockTaskAttachment,
    id: 'attach-cde',
    filename: 'video.mp4',
    original_name: 'demo.mp4',
    file_path: '/uploads/video.mp4',
    file_size: 5120000,
    mime_type: 'video/mp4',
    file_type: 'video',
  },
];

export const mockTaskComment: TaskComment = {
  id: mockIds.comment,
  task_id: mockIds.task,
  author: 'Test User',
  content: 'This is a test comment',
  created_at: mockDates.created,
  updated_at: mockDates.updated,
  attachments: [mockTaskAttachment],
};

export const mockTaskComments: TaskComment[] = [
  mockTaskComment,
  {
    ...mockTaskComment,
    id: 'comment-efg',
    content: 'Another test comment without attachments',
    attachments: [],
  },
];

// Mock Directory Entries
export const mockDirectoryEntries: DirectoryEntry[] = [
  {
    name: 'src',
    path: '/project/src',
    is_directory: true,
    is_git_repo: false,
  },
  {
    name: 'package.json',
    path: '/project/package.json',
    is_directory: false,
    is_git_repo: false,
  },
  {
    name: '.git',
    path: '/project/.git',
    is_directory: true,
    is_git_repo: true,
  },
];

// Mock GitHub Device Auth
export const mockDeviceStartResponse: DeviceStartResponse = {
  device_code: 'test-device-code',
  user_code: 'TEST-CODE',
  verification_uri: 'https://github.com/login/device',
  expires_in: 900,
  interval: 5,
};

// Mock API Responses
export const mockApiResponses = {
  success: <T>(data: T) => ({
    success: true,
    data,
    message: null,
  }),

  error: (message: string) => ({
    success: false,
    data: null,
    message,
  }),

  loading: () => ({
    success: false,
    data: null,
    message: 'Loading...',
  }),
};

// Mock Fetch Responses
export const mockFetchResponse = (data: any, status = 200, ok = true) =>
  Promise.resolve({
    ok,
    status,
    json: async () => mockApiResponses.success(data),
    text: async () => JSON.stringify(data),
    headers: new Headers(),
    redirected: false,
    statusText: ok ? 'OK' : 'Error',
    type: 'basic' as ResponseType,
    url: 'http://localhost:8080/api/test',
    body: null,
    bodyUsed: false,
    clone: jest.fn(),
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
  } as Response);

export const mockFetchError = (message: string, status = 500) =>
  Promise.resolve({
    ok: false,
    status,
    json: async () => mockApiResponses.error(message),
    text: async () => JSON.stringify(mockApiResponses.error(message)),
    headers: new Headers(),
    redirected: false,
    statusText: 'Internal Server Error',
    type: 'basic' as ResponseType,
    url: 'http://localhost:8080/api/test',
    body: null,
    bodyUsed: false,
    clone: jest.fn(),
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
  } as Response);

// Export collections for easy access
export const mockData = {
  config: mockConfig,
  project: mockProject,
  projects: mockProjects,
  projectWithBranch: mockProjectWithBranch,
  branches: mockGitBranches,
  task: mockTask,
  tasks: mockTasks,
  taskWithAttemptStatus: mockTaskWithAttemptStatus,
  taskAttempt: mockTaskAttempt,
  taskAttemptState: mockTaskAttemptState,
  branchStatus: mockBranchStatus,
  executionProcess: mockExecutionProcess,
  executionProcessSummary: mockExecutionProcessSummary,
  processLogs: mockProcessLogsResponse,
  normalizedConversation: mockNormalizedConversation,
  diff: mockWorktreeDiff,
  templates: mockTaskTemplates,
  template: mockTaskTemplate,
  attachments: mockTaskAttachments,
  attachment: mockTaskAttachment,
  comments: mockTaskComments,
  comment: mockTaskComment,
  directoryEntries: mockDirectoryEntries,
  deviceAuth: mockDeviceStartResponse,
  ids: mockIds,
  dates: mockDates,
};
