import {
  createMockFile,
  createMockImageFile,
  createMockProject,
  createMockTask,
  mockApiResponse,
  mockApiError,
  waitForAsyncOperation,
} from '../test-utils';

describe('Test Utils', () => {
  describe('File creation utilities', () => {
    it('creates a mock text file', () => {
      const file = createMockFile('test.txt', 'Hello world', 'text/plain');

      expect(file.name).toBe('test.txt');
      expect(file.type).toBe('text/plain');
      expect(file.size).toBeGreaterThan(0);
    });

    it('creates a mock image file', () => {
      const file = createMockImageFile('test.jpg', 200, 100);

      expect(file.name).toBe('test.jpg');
      expect(file.type).toBe('image/jpeg');
      expect(file.size).toBeGreaterThan(0);
    });
  });

  describe('API mock utilities', () => {
    it('mocks successful API response', async () => {
      const mockData = { id: 1, name: 'Test' };
      const response = await mockApiResponse(mockData);

      expect(response).toEqual(mockData);
    });

    it('mocks API error', async () => {
      const errorMessage = 'API Error';

      await expect(mockApiError(errorMessage)).rejects.toThrow(errorMessage);
    });

    it('mocks API error with status code', async () => {
      const errorMessage = 'Not Found';
      const error = mockApiError(errorMessage, 404);

      await expect(error).rejects.toMatchObject({
        message: errorMessage,
        status: 404,
      });
    });
  });

  describe('Data factory utilities', () => {
    it('creates a mock project', () => {
      const project = createMockProject();

      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('description');
      expect(project).toHaveProperty('repository');
      expect(project).toHaveProperty('branch');
      expect(project).toHaveProperty('created_at');
      expect(project).toHaveProperty('updated_at');
    });

    it('creates a mock project with overrides', () => {
      const overrides = { name: 'Custom Project', branch: 'develop' };
      const project = createMockProject(overrides);

      expect(project.name).toBe('Custom Project');
      expect(project.branch).toBe('develop');
    });

    it('creates a mock task', () => {
      const task = createMockTask();

      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('project_id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('description');
      expect(task).toHaveProperty('status');
      expect(task).toHaveProperty('created_at');
      expect(task).toHaveProperty('updated_at');
    });

    it('creates a mock task with overrides', () => {
      const overrides = { title: 'Custom Task', status: 'completed' as const };
      const task = createMockTask(overrides);

      expect(task.title).toBe('Custom Task');
      expect(task.status).toBe('completed');
    });
  });

  describe('Async utilities', () => {
    it('waits for async operations', async () => {
      let resolved = false;
      const promise = waitForAsyncOperation(1).then(() => {
        resolved = true;
      });

      expect(resolved).toBe(false);
      await promise;
      expect(resolved).toBe(true);
    });
  });
});
