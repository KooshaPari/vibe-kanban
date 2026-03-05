import { jest } from '@jest/globals';
import React from 'react';

// Type definitions
interface LinkProps {
  children: React.ReactNode;
  to: string;
  className?: string;
  [key: string]: unknown;
}

interface ClickEvent {
  preventDefault: () => void;
}

// Mock react-router-dom
export const mockNavigate = jest.fn();
export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default',
};

export const mockParams = {};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  useParams: () => mockParams,
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  Navigate: ({ to }: { to: string }) => {
    mockNavigate(to);
    return null;
  },
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  MemoryRouter: ({ children }: { children: React.ReactNode }) => children,
  Routes: ({ children }: { children: React.ReactNode }) => children,
  Route: ({ children }: { children: React.ReactNode }) => children,
  Link: ({ children, to, ...props }: LinkProps) =>
    React.createElement(
      'a',
      {
        href: to,
        ...props,
        onClick: (e: ClickEvent) => {
          e.preventDefault();
          mockNavigate(to);
        },
      },
      children
    ),
  NavLink: ({ children, to, ...props }: LinkProps) =>
    React.createElement(
      'a',
      {
        href: to,
        ...props,
        onClick: (e: ClickEvent) => {
          e.preventDefault();
          mockNavigate(to);
        },
      },
      children
    ),
}));

// Helper to set mock location
export const setMockLocation = (newLocation: Partial<typeof mockLocation>) => {
  Object.assign(mockLocation, newLocation);
};

// Helper to set mock params
export const setMockParams = (newParams: Record<string, string>) => {
  Object.assign(mockParams, newParams);
};

// Helper to reset router mocks
export const resetRouterMocks = () => {
  mockNavigate.mockReset();
  setMockLocation({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  });
  Object.keys(mockParams).forEach(
    (key) => delete (mockParams as Record<string, unknown>)[key]
  );
};
