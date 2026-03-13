import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { TaskCard } from '../TaskCard';
import type { TaskWithAttemptStatus } from 'shared/types';

// Type definitions for mock props
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: string;
  size?: string;
  className?: string;
  [key: string]: unknown;
}

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

interface DropdownProps {
  children: React.ReactNode;
  align?: string;
}

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

interface DropdownTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CheckCircle: ({ className }: { className?: string }) => (
    <div data-testid="check-circle-icon" className={className} />
  ),
  Edit: ({ className }: { className?: string }) => (
    <div data-testid="edit-icon" className={className} />
  ),
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader-icon" className={className} />
  ),
  MoreHorizontal: ({ className }: { className?: string }) => (
    <div data-testid="more-horizontal-icon" className={className} />
  ),
  Trash2: ({ className }: { className?: string }) => (
    <div data-testid="trash-icon" className={className} />
  ),
  XCircle: ({ className }: { className?: string }) => (
    <div data-testid="x-circle-icon" className={className} />
  ),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    size,
    className,
    ...props
  }: ButtonProps) => (
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

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: BadgeProps) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: DropdownProps) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuContent: ({ children, align }: DropdownProps) => (
    <div data-testid="dropdown-content" data-align={align}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onClick, className }: DropdownItemProps) => (
    <div data-testid="dropdown-item" onClick={onClick} className={className}>
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({ children, asChild }: DropdownTriggerProps) =>
    asChild ? children : <div data-testid="dropdown-trigger">{children}</div>,
}));

// Mock KanbanCard
jest.mock('@/components/ui/shadcn-io/kanban', () => ({
  KanbanCard: React.forwardRef<HTMLDivElement, any>(
    (
      {
        children,
        id,
        name,
        index,
        parent,
        onClick,
        onKeyDown,
        tabIndex,
        forwardedRef,
        ...props
      },
      ref
    ) => (
      <div
        ref={forwardedRef || ref}
        data-testid="kanban-card"
        data-id={id}
        data-name={name}
        data-index={index}
        data-parent={parent}
        onClick={onClick}
        onKeyDown={onKeyDown}
        tabIndex={tabIndex}
        {...props}
      >
        {children}
      </div>
    )
  ),
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  is_planning_executor_type: jest.fn(),
}));

describe('TaskCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnViewDetails = jest.fn();

  const createMockTask = (
    overrides: Partial<TaskWithAttemptStatus> = {}
  ): TaskWithAttemptStatus => ({
    id: 'task-1',
    title: 'Test Task',
    description: 'This is a test task description',
    status: 'todo',
    project_id: 'project-1',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    has_in_progress_attempt: false,
    has_merged_attempt: false,
    has_failed_attempt: false,
    latest_attempt_executor: null,
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const { is_planning_executor_type } = await import('@/lib/utils');
    (
      is_planning_executor_type as jest.MockedFunction<
        typeof is_planning_executor_type
      >
    ).mockReturnValue(false);
  });

  describe('Basic Rendering', () => {
    it('renders task card with basic information', () => {
      const task = createMockTask();

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      expect(screen.getByTestId('kanban-card')).toBeInTheDocument();
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(
        screen.getByText('This is a test task description')
      ).toBeInTheDocument();
    });

    it('renders with correct kanban card props', () => {
      const task = createMockTask();

      render(
        <TaskCard
          task={task}
          index={2}
          status="in-progress"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      const kanbanCard = screen.getByTestId('kanban-card');
      expect(kanbanCard).toHaveAttribute('data-id', 'task-1');
      expect(kanbanCard).toHaveAttribute('data-name', 'Test Task');
      expect(kanbanCard).toHaveAttribute('data-index', '2');
      expect(kanbanCard).toHaveAttribute('data-parent', 'in-progress');
    });

    it('truncates long descriptions', () => {
      const longDescription = 'a'.repeat(150);
      const task = createMockTask({ description: longDescription });

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      const description = screen.getByText(
        new RegExp(longDescription.substring(0, 130))
      );
      expect(description.textContent).toContain('...');
      expect(description.textContent?.length).toBeLessThan(
        longDescription.length
      );
    });

    it('renders without description when not provided', () => {
      const task = createMockTask({ description: undefined });

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(
        screen.queryByText('This is a test task description')
      ).not.toBeInTheDocument();
    });
  });

  describe('Task Status Indicators', () => {
    it('shows in-progress spinner when task has in-progress attempt', () => {
      const task = createMockTask({ has_in_progress_attempt: true });

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('shows success indicator when task has merged attempt', () => {
      const task = createMockTask({ has_merged_attempt: true });

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('shows failure indicator when task has failed attempt (but not merged)', () => {
      const task = createMockTask({
        has_failed_attempt: true,
        has_merged_attempt: false,
      });

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
    });

    it('does not show failure indicator when task has both failed and merged attempts', () => {
      const task = createMockTask({
        has_failed_attempt: true,
        has_merged_attempt: true,
      });

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      expect(screen.queryByTestId('x-circle-icon')).not.toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('shows multiple indicators simultaneously when appropriate', () => {
      const task = createMockTask({
        has_in_progress_attempt: true,
        has_merged_attempt: true,
        has_failed_attempt: true,
      });

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('x-circle-icon')).not.toBeInTheDocument();
    });
  });

  describe('Planning Executor Badge', () => {
    it('shows PLAN badge when task has planning executor', async () => {
      const { is_planning_executor_type } = await import('@/lib/utils');
      (
        is_planning_executor_type as jest.MockedFunction<
          typeof is_planning_executor_type
        >
      ).mockReturnValue(true);
      const task = createMockTask({
        latest_attempt_executor: 'planning-executor',
      });

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      expect(screen.getByTestId('badge')).toBeInTheDocument();
      expect(screen.getByText('PLAN')).toBeInTheDocument();
    });

    it('does not show PLAN badge when task does not have planning executor', async () => {
      const { is_planning_executor_type } = await import('@/lib/utils');
      (
        is_planning_executor_type as jest.MockedFunction<
          typeof is_planning_executor_type
        >
      ).mockReturnValue(false);
      const task = createMockTask({
        latest_attempt_executor: 'regular-executor',
      });

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
      expect(screen.queryByText('PLAN')).not.toBeInTheDocument();
    });

    it('does not show PLAN badge when latest_attempt_executor is null', () => {
      const task = createMockTask({ latest_attempt_executor: null });

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
      expect(screen.queryByText('PLAN')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onViewDetails when card is clicked', async () => {
      const user = userEvent.setup();
      const task = createMockTask();

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      const kanbanCard = screen.getByTestId('kanban-card');
      await user.click(kanbanCard);

      expect(mockOnViewDetails).toHaveBeenCalledWith(task);
    });

    it('calls onEdit when edit menu item is clicked', async () => {
      const user = userEvent.setup();
      const task = createMockTask();

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      // Open dropdown menu
      const moreButton = screen
        .getByTestId('more-horizontal-icon')
        .closest('button');
      expect(moreButton).toBeInTheDocument();
      await user.click(moreButton);

      // Click edit item
      const editItem = screen
        .getByText('Edit')
        .closest('[data-testid="dropdown-item"]');
      expect(editItem).toBeInTheDocument();
      await user.click(editItem);

      expect(mockOnEdit).toHaveBeenCalledWith(task);
    });

    it('calls onDelete when delete menu item is clicked', async () => {
      const user = userEvent.setup();
      const task = createMockTask();

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      // Open dropdown menu
      const moreButton = screen
        .getByTestId('more-horizontal-icon')
        .closest('button');
      expect(moreButton).toBeInTheDocument();
      await user.click(moreButton);

      // Click delete item
      const deleteItem = screen
        .getByText('Delete')
        .closest('[data-testid="dropdown-item"]');
      expect(deleteItem).toBeInTheDocument();
      await user.click(deleteItem);

      expect(mockOnDelete).toHaveBeenCalledWith('task-1');
    });

    it('prevents event propagation on dropdown interactions', async () => {
      const user = userEvent.setup();
      const task = createMockTask();

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      // Click the dropdown trigger - should not trigger onViewDetails
      const moreButton = screen
        .getByTestId('more-horizontal-icon')
        .closest('button');
      expect(moreButton).toBeInTheDocument();
      await user.click(moreButton);

      expect(mockOnViewDetails).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('calls onDelete when Backspace key is pressed', async () => {
      const task = createMockTask();

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      const kanbanCard = screen.getByTestId('kanban-card');
      fireEvent.keyDown(kanbanCard, { key: 'Backspace' });

      expect(mockOnDelete).toHaveBeenCalledWith('task-1');
    });

    it('calls onViewDetails when Enter key is pressed', async () => {
      const task = createMockTask();

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      const kanbanCard = screen.getByTestId('kanban-card');
      fireEvent.keyDown(kanbanCard, { key: 'Enter' });

      expect(mockOnViewDetails).toHaveBeenCalledWith(task);
    });

    it('calls onViewDetails when Space key is pressed', async () => {
      const task = createMockTask();

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      const kanbanCard = screen.getByTestId('kanban-card');
      fireEvent.keyDown(kanbanCard, { key: ' ' });

      expect(mockOnViewDetails).toHaveBeenCalledWith(task);
    });

    it('ignores other keys', async () => {
      const task = createMockTask();

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      const kanbanCard = screen.getByTestId('kanban-card');
      fireEvent.keyDown(kanbanCard, { key: 'Escape' });
      fireEvent.keyDown(kanbanCard, { key: 'Tab' });
      fireEvent.keyDown(kanbanCard, { key: 'a' });

      expect(mockOnDelete).not.toHaveBeenCalled();
      expect(mockOnViewDetails).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('scrolls into view and focuses when isFocused is true', async () => {
      const task = createMockTask();
      const mockScrollIntoView = jest.fn();
      const mockFocus = jest.fn();

      // Mock the ref element
      const mockElement = {
        scrollIntoView: mockScrollIntoView,
        focus: mockFocus,
      };

      jest.spyOn(React, 'useRef').mockReturnValue({
        current: mockElement,
      });

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={true}
        />
      );

      await waitFor(() => {
        expect(mockScrollIntoView).toHaveBeenCalledWith({
          block: 'nearest',
          behavior: 'smooth',
        });
        expect(mockFocus).toHaveBeenCalled();
      });
    });

    it('does not scroll or focus when isFocused is false', () => {
      const task = createMockTask();
      const mockScrollIntoView = jest.fn();
      const mockFocus = jest.fn();

      jest.spyOn(React, 'useRef').mockReturnValue({
        current: {
          scrollIntoView: mockScrollIntoView,
          focus: mockFocus,
        },
      });

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      expect(mockScrollIntoView).not.toHaveBeenCalled();
      expect(mockFocus).not.toHaveBeenCalled();
    });

    it('handles null ref gracefully', () => {
      const task = createMockTask();

      jest.spyOn(React, 'useRef').mockReturnValue({
        current: null,
      });

      // Should not crash
      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={true}
        />
      );

      expect(screen.getByTestId('kanban-card')).toBeInTheDocument();
    });
  });

  describe('TabIndex Props', () => {
    it('uses default tabIndex of -1 when not provided', () => {
      const task = createMockTask();

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      const kanbanCard = screen.getByTestId('kanban-card');
      expect(kanbanCard).toHaveAttribute('tabIndex', '-1');
    });

    it('uses provided tabIndex', () => {
      const task = createMockTask();

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
          tabIndex={0}
        />
      );

      const kanbanCard = screen.getByTestId('kanban-card');
      expect(kanbanCard).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Edge Cases', () => {
    it('handles tasks with empty titles', () => {
      const task = createMockTask({ title: '' });

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      expect(screen.getByTestId('kanban-card')).toBeInTheDocument();
    });

    it('handles tasks with empty descriptions', () => {
      const task = createMockTask({ description: '' });

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.queryByText('')).not.toBeInTheDocument();
    });

    it('handles special characters in titles and descriptions', () => {
      const task = createMockTask({
        title: 'Test & Task with <script>alert("xss")</script>',
        description: 'Description with "quotes" and \'apostrophes\' and <tags>',
      });

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      expect(
        screen.getByText('Test & Task with <script>alert("xss")</script>')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Description with "quotes" and \'apostrophes\' and <tags>'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper dropdown menu structure', async () => {
      const user = userEvent.setup();
      const task = createMockTask();

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      const moreButton = screen
        .getByTestId('more-horizontal-icon')
        .closest('button');
      expect(moreButton).toBeInTheDocument();

      await user.click(moreButton);

      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('has proper color coding for status indicators', () => {
      const task = createMockTask({
        has_in_progress_attempt: true,
        has_merged_attempt: true,
        has_failed_attempt: true,
      });

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      const loaderIcon = screen.getByTestId('loader-icon');
      const checkIcon = screen.getByTestId('check-circle-icon');

      expect(loaderIcon).toHaveClass('text-blue-500');
      expect(checkIcon).toHaveClass('text-green-500');
    });

    it('has destructive styling for delete action', async () => {
      const user = userEvent.setup();
      const task = createMockTask();

      render(
        <TaskCard
          task={task}
          index={0}
          status="todo"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDetails={mockOnViewDetails}
          isFocused={false}
        />
      );

      const moreButton = screen
        .getByTestId('more-horizontal-icon')
        .closest('button');
      await user.click(moreButton);

      const deleteItem = screen
        .getByText('Delete')
        .closest('[data-testid="dropdown-item"]');
      expect(deleteItem).toHaveClass('text-destructive');
    });
  });
});
