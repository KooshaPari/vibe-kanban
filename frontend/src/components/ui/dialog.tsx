import * as React from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useDialogKeyboardShortcuts } from '@/lib/keyboard-shortcuts';

// Context for dialog ARIA attributes
const DialogContext = React.createContext<{
  dialogId: string;
  setDialogAriaAttributes: (attrs: Record<string, unknown>) => void;
} | null>(null);

const Dialog = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    uncloseable?: boolean;
  }
>(({ className, open, onOpenChange, children, uncloseable, ...props }, ref) => {
  const dialogId = React.useId();
  const [labelledBy, setLabelledBy] = React.useState<string | undefined>(
    `${dialogId}-title`
  );
  const [describedBy, setDescribedBy] = React.useState<string | undefined>(
    `${dialogId}-description`
  );
  const [dialogAriaAttributes, setDialogAriaAttributes] = React.useState<
    Record<string, unknown>
  >({});
  const previousActiveElement = React.useRef<Element | null>(null);
  const [dialogElement, setDialogElement] =
    React.useState<HTMLDivElement | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const [focusableElements, setFocusableElements] = React.useState<
    HTMLElement[]
  >([]);

  // Store the currently focused element when dialog opens
  React.useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
    } else {
      // Restore focus when dialog closes
      if (
        previousActiveElement.current &&
        previousActiveElement.current instanceof HTMLElement
      ) {
        previousActiveElement.current.focus();
      }
    }
  }, [open]);

  // Separate effect for initial focus to ensure proper timing
  React.useEffect(() => {
    if (open && dialogElement) {
      const focusInitial = () => {
        if (uncloseable) {
          dialogElement.focus();
        } else if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        }
      };

      // Use requestAnimationFrame for better timing
      requestAnimationFrame(focusInitial);
    }
  }, [open, dialogElement, uncloseable]);

  // Scan for title and description elements in children after render
  React.useEffect(() => {
    if (open && dialogElement) {
      const updateAriaAttributes = () => {
        // Look for any heading element in the dialog
        const titleElement = dialogElement.querySelector(
          'h1, h2, h3, h4, h5, h6'
        );
        // Look for any paragraph or description element
        const descElement = dialogElement.querySelector('p:not(.sr-only)');

        if (titleElement?.id) {
          setLabelledBy(titleElement.id);
        } else {
          setLabelledBy(`${dialogId}-title`);
        }

        if (descElement?.id) {
          setDescribedBy(descElement.id);
        } else {
          setDescribedBy(`${dialogId}-description`);
        }
      };

      // Use requestAnimationFrame for better timing
      requestAnimationFrame(updateAriaAttributes);
    }
  }, [open, children, dialogElement, dialogId]);
  // Add keyboard shortcut support for closing dialog with Esc
  useDialogKeyboardShortcuts(() => {
    if (open && onOpenChange && !uncloseable) {
      onOpenChange(false);
    }
  });

  // Update focusable elements list when dialog content changes
  React.useEffect(() => {
    if (!open || !dialogElement) return;

    const updateFocusableElements = () => {
      const elements = dialogElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;

      setFocusableElements(
        Array.from(elements).filter(
          (el) =>
            !(
              el as
                | HTMLInputElement
                | HTMLButtonElement
                | HTMLSelectElement
                | HTMLTextAreaElement
            ).disabled && !el.hasAttribute('aria-hidden')
        )
      );
    };

    // Use requestAnimationFrame for better timing
    requestAnimationFrame(updateFocusableElements);
  }, [open, dialogElement, children]);

  // Focus trap implementation
  React.useEffect(() => {
    if (!open || focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [open, focusableElements]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => (uncloseable ? {} : onOpenChange?.(false))}
      />
      <div
        ref={(node) => {
          setDialogElement(node);
          if (ref) {
            if (typeof ref === 'function') {
              ref(node);
            } else if ('current' in ref) {
              // Type assertion to help TypeScript understand this is assignable
              (ref as { current: HTMLDivElement | null }).current = node;
            }
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={cn(
          'relative z-[9999] grid w-full max-w-lg gap-4 bg-background p-6 shadow-lg duration-200 sm:rounded-lg my-8',
          className
        )}
        {...dialogAriaAttributes}
        {...props}
      >
        {!uncloseable && (
          <button
            ref={closeButtonRef}
            type="button"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => onOpenChange?.(false)}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>
        )}
        <DialogContext.Provider value={{ dialogId, setDialogAriaAttributes }}>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                ...child.props,
                'data-dialog-id': dialogId,
              });
            }
            return child;
          })}
        </DialogContext.Provider>
      </div>
    </div>
  );
});
Dialog.displayName = 'Dialog';

// Dialog context removed as it was unused

const DialogHeader = ({
  className,
  'data-dialog-id': dialogId,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { 'data-dialog-id'?: string }) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  >
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          ...child.props,
          'data-dialog-id': dialogId,
        });
      }
      return child;
    })}
  </div>
);
DialogHeader.displayName = 'DialogHeader';

const DialogTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & { 'data-dialog-id'?: string }
>(({ className, id, 'data-dialog-id': dialogId, ...props }, ref) => {
  const titleId = id || (dialogId ? `${dialogId}-title` : undefined);
  return (
    <h3
      ref={ref}
      id={titleId}
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  );
});
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { 'data-dialog-id'?: string }
>(({ className, id, 'data-dialog-id': dialogId, ...props }, ref) => {
  const descId = id || (dialogId ? `${dialogId}-description` : undefined);
  return (
    <p
      ref={ref}
      id={descId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
DialogDescription.displayName = 'DialogDescription';

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 'data-dialog-id'?: string }
>(({ className, 'data-dialog-id': dialogId, children, ...props }, ref) => {
  const dialogContext = React.useContext(DialogContext);

  // Separate ARIA attributes from other props
  const ariaProps: Record<string, unknown> = {};
  const nonAriaProps: Record<string, unknown> = {};

  Object.entries(props).forEach(([key, value]) => {
    if (key.startsWith('aria-')) {
      ariaProps[key] = value;
    } else {
      nonAriaProps[key] = value;
    }
  });

  // Pass ARIA attributes to dialog on mount
  React.useEffect(() => {
    if (dialogContext && Object.keys(ariaProps).length > 0) {
      dialogContext.setDialogAriaAttributes(ariaProps);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  return (
    <div ref={ref} className={cn('grid gap-4', className)} {...nonAriaProps}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            'data-dialog-id': dialogId,
          });
        }
        return child;
      })}
    </div>
  );
});
DialogContent.displayName = 'DialogContent';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
};
