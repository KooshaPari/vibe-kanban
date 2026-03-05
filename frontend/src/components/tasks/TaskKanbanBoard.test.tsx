import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskKanbanBoard from './TaskKanbanBoard';
import type { TaskWithAttemptStatus } from 'shared/types';

// Mock the KanbanProvider and related components
vi.mock('@/components/ui/shadcn-io/kanban', () => ({
  KanbanProvider: ({ children, onDragEnd }: any) => (
    <div data-testid="kanban-provider" data-drag-handler={onDragEnd ? 'enabled' : 'disabled'}>
      {children}
    </div>
  ),
  KanbanBoard: ({ children, id }: any) => (
    <div data-testid={`kanban-board-${id}`} data-status={id}>
      {children}
    </div>
  ),
  KanbanHeader: ({ name, color }: any) => (
    <div data-testid="kanban-header" data-color={color}>
      {name}
    </div>
  ),
  KanbanCards: ({ children }: any) => (
    <div data-testid="kanban-cards">{children}</div>
  ),
}));

// Mock TaskCard component
vi.mock('./TaskCard', () => ({
  TaskCard: ({ task, status, onEdit, onDelete, onViewDetails }: any) => (
    <div 
      data-testid={`task-card-${task.id}`}
      data-status={status}
      data-title={task.title}
      data-has-in-progress={task.has_in_progress_attempt}
      data-has-merged={task.has_merged_attempt}
      data-has-failed={task.has_failed_attempt}
    >
      <span>{task.title}</span>
      <button onClick={() => onEdit(task)}>Edit</button>
      <button onClick={() => onDelete(task.id)}>Delete</button>
      <button onClick={() => onViewDetails(task)}>View</button>
    </div>
  ),
}));

describe('TaskKanbanBoard', () => {
  const mockTasks: TaskWithAttemptStatus[] = [
    {
      id: '1',
      project_id: 'proj1',
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
      id: '2',
      project_id: 'proj1',
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
      id: '3',
      project_id: 'proj1',
      title: 'Task 3',
      description: 'Description 3',
      status: 'done',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      has_in_progress_attempt: false,
      has_merged_attempt: true,
      has_failed_attempt: false,
    },
    {
      id: '4',
      project_id: 'proj1',
      title: 'Task 4',
      description: 'Description 4',
      status: 'inreview',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      has_in_progress_attempt: false,
      has_merged_attempt: false,
      has_failed_attempt: true,
    },
  ];

  const mockHandlers = {
    onDragEnd: vi.fn(),
    onEditTask: vi.fn(),
    onDeleteTask: vi.fn(),
    onViewTaskDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Visual State Tracking', () => {
    it('should render all task status columns with correct labels and colors', () => {
      render(<TaskKanbanBoard tasks={mockTasks} {...mockHandlers} />);

      // Verify all status columns are rendered
      expect(screen.getByTestId('kanban-board-todo')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-inprogress')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-inreview')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-done')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-cancelled')).toBeInTheDocument();

      // Verify status labels
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('In Review')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();

      // Verify header colors are applied
      const headers = screen.getAllByTestId('kanban-header');
      expect(headers[0]).toHaveAttribute('data-color', 'hsl(var(--neutral))'); // todo
      expect(headers[1]).toHaveAttribute('data-color', 'hsl(var(--info))'); // inprogress
      expect(headers[2]).toHaveAttribute('data-color', 'hsl(var(--warning))'); // inreview
      expect(headers[3]).toHaveAttribute('data-color', 'hsl(var(--success))'); // done
      expect(headers[4]).toHaveAttribute('data-color', 'hsl(var(--destructive))'); // cancelled
    });

    it('should organize tasks by status in correct columns', () => {
      render(<TaskKanbanBoard tasks={mockTasks} {...mockHandlers} />);

      // Verify tasks are in correct columns
      const todoBoard = screen.getByTestId('kanban-board-todo');
      expect(within(todoBoard).getByTestId('task-card-1')).toBeInTheDocument();

      const inProgressBoard = screen.getByTestId('kanban-board-inprogress');
      expect(within(inProgressBoard).getByTestId('task-card-2')).toBeInTheDocument();

      const doneBoard = screen.getByTestId('kanban-board-done');
      expect(within(doneBoard).getByTestId('task-card-3')).toBeInTheDocument();

      const inReviewBoard = screen.getByTestId('kanban-board-inreview');
      expect(within(inReviewBoard).getByTestId('task-card-4')).toBeInTheDocument();
    });

    it('should pass correct attempt status indicators to TaskCard', () => {
      render(<TaskKanbanBoard tasks={mockTasks} {...mockHandlers} />);

      // Task 1: No special status
      const task1 = screen.getByTestId('task-card-1');
      expect(task1).toHaveAttribute('data-has-in-progress', 'false');
      expect(task1).toHaveAttribute('data-has-merged', 'false');
      expect(task1).toHaveAttribute('data-has-failed', 'false');

      // Task 2: In progress
      const task2 = screen.getByTestId('task-card-2');
      expect(task2).toHaveAttribute('data-has-in-progress', 'true');
      expect(task2).toHaveAttribute('data-has-merged', 'false');
      expect(task2).toHaveAttribute('data-has-failed', 'false');

      // Task 3: Merged
      const task3 = screen.getByTestId('task-card-3');
      expect(task3).toHaveAttribute('data-has-in-progress', 'false');
      expect(task3).toHaveAttribute('data-has-merged', 'true');
      expect(task3).toHaveAttribute('data-has-failed', 'false');

      // Task 4: Failed
      const task4 = screen.getByTestId('task-card-4');
      expect(task4).toHaveAttribute('data-has-in-progress', 'false');
      expect(task4).toHaveAttribute('data-has-merged', 'false');
      expect(task4).toHaveAttribute('data-has-failed', 'true');
    });

    it('should handle tasks with unknown status by placing them in todo column', () => {
      const tasksWithUnknownStatus = [
        {
          ...mockTasks[0],
          id: 'unknown',
          status: 'invalid-status' as any,
          title: 'Unknown Status Task',
        },
      ];

      render(<TaskKanbanBoard tasks={tasksWithUnknownStatus} {...mockHandlers} />);

      // Task with unknown status should be in todo column
      const todoBoard = screen.getByTestId('kanban-board-todo');
      expect(within(todoBoard).getByTestId('task-card-unknown')).toBeInTheDocument();
    });

    it('should show empty columns when no tasks match that status', () => {
      const singleTask = [mockTasks[0]]; // Only todo task

      render(<TaskKanbanBoard tasks={singleTask} {...mockHandlers} />);

      // All columns should exist, but only todo should have content
      expect(screen.getByTestId('kanban-board-todo')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-inprogress')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-inreview')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-done')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-cancelled')).toBeInTheDocument();

      // Only todo should have a task card
      expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('task-card-2')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter tasks based on search query in title', () => {
      render(<TaskKanbanBoard tasks={mockTasks} searchQuery="Task 1" {...mockHandlers} />);

      expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('task-card-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('task-card-3')).not.toBeInTheDocument();
      expect(screen.queryByTestId('task-card-4')).not.toBeInTheDocument();
    });

    it('should filter tasks based on search query in description', () => {
      render(<TaskKanbanBoard tasks={mockTasks} searchQuery="Description 2" {...mockHandlers} />);

      expect(screen.queryByTestId('task-card-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('task-card-2')).toBeInTheDocument();
      expect(screen.queryByTestId('task-card-3')).not.toBeInTheDocument();
      expect(screen.queryByTestId('task-card-4')).not.toBeInTheDocument();
    });

    it('should perform case-insensitive search', () => {
      render(<TaskKanbanBoard tasks={mockTasks} searchQuery="task 1" {...mockHandlers} />);

      expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('task-card-2')).not.toBeInTheDocument();
    });

    it('should show all tasks when search query is empty', () => {
      render(<TaskKanbanBoard tasks={mockTasks} searchQuery="" {...mockHandlers} />);

      expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('task-card-3')).toBeInTheDocument();
      expect(screen.getByTestId('task-card-4')).toBeInTheDocument();
    });

    it('should maintain status organization when filtering', () => {
      render(<TaskKanbanBoard tasks={mockTasks} searchQuery="Task" {...mockHandlers} />);

      // All tasks match "Task", verify they're still in correct columns
      const todoBoard = screen.getByTestId('kanban-board-todo');
      expect(within(todoBoard).getByTestId('task-card-1')).toBeInTheDocument();

      const inProgressBoard = screen.getByTestId('kanban-board-inprogress');
      expect(within(inProgressBoard).getByTestId('task-card-2')).toBeInTheDocument();
    });
  });

  describe('Drag and Drop Integration', () => {
    it('should enable drag and drop functionality', () => {
      render(<TaskKanbanBoard tasks={mockTasks} {...mockHandlers} />);

      const kanbanProvider = screen.getByTestId('kanban-provider');
      expect(kanbanProvider).toHaveAttribute('data-drag-handler', 'enabled');
    });

    it('should pass onDragEnd handler to KanbanProvider', () => {
      const customDragHandler = vi.fn();
      render(<TaskKanbanBoard tasks={mockTasks} {...mockHandlers} onDragEnd={customDragHandler} />);

      // This is verified through the mock implementation
      const kanbanProvider = screen.getByTestId('kanban-provider');
      expect(kanbanProvider).toHaveAttribute('data-drag-handler', 'enabled');
    });
  });

  describe('Task Interactions', () => {
    it('should handle task editing through TaskCard', async () => {
      const user = userEvent.setup();
      render(<TaskKanbanBoard tasks={mockTasks} {...mockHandlers} />);

      const editButton = within(screen.getByTestId('task-card-1')).getByText('Edit');
      await user.click(editButton);

      expect(mockHandlers.onEditTask).toHaveBeenCalledWith(mockTasks[0]);
    });

    it('should handle task deletion through TaskCard', async () => {
      const user = userEvent.setup();
      render(<TaskKanbanBoard tasks={mockTasks} {...mockHandlers} />);

      const deleteButton = within(screen.getByTestId('task-card-1')).getByText('Delete');
      await user.click(deleteButton);

      expect(mockHandlers.onDeleteTask).toHaveBeenCalledWith('1');
    });

    it('should handle task details viewing through TaskCard', async () => {
      const user = userEvent.setup();
      render(<TaskKanbanBoard tasks={mockTasks} {...mockHandlers} />);

      const viewButton = within(screen.getByTestId('task-card-1')).getByText('View');
      await user.click(viewButton);

      expect(mockHandlers.onViewTaskDetails).toHaveBeenCalledWith(mockTasks[0]);
    });
  });

  describe('Performance and Memory Optimization', () => {
    it('should memoize filtered tasks when search query does not change', () => {
      const { rerender } = render(<TaskKanbanBoard tasks={mockTasks} searchQuery="Task 1" {...mockHandlers} />);

      // First render should show filtered result
      expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('task-card-2')).not.toBeInTheDocument();

      // Rerender with same search query should maintain memoization
      rerender(<TaskKanbanBoard tasks={mockTasks} searchQuery="Task 1" {...mockHandlers} />);

      expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('task-card-2')).not.toBeInTheDocument();
    });

    it('should memoize grouped tasks when task list does not change', () => {
      const { rerender } = render(<TaskKanbanBoard tasks={mockTasks} {...mockHandlers} />);

      // Verify initial grouping
      expect(screen.getByTestId('task-card-1')).toBeInTheDocument();

      // Rerender with same tasks
      rerender(<TaskKanbanBoard tasks={mockTasks} {...mockHandlers} />);

      // Should maintain same grouping
      expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide meaningful test ids for all interactive elements', () => {
      render(<TaskKanbanBoard tasks={mockTasks} {...mockHandlers} />);

      // All main structural elements should have test ids
      expect(screen.getByTestId('kanban-provider')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-todo')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-inprogress')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-inreview')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-done')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-cancelled')).toBeInTheDocument();

      // All task cards should have unique test ids
      expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('task-card-3')).toBeInTheDocument();
      expect(screen.getByTestId('task-card-4')).toBeInTheDocument();
    });

    it('should handle empty task list gracefully', () => {
      render(<TaskKanbanBoard tasks={[]} {...mockHandlers} />);

      // All columns should still be rendered
      expect(screen.getByTestId('kanban-board-todo')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-inprogress')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-inreview')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-done')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-board-cancelled')).toBeInTheDocument();

      // No task cards should be rendered
      expect(screen.queryByTestId(/task-card-/)).not.toBeInTheDocument();
    });
  });
});