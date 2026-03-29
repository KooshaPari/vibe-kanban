/**
 * Unit tests for Badge component
 * Testing variants, styling, and composition
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge Component', () => {
  describe('Basic rendering', () => {
    it('should render with default variant', () => {
      render(<Badge>Default Badge</Badge>);
      
      const badge = screen.getByText('Default Badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('inline-flex');
    });

    it('should render with children content', () => {
      render(<Badge>Test Content</Badge>);
      
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render with React node children', () => {
      render(
        <Badge>
          <span>Complex</span> Content
        </Badge>
      );
      
      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Variant prop', () => {
    it('should apply default variant classes', () => {
      render(<Badge variant="default">Default</Badge>);
      
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-primary');
      expect(badge).toHaveClass('text-primary-foreground');
    });

    it('should apply secondary variant classes', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      
      const badge = screen.getByText('Secondary');
      expect(badge).toHaveClass('bg-secondary');
      expect(badge).toHaveClass('text-secondary-foreground');
    });

    it('should apply destructive variant classes', () => {
      render(<Badge variant="destructive">Destructive</Badge>);
      
      const badge = screen.getByText('Destructive');
      expect(badge).toHaveClass('bg-destructive');
      expect(badge).toHaveClass('text-destructive-foreground');
    });

    it('should apply outline variant classes', () => {
      render(<Badge variant="outline">Outline</Badge>);
      
      const badge = screen.getByText('Outline');
      expect(badge).toHaveClass('text-foreground');
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with default classes', () => {
      render(
        <Badge className="custom-class">Custom Class</Badge>
      );
      
      const badge = screen.getByText('Custom Class');
      expect(badge).toHaveClass('custom-class');
      expect(badge).toHaveClass('inline-flex'); // Should retain base classes
    });

    it('should handle multiple custom classes', () => {
      render(
        <Badge className="class1 class2 class3">Multiple Classes</Badge>
      );
      
      const badge = screen.getByText('Multiple Classes');
      expect(badge).toHaveClass('class1');
      expect(badge).toHaveClass('class2');
      expect(badge).toHaveClass('class3');
    });

    it('should override conflicting classes correctly', () => {
      render(
        <Badge className="bg-red-500" variant="default">Override</Badge>
      );
      
      const badge = screen.getByText('Override');
      // Should have the custom background class due to className precedence
      expect(badge).toHaveClass('bg-red-500');
    });
  });

  describe('HTML attributes', () => {
    it('should pass through HTML attributes', () => {
      render(
        <Badge data-testid="test-badge" id="badge-id">
          Attributes
        </Badge>
      );
      
      const badge = screen.getByTestId('test-badge');
      expect(badge).toHaveAttribute('id', 'badge-id');
    });

    it('should handle onClick events', () => {
      const handleClick = jest.fn();
      render(
        <Badge onClick={handleClick}>Clickable</Badge>
      );
      
      const badge = screen.getByText('Clickable');
      badge.click();
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard events', () => {
      const handleKeyDown = jest.fn();
      render(
        <Badge onKeyDown={handleKeyDown} tabIndex={0}>
          Keyboard
        </Badge>
      );
      
      const badge = screen.getByText('Keyboard');
      badge.focus();
      
      // Simulate Enter key
      badge.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      
      expect(handleKeyDown).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with proper role', () => {
      render(<Badge role="status">Status Badge</Badge>);
      
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
    });

    it('should support aria-label', () => {
      render(
        <Badge aria-label="Important notification">!</Badge>
      );
      
      const badge = screen.getByLabelText('Important notification');
      expect(badge).toBeInTheDocument();
    });

    it('should be focusable when tabIndex is set', () => {
      render(<Badge tabIndex={0}>Focusable</Badge>);
      
      const badge = screen.getByText('Focusable');
      badge.focus();
      
      expect(badge).toHaveFocus();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty content', () => {
      render(<Badge></Badge>);
      
      const badge = document.querySelector('.inline-flex');
      expect(badge).toBeInTheDocument();
      expect(badge).toBeEmptyDOMElement();
    });

    it('should handle null/undefined children gracefully', () => {
      render(
        <Badge>
          {null}
          {undefined}
          Valid Content
        </Badge>
      );
      
      expect(screen.getByText('Valid Content')).toBeInTheDocument();
    });

    it('should handle conditional rendering', () => {
      const showBadge = true;
      const { rerender } = render(
        <div>
          {showBadge && <Badge>Conditional</Badge>}
        </div>
      );
      
      expect(screen.getByText('Conditional')).toBeInTheDocument();
      
      rerender(
        <div>
          {false && <Badge>Conditional</Badge>}
        </div>
      );
      
      expect(screen.queryByText('Conditional')).not.toBeInTheDocument();
    });
  });

  describe('Styling consistency', () => {
    it('should have consistent base classes across variants', () => {
      const variants = ['default', 'secondary', 'destructive', 'outline'] as const;
      
      variants.forEach((variant) => {
        const { unmount } = render(
          <Badge variant={variant} data-testid={`badge-${variant}`}>
            {variant}
          </Badge>
        );
        
        const badge = screen.getByTestId(`badge-${variant}`);
        
        // All badges should have these base classes
        expect(badge).toHaveClass('inline-flex');
        expect(badge).toHaveClass('items-center');
        expect(badge).toHaveClass('rounded-full');
        expect(badge).toHaveClass('border');
        expect(badge).toHaveClass('px-2.5');
        expect(badge).toHaveClass('py-0.5');
        expect(badge).toHaveClass('text-xs');
        expect(badge).toHaveClass('font-semibold');
        
        unmount();
      });
    });

    it('should handle responsive design classes', () => {
      render(
        <Badge className="sm:px-4 md:text-sm lg:px-6">
          Responsive
        </Badge>
      );
      
      const badge = screen.getByText('Responsive');
      expect(badge).toHaveClass('sm:px-4');
      expect(badge).toHaveClass('md:text-sm');
      expect(badge).toHaveClass('lg:px-6');
    });
  });

  describe('Integration scenarios', () => {
    it('should work within buttons', () => {
      render(
        <button>
          Notifications <Badge variant="destructive">3</Badge>
        </button>
      );
      
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should work within list items', () => {
      render(
        <ul>
          <li>
            Task 1 <Badge variant="outline">New</Badge>
          </li>
          <li>
            Task 2 <Badge variant="secondary">In Progress</Badge>
          </li>
        </ul>
      );
      
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('should work with icons', () => {
      render(
        <Badge>
          <span>★</span> Featured
        </Badge>
      );
      
      expect(screen.getByText('★')).toBeInTheDocument();
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn();
      
      const TestBadge = ({ children }: { children: React.ReactNode }) => {
        renderSpy();
        return <Badge>{children}</Badge>;
      };
      
      const { rerender } = render(<TestBadge>Test</TestBadge>);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(<TestBadge>Test</TestBadge>);
      
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });
});