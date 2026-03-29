/**
 * Unit tests for Card components
 * Testing Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render basic card', () => {
      render(<Card data-testid="card">Card Content</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('Card Content');
    });

    it('should have proper CSS classes', () => {
      render(<Card data-testid="card">Content</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('bg-card');
      expect(card).toHaveClass('text-card-foreground');
      expect(card).toHaveClass('shadow-sm');
    });

    it('should accept custom className', () => {
      render(<Card className="custom-card" data-testid="card">Content</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-card');
    });

    it('should pass through HTML attributes', () => {
      render(
        <Card data-testid="card" id="test-card" role="region">
          Content
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('id', 'test-card');
      expect(card).toHaveAttribute('role', 'region');
    });
  });

  describe('CardHeader', () => {
    it('should render card header', () => {
      render(
        <Card>
          <CardHeader data-testid="header">Header Content</CardHeader>
        </Card>
      );
      
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent('Header Content');
    });

    it('should have proper spacing classes', () => {
      render(
        <Card>
          <CardHeader data-testid="header">Header</CardHeader>
        </Card>
      );
      
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('space-y-1.5');
      expect(header).toHaveClass('p-6');
    });
  });

  describe('CardTitle', () => {
    it('should render card title', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
        </Card>
      );
      
      const title = screen.getByText('Test Title');
      expect(title).toBeInTheDocument();
    });

    it('should have proper typography classes', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle data-testid="title">Title</CardTitle>
          </CardHeader>
        </Card>
      );
      
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-2xl');
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('leading-none');
      expect(title).toHaveClass('tracking-tight');
    });

    it('should accept custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle className="custom-title" data-testid="title">
              Title
            </CardTitle>
          </CardHeader>
        </Card>
      );
      
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('CardDescription', () => {
    it('should render card description', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
        </Card>
      );
      
      const description = screen.getByText('Test Description');
      expect(description).toBeInTheDocument();
    });

    it('should have proper styling classes', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription data-testid="description">
              Description
            </CardDescription>
          </CardHeader>
        </Card>
      );
      
      const description = screen.getByTestId('description');
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('text-muted-foreground');
    });
  });

  describe('CardContent', () => {
    it('should render card content', () => {
      render(
        <Card>
          <CardContent data-testid="content">Content Area</CardContent>
        </Card>
      );
      
      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Content Area');
    });

    it('should have proper padding classes', () => {
      render(
        <Card>
          <CardContent data-testid="content">Content</CardContent>
        </Card>
      );
      
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('p-6');
      expect(content).toHaveClass('pt-0');
    });
  });

  describe('CardFooter', () => {
    it('should render card footer', () => {
      render(
        <Card>
          <CardFooter data-testid="footer">Footer Content</CardFooter>
        </Card>
      );
      
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveTextContent('Footer Content');
    });

    it('should have proper layout classes', () => {
      render(
        <Card>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );
      
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('items-center');
      expect(footer).toHaveClass('p-6');
      expect(footer).toHaveClass('pt-0');
    });
  });

  describe('Complete card composition', () => {
    it('should render complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content of the card.</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );
      
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should work with nested content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>
              <span>Complex</span> Title
            </CardTitle>
            <CardDescription>
              Description with <strong>emphasis</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <h3>Subsection</h3>
              <p>Paragraph content</p>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex gap-2">
              <button>Cancel</button>
              <button>Save</button>
            </div>
          </CardFooter>
        </Card>
      );
      
      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('emphasis')).toBeInTheDocument();
      expect(screen.getByText('Subsection')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support ARIA attributes', () => {
      render(
        <Card
          role="article"
          aria-labelledby="card-title"
          data-testid="accessible-card"
        >
          <CardHeader>
            <CardTitle id="card-title">Accessible Card</CardTitle>
          </CardHeader>
          <CardContent>Content here</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('accessible-card');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-labelledby', 'card-title');
      
      const title = screen.getByText('Accessible Card');
      expect(title).toHaveAttribute('id', 'card-title');
    });

    it('should be keyboard navigable when interactive', () => {
      render(
        <Card tabIndex={0} data-testid="focusable-card">
          <CardContent>Focusable card</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('focusable-card');
      card.focus();
      expect(card).toHaveFocus();
    });
  });

  describe('Responsive behavior', () => {
    it('should work with responsive classes', () => {
      render(
        <Card className="w-full md:w-1/2 lg:w-1/3" data-testid="responsive-card">
          <CardContent>Responsive card</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('responsive-card');
      expect(card).toHaveClass('w-full');
      expect(card).toHaveClass('md:w-1/2');
      expect(card).toHaveClass('lg:w-1/3');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty content', () => {
      render(
        <Card data-testid="empty-card">
          <CardHeader></CardHeader>
          <CardContent></CardContent>
          <CardFooter></CardFooter>
        </Card>
      );
      
      const card = screen.getByTestId('empty-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle missing optional components', () => {
      render(
        <Card data-testid="minimal-card">
          <CardContent>Just content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('minimal-card');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Just content')).toBeInTheDocument();
    });

    it('should handle conditional rendering', () => {
      const showDescription = false;
      
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            {showDescription && <CardDescription>Hidden Description</CardDescription>}
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.queryByText('Hidden Description')).not.toBeInTheDocument();
    });
  });
});