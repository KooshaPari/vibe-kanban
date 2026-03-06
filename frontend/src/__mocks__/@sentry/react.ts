import React from 'react';

export const withSentryReactRouterV6Routing = (
  Component: React.ComponentType
) => Component;

export const init = jest.fn();
export const captureException = jest.fn();
export const captureMessage = jest.fn();
export const withSentry = (Component: React.ComponentType) => Component;
export const getCurrentHub = jest.fn(() => ({
  getClient: jest.fn(() => ({
    getOptions: jest.fn(() => ({})),
  })),
}));
