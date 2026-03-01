import { ImpactEntry } from '@/types/entry';
import { unwrapData, serializeForStorage } from '@/lib/serialization';

const STORAGE_KEY = 'impact-tracker-entries';

export function loadEntries(): ImpactEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return unwrapData(parsed).entries;
  } catch {
    return [];
  }
}

export function saveEntries(entries: ImpactEntry[]): void {
  localStorage.setItem(STORAGE_KEY, serializeForStorage(entries));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function createBlankEntry(): Partial<ImpactEntry> {
  return {
    title: '',
    situation: '',
    task: '',
    action: '',
    result: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    originalEstimateDays: 0,
    actualDays: 0,
    complicatingFactors: '',
    technologies: [],
    growthWins: '',
    raci: [],
    status: 'planned',
    impactLevel: 'medium',
  };
}
