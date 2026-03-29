import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../utils/test-utils';
import {
  setupMockApiResponses,
  mockedApi,
  resetAllApiMocks,
} from '../../mocks/apiMocks';
import { mockData } from '../../utils/mockData';

// Type definitions
interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  project_id: string;
  created_at?: string;
  updated_at?: string;
}

interface TaskCreateData {
  title: string;
  description?: string;
  status: string;
  priority: string;
  project_id: string;
}

// Simple test component that uses tasks API
const TasksApiTestComponent = () => {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [projectId] = React.useState('project-1');

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const { tasksApi } = await import('@/lib/api');
      const result = await tasksApi.getAll(projectId);
      setTasks(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: TaskCreateData) => {
    setLoading(true);
    setError(null);
    try {
      const { tasksApi } = await import('@/lib/api');
      const newTask = await tasksApi.create(projectId, taskData);
      setTasks((prev) => [...prev, newTask]);
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'idle'}</div>
      <div data-testid="error">{error || 'none'}</div>
      <div data-testid="project-id">{projectId}</div>

      <button onClick={loadTasks}>Load Tasks</button>
      <button
        onClick={() =>
          createTask({
            title: 'New Task',
            description: 'New task description',
            status: 'todo',
          })
        }
      >
        Create Task
      </button>

      <div data-testid="tasks-count">{tasks.length}</div>

      {tasks.map((task) => (
        <div key={task.id} data-testid={`task-${task.id}`}>
          <span data-testid={`task-title-${task.id}`}>{task.title}</span>
          <span data-testid={`task-status-${task.id}`}>{task.status}</span>
        </div>
      ))}
    </div>
  );
};

describe('Tasks API Integration Tests', () => {
  beforeEach(() => {
    resetAllApiMocks();
    setupMockApiResponses();
  });

  describe('Task API Operations', () => {
    it('fetches tasks for project successfully', async () => {
      const user = userEvent.setup();

      // Setup mock response
      mockedApi.tasksApi.getAll.mockResolvedValue(mockData.tasks);

      render(<TasksApiTestComponent />);

      const loadButton = screen.getByText('Load Tasks');
      await user.click(loadButton);

      // Should make API call and display tasks
      await waitFor(() => {
        expect(screen.getByTestId('tasks-count')).toHaveTextContent(
          mockData.tasks.length.toString()
        );
        expect(mockedApi.tasksApi.getAll).toHaveBeenCalledWith('project-1');
      });

      // Check that tasks are displayed
      mockData.tasks.forEach((task) => {
        expect(screen.getByTestId(`task-title-${task.id}`)).toHaveTextContent(
          task.title
        );
        expect(screen.getByTestId(`task-status-${task.id}`)).toHaveTextContent(
          task.status
        );
      });
    });

    it('handles empty tasks response', async () => {
      const user = userEvent.setup();

      // Setup empty response
      mockedApi.tasksApi.getAll.mockResolvedValue([]);

      render(<TasksApiTestComponent />);

      const loadButton = screen.getByText('Load Tasks');
      await user.click(loadButton);

      await waitFor(() => {
        expect(screen.getByTestId('tasks-count')).toHaveTextContent('0');
        expect(screen.getByTestId('error')).toHaveTextContent('none');
      });
    });

    it('creates task successfully', async () => {
      const user = userEvent.setup();

      const newTask = {
        id: 'new-task-1',
        project_id: 'project-1',
        title: 'New Task',
        description: 'New task description',
        status: 'todo',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      };

      mockedApi.tasksApi.create.mockResolvedValue(newTask);

      render(<TasksApiTestComponent />);

      const createButton = screen.getByText('Create Task');
      await user.click(createButton);

      // Should make API call with correct data
      await waitFor(() => {
        expect(mockedApi.tasksApi.create).toHaveBeenCalledWith('project-1', {
          title: 'New Task',
          description: 'New task description',
          status: 'todo',
        });
      });

      // Should add task to list
      await waitFor(() => {
        expect(screen.getByTestId('tasks-count')).toHaveTextContent('1');
        expect(screen.getByTestId('task-title-new-task-1')).toHaveTextContent(
          'New Task'
        );
      });
    });

    it('handles API errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock API error
      mockedApi.tasksApi.getAll.mockRejectedValue(new Error('Network error'));

      render(<TasksApiTestComponent />);

      const loadButton = screen.getByText('Load Tasks');
      await user.click(loadButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network error');
        expect(screen.getByTestId('loading')).toHaveTextContent('idle');
      });
    });
  });
});
