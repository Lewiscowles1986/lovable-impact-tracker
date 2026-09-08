/**
 * Preview banner.
 *
 * Rendered only in preview builds (see .github/workflows/github-pages.yml),
 * which set VITE_PREVIEW=true and VITE_PREVIEW_LABEL to the branch name. It
 * makes it obvious the user is looking at an isolated PR preview, not the
 * real app.
 */
const IS_PREVIEW = import.meta.env.VITE_PREVIEW === "true";
const PREVIEW_LABEL = (import.meta.env.VITE_PREVIEW_LABEL as string | undefined) ?? "this branch";

export function PreviewBanner() {
  if (!IS_PREVIEW) return null;

  return (
    <div className="w-full bg-amber-500 text-amber-950 text-center text-xs font-semibold px-4 py-1.5">
      🔎 Preview build — branch <code className="font-mono">{PREVIEW_LABEL}</code> · isolated storage, your real data is safe
    </div>
  );
}
