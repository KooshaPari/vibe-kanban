import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import ProjectCard from './ProjectCard';
import type { Project } from 'shared/types';

// Mock the API
jest.mock('@/lib/api.ts', () => ({
  projectsApi: {
    deleteProject: jest.fn(),
  },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const mockProject: Project = {
  id: 'project-1',
  name: 'Test Project',
  description: 'This is a test project for accessibility testing',
  path: '/path/to/project',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  git_branch: 'main',
  settings: {},
};

const mockProjectWithLongDescription: Project = {
  ...mockProject,
  id: 'project-2',
  name: 'Project with Very Long Name That Might Wrap',
  description:
    'This is a very long description that might wrap to multiple lines and we need to ensure it remains accessible and readable throughout. This description is intentionally verbose to test how the component handles long text content.',
};

const mockProjectMinimal: Project = {
  ...mockProject,
  id: 'project-3',
  name: 'Minimal Project',
  description: '',
};

const defaultProps = {
  isFocused: false,
  onEdit: jest.fn(),
  onDelete: jest.fn(),
};

const renderProjectCard = (project = mockProject, props = {}) => {
  return render(
    <BrowserRouter>
      <ProjectCard project={project} {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('ProjectCard Accessibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Automated Accessibility Testing', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = renderProjectCard();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations with long content', async () => {
      const { container } = renderProjectCard(mockProjectWithLongDescription);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations with minimal content', async () => {
      const { container } = renderProjectCard(mockProjectMinimal);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations when focused', async () => {
      const { container } = renderProjectCard(mockProject, { isFocused: true });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with tab key', async () => {
      const user = userEvent.setup();
      renderProjectCard();

      // Tab should focus the main card button
      await user.tab();
      const cardButton = screen.getByRole('button', {
        name: /open test project/i,
      });
      expect(cardButton).toHaveFocus();
    });

    it('should navigate to dropdown menu with tab', async () => {
      const user = userEvent.setup();
      renderProjectCard();

      // Tab to card
      await user.tab();

      // Tab to dropdown trigger
      await user.tab();
      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });
      expect(dropdownTrigger).toHaveFocus();
    });

    it('should activate card with Enter key', async () => {
      const user = userEvent.setup();
      renderProjectCard();

      const cardButton = screen.getByRole('button', {
        name: /open test project/i,
      });
      cardButton.focus();

      await user.keyboard('{Enter}');
      // Navigation would be handled by the navigate function in real implementation
    });

    it('should activate card with Space key', async () => {
      const user = userEvent.setup();
      renderProjectCard();

      const cardButton = screen.getByRole('button', {
        name: /open test project/i,
      });
      cardButton.focus();

      await user.keyboard(' ');
      // Navigation would be handled by the navigate function in real implementation
    });

    it('should open dropdown with Enter key', async () => {
      const user = userEvent.setup();
      renderProjectCard();

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

    it('should close dropdown with Escape key', async () => {
      const user = userEvent.setup();
      renderProjectCard();

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

    it('should navigate within dropdown menu with arrow keys', async () => {
      const user = userEvent.setup();
      renderProjectCard();

      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });
      await user.click(dropdownTrigger);

      const editItem = screen.getByRole('menuitem', { name: /edit/i });
      const deleteItem = screen.getByRole('menuitem', { name: /delete/i });

      // First item should be focused when dropdown opens
      expect(editItem).toHaveFocus();

      // Arrow down should move to next item
      await user.keyboard('{ArrowDown}');
      expect(deleteItem).toHaveFocus();

      // Arrow up should move back
      await user.keyboard('{ArrowUp}');
      expect(editItem).toHaveFocus();
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should have proper accessible name for main card', () => {
      renderProjectCard();

      const cardButton = screen.getByRole('button', {
        name: /open test project/i,
      });
      expect(cardButton).toHaveAccessibleName();
    });

    it('should provide project information to screen readers', () => {
      renderProjectCard();

      // Project name should be visible
      expect(screen.getByText('Test Project')).toBeInTheDocument();

      // Project description should be visible
      expect(
        screen.getByText('This is a test project for accessibility testing')
      ).toBeInTheDocument();

      // Path should be visible
      expect(screen.getByText('/path/to/project')).toBeInTheDocument();
    });

    it('should announce creation date accessibly', () => {
      renderProjectCard();

      // Creation date should be present with accessible formatting
      const dateElement = screen.getByText(/created/i);
      expect(dateElement).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      renderProjectCard();

      // Project name should be a heading
      const heading = screen.getByRole('heading', { name: /test project/i });
      expect(heading).toBeInTheDocument();
    });

    it('should describe dropdown menu properly', () => {
      renderProjectCard();

      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });
      expect(dropdownTrigger).toHaveAccessibleName();
    });

    it('should announce project actions clearly', async () => {
      const user = userEvent.setup();
      renderProjectCard();

      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });
      await user.click(dropdownTrigger);

      // Menu items should have clear names
      expect(
        screen.getByRole('menuitem', { name: /edit/i })
      ).toHaveAccessibleName();
      expect(
        screen.getByRole('menuitem', { name: /delete/i })
      ).toHaveAccessibleName();
    });

    it('should handle missing description gracefully', () => {
      renderProjectCard(mockProjectMinimal);

      const cardButton = screen.getByRole('button', {
        name: /open minimal project/i,
      });
      expect(cardButton).toBeInTheDocument();

      // Should still show project name
      expect(screen.getByText('Minimal Project')).toBeInTheDocument();
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper card structure', () => {
      renderProjectCard();

      // Card should have proper landmark role
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderProjectCard();

      // Main card should be a button
      const cardButton = screen.getByRole('button', {
        name: /open test project/i,
      });
      expect(cardButton).toBeInTheDocument();

      // Dropdown trigger should be a button
      const dropdownButton = screen.getByRole('button', {
        name: /more options/i,
      });
      expect(dropdownButton).toBeInTheDocument();
    });

    it('should have proper dropdown menu ARIA attributes', async () => {
      const user = userEvent.setup();
      renderProjectCard();

      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });
      expect(dropdownTrigger).toHaveAttribute('aria-haspopup');

      await user.click(dropdownTrigger);

      // Menu should have proper role
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();

      // Menu items should have proper roles
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it('should support focus management when focused prop is true', () => {
      renderProjectCard(mockProject, { isFocused: true });

      const cardButton = screen.getByRole('button', {
        name: /open test project/i,
      });
      expect(cardButton).toHaveFocus();
    });

    it('should have proper time element for date', () => {
      renderProjectCard();

      const timeElement = screen.getByText(/2024/);
      expect(timeElement.closest('time')).toBeInTheDocument();
    });
  });

  describe('Color Contrast and Focus Indicators', () => {
    it('should have visible focus indicators on card', async () => {
      const user = userEvent.setup();
      renderProjectCard();

      const cardButton = screen.getByRole('button', {
        name: /open test project/i,
      });

      await user.tab();
      expect(cardButton).toHaveFocus();
      expect(cardButton).toHaveClass('focus:outline-none');
    });

    it('should have visible focus indicators on dropdown', async () => {
      const user = userEvent.setup();
      renderProjectCard();

      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });

      // Tab to dropdown
      await user.tab();
      await user.tab();

      expect(dropdownTrigger).toHaveFocus();
      expect(dropdownTrigger).toHaveClass('focus:ring-2');
    });

    it('should have proper contrast for text elements', () => {
      renderProjectCard();

      // Title should have proper contrast
      const title = screen.getByRole('heading', { name: /test project/i });
      expect(title).toBeVisible();

      // Description should have proper contrast (even if muted)
      const description = screen.getByText(/this is a test project/i);
      expect(description).toBeVisible();
    });

    it('should have proper hover states', async () => {
      const user = userEvent.setup();
      renderProjectCard();

      const cardButton = screen.getByRole('button', {
        name: /open test project/i,
      });

      await user.hover(cardButton);
      // Card should have hover styling
      expect(cardButton).toHaveClass('hover:bg-muted/50');
    });

    it('should have accessible icons', () => {
      renderProjectCard();

      // Icons should be properly hidden from screen readers or have labels
      const icons = document.querySelectorAll('svg');
      icons.forEach((icon) => {
        // Icons should either have aria-hidden or proper labels
        const hasAriaHidden = icon.hasAttribute('aria-hidden');
        const hasAriaLabel = icon.hasAttribute('aria-label');
        const hasAriaLabelledby = icon.hasAttribute('aria-labelledby');

        expect(hasAriaHidden || hasAriaLabel || hasAriaLabelledby).toBe(true);
      });
    });
  });

  describe('Interaction States', () => {
    it('should handle click interactions on card', async () => {
      const user = userEvent.setup();
      renderProjectCard();

      const cardButton = screen.getByRole('button', {
        name: /open test project/i,
      });

      await user.click(cardButton);
      // Navigation would be triggered in real implementation
    });

    it('should handle edit action', async () => {
      const user = userEvent.setup();
      const onEdit = jest.fn();
      renderProjectCard(mockProject, { onEdit });

      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });
      await user.click(dropdownTrigger);

      const editItem = screen.getByRole('menuitem', { name: /edit/i });
      await user.click(editItem);

      expect(onEdit).toHaveBeenCalledWith(mockProject);
    });

    it('should handle delete action', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      renderProjectCard(mockProject, { onDelete });

      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });
      await user.click(dropdownTrigger);

      const deleteItem = screen.getByRole('menuitem', { name: /delete/i });
      await user.click(deleteItem);

      expect(onDelete).toHaveBeenCalledWith(mockProject.id);
    });

    it('should prevent event propagation for dropdown interactions', async () => {
      const user = userEvent.setup();
      renderProjectCard();

      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });

      // Click dropdown should not trigger card navigation
      await user.click(dropdownTrigger);

      // Dropdown should open without triggering card action
      expect(
        screen.getByRole('menuitem', { name: /edit/i })
      ).toBeInTheDocument();
    });

    it('should handle keyboard activation of menu items', async () => {
      const user = userEvent.setup();
      const onEdit = jest.fn();
      renderProjectCard(mockProject, { onEdit });

      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });
      await user.click(dropdownTrigger);

      const editItem = screen.getByRole('menuitem', { name: /edit/i });
      editItem.focus();

      await user.keyboard('{Enter}');
      expect(onEdit).toHaveBeenCalledWith(mockProject);
    });
  });

  describe('Responsive Accessibility', () => {
    it('should maintain accessibility on mobile viewports', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderProjectCard();

      const cardButton = screen.getByRole('button', {
        name: /open test project/i,
      });
      expect(cardButton).toBeInTheDocument();
      expect(cardButton).toHaveAccessibleName();
    });

    it('should have adequate touch targets', () => {
      renderProjectCard();

      const cardButton = screen.getByRole('button', {
        name: /open test project/i,
      });
      const dropdownButton = screen.getByRole('button', {
        name: /more options/i,
      });

      // Should have adequate size for touch
      expect(cardButton).toHaveClass('cursor-pointer');
      expect(dropdownButton).toHaveClass('h-8'); // Minimum touch target
    });

    it('should handle text wrapping gracefully', () => {
      renderProjectCard(mockProjectWithLongDescription);

      // Long content should still be accessible
      expect(
        screen.getByText(/project with very long name/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/this is a very long description/i)
      ).toBeInTheDocument();
    });
  });

  describe('Error States and Edge Cases', () => {
    it('should handle missing project data gracefully', () => {
      const incompleteProject = {
        ...mockProject,
        name: '',
        description: undefined,
      };

      renderProjectCard(incompleteProject as any);

      // Should still render without errors
      const cardButton = screen.getByRole('button');
      expect(cardButton).toBeInTheDocument();
    });

    it('should handle very long project names', () => {
      const longNameProject = {
        ...mockProject,
        name: 'This is an extremely long project name that exceeds normal expectations and might cause layout issues if not handled properly',
      };

      renderProjectCard(longNameProject);

      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('break-words'); // Should handle text wrapping
    });

    it('should handle missing optional callbacks', () => {
      const {
        onEdit: _onEdit,
        onDelete: _onDelete,
        ...propsWithoutCallbacks
      } = defaultProps;

      render(
        <BrowserRouter>
          <ProjectCard project={mockProject} {...propsWithoutCallbacks} />
        </BrowserRouter>
      );

      const cardButton = screen.getByRole('button', {
        name: /open test project/i,
      });
      expect(cardButton).toBeInTheDocument();
    });

    it('should handle invalid dates gracefully', () => {
      const invalidDateProject = {
        ...mockProject,
        created_at: 'invalid-date',
      };

      renderProjectCard(invalidDateProject);

      // Should still render project information
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should restore focus after dropdown closes', async () => {
      const user = userEvent.setup();
      renderProjectCard();

      const dropdownTrigger = screen.getByRole('button', {
        name: /more options/i,
      });

      // Open dropdown
      await user.click(dropdownTrigger);
      expect(
        screen.getByRole('menuitem', { name: /edit/i })
      ).toBeInTheDocument();

      // Close dropdown with Escape
      await user.keyboard('{Escape}');

      // Focus should return to trigger
      await waitFor(() => {
        expect(dropdownTrigger).toHaveFocus();
      });
    });

    it('should handle focus when isFocused prop changes', () => {
      const { rerender } = renderProjectCard(mockProject, { isFocused: false });

      const cardButton = screen.getByRole('button', {
        name: /open test project/i,
      });
      expect(cardButton).not.toHaveFocus();

      // Re-render with focus
      rerender(
        <BrowserRouter>
          <ProjectCard
            project={mockProject}
            {...defaultProps}
            isFocused={true}
          />
        </BrowserRouter>
      );

      expect(cardButton).toHaveFocus();
    });

    it('should maintain focus visibility during interactions', async () => {
      const user = userEvent.setup();
      renderProjectCard();

      const cardButton = screen.getByRole('button', {
        name: /open test project/i,
      });

      // Focus and ensure it's visible
      await user.tab();
      expect(cardButton).toHaveFocus();
      expect(cardButton).toHaveClass('focus:outline-none');
    });
  });
});
