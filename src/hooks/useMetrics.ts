import { useState, useEffect, useCallback, useRef } from 'react';
import { ImpactEntry } from '@/types/entry';
import { MetricConfig, ComputedMetric } from '@/types/metric';
import { computeAllMetrics, runCustomMetricInWorker } from '@/lib/metricsEngine';
import { loadSeedData } from '@/lib/seedData';

const LS_KEY = 'impact-tracker-metrics';

function loadOverrides(): MetricConfig[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MetricConfig[];
  } catch {
    return null;
  }
}

function saveOverrides(configs: MetricConfig[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(configs));
}

export function useMetrics(entries: ImpactEntry[]) {
  const [configs, setConfigs] = useState<MetricConfig[]>([]);
  const [computed, setComputed] = useState<ComputedMetric[]>([]);
  const [loaded, setLoaded] = useState(false);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  // Load configs: localStorage overrides > seed data (config.json / metrics.json)
  useEffect(() => {
    const overrides = loadOverrides();
    if (overrides) {
      setConfigs(overrides);
      setLoaded(true);
    } else {
      loadSeedData().then(seed => {
        setConfigs(seed.metrics);
        setLoaded(true);
      });
    }
  }, []);

  // Recompute when configs or entries change
  useEffect(() => {
    if (!loaded) return;

    const results = computeAllMetrics(configs, entries);

    // Resolve custom metrics via Worker
    const customConfigs = configs.filter(c => c.type === 'custom' && c.enabled !== false && c.customFn);
    if (customConfigs.length === 0) {
      setComputed(results);
      return;
    }

    const promises = customConfigs.map(async (c) => {
      try {
        const value = await runCustomMetricInWorker(c.customFn!, entries);
        return { id: c.id, value };
      } catch {
        return { id: c.id, value: 'Error' };
      }
    });

    Promise.all(promises).then(customResults => {
      const updated = results.map(r => {
        const custom = customResults.find(cr => cr.id === r.id);
        return custom ? { ...r, value: custom.value } : r;
      });
      setComputed(updated);
    });

    // Set built-in results immediately while custom resolves
    setComputed(results);
  }, [configs, entries, loaded]);

  const updateConfigs = useCallback((newConfigs: MetricConfig[]) => {
    setConfigs(newConfigs);
    saveOverrides(newConfigs);
  }, []);

  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    loadSeedData().then(seed => {
      setConfigs(seed.metrics);
    });
  }, []);

  const importMetrics = useCallback((imported: MetricConfig[]) => {
    setConfigs(imported);
    saveOverrides(imported);
  }, []);

  const addMetric = useCallback((config: MetricConfig) => {
    setConfigs(prev => {
      const next = [...prev, config];
      saveOverrides(next);
      return next;
    });
  }, []);

  const removeMetric = useCallback((id: string) => {
    setConfigs(prev => {
      const next = prev.filter(c => c.id !== id);
      saveOverrides(next);
      return next;
    });
  }, []);

  const updateMetric = useCallback((id: string, updates: Partial<MetricConfig>) => {
    setConfigs(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      saveOverrides(next);
      return next;
    });
  }, []);

  const reorderMetrics = useCallback((ids: string[]) => {
    setConfigs(prev => {
      const next = ids.map((id, i) => {
        const config = prev.find(c => c.id === id);
        return config ? { ...config, order: i } : null;
      }).filter(Boolean) as MetricConfig[];
      saveOverrides(next);
      return next;
    });
  }, []);

  return {
    configs,
    computed,
    loaded,
    updateConfigs,
    resetToDefaults,
    addMetric,
    removeMetric,
    updateMetric,
    reorderMetrics,
    importMetrics,
  };
}
