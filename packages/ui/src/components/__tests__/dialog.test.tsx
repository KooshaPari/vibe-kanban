import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../dialog';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: ({ className }: { className?: string }) => (
    <div data-testid="x-icon" className={className} />
  ),
}));

// Mock keyboard shortcuts hook
jest.mock('@/lib/keyboard-shortcuts', () => ({
  useDialogKeyboardShortcuts: jest.fn((callback) => {
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          callback();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [callback]);
  }),
}));

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

describe('Dialog Component', () => {
  describe('Basic Rendering', () => {
    it('does not render when open is false', () => {
      render(
        <Dialog open={false}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );

      expect(screen.queryByText('Dialog content')).not.toBeInTheDocument();
    });

    it('renders when open is true', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Dialog content')).toBeInTheDocument();
    });

    it('renders backdrop overlay', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );

      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
    });

    it('renders close button by default', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );

      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('does not render close button when uncloseable is true', () => {
      render(
        <Dialog open={true} uncloseable={true}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );

      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onOpenChange when close button is clicked', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();

      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByTestId('x-icon').closest('button');
      expect(closeButton).toBeInTheDocument();
      await user.click(closeButton);

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onOpenChange when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();

      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );

      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
      await user.click(backdrop);

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not call onOpenChange when backdrop is clicked and uncloseable is true', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();

      render(
        <Dialog open={true} onOpenChange={handleOpenChange} uncloseable={true}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );

      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
      await user.click(backdrop);

      expect(handleOpenChange).not.toHaveBeenCalled();
    });

    it('does not close when clicking inside dialog content', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();

      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogContent>
            <div data-testid="dialog-inner">Dialog content</div>
          </DialogContent>
        </Dialog>
      );

      const dialogContent = screen.getByTestId('dialog-inner');
      await user.click(dialogContent);

      expect(handleOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('calls onOpenChange when Escape key is pressed', async () => {
      const handleOpenChange = jest.fn();

      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('does not call onOpenChange when Escape is pressed and uncloseable is true', async () => {
      const handleOpenChange = jest.fn();

      render(
        <Dialog open={true} onOpenChange={handleOpenChange} uncloseable={true}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(handleOpenChange).not.toHaveBeenCalled();
      });
    });

    it('ignores other keys', async () => {
      const handleOpenChange = jest.fn();

      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Tab' });
      fireEvent.keyDown(document, { key: 'Space' });

      expect(handleOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('Dialog Components', () => {
    describe('DialogHeader', () => {
      it('renders with proper styling', () => {
        render(
          <Dialog open={true}>
            <DialogContent>
              <DialogHeader data-testid="dialog-header">
                Header content
              </DialogHeader>
            </DialogContent>
          </Dialog>
        );

        const header = screen.getByTestId('dialog-header');
        expect(header).toBeInTheDocument();
        expect(header).toHaveClass(
          'flex',
          'flex-col',
          'space-y-1.5',
          'text-center',
          'sm:text-left'
        );
      });

      it('accepts custom className', () => {
        render(
          <Dialog open={true}>
            <DialogContent>
              <DialogHeader
                className="custom-header"
                data-testid="dialog-header"
              >
                Header content
              </DialogHeader>
            </DialogContent>
          </Dialog>
        );

        const header = screen.getByTestId('dialog-header');
        expect(header).toHaveClass('custom-header');
      });
    });

    describe('DialogTitle', () => {
      it('renders as h3 element', () => {
        render(
          <Dialog open={true}>
            <DialogContent>
              <DialogTitle>Dialog Title</DialogTitle>
            </DialogContent>
          </Dialog>
        );

        const title = screen.getByText('Dialog Title');
        expect(title).toBeInTheDocument();
        expect(title.tagName).toBe('H3');
      });

      it('has proper styling classes', () => {
        render(
          <Dialog open={true}>
            <DialogContent>
              <DialogTitle data-testid="dialog-title">Dialog Title</DialogTitle>
            </DialogContent>
          </Dialog>
        );

        const title = screen.getByTestId('dialog-title');
        expect(title).toHaveClass(
          'text-lg',
          'font-semibold',
          'leading-none',
          'tracking-tight'
        );
      });

      it('forwards ref to h3 element', () => {
        const ref = React.createRef<HTMLHeadingElement>();

        render(
          <Dialog open={true}>
            <DialogContent>
              <DialogTitle ref={ref}>Dialog Title</DialogTitle>
            </DialogContent>
          </Dialog>
        );

        expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
        expect(ref.current?.tagName).toBe('H3');
      });
    });

    describe('DialogDescription', () => {
      it('renders as p element', () => {
        render(
          <Dialog open={true}>
            <DialogContent>
              <DialogDescription>Dialog description text</DialogDescription>
            </DialogContent>
          </Dialog>
        );

        const description = screen.getByText('Dialog description text');
        expect(description).toBeInTheDocument();
        expect(description.tagName).toBe('P');
      });

      it('has proper styling classes', () => {
        render(
          <Dialog open={true}>
            <DialogContent>
              <DialogDescription data-testid="dialog-description">
                Dialog description text
              </DialogDescription>
            </DialogContent>
          </Dialog>
        );

        const description = screen.getByTestId('dialog-description');
        expect(description).toHaveClass('text-sm', 'text-muted-foreground');
      });

      it('forwards ref to p element', () => {
        const ref = React.createRef<HTMLParagraphElement>();

        render(
          <Dialog open={true}>
            <DialogContent>
              <DialogDescription ref={ref}>
                Dialog description
              </DialogDescription>
            </DialogContent>
          </Dialog>
        );

        expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
      });
    });

    describe('DialogContent', () => {
      it('renders with proper styling', () => {
        render(
          <Dialog open={true}>
            <DialogContent data-testid="dialog-content">Content</DialogContent>
          </Dialog>
        );

        const content = screen.getByTestId('dialog-content');
        expect(content).toHaveClass('grid', 'gap-4');
      });

      it('accepts custom className', () => {
        render(
          <Dialog open={true}>
            <DialogContent
              className="custom-content"
              data-testid="dialog-content"
            >
              Content
            </DialogContent>
          </Dialog>
        );

        const content = screen.getByTestId('dialog-content');
        expect(content).toHaveClass('custom-content');
      });

      it('forwards ref correctly', () => {
        const ref = React.createRef<HTMLDivElement>();

        render(
          <Dialog open={true}>
            <DialogContent ref={ref}>Content</DialogContent>
          </Dialog>
        );

        expect(ref.current).toBeInstanceOf(HTMLDivElement);
      });
    });

    describe('DialogFooter', () => {
      it('renders with proper styling', () => {
        render(
          <Dialog open={true}>
            <DialogContent>
              <DialogFooter data-testid="dialog-footer">
                Footer content
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );

        const footer = screen.getByTestId('dialog-footer');
        expect(footer).toBeInTheDocument();
        expect(footer).toHaveClass(
          'flex',
          'flex-col-reverse',
          'sm:flex-row',
          'sm:justify-end',
          'sm:space-x-2'
        );
      });

      it('accepts custom className', () => {
        render(
          <Dialog open={true}>
            <DialogContent>
              <DialogFooter
                className="custom-footer"
                data-testid="dialog-footer"
              >
                Footer content
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );

        const footer = screen.getByTestId('dialog-footer');
        expect(footer).toHaveClass('custom-footer');
      });
    });
  });

  describe('Complete Dialog Structure', () => {
    it('renders all components together correctly', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
              <DialogDescription>This is a test dialog</DialogDescription>
            </DialogHeader>
            <div>Main content area</div>
            <DialogFooter>
              <button>Cancel</button>
              <button>OK</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      expect(screen.getByText('This is a test dialog')).toBeInTheDocument();
      expect(screen.getByText('Main content area')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('maintains proper hierarchy and structure', () => {
      render(
        <Dialog open={true}>
          <DialogContent data-testid="dialog-content">
            <DialogHeader data-testid="dialog-header">
              <DialogTitle data-testid="dialog-title">Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const content = screen.getByTestId('dialog-content');
      const header = screen.getByTestId('dialog-header');
      const title = screen.getByTestId('dialog-title');

      expect(content).toContainElement(header);
      expect(header).toContainElement(title);
    });
  });

  describe('Props and Attributes', () => {
    it('passes through custom attributes to main dialog container', () => {
      render(
        <Dialog
          open={true}
          data-testid="custom-dialog"
          aria-labelledby="dialog-title"
          role="alertdialog"
        >
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      const dialog = screen.getByTestId('custom-dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
      expect(dialog).toHaveAttribute('role', 'alertdialog');
    });

    it('applies custom className to dialog container', () => {
      render(
        <Dialog
          open={true}
          className="custom-dialog-class"
          data-testid="custom-dialog"
        >
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      const dialog = screen.getByTestId('custom-dialog');
      expect(dialog).toHaveClass('custom-dialog-class');
    });

    it('forwards ref to dialog container', () => {
      const ref = React.createRef<HTMLDivElement>();

      render(
        <Dialog open={true} ref={ref}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Conditional Rendering', () => {
    it('shows and hides based on open prop changes', () => {
      const { rerender } = render(
        <Dialog open={false}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );

      expect(screen.queryByText('Dialog content')).not.toBeInTheDocument();

      rerender(
        <Dialog open={true}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Dialog content')).toBeInTheDocument();

      rerender(
        <Dialog open={false}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );

      expect(screen.queryByText('Dialog content')).not.toBeInTheDocument();
    });

    it('preserves content when toggling visibility', () => {
      const { rerender } = render(
        <Dialog open={true}>
          <DialogContent>
            <input defaultValue="test value" data-testid="test-input" />
          </DialogContent>
        </Dialog>
      );

      const input = screen.getByTestId('test-input') as HTMLInputElement;
      expect(input.value).toBe('test value');

      rerender(
        <Dialog open={false}>
          <DialogContent>
            <input defaultValue="test value" data-testid="test-input" />
          </DialogContent>
        </Dialog>
      );

      expect(screen.queryByTestId('test-input')).not.toBeInTheDocument();

      rerender(
        <Dialog open={true}>
          <DialogContent>
            <input defaultValue="test value" data-testid="test-input" />
          </DialogContent>
        </Dialog>
      );

      const newInput = screen.getByTestId('test-input') as HTMLInputElement;
      expect(newInput.value).toBe('test value');
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog structure for screen readers', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Accessible Dialog</DialogTitle>
              <DialogDescription>This dialog is accessible</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByText('Accessible Dialog');
      const description = screen.getByText('This dialog is accessible');

      expect(title.tagName).toBe('H3');
      expect(description.tagName).toBe('P');
    });

    it('supports ARIA attributes on title and description', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle id="dialog-title" aria-level={2}>
              Dialog Title
            </DialogTitle>
            <DialogDescription id="dialog-desc" aria-label="Dialog description">
              Dialog description
            </DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByText('Dialog Title');
      const description = screen.getByText('Dialog description');

      expect(title).toHaveAttribute('id', 'dialog-title');
      expect(title).toHaveAttribute('aria-level', '2');
      expect(description).toHaveAttribute('id', 'dialog-desc');
      expect(description).toHaveAttribute('aria-label', 'Dialog description');
    });

    it('has accessible close button', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByTestId('x-icon').closest('button');
      expect(closeButton).toHaveAttribute('type', 'button');

      const srText = closeButton?.querySelector('.sr-only');
      expect(srText).toHaveTextContent('Close');
    });

    it('traps focus within dialog when open', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button>Outside button</button>
          <Dialog open={true}>
            <DialogContent>
              <button data-testid="inside-button-1">Inside 1</button>
              <button data-testid="inside-button-2">Inside 2</button>
            </DialogContent>
          </Dialog>
        </div>
      );

      const outsideButton = screen.getByText('Outside button');

      // Focus should be trapped inside dialog
      await user.tab();
      expect(document.activeElement).not.toBe(outsideButton);
    });
  });

  describe('Styling and Layout', () => {
    it('applies correct z-index for modal overlay', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      const dialogContainer = document.querySelector(
        '.fixed.inset-0.z-\\[9999\\]'
      );
      expect(dialogContainer).toBeInTheDocument();
    });

    it('positions dialog correctly', () => {
      render(
        <Dialog open={true}>
          <DialogContent data-testid="dialog-content">Content</DialogContent>
        </Dialog>
      );

      const dialogContainer = document.querySelector(
        '.fixed.inset-0.z-\\[9999\\]'
      );
      expect(dialogContainer).toHaveClass(
        'flex',
        'items-start',
        'justify-center',
        'p-4',
        'overflow-y-auto'
      );
    });

    it('applies responsive styling', () => {
      render(
        <Dialog open={true}>
          <DialogContent data-testid="dialog-content">Content</DialogContent>
        </Dialog>
      );

      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveClass('sm:rounded-lg');
    });
  });

  describe('Error Handling', () => {
    it('handles missing onOpenChange gracefully', () => {
      // Should not crash when onOpenChange is not provided
      render(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByTestId('x-icon').closest('button');
      expect(closeButton).toBeInTheDocument();
      expect(() => fireEvent.click(closeButton)).not.toThrow();
    });

    it('handles undefined open prop', () => {
      // Should not crash with undefined open prop
      render(
        <Dialog open={undefined as any}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('handles empty children gracefully', () => {
      render(<Dialog open={true}>{null}</Dialog>);

      // Should not crash
      expect(document.querySelector('.fixed.inset-0')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not render content when closed', () => {
      const renderSpy = jest.fn();

      const ExpensiveContent = () => {
        renderSpy();
        return <div>Expensive content</div>;
      };

      render(
        <Dialog open={false}>
          <DialogContent>
            <ExpensiveContent />
          </DialogContent>
        </Dialog>
      );

      expect(renderSpy).not.toHaveBeenCalled();
    });

    it('only renders content when opened', () => {
      const renderSpy = jest.fn();

      const ExpensiveContent = () => {
        renderSpy();
        return <div>Expensive content</div>;
      };

      const { rerender } = render(
        <Dialog open={false}>
          <DialogContent>
            <ExpensiveContent />
          </DialogContent>
        </Dialog>
      );

      expect(renderSpy).not.toHaveBeenCalled();

      rerender(
        <Dialog open={true}>
          <DialogContent>
            <ExpensiveContent />
          </DialogContent>
        </Dialog>
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});
