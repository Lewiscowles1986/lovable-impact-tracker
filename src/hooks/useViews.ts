import { useState, useEffect, useCallback } from 'react';
import { SavedView, savedViewArraySchema, createDefaultView } from '@/types/view';
import { STATUS_VALUES, RACI_VALUES } from '@/lib/filterOptions';
import { loadSeedData } from '@/lib/seedData';

const STORAGE_KEY = 'impact-tracker-views';
const ACTIVE_VIEW_KEY = 'impact-tracker-active-view';

function stripInvalidValues(view: SavedView): SavedView {
  return {
    ...view,
    filters: {
      status: {
        ...view.filters.status,
        values: view.filters.status.values.filter(v => STATUS_VALUES.includes(v as any)),
      },
      raci: {
        ...view.filters.raci,
        values: view.filters.raci.values.filter(v => RACI_VALUES.includes(v as any)),
      },
    },
  };
}

function loadViewsFromStorage(): SavedView[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = savedViewArraySchema.parse(JSON.parse(raw));
    const cleaned = parsed.map(stripInvalidValues);
    if (!cleaned.find(v => v.id === 'default')) {
      cleaned.unshift(createDefaultView());
    }
    return cleaned;
  } catch {
    return null;
  }
}

function loadActiveViewId(): string {
  return localStorage.getItem(ACTIVE_VIEW_KEY) || 'default';
}

function persistViews(views: SavedView[], activeId: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
  localStorage.setItem(ACTIVE_VIEW_KEY, activeId);
}

export function useViews() {
  const [views, setViews] = useState<SavedView[]>([createDefaultView()]);
  const [activeViewId, setActiveViewId] = useState<string>('default');
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    const stored = loadViewsFromStorage();
    if (stored) {
      setViews(stored);
      setActiveViewId(loadActiveViewId());
      setSeeded(true);
      return;
    }

    // localStorage is empty — try seeding from public JSON files
    loadSeedData().then(seed => {
      if (seed.views.length > 0) {
        const cleaned = seed.views.map(stripInvalidValues);
        if (!cleaned.find(v => v.id === 'default')) {
          cleaned.unshift(createDefaultView());
        }
        persistViews(cleaned, 'default');
        setViews(cleaned);
      } else {
        const defaults = [createDefaultView()];
        persistViews(defaults, 'default');
        setViews(defaults);
      }
      setSeeded(true);
    });
  }, []);

  const getView = useCallback((id: string) => views.find(v => v.id === id), [views]);

  const selectView = useCallback((id: string) => {
    setActiveViewId(id);
    localStorage.setItem(ACTIVE_VIEW_KEY, id);
  }, []);

  const updateView = useCallback((id: string, filters: SavedView['filters'], search: string) => {
    setViews(prev => {
      const next = prev.map(v => v.id === id ? { ...v, filters, search } : v);
      persistViews(next, id);
      return next;
    });
  }, []);

  const saveNewView = useCallback((name: string, filters: SavedView['filters'], search: string): { success: boolean; existingId?: string } => {
    const existing = views.find(v => v.name.toLowerCase() === name.toLowerCase() && v.id !== 'default');
    if (existing) {
      return { success: false, existingId: existing.id };
    }
    const newView: SavedView = {
      id: crypto.randomUUID(),
      name,
      search,
      filters,
    };
    const next = [...views, newView];
    persistViews(next, newView.id);
    setViews(next);
    setActiveViewId(newView.id);
    return { success: true };
  }, [views]);

  const overwriteView = useCallback((id: string, name: string, filters: SavedView['filters'], search: string) => {
    setViews(prev => {
      const next = prev.map(v => v.id === id ? { ...v, name, filters, search } : v);
      persistViews(next, id);
      return next;
    });
    setActiveViewId(id);
  }, []);

  const importViews = useCallback((imported: SavedView[]) => {
    const cleaned = imported.map(stripInvalidValues);
    if (!cleaned.find(v => v.id === 'default')) {
      cleaned.unshift(createDefaultView());
    }
    persistViews(cleaned, 'default');
    setViews(cleaned);
    setActiveViewId('default');
  }, []);

  const clearAllViews = useCallback(() => {
    const defaults = [createDefaultView()];
    persistViews(defaults, 'default');
    setViews(defaults);
    setActiveViewId('default');
  }, []);

  return { views, activeViewId, seeded, selectView, updateView, saveNewView, overwriteView, getView, importViews, clearAllViews };
}
