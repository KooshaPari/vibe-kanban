import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ProjectTasks } from './project-tasks';
import { projectsApi, tasksApi } from '@/lib/api';
import type { ProjectWithBranch, TaskWithAttemptStatus } from 'shared/types';

// Mock the API modules
vi.mock('@/lib/api', () => ({
  projectsApi: {
    getWithBranch: vi.fn(),
    openEditor: vi.fn(),
  },
  tasksApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    createAndStart: vi.fn(),
  },
}));

// Mock keyboard shortcuts
vi.mock('@/lib/keyboard-shortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

// Mock responsive config
vi.mock('@/lib/responsive-config', () => ({
  getKanbanSectionClasses: vi.fn(() => 'kanban-section-mock'),
  getMainContainerClasses: vi.fn(() => 'main-container-mock'),
}));

// Mock components
vi.mock('@/components/tasks/TaskKanbanBoard', () => ({
  default: ({ tasks, searchQuery, onEditTask, onDeleteTask, onViewTaskDetails }: any) => (
    <div data-testid="task-kanban-board">
      <div data-testid="search-query">{searchQuery}</div>
      <div data-testid="task-count">{tasks.length}</div>
      {tasks.map((task: any) => (
        <div key={task.id} data-testid={`board-task-${task.id}`}>
          <span>{task.title}</span>
          <button onClick={() => onEditTask(task)}>Edit</button>
          <button onClick={() => onDeleteTask(task.id)}>Delete</button>
          <button onClick={() => onViewTaskDetails(task)}>View</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/tasks/TaskDetailsPanel', () => ({
  TaskDetailsPanel: ({ task, isOpen, onClose }: any) => (
    <div 
      data-testid="task-details-panel" 
      data-open={isOpen}
      data-task-id={task?.id || 'none'}
    >
      {isOpen && task && (
        <div>
          <h3>{task.title}</h3>
          <button onClick={onClose}>Close Panel</button>
        </div>
      )}
    </div>
  ),
}));

vi.mock('@/components/tasks/TaskFormDialog', () => ({
  TaskFormDialog: ({ open, task, onClose, onSubmit }: any) => (
    <div data-testid="task-form-dialog" data-open={open}>
      {open && (
        <div>
          <h3>{task ? 'Edit Task' : 'Create Task'}</h3>
          <button onClick={() => onSubmit({ title: 'New Task', description: 'New Description' })}>
            Submit
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      )}
    </div>
  ),
}));

vi.mock('@/components/projects/project-form', () => ({
  ProjectForm: ({ open, onClose }: any) => (
    <div data-testid="project-form" data-open={open}>
      {open && <button onClick={onClose}>Close Settings</button>}
    </div>
  ),
}));

describe('ProjectTasks - State Tracking', () => {
  const mockProject: ProjectWithBranch = {
    id: 'proj-1',
    name: 'Test Project',
    git_repo_path: '/path/to/repo',
    setup_script: null,
    dev_script: null,
    current_branch: 'main',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  const mockTasks: TaskWithAttemptStatus[] = [
    {
      id: 'task-1',
      project_id: 'proj-1',
      title: 'Task 1',
      description: 'Description 1',
      status: 'todo',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      has_in_progress_attempt: false,
      has_merged_attempt: false,
      has_failed_attempt: false,
    },
    {
      id: 'task-2',
      project_id: 'proj-1',
      title: 'Task 2',
      description: 'Description 2',
      status: 'inprogress',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      has_in_progress_attempt: true,
      has_merged_attempt: false,
      has_failed_attempt: false,
    },
    {
      id: 'task-3',
      project_id: 'proj-1',
      title: 'Task 3',
      description: 'Description 3',
      status: 'done',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      has_in_progress_attempt: false,
      has_merged_attempt: true,
      has_failed_attempt: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Setup default API responses
    (projectsApi.getWithBranch as any).mockResolvedValue(mockProject);
    (tasksApi.getAll as any).mockResolvedValue(mockTasks);
    (tasksApi.create as any).mockResolvedValue(mockTasks[0]);
    (tasksApi.createAndStart as any).mockResolvedValue(mockTasks[0]);
    (tasksApi.update as any).mockResolvedValue(mockTasks[0]);
    (tasksApi.delete as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderProjectTasks = (initialPath = '/projects/proj-1/tasks') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <ProjectTasks />
      </MemoryRouter>
    );
  };

  describe('Initial State Loading', () => {
    it('should load project and tasks on mount', async () => {
      renderProjectTasks();

      // Should show loading initially
      expect(screen.getByTestId('loader')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Verify API calls were made
      expect(projectsApi.getWithBranch).toHaveBeenCalledWith('proj-1');
      expect(tasksApi.getAll).toHaveBeenCalledWith('proj-1');

      // Verify tasks are displayed
      await waitFor(() => {
        expect(screen.getByTestId('task-count')).toHaveTextContent('3');
      });
    });

    it('should handle project loading errors', async () => {
      (projectsApi.getWithBranch as any).mockRejectedValue(new Error('Failed to load'));

      renderProjectTasks();

      await waitFor(() => {
        expect(screen.getByText(/failed to load project/i)).toBeInTheDocument();
      });
    });

    it('should handle tasks loading errors', async () => {
      (tasksApi.getAll as any).mockRejectedValue(new Error('Failed to load tasks'));

      renderProjectTasks();

      await waitFor(() => {
        expect(screen.getByText(/failed to load tasks/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time State Updates', () => {
    it('should poll for task updates every 2 seconds', async () => {
      renderProjectTasks();

      await waitFor(() => {
        expect(tasksApi.getAll).toHaveBeenCalledTimes(1);
      });

      // Advance timer by 2 seconds
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(tasksApi.getAll).toHaveBeenCalledTimes(2);
      });

      // Advance another 2 seconds
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(tasksApi.getAll).toHaveBeenCalledTimes(3);
      });
    });

    it('should update task status indicators in real-time', async () => {
      // Start with initial tasks
      renderProjectTasks();

      await waitFor(() => {
        expect(screen.getByTestId('task-count')).toHaveTextContent('3');
      });

      // Mock updated tasks with changed states
      const updatedTasks = [
        ...mockTasks.slice(0, 1),
        {
          ...mockTasks[1],
          has_in_progress_attempt: false,
          has_merged_attempt: true,
          status: 'done' as const,
        },
        ...mockTasks.slice(2),
      ];

      (tasksApi.getAll as any).mockResolvedValue(updatedTasks);

      // Advance timer to trigger polling
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(tasksApi.getAll).toHaveBeenCalledWith('proj-1');
      });

      // Should reflect updated state
      expect(screen.getByTestId('task-count')).toHaveTextContent('3');
    });

    it('should cleanup polling interval on unmount', async () => {
      const { unmount } = renderProjectTasks();

      await waitFor(() => {
        expect(tasksApi.getAll).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Advance timer after unmount
      vi.advanceTimersByTime(4000);

      // Should not make additional calls
      expect(tasksApi.getAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('Search and Filtering State', () => {
    it('should track search query state and pass to kanban board', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProjectTasks();

      await waitFor(() => {
        expect(screen.getByTestId('task-kanban-board')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.type(searchInput, 'Task 1');

      expect(screen.getByTestId('search-query')).toHaveTextContent('Task 1');
    });

    it('should clear search when input is cleared', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProjectTasks();

      await waitFor(() => {
        expect(screen.getByTestId('task-kanban-board')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.type(searchInput, 'Task 1');
      await user.clear(searchInput);

      expect(screen.getByTestId('search-query')).toHaveTextContent('');
    });
  });

  describe('Task Details Panel State', () => {
    it('should open task details panel when task is selected from URL', async () => {
      renderProjectTasks('/projects/proj-1/tasks/task-1');

      await waitFor(() => {
        expect(screen.getByTestId('task-details-panel')).toHaveAttribute('data-open', 'true');
        expect(screen.getByTestId('task-details-panel')).toHaveAttribute('data-task-id', 'task-1');
      });
    });

    it('should close task details panel when navigating away from task URL', async () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/projects/proj-1/tasks/task-1']}>
          <ProjectTasks />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('task-details-panel')).toHaveAttribute('data-open', 'true');
      });

      // Navigate away from specific task
      rerender(
        <MemoryRouter initialEntries={['/projects/proj-1/tasks']}>
          <ProjectTasks />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('task-details-panel')).toHaveAttribute('data-open', 'false');
      });
    });

    it('should handle clicking on task to open details panel', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProjectTasks();

      await waitFor(() => {
        expect(screen.getByTestId('board-task-task-1')).toBeInTheDocument();
      });

      const viewButton = within(screen.getByTestId('board-task-task-1')).getByText('View');
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByTestId('task-details-panel')).toHaveAttribute('data-open', 'true');
        expect(screen.getByTestId('task-details-panel')).toHaveAttribute('data-task-id', 'task-1');
      });
    });
  });

  describe('Task CRUD Operations State', () => {
    it('should open task creation dialog', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProjectTasks();

      await waitFor(() => {
        expect(screen.getByTestId('task-form-dialog')).toBeInTheDocument();
      });

      const createButton = screen.getByText(/create task/i);
      await user.click(createButton);

      expect(screen.getByTestId('task-form-dialog')).toHaveAttribute('data-open', 'true');
      expect(screen.getByText('Create Task')).toBeInTheDocument();
    });

    it('should handle task creation and update state', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const newTask = {
        id: 'task-4',
        project_id: 'proj-1',
        title: 'New Task',
        description: 'New Description',
        status: 'todo' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        has_in_progress_attempt: false,
        has_merged_attempt: false,
        has_failed_attempt: false,
      };

      (tasksApi.create as any).mockResolvedValue(newTask);
      (tasksApi.getAll as any).mockResolvedValue([...mockTasks, newTask]);

      renderProjectTasks();

      await waitFor(() => {
        expect(screen.getByText(/create task/i)).toBeInTheDocument();
      });

      const createButton = screen.getByText(/create task/i);
      await user.click(createButton);

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(tasksApi.create).toHaveBeenCalledWith({
          project_id: 'proj-1',
          title: 'New Task',
          description: 'New Description',
        });
      });
    });

    it('should handle task editing state', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProjectTasks();

      await waitFor(() => {
        expect(screen.getByTestId('board-task-task-1')).toBeInTheDocument();
      });

      const editButton = within(screen.getByTestId('board-task-task-1')).getByText('Edit');
      await user.click(editButton);

      expect(screen.getByTestId('task-form-dialog')).toHaveAttribute('data-open', 'true');
      expect(screen.getByText('Edit Task')).toBeInTheDocument();
    });

    it('should handle task deletion and update state', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const remainingTasks = mockTasks.slice(1);
      
      (tasksApi.getAll as any).mockResolvedValue(remainingTasks);

      renderProjectTasks();

      await waitFor(() => {
        expect(screen.getByTestId('board-task-task-1')).toBeInTheDocument();
      });

      const deleteButton = within(screen.getByTestId('board-task-task-1')).getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(tasksApi.delete).toHaveBeenCalledWith('task-1');
      });
    });
  });

  describe('Project State Management', () => {
    it('should display current project branch information', async () => {
      renderProjectTasks();

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Check that branch info is displayed (implementation may vary)
      expect(screen.getByText(/main/i)).toBeInTheDocument();
    });

    it('should handle opening project in IDE', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProjectTasks();

      await waitFor(() => {
        expect(screen.getByTestId('open-ide-button')).toBeInTheDocument();
      });

      const openIdeButton = screen.getByTestId('open-ide-button');
      await user.click(openIdeButton);

      await waitFor(() => {
        expect(projectsApi.openEditor).toHaveBeenCalledWith('proj-1');
      });
    });

    it('should handle project settings dialog state', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProjectTasks();

      await waitFor(() => {
        expect(screen.getByTestId('settings-button')).toBeInTheDocument();
      });

      const settingsButton = screen.getByTestId('settings-button');
      await user.click(settingsButton);

      expect(screen.getByTestId('project-form')).toHaveAttribute('data-open', 'true');
    });
  });

  describe('Error State Management', () => {
    it('should display and clear error states', async () => {
      (projectsApi.openEditor as any).mockRejectedValue(new Error('IDE error'));
      
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProjectTasks();

      await waitFor(() => {
        expect(screen.getByTestId('open-ide-button')).toBeInTheDocument();
      });

      const openIdeButton = screen.getByTestId('open-ide-button');
      await user.click(openIdeButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to open project in ide/i)).toBeInTheDocument();
      });
    });

    it('should recover from transient errors during polling', async () => {
      renderProjectTasks();

      await waitFor(() => {
        expect(screen.getByTestId('task-count')).toHaveTextContent('3');
      });

      // Mock a temporary error
      (tasksApi.getAll as any).mockRejectedValueOnce(new Error('Temporary error'));

      vi.advanceTimersByTime(2000);

      // Should continue polling and recover
      (tasksApi.getAll as any).mockResolvedValue(mockTasks);

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByTestId('task-count')).toHaveTextContent('3');
      });
    });
  });
});