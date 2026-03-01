import { describe, it, expect } from 'vitest';
import {
  deterministicStringify,
  fnv1aHash,
  wrapEnvelope,
  unwrapData,
  serializeForStorage,
  entryChecksum,
} from '@/lib/serialization';
import { ImpactEntry } from '@/types/entry';

const mockEntry: ImpactEntry = {
  id: 'test1',
  title: 'Test Entry',
  createdAt: '2025-01-01T00:00:00.000Z',
  situation: 'Situation',
  task: 'Task',
  action: 'Action',
  result: 'Result',
  startDate: '2025-01-01',
  endDate: '2025-01-15',
  originalEstimateDays: 10,
  actualDays: 12,
  complicatingFactors: '',
  technologies: ['React', 'TypeScript'],
  growthWins: '',
  raci: ['responsible'],
  status: 'completed',
  impactLevel: 'high',
};

describe('deterministicStringify', () => {
  it('produces consistent key ordering', () => {
    const a = { z: 1, a: 2, m: 3 };
    const b = { a: 2, m: 3, z: 1 };
    expect(deterministicStringify(a)).toBe(deterministicStringify(b));
  });

  it('handles nested objects', () => {
    const a = { outer: { z: 1, a: 2 } };
    const b = { outer: { a: 2, z: 1 } };
    expect(deterministicStringify(a)).toBe(deterministicStringify(b));
  });
});

describe('fnv1aHash', () => {
  it('returns 8-char hex string', () => {
    const hash = fnv1aHash('hello');
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it('is deterministic', () => {
    expect(fnv1aHash('test')).toBe(fnv1aHash('test'));
  });

  it('differs for different inputs', () => {
    expect(fnv1aHash('a')).not.toBe(fnv1aHash('b'));
  });
});

describe('wrapEnvelope / unwrapData', () => {
  it('round-trips entries through envelope', () => {
    const envelope = wrapEnvelope([mockEntry]);
    expect(envelope.version).toBe(2);
    expect(envelope.entries).toHaveLength(1);
    expect(envelope.checksum).toMatch(/^[0-9a-f]{8}$/);

    const { entries, version, checksumMismatch } = unwrapData(envelope);
    expect(version).toBe(2);
    expect(entries).toEqual([mockEntry]);
    expect(checksumMismatch).toBe(false);
  });

  it('detects tampered data without throwing', () => {
    const envelope = wrapEnvelope([mockEntry]);
    envelope.entries[0].title = 'TAMPERED';
    const { checksumMismatch } = unwrapData(envelope);
    expect(checksumMismatch).toBe(true);
  });

  it('supports v1 bare arrays', () => {
    const { entries, version, checksumMismatch } = unwrapData([mockEntry]);
    expect(version).toBe(1);
    expect(entries).toEqual([mockEntry]);
    expect(checksumMismatch).toBe(false);
  });
});

describe('serializeForStorage', () => {
  it('produces valid JSON that round-trips', () => {
    const serialized = serializeForStorage([mockEntry]);
    const parsed = JSON.parse(serialized);
    const { entries } = unwrapData(parsed);
    expect(entries).toEqual([mockEntry]);
  });
});

describe('entryChecksum', () => {
  it('is stable regardless of key insertion order', () => {
    const reordered = {
      title: mockEntry.title,
      id: mockEntry.id,
      status: mockEntry.status,
      ...mockEntry,
    } as ImpactEntry;
    expect(entryChecksum(mockEntry)).toBe(entryChecksum(reordered));
  });
});
