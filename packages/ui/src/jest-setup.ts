// Mock Vite's import.meta
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        DEV: false,
        PROD: true,
        MODE: 'test',
        VITE_API_URL: 'http://localhost:3001',
      },
    },
  },
});

// Mock Vite's __APP_VERSION__
global.__APP_VERSION__ = '1.0.0-test';

// Mock environment variables that might be used
process.env.NODE_ENV = 'test';
process.env.VITE_API_URL = 'http://localhost:3001';

// Early clipboard setup to prevent userEvent conflicts
if (!Object.getOwnPropertyDescriptor(navigator, 'clipboard')) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: jest.fn().mockResolvedValue(undefined),
      readText: jest.fn().mockResolvedValue(''),
      write: jest.fn().mockResolvedValue(undefined),
      read: jest.fn().mockResolvedValue([]),
    },
    writable: true,
    configurable: true,
  });
}

// Setup global fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: {} }),
    text: () => Promise.resolve('{}'),
    blob: () => Promise.resolve(new Blob()),
    headers: new Headers(),
    redirected: false,
    status: 200,
    statusText: 'OK',
    type: 'basic' as ResponseType,
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
  } as Response)
);

// Mock API module to ensure consistent mocking
jest.mock('@/lib/api', () => {
  const mockApi = jest.requireActual('./src/__mocks__/api');
  return mockApi;
});
