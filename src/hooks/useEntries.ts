import { useState, useEffect, useCallback } from 'react';
import { ImpactEntry } from '@/types/entry';
import { SavedView } from '@/types/view';
import { MetricConfig } from '@/types/metric';
import { loadEntries, saveEntries, generateId } from '@/lib/entries';
import { impactEntryArraySchema } from '@/types/entrySchema';
import { savedViewArraySchema } from '@/types/view';
import { unwrapData, serializeForExport, serializeEntriesForExport, serializeViewsForExport, serializeMetricsForExport } from '@/lib/serialization';
import { loadSeedData } from '@/lib/seedData';

const ENTRIES_STORAGE_KEY = 'impact-tracker-entries';

export interface ImportResult {
  entries: ImpactEntry[];
  views?: SavedView[];
  metrics?: MetricConfig[];
  checksumMismatch: boolean;
}

export function useEntries() {
  const [entries, setEntries] = useState<ImpactEntry[]>([]);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    const loaded = loadEntries();
    if (loaded.length > 0) {
      setEntries(loaded);
      setSeeded(true);
      return;
    }

    // localStorage is empty — try seeding from public JSON files
    loadSeedData().then(seed => {
      if (seed.entries.length > 0) {
        saveEntries(seed.entries);
        setEntries(seed.entries);
      }
      setSeeded(true);
    });
  }, []);

  const persist = useCallback((updated: ImpactEntry[]) => {
    setEntries(updated);
    saveEntries(updated);
  }, []);

  const addEntry = useCallback((entry: Omit<ImpactEntry, 'id' | 'createdAt'>) => {
    const newEntry: ImpactEntry = {
      ...entry,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    persist([newEntry, ...entries]);
  }, [entries, persist]);

  const updateEntry = useCallback((id: string, updates: Partial<ImpactEntry>) => {
    persist(entries.map(e => e.id === id ? { ...e, ...updates } : e));
  }, [entries, persist]);

  const deleteEntry = useCallback((id: string) => {
    persist(entries.filter(e => e.id !== id));
  }, [entries, persist]);

  const loadSampleData = useCallback((samples: ImpactEntry[]) => {
    persist([...samples, ...entries]);
  }, [entries, persist]);

  const clearAllEntries = useCallback(() => {
    persist([]);
  }, [persist]);

  const downloadJson = useCallback((content: string, suffix: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impact-tracker-${suffix}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportEntries = useCallback((views?: SavedView[], metrics?: MetricConfig[]) => {
    downloadJson(serializeForExport(entries, views, metrics), 'backup');
  }, [entries, downloadJson]);

  const exportEntriesOnly = useCallback(() => {
    downloadJson(serializeEntriesForExport(entries), 'entries');
  }, [entries, downloadJson]);

  const exportViewsOnly = useCallback((views: SavedView[]) => {
    downloadJson(serializeViewsForExport(views), 'views');
  }, [downloadJson]);

  const exportMetricsOnly = useCallback((metrics: MetricConfig[]) => {
    downloadJson(serializeMetricsForExport(metrics), 'metrics');
  }, [downloadJson]);

  /** Parse and validate an import file. Auto-detects: entries envelope, combined envelope, or views-only array. */
  const parseImportFile = useCallback((file: File): Promise<ImportResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);

          // Check if it's a views-only file (array where first item has 'filters' key)
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].filters) {
            const views = savedViewArraySchema.parse(parsed);
            resolve({ entries: [], views, checksumMismatch: false });
            return;
          }

          // Check if it's a metrics-only file (array where first item has 'type' and 'label' keys)
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type && parsed[0].label) {
            resolve({ entries: [], metrics: parsed as MetricConfig[], checksumMismatch: false });
            return;
          }

          const { entries: unwrapped, views: rawViews, metrics: rawMetrics, checksumMismatch } = unwrapData(parsed);
          const data = impactEntryArraySchema.parse(unwrapped) as ImpactEntry[];
          let views: SavedView[] | undefined;
          if (rawViews) {
            try { views = savedViewArraySchema.parse(rawViews); } catch { /* ignore invalid views */ }
          }
          const metrics = rawMetrics as MetricConfig[] | undefined;
          resolve({ entries: data, views, metrics, checksumMismatch });
        } catch (err) {
          reject(new Error(err instanceof Error ? err.message : 'Invalid backup file'));
        }
      };
      reader.readAsText(file);
    });
  }, []);

  /** Apply already-validated entries. */
  const applyImport = useCallback((importedEntries: ImpactEntry[]) => {
    persist(importedEntries);
  }, [persist]);

  return { entries, seeded, addEntry, updateEntry, deleteEntry, loadSampleData, clearAllEntries, exportEntries, exportEntriesOnly, exportViewsOnly, exportMetricsOnly, parseImportFile, applyImport };
}
