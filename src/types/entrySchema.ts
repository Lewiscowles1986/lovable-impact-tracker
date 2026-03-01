import { z } from 'zod';

export const raciRoleSchema = z.enum(['responsible', 'accountable', 'consulted', 'informed']);

export const impactEntrySchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  createdAt: z.string(),
  // STAR
  situation: z.string(),
  task: z.string(),
  action: z.string(),
  result: z.string(),
  // Scheduling
  startDate: z.string(),
  endDate: z.string(),
  originalEstimateDays: z.number().min(0),
  actualDays: z.number().min(0),
  // Extra
  complicatingFactors: z.string(),
  technologies: z.array(z.string()),
  growthWins: z.string(),
  // RACI
  raci: z.array(raciRoleSchema),
  // Meta
  status: z.enum(['planned', 'in-progress', 'completed']),
  impactLevel: z.enum(['low', 'medium', 'high', 'critical']),
});

export const impactEntryArraySchema = z.array(impactEntrySchema);

export const dataEnvelopeSchema = z.object({
  version: z.number(),
  entries: impactEntryArraySchema,
  checksum: z.string(),
});

export type ImpactEntrySchema = z.infer<typeof impactEntrySchema>;
export type DataEnvelopeSchema = z.infer<typeof dataEnvelopeSchema>;
