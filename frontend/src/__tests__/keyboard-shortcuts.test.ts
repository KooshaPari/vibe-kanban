import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { Mock } from 'jest';
import { renderHook } from '@testing-library/react';
import {
  createKeyboardShortcuts,
  useKeyboardShortcuts,
  useDialogKeyboardShortcuts,
  useKanbanKeyboardNavigation,
  type KeyboardShortcutContext,
} from '../lib/keyboard-shortcuts';

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/test' };

jest.mock('react-router-dom', async () => {
  const actual = await jest.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

describe('Keyboard Shortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset DOM event listeners
    document.removeEventListener = jest.fn();
    document.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
    window.addEventListener = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createKeyboardShortcuts', () => {
    it('should create shortcut definitions with context', () => {
      const mockContext: KeyboardShortcutContext = {
        navigate: mockNavigate,
        closeDialog: jest.fn(),
        onC: jest.fn(),
        currentPath: '/projects',
        hasOpenDialog: false,
      };

      const shortcuts = createKeyboardShortcuts(mockContext);

      expect(shortcuts).toHaveProperty('Escape');
      expect(shortcuts).toHaveProperty('Enter');
      expect(shortcuts).toHaveProperty('KeyC');
      expect(shortcuts).toHaveProperty('KeyS');
      expect(shortcuts).toHaveProperty('KeyN');

      expect(shortcuts.Escape.key).toBe('Escape');
      expect(shortcuts.Enter.key).toBe('Enter');
      expect(shortcuts.KeyC.key).toBe('c');
      expect(shortcuts.KeyS.key).toBe('s');
      expect(shortcuts.KeyN.key).toBe('n');
    });

    describe('Escape key behavior', () => {
      it('should ignore escape when ignoreEscape is true', () => {
        const mockContext: KeyboardShortcutContext = {
          ignoreEscape: true,
          closeDialog: jest.fn(),
          navigate: mockNavigate,
        };

        const shortcuts = createKeyboardShortcuts(mockContext);
        shortcuts.Escape.action();

        expect(mockContext.closeDialog).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      });

      it('should close dialog when hasOpenDialog is true', () => {
        const closeDialog = jest.fn();
        const mockContext: KeyboardShortcutContext = {
          hasOpenDialog: true,
          closeDialog,
          navigate: mockNavigate,
        };

        const shortcuts = createKeyboardShortcuts(mockContext);
        shortcuts.Escape.action();

        expect(closeDialog).toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      });

      it('should navigate back from task details to project tasks', () => {
        const mockContext: KeyboardShortcutContext = {
          navigate: mockNavigate,
          currentPath: '/projects/123/tasks/456',
          hasOpenDialog: false,
        };

        const shortcuts = createKeyboardShortcuts(mockContext);
        shortcuts.Escape.action();

        expect(mockNavigate).toHaveBeenCalledWith('/projects/123/tasks');
      });

      it('should navigate from project tasks to projects', () => {
        const mockContext: KeyboardShortcutContext = {
          navigate: mockNavigate,
          currentPath: '/projects/123/tasks',
          hasOpenDialog: false,
        };

        const shortcuts = createKeyboardShortcuts(mockContext);
        shortcuts.Escape.action();

        expect(mockNavigate).toHaveBeenCalledWith('/projects');
      });

      it('should navigate to projects from other pages', () => {
        const mockContext: KeyboardShortcutContext = {
          navigate: mockNavigate,
          currentPath: '/settings',
          hasOpenDialog: false,
        };

        const shortcuts = createKeyboardShortcuts(mockContext);
        shortcuts.Escape.action();

        expect(mockNavigate).toHaveBeenCalledWith('/projects');
      });

      it('should not navigate from root or projects page', () => {
        const mockContext: KeyboardShortcutContext = {
          navigate: mockNavigate,
          currentPath: '/',
          hasOpenDialog: false,
        };

        const shortcuts = createKeyboardShortcuts(mockContext);
        shortcuts.Escape.action();

        expect(mockNavigate).not.toHaveBeenCalled();
      });

      it('should use location pathname when currentPath is not provided', () => {
        const mockContext: KeyboardShortcutContext = {
          navigate: mockNavigate,
          location: { pathname: '/projects/123/tasks/456' },
          hasOpenDialog: false,
        };

        const shortcuts = createKeyboardShortcuts(mockContext);
        shortcuts.Escape.action();

        expect(mockNavigate).toHaveBeenCalledWith('/projects/123/tasks');
      });
    });

    describe('Other key behaviors', () => {
      it('should call onEnter when Enter is pressed', () => {
        const onEnter = jest.fn();
        const mockContext: KeyboardShortcutContext = { onEnter };

        const shortcuts = createKeyboardShortcuts(mockContext);
        shortcuts.Enter.action();

        expect(onEnter).toHaveBeenCalled();
      });

      it('should call onC when C is pressed', () => {
        const onC = jest.fn();
        const mockContext: KeyboardShortcutContext = { onC };

        const shortcuts = createKeyboardShortcuts(mockContext);
        shortcuts.KeyC.action();

        expect(onC).toHaveBeenCalled();
      });

      it('should call stopExecution when S is pressed', () => {
        const stopExecution = jest.fn();
        const mockContext: KeyboardShortcutContext = { stopExecution };

        const shortcuts = createKeyboardShortcuts(mockContext);
        shortcuts.KeyS.action();

        expect(stopExecution).toHaveBeenCalled();
      });

      it('should call newAttempt when N is pressed', () => {
        const newAttempt = jest.fn();
        const mockContext: KeyboardShortcutContext = { newAttempt };

        const shortcuts = createKeyboardShortcuts(mockContext);
        shortcuts.KeyN.action();

        expect(newAttempt).toHaveBeenCalled();
      });

      it('should handle missing context functions gracefully', () => {
        const mockContext: KeyboardShortcutContext = {};

        const shortcuts = createKeyboardShortcuts(mockContext);

        // These should not throw errors
        expect(() => shortcuts.Enter.action()).not.toThrow();
        expect(() => shortcuts.KeyC.action()).not.toThrow();
        expect(() => shortcuts.KeyS.action()).not.toThrow();
        expect(() => shortcuts.KeyN.action()).not.toThrow();
      });
    });
  });

  describe('useKeyboardShortcuts', () => {
    it('should register event listener on mount', () => {
      const mockContext: KeyboardShortcutContext = {
        navigate: mockNavigate,
      };

      renderHook(() => useKeyboardShortcuts(mockContext));

      expect(document.addEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should remove event listener on unmount', () => {
      const mockContext: KeyboardShortcutContext = {
        navigate: mockNavigate,
      };

      const { unmount } = renderHook(() => useKeyboardShortcuts(mockContext));
      unmount();

      expect(document.removeEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should not trigger shortcuts when typing in input fields', () => {
      const onC = jest.fn();
      const mockContext: KeyboardShortcutContext = { onC };

      renderHook(() => useKeyboardShortcuts(mockContext));

      const addEventListenerCalls = (document.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        // Simulate keydown on input element
        const mockEvent = {
          code: 'KeyC',
          key: 'c',
          target: { tagName: 'INPUT' },
          preventDefault: jest.fn(),
          ctrlKey: false,
          metaKey: false,
          altKey: false,
        };

        keydownHandler(mockEvent);
        expect(onC).not.toHaveBeenCalled();
      }
    });

    it('should not trigger shortcuts when typing in textarea', () => {
      const onC = jest.fn();
      const mockContext: KeyboardShortcutContext = { onC };

      renderHook(() => useKeyboardShortcuts(mockContext));

      const addEventListenerCalls = (document.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          code: 'KeyC',
          key: 'c',
          target: { tagName: 'TEXTAREA' },
          preventDefault: jest.fn(),
          ctrlKey: false,
          metaKey: false,
          altKey: false,
        };

        keydownHandler(mockEvent);
        expect(onC).not.toHaveBeenCalled();
      }
    });

    it('should not trigger shortcuts when editing contentEditable', () => {
      const onC = jest.fn();
      const mockContext: KeyboardShortcutContext = { onC };

      renderHook(() => useKeyboardShortcuts(mockContext));

      const addEventListenerCalls = (document.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          code: 'KeyC',
          key: 'c',
          target: { tagName: 'DIV', isContentEditable: true },
          preventDefault: jest.fn(),
          ctrlKey: false,
          metaKey: false,
          altKey: false,
        };

        keydownHandler(mockEvent);
        expect(onC).not.toHaveBeenCalled();
      }
    });

    it('should not trigger shortcuts with modifier keys', () => {
      const onC = jest.fn();
      const mockContext: KeyboardShortcutContext = { onC };

      renderHook(() => useKeyboardShortcuts(mockContext));

      const addEventListenerCalls = (document.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          code: 'KeyC',
          key: 'c',
          target: { tagName: 'DIV' },
          preventDefault: jest.fn(),
          ctrlKey: true,
          metaKey: false,
          altKey: false,
        };

        keydownHandler(mockEvent);
        expect(onC).not.toHaveBeenCalled();
      }
    });

    it('should trigger shortcuts for valid keys', () => {
      const onC = jest.fn();
      const mockContext: KeyboardShortcutContext = { onC };

      renderHook(() => useKeyboardShortcuts(mockContext));

      const addEventListenerCalls = (document.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          code: 'KeyC',
          key: 'c',
          target: { tagName: 'DIV' },
          preventDefault: jest.fn(),
          ctrlKey: false,
          metaKey: false,
          altKey: false,
        };

        keydownHandler(mockEvent);
        expect(onC).toHaveBeenCalled();
        expect(mockEvent.preventDefault).toHaveBeenCalled();
      }
    });

    it('should not trigger disabled shortcuts', () => {
      const onC = jest.fn();
      const mockContext: KeyboardShortcutContext = { onC };

      // Mock createKeyboardShortcuts to return disabled shortcut
      const originalCreateKeyboardShortcuts = jest.requireActual(
        '../lib/keyboard-shortcuts'
      ).createKeyboardShortcuts;
      jest.mocked(createKeyboardShortcuts).mockImplementation((context) => {
        const shortcuts = originalCreateKeyboardShortcuts(context);
        shortcuts.KeyC.disabled = true;
        return shortcuts;
      });

      renderHook(() => useKeyboardShortcuts(mockContext));

      const addEventListenerCalls = (document.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          code: 'KeyC',
          key: 'c',
          target: { tagName: 'DIV' },
          preventDefault: jest.fn(),
          ctrlKey: false,
          metaKey: false,
          altKey: false,
        };

        keydownHandler(mockEvent);
        expect(onC).not.toHaveBeenCalled();
      }
    });
  });

  describe('useDialogKeyboardShortcuts', () => {
    it('should register escape key listener', () => {
      const onClose = jest.fn();

      renderHook(() => useDialogKeyboardShortcuts(onClose));

      expect(document.addEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should call onClose when escape is pressed', () => {
      const onClose = jest.fn();

      renderHook(() => useDialogKeyboardShortcuts(onClose));

      const addEventListenerCalls = (document.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          key: 'Escape',
          preventDefault: jest.fn(),
        };

        keydownHandler(mockEvent);
        expect(onClose).toHaveBeenCalled();
        expect(mockEvent.preventDefault).toHaveBeenCalled();
      }
    });

    it('should not call onClose for other keys', () => {
      const onClose = jest.fn();

      renderHook(() => useDialogKeyboardShortcuts(onClose));

      const addEventListenerCalls = (document.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          key: 'Enter',
          preventDefault: jest.fn(),
        };

        keydownHandler(mockEvent);
        expect(onClose).not.toHaveBeenCalled();
        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      }
    });

    it('should remove event listener on unmount', () => {
      const onClose = jest.fn();

      const { unmount } = renderHook(() => useDialogKeyboardShortcuts(onClose));
      unmount();

      expect(document.removeEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });

  describe('useKanbanKeyboardNavigation', () => {
    const mockProps = {
      focusedTaskId: 'task-1',
      setFocusedTaskId: jest.fn(),
      focusedStatus: 'todo',
      setFocusedStatus: jest.fn(),
      groupedTasks: {
        todo: [
          { id: 'task-1', title: 'Task 1' },
          { id: 'task-2', title: 'Task 2' },
        ],
        inprogress: [{ id: 'task-3', title: 'Task 3' }],
        done: [{ id: 'task-4', title: 'Task 4' }],
      },
      filteredTasks: [
        { id: 'task-1', title: 'Task 1' },
        { id: 'task-2', title: 'Task 2' },
        { id: 'task-3', title: 'Task 3' },
        { id: 'task-4', title: 'Task 4' },
      ],
      allTaskStatuses: ['todo', 'inprogress', 'done'],
      onViewTaskDetails: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should register window keydown listener', () => {
      renderHook(() => useKanbanKeyboardNavigation(mockProps));

      expect(window.addEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should navigate down within column', () => {
      renderHook(() => useKanbanKeyboardNavigation(mockProps));

      const addEventListenerCalls = (window.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          key: 'ArrowDown',
          target: { tagName: 'DIV' },
          preventDefault: jest.fn(),
        };

        keydownHandler(mockEvent);
        expect(mockProps.setFocusedTaskId).toHaveBeenCalledWith('task-2');
        expect(mockEvent.preventDefault).toHaveBeenCalled();
      }
    });

    it('should navigate up within column', () => {
      const propsWithSecondTask = {
        ...mockProps,
        focusedTaskId: 'task-2',
      };

      renderHook(() => useKanbanKeyboardNavigation(propsWithSecondTask));

      const addEventListenerCalls = (window.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          key: 'ArrowUp',
          target: { tagName: 'DIV' },
          preventDefault: jest.fn(),
        };

        keydownHandler(mockEvent);
        expect(mockProps.setFocusedTaskId).toHaveBeenCalledWith('task-1');
        expect(mockEvent.preventDefault).toHaveBeenCalled();
      }
    });

    it('should navigate right to next column', () => {
      renderHook(() => useKanbanKeyboardNavigation(mockProps));

      const addEventListenerCalls = (window.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          key: 'ArrowRight',
          target: { tagName: 'DIV' },
          preventDefault: jest.fn(),
        };

        keydownHandler(mockEvent);
        expect(mockProps.setFocusedStatus).toHaveBeenCalledWith('inprogress');
        expect(mockProps.setFocusedTaskId).toHaveBeenCalledWith('task-3');
        expect(mockEvent.preventDefault).toHaveBeenCalled();
      }
    });

    it('should navigate left to previous column', () => {
      const propsWithInProgressTask = {
        ...mockProps,
        focusedTaskId: 'task-3',
        focusedStatus: 'inprogress',
      };

      renderHook(() => useKanbanKeyboardNavigation(propsWithInProgressTask));

      const addEventListenerCalls = (window.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          key: 'ArrowLeft',
          target: { tagName: 'DIV' },
          preventDefault: jest.fn(),
        };

        keydownHandler(mockEvent);
        expect(mockProps.setFocusedStatus).toHaveBeenCalledWith('todo');
        expect(mockProps.setFocusedTaskId).toHaveBeenCalledWith('task-1');
        expect(mockEvent.preventDefault).toHaveBeenCalled();
      }
    });

    it('should preserve index when navigating columns with preserveIndexOnColumnSwitch', () => {
      const propsWithPreserveIndex = {
        ...mockProps,
        focusedTaskId: 'task-2', // Second item in todo column
        preserveIndexOnColumnSwitch: true,
      };

      renderHook(() => useKanbanKeyboardNavigation(propsWithPreserveIndex));

      const addEventListenerCalls = (window.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          key: 'ArrowRight',
          target: { tagName: 'DIV' },
          preventDefault: jest.fn(),
        };

        keydownHandler(mockEvent);
        // Should try to go to the same index (1) but inprogress only has one item, so index 0
        expect(mockProps.setFocusedStatus).toHaveBeenCalledWith('inprogress');
        expect(mockProps.setFocusedTaskId).toHaveBeenCalledWith('task-3');
      }
    });

    it('should handle Enter key to view task details', () => {
      renderHook(() => useKanbanKeyboardNavigation(mockProps));

      const addEventListenerCalls = (window.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          key: 'Enter',
          target: { tagName: 'DIV' },
          preventDefault: jest.fn(),
        };

        keydownHandler(mockEvent);
        expect(mockProps.onViewTaskDetails).toHaveBeenCalledWith({
          id: 'task-1',
          title: 'Task 1',
        });
        expect(mockEvent.preventDefault).toHaveBeenCalled();
      }
    });

    it('should handle Space key to view task details', () => {
      renderHook(() => useKanbanKeyboardNavigation(mockProps));

      const addEventListenerCalls = (window.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          key: ' ',
          target: { tagName: 'DIV' },
          preventDefault: jest.fn(),
        };

        keydownHandler(mockEvent);
        expect(mockProps.onViewTaskDetails).toHaveBeenCalledWith({
          id: 'task-1',
          title: 'Task 1',
        });
        expect(mockEvent.preventDefault).toHaveBeenCalled();
      }
    });

    it('should not handle keys when typing in input fields', () => {
      renderHook(() => useKanbanKeyboardNavigation(mockProps));

      const addEventListenerCalls = (window.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          key: 'ArrowDown',
          target: { tagName: 'INPUT' },
          preventDefault: jest.fn(),
        };

        keydownHandler(mockEvent);
        expect(mockProps.setFocusedTaskId).not.toHaveBeenCalled();
        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      }
    });

    it('should not handle keys when no focused task', () => {
      const propsWithoutFocus = {
        ...mockProps,
        focusedTaskId: null,
      };

      renderHook(() => useKanbanKeyboardNavigation(propsWithoutFocus));

      const addEventListenerCalls = (window.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          key: 'ArrowDown',
          target: { tagName: 'DIV' },
          preventDefault: jest.fn(),
        };

        keydownHandler(mockEvent);
        expect(mockProps.setFocusedTaskId).not.toHaveBeenCalled();
        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      }
    });

    it('should skip empty columns when navigating', () => {
      const propsWithEmptyColumn = {
        ...mockProps,
        groupedTasks: {
          todo: [{ id: 'task-1', title: 'Task 1' }],
          inprogress: [], // Empty column
          done: [{ id: 'task-4', title: 'Task 4' }],
        },
        allTaskStatuses: ['todo', 'inprogress', 'done'],
      };

      renderHook(() => useKanbanKeyboardNavigation(propsWithEmptyColumn));

      const addEventListenerCalls = (window.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          key: 'ArrowRight',
          target: { tagName: 'DIV' },
          preventDefault: jest.fn(),
        };

        keydownHandler(mockEvent);
        // Should skip empty inprogress column and go to done
        expect(mockProps.setFocusedStatus).toHaveBeenCalledWith('done');
        expect(mockProps.setFocusedTaskId).toHaveBeenCalledWith('task-4');
      }
    });

    it('should remove event listener on unmount', () => {
      const { unmount } = renderHook(() =>
        useKanbanKeyboardNavigation(mockProps)
      );
      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should handle contentEditable elements', () => {
      renderHook(() => useKanbanKeyboardNavigation(mockProps));

      const addEventListenerCalls = (window.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          key: 'ArrowDown',
          target: { tagName: 'DIV', isContentEditable: true },
          preventDefault: jest.fn(),
        };

        keydownHandler(mockEvent);
        expect(mockProps.setFocusedTaskId).not.toHaveBeenCalled();
        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      }
    });

    it('should handle unknown keys gracefully', () => {
      renderHook(() => useKanbanKeyboardNavigation(mockProps));

      const addEventListenerCalls = (window.addEventListener as Mock).mock
        .calls;
      const keydownHandler = addEventListenerCalls.find(
        (call) => call[0] === 'keydown'
      )?.[1];

      if (keydownHandler) {
        const mockEvent = {
          key: 'KeyZ',
          target: { tagName: 'DIV' },
          preventDefault: jest.fn(),
        };

        keydownHandler(mockEvent);
        expect(mockProps.setFocusedTaskId).not.toHaveBeenCalled();
        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      }
    });
  });
});
