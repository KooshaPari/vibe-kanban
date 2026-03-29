import { jest } from '@jest/globals';
import { mockData, mockFetchResponse } from '../utils/mockData';
import * as api from '../../lib/api';

// Mock the entire API module
jest.mock('../../lib/api', () => ({
  makeRequest: jest.fn(),
  ApiError: jest.requireActual('../../lib/api').ApiError,

  // Projects API
  projectsApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    getWithBranch: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    openEditor: jest.fn(),
    getBranches: jest.fn(),
    searchFiles: jest.fn(),
  },

  // Tasks API
  tasksApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    createAndStart: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getChildren: jest.fn(),
  },

  // Attempts API
  attemptsApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    getState: jest.fn(),
    stop: jest.fn(),
    followUp: jest.fn(),
    getDiff: jest.fn(),
    deleteFile: jest.fn(),
    openEditor: jest.fn(),
    getBranchStatus: jest.fn(),
    merge: jest.fn(),
    rebase: jest.fn(),
    createPR: jest.fn(),
    startDevServer: jest.fn(),
    getExecutionProcesses: jest.fn(),
    stopExecutionProcess: jest.fn(),
    getDetails: jest.fn(),
    getAllLogs: jest.fn(),
  },

  // Execution Processes API
  executionProcessesApi: {
    getDetails: jest.fn(),
  },

  // File System API
  fileSystemApi: {
    list: jest.fn(),
  },

  // Config API
  configApi: {
    getConfig: jest.fn(),
    saveConfig: jest.fn(),
  },

  // GitHub Auth API
  githubAuthApi: {
    checkGithubToken: jest.fn(),
    start: jest.fn(),
    poll: jest.fn(),
  },

  // Templates API
  templatesApi: {
    list: jest.fn(),
    listGlobal: jest.fn(),
    listByProject: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },

  // MCP Servers API
  mcpServersApi: {
    load: jest.fn(),
    save: jest.fn(),
  },

  // Gallery API
  galleryApi: {
    getAttachments: jest.fn(),
    uploadAttachment: jest.fn(),
    deleteAttachment: jest.fn(),
    getAttachmentUrl: jest.fn(),
    getComments: jest.fn(),
    createComment: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
  },
}));

// Get the mocked APIs
const mockedApi = api as jest.Mocked<typeof api>;

// Setup default successful responses
export const setupMockApiResponses = () => {
  // Projects API defaults
  mockedApi.projectsApi.getAll.mockResolvedValue(mockData.projects);
  mockedApi.projectsApi.getById.mockResolvedValue(mockData.project);
  mockedApi.projectsApi.getWithBranch.mockResolvedValue(
    mockData.projectWithBranch
  );
  mockedApi.projectsApi.create.mockResolvedValue(mockData.project);
  mockedApi.projectsApi.update.mockResolvedValue(mockData.project);
  mockedApi.projectsApi.delete.mockResolvedValue(undefined);
  mockedApi.projectsApi.openEditor.mockResolvedValue(undefined);
  mockedApi.projectsApi.getBranches.mockResolvedValue(mockData.branches);
  mockedApi.projectsApi.searchFiles.mockResolvedValue([
    { path: 'src/components/App.tsx', name: 'App.tsx' },
    { path: 'src/utils/helpers.ts', name: 'helpers.ts' },
  ]);

  // Tasks API defaults
  mockedApi.tasksApi.getAll.mockResolvedValue(mockData.tasks);
  mockedApi.tasksApi.getById.mockResolvedValue(mockData.task);
  mockedApi.tasksApi.create.mockResolvedValue(mockData.task);
  mockedApi.tasksApi.createAndStart.mockResolvedValue(
    mockData.taskWithAttemptStatus
  );
  mockedApi.tasksApi.update.mockResolvedValue(mockData.task);
  mockedApi.tasksApi.delete.mockResolvedValue(undefined);
  mockedApi.tasksApi.getChildren.mockResolvedValue([]);

  // Attempts API defaults
  mockedApi.attemptsApi.getAll.mockResolvedValue([mockData.taskAttempt]);
  mockedApi.attemptsApi.create.mockResolvedValue(mockData.taskAttempt);
  mockedApi.attemptsApi.getState.mockResolvedValue(mockData.taskAttemptState);
  mockedApi.attemptsApi.stop.mockResolvedValue(undefined);
  mockedApi.attemptsApi.followUp.mockResolvedValue(undefined);
  mockedApi.attemptsApi.getDiff.mockResolvedValue(mockData.diff);
  mockedApi.attemptsApi.deleteFile.mockResolvedValue(undefined);
  mockedApi.attemptsApi.openEditor.mockResolvedValue(undefined);
  mockedApi.attemptsApi.getBranchStatus.mockResolvedValue(
    mockData.branchStatus
  );
  mockedApi.attemptsApi.merge.mockResolvedValue(undefined);
  mockedApi.attemptsApi.rebase.mockResolvedValue(undefined);
  mockedApi.attemptsApi.createPR.mockResolvedValue(
    'https://github.com/test/test/pull/1'
  );
  mockedApi.attemptsApi.startDevServer.mockResolvedValue(undefined);
  mockedApi.attemptsApi.getExecutionProcesses.mockResolvedValue([
    mockData.executionProcessSummary,
  ]);
  mockedApi.attemptsApi.stopExecutionProcess.mockResolvedValue(undefined);
  mockedApi.attemptsApi.getDetails.mockResolvedValue(mockData.taskAttempt);
  mockedApi.attemptsApi.getAllLogs.mockResolvedValue([mockData.processLogs]);

  // Execution Processes API defaults
  mockedApi.executionProcessesApi.getDetails.mockResolvedValue(
    mockData.executionProcess
  );

  // File System API defaults
  mockedApi.fileSystemApi.list.mockResolvedValue({
    entries: mockData.directoryEntries,
    current_path: '/project',
  });

  // Config API defaults
  mockedApi.configApi.getConfig.mockResolvedValue(mockData.config);
  mockedApi.configApi.saveConfig.mockResolvedValue(mockData.config);

  // GitHub Auth API defaults
  mockedApi.githubAuthApi.checkGithubToken.mockResolvedValue(true);
  mockedApi.githubAuthApi.start.mockResolvedValue(mockData.deviceAuth);
  mockedApi.githubAuthApi.poll.mockResolvedValue('github_oauth_token');

  // Templates API defaults
  mockedApi.templatesApi.list.mockResolvedValue(mockData.templates);
  mockedApi.templatesApi.listGlobal.mockResolvedValue(
    mockData.templates.filter((t) => t.project_id === null)
  );
  mockedApi.templatesApi.listByProject.mockResolvedValue(
    mockData.templates.filter((t) => t.project_id !== null)
  );
  mockedApi.templatesApi.get.mockResolvedValue(mockData.template);
  mockedApi.templatesApi.create.mockResolvedValue(mockData.template);
  mockedApi.templatesApi.update.mockResolvedValue(mockData.template);
  mockedApi.templatesApi.delete.mockResolvedValue(undefined);

  // MCP Servers API defaults
  mockedApi.mcpServersApi.load.mockResolvedValue({});
  mockedApi.mcpServersApi.save.mockResolvedValue(undefined);

  // Gallery API defaults
  mockedApi.galleryApi.getAttachments.mockResolvedValue(mockData.attachments);
  mockedApi.galleryApi.uploadAttachment.mockResolvedValue(mockData.attachment);
  mockedApi.galleryApi.deleteAttachment.mockResolvedValue(undefined);
  mockedApi.galleryApi.getAttachmentUrl.mockReturnValue(
    '/api/tasks/test-task/attachments/test-attachment/file'
  );
  mockedApi.galleryApi.getComments.mockResolvedValue(mockData.comments);
  mockedApi.galleryApi.createComment.mockResolvedValue(mockData.comment);
  mockedApi.galleryApi.updateComment.mockResolvedValue(mockData.comment);
  mockedApi.galleryApi.deleteComment.mockResolvedValue(undefined);

  // Make request mock
  mockedApi.makeRequest.mockImplementation(() => {
    return mockFetchResponse({}, 200, true);
  });
};

// Helper to mock specific API failures
export const mockApiError = (
  apiFunction: jest.MockedFunction<(...args: unknown[]) => unknown>,
  message: string,
  status = 500
) => {
  apiFunction.mockRejectedValue(new api.ApiError(message, status));
};

// Helper to mock loading states
export const mockApiLoading = (
  apiFunction: jest.MockedFunction<(...args: unknown[]) => unknown>,
  delay = 1000
) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      apiFunction.mockResolvedValue(mockData);
      resolve(mockData);
    }, delay);
  });
};

// Reset all mocks
export const resetAllApiMocks = () => {
  Object.values(mockedApi.projectsApi).forEach((mock) => mock.mockReset());
  Object.values(mockedApi.tasksApi).forEach((mock) => mock.mockReset());
  Object.values(mockedApi.attemptsApi).forEach((mock) => mock.mockReset());
  Object.values(mockedApi.executionProcessesApi).forEach((mock) =>
    mock.mockReset()
  );
  Object.values(mockedApi.fileSystemApi).forEach((mock) => mock.mockReset());
  Object.values(mockedApi.configApi).forEach((mock) => mock.mockReset());
  Object.values(mockedApi.githubAuthApi).forEach((mock) => mock.mockReset());
  Object.values(mockedApi.templatesApi).forEach((mock) => mock.mockReset());
  Object.values(mockedApi.mcpServersApi).forEach((mock) => mock.mockReset());
  Object.values(mockedApi.galleryApi).forEach((mock) => mock.mockReset());
  mockedApi.makeRequest.mockReset();
};

// Export the mocked APIs for use in tests
export { mockedApi };
