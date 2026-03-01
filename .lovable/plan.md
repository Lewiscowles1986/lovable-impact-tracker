

# Phase 1: Saved Filter Views (Revised)

## Data Model

The `SavedView` type uses your proposed nested filter structure. RACI values are typed as `string[]` in the spec -- runtime validation maps them against the canonical values derived from the Zod schema.

```text
SavedView {
  id: string
  name: string
  search: string
  filters: {
    status: { values: string[], mode: 'or' | 'and' }
    raci:   { values: string[], mode: 'or' | 'and' }
  }
}
```

The "Default" view (id: `"default"`) is auto-created with empty values and `'or'` modes. It cannot be deleted.

## Deriving Valid Filter Values from Zod

The `raciRoleSchema` and the status enum in `impactEntrySchema` are already defined as `z.enum(...)` in `entrySchema.ts`. We will extract their `.options` arrays (e.g., `raciRoleSchema.options` yields `['responsible', 'accountable', 'consulted', 'informed']`) to:

1. Build the checkbox option lists in the UI (single source of truth -- no duplicated string arrays).
2. Validate saved view filter values on load (strip any value not in the canonical set, so the spec auto-expands when new roles/statuses are added to the schema).

A small helper in a new `src/lib/filterOptions.ts` will expose these derived lists and a label formatter (e.g., `'in-progress'` to `'In Progress'`).

## New Files

| File | Purpose |
|------|---------|
| `src/types/view.ts` | `SavedView` type, Zod schema (`savedViewSchema`), default view factory |
| `src/hooks/useViews.ts` | CRUD hook for views in localStorage. Ensures "Default" exists. Validates loaded values against current schema options. |
| `src/components/SaveViewDialog.tsx` | "Save As" dialog with name input, collision error, overwrite checkbox |
| `src/lib/filterOptions.ts` | Derives status and RACI option lists from Zod schemas; provides label formatter |

## Modified Files

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Remove hardcoded `STATUS_OPTIONS` / `RACI_OPTIONS` arrays (use `filterOptions.ts` instead). Add view Select dropdown, Update button, Save button. Wire filter state to `useViews`. |

## UI Behavior

### View Dropdown
- Select component listing all saved views, "Default" always first.
- Selecting a view applies its `search` and `filters` to local state.

### Update Button
- Compares current local filter state against the active view's saved state.
- Enabled when they differ; disabled when identical.
- Clicking overwrites the active view in localStorage.

### Save Button
- Opens `SaveViewDialog` prompting for a name.
- If name matches an existing view: inline error + "Overwrite" checkbox required to proceed.
- Creates a new view (or overwrites) and selects it.

### Deletion
Deferred to a later phase -- no delete UI in this iteration.

## Technical Details

### `src/lib/filterOptions.ts`

```text
- Imports raciRoleSchema and extracts .options -> string[]
- Imports status enum from impactEntrySchema and extracts .options -> string[]
- Exports: RACI_VALUES, STATUS_VALUES
- Exports: formatLabel(value: string) -> string  (capitalizes, replaces hyphens)
- Exports: option list builders that return { value, label }[]
```

### `src/types/view.ts`

The Zod schema uses `z.string()` for filter values (not `raciRoleSchema`) keeping the spec format-agnostic. Validation of values against allowed options happens at load time in the hook, not in the schema itself.

### `src/hooks/useViews.ts`

```text
Returns:
  views: SavedView[]
  activeViewId: string
  selectView(id: string)
  updateView(id: string, filters: SavedView['filters'], search: string)
  saveNewView(name: string, filters: SavedView['filters'], search: string): { success: boolean, existingId?: string }
  getView(id: string): SavedView | undefined
```

On init: reads localStorage key `impact-tracker-views`. If empty, creates the default view. Strips any filter values not present in the current schema options (handles schema evolution gracefully).

### Filter State Flow in Index.tsx

1. On view selection: local state (`search`, `statusFilter`, `raciFilter`, modes) is set from the view's data.
2. User edits filters freely -- local state only.
3. **Update**: writes local state back to the active view.
4. **Save**: opens dialog, creates/overwrites a named view from local state.

