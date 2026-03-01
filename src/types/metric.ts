/**
 * Metric configuration types.
 *
 * Built-in types:
 *   count        — total entries (optionally filtered)
 *   filter-count — entries matching a field/value filter
 *   sum          — sum a numeric field
 *   avg          — average a numeric field
 *   min          — minimum of a numeric field
 *   max          — maximum of a numeric field
 *   ratio        — numerator field sum / denominator field sum × 100
 *   custom       — user-provided reduce function string (sandboxed in Web Worker)
 */

export type BuiltInMetricType =
  | 'count'
  | 'filter-count'
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'ratio'
  | 'custom';

export interface MetricFilter {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'includes';
  value: string | string[];
}

export interface MetricConfig {
  id: string;
  label: string;
  type: BuiltInMetricType;
  icon?: string;            // lucide icon name
  color?: string;           // semantic token class, e.g. 'text-primary'
  /** For filter-count: filter to apply */
  filter?: MetricFilter;
  /** For sum/avg/min/max: the numeric field to aggregate */
  field?: string;
  /** For ratio: numerator and denominator numeric fields */
  numeratorField?: string;
  denominatorField?: string;
  /** For ratio: suffix string (default '%') */
  suffix?: string;
  /** For custom: the reduce function body as a string */
  customFn?: string;
  /** Display order (lower = first) */
  order?: number;
  /** Whether this metric is currently visible */
  enabled?: boolean;
}

export interface MetricsJsonFile {
  metrics: MetricConfig[];
}

export interface ComputedMetric {
  id: string;
  label: string;
  value: number | string;
  icon?: string;
  color?: string;
  suffix?: string;
}
