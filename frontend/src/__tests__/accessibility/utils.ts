/**
 * Accessibility testing utilities
 */

// Import removed - functions were unused

// Common accessibility testing helpers
export const accessibilityUtils = {
  /**
   * Check if an element has proper ARIA labels
   */
  hasAccessibleName: (element: HTMLElement): boolean => {
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    const textContent = element.textContent?.trim();

    return !!(ariaLabel || ariaLabelledBy || textContent);
  },

  /**
   * Check if an element has proper ARIA description
   */
  hasAccessibleDescription: (element: HTMLElement): boolean => {
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    const ariaDescription = element.getAttribute('aria-description');

    return !!(ariaDescribedBy || ariaDescription);
  },

  /**
   * Check if interactive elements are keyboard accessible
   */
  isKeyboardAccessible: (element: HTMLElement): boolean => {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    const tabIndex = element.getAttribute('tabindex');

    // Elements that are naturally keyboard accessible
    const naturallyAccessible = [
      'button',
      'input',
      'select',
      'textarea',
      'a',
    ].includes(tagName);

    // Elements with interactive roles
    const interactiveRoles = [
      'button',
      'link',
      'checkbox',
      'radio',
      'textbox',
      'combobox',
      'listbox',
      'tab',
      'menuitem',
      'menuitemcheckbox',
      'menuitemradio',
    ];

    const hasInteractiveRole = role && interactiveRoles.includes(role);
    const hasTabIndex = tabIndex !== null && parseInt(tabIndex) >= -1;

    return naturallyAccessible || hasInteractiveRole || hasTabIndex;
  },

  /**
   * Check if an element has proper contrast ratio
   */
  hasProperContrast: (element: HTMLElement): boolean => {
    // This is a simplified check - in practice, you'd use a more sophisticated
    // color contrast calculation or a library like axe-core
    const style = window.getComputedStyle(element);
    const backgroundColor = style.backgroundColor;
    const color = style.color;

    // Basic check - ensure both colors are defined
    return (
      backgroundColor !== 'rgba(0, 0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)'
    );
  },

  /**
   * Check if form elements have proper labels
   */
  hasProperFormLabel: (element: HTMLElement): boolean => {
    const tagName = element.tagName.toLowerCase();

    if (!['input', 'select', 'textarea'].includes(tagName)) {
      return true; // Not a form element
    }

    const id = element.id;
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');

    // Check for explicit label
    const label = id ? document.querySelector(`label[for="${id}"]`) : null;

    // Check for implicit label (element wrapped in label)
    const parentLabel = element.closest('label');

    return !!(ariaLabel || ariaLabelledBy || label || parentLabel);
  },

  /**
   * Check if an element has proper heading hierarchy
   */
  hasProperHeadingHierarchy: (container: HTMLElement): boolean => {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels = Array.from(headings).map((h) =>
      parseInt(h.tagName[1])
    );

    if (headingLevels.length === 0) return true;

    // Check if headings start with h1 or h2 (allowing for page context)
    if (headingLevels[0] > 2) return false;

    // Check if there are no gaps in heading levels
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i];
      const previousLevel = headingLevels[i - 1];

      // Heading level can't jump by more than 1
      if (currentLevel > previousLevel + 1) {
        return false;
      }
    }

    return true;
  },

  /**
   * Check if lists are properly structured
   */
  hasProperListStructure: (container: HTMLElement): boolean => {
    const lists = container.querySelectorAll('ul, ol');

    for (const list of lists) {
      const children = Array.from(list.children);

      // All direct children should be li elements
      const allListItems = children.every(
        (child) => child.tagName.toLowerCase() === 'li'
      );
      if (!allListItems) return false;

      // List should have at least one item
      if (children.length === 0) return false;
    }

    return true;
  },

  /**
   * Check if images have alt text
   */
  hasProperImageAlt: (container: HTMLElement): boolean => {
    const images = container.querySelectorAll('img');

    for (const img of images) {
      const alt = img.getAttribute('alt');
      const ariaLabel = img.getAttribute('aria-label');
      const ariaLabelledBy = img.getAttribute('aria-labelledby');
      const role = img.getAttribute('role');

      // Decorative images should have empty alt or role="presentation"
      if (role === 'presentation' || role === 'none') continue;

      // Images should have some form of alternative text
      if (!alt && !ariaLabel && !ariaLabelledBy) return false;
    }

    return true;
  },
};

// Testing helpers for screen readers
export const screenReaderUtils = {
  /**
   * Get the accessible name of an element
   */
  getAccessibleName: (element: HTMLElement): string => {
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      return labelElement?.textContent?.trim() || '';
    }

    // For form elements, check for associated label
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent?.trim() || '';
    }

    // Check for parent label
    const parentLabel = element.closest('label');
    if (parentLabel) {
      return parentLabel.textContent?.trim() || '';
    }

    // Fallback to text content
    return element.textContent?.trim() || '';
  },

  /**
   * Get the accessible description of an element
   */
  getAccessibleDescription: (element: HTMLElement): string => {
    const ariaDescription = element.getAttribute('aria-description');
    if (ariaDescription) return ariaDescription;

    const ariaDescribedBy = element.getAttribute('aria-describedby');
    if (ariaDescribedBy) {
      const descElement = document.getElementById(ariaDescribedBy);
      return descElement?.textContent?.trim() || '';
    }

    return '';
  },

  /**
   * Check if element is announced by screen readers
   */
  isAnnounced: (element: HTMLElement): boolean => {
    const ariaHidden = element.getAttribute('aria-hidden');
    const style = window.getComputedStyle(element);

    // Hidden elements are not announced
    if (ariaHidden === 'true') return false;
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden') return false;

    return true;
  },
};

// Keyboard navigation testing helpers
export const keyboardUtils = {
  /**
   * Simulate tab navigation
   */
  simulateTabNavigation: (container: HTMLElement): HTMLElement[] => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    return Array.from(focusableElements) as HTMLElement[];
  },

  /**
   * Test tab order
   */
  testTabOrder: (container: HTMLElement): boolean => {
    const focusableElements = keyboardUtils.simulateTabNavigation(container);

    for (let i = 0; i < focusableElements.length - 1; i++) {
      const current = focusableElements[i];
      const next = focusableElements[i + 1];

      const currentTabIndex = parseInt(current.getAttribute('tabindex') || '0');
      const nextTabIndex = parseInt(next.getAttribute('tabindex') || '0');

      // Tab order should be logical
      if (
        currentTabIndex > 0 &&
        nextTabIndex > 0 &&
        currentTabIndex > nextTabIndex
      ) {
        return false;
      }
    }

    return true;
  },

  /**
   * Simulate keyboard interaction
   */
  simulateKeyPress: (
    element: HTMLElement,
    key: string,
    modifiers?: {
      ctrlKey?: boolean;
      altKey?: boolean;
      shiftKey?: boolean;
      metaKey?: boolean;
    }
  ) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      ...modifiers,
    });

    element.dispatchEvent(event);
    return event;
  },
};

// ARIA testing helpers
export const ariaUtils = {
  /**
   * Check if ARIA attributes are valid
   */
  hasValidAriaAttributes: (element: HTMLElement): boolean => {
    const validAriaAttributes = [
      'aria-label',
      'aria-labelledby',
      'aria-describedby',
      'aria-description',
      'aria-hidden',
      'aria-expanded',
      'aria-selected',
      'aria-checked',
      'aria-pressed',
      'aria-current',
      'aria-live',
      'aria-atomic',
      'aria-relevant',
      'aria-busy',
      'aria-disabled',
      'aria-invalid',
      'aria-required',
      'aria-readonly',
      'aria-multiline',
      'aria-autocomplete',
      'aria-haspopup',
      'aria-controls',
      'aria-owns',
      'aria-flowto',
      'aria-orientation',
      'aria-valuemin',
      'aria-valuemax',
      'aria-valuenow',
      'aria-valuetext',
      'aria-level',
      'aria-multiselectable',
      'aria-placeholder',
    ];

    const attributes = Array.from(element.attributes);
    const ariaAttributes = attributes.filter((attr) =>
      attr.name.startsWith('aria-')
    );

    return ariaAttributes.every((attr) =>
      validAriaAttributes.includes(attr.name)
    );
  },

  /**
   * Check live region announcements
   */
  hasLiveRegion: (container: HTMLElement): HTMLElement[] => {
    return Array.from(
      container.querySelectorAll('[aria-live]')
    ) as HTMLElement[];
  },

  /**
   * Check for ARIA landmarks
   */
  hasLandmarks: (container: HTMLElement): boolean => {
    const landmarks = container.querySelectorAll(
      '[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], [role="search"], [role="form"], [role="region"]'
    );

    return landmarks.length > 0;
  },
};

// Color and contrast testing helpers
export const colorUtils = {
  /**
   * Convert hex color to RGB
   */
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  /**
   * Calculate relative luminance
   */
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio
   */
  getContrastRatio: (color1: string, color2: string): number => {
    const rgb1 = colorUtils.hexToRgb(color1);
    const rgb2 = colorUtils.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const lum1 = colorUtils.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = colorUtils.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  },
};

// Export all utilities
export {
  accessibilityUtils as a11y,
  screenReaderUtils as screenReader,
  keyboardUtils as keyboard,
  ariaUtils as aria,
  colorUtils as color,
};
