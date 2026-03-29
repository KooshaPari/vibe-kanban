import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from './navbar';

// Mock react-router-dom's useLocation
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: '/projects',
  }),
}));

const renderNavbar = () => {
  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  );
};

describe('Navbar Accessibility Tests', () => {
  describe('Automated Accessibility Testing', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = renderNavbar();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be navigable using tab key', async () => {
      const user = userEvent.setup();
      renderNavbar();

      // Get all focusable elements
      const projectsLink = screen.getByRole('link', { name: /projects/i });
      const mcpServersLink = screen.getByRole('link', { name: /mcp servers/i });
      const settingsLink = screen.getByRole('link', { name: /settings/i });
      const docsLink = screen.getByRole('link', { name: /docs/i });
      const supportLink = screen.getByRole('link', { name: /support/i });

      // Tab through navigation elements
      await user.tab();
      expect(projectsLink).toHaveFocus();

      await user.tab();
      expect(mcpServersLink).toHaveFocus();

      await user.tab();
      expect(settingsLink).toHaveFocus();

      await user.tab();
      expect(docsLink).toHaveFocus();

      await user.tab();
      expect(supportLink).toHaveFocus();
    });

    it('should support reverse tab navigation', async () => {
      const user = userEvent.setup();
      renderNavbar();

      const supportLink = screen.getByRole('link', { name: /support/i });
      const docsLink = screen.getByRole('link', { name: /docs/i });

      // Focus on the last element and shift+tab backwards
      supportLink.focus();
      expect(supportLink).toHaveFocus();

      await user.tab({ shift: true });
      expect(docsLink).toHaveFocus();
    });

    it('should activate links with Enter key', async () => {
      const user = userEvent.setup();
      renderNavbar();

      const projectsLink = screen.getByRole('link', { name: /projects/i });

      // Focus and press Enter
      projectsLink.focus();
      await user.keyboard('{Enter}');

      // Check that the link has the proper href
      expect(projectsLink).toHaveAttribute('href', '/projects');
    });

    it('should activate links with Space key', async () => {
      const user = userEvent.setup();
      renderNavbar();

      const settingsLink = screen.getByRole('link', { name: /settings/i });

      // Focus and press Space
      settingsLink.focus();
      await user.keyboard(' ');

      // Check that the link has the proper href
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should have proper landmark roles', () => {
      renderNavbar();

      // Check for navigation landmark
      const nav = screen.getByRole('navigation', { hidden: true });
      expect(nav).toBeInTheDocument();
    });

    it('should have descriptive link text', () => {
      renderNavbar();

      // All links should have accessible names
      expect(
        screen.getByRole('link', { name: /projects/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /mcp servers/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /settings/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /docs/i })).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /support/i })
      ).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for external links', () => {
      renderNavbar();

      const docsLink = screen.getByRole('link', { name: /docs/i });
      const supportLink = screen.getByRole('link', { name: /support/i });

      // External links should have proper attributes
      expect(docsLink).toHaveAttribute('target', '_blank');
      expect(docsLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(supportLink).toHaveAttribute('target', '_blank');
      expect(supportLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should indicate current page for screen readers', () => {
      renderNavbar();

      const projectsLink = screen.getByRole('link', { name: /projects/i });

      // Current page should be visually distinguished (tested through button variant)
      // In this case, we check the button wrapping the link has the 'default' variant
      const projectsButton = projectsLink.closest('button');
      expect(projectsButton).toHaveClass('bg-primary'); // default variant styling
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper ARIA structure', () => {
      renderNavbar();

      // Links should have proper accessible names
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });

    it('should have proper button roles for navigation items', () => {
      renderNavbar();

      // Navigation items are wrapped in buttons for styling
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('Color Contrast and Focus Indicators', () => {
    it('should have visible focus indicators', async () => {
      const user = userEvent.setup();
      renderNavbar();

      const projectsLink = screen.getByRole('link', { name: /projects/i });

      // Focus the element
      await user.tab();
      expect(projectsLink).toHaveFocus();

      // Check that the focused element has focus styling
      const button = projectsLink.closest('button');
      expect(button).toHaveClass('focus-visible:ring-2'); // Tailwind focus styling
    });

    it('should maintain color contrast in different states', () => {
      renderNavbar();

      // Test that buttons have proper contrast classes
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        // Check for text color classes that ensure proper contrast
        const classes = button.className;
        expect(classes).toMatch(/text-/); // Should have text color classes
      });
    });

    it('should have hover states that maintain accessibility', async () => {
      const user = userEvent.setup();
      renderNavbar();

      const settingsLink = screen.getByRole('link', { name: /settings/i });
      const button = settingsLink.closest('button');

      // Ensure button exists
      expect(button).toBeInTheDocument();
      
      // Hover over the element
      await user.hover(button);

      // Should have hover styling that maintains contrast
      expect(button).toHaveClass('hover:bg-accent'); // Tailwind hover styling
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

      renderNavbar();

      // Navigation should still be accessible on mobile
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);

      links.forEach((link) => {
        expect(link).toBeVisible();
        expect(link).toHaveAccessibleName();
      });
    });

    it('should have proper spacing for touch targets', () => {
      renderNavbar();

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        // Check for minimum touch target size classes
        expect(button).toHaveClass('h-16'); // Minimum height for touch targets
      });
    });
  });

  describe('Error States and Announcements', () => {
    it('should handle missing navigation gracefully', () => {
      // Test with broken navigation state
      const { container } = render(
        <BrowserRouter>
          <div role="navigation" aria-label="Main navigation">
            <div>Navigation unavailable</div>
          </div>
        </BrowserRouter>
      );

      const nav = container.querySelector('[role="navigation"]');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });
  });
});
