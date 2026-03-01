import { z } from 'zod';

const filterGroupSchema = z.object({
  values: z.array(z.string()),
  mode: z.enum(['or', 'and']),
});

export const savedViewSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  search: z.string(),
  filters: z.object({
    status: filterGroupSchema,
    raci: filterGroupSchema,
  }),
});

export const savedViewArraySchema = z.array(savedViewSchema);

export type SavedView = z.infer<typeof savedViewSchema>;

export function createDefaultView(): SavedView {
  return {
    id: 'default',
    name: 'Default',
    search: '',
    filters: {
      status: { values: [], mode: 'or' },
      raci: { values: [], mode: 'or' },
    },
  };
}
