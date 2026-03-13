import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Simple test component for demonstrating React testing
const TestButton: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ onClick, children }) => {
  const [clicked, setClicked] = React.useState(false);

  const handleClick = () => {
    setClicked(true);
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      data-testid="test-button"
      style={{ backgroundColor: clicked ? 'green' : 'blue' }}
    >
      {children} {clicked && '(clicked)'}
    </button>
  );
};

describe('React Component Testing', () => {
  it('renders a button component', () => {
    render(<TestButton>Click me</TestButton>);

    expect(screen.getByTestId('test-button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<TestButton onClick={handleClick}>Click me</TestButton>);

    const button = screen.getByTestId('test-button');

    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Click me (clicked)')).toBeInTheDocument();
  });

  it('changes style when clicked', () => {
    render(<TestButton>Click me</TestButton>);

    const button = screen.getByTestId('test-button');

    // Initial state
    expect(button).toHaveStyle({ backgroundColor: 'blue' });

    // After click
    fireEvent.click(button);
    expect(button).toHaveStyle({ backgroundColor: 'green' });
  });

  it('supports custom props', () => {
    const customHandler = jest.fn();

    render(<TestButton onClick={customHandler}>Custom Text</TestButton>);

    expect(screen.getByText('Custom Text')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('test-button'));
    expect(customHandler).toHaveBeenCalled();
  });
});
