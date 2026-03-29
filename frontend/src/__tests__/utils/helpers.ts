import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Helper functions for common testing scenarios

/**
 * Simulates user typing in an input field
 */
export const typeInInput = async (
  input: HTMLElement,
  text: string,
  options?: { delay?: number; clear?: boolean }
) => {
  const user = userEvent.setup();

  if (options?.clear) {
    await user.clear(input);
  }

  await user.type(input, text, { delay: options?.delay });
};

/**
 * Simulates user clicking on an element
 */
export const clickElement = async (
  element: HTMLElement,
  options?: { delay?: number }
) => {
  const user = userEvent.setup();
  await user.click(element, { delay: options?.delay });
};

/**
 * Simulates user double-clicking on an element
 */
export const doubleClickElement = async (element: HTMLElement) => {
  const user = userEvent.setup();
  await user.dblClick(element);
};

/**
 * Simulates user hovering over an element
 */
export const hoverElement = async (element: HTMLElement) => {
  const user = userEvent.setup();
  await user.hover(element);
};

/**
 * Simulates user unhhovering from an element
 */
export const unhoverElement = async (element: HTMLElement) => {
  const user = userEvent.setup();
  await user.unhover(element);
};

/**
 * Simulates user focusing on an element
 */
export const focusElement = async (element: HTMLElement) => {
  const user = userEvent.setup();
  await user.click(element);
};

/**
 * Simulates user pressing a key
 */
export const pressKey = async (key: string, element?: HTMLElement) => {
  const user = userEvent.setup();
  if (element) {
    await user.type(element, key);
  } else {
    await user.keyboard(key);
  }
};

/**
 * Simulates user pressing multiple keys in combination
 */
export const pressKeyCombination = async (
  keys: string[],
  element?: HTMLElement
) => {
  const user = userEvent.setup();
  const keyCombo = keys.join('+');

  if (element) {
    element.focus();
  }

  await user.keyboard(`{${keyCombo}}`);
};

/**
 * Simulates selecting text in an input
 */
export const selectText = async (
  input: HTMLElement,
  startIndex?: number,
  endIndex?: number
) => {
  const user = userEvent.setup();

  if (startIndex !== undefined && endIndex !== undefined) {
    await user.selectOptions(input, { startIndex, endIndex } as any);
  } else {
    await user.selectAll(input);
  }
};

/**
 * Simulates file upload via drag and drop
 */
export const uploadFiles = async (dropzone: HTMLElement, files: File[]) => {
  const user = userEvent.setup();
  await user.upload(dropzone, files);
};

/**
 * Waits for an element to appear in the DOM
 */
export const waitForElement = async (
  selector: string | (() => HTMLElement | null),
  options?: { timeout?: number }
): Promise<HTMLElement> => {
  if (typeof selector === 'string') {
    return await screen.findByTestId(
      selector,
      {},
      { timeout: options?.timeout }
    );
  } else {
    return await waitFor(
      () => {
        const element = selector();
        if (!element) throw new Error('Element not found');
        return element;
      },
      { timeout: options?.timeout }
    );
  }
};

/**
 * Waits for an element to be removed from the DOM
 */
export const waitForElementToBeRemoved = async (
  element: HTMLElement,
  options?: { timeout?: number }
) => {
  await waitFor(
    () => {
      if (document.contains(element)) {
        throw new Error('Element still in DOM');
      }
    },
    { timeout: options?.timeout }
  );
};

/**
 * Waits for text to appear anywhere in the document
 */
export const waitForText = async (
  text: string | RegExp,
  options?: { timeout?: number }
): Promise<HTMLElement> => {
  return await screen.findByText(text, {}, { timeout: options?.timeout });
};

/**
 * Gets all elements by test ID with optional filtering
 */
export const getAllByTestId = (
  testId: string,
  container?: HTMLElement
): HTMLElement[] => {
  const elements = container
    ? container.querySelectorAll(`[data-testid="${testId}"]`)
    : document.querySelectorAll(`[data-testid="${testId}"]`);

  return Array.from(elements) as HTMLElement[];
};

/**
 * Finds the closest element with a specific test ID
 */
export const findClosestByTestId = (
  element: HTMLElement,
  testId: string
): HTMLElement | null => {
  return element.closest(`[data-testid="${testId}"]`) as HTMLElement | null;
};

/**
 * Checks if an element is visible on screen
 */
export const isElementVisible = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
};

/**
 * Scrolls an element into view
 */
export const scrollToElement = (element: HTMLElement) => {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

/**
 * Simulates window resize
 */
export const resizeWindow = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  window.dispatchEvent(new Event('resize'));
};

/**
 * Simulates network connectivity changes
 */
export const setNetworkStatus = (online: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: online,
  });

  window.dispatchEvent(new Event(online ? 'online' : 'offline'));
};

/**
 * Creates a promise that resolves after a specified delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Mocks the clipboard API for testing copy/paste functionality
 */
export const mockClipboard = () => {
  const mockClipboard = {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
    write: jest.fn().mockResolvedValue(undefined),
    read: jest.fn().mockResolvedValue([]),
  };

  Object.defineProperty(navigator, 'clipboard', {
    value: mockClipboard,
    writable: true,
  });

  return mockClipboard;
};

/**
 * Simulates a paste event with text data
 */
export const simulatePaste = async (element: HTMLElement, text: string) => {
  const user = userEvent.setup();
  const clipboardData = {
    getData: () => text,
    setData: () => {},
  };

  const pasteEvent = new ClipboardEvent('paste', {
    clipboardData: clipboardData as any,
    bubbles: true,
  });

  element.dispatchEvent(pasteEvent);

  // Also trigger the user event for good measure
  await user.paste(text);
};

/**
 * Simulates drag and drop between two elements
 */
export const simulateDragAndDrop = async (
  source: HTMLElement,
  target: HTMLElement,
  dataTransfer?: Record<string, string>
) => {
  // Create drag data transfer
  const mockDataTransfer = {
    getData: (format: string) => dataTransfer?.[format] || '',
    setData: jest.fn(),
    files: [],
    types: dataTransfer ? Object.keys(dataTransfer) : [],
    effectAllowed: 'all',
    dropEffect: 'move',
  };

  // Simulate drag start
  const dragStartEvent = new DragEvent('dragstart', {
    dataTransfer: mockDataTransfer as any,
    bubbles: true,
  });
  source.dispatchEvent(dragStartEvent);

  // Simulate drag enter
  const dragEnterEvent = new DragEvent('dragenter', {
    dataTransfer: mockDataTransfer as any,
    bubbles: true,
  });
  target.dispatchEvent(dragEnterEvent);

  // Simulate drag over
  const dragOverEvent = new DragEvent('dragover', {
    dataTransfer: mockDataTransfer as any,
    bubbles: true,
  });
  target.dispatchEvent(dragOverEvent);

  // Simulate drop
  const dropEvent = new DragEvent('drop', {
    dataTransfer: mockDataTransfer as any,
    bubbles: true,
  });
  target.dispatchEvent(dropEvent);

  // Simulate drag end
  const dragEndEvent = new DragEvent('dragend', {
    dataTransfer: mockDataTransfer as any,
    bubbles: true,
  });
  source.dispatchEvent(dragEndEvent);
};

/**
 * Waits for all pending promises and timers to resolve
 */
export const flushPromises = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

/**
 * Creates a mock intersection observer for testing
 */
export const createMockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });

  window.IntersectionObserver = mockIntersectionObserver;
  return mockIntersectionObserver;
};

/**
 * Creates a mock resize observer for testing
 */
export const createMockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });

  window.ResizeObserver = mockResizeObserver;
  return mockResizeObserver;
};

/**
 * Mocks local storage for testing
 */
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  const mockStorage = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });

  return mockStorage;
};

/**
 * Mocks session storage for testing
 */
export const mockSessionStorage = () => {
  const store: Record<string, string> = {};

  const mockStorage = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };

  Object.defineProperty(window, 'sessionStorage', {
    value: mockStorage,
    writable: true,
  });

  return mockStorage;
};

/**
 * Debug helper to log element structure
 */
export const debugElement = (element: HTMLElement, depth = 3) => {
  console.log('Element debug:');
  console.log('Tag:', element.tagName);
  console.log('ID:', element.id);
  console.log('Classes:', element.className);
  console.log('Text content:', element.textContent);
  console.log(
    'Attributes:',
    Array.from(element.attributes).map((attr) => `${attr.name}="${attr.value}"`)
  );

  if (depth > 0) {
    console.log('Children:');
    Array.from(element.children).forEach((child, index) => {
      console.log(
        `  ${index}:`,
        (child as HTMLElement).tagName,
        (child as HTMLElement).className
      );
    });
  }
};

/**
 * Waits for React to finish rendering
 */
export const waitForReactToUpdate = async () => {
  await waitFor(() => {}, { timeout: 0 });
};
