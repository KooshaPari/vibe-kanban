/**
 * Comprehensive unit tests for TaskDetailsContextProvider
 * Testing context state management, API integration, and component interactions
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskDetailsProvider from '@/components/context/TaskDetailsContextProvider';
import {
  TaskDetailsContext,
  TaskAttemptLoadingContext,
  TaskSelectedAttemptContext,
  TaskAttemptDataContext,
} from '@/components/context/taskDetailsContext';
import type { TaskWithAttemptStatus, TaskAttempt } from 'shared/types';

// Mock the API
jest.mock('@/lib/api', () => ({
  tasksApi: {
    getTaskDetails: jest.fn(),
    updateTask: jest.fn(),
  },
  attemptsApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
  },
  filesApi: {
    openInEditor: jest.fn(),
  },
}));

// Test data factories
const createMockTask = (overrides: Partial<TaskWithAttemptStatus> = {}): TaskWithAttemptStatus => ({
  id: 'task-1',
  project_id: 'project-1',
  title: 'Test Task',
  description: 'A test task description',
  status: 'in_progress',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  parent_task_attempt: null,
  has_attempts: true,
  latest_attempt_status: 'running',
  has_in_progress_attempt: true,
  has_merged_attempt: false,
  has_failed_attempt: false,
  latest_attempt_executor: 'claude',
  ...overrides,
});

const createMockTaskAttempt = (overrides: Partial<TaskAttempt> = {}): TaskAttempt => ({
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
  ...overrides,
});

// Test component that consumes all contexts
const TestContextConsumer: React.FC = () => {
  const taskDetailsContext = React.useContext(TaskDetailsContext);
  const loadingContext = React.useContext(TaskAttemptLoadingContext);
  const selectedAttemptContext = React.useContext(TaskSelectedAttemptContext);
  const attemptDataContext = React.useContext(TaskAttemptDataContext);

  return (
    <div>
      <div data-testid="task-id">
        Task ID: {taskDetailsContext.taskId || 'none'}
      </div>
      <div data-testid="project-id">
        Project ID: {taskDetailsContext.projectId || 'none'}
      </div>
      <div data-testid="loading">
        Loading: {loadingContext.loading ? 'true' : 'false'}
      </div>
      <div data-testid="selected-attempt">
        Selected Attempt: {selectedAttemptContext.selectedAttempt?.id || 'none'}
      </div>
      <div data-testid="attempt-running">
        Attempt Running: {attemptDataContext.isAttemptRunning ? 'true' : 'false'}
      </div>
      {taskDetailsContext.task && (
        <div data-testid="task-details">
          <div data-testid="task-title">{taskDetailsContext.task.title}</div>
          <div data-testid="task-description">{taskDetailsContext.task.description}</div>
          <div data-testid="task-status">{taskDetailsContext.task.status}</div>
        </div>
      )}

      <button
        onClick={() => loadingContext.setLoading(!loadingContext.loading)}
        data-testid="toggle-loading"
      >
        Toggle Loading
      </button>
      <button
        onClick={() => taskDetailsContext.handleOpenInEditor()}
        data-testid="open-editor"
      >
        Open in Editor
      </button>
      {selectedAttemptContext.selectedAttempt && (
        <button
          onClick={() => selectedAttemptContext.setSelectedAttempt(null)}
          data-testid="clear-attempt"
        >
          Clear Attempt
        </button>
      )}
    </div>
  );
};

describe('TaskDetailsContextProvider', () => {
  const mockSetActiveTab = jest.fn();
  const mockSetShowEditorDialog = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup API mocks
    const { tasksApi, attemptsApi, filesApi } = await import('@/lib/api');
    (tasksApi.getTaskDetails as jest.Mock).mockResolvedValue(createMockTask());
    (attemptsApi.getAll as jest.Mock).mockResolvedValue([createMockTaskAttempt()]);
    (attemptsApi.getById as jest.Mock).mockResolvedValue(createMockTaskAttempt());
    (filesApi.openInEditor as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Provider initialization', () => {
    it('should provide all context values with defaults', async () => {
      render(
        <TaskDetailsProvider
          taskId="test-task-1"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      expect(screen.getByTestId('task-id')).toHaveTextContent('Task ID: test-task-1');
      expect(screen.getByTestId('project-id')).toHaveTextContent('Project ID: project-1');
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading: true');
      expect(screen.getByTestId('selected-attempt')).toHaveTextContent('Selected Attempt: none');
      expect(screen.getByTestId('attempt-running')).toHaveTextContent('Attempt Running: false');
    });

    it('should load task details on mount', async () => {
      const { tasksApi } = await import('@/lib/api');
      const mockTask = createMockTask({
        id: 'test-task-1',
        title: 'Loaded Task',
        description: 'Task loaded from API',
      });

      (tasksApi.getTaskDetails as jest.Mock).mockResolvedValue(mockTask);

      render(
        <TaskDetailsProvider
          taskId="test-task-1"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('task-title')).toHaveTextContent('Loaded Task');
        expect(screen.getByTestId('task-description')).toHaveTextContent('Task loaded from API');
        expect(screen.getByTestId('task-status')).toHaveTextContent('in_progress');
      });

      expect(tasksApi.getTaskDetails).toHaveBeenCalledWith('test-task-1');
    });

    it('should load task attempts on mount', async () => {
      const { attemptsApi } = await import('@/lib/api');
      const mockAttempt = createMockTaskAttempt({
        id: 'loaded-attempt',
        status: 'running',
      });

      (attemptsApi.getAll as jest.Mock).mockResolvedValue([mockAttempt]);

      render(
        <TaskDetailsProvider
          taskId="test-task-1"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('selected-attempt')).toHaveTextContent('Selected Attempt: loaded-attempt');
        expect(screen.getByTestId('attempt-running')).toHaveTextContent('Attempt Running: true');
      });

      expect(attemptsApi.getAll).toHaveBeenCalledWith('test-task-1');
    });

    it('should handle API errors gracefully', async () => {
      const { tasksApi } = await import('@/lib/api');
      (tasksApi.getTaskDetails as jest.Mock).mockRejectedValue(new Error('API Error'));

      // Suppress console errors for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TaskDetailsProvider
          taskId="test-task-1"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loading: false');
      });

      // Should not crash the component
      expect(screen.getByTestId('task-id')).toHaveTextContent('Task ID: test-task-1');

      consoleSpy.mockRestore();
    });
  });

  describe('Loading state management', () => {
    it('should manage loading state correctly', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailsProvider
          taskId="test-task-1"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loading: false');
      });

      // Toggle loading state
      await user.click(screen.getByTestId('toggle-loading'));

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading: true');

      // Toggle back
      await user.click(screen.getByTestId('toggle-loading'));

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading: false');
    });

    it('should set loading to false after task loads', async () => {
      render(
        <TaskDetailsProvider
          taskId="test-task-1"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      // Initially loading
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading: true');

      // Should stop loading after API call completes
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loading: false');
      });
    });
  });

  describe('Task attempt management', () => {
    it('should select the latest running attempt by default', async () => {
      const { attemptsApi } = await import('@/lib/api');
      const attempts = [
        createMockTaskAttempt({ id: 'attempt-1', status: 'completed', created_at: '2024-01-01T00:00:00Z' }),
        createMockTaskAttempt({ id: 'attempt-2', status: 'running', created_at: '2024-01-01T01:00:00Z' }),
        createMockTaskAttempt({ id: 'attempt-3', status: 'failed', created_at: '2024-01-01T02:00:00Z' }),
      ];

      (attemptsApi.getAll as jest.Mock).mockResolvedValue(attempts);

      render(
        <TaskDetailsProvider
          taskId="test-task-1"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('selected-attempt')).toHaveTextContent('Selected Attempt: attempt-2');
        expect(screen.getByTestId('attempt-running')).toHaveTextContent('Attempt Running: true');
      });
    });

    it('should select the latest attempt if no running attempt exists', async () => {
      const { attemptsApi } = await import('@/lib/api');
      const attempts = [
        createMockTaskAttempt({ id: 'attempt-1', status: 'completed', created_at: '2024-01-01T00:00:00Z' }),
        createMockTaskAttempt({ id: 'attempt-2', status: 'failed', created_at: '2024-01-01T01:00:00Z' }),
        createMockTaskAttempt({ id: 'attempt-3', status: 'completed', created_at: '2024-01-01T02:00:00Z' }),
      ];

      (attemptsApi.getAll as jest.Mock).mockResolvedValue(attempts);

      render(
        <TaskDetailsProvider
          taskId="test-task-1"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('selected-attempt')).toHaveTextContent('Selected Attempt: attempt-3');
        expect(screen.getByTestId('attempt-running')).toHaveTextContent('Attempt Running: false');
      });
    });

    it('should handle no attempts gracefully', async () => {
      const { attemptsApi } = await import('@/lib/api');
      (attemptsApi.getAll as jest.Mock).mockResolvedValue([]);

      render(
        <TaskDetailsProvider
          taskId="test-task-1"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('selected-attempt')).toHaveTextContent('Selected Attempt: none');
        expect(screen.getByTestId('attempt-running')).toHaveTextContent('Attempt Running: false');
      });
    });

    it('should allow clearing selected attempt', async () => {
      const user = userEvent.setup();
      const { attemptsApi } = await import('@/lib/api');
      const attempts = [createMockTaskAttempt({ id: 'attempt-1', status: 'running' })];

      (attemptsApi.getAll as jest.Mock).mockResolvedValue(attempts);

      render(
        <TaskDetailsProvider
          taskId="test-task-1"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('selected-attempt')).toHaveTextContent('Selected Attempt: attempt-1');
      });

      await user.click(screen.getByTestId('clear-attempt'));

      expect(screen.getByTestId('selected-attempt')).toHaveTextContent('Selected Attempt: none');
      expect(screen.getByTestId('attempt-running')).toHaveTextContent('Attempt Running: false');
    });
  });

  describe('Editor integration', () => {
    it('should handle opening files in editor', async () => {
      const user = userEvent.setup();
      const { filesApi } = await import('@/lib/api');

      render(
        <TaskDetailsProvider
          taskId="test-task-1"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      await user.click(screen.getByTestId('open-editor'));

      expect(filesApi.openInEditor).toHaveBeenCalled();
      expect(mockSetShowEditorDialog).toHaveBeenCalledWith(true);
    });

    it('should handle editor errors gracefully', async () => {
      const user = userEvent.setup();
      const { filesApi } = await import('@/lib/api');
      (filesApi.openInEditor as jest.Mock).mockRejectedValue(new Error('Editor error'));

      // Suppress console errors for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TaskDetailsProvider
          taskId="test-task-1"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      await user.click(screen.getByTestId('open-editor'));

      // Should still call setShowEditorDialog even if API fails
      expect(mockSetShowEditorDialog).toHaveBeenCalledWith(true);

      consoleSpy.mockRestore();
    });
  });

  describe('Props changes', () => {
    it('should reload data when taskId changes', async () => {
      const { tasksApi } = await import('@/lib/api');
      
      const { rerender } = render(
        <TaskDetailsProvider
          taskId="task-1"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      await waitFor(() => {
        expect(tasksApi.getTaskDetails).toHaveBeenCalledWith('task-1');
      });

      // Change taskId
      rerender(
        <TaskDetailsProvider
          taskId="task-2"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      await waitFor(() => {
        expect(tasksApi.getTaskDetails).toHaveBeenCalledWith('task-2');
      });

      expect(screen.getByTestId('task-id')).toHaveTextContent('Task ID: task-2');
    });

    it('should maintain state when non-data props change', async () => {
      const { tasksApi } = await import('@/lib/api');
      
      const { rerender } = render(
        <TaskDetailsProvider
          taskId="task-1"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      await waitFor(() => {
        expect(tasksApi.getTaskDetails).toHaveBeenCalledTimes(1);
      });

      // Change non-data prop
      const newSetActiveTab = jest.fn();
      rerender(
        <TaskDetailsProvider
          taskId="task-1"
          projectId="project-1"
          setActiveTab={newSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={true}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      // Should not reload data
      expect(tasksApi.getTaskDetails).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('task-id')).toHaveTextContent('Task ID: task-1');
    });
  });

  describe('Concurrent data loading', () => {
    it('should handle concurrent task and attempt loading', async () => {
      const { tasksApi, attemptsApi } = await import('@/lib/api');

      // Make both API calls take some time
      (tasksApi.getTaskDetails as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(createMockTask()), 50))
      );
      (attemptsApi.getAll as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([createMockTaskAttempt()]), 100))
      );

      render(
        <TaskDetailsProvider
          taskId="test-task-1"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      // Both API calls should start concurrently
      expect(tasksApi.getTaskDetails).toHaveBeenCalledWith('test-task-1');
      expect(attemptsApi.getAll).toHaveBeenCalledWith('test-task-1');

      // Wait for both to complete
      await waitFor(() => {
        expect(screen.getByTestId('task-title')).toHaveTextContent('Test Task');
        expect(screen.getByTestId('selected-attempt')).toHaveTextContent('Selected Attempt: attempt-1');
      });
    });

    it('should handle partial loading failures gracefully', async () => {
      const { tasksApi, attemptsApi } = await import('@/lib/api');
      
      // Task loads successfully, attempts fail
      (tasksApi.getTaskDetails as jest.Mock).mockResolvedValue(createMockTask());
      (attemptsApi.getAll as jest.Mock).mockRejectedValue(new Error('Attempts failed'));

      // Suppress console errors for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TaskDetailsProvider
          taskId="test-task-1"
          projectId="project-1"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestContextConsumer />
        </TaskDetailsProvider>
      );

      await waitFor(() => {
        // Task should load successfully
        expect(screen.getByTestId('task-title')).toHaveTextContent('Test Task');
        // Attempts should fail gracefully
        expect(screen.getByTestId('selected-attempt')).toHaveTextContent('Selected Attempt: none');
      });

      consoleSpy.mockRestore();
    });
  });
});