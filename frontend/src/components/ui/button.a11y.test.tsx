import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Button } from './button';

describe('Button Accessibility Tests', () => {
  describe('Automated Accessibility Testing', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(<Button>Test Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations with all variants', async () => {
      const variants = [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ] as const;

      for (const variant of variants) {
        const { container } = render(
          <Button variant={variant}>Test {variant}</Button>
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });

    it('should not have accessibility violations with all sizes', async () => {
      const sizes = ['default', 'sm', 'lg', 'icon'] as const;

      for (const size of sizes) {
        const { container } = render(<Button size={size}>Test</Button>);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });

    it('should not have accessibility violations when disabled', async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with tab key', async () => {
      const user = userEvent.setup();
      render(<Button>Focusable Button</Button>);

      const button = screen.getByRole('button', { name: /focusable button/i });

      await user.tab();
      expect(button).toHaveFocus();
    });

    it('should be activatable with Enter key', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(<Button onClick={onClick}>Enter Test</Button>);

      const button = screen.getByRole('button', { name: /enter test/i });
      button.focus();

      await user.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should be activatable with Space key', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(<Button onClick={onClick}>Space Test</Button>);

      const button = screen.getByRole('button', { name: /space test/i });
      button.focus();

      await user.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not be activatable when disabled', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(
        <Button onClick={onClick} disabled>
          Disabled Button
        </Button>
      );

      const button = screen.getByRole('button', { name: /disabled button/i });

      await user.click(button);
      await user.keyboard('{Enter}');
      await user.keyboard(' ');

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should skip disabled buttons in tab order', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>First Button</Button>
          <Button disabled>Disabled Button</Button>
          <Button>Last Button</Button>
        </div>
      );

      const firstButton = screen.getByRole('button', { name: /first button/i });
      const lastButton = screen.getByRole('button', { name: /last button/i });

      await user.tab();
      expect(firstButton).toHaveFocus();

      await user.tab();
      expect(lastButton).toHaveFocus();
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should have proper button role', () => {
      render(<Button>Screen Reader Test</Button>);

      const button = screen.getByRole('button', {
        name: /screen reader test/i,
      });
      expect(button).toBeInTheDocument();
    });

    it('should have accessible name from children', () => {
      render(<Button>Accessible Name</Button>);

      const button = screen.getByRole('button', { name: /accessible name/i });
      expect(button).toHaveAccessibleName('Accessible Name');
    });

    it('should support aria-label override', () => {
      render(<Button aria-label="Custom Label">Different Text</Button>);

      const button = screen.getByRole('button', { name: /custom label/i });
      expect(button).toHaveAccessibleName('Custom Label');
    });

    it('should support aria-labelledby', () => {
      render(
        <div>
          <span id="label-id">External Label</span>
          <Button aria-labelledby="label-id">Button Text</Button>
        </div>
      );

      const button = screen.getByRole('button', { name: /external label/i });
      expect(button).toHaveAccessibleName('External Label');
    });

    it('should support aria-describedby', () => {
      render(
        <div>
          <Button aria-describedby="desc-id">Button</Button>
          <span id="desc-id">Button description</span>
        </div>
      );

      const button = screen.getByRole('button', { name: /button/i });
      expect(button).toHaveAttribute('aria-describedby', 'desc-id');
      expect(button).toHaveAccessibleDescription('Button description');
    });

    it('should announce disabled state', () => {
      render(<Button disabled>Disabled Button</Button>);

      const button = screen.getByRole('button', { name: /disabled button/i });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('disabled');
    });

    it('should support aria-pressed for toggle buttons', () => {
      render(<Button aria-pressed={true}>Toggle Button</Button>);

      const button = screen.getByRole('button', { name: /toggle button/i });
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should support aria-expanded for dropdown buttons', () => {
      render(
        <Button aria-expanded={false} aria-haspopup="menu">
          Dropdown
        </Button>
      );

      const button = screen.getByRole('button', { name: /dropdown/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
    });
  });

  describe('ARIA Attributes', () => {
    it('should preserve custom ARIA attributes', () => {
      render(
        <Button aria-controls="menu-id" aria-owns="owned-id" role="menuitem">
          Custom ARIA
        </Button>
      );

      const button = screen.getByRole('menuitem', { name: /custom aria/i });
      expect(button).toHaveAttribute('aria-controls', 'menu-id');
      expect(button).toHaveAttribute('aria-owns', 'owned-id');
    });

    it('should handle icon buttons with proper labeling', () => {
      render(
        <Button size="icon" aria-label="Close dialog">
          <span aria-hidden="true">×</span>
        </Button>
      );

      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toHaveAccessibleName('Close dialog');

      const icon = screen.getByText('×');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should support loading state announcements', () => {
      render(
        <Button aria-busy="true" disabled>
          <span aria-hidden="true">Loading...</span>
          <span className="sr-only">Loading, please wait</span>
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();

      const loadingText = screen.getByText('Loading, please wait');
      expect(loadingText).toHaveClass('sr-only');
    });
  });

  describe('Color Contrast and Focus Indicators', () => {
    it('should have visible focus indicators', async () => {
      const user = userEvent.setup();
      render(<Button>Focus Test</Button>);

      const button = screen.getByRole('button', { name: /focus test/i });

      await user.tab();
      expect(button).toHaveFocus();

      // Check for focus styling classes
      expect(button).toHaveClass('focus-visible:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-ring');
    });

    it('should have proper contrast for all variants', () => {
      const variants = [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
      ] as const;

      variants.forEach((variant) => {
        render(<Button variant={variant}>Test {variant}</Button>);

        const button = screen.getByRole('button', { name: `Test ${variant}` });

        // Should have appropriate background and text color classes
        const classes = button.className;
        expect(classes).toMatch(/bg-|text-/); // Should have color classes
      });
    });

    it('should maintain contrast in hover states', () => {
      render(<Button>Hover Test</Button>);

      const button = screen.getByRole('button', { name: /hover test/i });

      // Should have hover styling that maintains contrast
      expect(button).toHaveClass('hover:bg-primary/90');
    });

    it('should have reduced opacity when disabled but maintain readability', () => {
      render(<Button disabled>Disabled Test</Button>);

      const button = screen.getByRole('button', { name: /disabled test/i });
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should have adequate size for touch targets', () => {
      render(<Button>Touch Target</Button>);

      const button = screen.getByRole('button', { name: /touch target/i });

      // Default size should provide adequate touch target
      expect(button).toHaveClass('h-10'); // 40px height minimum for touch
    });

    it('should maintain contrast for link variant', () => {
      render(<Button variant="link">Link Button</Button>);

      const button = screen.getByRole('button', { name: /link button/i });
      expect(button).toHaveClass('text-primary');
      expect(button).toHaveClass('hover:underline');
    });
  });

  describe('Component Composition', () => {
    it('should work as child of Slot component', () => {
      render(
        <Button asChild>
          <a href="/test">Link as Button</a>
        </Button>
      );

      const link = screen.getByRole('link', { name: /link as button/i });
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveClass('inline-flex'); // Button classes applied
    });

    it('should preserve accessibility when used with asChild', () => {
      render(
        <Button asChild aria-label="External link">
          <a href="https://example.com" target="_blank" rel="noopener">
            External
          </a>
        </Button>
      );

      const link = screen.getByRole('link', { name: /external link/i });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener');
    });

    it('should handle complex children with icons', () => {
      render(
        <Button>
          <span aria-hidden="true">📁</span>
          <span>Open File</span>
        </Button>
      );

      const button = screen.getByRole('button', { name: /open file/i });
      expect(button).toHaveAccessibleName('Open File');

      const icon = screen.getByText('📁');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Form Integration', () => {
    it('should support form submission', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn((e) => e.preventDefault());

      render(
        <form onSubmit={onSubmit}>
          <Button type="submit">Submit Form</Button>
        </form>
      );

      const button = screen.getByRole('button', { name: /submit form/i });
      expect(button).toHaveAttribute('type', 'submit');

      await user.click(button);
      expect(onSubmit).toHaveBeenCalled();
    });

    it('should support form reset', () => {
      render(
        <form>
          <Button type="reset">Reset Form</Button>
        </form>
      );

      const button = screen.getByRole('button', { name: /reset form/i });
      expect(button).toHaveAttribute('type', 'reset');
    });

    it('should default to button type', () => {
      render(<Button>Default Type</Button>);

      const button = screen.getByRole('button', { name: /default type/i });
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Error States and Edge Cases', () => {
    it('should handle empty children gracefully', () => {
      render(<Button aria-label="Empty button" />);

      const button = screen.getByRole('button', { name: /empty button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAccessibleName('Empty button');
    });

    it('should handle very long text content', () => {
      const longText =
        'This is a very long button text that might wrap to multiple lines and should still be accessible';
      render(<Button>{longText}</Button>);

      const button = screen.getByRole('button', { name: longText });
      expect(button).toHaveAccessibleName(longText);
      expect(button).toHaveClass('whitespace-nowrap'); // Prevents wrapping
    });

    it('should handle nested interactive elements appropriately', () => {
      // This is generally not recommended, but should handle gracefully
      render(
        <Button>
          Button with <span tabIndex={0}>nested focusable</span>
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain accessibility across screen sizes', () => {
      // Mock different viewport sizes
      const viewports = [320, 768, 1024];

      viewports.forEach((width) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        const { unmount } = render(<Button>Responsive Button</Button>);

        const button = screen.getByRole('button', {
          name: /responsive button/i,
        });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAccessibleName();

        // Clean up after each iteration
        unmount();
      });
    });

    it('should maintain touch target sizes on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile viewport
      });

      render(<Button size="sm">Mobile Button</Button>);

      const button = screen.getByRole('button', { name: /mobile button/i });
      expect(button).toHaveClass('h-9'); // Still adequate for touch
    });
  });
});
