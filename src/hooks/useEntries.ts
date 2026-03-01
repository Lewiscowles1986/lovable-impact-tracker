import { useState, useEffect, useCallback } from 'react';
import { ImpactEntry } from '@/types/entry';
import { loadEntries, saveEntries, generateId } from '@/lib/entries';
import { impactEntryArraySchema } from '@/types/entrySchema';
import { unwrapData, serializeForExport } from '@/lib/serialization';

export interface ImportResult {
  entries: ImpactEntry[];
  checksumMismatch: boolean;
}

export function useEntries() {
  const [entries, setEntries] = useState<ImpactEntry[]>([]);

  useEffect(() => {
    setEntries(loadEntries());
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

  const exportEntries = useCallback(() => {
    const blob = new Blob([serializeForExport(entries)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impact-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  /** Parse and validate an import file. Does NOT persist — caller decides after reviewing checksumMismatch. */
  const parseImportFile = useCallback((file: File): Promise<ImportResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          const { entries: unwrapped, checksumMismatch } = unwrapData(parsed);
          const data = impactEntryArraySchema.parse(unwrapped) as ImpactEntry[];
          resolve({ entries: data, checksumMismatch });
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

  return { entries, addEntry, updateEntry, deleteEntry, loadSampleData, clearAllEntries, exportEntries, parseImportFile, applyImport };
}
