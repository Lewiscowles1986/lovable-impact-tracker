import { describe, it, expect } from 'vitest';
import { formatLabel, getStatusOptions, getRaciOptions, getImpactOptions, STATUS_VALUES, RACI_VALUES, IMPACT_VALUES } from '@/lib/filterOptions';

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

  describe('IMPACT_VALUES', () => {
    it('derives values from Zod schema', () => {
      expect(IMPACT_VALUES).toContain('low');
      expect(IMPACT_VALUES).toContain('medium');
      expect(IMPACT_VALUES).toContain('high');
      expect(IMPACT_VALUES).toContain('critical');
      expect(IMPACT_VALUES.length).toBe(4);
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

  describe('getImpactOptions', () => {
    it('returns option objects with value and label', () => {
      const options = getImpactOptions();
      expect(options.length).toBe(4);
      expect(options).toContainEqual({ value: 'critical', label: 'Critical' });
      expect(options).toContainEqual({ value: 'high', label: 'High' });
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
