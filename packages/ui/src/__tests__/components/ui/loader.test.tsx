/**
 * Unit tests for Loader component
 * Testing loading states and accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Loader } from '@/components/ui/loader';

describe('Loader Component', () => {
  describe('Basic rendering', () => {
    it('should render loader with default spinner', () => {
      render(<Loader />);
      
      const loader = screen.getByTestId('loader');
      expect(loader).toBeInTheDocument();
    });

    it('should have proper CSS classes for animation', () => {
      render(<Loader />);
      
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('animate-spin');
    });

    it('should be visible by default', () => {
      render(<Loader />);
      
      const loader = screen.getByTestId('loader');
      expect(loader).toBeVisible();
    });
  });

  describe('Size variations', () => {
    it('should handle different size props', () => {
      const { rerender } = render(<Loader size={16} />);
      
      let loader = screen.getByTestId('loader');
      expect(loader).toHaveStyle({ width: '16px', height: '16px' });

      rerender(<Loader size={32} />);
      loader = screen.getByTestId('loader');
      expect(loader).toHaveStyle({ width: '32px', height: '32px' });
    });

    it('should use default size when no size prop provided', () => {
      render(<Loader />);
      
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('h-4', 'w-4');
    });
  });

  describe('Custom styling', () => {
    it('should accept custom className', () => {
      render(<Loader className="custom-loader-class" />);
      
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('custom-loader-class');
    });

    it('should merge custom classes with default classes', () => {
      render(<Loader className="text-blue-500" />);
      
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('text-blue-500');
      expect(loader).toHaveClass('animate-spin');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Loader />);
      
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('role', 'status');
      expect(loader).toHaveAttribute('aria-label', 'Loading');
    });

    it('should be screen reader accessible', () => {
      render(<Loader />);
      
      const loader = screen.getByLabelText('Loading');
      expect(loader).toBeInTheDocument();
    });
  });

  describe('Integration scenarios', () => {
    it('should work within buttons', () => {
      render(
        <button disabled>
          <Loader /> Loading...
        </button>
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should work as overlay loader', () => {
      render(
        <div className="relative">
          <div>Content</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader />
          </div>
        </div>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });
  });
});