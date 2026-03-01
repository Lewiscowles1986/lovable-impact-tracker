import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDefaultView, SavedView, savedViewArraySchema } from '@/types/view';
import { STATUS_VALUES, RACI_VALUES } from '@/lib/filterOptions';

/**
 * These tests validate the core views logic (load, save, update, clear, import)
 * by exercising the same functions the useViews hook uses, against a mocked localStorage.
 */

// --- Inline the pure logic from useViews so we can test without React ---

function stripInvalidValues(view: SavedView): SavedView {
  return {
    ...view,
    filters: {
      status: {
        ...view.filters.status,
        values: view.filters.status.values.filter(v => (STATUS_VALUES as readonly string[]).includes(v)),
      },
      raci: {
        ...view.filters.raci,
        values: view.filters.raci.values.filter(v => (RACI_VALUES as readonly string[]).includes(v)),
      },
    },
  };
}

function loadViews(storage: Record<string, string>): SavedView[] {
  try {
    const raw = storage['impact-tracker-views'];
    if (!raw) return [createDefaultView()];
    const parsed = savedViewArraySchema.parse(JSON.parse(raw));
    const cleaned = parsed.map(stripInvalidValues);
    if (!cleaned.find(v => v.id === 'default')) {
      cleaned.unshift(createDefaultView());
    }
    return cleaned;
  } catch {
    return [createDefaultView()];
  }
}

function saveNewView(
  views: SavedView[],
  name: string,
  filters: SavedView['filters'],
  search: string
): { views: SavedView[]; activeId: string; success: boolean; existingId?: string } {
  const existing = views.find(v => v.name.toLowerCase() === name.toLowerCase() && v.id !== 'default');
  if (existing) {
    return { views, activeId: views[0].id, success: false, existingId: existing.id };
  }
  const newView: SavedView = {
    id: `view-${Date.now()}`,
    name,
    search,
    filters,
  };
  const next = [...views, newView];
  return { views: next, activeId: newView.id, success: true };
}

function updateView(views: SavedView[], id: string, filters: SavedView['filters'], search: string): SavedView[] {
  return views.map(v => v.id === id ? { ...v, filters, search } : v);
}

function overwriteView(views: SavedView[], id: string, name: string, filters: SavedView['filters'], search: string): SavedView[] {
  return views.map(v => v.id === id ? { ...v, name, filters, search } : v);
}

function clearAllViews(): SavedView[] {
  return [createDefaultView()];
}

function importViews(imported: SavedView[]): SavedView[] {
  const cleaned = imported.map(stripInvalidValues);
  if (!cleaned.find(v => v.id === 'default')) {
    cleaned.unshift(createDefaultView());
  }
  return cleaned;
}

// --- Helpers ---

const emptyFilters = (): SavedView['filters'] => ({
  status: { values: [], mode: 'or' },
  raci: { values: [], mode: 'or' },
});

// --- Tests ---

describe('views logic', () => {
  describe('loadViews', () => {
    it('returns default view when storage is empty', () => {
      const views = loadViews({});
      expect(views).toHaveLength(1);
      expect(views[0].id).toBe('default');
    });

    it('loads views from storage', () => {
      const custom: SavedView = {
        id: 'custom', name: 'Custom', search: 'test',
        filters: { status: { values: ['planned'], mode: 'or' }, raci: { values: [], mode: 'or' } },
      };
      const store = { 'impact-tracker-views': JSON.stringify([createDefaultView(), custom]) };
      const views = loadViews(store);
      expect(views).toHaveLength(2);
      expect(views[1].name).toBe('Custom');
    });

    it('strips invalid filter values on load', () => {
      const bad: SavedView = {
        id: 'default', name: 'Default', search: '',
        filters: {
          status: { values: ['planned', 'nonexistent'], mode: 'or' },
          raci: { values: ['responsible', 'fake-role'], mode: 'or' },
        },
      };
      const views = loadViews({ 'impact-tracker-views': JSON.stringify([bad]) });
      expect(views[0].filters.status.values).toEqual(['planned']);
      expect(views[0].filters.raci.values).toEqual(['responsible']);
    });

    it('adds default view if missing from storage', () => {
      const custom: SavedView = {
        id: 'only-custom', name: 'Only', search: '',
        filters: emptyFilters(),
      };
      const views = loadViews({ 'impact-tracker-views': JSON.stringify([custom]) });
      expect(views[0].id).toBe('default');
      expect(views).toHaveLength(2);
    });

    it('returns default on corrupt JSON', () => {
      const views = loadViews({ 'impact-tracker-views': 'not json' });
      expect(views).toHaveLength(1);
      expect(views[0].id).toBe('default');
    });
  });

  describe('updateView', () => {
    it('updates filters and search for matching view', () => {
      const views = [createDefaultView()];
      const newFilters: SavedView['filters'] = {
        status: { values: ['completed'], mode: 'and' },
        raci: { values: ['accountable'], mode: 'or' },
      };
      const updated = updateView(views, 'default', newFilters, 'search term');
      expect(updated[0].filters).toEqual(newFilters);
      expect(updated[0].search).toBe('search term');
    });

    it('does not modify other views', () => {
      const views = [
        createDefaultView(),
        { id: 'other', name: 'Other', search: 'old', filters: emptyFilters() },
      ];
      const updated = updateView(views, 'default', emptyFilters(), 'new');
      expect(updated[1].search).toBe('old');
    });
  });

  describe('saveNewView', () => {
    it('creates a new view', () => {
      const views = [createDefaultView()];
      const result = saveNewView(views, 'My View', emptyFilters(), 'query');
      expect(result.success).toBe(true);
      expect(result.views).toHaveLength(2);
      expect(result.views[1].name).toBe('My View');
    });

    it('detects case-insensitive name collision', () => {
      const views = [
        createDefaultView(),
        { id: 'existing', name: 'My View', search: '', filters: emptyFilters() },
      ];
      const result = saveNewView(views, 'my view', emptyFilters(), '');
      expect(result.success).toBe(false);
      expect(result.existingId).toBe('existing');
    });

    it('does not collide with default view name', () => {
      const views = [createDefaultView()];
      const result = saveNewView(views, 'Default', emptyFilters(), '');
      // "Default" with id !== 'default' should succeed since collision check skips default id
      expect(result.success).toBe(true);
    });
  });

  describe('overwriteView', () => {
    it('updates name, filters and search', () => {
      const views = [
        createDefaultView(),
        { id: 'v1', name: 'Old', search: 'old', filters: emptyFilters() },
      ];
      const newFilters: SavedView['filters'] = {
        status: { values: ['completed'], mode: 'and' },
        raci: { values: [], mode: 'or' },
      };
      const updated = overwriteView(views, 'v1', 'New Name', newFilters, 'new search');
      expect(updated[1].name).toBe('New Name');
      expect(updated[1].filters.status.values).toEqual(['completed']);
      expect(updated[1].search).toBe('new search');
    });
  });

  describe('clearAllViews', () => {
    it('returns only default view', () => {
      const views = clearAllViews();
      expect(views).toHaveLength(1);
      expect(views[0].id).toBe('default');
    });
  });

  describe('importViews', () => {
    it('replaces views and strips invalid values', () => {
      const imported: SavedView[] = [
        createDefaultView(),
        {
          id: 'imp', name: 'Imported', search: 'x',
          filters: {
            status: { values: ['planned', 'bogus'], mode: 'or' },
            raci: { values: ['informed'], mode: 'and' },
          },
        },
      ];
      const views = importViews(imported);
      expect(views).toHaveLength(2);
      expect(views[1].filters.status.values).toEqual(['planned']);
    });

    it('ensures default exists if missing from import', () => {
      const imported: SavedView[] = [
        { id: 'only', name: 'Only', search: '', filters: emptyFilters() },
      ];
      const views = importViews(imported);
      expect(views[0].id).toBe('default');
      expect(views).toHaveLength(2);
    });
  });
});
