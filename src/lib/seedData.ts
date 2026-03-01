import { ImpactEntry } from '@/types/entry';
import { SavedView, savedViewArraySchema } from '@/types/view';
import { MetricConfig } from '@/types/metric';
import { impactEntryArraySchema } from '@/types/entrySchema';

export interface SeedData {
  entries: ImpactEntry[];
  views: SavedView[];
  metrics: MetricConfig[];
}

interface ConfigJson {
  entries?: unknown[];
  views?: unknown[];
  metrics?: unknown[];
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function parseEntries(raw: unknown): ImpactEntry[] {
  try {
    if (!Array.isArray(raw)) return [];
    return impactEntryArraySchema.parse(raw) as ImpactEntry[];
  } catch {
    return [];
  }
}

function parseViews(raw: unknown): SavedView[] {
  try {
    if (!Array.isArray(raw)) return [];
    return savedViewArraySchema.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Fetch seed data from public JSON files.
 *
 * Priority:
 *   1. config.json — if it exists and has `entries` or `views` keys, those take precedence
 *   2. tasks.json / filters.json — used as fallback for any key not present in config.json
 *
 * Returns empty arrays if files are missing or invalid.
 */
let seedPromise: Promise<SeedData> | null = null;

async function doLoadSeedData(): Promise<SeedData> {
  const config = await fetchJson('/config.json') as ConfigJson | null;

  let entries: ImpactEntry[] = [];
  let views: SavedView[] = [];
  let metrics: MetricConfig[] = [];

  if (config && typeof config === 'object') {
    if (config.entries) entries = parseEntries(config.entries);
    if (config.views) views = parseViews(config.views);
    if (Array.isArray(config.metrics)) metrics = config.metrics as MetricConfig[];
  }

  // Fallback to individual files for keys not in config
  if (entries.length === 0) {
    const tasksRaw = await fetchJson('/tasks.json');
    entries = parseEntries(tasksRaw);
  }

  if (views.length === 0) {
    const filtersRaw = await fetchJson('/filters.json');
    views = parseViews(filtersRaw);
  }

  if (metrics.length === 0) {
    const metricsRaw = await fetchJson('/metrics.json');
    if (metricsRaw && typeof metricsRaw === 'object' && 'metrics' in (metricsRaw as Record<string, unknown>)) {
      metrics = ((metricsRaw as Record<string, unknown>).metrics ?? []) as MetricConfig[];
    }
  }

  return { entries, views, metrics };
}

/**
 * Shared singleton — multiple callers get the same promise,
 * so seed files are fetched only once per page load.
 */
export function loadSeedData(): Promise<SeedData> {
  if (!seedPromise) {
    seedPromise = doLoadSeedData();
  }
  return seedPromise;
}

/** Reset the singleton cache — used in tests only. */
export function _resetSeedCache() {
  seedPromise = null;
}
