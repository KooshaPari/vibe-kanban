import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog';

// Mock the keyboard shortcuts hook - let it use the real implementation
jest.mock('@/lib/keyboard-shortcuts', () => ({
  useDialogKeyboardShortcuts: jest.fn((callback) => {
    // Simple mock that just calls the callback when Escape is pressed
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }),
}));

describe('Dialog Accessibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Automated Accessibility Testing', () => {
    it('should not have any accessibility violations when open', async () => {
      const { container } = render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
              <DialogDescription>This is a test dialog</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations with complex content', async () => {
      const { container } = render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complex Dialog</DialogTitle>
              <DialogDescription>Dialog with form elements</DialogDescription>
            </DialogHeader>
            <form>
              <label htmlFor="test-input">Test Input</label>
              <input id="test-input" type="text" />
              <button type="submit">Submit</button>
              <button type="button">Cancel</button>
            </form>
          </DialogContent>
        </Dialog>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations when uncloseable', async () => {
      const { container } = render(
        <Dialog open={true} uncloseable>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Uncloseable Dialog</DialogTitle>
              <DialogDescription>
                This dialog cannot be closed
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close dialog with Escape key', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Escape Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not close uncloseable dialog with Escape key', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange} uncloseable>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Uncloseable Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      await user.keyboard('{Escape}');
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('should focus close button when dialog opens', async () => {
      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Focus Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i });
        expect(closeButton).toHaveFocus();
      });
    });

    it('should trap focus within dialog', async () => {
      const user = userEvent.setup();

      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Focus Trap Test</DialogTitle>
            </DialogHeader>
            <button>First Button</button>
            <button>Second Button</button>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      const firstButton = screen.getByRole('button', { name: /first button/i });
      const secondButton = screen.getByRole('button', {
        name: /second button/i,
      });

      // Focus should start on close button
      await waitFor(() => {
        expect(closeButton).toHaveFocus();
      });

      // Tab should move to first button
      await user.tab();
      await waitFor(() => {
        expect(firstButton).toHaveFocus();
      });

      // Tab again should move to second button
      await user.tab();
      await waitFor(() => {
        expect(secondButton).toHaveFocus();
      });

      // Tab again should cycle back to close button
      await user.tab();
      await waitFor(() => {
        expect(closeButton).toHaveFocus();
      });
    });

    it('should handle reverse tab navigation', async () => {
      const user = userEvent.setup();

      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reverse Tab Test</DialogTitle>
            </DialogHeader>
            <button>Test Button</button>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      const testButton = screen.getByRole('button', { name: /test button/i });

      // Start with close button focused
      await waitFor(() => {
        expect(closeButton).toHaveFocus();
      });

      // Shift+Tab should go to last focusable element
      await user.tab({ shift: true });
      await waitFor(() => {
        expect(testButton).toHaveFocus();
      });
    });

    it('should activate close button with Enter and Space', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Close Button Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      closeButton.focus();

      // Test Enter key
      await user.keyboard('{Enter}');
      expect(onOpenChange).toHaveBeenCalledWith(false);

      // Reset mock
      onOpenChange.mockClear();

      // Test Space key
      await user.keyboard(' ');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should have proper dialog role', () => {
      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Role Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should be labeled by dialog title', async () => {
      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle id="dialog-title">Label Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      await waitFor(() => {
        const dialog = screen.getByRole('dialog', {
          name: /label test dialog/i,
        });
        expect(dialog).toBeInTheDocument();
      });
    });

    it('should be described by dialog description', async () => {
      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Description Test</DialogTitle>
              <DialogDescription id="dialog-desc">
                This dialog has a description
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAccessibleDescription(
          'This dialog has a description'
        );
      });
    });

    it('should announce dialog when opened', () => {
      const { rerender } = render(
        <Dialog open={false} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Announcement Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      // Dialog should not be in document when closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Open dialog
      rerender(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Announcement Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      // Dialog should now be present and accessible
      const dialog = screen.getByRole('dialog', { name: /announcement test/i });
      expect(dialog).toBeInTheDocument();
    });

    it('should have accessible close button', () => {
      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Close Button Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveAccessibleName();
    });

    it('should not render close button when uncloseable', () => {
      render(
        <Dialog open={true} onOpenChange={jest.fn()} uncloseable>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Uncloseable Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.queryByRole('button', { name: /close/i });
      expect(closeButton).not.toBeInTheDocument();
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ARIA Test Dialog</DialogTitle>
              <DialogDescription>Dialog description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('should handle modal attribute correctly', () => {
      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modal Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have proper overlay attributes', () => {
      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Overlay Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      // Overlay should be present but not interfere with screen readers
      const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(overlay).toBeInTheDocument();
    });

    it('should support custom ARIA attributes', () => {
      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent aria-busy="true" aria-live="polite">
            <DialogHeader>
              <DialogTitle>Custom ARIA</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-busy', 'true');
      expect(dialog).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Color Contrast and Focus Indicators', () => {
    it('should have visible focus indicators on close button', async () => {
      const _user = userEvent.setup();

      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Focus Indicator Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });

      // Wait for initial focus to be set on close button
      await waitFor(() => {
        expect(closeButton).toHaveFocus();
      });
      expect(closeButton).toHaveClass('focus:ring-2');
    });

    it('should have proper contrast for dialog content', () => {
      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contrast Test</DialogTitle>
              <DialogDescription>Test description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('bg-background'); // Should have proper background

      const title = screen.getByRole('heading', { name: /contrast test/i });
      expect(title).toBeVisible();
    });

    it('should have adequate overlay contrast', () => {
      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Overlay Contrast</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const overlay = document.querySelector('.bg-black\\/50');
      expect(overlay).toHaveClass('bg-black/50'); // 50% opacity overlay
    });
  });

  describe('Mouse and Touch Interactions', () => {
    it('should close dialog when clicking overlay', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Overlay Click Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
      if (overlay) {
        await user.click(overlay as Element);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      }
    });

    it('should not close uncloseable dialog when clicking overlay', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange} uncloseable>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Uncloseable Overlay Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
      if (overlay) {
        await user.click(overlay as Element);
        expect(onOpenChange).not.toHaveBeenCalled();
      }
    });

    it('should not close when clicking dialog content', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Content Click Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      await user.click(dialog);
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('should close when clicking close button', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Close Button Click Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain accessibility on mobile viewports', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mobile Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveClass('w-full'); // Should be full width on mobile
    });

    it('should handle scrolling content accessibly', () => {
      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Scroll Test</DialogTitle>
            </DialogHeader>
            <div style={{ height: '200vh' }}>
              Very tall content that requires scrolling
            </div>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Container should handle overflow
      const container = dialog.closest('.overflow-y-auto');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Error States and Edge Cases', () => {
    it('should handle missing title gracefully', () => {
      render(
        <Dialog open={true} onOpenChange={jest.fn()}>
          <DialogContent>
            <p>Dialog without title</p>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should handle missing onOpenChange gracefully', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>No Handler Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Close button should still be present
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      render(
        <Dialog open={false} onOpenChange={jest.fn()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Closed Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.queryByRole('dialog');
      expect(dialog).not.toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should restore focus when dialog closes', async () => {
      // Create a button to focus before opening dialog
      const { rerender } = render(
        <div>
          <button>Trigger Button</button>
          <Dialog open={false} onOpenChange={jest.fn()}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Focus Restore Test</DialogTitle>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      );

      const triggerButton = screen.getByRole('button', {
        name: /trigger button/i,
      });
      triggerButton.focus();
      expect(triggerButton).toHaveFocus();

      // Open dialog
      rerender(
        <div>
          <button>Trigger Button</button>
          <Dialog open={true} onOpenChange={jest.fn()}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Focus Restore Test</DialogTitle>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      );

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i });
        expect(closeButton).toHaveFocus();
      });

      // Close dialog
      rerender(
        <div>
          <button>Trigger Button</button>
          <Dialog open={false} onOpenChange={jest.fn()}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Focus Restore Test</DialogTitle>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      );

      // Focus should return to trigger button
      await waitFor(() => {
        expect(triggerButton).toHaveFocus();
      });
    });
  });
});
