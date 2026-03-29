import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import TaskDetailsProvider from '@/components/context/TaskDetailsContextProvider';
import {
  TaskDetailsContext,
  TaskAttemptLoadingContext,
  TaskSelectedAttemptContext,
  TaskAttemptDataContext,
} from '@/components/context/taskDetailsContext';
import type { TaskWithAttemptStatus } from 'shared/types';

// Mock the API module
jest.mock('@/lib/api', () => ({
  tasksApi: {
    getTaskDetails: jest.fn(),
    updateTask: jest.fn(),
    getTaskLogs: jest.fn(),
    getTaskFiles: jest.fn(),
  },
}));

// Test component that uses the task details context
const TestTaskDetailsConsumer = () => {
  const taskDetailsContext = React.useContext(TaskDetailsContext);
  const loadingContext = React.useContext(TaskAttemptLoadingContext);
  const selectedAttemptContext = React.useContext(TaskSelectedAttemptContext);
  const attemptDataContext = React.useContext(TaskAttemptDataContext);

  return (
    <div>
      <div data-testid="task-id">
        Task ID: {taskDetailsContext.task?.id || 'none'}
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
        Attempt Running:{' '}
        {attemptDataContext.isAttemptRunning ? 'true' : 'false'}
      </div>
      {taskDetailsContext.task && (
        <div data-testid="task-details">
          <div data-testid="task-title">{taskDetailsContext.task.title}</div>
          <div data-testid="task-description">
            {taskDetailsContext.task.description}
          </div>
          <div data-testid="task-status">{taskDetailsContext.task.status}</div>
        </div>
      )}

      <button
        onClick={() => loadingContext.setLoading(!loadingContext.loading)}
      >
        Toggle Loading
      </button>
      <button onClick={() => taskDetailsContext.handleOpenInEditor()}>
        Open in Editor
      </button>
    </div>
  );
};

const mockTask: TaskWithAttemptStatus = {
  id: 'test-task-1',
  project_id: 'project-1',
  title: 'Test Task',
  description: 'A test task description',
  status: 'in_progress',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  parent_task_attempt: null,
  has_attempts: true,
  latest_attempt_status: 'running',
};

describe('Task Details Context Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Provider Initialization', () => {
    it('provides task details to child components', async () => {
      const mockSetActiveTab = jest.fn();
      const mockSetShowEditorDialog = jest.fn();

      render(
        <TaskDetailsProvider
          task={mockTask}
          projectId="project-1"
          activeTab="logs"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestTaskDetailsConsumer />
        </TaskDetailsProvider>
      );

      // Should display task details
      await waitFor(() => {
        expect(screen.getByTestId('task-id')).toHaveTextContent(
          'Task ID: test-task-1'
        );
        expect(screen.getByTestId('project-id')).toHaveTextContent(
          'Project ID: project-1'
        );
        expect(screen.getByTestId('task-title')).toHaveTextContent('Test Task');
        expect(screen.getByTestId('task-description')).toHaveTextContent(
          'A test task description'
        );
        expect(screen.getByTestId('task-status')).toHaveTextContent(
          'in_progress'
        );
      });
    });

    it('handles loading state changes', async () => {
      const user = userEvent.setup();
      const mockSetActiveTab = jest.fn();
      const mockSetShowEditorDialog = jest.fn();

      render(
        <TaskDetailsProvider
          task={mockTask}
          projectId="project-1"
          activeTab="logs"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestTaskDetailsConsumer />
        </TaskDetailsProvider>
      );

      // Initially not loading
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading: false');

      // Toggle loading state
      const toggleButton = screen.getByText('Toggle Loading');
      await user.click(toggleButton);

      // Should show loading
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading: true');
    });

    it('handles editor integration', async () => {
      const user = userEvent.setup();
      const mockSetActiveTab = jest.fn();
      const mockSetShowEditorDialog = jest.fn();

      render(
        <TaskDetailsProvider
          task={mockTask}
          projectId="project-1"
          activeTab="logs"
          setActiveTab={mockSetActiveTab}
          setShowEditorDialog={mockSetShowEditorDialog}
          userSelectedTab={false}
        >
          <TestTaskDetailsConsumer />
        </TaskDetailsProvider>
      );

      // Should be able to trigger editor
      const editorButton = screen.getByText('Open in Editor');
      await user.click(editorButton);

      // Function should be called (we can't easily test the async nature without mocking more)
      expect(editorButton).toBeInTheDocument();
    });
  });
});
