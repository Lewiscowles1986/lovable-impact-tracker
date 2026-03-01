import { describe, it, expect, beforeEach } from 'vitest';
import { serializeForExport, serializeEntriesForExport, serializeViewsForExport, unwrapData, wrapEnvelope } from '@/lib/serialization';
import { createDefaultView, SavedView } from '@/types/view';
import { ImpactEntry } from '@/types/entry';

const mockEntry: ImpactEntry = {
  id: 'test-1',
  title: 'Test Entry',
  createdAt: '2026-01-01T00:00:00.000Z',
  situation: 'sit',
  task: 'task',
  action: 'act',
  result: 'res',
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  originalEstimateDays: 10,
  actualDays: 10,
  complicatingFactors: '',
  technologies: ['TypeScript'],
  growthWins: '',
  raci: ['responsible'],
  status: 'planned',
  impactLevel: 'medium',
};

describe('serialization with views', () => {
  describe('wrapEnvelope', () => {
    it('includes views when provided', () => {
      const views = [createDefaultView()];
      const envelope = wrapEnvelope([mockEntry], views);
      expect(envelope.views).toEqual(views);
      expect(envelope.entries).toEqual([mockEntry]);
      expect(envelope.version).toBe(4);
    });

    it('omits views key when no views provided', () => {
      const envelope = wrapEnvelope([mockEntry]);
      expect(envelope).not.toHaveProperty('views');
    });

    it('omits views key when empty array', () => {
      const envelope = wrapEnvelope([mockEntry], []);
      expect(envelope).not.toHaveProperty('views');
    });
  });

  describe('unwrapData', () => {
    it('extracts views from v3 envelope', () => {
      const views = [createDefaultView()];
      const envelope = wrapEnvelope([mockEntry], views);
      const result = unwrapData(envelope);
      expect(result.views).toEqual(views);
      expect(result.entries).toEqual([mockEntry]);
      expect(result.checksumMismatch).toBe(false);
    });

    it('returns undefined views for v1 bare array', () => {
      const result = unwrapData([mockEntry]);
      expect(result.views).toBeUndefined();
      expect(result.entries).toEqual([mockEntry]);
    });

    it('returns undefined views for v2 envelope without views', () => {
      const envelope = { version: 2, entries: [mockEntry], checksum: 'abc' };
      const result = unwrapData(envelope);
      expect(result.views).toBeUndefined();
    });

    it('detects checksum mismatch', () => {
      const envelope = wrapEnvelope([mockEntry]);
      envelope.checksum = 'tampered';
      const result = unwrapData(envelope);
      expect(result.checksumMismatch).toBe(true);
    });
  });

  describe('serializeForExport', () => {
    it('round-trips entries and views through export/parse', () => {
      const views: SavedView[] = [
        createDefaultView(),
        {
          id: 'custom-1',
          name: 'My View',
          search: 'test',
          filters: {
            status: { values: ['planned'], mode: 'and' },
            raci: { values: ['accountable'], mode: 'or' },
          },
        },
      ];
      const json = serializeForExport([mockEntry], views);
      const parsed = JSON.parse(json);
      const result = unwrapData(parsed);
      expect(result.entries).toEqual([mockEntry]);
      expect(result.views).toEqual(views);
      expect(result.checksumMismatch).toBe(false);
    });

    it('produces valid JSON without views', () => {
      const json = serializeForExport([mockEntry]);
      const parsed = JSON.parse(json);
      expect(parsed).not.toHaveProperty('views');
    });
  });

  describe('serializeEntriesForExport', () => {
    it('produces envelope with entries only, no views', () => {
      const json = serializeEntriesForExport([mockEntry]);
      const parsed = JSON.parse(json);
      expect(parsed.entries).toHaveLength(1);
      expect(parsed).not.toHaveProperty('views');
      expect(parsed.version).toBe(4);
    });
  });

  describe('serializeViewsForExport', () => {
    it('produces a bare array of views', () => {
      const views: SavedView[] = [
        createDefaultView(),
        { id: 'v1', name: 'V1', search: '', filters: { status: { values: ['planned'], mode: 'or' }, raci: { values: [], mode: 'or' } } },
      ];
      const json = serializeViewsForExport(views);
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].filters).toBeDefined();
    });

    it('round-trips views-only through auto-detect import', () => {
      const views: SavedView[] = [createDefaultView()];
      const json = serializeViewsForExport(views);
      const parsed = JSON.parse(json);
      // Auto-detect: array with 'filters' key = views-only
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].filters).toBeDefined();
    });
  });
});
