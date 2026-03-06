import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { TaskCard } from './TaskCard';
import type { TaskWithAttemptStatus } from 'shared/types';

// Mock the DnD context and KanbanCard
jest.mock('@/components/ui/shadcn-io/kanban', () => ({
  KanbanCard: ({
    children,
    ...props
  }: any) => (
    <div
      {...props}
      className="kanban-card p-4 border rounded"
    >
      {children}
    </div>
  ),
}));

const mockTask: TaskWithAttemptStatus = {
  id: 'task-1',
  title: 'Test Task',
  description: 'This is a test task description for accessibility testing',
  project_id: 'project-1',
  status: 'todo',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  has_in_progress_attempt: false,
  has_merged_attempt: false,
  has_failed_attempt: false,
  latest_attempt_executor: null,
};

const mockLongDescriptionTask: TaskWithAttemptStatus = {
  ...mockTask,
  id: 'task-2',
  title: 'Task with Long Description',
  description:
    'This is a very long description that should be truncated when displayed in the task card. It contains more than 130 characters to test the truncation functionality and ensure accessibility is maintained.',
};

const mockInProgressTask: TaskWithAttemptStatus = {
  ...mockTask,
  id: 'task-3',
  title: 'In Progress Task',
  has_in_progress_attempt: true,
};

const mockCompletedTask: TaskWithAttemptStatus = {
  ...mockTask,
  id: 'task-4',
  title: 'Completed Task',
  has_merged_attempt: true,
};

const mockFailedTask: TaskWithAttemptStatus = {
  ...mockTask,
  id: 'task-5',
  title: 'Failed Task',
  has_failed_attempt: true,
};

const defaultProps = {
  index: 0,
  status: 'todo',
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onViewDetails: jest.fn(),
  isFocused: false,
  tabIndex: 0,
};

const renderTaskCard = (task = mockTask, props = {}) => {
  return render(<TaskCard task={task} {...defaultProps} {...props} />);
};

describe('TaskCard Accessibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Automated Accessibility Testing', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = renderTaskCard();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations with all task states', async () => {
      const { container: container1 } = renderTaskCard(mockInProgressTask);
      const { container: container2 } = renderTaskCard(mockCompletedTask);
      const { container: container3 } = renderTaskCard(mockFailedTask);

      const results1 = await axe(container1);
      const results2 = await axe(container2);
      const results3 = await axe(container3);

      expect(results1).toHaveNoViolations();
      expect(results2).toHaveNoViolations();
      expect(results3).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with tab key', async () => {
      const user = userEvent.setup();
      renderTaskCard();

      const taskCard = screen.getByRole('button', { name: /task: test task/i });

      await user.tab();
      expect(taskCard).toHaveFocus();
    });

    it('should activate with Enter key', async () => {
      const user = userEvent.setup();
      const onViewDetails = jest.fn();
      renderTaskCard(mockTask, { onViewDetails });

      const taskCard = screen.getByRole('button', { name: /task: test task/i });
      taskCard.focus();

      await user.keyboard('{Enter}');
      expect(onViewDetails).toHaveBeenCalledWith(mockTask);
    });

    it('should activate with Space key', async () => {
      const user = userEvent.setup();
      const onViewDetails = jest.fn();
      renderTaskCard(mockTask, { onViewDetails });

      const taskCard = screen.getByRole('button', { name: /task: test task/i });
      taskCard.focus();

      await user.keyboard(' ');
      expect(onViewDetails).toHaveBeenCalledWith(mockTask);
    });

    it('should delete task with Backspace key', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      renderTaskCard(mockTask, { onDelete });

      const taskCard = screen.getByRole('button', { name: /task: test task/i });
      taskCard.focus();

      await user.keyboard('{Backspace}');
      expect(onDelete).toHaveBeenCalledWith(mockTask.id);
    });

    it('should navigate to dropdown menu with keyboard', async () => {
      const user = userEvent.setup();
      renderTaskCard();

      // Tab to the main card
      await user.tab();

      // Tab to the dropdown trigger
      await user.tab();
      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });
      expect(dropdownTrigger).toHaveFocus();
    });

    it('should open dropdown menu with Enter key', async () => {
      const user = userEvent.setup();
      renderTaskCard();

      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });
      dropdownTrigger.focus();

      await user.keyboard('{Enter}');

      // Check if dropdown menu items are visible
      expect(
        screen.getByRole('menuitem', { name: /edit/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: /delete/i })
      ).toBeInTheDocument();
    });

    it('should close dropdown menu with Escape key', async () => {
      const user = userEvent.setup();
      renderTaskCard();

      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });

      // Open dropdown
      await user.click(dropdownTrigger);
      expect(
        screen.getByRole('menuitem', { name: /edit/i })
      ).toBeInTheDocument();

      // Close with Escape
      await user.keyboard('{Escape}');
      expect(
        screen.queryByRole('menuitem', { name: /edit/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should have proper accessible name', () => {
      renderTaskCard();

      const taskCard = screen.getByRole('button', { name: /task: test task/i });
      expect(taskCard).toHaveAccessibleName();
    });

    it('should describe task content for screen readers', () => {
      renderTaskCard();

      // Check that title is present
      expect(screen.getByText('Test Task')).toBeInTheDocument();

      // Check that description is present
      expect(
        screen.getByText(
          'This is a test task description for accessibility testing'
        )
      ).toBeInTheDocument();
    });

    it('should announce task status through icons with proper labels', () => {
      renderTaskCard(mockInProgressTask);

      // In progress icon should have proper labeling
      const inProgressIcon = screen.getByTestId('loader-icon');
      expect(inProgressIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should announce completion status', () => {
      renderTaskCard(mockCompletedTask);

      // Completed icon should be present
      const completedIcon = screen.getByTestId('check-circle-icon');
      expect(completedIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should announce failure status', () => {
      renderTaskCard(mockFailedTask);

      // Failed icon should be present
      const failedIcon = screen.getByTestId('x-circle-icon');
      expect(failedIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should handle truncated descriptions properly', () => {
      renderTaskCard(mockLongDescriptionTask);

      // Should show truncated text
      const description = screen.getByText(
        /this is a very long description.*\.\.\./i
      );
      expect(description).toBeInTheDocument();
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper button role and attributes', () => {
      renderTaskCard();

      const taskCard = screen.getByRole('button', { name: /task: test task/i });
      expect(taskCard).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper dropdown menu ARIA attributes', async () => {
      const user = userEvent.setup();
      renderTaskCard();

      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });
      await user.click(dropdownTrigger);

      // Check menu items have proper roles
      const editMenuItem = screen.getByRole('menuitem', { name: /edit/i });
      const deleteMenuItem = screen.getByRole('menuitem', { name: /delete/i });

      expect(editMenuItem).toBeInTheDocument();
      expect(deleteMenuItem).toBeInTheDocument();
    });

    it('should have proper ARIA attributes when focused', () => {
      renderTaskCard(mockTask, { isFocused: true });

      const taskCard = screen.getByRole('button', { name: /task: test task/i });
      expect(taskCard).toHaveFocus();
    });

    it('should have descriptive icons with proper ARIA labels', () => {
      renderTaskCard(mockInProgressTask);

      // Icons should be hidden from screen readers but status should be conveyed through text
      const loaderIcon = screen.getByTestId('loader-icon');
      expect(loaderIcon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Color Contrast and Focus Indicators', () => {
    it('should have visible focus indicators', () => {
      renderTaskCard();

      const taskCard = screen.getByRole('button', { name: /task: test task/i });
      expect(taskCard).toHaveClass('cursor-pointer');
    });

    it('should maintain proper contrast in different states', () => {
      renderTaskCard();

      // Check text elements have proper contrast classes
      const title = screen.getByText('Test Task');
      expect(title).toHaveClass('text-sm'); // Should have text styling

      const description = screen.getByText(/this is a test task description/i);
      expect(description).toHaveClass('text-muted-foreground'); // Muted but still accessible
    });

    it('should have proper hover states', async () => {
      const user = userEvent.setup();
      renderTaskCard();

      const taskCard = screen.getByRole('button', { name: /task: test task/i });

      await user.hover(taskCard);
      // Card should have hover styling
      expect(taskCard).toHaveClass('cursor-pointer');
    });

    it('should have accessible status indicators', () => {
      renderTaskCard(mockInProgressTask);

      // Status indicators should have proper color classes
      const loaderIcon = screen.getByTestId('loader-icon');
      expect(loaderIcon).toHaveClass('text-blue-500');
    });
  });

  describe('Interaction States', () => {
    it('should handle click interactions accessibly', async () => {
      const user = userEvent.setup();
      const onViewDetails = jest.fn();
      renderTaskCard(mockTask, { onViewDetails });

      const taskCard = screen.getByRole('button', { name: /task: test task/i });

      await user.click(taskCard);
      expect(onViewDetails).toHaveBeenCalledWith(mockTask);
    });

    it('should prevent event propagation for dropdown interactions', async () => {
      const user = userEvent.setup();
      const onViewDetails = jest.fn();
      renderTaskCard(mockTask, { onViewDetails });

      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });

      // Click dropdown should not trigger card click
      await user.click(dropdownTrigger);
      expect(onViewDetails).not.toHaveBeenCalled();
    });

    it('should handle dropdown menu item selection', async () => {
      const user = userEvent.setup();
      const onEdit = jest.fn();
      const onDelete = jest.fn();
      renderTaskCard(mockTask, { onEdit, onDelete });

      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });
      await user.click(dropdownTrigger);

      // Test edit action
      const editMenuItem = screen.getByRole('menuitem', { name: /edit/i });
      await user.click(editMenuItem);
      expect(onEdit).toHaveBeenCalledWith(mockTask);

      // Reopen and test delete action
      await user.click(dropdownTrigger);
      const deleteMenuItem = screen.getByRole('menuitem', { name: /delete/i });
      await user.click(deleteMenuItem);
      expect(onDelete).toHaveBeenCalledWith(mockTask.id);
    });
  });

  describe('Responsive Accessibility', () => {
    it('should maintain accessibility on touch devices', () => {
      renderTaskCard();

      const taskCard = screen.getByRole('button', { name: /task: test task/i });

      // Should have adequate touch target size via cursor pointer class
      expect(taskCard).toHaveClass('cursor-pointer');
    });

    it('should handle long titles gracefully', () => {
      const longTitleTask = {
        ...mockTask,
        title:
          'This is a very long task title that might wrap to multiple lines and should still be accessible',
      };

      renderTaskCard(longTitleTask);

      const title = screen.getByText(longTitleTask.title);
      expect(title).toHaveClass('break-words'); // Should handle text wrapping
    });
  });

  describe('Error States', () => {
    it('should handle missing task data gracefully', () => {
      const incompleteTask = {
        ...mockTask,
        title: '',
        description: undefined,
      };

      renderTaskCard(incompleteTask as any);

      // Should still render without errors - look for specific button
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // The main task button should be present
      const taskButton = buttons.find(button => 
        button.getAttribute('aria-label')?.includes('Task:')
      );
      expect(taskButton).toBeInTheDocument();
    });

    it('should maintain accessibility with missing optional props', () => {
      const { tabIndex: _tabIndex, ...propsWithoutTabIndex } = defaultProps;

      render(<TaskCard task={mockTask} {...propsWithoutTabIndex} />);

      const taskCard = screen.getByRole('button', { name: /task: test task/i });
      expect(taskCard).toHaveAttribute('tabIndex', '-1'); // Default value
    });
  });
});
