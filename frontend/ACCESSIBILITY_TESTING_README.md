# Accessibility Testing Guide

This project includes comprehensive accessibility tests using jest-axe and @testing-library/jest-dom to ensure WCAG 2.1 AA compliance.

## Test Files Created

### Core Components
- `src/components/layout/navbar.a11y.test.tsx` - Navigation accessibility
- `src/components/tasks/TaskCard.a11y.test.tsx` - Task card interactions
- `src/components/tasks/TaskKanbanBoard.a11y.test.tsx` - Kanban board navigation
- `src/components/projects/ProjectCard.a11y.test.tsx` - Project card accessibility

### UI Components
- `src/components/ui/button.a11y.test.tsx` - Button component accessibility
- `src/components/ui/dialog.a11y.test.tsx` - Modal dialog accessibility
- `src/components/ui/input.a11y.test.tsx` - Form input accessibility

### Test Utilities
- `src/test-utils/accessibility-helpers.ts` - Reusable accessibility testing utilities
- `src/test-setup.ts` - Jest configuration with accessibility matchers

## What Each Test Covers

### 1. Automated Accessibility Testing (jest-axe)
- **WCAG violations**: Automated detection of accessibility issues
- **Color contrast**: Adequate contrast ratios
- **ARIA usage**: Proper ARIA attribute implementation
- **Form labeling**: Required form labels and descriptions
- **Heading structure**: Logical heading hierarchy

### 2. Keyboard Navigation Testing
- **Tab order**: Logical navigation through focusable elements
- **Focus trapping**: Modal dialogs trap focus appropriately
- **Keyboard shortcuts**: Enter, Space, Escape, Arrow keys
- **Focus indicators**: Visible focus styling
- **Skip links**: Bypass navigation for screen readers

### 3. Screen Reader Compatibility
- **Accessible names**: All interactive elements have accessible names
- **Accessible descriptions**: Help text properly associated
- **Live regions**: Dynamic content announcements
- **Landmark roles**: Proper page structure
- **State announcements**: Loading, error, success states

### 4. ARIA Attributes Testing
- **Roles**: Proper semantic roles for custom components
- **Properties**: aria-expanded, aria-selected, aria-checked
- **Relationships**: aria-labelledby, aria-describedby, aria-controls
- **States**: aria-hidden, aria-disabled, aria-invalid
- **Live regions**: aria-live, aria-atomic for dynamic content

### 5. Color Contrast and Visual Indicators
- **Focus indicators**: 2px minimum outline or equivalent
- **Text contrast**: 4.5:1 ratio for normal text, 3:1 for large text
- **Interactive states**: Hover, active, disabled states
- **Error states**: Clear visual error indicators
- **Touch targets**: 44px minimum for mobile

### 6. Responsive Accessibility
- **Mobile navigation**: Touch-friendly interactions
- **Viewport scaling**: Works with 200% zoom
- **Orientation changes**: Portrait/landscape support
- **Touch targets**: Adequate spacing and size
- **Text reflow**: Content reflows without horizontal scrolling

## Running the Tests

### Run All Accessibility Tests
```bash
npm run test:a11y
```

### Run Individual Test Files
```bash
# Test specific component
npm test navbar.a11y.test.tsx

# Test with watch mode
npm run test:watch -- --testPathPattern=a11y

# Test with coverage
npm test -- --coverage --testPathPattern=a11y
```

### Debug Mode
```bash
# Run tests with detailed output
npm test -- --verbose --testPathPattern=a11y

# Run specific test case
npm test -- --testNamePattern="keyboard navigation"
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- **Environment**: jsdom for DOM testing
- **Setup files**: Accessibility matchers and mocks
- **Module mapping**: Path aliases for imports
- **Coverage**: Accessibility test coverage tracking

### Setup File (`src/test-setup.ts`)
- **jest-axe matchers**: `toHaveNoViolations()`
- **DOM mocks**: ResizeObserver, IntersectionObserver
- **Accessibility helpers**: Color contrast mocking

## Testing Patterns

### Basic Accessibility Test Structure
```typescript
describe('Component Accessibility Tests', () => {
  describe('Automated Accessibility Testing', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(<Component />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    // Keyboard interaction tests
  });

  describe('Screen Reader Compatibility', () => {
    // ARIA and semantic HTML tests
  });

  describe('Color Contrast and Focus Indicators', () => {
    // Visual accessibility tests
  });
});
```

### Using Test Utilities
```typescript
import { 
  testKeyboardNavigation, 
  testScreenReaderCompatibility,
  runAccessibilityTestSuite 
} from '@/test-utils/accessibility-helpers';

// Comprehensive test suite
await runAccessibilityTestSuite(renderResult, {
  skipAxe: false,
  skipKeyboard: false,
  customTests: [
    () => testKeyboardNavigation.testTabOrder(focusableElements),
    () => testScreenReaderCompatibility.testAccessibleName(element)
  ]
});
```

## Best Practices

### 1. Test Real User Interactions
- Use `userEvent` for realistic interactions
- Test with keyboard-only navigation
- Verify screen reader announcements
- Test with assistive technology users in mind

### 2. Cover Edge Cases
- Empty states and loading states
- Error conditions and validation
- Long content and text wrapping
- Missing data scenarios

### 3. Test Different User Preferences
- Reduced motion preferences
- High contrast mode
- Forced colors mode
- Different viewport sizes

### 4. Maintain Test Quality
- Keep tests focused and descriptive
- Use meaningful assertions
- Update tests when accessibility requirements change
- Document accessibility decisions

## Common Accessibility Issues Caught

### Keyboard Navigation Issues
- Missing focus indicators
- Incorrect tab order
- Focus traps not working
- Keyboard shortcuts not implemented

### Screen Reader Issues
- Missing accessible names
- Improper heading hierarchy
- Missing form labels
- Unclear button purposes

### ARIA Issues
- Incorrect role usage
- Missing state announcements
- Broken ARIA relationships
- Invalid ARIA attributes

### Visual Issues
- Insufficient color contrast
- Missing focus indicators
- Too small touch targets
- Poor responsive behavior

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run Accessibility Tests
  run: npm run test:a11y -- --coverage --passWithNoTests

- name: Upload Accessibility Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
    flags: accessibility
```

### Pre-commit Hooks
```json
{
  "lint-staged": {
    "**/*.{ts,tsx}": [
      "npm run lint:fix",
      "npm run test:a11y -- --findRelatedTests --passWithNoTests"
    ]
  }
}
```

## Resources

### WCAG Guidelines
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?levels=aa)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Guidelines](https://webaim.org/articles/)

### Testing Tools
- [jest-axe Documentation](https://github.com/nickcolley/jest-axe)
- [Testing Library Accessibility](https://testing-library.com/docs/guide-which-query)
- [axe-core Rules](https://dequeuniversity.com/rules/axe/)

### Browser Testing
- Use browser accessibility tools for manual verification
- Test with actual screen readers (NVDA, JAWS, VoiceOver)
- Verify keyboard navigation in different browsers
- Test with browser zoom up to 200%

## Maintenance

### Regular Updates
- Update jest-axe to latest version for new rules
- Review and update test patterns
- Add tests for new accessibility requirements
- Monitor accessibility regression in CI

### Documentation
- Document accessibility decisions and exceptions
- Maintain accessibility test coverage metrics
- Update this guide when patterns change
- Share learnings with the team

## Getting Help

### Internal Resources
- Review existing test patterns in this codebase
- Check the accessibility helpers utility file
- Look at similar component tests for guidance

### External Resources
- [a11y Slack community](https://web-a11y.slack.com/)
- [WebAIM Discussion List](https://webaim.org/discussion/)
- [MDN Accessibility Documentation](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

Remember: Accessibility testing is not just about compliance—it's about creating inclusive experiences for all users. These tests help ensure that everyone can effectively use your application regardless of their abilities or the assistive technologies they use.