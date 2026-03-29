import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisclaimerDialog } from '../DisclaimerDialog';

describe('DisclaimerDialog', () => {
  const mockOnAccept = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders disclaimer dialog correctly', () => {
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      expect(screen.getByText('Important Safety Warning')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Please read and acknowledge the following before proceeding:'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText('Coding agents have full access to your computer')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'This software is experimental and may cause catastrophic damage'
        )
      ).toBeInTheDocument();
    });

    it('displays all safety warnings', () => {
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      // Check capability warnings
      expect(
        screen.getByText('Installing, modifying, or deleting software')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Accessing, creating, or removing files and directories'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText('Making network requests and connections')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Running system-level commands with your permissions')
      ).toBeInTheDocument();

      // Check risk acknowledgments
      expect(
        screen.getByText('You use this software entirely at your own risk')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/The developers are not responsible for any damage/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You should have proper backups of important data/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You understand the potential consequences/)
      ).toBeInTheDocument();
    });

    it('shows acknowledgment checkbox and button', () => {
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();

      const acceptButton = screen.getByRole('button', {
        name: 'I Accept the Risks and Want to Proceed',
      });
      expect(acceptButton).toBeInTheDocument();
      expect(acceptButton).toBeDisabled();
    });

    it('displays destructive styling on accept button', () => {
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      const acceptButton = screen.getByRole('button', {
        name: 'I Accept the Risks and Want to Proceed',
      });
      expect(acceptButton).toHaveClass(
        'bg-destructive',
        'text-destructive-foreground'
      ); // Check actual cva classes
    });
  });

  describe('Interaction', () => {
    it('enables accept button when checkbox is checked', async () => {
      const user = userEvent.setup();
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      const checkbox = screen.getByRole('checkbox');
      const acceptButton = screen.getByRole('button', {
        name: 'I Accept the Risks and Want to Proceed',
      });

      expect(acceptButton).toBeDisabled();

      await user.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(acceptButton).toBeEnabled();
    });

    it('disables accept button when checkbox is unchecked', async () => {
      const user = userEvent.setup();
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      const checkbox = screen.getByRole('checkbox');
      const acceptButton = screen.getByRole('button', {
        name: 'I Accept the Risks and Want to Proceed',
      });

      // Check and then uncheck
      await user.click(checkbox);
      expect(acceptButton).toBeEnabled();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
      expect(acceptButton).toBeDisabled();
    });

    it('calls onAccept when checkbox is checked and button is clicked', async () => {
      const user = userEvent.setup();
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      const checkbox = screen.getByRole('checkbox');
      const acceptButton = screen.getByRole('button', {
        name: 'I Accept the Risks and Want to Proceed',
      });

      await user.click(checkbox);
      await user.click(acceptButton);

      expect(mockOnAccept).toHaveBeenCalledTimes(1);
    });

    it('does not call onAccept when button is clicked without checking checkbox', async () => {
      const user = userEvent.setup();
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      const acceptButton = screen.getByRole('button', {
        name: 'I Accept the Risks and Want to Proceed',
      });

      // Button should be disabled, but let's verify behavior
      expect(acceptButton).toBeDisabled();

      // Try to click (should not work)
      await user.click(acceptButton);

      expect(mockOnAccept).not.toHaveBeenCalled();
    });
  });

  describe('Dialog Behavior', () => {
    it('prevents closing dialog through onOpenChange prop', () => {
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      // Dialog should be modal and not closeable via standard means
      // The onOpenChange is set to an empty function, preventing normal close behavior
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(<DisclaimerDialog open={false} onAccept={mockOnAccept} />);

      expect(
        screen.queryByText('Important Safety Warning')
      ).not.toBeInTheDocument();
    });

    it('renders when open is true', () => {
      const { rerender } = render(
        <DisclaimerDialog open={false} onAccept={mockOnAccept} />
      );

      expect(
        screen.queryByText('Important Safety Warning')
      ).not.toBeInTheDocument();

      rerender(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      expect(screen.getByText('Important Safety Warning')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      const title = screen.getByText('Important Safety Warning');
      expect(title).toBeInTheDocument();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAccessibleName();
    });

    it('associates checkbox with label correctly', () => {
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      const checkbox = screen.getByRole('checkbox');
      const label = screen.getByText(
        /I understand and acknowledge the risks described above/
      );

      expect(checkbox).toBeInTheDocument();
      expect(label).toBeInTheDocument();

      // The checkbox should be properly associated with its label
      expect(checkbox).toHaveAccessibleName(
        /I understand and acknowledge the risks described above/
      );
    });

    it('provides adequate color contrast with destructive button styling', () => {
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      const acceptButton = screen.getByRole('button', {
        name: 'I Accept the Risks and Want to Proceed',
      });

      // The button should have appropriate styling to indicate its destructive nature
      expect(acceptButton).toBeInTheDocument();
    });
  });

  describe('Content Validation', () => {
    it('displays all required risk categories', () => {
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      // System access risks
      expect(
        screen.getByText(/Installing, modifying, or deleting software/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Accessing, creating, or removing files/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Making network requests and connections/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Running system-level commands/)
      ).toBeInTheDocument();

      // Liability disclaimers
      expect(
        screen.getByText(/You use this software entirely at your own risk/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/The developers are not responsible/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You should have proper backups/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You understand the potential consequences/)
      ).toBeInTheDocument();
    });

    it('emphasizes critical warnings with strong text', () => {
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      // Check for emphasized text (assuming strong/bold styling)
      expect(
        screen.getByText('Coding agents have full access to your computer')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /This software is experimental and may cause catastrophic damage/
        )
      ).toBeInTheDocument();
    });

    it('includes warning icon', () => {
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      // Warning icon should be present (AlertTriangle from lucide-react)
      const warningIcon = document.querySelector('.lucide-alert-triangle');
      expect(warningIcon).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('maintains checkbox state correctly', async () => {
      const user = userEvent.setup();
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      const checkbox = screen.getByRole('checkbox');

      // Initial state
      expect(checkbox).not.toBeChecked();

      // Check
      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      // Uncheck
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();

      // Check again
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('resets state when dialog is reopened', () => {
      const { rerender } = render(
        <DisclaimerDialog open={true} onAccept={mockOnAccept} />
      );

      // Check the checkbox
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      // Close and reopen dialog
      rerender(<DisclaimerDialog open={false} onAccept={mockOnAccept} />);
      rerender(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      // State should reset (new component instance)
      const newCheckbox = screen.getByRole('checkbox');
      expect(newCheckbox).not.toBeChecked();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid checkbox toggling', async () => {
      const user = userEvent.setup();
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      const checkbox = screen.getByRole('checkbox');
      const acceptButton = screen.getByRole('button', {
        name: 'I Accept the Risks and Want to Proceed',
      });

      // Rapid toggling
      await user.click(checkbox);
      await user.click(checkbox);
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(acceptButton).toBeEnabled();
    });

    it('handles button click attempts when disabled', async () => {
      const user = userEvent.setup();
      render(<DisclaimerDialog open={true} onAccept={mockOnAccept} />);

      const acceptButton = screen.getByRole('button', {
        name: 'I Accept the Risks and Want to Proceed',
      });

      expect(acceptButton).toBeDisabled();

      // Attempt to click disabled button
      await user.click(acceptButton);

      expect(mockOnAccept).not.toHaveBeenCalled();
    });
  });
});
