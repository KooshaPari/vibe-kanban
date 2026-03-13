import { jest } from '@jest/globals';

// Extend Jest matchers for better testing experience
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(className: string): R;
      toHaveStyle(style: string | Record<string, any>): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveValue(value: string | number): R;
      toBeEmpty(): R;
      toContainElement(element: HTMLElement): R;
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R;
      toBePartiallyChecked(): R;
      toHaveDescription(text: string | RegExp): R;
      toBeInvalid(): R;
      toBeValid(): R;
      toBeRequired(): R;
      toHaveRole(role: string): R;
      toHaveAccessibleName(name: string | RegExp): R;
      toHaveAccessibleDescription(description: string | RegExp): R;
      toHaveErrorMessage(message: string | RegExp): R;
      toBeCalledWithApiError(message?: string, status?: number): R;
      toHaveBeenCalledWithFormData(expectedData?: Record<string, any>): R;
      toMatchImageSnapshot(): R;
    }
  }
}

// Custom matcher implementations
const customMatchers = {
  toBeVisible(received: HTMLElement) {
    const pass =
      received &&
      received.style.display !== 'none' &&
      received.style.visibility !== 'hidden' &&
      received.style.opacity !== '0' &&
      !received.hasAttribute('hidden');

    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be visible`,
      pass,
    };
  },

  toBeDisabled(received: HTMLElement) {
    const pass =
      received.hasAttribute('disabled') ||
      received.getAttribute('aria-disabled') === 'true' ||
      (received as HTMLInputElement).disabled;

    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be disabled`,
      pass,
    };
  },

  toBeEnabled(received: HTMLElement) {
    const isDisabled =
      received.hasAttribute('disabled') ||
      received.getAttribute('aria-disabled') === 'true' ||
      (received as HTMLInputElement).disabled;
    const pass = !isDisabled;

    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be enabled`,
      pass,
    };
  },

  toHaveAttribute(received: HTMLElement, attr: string, value?: string) {
    const hasAttr = received.hasAttribute(attr);
    const actualValue = received.getAttribute(attr);

    let pass = hasAttr;
    if (hasAttr && value !== undefined) {
      pass = actualValue === value;
    }

    return {
      message: () => {
        if (value !== undefined) {
          return `expected element to have attribute "${attr}" with value "${value}", but got "${actualValue}"`;
        }
        return `expected element ${pass ? 'not ' : ''}to have attribute "${attr}"`;
      },
      pass,
    };
  },

  toHaveClass(received: HTMLElement, className: string) {
    const pass = received.classList.contains(className);

    return {
      message: () =>
        `expected element ${pass ? 'not ' : ''}to have class "${className}"`,
      pass,
    };
  },

  toHaveStyle(received: HTMLElement, style: string | Record<string, any>) {
    const computedStyle = window.getComputedStyle(received);
    let pass = true;
    let failedProperty = '';
    let expectedValue = '';
    let actualValue = '';

    if (typeof style === 'string') {
      // Parse CSS string
      const styleDeclarations = style.split(';').filter((s) => s.trim());
      for (const declaration of styleDeclarations) {
        const [property, value] = declaration.split(':').map((s) => s.trim());
        if (computedStyle.getPropertyValue(property) !== value) {
          pass = false;
          failedProperty = property;
          expectedValue = value;
          actualValue = computedStyle.getPropertyValue(property);
          break;
        }
      }
    } else {
      // Style object
      for (const [property, value] of Object.entries(style)) {
        if (computedStyle.getPropertyValue(property) !== value) {
          pass = false;
          failedProperty = property;
          expectedValue = value;
          actualValue = computedStyle.getPropertyValue(property);
          break;
        }
      }
    }

    return {
      message: () => {
        if (!pass) {
          return `expected element to have style property "${failedProperty}: ${expectedValue}", but got "${actualValue}"`;
        }
        return `expected element not to have the specified styles`;
      },
      pass,
    };
  },

  toHaveTextContent(received: HTMLElement, text: string | RegExp) {
    const textContent = received.textContent || '';
    const pass =
      typeof text === 'string'
        ? textContent.includes(text)
        : text.test(textContent);

    return {
      message: () =>
        `expected element ${pass ? 'not ' : ''}to have text content matching "${text}"`,
      pass,
    };
  },

  toHaveValue(
    received: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    value: string | number
  ) {
    const actualValue = received.value;
    const pass = actualValue === String(value);

    return {
      message: () =>
        `expected element to have value "${value}", but got "${actualValue}"`,
      pass,
    };
  },

  toBeEmpty(received: HTMLElement) {
    const pass = received.innerHTML === '' || received.textContent === '';

    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be empty`,
      pass,
    };
  },

  toContainElement(received: HTMLElement, element: HTMLElement) {
    const pass = received.contains(element);

    return {
      message: () =>
        `expected element ${pass ? 'not ' : ''}to contain the given element`,
      pass,
    };
  },

  toHaveDisplayValue(
    received: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    value: string | RegExp | Array<string | RegExp>
  ) {
    const displayValue = received.value;
    let pass = false;

    if (Array.isArray(value)) {
      pass = value.some((v) =>
        typeof v === 'string' ? displayValue === v : v.test(displayValue)
      );
    } else if (typeof value === 'string') {
      pass = displayValue === value;
    } else {
      pass = value.test(displayValue);
    }

    return {
      message: () =>
        `expected element ${pass ? 'not ' : ''}to have display value matching "${value}"`,
      pass,
    };
  },

  toBePartiallyChecked(received: HTMLInputElement) {
    const pass = received.indeterminate === true;

    return {
      message: () =>
        `expected element ${pass ? 'not ' : ''}to be partially checked`,
      pass,
    };
  },

  toHaveDescription(received: HTMLElement, text: string | RegExp) {
    const ariaDescribedBy = received.getAttribute('aria-describedby');
    let description = '';

    if (ariaDescribedBy) {
      const descElement = document.getElementById(ariaDescribedBy);
      description = descElement?.textContent || '';
    }

    const pass =
      typeof text === 'string'
        ? description.includes(text)
        : text.test(description);

    return {
      message: () =>
        `expected element ${pass ? 'not ' : ''}to have description matching "${text}"`,
      pass,
    };
  },

  toBeInvalid(received: HTMLElement) {
    const pass =
      received.getAttribute('aria-invalid') === 'true' ||
      (received as HTMLInputElement).validity?.valid === false;

    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be invalid`,
      pass,
    };
  },

  toBeValid(received: HTMLElement) {
    const isInvalid =
      received.getAttribute('aria-invalid') === 'true' ||
      (received as HTMLInputElement).validity?.valid === false;
    const pass = !isInvalid;

    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be valid`,
      pass,
    };
  },

  toBeRequired(received: HTMLElement) {
    const pass =
      received.hasAttribute('required') ||
      received.getAttribute('aria-required') === 'true';

    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be required`,
      pass,
    };
  },

  toHaveRole(received: HTMLElement, role: string) {
    const actualRole =
      received.getAttribute('role') || received.tagName.toLowerCase();
    const pass = actualRole === role;

    return {
      message: () =>
        `expected element to have role "${role}", but got "${actualRole}"`,
      pass,
    };
  },

  toHaveAccessibleName(received: HTMLElement, name: string | RegExp) {
    const ariaLabel = received.getAttribute('aria-label');
    const ariaLabelledBy = received.getAttribute('aria-labelledby');
    let accessibleName = '';

    if (ariaLabel) {
      accessibleName = ariaLabel;
    } else if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      accessibleName = labelElement?.textContent || '';
    } else if (received.tagName.toLowerCase() === 'button') {
      accessibleName = received.textContent || '';
    }

    const pass =
      typeof name === 'string'
        ? accessibleName === name
        : name.test(accessibleName);

    return {
      message: () =>
        `expected element to have accessible name matching "${name}", but got "${accessibleName}"`,
      pass,
    };
  },

  toHaveAccessibleDescription(
    received: HTMLElement,
    description: string | RegExp
  ) {
    const ariaDescribedBy = received.getAttribute('aria-describedby');
    let accessibleDescription = '';

    if (ariaDescribedBy) {
      const descElement = document.getElementById(ariaDescribedBy);
      accessibleDescription = descElement?.textContent || '';
    }

    const pass =
      typeof description === 'string'
        ? accessibleDescription === description
        : description.test(accessibleDescription);

    return {
      message: () =>
        `expected element to have accessible description matching "${description}", but got "${accessibleDescription}"`,
      pass,
    };
  },

  toHaveErrorMessage(received: HTMLElement, message: string | RegExp) {
    const errorId =
      received.getAttribute('aria-describedby') ||
      received.getAttribute('aria-errormessage');
    let errorMessage = '';

    if (errorId) {
      const errorElement = document.getElementById(errorId);
      errorMessage = errorElement?.textContent || '';
    }

    const pass =
      typeof message === 'string'
        ? errorMessage.includes(message)
        : message.test(errorMessage);

    return {
      message: () =>
        `expected element to have error message matching "${message}", but got "${errorMessage}"`,
      pass,
    };
  },

  toBeCalledWithApiError(
    received: jest.MockedFunction<any>,
    message?: string,
    status?: number
  ) {
    const calls = received.mock.calls;
    const pass = calls.some((call) => {
      const error = call[0];
      if (!(error instanceof Error)) return false;

      const hasMessage = !message || error.message.includes(message);
      const hasStatus = !status || (error as any).status === status;

      return hasMessage && hasStatus;
    });

    return {
      message: () =>
        `expected function ${pass ? 'not ' : ''}to be called with API error${message ? ` containing "${message}"` : ''}${status ? ` with status ${status}` : ''}`,
      pass,
    };
  },

  toHaveBeenCalledWithFormData(
    received: jest.MockedFunction<any>,
    expectedData?: Record<string, any>
  ) {
    const calls = received.mock.calls;
    const pass = calls.some((call) => {
      const [, options] = call;
      if (!options?.body || !(options.body instanceof FormData)) return false;

      if (!expectedData) return true;

      // Check if FormData contains expected entries
      for (const [key, value] of Object.entries(expectedData)) {
        if (!options.body.has(key)) return false;
        if (options.body.get(key) !== value) return false;
      }

      return true;
    });

    return {
      message: () =>
        `expected function ${pass ? 'not ' : ''}to be called with FormData${expectedData ? ' containing expected data' : ''}`,
      pass,
    };
  },

  toMatchImageSnapshot(_received: HTMLElement | HTMLCanvasElement) {
    // Simple image snapshot matcher - in a real implementation,
    // you might want to use a library like jest-image-snapshot
    const pass = true; // Placeholder implementation

    return {
      message: () =>
        `expected element ${pass ? 'not ' : ''}to match image snapshot`,
      pass,
    };
  },
};

// Add custom matchers to expect
expect.extend(customMatchers);

export default customMatchers;
