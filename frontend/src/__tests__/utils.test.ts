import { describe, it, expect } from '@jest/globals';
import { cn, is_planning_executor_type } from '../lib/utils';

describe('Utils Functions', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class');
      expect(result).toContain('base-class');
      expect(result).toContain('additional-class');
    });

    it('should handle conditional classes', () => {
      const result = cn(
        'base-class',
        true && 'conditional-class',
        false && 'hidden-class'
      );
      expect(result).toContain('base-class');
      expect(result).toContain('conditional-class');
      expect(result).not.toContain('hidden-class');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'valid-class');
      expect(result).toContain('base-class');
      expect(result).toContain('valid-class');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('should handle objects with boolean values', () => {
      const result = cn({
        active: true,
        inactive: false,
        visible: true,
      });
      expect(result).toContain('active');
      expect(result).not.toContain('inactive');
      expect(result).toContain('visible');
    });

    it('should merge conflicting Tailwind classes correctly', () => {
      // twMerge should handle conflicting Tailwind classes
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toContain('text-blue-500');
      expect(result).not.toContain('text-red-500');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle complex combinations', () => {
      const isActive = true;
      const variant = 'primary';
      const size = 'large';

      const result = cn(
        'base-button',
        {
          'button-active': isActive,
          'button-inactive': !isActive,
        },
        variant === 'primary' && 'button-primary',
        variant === 'secondary' && 'button-secondary',
        `button-${size}`,
        'extra-class'
      );

      expect(result).toContain('base-button');
      expect(result).toContain('button-active');
      expect(result).not.toContain('button-inactive');
      expect(result).toContain('button-primary');
      expect(result).not.toContain('button-secondary');
      expect(result).toContain('button-large');
      expect(result).toContain('extra-class');
    });

    it('should handle whitespace properly', () => {
      const result = cn('  class1  ', '  class2  ');
      expect(result.trim()).not.toBe('');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle duplicate classes', () => {
      const result = cn('duplicate-class', 'other-class', 'duplicate-class');
      // clsx preserves duplicates, twMerge handles Tailwind conflicts but not generic duplicates
      expect(result).toContain('duplicate-class');
      expect(result).toContain('other-class');
    });

    it('should work with template literals', () => {
      const prefix = 'btn';
      const variant = 'primary';
      const result = cn(`${prefix}-${variant}`, 'extra-class');
      expect(result).toContain('btn-primary');
      expect(result).toContain('extra-class');
    });

    it('should handle nested arrays and objects', () => {
      const result = cn(['class1', ['nested-class', { conditional: true }]], {
        'object-class': true,
        'hidden-class': false,
      });
      expect(result).toContain('class1');
      expect(result).toContain('nested-class');
      expect(result).toContain('conditional');
      expect(result).toContain('object-class');
      expect(result).not.toContain('hidden-class');
    });
  });

  describe('is_planning_executor_type', () => {
    it('should return true for claude-plan executor', () => {
      expect(is_planning_executor_type('claude-plan')).toBe(true);
    });

    it('should return false for non-planning executors', () => {
      expect(is_planning_executor_type('claude')).toBe(false);
      expect(is_planning_executor_type('gemini')).toBe(false);
      expect(is_planning_executor_type('amp')).toBe(false);
      expect(is_planning_executor_type('echo')).toBe(false);
      expect(is_planning_executor_type('setup-script')).toBe(false);
      expect(is_planning_executor_type('claude-code-router')).toBe(false);
      expect(is_planning_executor_type('charm-opencode')).toBe(false);
      expect(is_planning_executor_type('sst-opencode')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(is_planning_executor_type('')).toBe(false);
    });

    it('should return false for undefined input', () => {
      expect(is_planning_executor_type(undefined as any)).toBe(false);
    });

    it('should return false for null input', () => {
      expect(is_planning_executor_type(null as any)).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(is_planning_executor_type('Claude-Plan')).toBe(false);
      expect(is_planning_executor_type('CLAUDE-PLAN')).toBe(false);
      expect(is_planning_executor_type('claude-Plan')).toBe(false);
    });

    it('should return false for partial matches', () => {
      expect(is_planning_executor_type('claude-plan-extended')).toBe(false);
      expect(is_planning_executor_type('my-claude-plan')).toBe(false);
      expect(is_planning_executor_type('claude-pla')).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(is_planning_executor_type(' claude-plan ')).toBe(false);
      expect(is_planning_executor_type('claude-plan ')).toBe(false);
      expect(is_planning_executor_type(' claude-plan')).toBe(false);
    });

    it('should handle special characters in executor names', () => {
      expect(is_planning_executor_type('claude-plan-v2')).toBe(false);
      expect(is_planning_executor_type('claude_plan')).toBe(false);
      expect(is_planning_executor_type('claude.plan')).toBe(false);
    });

    it('should work with all known executor types', () => {
      const knownExecutorTypes = [
        'echo',
        'claude',
        'claude-plan',
        'amp',
        'gemini',
        'charm-opencode',
        'claude-code-router',
        'sst-opencode',
      ];

      knownExecutorTypes.forEach((executor) => {
        const result = is_planning_executor_type(executor);
        if (executor === 'claude-plan') {
          expect(result).toBe(true);
        } else {
          expect(result).toBe(false);
        }
      });
    });

    it('should handle numeric and mixed inputs', () => {
      expect(is_planning_executor_type('123')).toBe(false);
      expect(is_planning_executor_type('claude-plan-123')).toBe(false);
      expect(is_planning_executor_type('123-claude-plan')).toBe(false);
    });

    it('should be a pure function', () => {
      // Test that multiple calls with same input return same result
      const input = 'claude-plan';
      const result1 = is_planning_executor_type(input);
      const result2 = is_planning_executor_type(input);
      const result3 = is_planning_executor_type(input);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(result1).toBe(true);
    });

    it('should handle type coercion scenarios', () => {
      // Test with non-string inputs that might be coerced
      expect(is_planning_executor_type(0 as any)).toBe(false);
      expect(is_planning_executor_type(false as any)).toBe(false);
      expect(is_planning_executor_type([] as any)).toBe(false);
      expect(is_planning_executor_type({} as any)).toBe(false);
    });
  });

  describe('Edge cases and integration', () => {
    it('should work when functions are used together', () => {
      const executorType = 'claude-plan';
      const isPlanning = is_planning_executor_type(executorType);

      const className = cn('executor-badge', {
        'planning-executor': isPlanning,
        'regular-executor': !isPlanning,
      });

      expect(className).toContain('executor-badge');
      expect(className).toContain('planning-executor');
      expect(className).not.toContain('regular-executor');
    });

    it('should handle unicode characters', () => {
      expect(is_planning_executor_type('claude-plan-🚀')).toBe(false);
      expect(is_planning_executor_type('claude-plan-ñ')).toBe(false);

      const className = cn('unicode-class-🎨', 'normal-class');
      expect(className).toContain('unicode-class-🎨');
      expect(className).toContain('normal-class');
    });

    it('should work with real-world scenarios', () => {
      // Simulate a real component scenario
      const config = {
        executor: { type: 'claude-plan' },
        theme: 'dark',
        size: 'large',
      };

      const isPlanning = is_planning_executor_type(config.executor.type);

      const buttonClass = cn(
        'btn',
        `btn-${config.size}`,
        `theme-${config.theme}`,
        {
          'btn-planning': isPlanning,
          'btn-regular': !isPlanning,
        },
        'interactive'
      );

      expect(buttonClass).toContain('btn');
      expect(buttonClass).toContain('btn-large');
      expect(buttonClass).toContain('theme-dark');
      expect(buttonClass).toContain('btn-planning');
      expect(buttonClass).not.toContain('btn-regular');
      expect(buttonClass).toContain('interactive');
    });
  });
});
