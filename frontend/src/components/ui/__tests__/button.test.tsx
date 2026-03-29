import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Button } from '../button';
import { buttonVariants } from '@/lib/button-variants';

// Mock Radix UI Slot
jest.mock('@radix-ui/react-slot', () => ({
  Slot: React.forwardRef<
    HTMLElement,
    { children?: React.ReactNode; [key: string]: unknown }
  >(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="slot" {...props}>
      {children}
    </div>
  )),
}));

// Mock class-variance-authority
jest.mock('class-variance-authority', () => ({
  cva: jest.fn(() => jest.fn((props) => `mock-class ${JSON.stringify(props)}`)),
}));

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('renders a button element by default', () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveTextContent('Click me');
    });

    it('renders with custom className', () => {
      render(<Button className="custom-class">Button</Button>);

      const button = screen.getByRole('button');
      // Check that custom class is present alongside mocked cva classes
      expect(button.className).toContain('custom-class');
    });

    it('forwards ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Button</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toHaveTextContent('Button');
    });

    it('renders as Slot component when asChild is true', () => {
      render(<Button asChild>Button</Button>);

      expect(screen.getByTestId('slot')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('renders with default variant', () => {
      render(<Button>Default</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders with destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders with outline variant', () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders with ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders with link variant', () => {
      render(<Button variant="link">Link</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('renders with default size', () => {
      render(<Button>Default Size</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders with small size', () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders with large size', () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders with icon size', () => {
      render(<Button size="icon">📄</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick with mouse click event', () => {
      const handleClick = jest.fn();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('can be focused with keyboard navigation', async () => {
      const user = userEvent.setup();

      render(<Button>Focusable</Button>);

      const button = screen.getByRole('button');
      await user.tab();

      expect(button).toHaveFocus();
    });

    it('can be activated with Enter key', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(<Button onClick={handleClick}>Enter to click</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be activated with Space key', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(<Button onClick={handleClick}>Space to click</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('HTML Attributes', () => {
    it('passes through standard button attributes', () => {
      render(
        <Button
          type="submit"
          disabled
          aria-label="Submit form"
          data-testid="submit-button"
        >
          Submit
        </Button>
      );

      const button = screen.getByTestId('submit-button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-label', 'Submit form');
    });

    it('supports custom data attributes', () => {
      render(
        <Button data-analytics="button-click" data-value="123">
          Custom
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-analytics', 'button-click');
      expect(button).toHaveAttribute('data-value', '123');
    });

    it('supports form attributes', () => {
      render(
        <Button form="my-form" formAction="/submit">
          Submit
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('form', 'my-form');
      expect(button).toHaveAttribute('formAction', '/submit');
    });
  });

  describe('Disabled State', () => {
    it('renders as disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('has correct aria attributes when disabled', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });

    it('is not focusable when disabled', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <Button>Enabled</Button>
          <Button disabled>Disabled</Button>
        </div>
      );

      await user.tab();
      expect(screen.getByText('Enabled')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Disabled')).not.toHaveFocus();
    });
  });

  describe('Content Types', () => {
    it('renders text content', () => {
      render(<Button>Simple text</Button>);

      expect(screen.getByText('Simple text')).toBeInTheDocument();
    });

    it('renders with icon content', () => {
      render(<Button>🚀 Launch</Button>);

      expect(screen.getByText('🚀 Launch')).toBeInTheDocument();
    });

    it('renders with JSX children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );

      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('renders with complex nested content', () => {
      render(
        <Button>
          <div>
            <strong>Bold</strong>
            <em>Italic</em>
          </div>
        </Button>
      );

      expect(screen.getByText('Bold')).toBeInTheDocument();
      expect(screen.getByText('Italic')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty content', () => {
      render(<Button />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('');
    });

    it('handles null children', () => {
      render(<Button>{null}</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('handles undefined children', () => {
      render(<Button>{undefined}</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('handles boolean children', () => {
      render(<Button>{false}</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('handles numeric children', () => {
      render(<Button>{42}</Button>);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('handles special characters in content', () => {
      render(<Button>&lt;script&gt;alert('xss')&lt;/script&gt;</Button>);

      expect(
        screen.getByText("<script>alert('xss')</script>")
      ).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('handles onMouseDown event', () => {
      const handleMouseDown = jest.fn();

      render(<Button onMouseDown={handleMouseDown}>Mouse Down</Button>);

      const button = screen.getByRole('button');
      fireEvent.mouseDown(button);

      expect(handleMouseDown).toHaveBeenCalledTimes(1);
    });

    it('handles onMouseUp event', () => {
      const handleMouseUp = jest.fn();

      render(<Button onMouseUp={handleMouseUp}>Mouse Up</Button>);

      const button = screen.getByRole('button');
      fireEvent.mouseUp(button);

      expect(handleMouseUp).toHaveBeenCalledTimes(1);
    });

    it('handles onFocus event', async () => {
      const user = userEvent.setup();
      const handleFocus = jest.fn();

      render(<Button onFocus={handleFocus}>Focus</Button>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('handles onBlur event', async () => {
      const user = userEvent.setup();
      const handleBlur = jest.fn();

      render(
        <div>
          <Button onBlur={handleBlur}>Blur me</Button>
          <Button>Other button</Button>
        </div>
      );

      const firstButton = screen.getByText('Blur me');
      const secondButton = screen.getByText('Other button');

      await user.click(firstButton);
      await user.click(secondButton);

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('handles multiple event handlers', () => {
      const handleClick = jest.fn();
      const handleMouseDown = jest.fn();
      const handleMouseUp = jest.fn();

      render(
        <Button
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          Multiple events
        </Button>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseDown(button);
      fireEvent.mouseUp(button);
      fireEvent.click(button);

      expect(handleMouseDown).toHaveBeenCalledTimes(1);
      expect(handleMouseUp).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper button role', () => {
      render(<Button>Accessible button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Button aria-label="Close dialog">×</Button>);

      const button = screen.getByLabelText('Close dialog');
      expect(button).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      render(
        <div>
          <Button aria-describedby="help-text">Submit</Button>
          <div id="help-text">This will submit the form</div>
        </div>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('supports aria-expanded for dropdowns', () => {
      render(
        <Button aria-expanded={true} aria-haspopup="menu">
          Menu
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('supports aria-pressed for toggle buttons', () => {
      render(<Button aria-pressed={true}>Toggle</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('has visible focus indicator', async () => {
      const user = userEvent.setup();

      render(<Button>Focus me</Button>);

      const button = screen.getByRole('button');
      await user.tab();

      expect(button).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();

      const TestButton = React.memo(() => {
        renderSpy();
        return <Button>Memo button</Button>;
      });

      const { rerender } = render(<TestButton />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestButton />);
      expect(renderSpy).toHaveBeenCalledTimes(1); // Should not re-render
    });

    it('handles rapid clicking without issues', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(<Button onClick={handleClick}>Rapid click</Button>);

      const button = screen.getByRole('button');

      // Simulate rapid clicking
      await user.click(button);
      await user.click(button);
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(5);
    });
  });

  describe('Style Application', () => {
    it('applies inline styles correctly', () => {
      render(
        <Button style={{ backgroundColor: 'red', color: 'white' }}>
          Styled button
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveStyle('background-color: red');
      expect(button).toHaveStyle('color: white');
    });

    it('combines className with variant classes', () => {
      render(
        <Button className="custom-class" variant="destructive">
          Combined
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });
  });

  describe('TypeScript Integration', () => {
    it('accepts all valid button HTML attributes', () => {
      // This test ensures TypeScript compilation works correctly
      render(
        <Button
          type="submit"
          form="test-form"
          formAction="/test"
          formMethod="post"
          formTarget="_blank"
          formEncType="multipart/form-data"
          formNoValidate
          name="test-button"
          value="test-value"
          autoFocus
          tabIndex={0}
        >
          TypeScript button
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('form', 'test-form');
    });
  });

  describe('Error Boundaries', () => {
    it('handles errors in onClick gracefully', () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const handleClick = jest.fn(() => {
        throw new Error('Test error');
      });

      render(<Button onClick={handleClick}>Error button</Button>);

      const button = screen.getByRole('button');
      // Test that the click handler is called even if it throws
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);

      consoleError.mockRestore();
    });
  });
});

describe('buttonVariants', () => {
  it('is a function', () => {
    expect(typeof buttonVariants).toBe('function');
  });

  it('can be called with variant and size options', () => {
    const result = buttonVariants({ variant: 'destructive', size: 'lg' });
    expect(typeof result).toBe('string');
  });
});
