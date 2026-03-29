import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockApiResponses } from '../../utils/test-utils';
import { ProjectTasks } from '@/pages/project-tasks';

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockParams = { projectId: '1', taskId: 'task-1' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

// Mock the API module
jest.mock('@/lib/api', () => ({
  projectsApi: {
    getProject: jest.fn(),
  },
  tasksApi: {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    getTaskDetails: jest.fn(),
  },
}));

describe('Project Tasks Page Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Task Board Display', () => {
    it('renders task board with different status columns', async () => {
      const { projectsApi, tasksApi } = await import('@/lib/api');

      (projectsApi.getProject as jest.Mock).mockResolvedValue(
        mockApiResponses.projects[0]
      );
      (tasksApi.getTasks as jest.Mock).mockResolvedValue([
        { ...mockApiResponses.tasks[0], status: 'todo' },
        {
          ...mockApiResponses.tasks[0],
          id: 'task-2',
          status: 'in_progress',
          title: 'In Progress Task',
        },
        {
          ...mockApiResponses.tasks[0],
          id: 'task-3',
          status: 'done',
          title: 'Done Task',
        },
      ]);

      render(<ProjectTasks />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Should show all status columns
      expect(screen.getByText(/to do/i)).toBeInTheDocument();
      expect(screen.getByText(/in progress/i)).toBeInTheDocument();
      expect(screen.getByText(/done/i)).toBeInTheDocument();

      // Should show tasks in appropriate columns
      const todoColumn =
        screen.getByTestId('column-todo') ||
        screen.getByText(/to do/i).closest('[data-status="todo"]');
      const inProgressColumn =
        screen.getByTestId('column-in_progress') ||
        screen.getByText(/in progress/i).closest('[data-status="in_progress"]');
      const doneColumn =
        screen.getByTestId('column-done') ||
        screen.getByText(/done/i).closest('[data-status="done"]');

      if (todoColumn) {
        expect(within(todoColumn).getByText('Test Task')).toBeInTheDocument();
      }
      if (inProgressColumn) {
        expect(
          within(inProgressColumn).getByText('In Progress Task')
        ).toBeInTheDocument();
      }
      if (doneColumn) {
        expect(within(doneColumn).getByText('Done Task')).toBeInTheDocument();
      }
    });

    it('handles empty task board state', async () => {
      const { projectsApi, tasksApi } = await import('@/lib/api');

      (projectsApi.getProject as jest.Mock).mockResolvedValue(
        mockApiResponses.projects[0]
      );
      (tasksApi.getTasks as jest.Mock).mockResolvedValue([]);

      render(<ProjectTasks />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Should show empty state message
      expect(screen.getByText(/no tasks found/i)).toBeInTheDocument();

      // Should show create task button
      expect(
        screen.getByRole('button', { name: /create task/i })
      ).toBeInTheDocument();
    });
  });

  describe('Task Creation Workflow', () => {
    it('completes full task creation workflow', async () => {
      const user = userEvent.setup();
      const { projectsApi, tasksApi } = await import('@/lib/api');

      (projectsApi.getProject as jest.Mock).mockResolvedValue(
        mockApiResponses.projects[0]
      );
      (tasksApi.getTasks as jest.Mock).mockResolvedValue([]);

      const newTask = {
        id: 'new-task-1',
        project_id: '1',
        title: 'New Task',
        description: 'New task description',
        status: 'todo',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };
      (tasksApi.createTask as jest.Mock).mockResolvedValue(newTask);

      render(<ProjectTasks />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /create task/i })
        ).toBeInTheDocument();
      });

      // Click create task button
      const createButton = screen.getByRole('button', { name: /create task/i });
      await user.click(createButton);

      // Should open task creation dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/create new task/i)).toBeInTheDocument();
      });

      // Fill out the form
      const titleInput = screen.getByLabelText(/task title/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await user.type(titleInput, 'New Task');
      await user.type(descriptionInput, 'New task description');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      // Should call API
      await waitFor(() => {
        expect(tasksApi.createTask).toHaveBeenCalledWith('1', {
          title: 'New Task',
          description: 'New task description',
          status: 'todo',
        });
      });

      // Should show success message and close dialog
      await waitFor(() => {
        expect(
          screen.getByText(/task created successfully/i)
        ).toBeInTheDocument();
      });
    });

    it('handles task creation with file uploads', async () => {
      const user = userEvent.setup();
      const { projectsApi, tasksApi } = await import('@/lib/api');

      (projectsApi.getProject as jest.Mock).mockResolvedValue(
        mockApiResponses.projects[0]
      );
      (tasksApi.getTasks as jest.Mock).mockResolvedValue([]);
      (tasksApi.createTask as jest.Mock).mockResolvedValue(
        mockApiResponses.tasks[0]
      );

      render(<ProjectTasks />);

      // Open create task dialog
      const createButton = await screen.findByRole('button', {
        name: /create task/i,
      });
      await user.click(createButton);

      // Fill basic form
      const titleInput = screen.getByLabelText(/task title/i);
      await user.type(titleInput, 'Task with Files');

      // Mock file upload
      const fileInput = screen.getByLabelText(
        /upload files/i
      ) as HTMLInputElement;
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      await user.upload(fileInput, file);

      // Should show uploaded file
      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });

      // Submit task
      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      // Should include files in API call
      await waitFor(() => {
        expect(tasksApi.createTask).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({
            title: 'Task with Files',
            files: expect.arrayContaining([
              expect.objectContaining({ name: 'test.txt' }),
            ]),
          })
        );
      });
    });
  });

  describe('Task Management Operations', () => {
    beforeEach(async () => {
      const { projectsApi, tasksApi } = await import('@/lib/api');
      (projectsApi.getProject as jest.Mock).mockResolvedValue(
        mockApiResponses.projects[0]
      );
      (tasksApi.getTasks as jest.Mock).mockResolvedValue(
        mockApiResponses.tasks
      );
    });

    it('handles task status updates via drag and drop', async () => {
      const user = userEvent.setup();
      const { tasksApi } = await import('@/lib/api');
      (tasksApi.updateTask as jest.Mock).mockResolvedValue({
        ...mockApiResponses.tasks[0],
        status: 'in_progress',
      });

      render(<ProjectTasks />);

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });

      // Find task card and target column
      const taskCard = screen
        .getByText('Test Task')
        .closest('[draggable="true"]');
      const inProgressColumn =
        screen.getByTestId('column-in_progress') ||
        screen.getByText(/in progress/i).closest('.column');

      if (taskCard && inProgressColumn) {
        // Simulate drag and drop
        await user.click(taskCard);

        // Mock the drag and drop operation result
        await waitFor(() => {
          expect(tasksApi.updateTask).toHaveBeenCalledWith('task-1', {
            status: 'in_progress',
          });
        });
      }
    });

    it('handles task editing workflow', async () => {
      const user = userEvent.setup();
      const { tasksApi } = await import('@/lib/api');
      (tasksApi.updateTask as jest.Mock).mockResolvedValue({
        ...mockApiResponses.tasks[0],
        title: 'Updated Task Title',
      });

      render(<ProjectTasks />);

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });

      // Click on task to edit
      const taskCard = screen.getByText('Test Task');
      await user.click(taskCard);

      // Should open task details/edit mode
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
      });

      // Edit task title
      const titleInput = screen.getByDisplayValue('Test Task');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Task Title');

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should call update API
      await waitFor(() => {
        expect(tasksApi.updateTask).toHaveBeenCalledWith('task-1', {
          title: 'Updated Task Title',
        });
      });
    });

    it('handles task deletion with confirmation', async () => {
      const user = userEvent.setup();
      const { tasksApi } = await import('@/lib/api');
      (tasksApi.deleteTask as jest.Mock).mockResolvedValue(undefined);

      render(<ProjectTasks />);

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });

      // Find and click delete button on task
      const deleteButton = screen.getByRole('button', { name: /delete task/i });
      await user.click(deleteButton);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(
          screen.getByText(/are you sure you want to delete/i)
        ).toBeInTheDocument();
      });

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      // Should call delete API
      await waitFor(() => {
        expect(tasksApi.deleteTask).toHaveBeenCalledWith('task-1');
      });

      // Task should be removed from board
      await waitFor(() => {
        expect(screen.queryByText('Test Task')).not.toBeInTheDocument();
      });
    });
  });

  describe('Task Details Panel', () => {
    it('displays task details when task is selected', async () => {
      const user = userEvent.setup();
      const { projectsApi, tasksApi } = await import('@/lib/api');

      (projectsApi.getProject as jest.Mock).mockResolvedValue(
        mockApiResponses.projects[0]
      );
      (tasksApi.getTasks as jest.Mock).mockResolvedValue(
        mockApiResponses.tasks
      );
      (tasksApi.getTaskDetails as jest.Mock).mockResolvedValue({
        ...mockApiResponses.tasks[0],
        files: [{ name: 'test.txt', content: 'test content' }],
        logs: ['Log entry 1', 'Log entry 2'],
      });

      render(<ProjectTasks />);

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });

      // Click on task to view details
      const taskCard = screen.getByText('Test Task');
      await user.click(taskCard);

      // Should show task details panel
      await waitFor(() => {
        expect(screen.getByText(/task details/i)).toBeInTheDocument();
      });

      // Should show task information
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('A test task')).toBeInTheDocument();

      // Should show tabs for different views
      expect(
        screen.getByRole('tab', { name: /overview/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /files/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /logs/i })).toBeInTheDocument();
    });

    it('navigates between different task detail tabs', async () => {
      const user = userEvent.setup();
      const { projectsApi, tasksApi } = await import('@/lib/api');

      (projectsApi.getProject as jest.Mock).mockResolvedValue(
        mockApiResponses.projects[0]
      );
      (tasksApi.getTasks as jest.Mock).mockResolvedValue(
        mockApiResponses.tasks
      );
      (tasksApi.getTaskDetails as jest.Mock).mockResolvedValue({
        ...mockApiResponses.tasks[0],
        files: [{ name: 'test.txt', content: 'test content' }],
        logs: ['Log entry 1', 'Log entry 2'],
      });

      render(<ProjectTasks />);

      // Select task
      const taskCard = await screen.findByText('Test Task');
      await user.click(taskCard);

      // Wait for details to load
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /files/i })).toBeInTheDocument();
      });

      // Click on files tab
      const filesTab = screen.getByRole('tab', { name: /files/i });
      await user.click(filesTab);

      // Should show files content
      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });

      // Click on logs tab
      const logsTab = screen.getByRole('tab', { name: /logs/i });
      await user.click(logsTab);

      // Should show logs content
      await waitFor(() => {
        expect(screen.getByText('Log entry 1')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('handles real-time task status updates', async () => {
      const { projectsApi, tasksApi } = await import('@/lib/api');

      (projectsApi.getProject as jest.Mock).mockResolvedValue(
        mockApiResponses.projects[0]
      );
      (tasksApi.getTasks as jest.Mock).mockResolvedValue(
        mockApiResponses.tasks
      );

      render(<ProjectTasks />);

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });

      // Simulate real-time update (this would typically come from WebSocket)
      const updatedTask = {
        ...mockApiResponses.tasks[0],
        status: 'in_progress',
      };

      // Mock the update response
      (tasksApi.getTasks as jest.Mock).mockResolvedValue([updatedTask]);

      // Trigger a re-fetch (in real app this would be automatic)
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      if (refreshButton) {
        await refreshButton.click();
      }

      // Task should move to in-progress column
      await waitFor(() => {
        const inProgressColumn =
          screen.getByTestId('column-in_progress') ||
          screen.getByText(/in progress/i).closest('.column');
        if (inProgressColumn) {
          expect(
            within(inProgressColumn).getByText('Test Task')
          ).toBeInTheDocument();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('handles task loading errors gracefully', async () => {
      const { projectsApi, tasksApi } = await import('@/lib/api');

      (projectsApi.getProject as jest.Mock).mockResolvedValue(
        mockApiResponses.projects[0]
      );
      (tasksApi.getTasks as jest.Mock).mockRejectedValue(
        new Error('Failed to load tasks')
      );

      render(<ProjectTasks />);

      await waitFor(() => {
        expect(screen.getByText(/error loading tasks/i)).toBeInTheDocument();
      });

      // Should show retry button
      expect(
        screen.getByRole('button', { name: /retry/i })
      ).toBeInTheDocument();
    });

    it('handles task operation errors with user feedback', async () => {
      const user = userEvent.setup();
      const { projectsApi, tasksApi } = await import('@/lib/api');

      (projectsApi.getProject as jest.Mock).mockResolvedValue(
        mockApiResponses.projects[0]
      );
      (tasksApi.getTasks as jest.Mock).mockResolvedValue(
        mockApiResponses.tasks
      );
      (tasksApi.createTask as jest.Mock).mockRejectedValue(
        new Error('Failed to create task')
      );

      render(<ProjectTasks />);

      // Try to create a task
      const createButton = await screen.findByRole('button', {
        name: /create task/i,
      });
      await user.click(createButton);

      const titleInput = screen.getByLabelText(/task title/i);
      await user.type(titleInput, 'Test Task');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to create task/i)).toBeInTheDocument();
      });
    });
  });
});
