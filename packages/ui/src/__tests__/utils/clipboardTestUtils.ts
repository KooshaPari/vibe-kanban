/**
 * Utilities for testing clipboard functionality
 */

// Mock clipboard API for testing
export const mockClipboardAPI = () => {
  const clipboard = {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
    write: jest.fn().mockResolvedValue(undefined),
    read: jest.fn().mockResolvedValue([]),
  };

  Object.defineProperty(navigator, 'clipboard', {
    value: clipboard,
    writable: true,
    configurable: true,
  });

  return clipboard;
};

// Create a mock clipboard item
export const createMockClipboardItem = (
  data: Record<string, string | Blob>
) => {
  const mockClipboardItem = {
    types: Object.keys(data),
    getType: jest.fn((type: string) => {
      const value = data[type];
      if (typeof value === 'string') {
        return Promise.resolve(new Blob([value], { type }));
      }
      return Promise.resolve(value);
    }),
  };

  return mockClipboardItem as ClipboardItem;
};

// Simulate copy operation
export const simulateCopy = async (text: string) => {
  const clipboard = navigator.clipboard || mockClipboardAPI();
  await clipboard.writeText(text);
  return clipboard;
};

// Simulate paste operation
export const simulatePaste = async (element: HTMLElement, text: string) => {
  const clipboard = navigator.clipboard || mockClipboardAPI();

  // Mock readText to return our test text
  clipboard.readText = jest.fn().mockResolvedValue(text);

  // Create and dispatch paste event
  const pasteEvent = new ClipboardEvent('paste', {
    clipboardData: new DataTransfer(),
    bubbles: true,
    cancelable: true,
  });

  // Mock clipboardData
  Object.defineProperty(pasteEvent, 'clipboardData', {
    value: {
      getData: (format: string) => {
        if (format === 'text/plain') return text;
        return '';
      },
      setData: jest.fn(),
      files: [],
      types: ['text/plain'],
      items: [
        {
          kind: 'string',
          type: 'text/plain',
          getAsString: (callback: (data: string) => void) => callback(text),
          getAsFile: () => null,
        },
      ],
    },
    writable: false,
  });

  element.dispatchEvent(pasteEvent);
  return pasteEvent;
};

// Simulate copy operation with rich data
export const simulateCopyWithData = async (
  data: Record<string, string | Blob>
) => {
  const clipboard = navigator.clipboard || mockClipboardAPI();
  const clipboardItems = [createMockClipboardItem(data)];

  await clipboard.write(clipboardItems);
  return clipboard;
};

// Simulate paste operation with files
export const simulatePasteWithFiles = async (
  element: HTMLElement,
  files: File[]
) => {
  const pasteEvent = new ClipboardEvent('paste', {
    bubbles: true,
    cancelable: true,
  });

  // Mock clipboardData with files
  Object.defineProperty(pasteEvent, 'clipboardData', {
    value: {
      getData: () => '',
      setData: jest.fn(),
      files: files,
      types: ['Files'],
      items: files.map((file) => ({
        kind: 'file',
        type: file.type,
        getAsString: null,
        getAsFile: () => file,
      })),
    },
    writable: false,
  });

  element.dispatchEvent(pasteEvent);
  return pasteEvent;
};

// Check if clipboard is supported
export const isClipboardSupported = () => {
  return !!(navigator.clipboard && navigator.clipboard.writeText);
};

// Mock execCommand for older browsers
export const mockExecCommand = () => {
  const originalExecCommand = document.execCommand;
  document.execCommand = jest.fn().mockImplementation((command: string) => {
    if (command === 'copy') {
      return true;
    }
    return false;
  });

  return {
    restore: () => {
      document.execCommand = originalExecCommand;
    },
    mock: document.execCommand as jest.MockedFunction<
      typeof document.execCommand
    >,
  };
};

// Test helper to verify clipboard operations
export const expectClipboardToHaveText = async (expectedText: string) => {
  const clipboard = navigator.clipboard;
  if (clipboard && clipboard.readText) {
    const clipboardText = await clipboard.readText();
    expect(clipboardText).toBe(expectedText);
  }
};

// Test helper to verify clipboard write was called
export const expectClipboardWriteToHaveBeenCalled = (times = 1) => {
  const clipboard = navigator.clipboard;
  if (clipboard && clipboard.writeText) {
    expect(clipboard.writeText).toHaveBeenCalledTimes(times);
  }
};

// Create a temporary input for clipboard operations (fallback method)
export const createTemporaryInput = (text: string) => {
  const input = document.createElement('input');
  input.style.position = 'fixed';
  input.style.top = '-1000px';
  input.style.left = '-1000px';
  input.value = text;
  document.body.appendChild(input);

  return {
    element: input,
    select: () => {
      input.select();
      input.setSelectionRange(0, 99999); // For mobile devices
    },
    remove: () => {
      document.body.removeChild(input);
    },
  };
};

// Test clipboard permissions
export const testClipboardPermissions = async () => {
  try {
    const result = await navigator.permissions?.query({
      name: 'clipboard-read' as PermissionName,
    });
    return result?.state === 'granted';
  } catch (error) {
    return false;
  }
};

// Mock clipboard permissions
export const mockClipboardPermissions = (granted = true) => {
  const mockPermissions = {
    query: jest.fn().mockResolvedValue({
      state: granted ? 'granted' : 'denied',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  };

  Object.defineProperty(navigator, 'permissions', {
    value: mockPermissions,
    writable: true,
    configurable: true,
  });

  return mockPermissions;
};

// Utility to test keyboard shortcuts for copy/paste
export const testCopyPasteShortcuts = {
  copy: (element: HTMLElement) => {
    const event = new KeyboardEvent('keydown', {
      key: 'c',
      ctrlKey: true,
      bubbles: true,
    });
    element.dispatchEvent(event);
    return event;
  },

  paste: (element: HTMLElement) => {
    const event = new KeyboardEvent('keydown', {
      key: 'v',
      ctrlKey: true,
      bubbles: true,
    });
    element.dispatchEvent(event);
    return event;
  },

  cut: (element: HTMLElement) => {
    const event = new KeyboardEvent('keydown', {
      key: 'x',
      ctrlKey: true,
      bubbles: true,
    });
    element.dispatchEvent(event);
    return event;
  },

  selectAll: (element: HTMLElement) => {
    const event = new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      bubbles: true,
    });
    element.dispatchEvent(event);
    return event;
  },
};

// Reset clipboard mocks
export const resetClipboardMocks = () => {
  if (navigator.clipboard) {
    Object.values(navigator.clipboard).forEach((method) => {
      if (jest.isMockFunction(method)) {
        method.mockReset();
      }
    });
  }
};

export default {
  mockClipboardAPI,
  createMockClipboardItem,
  simulateCopy,
  simulatePaste,
  simulateCopyWithData,
  simulatePasteWithFiles,
  isClipboardSupported,
  mockExecCommand,
  expectClipboardToHaveText,
  expectClipboardWriteToHaveBeenCalled,
  createTemporaryInput,
  testClipboardPermissions,
  mockClipboardPermissions,
  testCopyPasteShortcuts,
  resetClipboardMocks,
};
