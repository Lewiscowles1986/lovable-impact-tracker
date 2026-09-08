/**
 * Storage namespace helper.
 *
 * Preview builds (see .github/workflows/github-pages.yml) set
 * VITE_STORAGE_NAMESPACE to a per-branch value so a PR preview uses isolated
 * localStorage and can never touch the real app's data. In production and
 * local dev the namespace is empty and keys are used as-is.
 */
const NAMESPACE = (import.meta.env.VITE_STORAGE_NAMESPACE as string | undefined) ?? "";

/** Prefix a storage key with the active namespace, if any. */
export function scopedKey(key: string): string {
  return NAMESPACE ? `${NAMESPACE}:${key}` : key;
}

/**
 * The app's unscoped storage keys. Used to clear only our own data (never
 * unrelated keys, and never the real app's data when running in a preview).
 */
const APP_KEYS = [
  'impact-tracker-entries',
  'impact-tracker-views',
  'impact-tracker-active-view',
  'impact-tracker-metrics',
];

/**
 * Remove only this app's (scoped) storage keys. In a preview build this clears
 * just the preview's isolated data; in production it clears the real data.
 * Never calls localStorage.clear(), which would wipe unrelated keys and, in a
 * preview, the real app's data too.
 */
export function clearAppStorage(): void {
  for (const key of APP_KEYS) {
    localStorage.removeItem(scopedKey(key));
  }
}
