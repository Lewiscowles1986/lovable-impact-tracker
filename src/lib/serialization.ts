import { ImpactEntry } from '@/types/entry';

const CURRENT_VERSION = 2;

export interface DataEnvelope {
  version: number;
  entries: ImpactEntry[];
  checksum: string;
}

/**
 * Deterministic JSON stringify with sorted keys and consistent whitespace.
 * Ensures the same logical data always produces the same string.
 */
export function deterministicStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.keys(val)
        .sort()
        .reduce<Record<string, unknown>>((sorted, k) => {
          sorted[k] = val[k];
          return sorted;
        }, {});
    }
    return val;
  });
}

/**
 * FNV-1a 32-bit hash — fast, synchronous, good distribution for integrity checks.
 * Returns a hex string.
 */
export function fnv1aHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Compute checksum for a single entry (deterministic key-ordered JSON).
 */
export function entryChecksum(entry: ImpactEntry): string {
  return fnv1aHash(deterministicStringify(entry));
}

/**
 * Wrap entries into a versioned envelope with integrity checksum.
 * Each entry is checksummed individually, then the full deterministic
 * entries array is checksummed for the outer envelope.
 */
export function wrapEnvelope(entries: ImpactEntry[]): DataEnvelope {
  const entriesString = deterministicStringify(entries);
  return {
    version: CURRENT_VERSION,
    entries,
    checksum: fnv1aHash(entriesString),
  };
}

/**
 * Unwrap data from either:
 *  - v1 (raw array) — no integrity check
 *  - v2 (envelope)  — validates checksum
 *
 * Throws on checksum mismatch.
 */
export interface UnwrapResult {
  entries: ImpactEntry[];
  version: number;
  checksumMismatch: boolean;
}

export function unwrapData(raw: unknown): UnwrapResult {
  // v1: bare array
  if (Array.isArray(raw)) {
    return { entries: raw as ImpactEntry[], version: 1, checksumMismatch: false };
  }

  // v2+: envelope object
  if (raw && typeof raw === 'object' && 'version' in raw && 'entries' in raw) {
    const envelope = raw as DataEnvelope;
    let checksumMismatch = false;
    if (envelope.checksum) {
      const expected = fnv1aHash(deterministicStringify(envelope.entries));
      checksumMismatch = expected !== envelope.checksum;
    }
    return { entries: envelope.entries, version: envelope.version, checksumMismatch };
  }

  throw new Error('Unrecognised data format');
}

/**
 * Serialize entries for storage or export (deterministic, enveloped).
 */
export function serializeForStorage(entries: ImpactEntry[]): string {
  return deterministicStringify(wrapEnvelope(entries));
}

/**
 * Pretty-print envelope for file export (human-readable but still deterministic keys).
 */
export function serializeForExport(entries: ImpactEntry[]): string {
  const envelope = wrapEnvelope(entries);
  return JSON.stringify(
    JSON.parse(deterministicStringify(envelope)),
    null,
    2
  );
}
