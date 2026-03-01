import { raciRoleSchema, impactEntrySchema } from '@/types/entrySchema';

// Derive canonical values from Zod schemas — single source of truth
export const RACI_VALUES = raciRoleSchema.options;
export const STATUS_VALUES = impactEntrySchema.shape.status._def.values as readonly string[];

/** Capitalizes and replaces hyphens: 'in-progress' → 'In Progress' */
export function formatLabel(value: string): string {
  return value
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function getStatusOptions(): { value: string; label: string }[] {
  return STATUS_VALUES.map(v => ({ value: v, label: formatLabel(v) }));
}

export function getRaciOptions(): { value: string; label: string }[] {
  return RACI_VALUES.map(v => ({ value: v, label: formatLabel(v) }));
}
