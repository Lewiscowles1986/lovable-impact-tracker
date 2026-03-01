import { useState, useCallback } from 'react';
import { SavedView, savedViewArraySchema, createDefaultView } from '@/types/view';
import { STATUS_VALUES, RACI_VALUES } from '@/lib/filterOptions';

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

function loadViews(): SavedView[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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

function loadActiveViewId(): string {
  return localStorage.getItem(ACTIVE_VIEW_KEY) || 'default';
}

function persist(views: SavedView[], activeId: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
  localStorage.setItem(ACTIVE_VIEW_KEY, activeId);
}

export function useViews() {
  const [views, setViews] = useState<SavedView[]>(loadViews);
  const [activeViewId, setActiveViewId] = useState<string>(loadActiveViewId);

  const getView = useCallback((id: string) => views.find(v => v.id === id), [views]);

  const selectView = useCallback((id: string) => {
    setActiveViewId(id);
    localStorage.setItem(ACTIVE_VIEW_KEY, id);
  }, []);

  const updateView = useCallback((id: string, filters: SavedView['filters'], search: string) => {
    setViews(prev => {
      const next = prev.map(v => v.id === id ? { ...v, filters, search } : v);
      persist(next, id);
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
    persist(next, newView.id);
    setViews(next);
    setActiveViewId(newView.id);
    return { success: true };
  }, [views]);

  const overwriteView = useCallback((id: string, name: string, filters: SavedView['filters'], search: string) => {
    setViews(prev => {
      const next = prev.map(v => v.id === id ? { ...v, name, filters, search } : v);
      persist(next, id);
      return next;
    });
    setActiveViewId(id);
  }, []);

  const importViews = useCallback((imported: SavedView[]) => {
    const cleaned = imported.map(stripInvalidValues);
    // Ensure default exists
    if (!cleaned.find(v => v.id === 'default')) {
      cleaned.unshift(createDefaultView());
    }
    persist(cleaned, 'default');
    setViews(cleaned);
    setActiveViewId('default');
  }, []);

  const clearAllViews = useCallback(() => {
    const defaults = [createDefaultView()];
    persist(defaults, 'default');
    setViews(defaults);
    setActiveViewId('default');
  }, []);

  return { views, activeViewId, selectView, updateView, saveNewView, overwriteView, getView, importViews, clearAllViews };
}
