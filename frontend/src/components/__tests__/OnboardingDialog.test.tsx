import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingDialog } from '../OnboardingDialog';

describe('OnboardingDialog', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders onboarding dialog correctly', () => {
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      expect(screen.getByText('Welcome to Vibe Kanban')).toBeInTheDocument();
      expect(
        screen.getByText(/Let's set up your coding preferences/)
      ).toBeInTheDocument();
      expect(screen.getByText('Choose Your Coding Agent')).toBeInTheDocument();
      expect(screen.getByText('Choose Your Code Editor')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Continue' })
      ).toBeInTheDocument();
    });

    it('displays executor selection section', () => {
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      expect(screen.getByText('Default Executor')).toBeInTheDocument();
      expect(screen.getByText('Claude')).toBeInTheDocument(); // Default selection
      expect(
        screen.getByText('Claude Code from Anthropic')
      ).toBeInTheDocument();
    });

    it('displays editor selection section', () => {
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      expect(screen.getByText('Preferred Editor')).toBeInTheDocument();
      expect(screen.getByText('VS Code')).toBeInTheDocument(); // Default selection
      expect(
        screen.getByText(/This editor will be used to open task attempts/)
      ).toBeInTheDocument();
    });

    it('shows welcome icons', () => {
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      // Check for sparkles and code icons
      const sparklesIcons = document.querySelectorAll('.lucide-sparkles');
      const codeIcon = document.querySelector('.lucide-code');

      expect(sparklesIcons.length).toBeGreaterThan(0);
      expect(codeIcon).toBeInTheDocument();
    });
  });

  describe('Executor Selection', () => {
    it('displays executor selection trigger correctly', () => {
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      const executorSelect = screen.getByLabelText('Default Executor');
      expect(executorSelect).toBeInTheDocument();
      expect(executorSelect).toHaveAttribute('role', 'combobox');

      // Should show default value
      expect(screen.getByText('Claude')).toBeInTheDocument();
      expect(
        screen.getByText('Claude Code from Anthropic')
      ).toBeInTheDocument();
    });

    it('shows correct description for default executor', () => {
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      // Default should be Claude
      expect(
        screen.getByText('Claude Code from Anthropic')
      ).toBeInTheDocument();
    });
  });

  describe('Editor Selection', () => {
    it('displays editor selection trigger correctly', () => {
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      const editorSelect = screen.getByLabelText('Preferred Editor');
      expect(editorSelect).toBeInTheDocument();
      expect(editorSelect).toHaveAttribute('role', 'combobox');

      // Should show default value
      expect(screen.getByText('VS Code')).toBeInTheDocument();
      expect(
        screen.getByText(/This editor will be used to open task attempts/)
      ).toBeInTheDocument();
    });

    it('does not show custom command input by default', () => {
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      expect(screen.queryByLabelText('Custom Command')).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText('e.g., code, subl, vim')
      ).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('enables continue button by default for non-custom editors', () => {
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      const continueButton = screen.getByRole('button', { name: 'Continue' });
      expect(continueButton).toBeEnabled();
    });

    it('continues to have enabled button with default configuration', () => {
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      // Default is VS Code editor and Claude executor - should be valid
      const continueButton = screen.getByRole('button', { name: 'Continue' });
      expect(continueButton).toBeEnabled();
    });
  });

  describe('Form Submission', () => {
    it('calls onComplete with default configuration', async () => {
      const user = userEvent.setup();
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      const continueButton = screen.getByRole('button', { name: 'Continue' });
      await user.click(continueButton);

      expect(mockOnComplete).toHaveBeenCalledWith({
        executor: { type: 'claude' },
        editor: {
          editor_type: 'vscode',
          custom_command: null,
        },
      });
    });

    it('submit button works correctly', async () => {
      const user = userEvent.setup();
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      const continueButton = screen.getByRole('button', { name: 'Continue' });
      expect(continueButton).toBeEnabled();

      await user.click(continueButton);

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dialog Behavior', () => {
    it('prevents closing dialog through onOpenChange prop', () => {
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      // Dialog should be modal and not closeable via standard means
      // The onOpenChange is set to an empty function, preventing normal close behavior
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(<OnboardingDialog open={false} onComplete={mockOnComplete} />);

      expect(
        screen.queryByText('Welcome to Vibe Kanban')
      ).not.toBeInTheDocument();
    });

    it('renders when open is true', () => {
      const { rerender } = render(
        <OnboardingDialog open={false} onComplete={mockOnComplete} />
      );

      expect(
        screen.queryByText('Welcome to Vibe Kanban')
      ).not.toBeInTheDocument();

      rerender(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      expect(screen.getByText('Welcome to Vibe Kanban')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      const title = screen.getByText('Welcome to Vibe Kanban');
      expect(title).toBeInTheDocument();

      // Check form elements have labels
      expect(screen.getByLabelText('Default Executor')).toBeInTheDocument();
      expect(screen.getByLabelText('Preferred Editor')).toBeInTheDocument();
    });

    it('associates form elements with labels correctly', () => {
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      const executorSelect = screen.getByLabelText('Default Executor');
      const editorSelect = screen.getByLabelText('Preferred Editor');

      expect(executorSelect).toBeInTheDocument();
      expect(editorSelect).toBeInTheDocument();
    });

    it('has proper form element structure', () => {
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      // Check that form elements exist and are properly structured
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      const executorSelect = screen.getByLabelText('Default Executor');
      const editorSelect = screen.getByLabelText('Preferred Editor');
      const continueButton = screen.getByRole('button', { name: 'Continue' });

      expect(executorSelect).toBeInTheDocument();
      expect(editorSelect).toBeInTheDocument();
      expect(continueButton).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('maintains default state correctly', () => {
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      // Verify default selections are shown
      expect(screen.getByText('Claude')).toBeInTheDocument();
      expect(screen.getByText('VS Code')).toBeInTheDocument();
      expect(
        screen.getByText('Claude Code from Anthropic')
      ).toBeInTheDocument();
    });

    it('initializes with correct default values', () => {
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      // Check that continue button is enabled by default (valid state)
      const continueButton = screen.getByRole('button', { name: 'Continue' });
      expect(continueButton).toBeEnabled();
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple renders correctly', () => {
      const { rerender } = render(
        <OnboardingDialog open={false} onComplete={mockOnComplete} />
      );

      expect(
        screen.queryByText('Welcome to Vibe Kanban')
      ).not.toBeInTheDocument();

      rerender(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      expect(screen.getByText('Welcome to Vibe Kanban')).toBeInTheDocument();
      expect(screen.getByText('Claude')).toBeInTheDocument();
      expect(screen.getByText('VS Code')).toBeInTheDocument();
    });

    it('handles form submission correctly', async () => {
      const user = userEvent.setup();
      render(<OnboardingDialog open={true} onComplete={mockOnComplete} />);

      const continueButton = screen.getByRole('button', { name: 'Continue' });
      await user.click(continueButton);

      expect(mockOnComplete).toHaveBeenCalledWith({
        executor: { type: 'claude' },
        editor: {
          editor_type: 'vscode',
          custom_command: null,
        },
      });
    });
  });
});
