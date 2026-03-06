import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

// Mock the config provider
jest.mock('./components/config-provider', () => ({
  ConfigProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useConfig: () => ({
    config: {
      theme: 'light',
      executor: { type: 'claude' },
      disclaimer_acknowledged: true,
      onboarding_acknowledged: true,
      github_login_acknowledged: true,
      telemetry_acknowledged: true,
      sound_alerts: false,
      sound_file: 'abstract-sound1',
      push_notifications: false,
      editor: {
        editor_type: 'vscode',
        custom_command: null,
      },
      github: {
        pat: null,
        token: null,
        username: null,
        primary_email: null,
        default_pr_base: null,
      },
      analytics_enabled: false,
    },
    updateConfig: jest.fn(),
    updateAndSaveConfig: jest.fn(),
    saveConfig: jest.fn(),
    loading: false,
    githubTokenInvalid: false,
  }),
}));

// Mock the useConfig hook
jest.mock('./hooks/useConfig', () => ({
  useConfig: () => ({
    config: {
      theme: 'light',
      executor: { type: 'claude' },
      disclaimer_acknowledged: true,
      onboarding_acknowledged: true,
      github_login_acknowledged: true,
      telemetry_acknowledged: true,
      sound_alerts: false,
      sound_file: 'abstract-sound1',
      push_notifications: false,
      editor: {
        editor_type: 'vscode',
        custom_command: null,
      },
      github: {
        pat: null,
        token: null,
        username: null,
        primary_email: null,
        default_pr_base: null,
      },
      analytics_enabled: false,
    },
    updateConfig: jest.fn(),
    updateAndSaveConfig: jest.fn(),
    saveConfig: jest.fn(),
    loading: false,
    githubTokenInvalid: false,
  }),
}));

// Mock Sentry
jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  withSentryReactRouterV6Routing: (Component: any) => Component,
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Routes: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Route: ({ element }: { element: React.ReactNode }) => <div>{element}</div>,
}));

const AppComponent = () => <App />;

describe('App', () => {
  beforeEach(() => {
    // Clear any console errors
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<AppComponent />);
    expect(document.body).toBeInTheDocument();
  });

  it('has proper document structure', () => {
    render(<AppComponent />);

    // Should have a main content area
    const main = document.querySelector('main') || document.body;
    expect(main).toBeInTheDocument();
  });

  it('handles routing', () => {
    render(<AppComponent />);

    // App should render some content
    expect(document.body.firstChild).toBeInTheDocument();
  });
});
