import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GitHubLoginDialog } from '../GitHubLoginDialog';
import { useConfig } from '../config-provider';
import { githubAuthApi } from '../../lib/api';
import type { DeviceStartResponse } from 'shared/types';

// Mock dependencies
jest.mock('../config-provider');
jest.mock('../../lib/api');

const mockUseConfig = useConfig as jest.MockedFunction<typeof useConfig>;
const mockGithubAuthApi = githubAuthApi as jest.Mocked<typeof githubAuthApi>;

const mockDeviceResponse: DeviceStartResponse = {
  device_code: 'device_code_123',
  user_code: 'USER123',
  verification_uri: 'https://github.com/login/device',
  expires_in: 900,
  interval: 5,
};

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

describe('GitHubLoginDialog', () => {
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Unauthenticated State', () => {
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

    it('renders login prompt correctly', () => {
      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText('Sign in with GitHub')).toBeInTheDocument();
      expect(
        screen.getByText('Why do you need GitHub access?')
      ).toBeInTheDocument();
      expect(screen.getByText('Create pull requests')).toBeInTheDocument();
      expect(screen.getByText('Manage repositories')).toBeInTheDocument();
      expect(screen.getByText('Streamline workflow')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Sign in with GitHub/ })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
    });

    it('starts authentication flow when sign in button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockGithubAuthApi.start.mockResolvedValue(mockDeviceResponse);

      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      const signInButton = screen.getByRole('button', {
        name: /Sign in with GitHub/,
      });
      await user.click(signInButton);

      await waitFor(() => {
        expect(mockGithubAuthApi.start).toHaveBeenCalled();
      });
    });

    it('shows loading state during authentication start', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockGithubAuthApi.start.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      const signInButton = screen.getByRole('button', {
        name: /Sign in with GitHub/,
      });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Starting…')).toBeInTheDocument();
        expect(signInButton).toBeDisabled();
      });
    });

    it('handles authentication start error', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const errorMessage = 'Network error';
      mockGithubAuthApi.start.mockRejectedValue(new Error(errorMessage));

      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      const signInButton = screen.getByRole('button', {
        name: /Sign in with GitHub/,
      });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('allows user to skip authentication', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      const skipButton = screen.getByRole('button', { name: 'Skip' });
      await user.click(skipButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Device Authorization Flow', () => {
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

    it('displays device authorization instructions', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockGithubAuthApi.start.mockResolvedValue(mockDeviceResponse);

      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      const signInButton = screen.getByRole('button', {
        name: /Sign in with GitHub/,
      });
      await user.click(signInButton);

      await waitFor(() => {
        expect(
          screen.getByText('Complete GitHub Authorization')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Go to GitHub Device Authorization')
        ).toBeInTheDocument();
        expect(screen.getByText('Enter this code:')).toBeInTheDocument();
        expect(screen.getByText('USER123')).toBeInTheDocument();
        expect(
          screen.getByRole('link', { name: 'https://github.com/login/device' })
        ).toBeInTheDocument();
      });
    });

    it('automatically copies user code to clipboard', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockGithubAuthApi.start.mockResolvedValue(mockDeviceResponse);

      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      const signInButton = screen.getByRole('button', {
        name: /Sign in with GitHub/,
      });
      await user.click(signInButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('USER123');
        expect(
          screen.getByText(/Code copied to clipboard/)
        ).toBeInTheDocument();
      });
    });

    it('allows manual copy of user code', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockGithubAuthApi.start.mockResolvedValue(mockDeviceResponse);

      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      const signInButton = screen.getByRole('button', {
        name: /Sign in with GitHub/,
      });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('USER123')).toBeInTheDocument();
      });

      // Reset clipboard mock calls
      (navigator.clipboard.writeText as jest.Mock).mockClear();

      const copyButton = screen.getByRole('button', { name: /Copy/ });
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('USER123');
      await waitFor(() => {
        expect(screen.getByText('Copied')).toBeInTheDocument();
      });
    });

    it('starts polling for completion', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockGithubAuthApi.start.mockResolvedValue(mockDeviceResponse);
      mockGithubAuthApi.poll.mockResolvedValue(undefined);

      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      const signInButton = screen.getByRole('button', {
        name: /Sign in with GitHub/,
      });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('USER123')).toBeInTheDocument();
      });

      // Advance timer to trigger poll
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockGithubAuthApi.poll).toHaveBeenCalledWith('device_code_123');
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('handles polling authorization_pending', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockGithubAuthApi.start.mockResolvedValue(mockDeviceResponse);
      mockGithubAuthApi.poll
        .mockRejectedValueOnce(new Error('authorization_pending'))
        .mockResolvedValueOnce(undefined);

      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      const signInButton = screen.getByRole('button', {
        name: /Sign in with GitHub/,
      });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('USER123')).toBeInTheDocument();
      });

      // First poll - authorization pending
      jest.advanceTimersByTime(5000);
      await waitFor(() => {
        expect(mockGithubAuthApi.poll).toHaveBeenCalledTimes(1);
      });

      // Second poll - success
      jest.advanceTimersByTime(5000);
      await waitFor(() => {
        expect(mockGithubAuthApi.poll).toHaveBeenCalledTimes(2);
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('handles polling slow_down', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockGithubAuthApi.start.mockResolvedValue(mockDeviceResponse);
      mockGithubAuthApi.poll
        .mockRejectedValueOnce(new Error('slow_down'))
        .mockResolvedValueOnce(undefined);

      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      const signInButton = screen.getByRole('button', {
        name: /Sign in with GitHub/,
      });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('USER123')).toBeInTheDocument();
      });

      // First poll - slow down (should wait interval + 5 seconds)
      jest.advanceTimersByTime(5000);
      await waitFor(() => {
        expect(mockGithubAuthApi.poll).toHaveBeenCalledTimes(1);
      });

      // Should wait extra 5 seconds for slow down
      jest.advanceTimersByTime(10000); // 5 + 5 seconds
      await waitFor(() => {
        expect(mockGithubAuthApi.poll).toHaveBeenCalledTimes(2);
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('handles expired token', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockGithubAuthApi.start.mockResolvedValue(mockDeviceResponse);
      mockGithubAuthApi.poll.mockRejectedValue(new Error('expired_token'));

      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      const signInButton = screen.getByRole('button', {
        name: /Sign in with GitHub/,
      });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('USER123')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(
          screen.getByText('Device code expired. Please try again.')
        ).toBeInTheDocument();
      });
    });

    it('handles polling error', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockGithubAuthApi.start.mockResolvedValue(mockDeviceResponse);
      mockGithubAuthApi.poll.mockRejectedValue(new Error('Unexpected error'));

      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      const signInButton = screen.getByRole('button', {
        name: /Sign in with GitHub/,
      });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('USER123')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.getByText('Unexpected error')).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated State', () => {
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

    it('shows authenticated state', () => {
      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText('Successfully connected!')).toBeInTheDocument();
      expect(screen.getByText('You are signed in as')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('allows closing when authenticated', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      const closeButton = screen.getByRole('button', { name: 'Close' });
      await user.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      mockUseConfig.mockReturnValue({
        config: null,
        loading: true,
        error: null,
        refreshConfig: jest.fn(),
        githubTokenInvalid: false,
      });
    });

    it('shows loading state', () => {
      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });
  });

  describe('Invalid Token State', () => {
    beforeEach(() => {
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
    });

    it('treats invalid token as unauthenticated', () => {
      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      expect(
        screen.getByText('Why do you need GitHub access?')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Sign in with GitHub/ })
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Successfully connected!')
      ).not.toBeInTheDocument();
    });
  });

  describe('Fallback Clipboard API', () => {
    beforeEach(() => {
      // Mock fallback clipboard implementation
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      });

      // Mock document.execCommand
      document.execCommand = jest.fn(() => true);
    });

    afterEach(() => {
      // Restore clipboard API
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: jest.fn(() => Promise.resolve()),
        },
        configurable: true,
      });
    });

    it('uses fallback clipboard implementation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockGithubAuthApi.start.mockResolvedValue(mockDeviceResponse);

      render(<GitHubLoginDialog open={true} onOpenChange={mockOnOpenChange} />);

      const signInButton = screen.getByRole('button', {
        name: /Sign in with GitHub/,
      });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('USER123')).toBeInTheDocument();
      });

      // The fallback should be triggered automatically
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
  });
});
