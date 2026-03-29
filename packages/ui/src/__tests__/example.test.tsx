/**
 * Example test file demonstrating usage of test utilities
 *
 * This file shows how to use the various testing utilities and helpers
 * created in this testing infrastructure.
 */

import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Example component to test
const ExampleComponent: React.FC<{
  onSubmit?: (data: { name: string; email: string }) => void;
}> = ({ onSubmit }) => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ name, email });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Example Form</h1>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={!name || !email}>
        Submit
      </button>
    </form>
  );
};

describe('ExampleComponent', () => {
  describe('Rendering', () => {
    it('should render the form with all required fields', () => {
      render(<ExampleComponent />);

      // Check if all elements are present
      expect(screen.getByRole('heading', { name: 'Example Form' })).toBeInTheDocument();
      expect(screen.getByLabelText('Name:')).toBeInTheDocument();
      expect(screen.getByLabelText('Email:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      render(<ExampleComponent />);

      const nameInput = screen.getByLabelText('Name:');
      const emailInput = screen.getByLabelText('Email:');
      const submitButton = screen.getByRole('button', { name: 'Submit' });

      expect(nameInput).toBeRequired();
      expect(emailInput).toBeRequired();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('should enable submit button when both fields are filled', async () => {
      const user = userEvent.setup();
      render(<ExampleComponent />);

      const nameInput = screen.getByLabelText('Name:');
      const emailInput = screen.getByLabelText('Email:');
      const submitButton = screen.getByRole('button', { name: 'Submit' });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');

      expect(submitButton).toBeEnabled();
    });

    it('should call onSubmit with form data when submitted', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn();
      render(<ExampleComponent onSubmit={mockSubmit} />);

      const nameInput = screen.getByLabelText('Name:');
      const emailInput = screen.getByLabelText('Email:');
      const submitButton = screen.getByRole('button', { name: 'Submit' });

      await user.type(nameInput, 'Jane Smith');
      await user.type(emailInput, 'jane@example.com');
      await user.click(submitButton);

      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'Jane Smith',
        email: 'jane@example.com',
      });
    });

    it('should handle form submission via keyboard', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn();
      render(<ExampleComponent onSubmit={mockSubmit} />);

      const nameInput = screen.getByLabelText('Name:');
      const emailInput = screen.getByLabelText('Email:');

      await user.type(nameInput, 'Keyboard User');
      await user.type(emailInput, 'keyboard@example.com');
      await user.keyboard('{Enter}');

      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'Keyboard User',
        email: 'keyboard@example.com',
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels and roles', () => {
      render(<ExampleComponent />);

      const nameInput = screen.getByLabelText('Name:');
      const emailInput = screen.getByLabelText('Email:');
      const submitButton = screen.getByRole('button', { name: 'Submit' });

      expect(nameInput).toHaveAccessibleName('Name:');
      expect(emailInput).toHaveAccessibleName('Email:');
      expect(submitButton).toHaveAccessibleName('Submit');
    });
  });
});