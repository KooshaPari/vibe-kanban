// Type definitions
interface ProjectOverrides {
  id?: string;
  name?: string;
  description?: string;
  repository?: string;
  branch?: string;
  created_at?: string;
  updated_at?: string;
}

interface TaskOverrides {
  id?: string;
  project_id?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

// Mock API responses
export function mockApiResponse<T>(data: T): Promise<T> {
  return Promise.resolve(data);
}

export function mockApiError(message: string, status = 500): Promise<never> {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return Promise.reject(error);
}

// Mock file for testing file uploads
export function createMockFile(
  name: string = 'test.txt',
  content: string = 'test content',
  type: string = 'text/plain'
): File {
  const file = new File([content], name, { type });
  return file;
}

// Mock image file for testing image uploads
export function createMockImageFile(
  name: string = 'test.jpg',
  width: number = 100,
  height: number = 100
): File {
  // Create a simple mock image file without using canvas
  // This is just a placeholder for testing purposes
  const imageData = `Mock image data ${width}x${height}`;
  const blob = new Blob([imageData], { type: 'image/jpeg' });
  return new File([blob], name, { type: 'image/jpeg' });
}

// Mock drag and drop events
export function createMockDragEvent(
  type: string,
  files: File[] = []
): DragEvent {
  const event = new Event(type) as DragEvent;
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files,
      items: files.map((file) => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file,
      })),
      types: ['Files'],
    },
  });
  return event;
}

// Test data factories
export function createMockProject(overrides: ProjectOverrides = {}) {
  return {
    id: '1',
    name: 'Test Project',
    description: 'A test project',
    repository: 'https://github.com/test/repo',
    branch: 'main',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockTask(overrides: TaskOverrides = {}) {
  return {
    id: '1',
    project_id: '1',
    title: 'Test Task',
    description: 'A test task',
    status: 'pending' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// Wait for async operations in tests
export function waitForAsyncOperation(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
