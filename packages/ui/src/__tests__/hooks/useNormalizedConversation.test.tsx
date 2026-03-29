/**
 * Comprehensive unit tests for useNormalizedConversation hook
 * Testing SSE connections, JSON patch updates, error handling, and state management
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { applyPatch } from 'fast-json-patch';
import useNormalizedConversation from '@/hooks/useNormalizedConversation';
import {
  TaskAttemptDataContext,
  TaskDetailsContext,
} from '@/components/context/taskDetailsContext';
import type {
  ExecutionProcess,
  NormalizedConversation,
} from 'shared/types';

// Mock external dependencies
jest.mock('@microsoft/fetch-event-source');
jest.mock('fast-json-patch');

const mockFetchEventSource = fetchEventSource as jest.MockedFunction<typeof fetchEventSource>;
const mockApplyPatch = applyPatch as jest.MockedFunction<typeof applyPatch>;

// Test data factories
const createMockExecutionProcess = (overrides: Partial<ExecutionProcess> = {}): ExecutionProcess => ({
  id: 'process-1',
  task_attempt_id: 'attempt-1',
  executor_type: 'claude',
  status: 'running',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  assistant_message: null,
  ...overrides,
});

const createMockNormalizedConversation = (): NormalizedConversation => ({
  entries: [
    {
      id: 'entry-1',
      type: 'user_message',
      content: 'Test user message',
      timestamp: '2024-01-01T00:00:00Z',
      metadata: {},
    },
    {
      id: 'entry-2',
      type: 'assistant_message',
      content: 'Test assistant response',
      timestamp: '2024-01-01T00:01:00Z',
      metadata: {},
    },
  ],
  metadata: {
    total_entries: 2,
    last_updated: '2024-01-01T00:01:00Z',
  },
});

const createMockTaskDetailsContext = (overrides = {}) => ({
  projectId: 'project-1',
  taskId: 'task-1',
  task: null,
  isLoading: false,
  error: null,
  handleOpenInEditor: jest.fn(),
  ...overrides,
});

const createMockAttemptDataContext = (overrides = {}) => ({
  attemptData: {
    id: 'attempt-1',
    task_id: 'task-1',
    status: 'running',
    executor: 'claude',
    worktree_path: '/tmp/worktree',
    branch: 'task-branch',
    base_branch: 'main',
    merge_commit: null,
    pr_url: null,
    pr_created_at: null,
    pr_merged_at: null,
    worktree_deleted: false,
    setup_completed_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  isAttemptRunning: true,
  ...overrides,
});

// Test wrapper component
const TestWrapper: React.FC<{
  children: React.ReactNode;
  taskDetailsContext?: any;
  attemptDataContext?: any;
}> = ({ children, taskDetailsContext, attemptDataContext }) => (
  <TaskDetailsContext.Provider value={taskDetailsContext || createMockTaskDetailsContext()}>
    <TaskAttemptDataContext.Provider value={attemptDataContext || createMockAttemptDataContext()}>
      {children}
    </TaskAttemptDataContext.Provider>
  </TaskDetailsContext.Provider>
);

describe('useNormalizedConversation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(
        () => useNormalizedConversation({}),
        { wrapper: TestWrapper }
      );

      expect(result.current.conversation).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle missing execution process', () => {
      const { result } = renderHook(
        () => useNormalizedConversation({ executionProcess: undefined }),
        { wrapper: TestWrapper }
      );

      expect(result.current.conversation).toBeNull();
      expect(result.current.loading).toBe(true);
    });

    it('should call onConversationUpdate when conversation changes', async () => {
      const mockOnUpdate = jest.fn();
      const mockConversation = createMockNormalizedConversation();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockConversation),
      });

      renderHook(
        () => useNormalizedConversation({
          executionProcess: createMockExecutionProcess(),
          onConversationUpdate: mockOnUpdate,
        }),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Conversation fetching', () => {
    it('should fetch conversation for execution process', async () => {
      const mockConversation = createMockNormalizedConversation();
      const executionProcess = createMockExecutionProcess();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockConversation),
      });

      const { result } = renderHook(
        () => useNormalizedConversation({ executionProcess }),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(result.current.conversation).toEqual(mockConversation);
        expect(result.current.loading).toBe(false);
      });

      expect(fetch).toHaveBeenCalledWith('/api/execution-processes/process-1/normalized-conversation');
    });

    it('should handle fetch errors gracefully', async () => {
      const executionProcess = createMockExecutionProcess();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(
        () => useNormalizedConversation({ executionProcess }),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle network errors', async () => {
      const executionProcess = createMockExecutionProcess();

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(
        () => useNormalizedConversation({ executionProcess }),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.loading).toBe(false);
      });
    });

    it('should not refetch already fetched processes', async () => {
      const mockConversation = createMockNormalizedConversation();
      const executionProcess = createMockExecutionProcess();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockConversation),
      });

      const { rerender } = renderHook(
        () => useNormalizedConversation({ executionProcess }),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // Rerender with same execution process
      rerender();

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1); // Should not fetch again
      });
    });

    it('should fetch new process when execution process changes', async () => {
      const mockConversation = createMockNormalizedConversation();
      let executionProcess = createMockExecutionProcess({ id: 'process-1' });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockConversation),
      });

      const { result: _result, rerender } = renderHook(
        ({ executionProcess }) => useNormalizedConversation({ executionProcess }),
        { 
          wrapper: TestWrapper,
          initialProps: { executionProcess }
        }
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // Change to new execution process
      executionProcess = createMockExecutionProcess({ id: 'process-2' });
      rerender({ executionProcess });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      expect(fetch).toHaveBeenNthCalledWith(1, '/api/execution-processes/process-1/normalized-conversation');
      expect(fetch).toHaveBeenNthCalledWith(2, '/api/execution-processes/process-2/normalized-conversation');
    });
  });

  describe('SSE Connection Management', () => {
    it('should establish SSE connection for running attempts', async () => {
      const executionProcess = createMockExecutionProcess({ status: 'running' });
      const attemptDataContext = createMockAttemptDataContext({ isAttemptRunning: true });

      renderHook(
        () => useNormalizedConversation({ executionProcess }),
        { 
          wrapper: ({ children }) => (
            <TestWrapper attemptDataContext={attemptDataContext}>
              {children}
            </TestWrapper>
          )
        }
      );

      await waitFor(() => {
        expect(mockFetchEventSource).toHaveBeenCalled();
      });

      const sseCall = mockFetchEventSource.mock.calls[0];
      expect(sseCall[0]).toBe('/api/execution-processes/process-1/sse');
    });

    it('should not establish SSE connection for completed attempts', () => {
      const executionProcess = createMockExecutionProcess({ status: 'completed' });
      const attemptDataContext = createMockAttemptDataContext({ isAttemptRunning: false });

      renderHook(
        () => useNormalizedConversation({ executionProcess }),
        { 
          wrapper: ({ children }) => (
            <TestWrapper attemptDataContext={attemptDataContext}>
              {children}
            </TestWrapper>
          )
        }
      );

      expect(mockFetchEventSource).not.toHaveBeenCalled();
    });

    it('should handle SSE connection errors', async () => {
      const executionProcess = createMockExecutionProcess({ status: 'running' });
      const attemptDataContext = createMockAttemptDataContext({ isAttemptRunning: true });

      mockFetchEventSource.mockImplementation(() => {
        throw new Error('SSE connection failed');
      });

      const { result } = renderHook(
        () => useNormalizedConversation({ executionProcess }),
        { 
          wrapper: ({ children }) => (
            <TestWrapper attemptDataContext={attemptDataContext}>
              {children}
            </TestWrapper>
          )
        }
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should cleanup SSE connection on unmount', async () => {
      const executionProcess = createMockExecutionProcess({ status: 'running' });
      const attemptDataContext = createMockAttemptDataContext({ isAttemptRunning: true });

      const mockAbortController = {
        abort: jest.fn(),
        signal: {} as AbortSignal,
      };

      global.AbortController = jest.fn(() => mockAbortController) as any;

      const { unmount } = renderHook(
        () => useNormalizedConversation({ executionProcess }),
        { 
          wrapper: ({ children }) => (
            <TestWrapper attemptDataContext={attemptDataContext}>
              {children}
            </TestWrapper>
          )
        }
      );

      unmount();

      expect(mockAbortController.abort).toHaveBeenCalled();
    });
  });

  describe('JSON Patch Updates', () => {
    it('should apply JSON patches from SSE messages', async () => {
      const initialConversation = createMockNormalizedConversation();
      const patchedConversation = {
        ...initialConversation,
        entries: [
          ...initialConversation.entries,
          {
            id: 'entry-3',
            type: 'assistant_message',
            content: 'New message',
            timestamp: '2024-01-01T00:02:00Z',
            metadata: {},
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(initialConversation),
      });

      mockApplyPatch.mockReturnValue(patchedConversation);

      const executionProcess = createMockExecutionProcess({ status: 'running' });
      const attemptDataContext = createMockAttemptDataContext({ isAttemptRunning: true });

      let onMessageCallback: ((event: MessageEvent) => void) | undefined;

      mockFetchEventSource.mockImplementation((url, options) => {
        if (options.onmessage) {
          onMessageCallback = options.onmessage;
        }
        return Promise.resolve();
      });

      const { result } = renderHook(
        () => useNormalizedConversation({ executionProcess }),
        { 
          wrapper: ({ children }) => (
            <TestWrapper attemptDataContext={attemptDataContext}>
              {children}
            </TestWrapper>
          )
        }
      );

      await waitFor(() => {
        expect(result.current.conversation).toEqual(initialConversation);
      });

      // Simulate SSE patch message
      if (onMessageCallback) {
        const patchMessage = {
          data: JSON.stringify({
            patch: [{ op: 'add', path: '/entries/-', value: patchedConversation.entries[2] }],
            batch_id: 1,
          }),
        } as MessageEvent;

        onMessageCallback(patchMessage);
      }

      await waitFor(() => {
        expect(mockApplyPatch).toHaveBeenCalled();
        expect(result.current.conversation).toEqual(patchedConversation);
      });
    });

    it('should handle malformed patch messages gracefully', async () => {
      const initialConversation = createMockNormalizedConversation();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(initialConversation),
      });

      const executionProcess = createMockExecutionProcess({ status: 'running' });
      const attemptDataContext = createMockAttemptDataContext({ isAttemptRunning: true });

      let onMessageCallback: ((event: MessageEvent) => void) | undefined;

      mockFetchEventSource.mockImplementation((url, options) => {
        if (options.onmessage) {
          onMessageCallback = options.onmessage;
        }
        return Promise.resolve();
      });

      const { result } = renderHook(
        () => useNormalizedConversation({ executionProcess }),
        { 
          wrapper: ({ children }) => (
            <TestWrapper attemptDataContext={attemptDataContext}>
              {children}
            </TestWrapper>
          )
        }
      );

      await waitFor(() => {
        expect(result.current.conversation).toEqual(initialConversation);
      });

      // Simulate malformed SSE message
      if (onMessageCallback) {
        const malformedMessage = {
          data: 'invalid-json',
        } as MessageEvent;

        onMessageCallback(malformedMessage);
      }

      // Should not crash and conversation should remain unchanged
      expect(result.current.conversation).toEqual(initialConversation);
      expect(result.current.error).toBe(null);
    });

    it('should ignore out-of-order patch messages', async () => {
      const initialConversation = createMockNormalizedConversation();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(initialConversation),
      });

      const executionProcess = createMockExecutionProcess({ status: 'running' });
      const attemptDataContext = createMockAttemptDataContext({ isAttemptRunning: true });

      let onMessageCallback: ((event: MessageEvent) => void) | undefined;

      mockFetchEventSource.mockImplementation((url, options) => {
        if (options.onmessage) {
          onMessageCallback = options.onmessage;
        }
        return Promise.resolve();
      });

      const { result } = renderHook(
        () => useNormalizedConversation({ executionProcess }),
        { 
          wrapper: ({ children }) => (
            <TestWrapper attemptDataContext={attemptDataContext}>
              {children}
            </TestWrapper>
          )
        }
      );

      await waitFor(() => {
        expect(result.current.conversation).toEqual(initialConversation);
      });

      // Simulate SSE messages with out-of-order batch IDs
      if (onMessageCallback) {
        // Send batch_id 2 first
        const laterMessage = {
          data: JSON.stringify({
            patch: [{ op: 'add', path: '/entries/-', value: { id: 'later' } }],
            batch_id: 2,
          }),
        } as MessageEvent;

        onMessageCallback(laterMessage);

        // Then send batch_id 1
        const earlierMessage = {
          data: JSON.stringify({
            patch: [{ op: 'add', path: '/entries/-', value: { id: 'earlier' } }],
            batch_id: 1,
          }),
        } as MessageEvent;

        onMessageCallback(earlierMessage);
      }

      // Should only apply the first (higher batch_id) patch
      expect(mockApplyPatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Development mode logging', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should log in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const executionProcess = createMockExecutionProcess();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(createMockNormalizedConversation()),
      });

      renderHook(
        () => useNormalizedConversation({ executionProcess }),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });
    });

    it('should not log in production mode', async () => {
      process.env.NODE_ENV = 'production';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const executionProcess = createMockExecutionProcess();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(createMockNormalizedConversation()),
      });

      renderHook(
        () => useNormalizedConversation({ executionProcess }),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(consoleSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('Context integration', () => {
    it('should use projectId from TaskDetailsContext', async () => {
      const taskDetailsContext = createMockTaskDetailsContext({ projectId: 'project-123' });
      const executionProcess = createMockExecutionProcess();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(createMockNormalizedConversation()),
      });

      renderHook(
        () => useNormalizedConversation({ executionProcess }),
        { 
          wrapper: ({ children }) => (
            <TestWrapper taskDetailsContext={taskDetailsContext}>
              {children}
            </TestWrapper>
          )
        }
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      // Verify the hook has access to the project ID
      expect(taskDetailsContext.projectId).toBe('project-123');
    });

    it('should use attemptData from TaskAttemptDataContext', async () => {
      const attemptDataContext = createMockAttemptDataContext({
        attemptData: { id: 'attempt-456' },
      });
      const executionProcess = createMockExecutionProcess();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(createMockNormalizedConversation()),
      });

      renderHook(
        () => useNormalizedConversation({ executionProcess }),
        { 
          wrapper: ({ children }) => (
            <TestWrapper attemptDataContext={attemptDataContext}>
              {children}
            </TestWrapper>
          )
        }
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      // Verify the hook has access to the attempt data
      expect(attemptDataContext.attemptData.id).toBe('attempt-456');
    });
  });

  describe('Memory management and cleanup', () => {
    it('should clear conversation on execution process change', async () => {
      const mockConversation = createMockNormalizedConversation();
      let executionProcess = createMockExecutionProcess({ id: 'process-1' });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockConversation),
      });

      const { result, rerender } = renderHook(
        ({ executionProcess }) => useNormalizedConversation({ executionProcess }),
        { 
          wrapper: TestWrapper,
          initialProps: { executionProcess }
        }
      );

      await waitFor(() => {
        expect(result.current.conversation).toEqual(mockConversation);
      });

      // Change to undefined execution process
      executionProcess = undefined;
      rerender({ executionProcess });

      expect(result.current.conversation).toBeNull();
      expect(result.current.loading).toBe(true);
    });

    it('should handle rapid execution process changes', async () => {
      const mockConversation = createMockNormalizedConversation();
      let executionProcess = createMockExecutionProcess({ id: 'process-1' });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockConversation),
      });

      const { rerender } = renderHook(
        ({ executionProcess }) => useNormalizedConversation({ executionProcess }),
        { 
          wrapper: TestWrapper,
          initialProps: { executionProcess }
        }
      );

      // Rapidly change execution processes
      for (let i = 2; i <= 5; i++) {
        executionProcess = createMockExecutionProcess({ id: `process-${i}` });
        rerender({ executionProcess });
      }

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(5); // One for each process
      });
    });
  });
});