import { describe, it, expect } from 'vitest';
import { formatLabel, getStatusOptions, getRaciOptions, STATUS_VALUES, RACI_VALUES } from '@/lib/filterOptions';

describe('filterOptions', () => {
  describe('STATUS_VALUES', () => {
    it('derives values from Zod schema', () => {
      expect(STATUS_VALUES).toContain('planned');
      expect(STATUS_VALUES).toContain('in-progress');
      expect(STATUS_VALUES).toContain('completed');
      expect(STATUS_VALUES.length).toBe(3);
    });
  });

  describe('RACI_VALUES', () => {
    it('derives values from Zod schema', () => {
      expect(RACI_VALUES).toContain('responsible');
      expect(RACI_VALUES).toContain('accountable');
      expect(RACI_VALUES).toContain('consulted');
      expect(RACI_VALUES).toContain('informed');
      expect(RACI_VALUES.length).toBe(4);
    });
  });

  describe('formatLabel', () => {
    it('capitalizes single words', () => {
      expect(formatLabel('planned')).toBe('Planned');
    });

    it('capitalizes hyphenated words', () => {
      expect(formatLabel('in-progress')).toBe('In Progress');
    });

    it('handles already capitalized input', () => {
      expect(formatLabel('Completed')).toBe('Completed');
    });
  });

  describe('getStatusOptions', () => {
    it('returns option objects with value and label', () => {
      const options = getStatusOptions();
      expect(options.length).toBe(3);
      expect(options).toContainEqual({ value: 'in-progress', label: 'In Progress' });
    });
  });

  describe('getRaciOptions', () => {
    it('returns option objects with value and label', () => {
      const options = getRaciOptions();
      expect(options.length).toBe(4);
      expect(options).toContainEqual({ value: 'responsible', label: 'Responsible' });
    });
  });
});
