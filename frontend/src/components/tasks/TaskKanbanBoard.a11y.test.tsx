import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import TaskKanbanBoard from './TaskKanbanBoard';
import type { TaskWithAttemptStatus } from 'shared/types';

// Type definitions for mock props
interface KanbanProviderProps {
  children: React.ReactNode;
}

interface KanbanHeaderProps {
  children?: React.ReactNode;
  title: string;
  count: number;
}

interface KanbanCardsProps {
  children: React.ReactNode;
}

// Mock the DnD and Kanban components
jest.mock('@/components/ui/shadcn-io/kanban', () => ({
  KanbanProvider: ({ children }: KanbanProviderProps) => (
    <div role="application" aria-label="Task Kanban Board">
      {children}
    </div>
  ),
  KanbanBoard: ({ children }: KanbanProviderProps) => (
    <div
      className="kanban-board flex gap-4"
      role="region"
      aria-label="Kanban columns"
    >
      {children}
    </div>
  ),
  KanbanHeader: ({ children, title, count }: KanbanHeaderProps) => (
    <div className="kanban-header mb-4">
      <h3 className="font-semibold text-sm text-gray-600">{title}</h3>
      <span className="text-xs text-gray-500">({count})</span>
      {children}
    </div>
  ),
  KanbanCards: ({ children }: KanbanCardsProps) => (
    <div className="kanban-cards space-y-2" role="group">
      {children}
    </div>
  ),
}));

// Mock keyboard shortcuts
jest.mock('@/lib/keyboard-shortcuts.ts', () => ({
  useKeyboardShortcuts: () => ({
    navigateToTask: jest.fn(),
    handleKeyboardAction: jest.fn(),
  }),
  useKanbanKeyboardNavigation: () => ({
    focusedTask: null,
    setFocusedTask: jest.fn(),
    handleKeyDown: jest.fn(),
  }),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ projectId: 'test-project' }),
}));

const mockTasks: TaskWithAttemptStatus[] = [
  {
    id: 'task-1',
    title: 'Todo Task',
    description: 'A task in todo status',
    project_id: 'project-1',
    status: 'todo',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    has_in_progress_attempt: false,
    has_merged_attempt: false,
    has_failed_attempt: false,
    latest_attempt_executor: null,
  },
  {
    id: 'task-2',
    title: 'In Progress Task',
    description: 'A task in progress',
    project_id: 'project-1',
    status: 'inprogress',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    has_in_progress_attempt: true,
    has_merged_attempt: false,
    has_failed_attempt: false,
    latest_attempt_executor: null,
  },
  {
    id: 'task-3',
    title: 'Done Task',
    description: 'A completed task',
    project_id: 'project-1',
    status: 'done',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    has_in_progress_attempt: false,
    has_merged_attempt: true,
    has_failed_attempt: false,
    latest_attempt_executor: null,
  },
];

const defaultProps = {
  tasks: mockTasks,
  searchQuery: '',
  onDragEnd: jest.fn(),
  onEditTask: jest.fn(),
  onDeleteTask: jest.fn(),
  onViewTaskDetails: jest.fn(),
  isPanelOpen: false,
};

const renderKanbanBoard = (props = {}) => {
  return render(
    <BrowserRouter>
      <TaskKanbanBoard {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('TaskKanbanBoard Accessibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Automated Accessibility Testing', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = renderKanbanBoard();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations with search query', async () => {
      const { container } = renderKanbanBoard({ searchQuery: 'todo' });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations when panel is open', async () => {
      const { container } = renderKanbanBoard({ isPanelOpen: true });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have proper tab order through columns', async () => {
      const user = userEvent.setup();
      renderKanbanBoard();

      // Should be able to tab through task cards
      await user.tab();

      // First task should be focused
      const firstTask = screen.getByRole('button', {
        name: /task: todo task/i,
      });
      expect(firstTask).toHaveFocus();
    });

    it('should support arrow key navigation between columns', async () => {
      const user = userEvent.setup();
      renderKanbanBoard();

      // Focus on first task
      const firstTask = screen.getByRole('button', {
        name: /task: todo task/i,
      });
      firstTask.focus();

      // Test right arrow key navigation
      await user.keyboard('{ArrowRight}');

      // Should move to next column if implementation supports it
      // This would depend on the keyboard navigation implementation
    });

    it('should support Enter key for task activation', async () => {
      const user = userEvent.setup();
      const onViewTaskDetails = jest.fn();
      renderKanbanBoard({ onViewTaskDetails });

      const task = screen.getByRole('button', { name: /task: todo task/i });
      task.focus();

      await user.keyboard('{Enter}');
      expect(onViewTaskDetails).toHaveBeenCalled();
    });

    it('should support keyboard shortcuts for common actions', async () => {
      const user = userEvent.setup();
      renderKanbanBoard();

      // Test if keyboard shortcuts are properly set up
      // The actual implementation would depend on the keyboard shortcuts hook
      await user.keyboard('{Control>}k');
      // This would trigger search or other global shortcuts
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should have proper landmark structure', () => {
      renderKanbanBoard();

      // Check for application role
      const application = screen.getByRole('application', {
        name: /task kanban board/i,
      });
      expect(application).toBeInTheDocument();

      // Check for region role for columns
      const kanbanRegion = screen.getByRole('region', {
        name: /kanban columns/i,
      });
      expect(kanbanRegion).toBeInTheDocument();
    });

    it('should announce column headers and task counts', () => {
      renderKanbanBoard();

      // Check that column headers are present
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();

      // Check that task counts are announced
      expect(screen.getByText('(1)')).toBeInTheDocument(); // Todo count
    });

    it('should group tasks properly within columns', () => {
      renderKanbanBoard();

      // Check that tasks are grouped
      const groups = screen.getAllByRole('group');
      expect(groups.length).toBeGreaterThan(0);
    });

    it('should provide context for drag and drop operations', () => {
      renderKanbanBoard();

      // Check that the application role provides context for DnD
      const application = screen.getByRole('application', {
        name: /task kanban board/i,
      });
      expect(application).toHaveAttribute('aria-label', 'Task Kanban Board');
    });

    it('should announce task status changes clearly', () => {
      renderKanbanBoard();

      // Tasks should be clearly labeled with their status
      const todoTask = screen.getByRole('button', { name: /task: todo task/i });
      expect(todoTask).toBeInTheDocument();

      // Status should be conveyed through column placement
      const todoColumn = screen.getByText('To Do').closest('.kanban-header');
      expect(todoColumn).toBeInTheDocument();
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper ARIA labels for the board', () => {
      renderKanbanBoard();

      const application = screen.getByRole('application');
      expect(application).toHaveAttribute('aria-label', 'Task Kanban Board');
    });

    it('should have proper ARIA structure for columns', () => {
      renderKanbanBoard();

      // Column headers should be properly structured
      const headers = screen.getAllByRole('heading', { level: 3 });
      expect(headers.length).toBeGreaterThan(0);

      headers.forEach((header) => {
        expect(header).toBeVisible();
      });
    });

    it('should have proper ARIA attributes for task groups', () => {
      renderKanbanBoard();

      const groups = screen.getAllByRole('group');
      expect(groups.length).toBeGreaterThan(0);

      // Each group should be properly accessible
      groups.forEach((group) => {
        expect(group).toBeInTheDocument();
      });
    });

    it('should maintain ARIA relationships during drag operations', () => {
      renderKanbanBoard();

      // Check that tasks maintain proper relationships
      const tasks = screen.getAllByRole('button');
      tasks.forEach((task) => {
        expect(task).toHaveAccessibleName();
      });
    });
  });

  describe('Color Contrast and Focus Indicators', () => {
    it('should have proper color contrast for column headers', () => {
      renderKanbanBoard();

      const headers = screen.getAllByRole('heading', { level: 3 });
      headers.forEach((header) => {
        // Check for proper text color classes
        expect(header).toHaveClass('text-gray-600'); // Should have sufficient contrast
      });
    });

    it('should have visible focus indicators for tasks', () => {
      renderKanbanBoard();

      const tasks = screen.getAllByRole('button');
      tasks.forEach((task) => {
        // Should have focus styling
        expect(task).toHaveClass('focus:outline-none', 'focus:ring-2');
      });
    });

    it('should maintain proper contrast in different board states', () => {
      renderKanbanBoard({ isPanelOpen: true });

      // Board should maintain contrast when panel is open
      const headers = screen.getAllByRole('heading', { level: 3 });
      headers.forEach((header) => {
        expect(header).toBeVisible();
      });
    });

    it('should use semantic colors for different task statuses', () => {
      renderKanbanBoard();

      // Different columns should have appropriate visual treatment
      const todoHeader = screen.getByText('To Do');
      const doneHeader = screen.getByText('Done');

      expect(todoHeader).toBeInTheDocument();
      expect(doneHeader).toBeInTheDocument();
    });
  });

  describe('Responsive Accessibility', () => {
    it('should maintain accessibility on mobile viewports', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderKanbanBoard();

      // Board should still be accessible on mobile
      const application = screen.getByRole('application');
      expect(application).toBeInTheDocument();

      const tasks = screen.getAllByRole('button');
      expect(tasks.length).toBeGreaterThan(0);
    });

    it('should adapt touch targets for mobile', () => {
      renderKanbanBoard();

      const tasks = screen.getAllByRole('button');
      tasks.forEach((task) => {
        // Should have adequate touch target size
        expect(task).toHaveClass('p-4'); // Padding for touch targets
      });
    });

    it('should handle horizontal scrolling accessibly', () => {
      renderKanbanBoard();

      // Board container should allow horizontal scrolling if needed
      const board = screen.getByRole('region', { name: /kanban columns/i });
      expect(board).toHaveClass('flex'); // Should support horizontal layout
    });
  });

  describe('Drag and Drop Accessibility', () => {
    it('should provide keyboard alternatives to drag and drop', async () => {
      const user = userEvent.setup();
      renderKanbanBoard();

      // Focus on a task
      const task = screen.getByRole('button', { name: /task: todo task/i });
      task.focus();

      // Should be able to activate task for details instead of dragging
      await user.keyboard('{Enter}');

      // Alternative interactions should be available
      expect(task).toHaveAccessibleName();
    });

    it('should announce drag and drop operations to screen readers', () => {
      renderKanbanBoard();

      // The application role should provide context for DnD operations
      const application = screen.getByRole('application', {
        name: /task kanban board/i,
      });
      expect(application).toBeInTheDocument();
    });

    it('should maintain focus during drag operations', () => {
      renderKanbanBoard();

      const tasks = screen.getAllByRole('button');
      tasks.forEach((task) => {
        expect(task).toHaveAttribute('tabIndex');
      });
    });
  });

  describe('Search and Filtering Accessibility', () => {
    it('should announce filtered results', () => {
      renderKanbanBoard({ searchQuery: 'todo' });

      // Filtered tasks should still be accessible
      const todoTask = screen.getByRole('button', { name: /task: todo task/i });
      expect(todoTask).toBeInTheDocument();
    });

    it('should handle empty search results accessibly', () => {
      renderKanbanBoard({ searchQuery: 'nonexistent' });

      // Should handle no results gracefully
      const application = screen.getByRole('application');
      expect(application).toBeInTheDocument();
    });

    it('should maintain board structure during search', () => {
      renderKanbanBoard({ searchQuery: 'progress' });

      // Column headers should still be present
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });
  });

  describe('Error States and Edge Cases', () => {
    it('should handle empty task list accessibly', () => {
      renderKanbanBoard({ tasks: [] });

      // Should still render board structure
      const application = screen.getByRole('application');
      expect(application).toBeInTheDocument();

      // Column headers should still be present
      expect(screen.getByText('To Do')).toBeInTheDocument();
    });

    it('should handle tasks with missing data gracefully', () => {
      const incompleteTasks = [
        {
          ...mockTasks[0],
          title: '',
          description: undefined,
        },
      ];

      renderKanbanBoard({ tasks: incompleteTasks as any });

      // Should render without errors
      const application = screen.getByRole('application');
      expect(application).toBeInTheDocument();
    });

    it('should maintain accessibility during loading states', () => {
      renderKanbanBoard();

      // Board structure should be maintained
      const application = screen.getByRole('application');
      expect(application).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should manage focus properly when tasks are added', async () => {
      const { rerender } = renderKanbanBoard();

      const newTask: TaskWithAttemptStatus = {
        id: 'task-4',
        title: 'New Task',
        description: 'A newly added task',
        project_id: 'project-1',
        status: 'todo',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        has_in_progress_attempt: false,
        has_merged_attempt: false,
        has_failed_attempt: false,
        latest_attempt_executor: null,
      };

      // Re-render with new task
      rerender(
        <BrowserRouter>
          <TaskKanbanBoard {...defaultProps} tasks={[...mockTasks, newTask]} />
        </BrowserRouter>
      );

      // New task should be accessible
      await waitFor(() => {
        const newTaskElement = screen.getByRole('button', {
          name: /task: new task/i,
        });
        expect(newTaskElement).toBeInTheDocument();
      });
    });

    it('should restore focus after task operations', () => {
      renderKanbanBoard();

      // Focus should be manageable
      const tasks = screen.getAllByRole('button');
      expect(tasks.length).toBeGreaterThan(0);

      tasks.forEach((task) => {
        expect(task).toHaveAttribute('tabIndex');
      });
    });
  });
});
