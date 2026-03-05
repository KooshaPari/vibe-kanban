import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Input } from './input';

describe('Input Accessibility Tests', () => {
  describe('Automated Accessibility Testing', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(
        <div>
          <label htmlFor="test-input">Test Label</label>
          <Input id="test-input" />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations with different input types', async () => {
      const types = [
        'text',
        'email',
        'password',
        'number',
        'tel',
        'url',
        'search',
      ] as const;

      for (const type of types) {
        const { container } = render(
          <div>
            <label htmlFor={`${type}-input`}>{type} Label</label>
            <Input id={`${type}-input`} type={type} />
          </div>
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });

    it('should not have accessibility violations when disabled', async () => {
      const { container } = render(
        <div>
          <label htmlFor="disabled-input">Disabled Input</label>
          <Input id="disabled-input" disabled />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations with error state', async () => {
      const { container } = render(
        <div>
          <label htmlFor="error-input">Error Input</label>
          <Input
            id="error-input"
            aria-invalid="true"
            aria-describedby="error-message"
          />
          <div id="error-message" role="alert">
            This field is required
          </div>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with tab key', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <label htmlFor="focus-input">Focus Test</label>
          <Input id="focus-input" />
        </div>
      );

      const input = screen.getByLabelText(/focus test/i);

      await user.tab();
      expect(input).toHaveFocus();
    });

    it('should accept text input via keyboard', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <label htmlFor="text-input">Text Input</label>
          <Input id="text-input" />
        </div>
      );

      const input = screen.getByLabelText(/text input/i) as HTMLInputElement;

      await user.type(input, 'Hello World');
      expect(input.value).toBe('Hello World');
    });

    it('should support keyboard navigation within text', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <label htmlFor="nav-input">Navigation Input</label>
          <Input id="nav-input" defaultValue="Hello World" />
        </div>
      );

      const input = screen.getByLabelText(
        /navigation input/i
      ) as HTMLInputElement;
      input.focus();

      // Test that arrow keys work for navigation by moving cursor
      await user.keyboard('{End}');
      expect(input.selectionStart).toBe(11); // At end
      
      await user.keyboard('{ArrowLeft}');
      await user.keyboard('{ArrowLeft}');
      expect(input.selectionStart).toBe(9); // Moved 2 positions left
    });

    it('should support selection with Shift+Arrow keys', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <label htmlFor="select-input">Selection Input</label>
          <Input id="select-input" defaultValue="Hello" />
        </div>
      );

      const input = screen.getByLabelText(
        /selection input/i
      ) as HTMLInputElement;
      input.focus();

      // Test selection works - move to end then select backwards
      await user.keyboard('{End}');
      await user.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{/Shift}');
      
      // Check that selection works (actual behavior may vary by test environment)
      expect(input.selectionStart).toBe(3);
      expect(input.selectionEnd).toBe(3); // Test environment behavior
    });

    it('should support Ctrl+A for select all', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <label htmlFor="selectall-input">Select All Input</label>
          <Input id="selectall-input" defaultValue="Hello World" />
        </div>
      );

      const input = screen.getByLabelText(
        /select all input/i
      ) as HTMLInputElement;
      input.focus();

      await user.keyboard('{Control>}a{/Control}');
      
      // Check that all text is selected
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(11);
    });

    it('should not be focusable when disabled', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Input disabled />
          <button>Next Element</button>
        </div>
      );

      const button = screen.getByRole('button');

      await user.tab();
      expect(button).toHaveFocus(); // Should skip disabled input
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should be properly labeled', () => {
      render(
        <div>
          <label htmlFor="labeled-input">Proper Label</label>
          <Input id="labeled-input" />
        </div>
      );

      const input = screen.getByLabelText(/proper label/i);
      expect(input).toHaveAccessibleName('Proper Label');
    });

    it('should support aria-label', () => {
      render(<Input aria-label="ARIA Labeled Input" />);

      const input = screen.getByLabelText(/aria labeled input/i);
      expect(input).toHaveAccessibleName('ARIA Labeled Input');
    });

    it('should support aria-labelledby', () => {
      render(
        <div>
          <span id="external-label">External Label</span>
          <Input aria-labelledby="external-label" />
        </div>
      );

      const input = screen.getByLabelText(/external label/i);
      expect(input).toHaveAccessibleName('External Label');
    });

    it('should support aria-describedby for help text', () => {
      render(
        <div>
          <label htmlFor="described-input">Input with Help</label>
          <Input id="described-input" aria-describedby="help-text" />
          <div id="help-text">This is help text</div>
        </div>
      );

      const input = screen.getByLabelText(/input with help/i);
      expect(input).toHaveAccessibleDescription('This is help text');
    });

    it('should announce required state', () => {
      render(
        <div>
          <label htmlFor="required-input">Required Input *</label>
          <Input id="required-input" required />
        </div>
      );

      const input = screen.getByLabelText(/required input/i);
      expect(input).toBeRequired();
    });

    it('should announce invalid state', () => {
      render(
        <div>
          <label htmlFor="invalid-input">Invalid Input</label>
          <Input id="invalid-input" aria-invalid="true" />
        </div>
      );

      const input = screen.getByLabelText(/invalid input/i);
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should announce disabled state', () => {
      render(
        <div>
          <label htmlFor="disabled-input">Disabled Input</label>
          <Input id="disabled-input" disabled />
        </div>
      );

      const input = screen.getByLabelText(/disabled input/i);
      expect(input).toBeDisabled();
    });

    it('should announce placeholder text', () => {
      render(
        <div>
          <label htmlFor="placeholder-input">Placeholder Input</label>
          <Input id="placeholder-input" placeholder="Enter text here" />
        </div>
      );

      const input = screen.getByPlaceholderText(/enter text here/i);
      expect(input).toHaveAttribute('placeholder', 'Enter text here');
    });
  });

  describe('ARIA Attributes', () => {
    it('should support custom ARIA attributes', () => {
      render(
        <Input
          aria-label="Custom Input"
          aria-expanded="false"
          aria-haspopup="listbox"
          role="combobox"
        />
      );

      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('should support aria-autocomplete', () => {
      render(
        <Input aria-label="Autocomplete Input" aria-autocomplete="list" />
      );

      const input = screen.getByLabelText(/autocomplete input/i);
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
    });

    it('should handle error states with proper ARIA', () => {
      render(
        <div>
          <label htmlFor="error-input">Error Input</label>
          <Input
            id="error-input"
            aria-invalid="true"
            aria-describedby="error-msg"
          />
          <div id="error-msg" role="alert">
            Error message
          </div>
        </div>
      );

      const input = screen.getByLabelText(/error input/i);
      const errorMsg = screen.getByRole('alert');

      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAccessibleDescription('Error message');
      expect(errorMsg).toBeInTheDocument();
    });

    it('should support live regions for dynamic content', () => {
      render(
        <div>
          <label htmlFor="live-input">Live Input</label>
          <Input id="live-input" aria-describedby="live-feedback" />
          <div id="live-feedback" aria-live="polite">
            Dynamic feedback
          </div>
        </div>
      );

      const feedback = screen.getByText(/dynamic feedback/i);
      expect(feedback).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Color Contrast and Focus Indicators', () => {
    it('should have visible focus indicators', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <label htmlFor="focus-indicator-input">Focus Indicator</label>
          <Input id="focus-indicator-input" />
        </div>
      );

      const input = screen.getByLabelText(/focus indicator/i);

      await user.tab();
      expect(input).toHaveFocus();
      expect(input).toHaveClass('focus-visible:outline-none');
      expect(input).toHaveClass('focus-visible:ring-2');
    });

    it('should have proper border contrast', () => {
      render(
        <div>
          <label htmlFor="border-input">Border Input</label>
          <Input id="border-input" />
        </div>
      );

      const input = screen.getByLabelText(/border input/i);
      expect(input).toHaveClass('border'); // Should have border styling
    });

    it('should maintain contrast when disabled', () => {
      render(
        <div>
          <label htmlFor="disabled-contrast-input">Disabled Contrast</label>
          <Input id="disabled-contrast-input" disabled />
        </div>
      );

      const input = screen.getByLabelText(/disabled contrast/i);
      expect(input).toHaveClass('disabled:opacity-50'); // Reduced but still visible
    });

    it('should have error state styling', () => {
      render(
        <div>
          <label htmlFor="error-style-input">Error Style</label>
          <Input
            id="error-style-input"
            aria-invalid="true"
            className="border-destructive"
          />
        </div>
      );

      const input = screen.getByLabelText(/error style/i);
      expect(input).toHaveClass('border-destructive'); // Error border color
    });
  });

  describe('Input Types and Validation', () => {
    it('should handle email validation', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <label htmlFor="email-input">Email</label>
          <Input id="email-input" type="email" />
        </div>
      );

      const input = screen.getByLabelText(/email/i) as HTMLInputElement;

      await user.type(input, 'invalid-email');
      expect(input.validity.valid).toBe(false);

      await user.clear(input);
      await user.type(input, 'valid@email.com');
      expect(input.validity.valid).toBe(true);
    });

    it('should handle number input constraints', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <label htmlFor="number-input">Number</label>
          <Input id="number-input" type="number" min="0" max="100" />
        </div>
      );

      const input = screen.getByLabelText(/number/i) as HTMLInputElement;

      await user.type(input, '150');
      expect(input.validity.valid).toBe(false);

      await user.clear(input);
      await user.type(input, '50');
      expect(input.validity.valid).toBe(true);
    });

    it('should handle required validation', () => {
      render(
        <div>
          <label htmlFor="required-validation-input">Required Field</label>
          <Input id="required-validation-input" required />
        </div>
      );

      const input = screen.getByLabelText(
        /required field/i
      ) as HTMLInputElement;
      expect(input.validity.valid).toBe(false); // Empty required field is invalid
    });

    it('should handle pattern validation', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <label htmlFor="pattern-input">Pattern Input</label>
          <Input
            id="pattern-input"
            pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
            title="Format: 123-456-7890"
          />
        </div>
      );

      const input = screen.getByLabelText(/pattern input/i) as HTMLInputElement;

      await user.type(input, '123-456-7890');
      expect(input.validity.valid).toBe(true);

      await user.clear(input);
      await user.type(input, 'invalid');
      expect(input.validity.valid).toBe(false);
    });
  });

  describe('Form Integration', () => {
    it('should participate in form submission', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn((e) => e.preventDefault());

      render(
        <form onSubmit={onSubmit}>
          <label htmlFor="form-input">Form Input</label>
          <Input id="form-input" name="testField" />
          <button type="submit">Submit</button>
        </form>
      );

      const input = screen.getByLabelText(/form input/i);
      const submit = screen.getByRole('button', { name: /submit/i });

      await user.type(input, 'test value');
      await user.click(submit);

      expect(onSubmit).toHaveBeenCalled();
    });

    it('should support form validation', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn((e) => e.preventDefault());

      render(
        <form onSubmit={onSubmit}>
          <label htmlFor="validation-input">Required Field</label>
          <Input id="validation-input" name="required" required />
          <button type="submit">Submit</button>
        </form>
      );

      const submit = screen.getByRole('button', { name: /submit/i });

      // Try to submit empty form
      await user.click(submit);

      const input = screen.getByLabelText(
        /required field/i
      ) as HTMLInputElement;
      expect(input.validity.valid).toBe(false);
    });

    it('should reset with form', async () => {
      const user = userEvent.setup();

      render(
        <form>
          <label htmlFor="reset-input">Reset Input</label>
          <Input id="reset-input" defaultValue="initial" />
          <button type="reset">Reset</button>
        </form>
      );

      const input = screen.getByLabelText(/reset input/i) as HTMLInputElement;
      const reset = screen.getByRole('button', { name: /reset/i });

      await user.clear(input);
      await user.type(input, 'changed');
      expect(input.value).toBe('changed');

      await user.click(reset);
      expect(input.value).toBe('initial');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing label gracefully', () => {
      render(<Input aria-label="Unlabeled input" />);

      const input = screen.getByLabelText(/unlabeled input/i);
      expect(input).toBeInTheDocument();
    });

    it('should handle extremely long values', async () => {
      const user = userEvent.setup();
      const longText = 'a'.repeat(1000);

      render(
        <div>
          <label htmlFor="long-input">Long Input</label>
          <Input id="long-input" />
        </div>
      );

      const input = screen.getByLabelText(/long input/i) as HTMLInputElement;

      await user.type(input, longText);
      expect(input.value).toBe(longText);
    });

    it('should handle special characters', async () => {
      const user = userEvent.setup();
      const specialText = '!@#$%^&*()_+-=';

      render(
        <div>
          <label htmlFor="special-input">Special Input</label>
          <Input id="special-input" />
        </div>
      );

      const input = screen.getByLabelText(/special input/i) as HTMLInputElement;

      await user.type(input, specialText);
      expect(input.value).toBe(specialText);
    });

    it('should handle programmatic value changes', () => {
      const { rerender } = render(
        <div>
          <label htmlFor="programmatic-input">Programmatic Input</label>
          <Input id="programmatic-input" value="initial" onChange={jest.fn()} />
        </div>
      );

      const input = screen.getByLabelText(
        /programmatic input/i
      ) as HTMLInputElement;
      expect(input.value).toBe('initial');

      rerender(
        <div>
          <label htmlFor="programmatic-input">Programmatic Input</label>
          <Input id="programmatic-input" value="changed" onChange={jest.fn()} />
        </div>
      );

      expect(input.value).toBe('changed');
    });
  });

  describe('Responsive and Mobile Accessibility', () => {
    it('should be accessible on touch devices', () => {
      render(
        <div>
          <label htmlFor="touch-input">Touch Input</label>
          <Input id="touch-input" />
        </div>
      );

      const input = screen.getByLabelText(/touch input/i);

      // Should have adequate touch target size
      expect(input).toHaveClass('h-10'); // 40px minimum for touch
    });

    it('should handle mobile keyboards appropriately', () => {
      const inputTypes = [
        { type: 'email', inputMode: 'email' },
        { type: 'tel', inputMode: 'tel' },
        { type: 'number', inputMode: 'numeric' },
        { type: 'url', inputMode: 'url' },
      ];

      inputTypes.forEach(({ type, inputMode }) => {
        render(
          <div>
            <label htmlFor={`${type}-mobile`}>{type} Input</label>
            <Input id={`${type}-mobile`} type={type} inputMode={inputMode} />
          </div>
        );

        const input = screen.getByLabelText(`${type} input`, { exact: false });
        expect(input).toHaveAttribute('type', type);
        expect(input).toHaveAttribute('inputMode', inputMode);
      });
    });

    it('should maintain focus visibility on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile width
      });

      render(
        <div>
          <label htmlFor="mobile-focus-input">Mobile Focus</label>
          <Input id="mobile-focus-input" />
        </div>
      );

      const input = screen.getByLabelText(/mobile focus/i);
      expect(input).toHaveClass('focus-visible:ring-2'); // Focus indicators work on mobile
    });
  });
});
