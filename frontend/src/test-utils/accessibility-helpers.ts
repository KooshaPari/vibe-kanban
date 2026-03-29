import { RenderResult } from '@testing-library/react';
import { axe, AxeResults } from 'jest-axe';
import userEvent from '@testing-library/user-event';

/**
 * Enhanced accessibility testing utilities for consistent testing across components
 */

/**
 * Test keyboard navigation patterns
 */
export const testKeyboardNavigation = {
  /**
   * Test tab navigation through focusable elements
   */
  async testTabOrder(elements: HTMLElement[]): Promise<void> {
    const user = userEvent.setup();

    for (let i = 0; i < elements.length; i++) {
      await user.tab();
      expect(elements[i]).toHaveFocus();
    }
  },

  /**
   * Test reverse tab navigation
   */
  async testReverseTabOrder(elements: HTMLElement[]): Promise<void> {
    const user = userEvent.setup();

    // Start from the last element
    elements[elements.length - 1].focus();

    for (let i = elements.length - 2; i >= 0; i--) {
      await user.tab({ shift: true });
      expect(elements[i]).toHaveFocus();
    }
  },

  /**
   * Test Enter and Space key activation
   */
  async testActivationKeys(
    element: HTMLElement,
    callback: jest.Mock
  ): Promise<void> {
    const user = userEvent.setup();

    element.focus();

    // Test Enter key
    await user.keyboard('{Enter}');
    expect(callback).toHaveBeenCalled();

    callback.mockClear();

    // Test Space key
    await user.keyboard(' ');
    expect(callback).toHaveBeenCalled();
  },

  /**
   * Test Escape key functionality
   */
  async testEscapeKey(
    element: HTMLElement,
    callback: jest.Mock
  ): Promise<void> {
    const user = userEvent.setup();

    element.focus();
    await user.keyboard('{Escape}');
    expect(callback).toHaveBeenCalled();
  },

  /**
   * Test arrow key navigation in menus/lists
   */
  async testArrowKeyNavigation(
    elements: HTMLElement[],
    direction: 'horizontal' | 'vertical' = 'vertical'
  ): Promise<void> {
    const user = userEvent.setup();
    const downKey = direction === 'vertical' ? '{ArrowDown}' : '{ArrowRight}';
    const upKey = direction === 'vertical' ? '{ArrowUp}' : '{ArrowLeft}';

    // Start with first element focused
    elements[0].focus();
    expect(elements[0]).toHaveFocus();

    // Navigate forward
    for (let i = 1; i < elements.length; i++) {
      await user.keyboard(downKey);
      expect(elements[i]).toHaveFocus();
    }

    // Navigate backward
    for (let i = elements.length - 2; i >= 0; i--) {
      await user.keyboard(upKey);
      expect(elements[i]).toHaveFocus();
    }
  },
};

/**
 * Test screen reader compatibility
 */
export const testScreenReaderCompatibility = {
  /**
   * Verify element has accessible name
   */
  testAccessibleName(element: HTMLElement, expectedName?: string): void {
    expect(element).toHaveAccessibleName();
    if (expectedName) {
      expect(element).toHaveAccessibleName(expectedName);
    }
  },

  /**
   * Verify element has accessible description
   */
  testAccessibleDescription(
    element: HTMLElement,
    expectedDescription?: string
  ): void {
    expect(element).toHaveAccessibleDescription();
    if (expectedDescription) {
      expect(element).toHaveAccessibleDescription(expectedDescription);
    }
  },

  /**
   * Test proper heading hierarchy
   */
  testHeadingHierarchy(container: HTMLElement): void {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const levels: number[] = [];

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      levels.push(level);
    });

    // Check that heading levels don't skip (e.g., h1 -> h3 without h2)
    for (let i = 1; i < levels.length; i++) {
      const diff = levels[i] - levels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  },

  /**
   * Test landmark roles
   */
  testLandmarks(expectedLandmarks: string[]): void {
    expectedLandmarks.forEach((landmark) => {
      expect(
        document.querySelector(`[role="${landmark}"]`)
      ).toBeInTheDocument();
    });
  },
};

/**
 * Test ARIA attributes and relationships
 */
export const testAriaAttributes = {
  /**
   * Test required ARIA attributes
   */
  testRequiredAria(
    element: HTMLElement,
    requiredAttributes: Record<string, string>
  ): void {
    Object.entries(requiredAttributes).forEach(([attr, value]) => {
      expect(element).toHaveAttribute(attr, value);
    });
  },

  /**
   * Test ARIA relationships (labelledby, describedby, etc.)
   */
  testAriaRelationships(
    element: HTMLElement,
    relationships: Record<string, string>
  ): void {
    Object.entries(relationships).forEach(([attr, targetId]) => {
      expect(element).toHaveAttribute(attr, targetId);
      expect(document.getElementById(targetId)).toBeInTheDocument();
    });
  },

  /**
   * Test live regions
   */
  testLiveRegions(
    expectedRegions: Array<{
      selector: string;
      politeness: 'polite' | 'assertive';
    }>
  ): void {
    expectedRegions.forEach(({ selector, politeness }) => {
      const region = document.querySelector(selector);
      expect(region).toHaveAttribute('aria-live', politeness);
    });
  },

  /**
   * Test form labeling
   */
  testFormLabeling(formElement: HTMLElement): void {
    const inputs = formElement.querySelectorAll('input, select, textarea');

    inputs.forEach((input) => {
      const hasLabel =
        input.hasAttribute('aria-label') ||
        input.hasAttribute('aria-labelledby') ||
        document.querySelector(`label[for="${input.getAttribute('id')}"]`);

      expect(hasLabel).toBeTruthy();
    });
  },
};

/**
 * Test color contrast and visual indicators
 */
export const testVisualAccessibility = {
  /**
   * Test focus indicators presence
   */
  testFocusIndicators(elements: HTMLElement[]): void {
    elements.forEach((element) => {
      const hasFocusStyles =
        element.classList.toString().includes('focus') ||
        getComputedStyle(element).outline !== 'none';
      expect(hasFocusStyles).toBeTruthy();
    });
  },

  /**
   * Test minimum touch target sizes (44px minimum)
   */
  testTouchTargets(interactiveElements: HTMLElement[]): void {
    interactiveElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const minSize = 44; // WCAG recommendation

      expect(Math.max(rect.width, rect.height)).toBeGreaterThanOrEqual(minSize);
    });
  },

  /**
   * Test text scaling compatibility
   */
  testTextScaling(container: HTMLElement): void {
    // Simulate 200% text scaling
    const originalFontSize = window.getComputedStyle(
      document.documentElement
    ).fontSize;
    document.documentElement.style.fontSize = '32px'; // 200% of 16px

    // Check that content is still readable and functional
    const textElements = container.querySelectorAll(
      'p, span, div, button, input'
    );
    textElements.forEach((element) => {
      expect(element).toBeVisible();
    });

    // Reset font size
    document.documentElement.style.fontSize = originalFontSize;
  },
};

/**
 * Test error states and validation
 */
export const testErrorStates = {
  /**
   * Test form validation messaging
   */
  testValidationMessages(formInputs: HTMLElement[]): void {
    formInputs.forEach((input) => {
      if (input.hasAttribute('aria-invalid')) {
        const errorId = input.getAttribute('aria-describedby');
        if (errorId) {
          const errorElement = document.getElementById(errorId);
          expect(errorElement).toBeInTheDocument();
          expect(errorElement).toHaveAttribute('role', 'alert');
        }
      }
    });
  },

  /**
   * Test error announcement
   */
  async testErrorAnnouncement(
    triggerError: () => Promise<void>
  ): Promise<void> {
    await triggerError();

    // Check for alert or status announcements
    const alerts = document.querySelectorAll(
      '[role="alert"], [aria-live="assertive"]'
    );
    expect(alerts.length).toBeGreaterThan(0);
  },
};

/**
 * Comprehensive accessibility test suite
 */
export const runAccessibilityTestSuite = async (
  renderResult: RenderResult,
  options: {
    skipAxe?: boolean;
    skipKeyboard?: boolean;
    skipScreenReader?: boolean;
    skipAria?: boolean;
    skipVisual?: boolean;
    customTests?: Array<() => void | Promise<void>>;
  } = {}
): Promise<AxeResults | null> => {
  const { container } = renderResult;
  let axeResults: AxeResults | null = null;

  // 1. Automated accessibility testing with axe
  if (!options.skipAxe) {
    axeResults = await axe(container);
    expect(axeResults).toHaveNoViolations();
  }

  // 2. Keyboard navigation tests
  if (!options.skipKeyboard) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length > 0) {
      testVisualAccessibility.testFocusIndicators(
        Array.from(focusableElements)
      );
    }
  }

  // 3. Screen reader compatibility
  if (!options.skipScreenReader) {
    testScreenReaderCompatibility.testHeadingHierarchy(container);
  }

  // 4. ARIA attributes
  if (!options.skipAria) {
    const formElements = container.querySelectorAll('form');
    formElements.forEach((form) => {
      testAriaAttributes.testFormLabeling(form as HTMLElement);
    });
  }

  // 5. Visual accessibility
  if (!options.skipVisual) {
    const interactiveElements = container.querySelectorAll(
      'button, [role="button"], input, select, textarea, a[href]'
    ) as NodeListOf<HTMLElement>;

    if (interactiveElements.length > 0) {
      // Note: Touch target testing might need adjustment in JSDOM environment
      // testVisualAccessibility.testTouchTargets(Array.from(interactiveElements));
    }
  }

  // 6. Custom tests
  if (options.customTests) {
    for (const test of options.customTests) {
      await test();
    }
  }

  return axeResults;
};

/**
 * Mock user preferences for testing
 */
export const mockUserPreferences = {
  /**
   * Mock prefers-reduced-motion
   */
  reducedMotion: (enabled: boolean = true): void => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return {
            matches: enabled,
            media: query,
            onchange: null,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
          };
        }
        return {
          matches: false,
          media: query,
          onchange: null,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      }),
    });
  },

  /**
   * Mock high contrast mode
   */
  highContrast: (enabled: boolean = true): void => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => {
        if (query === '(prefers-contrast: high)') {
          return {
            matches: enabled,
            media: query,
            onchange: null,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
          };
        }
        return {
          matches: false,
          media: query,
          onchange: null,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      }),
    });
  },

  /**
   * Mock forced colors mode
   */
  forcedColors: (enabled: boolean = true): void => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => {
        if (query === '(forced-colors: active)') {
          return {
            matches: enabled,
            media: query,
            onchange: null,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
          };
        }
        return {
          matches: false,
          media: query,
          onchange: null,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      }),
    });
  },
};

/**
 * Viewport testing utilities
 */
export const testViewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 800 },

  /**
   * Set viewport size for testing
   */
  setViewport(viewport: { width: number; height: number }): void {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: viewport.width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: viewport.height,
    });

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  },
};
