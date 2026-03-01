import { describe, it, expect } from 'vitest';
import { savedViewSchema, savedViewArraySchema, createDefaultView } from '@/types/view';
import type { SavedView } from '@/types/view';

describe('view types', () => {
  describe('createDefaultView', () => {
    it('creates a view with id "default"', () => {
      const view = createDefaultView();
      expect(view.id).toBe('default');
      expect(view.name).toBe('Default');
      expect(view.search).toBe('');
      expect(view.filters.status.values).toEqual([]);
      expect(view.filters.status.mode).toBe('or');
      expect(view.filters.raci.values).toEqual([]);
      expect(view.filters.raci.mode).toBe('or');
    });
  });

  describe('savedViewSchema', () => {
    it('validates a correct view', () => {
      const view: SavedView = {
        id: 'test-id',
        name: 'Test View',
        search: 'query',
        filters: {
          status: { values: ['planned'], mode: 'or' },
          raci: { values: ['responsible'], mode: 'and' },
        },
      };
      expect(savedViewSchema.parse(view)).toEqual(view);
    });

    it('rejects empty name', () => {
      const view = { ...createDefaultView(), name: '' };
      expect(() => savedViewSchema.parse(view)).toThrow();
    });

    it('rejects invalid mode', () => {
      const view = createDefaultView();
      (view as any).filters.status.mode = 'xor';
      expect(() => savedViewSchema.parse(view)).toThrow();
    });
  });

  describe('savedViewArraySchema', () => {
    it('validates an array of views', () => {
      const views = [createDefaultView()];
      expect(savedViewArraySchema.parse(views)).toEqual(views);
    });

    it('rejects non-array', () => {
      expect(() => savedViewArraySchema.parse('not an array')).toThrow();
    });
  });
});
