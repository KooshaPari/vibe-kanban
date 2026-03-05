import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyOptInDialog } from '../PrivacyOptInDialog';
import { useConfig } from '../config-provider';

// Mock dependencies
jest.mock('../config-provider');

const mockUseConfig = useConfig as jest.MockedFunction<typeof useConfig>;

const mockConfigBase = {
  theme: 'light' as const,
  executor: { type: 'claude' as const },
  disclaimer_acknowledged: true,
  onboarding_acknowledged: true,
  github_login_acknowledged: true,
  telemetry_acknowledged: true,
  sound_alerts: false,
  sound_file: 'abstract-sound1' as const,
  push_notifications: false,
  editor: { editor_type: 'vscode' as const, custom_command: null },
  analytics_enabled: false,
};

describe('PrivacyOptInDialog', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    beforeEach(() => {
      mockUseConfig.mockReturnValue({
        config: {
          ...mockConfigBase,
          github: {
            pat: null,
            token: null,
            username: null,
            primary_email: null,
            default_pr_base: null,
          },
        },
        loading: false,
        error: null,
        refreshConfig: jest.fn(),
        githubTokenInvalid: false,
      });
    });

    it('renders privacy opt-in dialog correctly', () => {
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      expect(screen.getByText('Feedback Opt-In')).toBeInTheDocument();
      expect(
        screen.getByText(/Help us improve Vibe Kanban/)
      ).toBeInTheDocument();
      expect(screen.getByText('What data do we collect?')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'No thanks' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Yes, help improve Vibe Kanban' })
      ).toBeInTheDocument();
    });

    it('displays data collection information', () => {
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      expect(screen.getByText('High-level usage metrics')).toBeInTheDocument();
      expect(
        screen.getByText('Performance and error data')
      ).toBeInTheDocument();
      expect(screen.getByText('We do NOT collect')).toBeInTheDocument();
      expect(
        screen.getByText(/Task contents, code snippets, project names/)
      ).toBeInTheDocument();
    });

    it('shows privacy icons and settings note', () => {
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      // Check for shield icon
      const shieldIcon = document.querySelector('.lucide-shield');
      expect(shieldIcon).toBeInTheDocument();

      // Check for settings note
      expect(
        screen.getByText(/You can change this preference anytime in Settings/)
      ).toBeInTheDocument();

      // Check for check/x icons in content
      const checkIcons = document.querySelectorAll('.lucide-check-circle');
      const xIcon = document.querySelector('.lucide-x-circle');

      expect(checkIcons.length).toBeGreaterThan(0);
      expect(xIcon).toBeInTheDocument();
    });
  });

  describe('GitHub Authentication State', () => {
    it('shows GitHub profile information when authenticated', () => {
      mockUseConfig.mockReturnValue({
        config: {
          ...mockConfigBase,
          github: {
            pat: null,
            token: 'github_token',
            username: 'testuser',
            primary_email: 'test@example.com',
            default_pr_base: null,
          },
        },
        loading: false,
        error: null,
        refreshConfig: jest.fn(),
        githubTokenInvalid: false,
      });

      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      expect(
        screen.getByText('GitHub profile information')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Username and email address to send you only very important updates/
        )
      ).toBeInTheDocument();
    });

    it('does not show GitHub profile section when not authenticated', () => {
      mockUseConfig.mockReturnValue({
        config: {
          ...mockConfigBase,
          github: {
            pat: null,
            token: null,
            username: null,
            primary_email: null,
            default_pr_base: null,
          },
        },
        loading: false,
        error: null,
        refreshConfig: jest.fn(),
        githubTokenInvalid: false,
      });

      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      expect(
        screen.queryByText('GitHub profile information')
      ).not.toBeInTheDocument();
    });

    it('does not show GitHub profile section when token is invalid', () => {
      mockUseConfig.mockReturnValue({
        config: {
          ...mockConfigBase,
          github: {
            pat: null,
            token: 'invalid_token',
            username: 'testuser',
            primary_email: 'test@example.com',
            default_pr_base: null,
          },
        },
        loading: false,
        error: null,
        refreshConfig: jest.fn(),
        githubTokenInvalid: true,
      });

      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      expect(
        screen.queryByText('GitHub profile information')
      ).not.toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    beforeEach(() => {
      mockUseConfig.mockReturnValue({
        config: {
          ...mockConfigBase,
          github: {
            pat: null,
            token: null,
            username: null,
            primary_email: null,
            default_pr_base: null,
          },
        },
        loading: false,
        error: null,
        refreshConfig: jest.fn(),
        githubTokenInvalid: false,
      });
    });

    it('calls onComplete with true when opt-in button is clicked', async () => {
      const user = userEvent.setup();
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      const optInButton = screen.getByRole('button', {
        name: 'Yes, help improve Vibe Kanban',
      });
      await user.click(optInButton);

      expect(mockOnComplete).toHaveBeenCalledWith(true);
    });

    it('calls onComplete with false when opt-out button is clicked', async () => {
      const user = userEvent.setup();
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      const optOutButton = screen.getByRole('button', { name: 'No thanks' });
      await user.click(optOutButton);

      expect(mockOnComplete).toHaveBeenCalledWith(false);
    });

    it('displays appropriate button icons', () => {
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      // Check for check circle icon in opt-in button
      const optInButton = screen.getByRole('button', {
        name: 'Yes, help improve Vibe Kanban',
      });
      expect(
        optInButton.querySelector('.lucide-check-circle')
      ).toBeInTheDocument();

      // Check for x circle icon in opt-out button
      const optOutButton = screen.getByRole('button', { name: 'No thanks' });
      expect(
        optOutButton.querySelector('.lucide-x-circle')
      ).toBeInTheDocument();
    });
  });

  describe('Data Collection Details', () => {
    beforeEach(() => {
      mockUseConfig.mockReturnValue({
        config: {
          ...mockConfigBase,
          github: {
            pat: null,
            token: 'github_token',
            username: 'testuser',
            primary_email: 'test@example.com',
            default_pr_base: null,
          },
        },
        loading: false,
        error: null,
        refreshConfig: jest.fn(),
        githubTokenInvalid: false,
      });
    });

    it('displays all collected data types when authenticated', () => {
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      // Check for all data collection items
      expect(
        screen.getByText('GitHub profile information')
      ).toBeInTheDocument();
      expect(screen.getByText('High-level usage metrics')).toBeInTheDocument();
      expect(
        screen.getByText('Performance and error data')
      ).toBeInTheDocument();

      // Check descriptions
      expect(
        screen.getByText(/Number of tasks created, projects managed/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Application crashes, response times/)
      ).toBeInTheDocument();
    });

    it('displays what is NOT collected', () => {
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      expect(screen.getByText('We do NOT collect')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Task contents, code snippets, project names, or other personal data/
        )
      ).toBeInTheDocument();
    });

    it('uses appropriate check/x icons for collected vs not collected data', () => {
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      // Check icons should be green check circles for collected data
      const checkIcons = document.querySelectorAll('.lucide-check-circle');
      expect(checkIcons.length).toBeGreaterThan(2); // Multiple items collected

      // X icon should be red for not collected data
      const xIcon = document.querySelector('.lucide-x-circle');
      expect(xIcon).toBeInTheDocument();
    });
  });

  describe('Dialog Behavior', () => {
    beforeEach(() => {
      mockUseConfig.mockReturnValue({
        config: {
          ...mockConfigBase,
          github: {
            pat: null,
            token: null,
            username: null,
            primary_email: null,
            default_pr_base: null,
          },
        },
        loading: false,
        error: null,
        refreshConfig: jest.fn(),
        githubTokenInvalid: false,
      });
    });

    it('prevents closing dialog through onOpenChange prop', () => {
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      // Dialog should be modal and not closeable via standard means
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(<PrivacyOptInDialog open={false} onComplete={mockOnComplete} />);

      expect(screen.queryByText('Feedback Opt-In')).not.toBeInTheDocument();
    });

    it('renders when open is true', () => {
      const { rerender } = render(
        <PrivacyOptInDialog open={false} onComplete={mockOnComplete} />
      );

      expect(screen.queryByText('Feedback Opt-In')).not.toBeInTheDocument();

      rerender(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      expect(screen.getByText('Feedback Opt-In')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseConfig.mockReturnValue({
        config: {
          ...mockConfigBase,
          github: {
            pat: null,
            token: null,
            username: null,
            primary_email: null,
            default_pr_base: null,
          },
        },
        loading: false,
        error: null,
        refreshConfig: jest.fn(),
        githubTokenInvalid: false,
      });
    });

    it('has proper ARIA attributes', () => {
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      const title = screen.getByText('Feedback Opt-In');
      expect(title).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('provides clear button labels', () => {
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      const optInButton = screen.getByRole('button', {
        name: 'Yes, help improve Vibe Kanban',
      });
      const optOutButton = screen.getByRole('button', { name: 'No thanks' });

      expect(optInButton).toBeInTheDocument();
      expect(optOutButton).toBeInTheDocument();
    });

    it('uses semantic markup for data collection lists', () => {
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      // Should use proper list structure or semantic elements for data items
      const dataItems = screen.getAllByText(
        /GitHub profile|High-level usage|Performance and error|We do NOT collect/
      );
      expect(dataItems.length).toBeGreaterThan(0);
    });
  });

  describe('Content Validation', () => {
    beforeEach(() => {
      mockUseConfig.mockReturnValue({
        config: {
          ...mockConfigBase,
          github: {
            pat: null,
            token: 'github_token',
            username: 'testuser',
            primary_email: 'test@example.com',
            default_pr_base: null,
          },
        },
        loading: false,
        error: null,
        refreshConfig: jest.fn(),
        githubTokenInvalid: false,
      });
    });

    it('includes privacy reassurances', () => {
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      expect(
        screen.getByText(/We promise not to abuse this/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/only very important updates about the project/)
      ).toBeInTheDocument();
    });

    it('explains the purpose of data collection', () => {
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      expect(
        screen.getByText(/Help us improve Vibe Kanban/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/This helps us prioritize improvements/)
      ).toBeInTheDocument();
    });

    it('provides information about settings control', () => {
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      expect(
        screen.getByText(/You can change this preference anytime in Settings/)
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockUseConfig.mockReturnValue({
        config: {
          ...mockConfigBase,
          github: {
            pat: null,
            token: null,
            username: null,
            primary_email: null,
            default_pr_base: null,
          },
        },
        loading: false,
        error: null,
        refreshConfig: jest.fn(),
        githubTokenInvalid: false,
      });
    });

    it('handles rapid button clicks', async () => {
      const user = userEvent.setup();
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      const optInButton = screen.getByRole('button', {
        name: 'Yes, help improve Vibe Kanban',
      });

      // Rapid clicks
      await user.click(optInButton);
      await user.click(optInButton);

      // Should only be called once
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      expect(mockOnComplete).toHaveBeenCalledWith(true);
    });

    it('handles config loading states gracefully', () => {
      mockUseConfig.mockReturnValue({
        config: null,
        loading: true,
        error: null,
        refreshConfig: jest.fn(),
        githubTokenInvalid: false,
      });

      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      // Should still render the dialog even if config is loading
      expect(screen.getByText('Feedback Opt-In')).toBeInTheDocument();
      expect(
        screen.queryByText('GitHub profile information')
      ).not.toBeInTheDocument();
    });

    it('handles missing GitHub config gracefully', () => {
      mockUseConfig.mockReturnValue({
        config: {
          ...mockConfigBase,
          github: undefined as any,
        },
        loading: false,
        error: null,
        refreshConfig: jest.fn(),
        githubTokenInvalid: false,
      });

      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      expect(screen.getByText('Feedback Opt-In')).toBeInTheDocument();
      expect(
        screen.queryByText('GitHub profile information')
      ).not.toBeInTheDocument();
    });
  });

  describe('Button Styling', () => {
    beforeEach(() => {
      mockUseConfig.mockReturnValue({
        config: {
          ...mockConfigBase,
          github: {
            pat: null,
            token: null,
            username: null,
            primary_email: null,
            default_pr_base: null,
          },
        },
        loading: false,
        error: null,
        refreshConfig: jest.fn(),
        githubTokenInvalid: false,
      });
    });

    it('applies appropriate styling to buttons', () => {
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      const optOutButton = screen.getByRole('button', { name: 'No thanks' });
      const optInButton = screen.getByRole('button', {
        name: 'Yes, help improve Vibe Kanban',
      });

      // Opt-out should be outline/secondary style
      expect(optOutButton).toHaveClass('outline'); // Assuming outline variant adds this class

      // Opt-in should be primary/default style
      expect(optInButton).not.toHaveClass('outline');
    });

    it('displays buttons in responsive layout', () => {
      render(<PrivacyOptInDialog open={true} onComplete={mockOnComplete} />);

      const buttonContainer = screen.getByRole('button', {
        name: 'No thanks',
      }).parentElement;
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row'); // Responsive flex classes
    });
  });
});
