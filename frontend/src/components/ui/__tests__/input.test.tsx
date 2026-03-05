import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Input } from '../input';

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('renders an input element by default', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    it('renders with default text input behavior', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    it('renders with custom className', () => {
      render(<Input className="custom-class" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('forwards ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('applies default styling classes', () => {
      render(<Input data-testid="input" />);

      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'flex',
        'h-10',
        'w-full',
        'rounded-md',
        'border',
        'border-input',
        'bg-background',
        'px-3',
        'py-2',
        'text-sm',
        'ring-offset-background'
      );
    });
  });

  describe('Input Types', () => {
    it('renders with email type', () => {
      render(<Input type="email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders with password type', () => {
      render(<Input type="password" />);

      const input =
        screen.getByLabelText(/password/i) || screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders with number type', () => {
      render(<Input type="number" />);

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('renders with tel type', () => {
      render(<Input type="tel" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('renders with url type', () => {
      render(<Input type="url" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });

    it('renders with search type', () => {
      render(<Input type="search" />);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('renders with date type', () => {
      render(<Input type="date" />);

      const input = screen.getByDisplayValue('') || screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'date');
    });

    it('renders with time type', () => {
      render(<Input type="time" />);

      const input = screen.getByDisplayValue('') || screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'time');
    });

    it('renders with file type', () => {
      render(<Input type="file" />);

      const input =
        screen.getByRole('button', { hidden: true }) ||
        screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'file');
    });

    it('renders with hidden type', () => {
      render(<Input type="hidden" data-testid="hidden-input" />);

      const input = screen.getByTestId('hidden-input');
      expect(input).toHaveAttribute('type', 'hidden');
    });
  });

  describe('Value and Placeholder', () => {
    it('renders with placeholder text', () => {
      render(<Input placeholder="Enter your name" />);

      const input = screen.getByPlaceholderText('Enter your name');
      expect(input).toBeInTheDocument();
    });

    it('renders with default value', () => {
      render(<Input defaultValue="Default text" />);

      const input = screen.getByDisplayValue('Default text');
      expect(input).toBeInTheDocument();
    });

    it('renders with controlled value', () => {
      render(<Input value="Controlled value" onChange={() => {}} />);

      const input = screen.getByDisplayValue('Controlled value');
      expect(input).toBeInTheDocument();
    });

    it('updates controlled value on change', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              handleChange(e);
            }}
          />
        );
      };

      render(<TestComponent />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(input).toHaveValue('test');
      expect(handleChange).toHaveBeenCalledTimes(4); // Once for each character
    });
  });

  describe('User Interactions', () => {
    it('allows text input', async () => {
      const user = userEvent.setup();

      render(<Input />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello World');

      expect(input).toHaveValue('Hello World');
    });

    it('calls onChange when text is typed', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(handleChange).toHaveBeenCalledTimes(4);
      expect(handleChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: 'test' }),
        })
      );
    });

    it('calls onFocus when input receives focus', async () => {
      const user = userEvent.setup();
      const handleFocus = jest.fn();

      render(<Input onFocus={handleFocus} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('calls onBlur when input loses focus', async () => {
      const user = userEvent.setup();
      const handleBlur = jest.fn();

      render(
        <div>
          <Input onBlur={handleBlur} />
          <button>Other element</button>
        </div>
      );

      const input = screen.getByRole('textbox');
      const button = screen.getByRole('button');

      await user.click(input);
      await user.click(button);

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();

      render(<Input />);

      const input = screen.getByRole('textbox');
      await user.tab();

      expect(input).toHaveFocus();
    });

    it('supports text selection', async () => {
      const user = userEvent.setup();

      render(<Input defaultValue="Hello World" />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.click(input);
      await user.keyboard('{Control>}a{/Control}');

      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(11);
    });
  });

  describe('Disabled State', () => {
    it('renders as disabled when disabled prop is true', () => {
      render(<Input disabled />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('does not accept input when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<Input disabled onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(input).toHaveValue('');
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('is not focusable when disabled', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <Input />
          <Input disabled />
        </div>
      );

      await user.tab();
      expect(screen.getAllByRole('textbox')[0]).toHaveFocus();

      await user.tab();
      expect(screen.getAllByRole('textbox')[1]).not.toHaveFocus();
    });

    it('has proper disabled styling', () => {
      render(<Input disabled data-testid="disabled-input" />);

      const input = screen.getByTestId('disabled-input');
      expect(input).toHaveClass(
        'disabled:cursor-not-allowed',
        'disabled:opacity-50'
      );
    });
  });

  describe('HTML Attributes', () => {
    it('passes through standard input attributes', () => {
      render(
        <Input
          name="username"
          id="username-input"
          required
          maxLength={20}
          minLength={3}
          pattern="[a-zA-Z0-9]+"
          autoComplete="username"
          autoFocus
          data-testid="input-attrs"
        />
      );

      const input = screen.getByTestId('input-attrs');
      expect(input).toHaveAttribute('name', 'username');
      expect(input).toHaveAttribute('id', 'username-input');
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('maxLength', '20');
      expect(input).toHaveAttribute('minLength', '3');
      expect(input).toHaveAttribute('pattern', '[a-zA-Z0-9]+');
      expect(input).toHaveAttribute('autoComplete', 'username');
      expect(input).toHaveProperty('autofocus', true);
    });

    it('supports custom data attributes', () => {
      render(<Input data-analytics="username-input" data-field="user" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('data-analytics', 'username-input');
      expect(input).toHaveAttribute('data-field', 'user');
    });

    it('supports ARIA attributes', () => {
      render(
        <Input
          aria-label="Search users"
          aria-describedby="search-help"
          aria-invalid={true}
          aria-required={true}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Search users');
      expect(input).toHaveAttribute('aria-describedby', 'search-help');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Number Input Specific', () => {
    it('supports number input attributes', () => {
      render(
        <Input
          type="number"
          min={0}
          max={100}
          step={5}
          data-testid="number-input"
        />
      );

      const input = screen.getByTestId('number-input');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
      expect(input).toHaveAttribute('step', '5');
    });

    it('accepts numeric input', async () => {
      const user = userEvent.setup();

      render(<Input type="number" />);

      const input = screen.getByRole('spinbutton');
      await user.type(input, '123');

      expect(input).toHaveValue(123);
    });
  });

  describe('File Input Specific', () => {
    it('supports file input attributes', () => {
      render(
        <Input
          type="file"
          accept=".jpg,.png,.gif"
          multiple
          data-testid="file-input"
        />
      );

      const input = screen.getByTestId('file-input');
      expect(input).toHaveAttribute('accept', '.jpg,.png,.gif');
      expect(input).toHaveAttribute('multiple');
    });

    it('handles file selection', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<Input type="file" onChange={handleChange} />);

      const input =
        screen.getByRole('button', { hidden: true }) ||
        screen.getByDisplayValue('');
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      await user.upload(input as HTMLInputElement, file);

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty value', () => {
      render(<Input value="" onChange={() => {}} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('handles undefined value', () => {
      render(<Input value={undefined} onChange={() => {}} />);

      const input = screen.getByRole('textbox');
      expect(input.value).toBe('');
    });

    it('handles undefined value', () => {
      render(<Input value={undefined} onChange={() => {}} />);

      const input = screen.getByRole('textbox');
      expect(input.value).toBe('');
    });

    it('handles very long text input', async () => {
      const user = userEvent.setup();
      const longText = 'a'.repeat(1000);

      render(<Input />);

      const input = screen.getByRole('textbox');
      await user.type(input, longText);

      expect(input).toHaveValue(longText);
    });

    it('handles special characters', async () => {
      const user = userEvent.setup();
      const specialChars = '!@#$%^&*()_+-=';

      render(<Input />);

      const input = screen.getByRole('textbox');
      await user.type(input, specialChars);

      expect(input).toHaveValue(specialChars);
    });

    it('handles unicode characters', async () => {
      const user = userEvent.setup();
      const unicodeText = '👋 Hello 世界 🌍';

      render(<Input />);

      const input = screen.getByRole('textbox');
      await user.type(input, unicodeText);

      expect(input).toHaveValue(unicodeText);
    });

    it('handles rapid typing', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');

      // Type multiple characters rapidly
      await user.type(input, 'rapid', { delay: 1 });

      expect(input).toHaveValue('rapid');
      expect(handleChange).toHaveBeenCalledTimes(5);
    });
  });

  describe('ReadOnly State', () => {
    it('renders as readonly when readOnly prop is true', () => {
      render(<Input readOnly />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
    });

    it('does not accept input when readonly', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <Input readOnly defaultValue="readonly" onChange={handleChange} />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(input).toHaveValue('readonly');
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('is focusable when readonly', async () => {
      const user = userEvent.setup();

      render(<Input readOnly />);

      const input = screen.getByRole('textbox');
      await user.tab();

      expect(input).toHaveFocus();
    });
  });

  describe('Form Integration', () => {
    it('works with form submission', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <Input name="username" defaultValue="testuser" />
          <button type="submit">Submit</button>
        </form>
      );

      const form = screen.getByRole('button').closest('form');
      expect(form).toBeInTheDocument();
      const formData = new FormData(form);

      expect(formData.get('username')).toBe('testuser');
    });

    it('supports form validation', () => {
      render(
        <Input required pattern="[a-zA-Z]+" title="Only letters allowed" />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('pattern', '[a-zA-Z]+');
      expect(input).toHaveAttribute('title', 'Only letters allowed');
    });

    it('works with labels', () => {
      render(
        <div>
          <label htmlFor="username">Username</label>
          <Input id="username" />
        </div>
      );

      const input = screen.getByLabelText('Username');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper input role', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('supports screen reader labels', () => {
      render(<Input aria-label="Enter your email address" />);

      const input = screen.getByLabelText('Enter your email address');
      expect(input).toBeInTheDocument();
    });

    it('supports error states with aria-invalid', () => {
      render(<Input aria-invalid="true" aria-describedby="error-message" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'error-message');
    });

    it('has visible focus indicator', async () => {
      const user = userEvent.setup();

      render(<Input data-testid="focus-input" />);

      const input = screen.getByTestId('focus-input');
      await user.tab();

      expect(input).toHaveFocus();
      expect(input).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2'
      );
    });

    it('supports required field indication', () => {
      render(<Input required aria-required="true" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Style Application', () => {
    it('applies inline styles correctly', () => {
      render(
        <Input style={{ backgroundColor: 'yellow', border: '2px solid red' }} />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveStyle('background-color: yellow');
      expect(input).toHaveStyle('border: 2px solid red');
    });

    it('combines className with default classes', () => {
      render(
        <Input className="custom-input-class" data-testid="styled-input" />
      );

      const input = screen.getByTestId('styled-input');
      expect(input).toHaveClass('custom-input-class');
      expect(input).toHaveClass('flex', 'h-10', 'w-full'); // Default classes
    });

    it('applies hover and focus states', () => {
      render(<Input data-testid="interactive-input" />);

      const input = screen.getByTestId('interactive-input');
      expect(input).toHaveClass(
        'focus-visible:ring-2',
        'focus-visible:ring-ring'
      );
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn();

      const TestInput = React.memo(() => {
        renderSpy();
        return <Input />;
      });

      const { rerender } = render(<TestInput />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestInput />);
      expect(renderSpy).toHaveBeenCalledTimes(1); // Should not re-render
    });

    it('handles rapid value changes efficiently', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');

      // Clear and type new text rapidly
      await user.clear(input);
      await user.type(input, 'newvalue', { delay: 0 });

      expect(input).toHaveValue('newvalue');
    });
  });

  describe('Error Handling', () => {
    it('handles onChange errors gracefully', () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const handleChange = jest.fn(() => {
        throw new Error('Test error');
      });

      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      expect(() =>
        fireEvent.change(input, { target: { value: 'test' } })
      ).toThrow('Test error');

      consoleError.mockRestore();
    });

    it('recovers from invalid props gracefully', () => {
      // Should not crash with invalid props
      render(<Input type={'invalid' as any} />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });
  });
});
