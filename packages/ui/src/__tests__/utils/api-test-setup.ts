/**
 * Centralized API mock setup for testing
 * Provides consistent mocking across all test files
 */

import {
  resetAllApiMocks,
  createMockProject,
  createMockTask,
  createMockTaskAttempt,
  createMockConfig,
  createMockTaskTemplate,
  createMockTaskAttachment,
  createMockTaskComment,
} from '../../__mocks__/api';

// Import all API modules at the top
import {
  projectsApi,
  tasksApi,
  attemptsApi,
  configApi,
  templatesApi,
  galleryApi,
  githubAuthApi,
  fileSystemApi,
  mcpServersApi,
  executionProcessesApi,
} from '@/lib/api';

/**
 * Setup API mocks with default responses for testing
 */
export const setupApiMocks = () => {
  // Reset all mocks to clean state
  resetAllApiMocks();

  // Projects API defaults
  projectsApi.getAll.mockResolvedValue([createMockProject()]);
  projectsApi.getById.mockResolvedValue(createMockProject());
  projectsApi.create.mockImplementation((data: any) =>
    Promise.resolve(createMockProject({ ...data, id: 'new-id' }))
  );
  projectsApi.update.mockImplementation((id: string, data: any) =>
    Promise.resolve(createMockProject({ id, ...data }))
  );
  projectsApi.delete.mockResolvedValue(undefined);

  // Tasks API defaults
  tasksApi.getAll.mockResolvedValue([]);
  tasksApi.getById.mockResolvedValue(createMockTask());
  tasksApi.create.mockImplementation((projectId: string, data: any) =>
    Promise.resolve(
      createMockTask({ ...data, project_id: projectId, id: 'new-task' })
    )
  );
  tasksApi.update.mockImplementation(
    (projectId: string, taskId: string, data: any) =>
      Promise.resolve(
        createMockTask({ id: taskId, project_id: projectId, ...data })
      )
  );
  tasksApi.delete.mockResolvedValue(undefined);

  // Config API defaults
  configApi.getConfig.mockResolvedValue(createMockConfig());
  configApi.saveConfig.mockResolvedValue(createMockConfig());

  // Templates API defaults
  templatesApi.list.mockResolvedValue([createMockTaskTemplate()]);
  templatesApi.get.mockResolvedValue(createMockTaskTemplate());
  templatesApi.create.mockImplementation((data: any) =>
    Promise.resolve(createMockTaskTemplate({ ...data, id: 'new-template' }))
  );

  // Gallery API defaults
  galleryApi.getAttachments.mockResolvedValue([]);
  galleryApi.uploadAttachment.mockImplementation((taskId: string, file: File) =>
    Promise.resolve(
      createMockTaskAttachment({
        task_id: taskId,
        filename: file.name,
        original_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      })
    )
  );
  galleryApi.getComments.mockResolvedValue([]);
  galleryApi.createComment.mockImplementation((taskId: string, data: any) =>
    Promise.resolve(createMockTaskComment({ task_id: taskId, ...data }))
  );

  // GitHub Auth API defaults
  githubAuthApi.checkGithubToken.mockResolvedValue(true);
  githubAuthApi.start.mockResolvedValue({
    device_code: 'test_device_code',
    user_code: 'TEST-CODE',
    verification_uri: 'https://github.com/login/device',
    expires_in: 900,
    interval: 5,
  });

  // File System API defaults
  fileSystemApi.list.mockResolvedValue({
    entries: [],
    current_path: '/',
  });

  // MCP Servers API defaults
  mcpServersApi.load.mockResolvedValue({});
  mcpServersApi.save.mockResolvedValue(undefined);

  // Attempts API defaults
  attemptsApi.getAll.mockResolvedValue([]);
  attemptsApi.create.mockResolvedValue(createMockTaskAttempt());
  attemptsApi.stop.mockResolvedValue(undefined);

  // Execution Processes API defaults
  executionProcessesApi.getDetails.mockResolvedValue({
    id: '1',
    type: 'command',
    status: 'running',
    created_at: new Date().toISOString(),
  });
};

/**
 * Mock specific API responses for individual tests
 */
export const mockApiResponses = {
  projects: {
    getAll: (projects: any[]) => {
      projectsApi.getAll.mockResolvedValue(projects);
    },
    getById: (project: any) => {
      projectsApi.getById.mockResolvedValue(project);
    },
    create: (project: any) => {
      projectsApi.create.mockResolvedValue(project);
    },
    error: (error: Error) => {
      projectsApi.getAll.mockRejectedValue(error);
    },
  },
  tasks: {
    getAll: (tasks: any[]) => {
      tasksApi.getAll.mockResolvedValue(tasks);
    },
    create: (task: any) => {
      tasksApi.create.mockResolvedValue(task);
    },
    error: (error: Error) => {
      tasksApi.getAll.mockRejectedValue(error);
    },
  },
  config: {
    get: (config: any) => {
      configApi.getConfig.mockResolvedValue(config);
    },
    save: (config: any) => {
      configApi.saveConfig.mockResolvedValue(config);
    },
    error: (error: Error) => {
      configApi.getConfig.mockRejectedValue(error);
    },
  },
  gallery: {
    getAttachments: (attachments: any[]) => {
      galleryApi.getAttachments.mockResolvedValue(attachments);
    },
    uploadAttachment: (attachment: any) => {
      galleryApi.uploadAttachment.mockResolvedValue(attachment);
    },
    uploadError: (error: Error) => {
      galleryApi.uploadAttachment.mockRejectedValue(error);
    },
    getComments: (comments: any[]) => {
      galleryApi.getComments.mockResolvedValue(comments);
    },
  },
  templates: {
    list: (templates: any[]) => {
      templatesApi.list.mockResolvedValue(templates);
    },
    create: (template: any) => {
      templatesApi.create.mockResolvedValue(template);
    },
  },
};

/**
 * Verify API calls were made correctly
 */
export const verifyApiCalls = {
  projects: {
    getAll: (times = 1) => {
      expect(projectsApi.getAll).toHaveBeenCalledTimes(times);
    },
    create: (data: any, times = 1) => {
      expect(projectsApi.create).toHaveBeenCalledTimes(times);
      if (times > 0) {
        expect(projectsApi.create).toHaveBeenCalledWith(data);
      }
    },
    update: (id: string, data: any, times = 1) => {
      expect(projectsApi.update).toHaveBeenCalledTimes(times);
      if (times > 0) {
        expect(projectsApi.update).toHaveBeenCalledWith(id, data);
      }
    },
  },
  tasks: {
    getAll: (projectId: string, times = 1) => {
      expect(tasksApi.getAll).toHaveBeenCalledTimes(times);
      if (times > 0) {
        expect(tasksApi.getAll).toHaveBeenCalledWith(projectId);
      }
    },
    create: (projectId: string, data: any, times = 1) => {
      expect(tasksApi.create).toHaveBeenCalledTimes(times);
      if (times > 0) {
        expect(tasksApi.create).toHaveBeenCalledWith(projectId, data);
      }
    },
  },
  config: {
    get: (times = 1) => {
      expect(configApi.getConfig).toHaveBeenCalledTimes(times);
    },
    save: (config: any, times = 1) => {
      expect(configApi.saveConfig).toHaveBeenCalledTimes(times);
      if (times > 0) {
        expect(configApi.saveConfig).toHaveBeenCalledWith(config);
      }
    },
  },
  gallery: {
    uploadAttachment: (taskId: string, file: File, times = 1) => {
      expect(galleryApi.uploadAttachment).toHaveBeenCalledTimes(times);
      if (times > 0) {
        expect(galleryApi.uploadAttachment).toHaveBeenCalledWith(taskId, file);
      }
    },
  },
};

/**
 * Common test data generators
 */
export const testData = {
  projects: {
    simple: () => createMockProject(),
    withTasks: (taskCount = 3) => ({
      ...createMockProject(),
      tasks: Array.from({ length: taskCount }, (_, i) =>
        createMockTask({ id: `task-${i + 1}`, title: `Task ${i + 1}` })
      ),
    }),
    list: (count = 3) =>
      Array.from({ length: count }, (_, i) =>
        createMockProject({ id: `project-${i + 1}`, name: `Project ${i + 1}` })
      ),
  },
  tasks: {
    simple: () => createMockTask(),
    withAttempts: (attemptCount = 2) => ({
      ...createMockTask(),
      attempts: Array.from({ length: attemptCount }, (_, i) =>
        createMockTaskAttempt({ id: `attempt-${i + 1}`, attempt_number: i + 1 })
      ),
    }),
    list: (count = 5) =>
      Array.from({ length: count }, (_, i) =>
        createMockTask({
          id: `task-${i + 1}`,
          title: `Task ${i + 1}`,
          status: ['pending', 'in_progress', 'completed'][i % 3] as any,
        })
      ),
  },
  config: {
    onboardingComplete: () =>
      createMockConfig({
        disclaimer_acknowledged: true,
        onboarding_acknowledged: true,
        telemetry_acknowledged: true,
        github_login_acknowledged: true,
      }),
    darkTheme: () => createMockConfig({ theme: 'dark' }),
    systemTheme: () => createMockConfig({ theme: 'system' }),
  },
  gallery: {
    attachments: (count = 3) =>
      Array.from({ length: count }, (_, i) =>
        createMockTaskAttachment({
          id: `attachment-${i + 1}`,
          filename: `file-${i + 1}.jpg`,
          original_name: `file-${i + 1}.jpg`,
        })
      ),
    comments: (count = 2) =>
      Array.from({ length: count }, (_, i) =>
        createMockTaskComment({
          id: `comment-${i + 1}`,
          content: `Comment content ${i + 1}`,
          author: `User ${i + 1}`,
        })
      ),
  },
};

/**
 * Setup function to be called in test files
 */
export const setupApiTestEnvironment = () => {
  beforeEach(() => {
    setupApiMocks();
  });

  afterEach(() => {
    resetAllApiMocks();
  });
};
