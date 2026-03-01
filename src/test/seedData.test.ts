import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadSeedData, _resetSeedCache } from '@/lib/seedData';

const validEntry = {
  id: 'seed-1',
  title: 'Seeded Entry',
  createdAt: '2026-01-01T00:00:00.000Z',
  situation: 's', task: 't', action: 'a', result: 'r',
  startDate: '2026-01-01', endDate: '2026-01-10',
  originalEstimateDays: 5, actualDays: 5,
  complicatingFactors: '', technologies: ['Go'],
  growthWins: '', raci: ['responsible'],
  status: 'planned', impactLevel: 'medium',
};

const validView = {
  id: 'seed-view', name: 'Seed View', search: '',
  filters: {
    status: { values: ['planned'], mode: 'or' },
    raci: { values: [], mode: 'or' },
  },
};

const validMetric = {
  id: 'total', label: 'Total', type: 'count', order: 0, enabled: true,
};

function mockFetch(responses: Record<string, unknown>) {
  return vi.fn((url: string) => {
    const data = responses[url];
    if (data === undefined) {
      return Promise.resolve({ ok: false, json: () => Promise.reject() });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
  });
}

describe('loadSeedData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    _resetSeedCache();
  });

  it('loads entries, views, and metrics from config.json', async () => {
    global.fetch = mockFetch({
      '/config.json': { entries: [validEntry], views: [validView], metrics: [validMetric] },
    }) as any;

    const seed = await loadSeedData();
    expect(seed.entries).toHaveLength(1);
    expect(seed.entries[0].title).toBe('Seeded Entry');
    expect(seed.views).toHaveLength(1);
    expect(seed.views[0].name).toBe('Seed View');
    expect(seed.metrics).toHaveLength(1);
    // Should not fetch individual files since config had all keys
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to tasks.json and filters.json when config.json is empty', async () => {
    global.fetch = mockFetch({
      '/config.json': { entries: [], views: [] },
      '/tasks.json': [validEntry],
      '/filters.json': [validView],
      '/metrics.json': { metrics: [validMetric] },
    }) as any;

    const seed = await loadSeedData();
    expect(seed.entries).toHaveLength(1);
    expect(seed.views).toHaveLength(1);
    expect(seed.metrics).toHaveLength(1);
  });

  it('falls back to individual files when config.json is missing', async () => {
    global.fetch = mockFetch({
      '/tasks.json': [validEntry],
      '/filters.json': [validView],
      '/metrics.json': { metrics: [validMetric] },
    }) as any;

    const seed = await loadSeedData();
    expect(seed.entries).toHaveLength(1);
    expect(seed.views).toHaveLength(1);
    expect(seed.metrics).toHaveLength(1);
  });

  it('returns empty arrays when all files are missing', async () => {
    global.fetch = mockFetch({}) as any;

    const seed = await loadSeedData();
    expect(seed.entries).toEqual([]);
    expect(seed.views).toEqual([]);
    expect(seed.metrics).toEqual([]);
  });

  it('returns empty arrays when files contain invalid data', async () => {
    global.fetch = mockFetch({
      '/config.json': { entries: [{ bad: true }], views: 'not an array' },
      '/tasks.json': [{ bad: true }],
      '/filters.json': 'invalid',
    }) as any;

    const seed = await loadSeedData();
    expect(seed.entries).toEqual([]);
    expect(seed.views).toEqual([]);
  });

  it('uses config.json entries but falls back to filters.json for views', async () => {
    global.fetch = mockFetch({
      '/config.json': { entries: [validEntry] },
      '/filters.json': [validView],
      '/metrics.json': { metrics: [validMetric] },
    }) as any;

    const seed = await loadSeedData();
    expect(seed.entries).toHaveLength(1);
    expect(seed.views).toHaveLength(1);
    expect(seed.metrics).toHaveLength(1);
  });
});
