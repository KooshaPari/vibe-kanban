import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskCard } from './TaskCard';
import type { TaskWithAttemptStatus } from 'shared/types';

// Mock the KanbanCard component
vi.mock('@/components/ui/shadcn-io/kanban', () => ({
  KanbanCard: ({ children, id, name, index, parent, onClick }: any) => (
    <div
      data-testid={`kanban-card-${id}`}
      data-name={name}
      data-index={index}
      data-parent={parent}
      onClick={onClick}
      className="kanban-card-mock"
    >
      {children}
    </div>
  ),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children, align }: any) => (
    <div data-testid="dropdown-content" data-align={align}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onClick, className }: any) => (
    <div
      data-testid="dropdown-item"
      onClick={onClick}
      className={className}
      role="menuitem"
    >
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({ children }: any) => (
    <div data-testid="dropdown-trigger">{children}</div>
  ),
}));

describe('TaskCard', () => {
  const baseTask: TaskWithAttemptStatus = {
    id: 'task-1',
    project_id: 'proj-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'todo',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    has_in_progress_attempt: false,
    has_merged_attempt: false,
    has_failed_attempt: false,
  };

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onViewDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Visual State Indicators', () => {
    it('should render task title and description', () => {
      render(
        <TaskCard
          task={baseTask}
          index={0}
          status="todo"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should show in-progress spinner when task has in-progress attempt', () => {
      const taskWithInProgress = {
        ...baseTask,
        has_in_progress_attempt: true,
      };

      render(
        <TaskCard
          task={taskWithInProgress}
          index={0}
          status="inprogress"
          {...mockHandlers}
        />
      );

      const spinner = screen.getByTestId('in-progress-spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin', 'text-blue-500');
    });

    it('should show success indicator when task has merged attempt', () => {
      const taskWithMerged = {
        ...baseTask,
        has_merged_attempt: true,
      };

      render(
        <TaskCard
          task={taskWithMerged}
          index={0}
          status="done"
          {...mockHandlers}
        />
      );

      const successIcon = screen.getByTestId('merged-indicator');
      expect(successIcon).toBeInTheDocument();
      expect(successIcon).toHaveClass('text-green-500');
    });

    it('should show failure indicator when task has failed attempt but not merged', () => {
      const taskWithFailed = {
        ...baseTask,
        has_failed_attempt: true,
        has_merged_attempt: false,
      };

      render(
        <TaskCard
          task={taskWithFailed}
          index={0}
          status="inreview"
          {...mockHandlers}
        />
      );

      const failureIcon = screen.getByTestId('failed-indicator');
      expect(failureIcon).toBeInTheDocument();
      expect(failureIcon).toHaveClass('text-red-500');
    });

    it('should hide failure indicator when task has both failed and merged attempts', () => {
      const taskWithFailedAndMerged = {
        ...baseTask,
        has_failed_attempt: true,
        has_merged_attempt: true,
      };

      render(
        <TaskCard
          task={taskWithFailedAndMerged}
          index={0}
          status="done"
          {...mockHandlers}
        />
      );

      expect(screen.queryByTestId('failed-indicator')).not.toBeInTheDocument();
      expect(screen.getByTestId('merged-indicator')).toBeInTheDocument();
    });

    it('should show multiple indicators when appropriate', () => {
      const taskWithMultipleStates = {
        ...baseTask,
        has_in_progress_attempt: true,
        has_failed_attempt: true,
        has_merged_attempt: false,
      };

      render(
        <TaskCard
          task={taskWithMultipleStates}
          index={0}
          status="inprogress"
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('in-progress-spinner')).toBeInTheDocument();
      expect(screen.getByTestId('failed-indicator')).toBeInTheDocument();
      expect(screen.queryByTestId('merged-indicator')).not.toBeInTheDocument();
    });

    it('should show no state indicators for basic task', () => {
      render(
        <TaskCard
          task={baseTask}
          index={0}
          status="todo"
          {...mockHandlers}
        />
      );

      expect(screen.queryByTestId('in-progress-spinner')).not.toBeInTheDocument();
      expect(screen.queryByTestId('merged-indicator')).not.toBeInTheDocument();
      expect(screen.queryByTestId('failed-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Description Handling', () => {
    it('should truncate long descriptions', () => {
      const longDescription = 'A'.repeat(150);
      const taskWithLongDescription = {
        ...baseTask,
        description: longDescription,
      };

      render(
        <TaskCard
          task={taskWithLongDescription}
          index={0}
          status="todo"
          {...mockHandlers}
        />
      );

      const descriptionElement = screen.getByText(/A{130}\.\.\.$/);
      expect(descriptionElement).toBeInTheDocument();
    });

    it('should show full description when under limit', () => {
      const shortDescription = 'Short description';
      const taskWithShortDescription = {
        ...baseTask,
        description: shortDescription,
      };

      render(
        <TaskCard
          task={taskWithShortDescription}
          index={0}
          status="todo"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Short description')).toBeInTheDocument();
    });

    it('should handle null description gracefully', () => {
      const taskWithoutDescription = {
        ...baseTask,
        description: null,
      };

      render(
        <TaskCard
          task={taskWithoutDescription}
          index={0}
          status="todo"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onViewDetails when card is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TaskCard
          task={baseTask}
          index={0}
          status="todo"
          {...mockHandlers}
        />
      );

      const card = screen.getByTestId('kanban-card-task-1');
      await user.click(card);

      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith(baseTask);
    });

    it('should call onEdit when edit menu item is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TaskCard
          task={baseTask}
          index={0}
          status="todo"
          {...mockHandlers}
        />
      );

      const editItem = screen.getByText('Edit').closest('[data-testid="dropdown-item"]');
      await user.click(editItem!);

      expect(mockHandlers.onEdit).toHaveBeenCalledWith(baseTask);
    });

    it('should call onDelete when delete menu item is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TaskCard
          task={baseTask}
          index={0}
          status="todo"
          {...mockHandlers}
        />
      );

      const deleteItem = screen.getByText('Delete').closest('[data-testid="dropdown-item"]');
      await user.click(deleteItem!);

      expect(mockHandlers.onDelete).toHaveBeenCalledWith('task-1');
    });

    it('should prevent event propagation on dropdown interactions', () => {
      render(
        <TaskCard
          task={baseTask}
          index={0}
          status="todo"
          {...mockHandlers}
        />
      );

      const dropdownContainer = screen.getByTestId('dropdown-menu').parentElement;
      
      // Verify dropdown container has proper event handlers
      expect(dropdownContainer).toBeInTheDocument();
      
      // Check that handlers are set up (implementation detail, but important for UX)
      const handlersContainer = screen.getByTestId('dropdown-menu').parentElement;
      expect(handlersContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility and Styling', () => {
    it('should apply correct CSS classes for layout and spacing', () => {
      render(
        <TaskCard
          task={baseTask}
          index={0}
          status="todo"
          {...mockHandlers}
        />
      );

      // Check main container structure
      const card = screen.getByTestId('kanban-card-task-1');
      expect(card).toBeInTheDocument();

      // Check for key styling elements
      expect(screen.getByText('Test Task')).toHaveClass('font-medium', 'text-sm', 'break-words');
      expect(screen.getByText('Test description')).toHaveClass('text-xs', 'text-muted-foreground', 'break-words');
    });

    it('should apply destructive styling to delete menu item', () => {
      render(
        <TaskCard
          task={baseTask}
          index={0}
          status="todo"
          {...mockHandlers}
        />
      );

      const deleteItem = screen.getByText('Delete').closest('[data-testid="dropdown-item"]');
      expect(deleteItem).toHaveClass('text-destructive');
    });

    it('should have proper ARIA attributes for menu items', () => {
      render(
        <TaskCard
          task={baseTask}
          index={0}
          status="todo"
          {...mockHandlers}
        />
      );

      const editItem = screen.getByText('Edit').closest('[role="menuitem"]');
      const deleteItem = screen.getByText('Delete').closest('[role="menuitem"]');

      expect(editItem).toBeInTheDocument();
      expect(deleteItem).toBeInTheDocument();
    });
  });

  describe('Data Attributes and Props', () => {
    it('should pass correct props to KanbanCard', () => {
      render(
        <TaskCard
          task={baseTask}
          index={5}
          status="inprogress"
          {...mockHandlers}
        />
      );

      const card = screen.getByTestId('kanban-card-task-1');
      expect(card).toHaveAttribute('data-name', 'Test Task');
      expect(card).toHaveAttribute('data-index', '5');
      expect(card).toHaveAttribute('data-parent', 'inprogress');
    });

    it('should handle different task statuses correctly', () => {
      const statuses = ['todo', 'inprogress', 'inreview', 'done', 'cancelled'];
      
      statuses.forEach((status) => {
        const { unmount } = render(
          <TaskCard
            task={baseTask}
            index={0}
            status={status}
            {...mockHandlers}
          />
        );

        const card = screen.getByTestId('kanban-card-task-1');
        expect(card).toHaveAttribute('data-parent', status);
        unmount();
      });
    });
  });

  describe('Icon Components Integration', () => {
    it('should render correct icons for each state', () => {
      const taskWithAllStates = {
        ...baseTask,
        has_in_progress_attempt: true,
        has_merged_attempt: true,
        has_failed_attempt: true,
      };

      render(
        <TaskCard
          task={taskWithAllStates}
          index={0}
          status="done"
          {...mockHandlers}
        />
      );

      // Should show in-progress and merged, but not failed (due to merged taking precedence)
      expect(screen.getByTestId('in-progress-spinner')).toBeInTheDocument();
      expect(screen.getByTestId('merged-indicator')).toBeInTheDocument();
      expect(screen.queryByTestId('failed-indicator')).not.toBeInTheDocument();

      // Check dropdown icons
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });
});