import { ImpactEntry } from '@/types/entry';
import { MetricConfig, MetricFilter, ComputedMetric } from '@/types/metric';

/**
 * Apply a filter predicate to entries.
 */
function matchesFilter(entry: ImpactEntry, filter: MetricFilter): boolean {
  const fieldValue = (entry as unknown as Record<string, unknown>)[filter.field];

  switch (filter.operator) {
    case 'eq':
      return fieldValue === filter.value;
    case 'neq':
      return fieldValue !== filter.value;
    case 'in':
      return Array.isArray(filter.value) && filter.value.includes(String(fieldValue));
    case 'includes':
      // for array fields like raci, technologies
      return Array.isArray(fieldValue) && fieldValue.includes(filter.value as string);
    default:
      return true;
  }
}

/**
 * Get numeric value from an entry field.
 */
function numericField(entry: ImpactEntry, field: string): number {
  const val = (entry as unknown as Record<string, unknown>)[field];
  return typeof val === 'number' ? val : 0;
}

/**
 * Compute a single built-in metric.
 */
export function computeBuiltInMetric(
  config: MetricConfig,
  entries: ImpactEntry[]
): number | string {
  switch (config.type) {
    case 'count': {
      const filtered = config.filter
        ? entries.filter(e => matchesFilter(e, config.filter!))
        : entries;
      return filtered.length;
    }

    case 'filter-count': {
      if (!config.filter) return 0;
      return entries.filter(e => matchesFilter(e, config.filter!)).length;
    }

    case 'sum': {
      if (!config.field) return 0;
      const filtered = config.filter
        ? entries.filter(e => matchesFilter(e, config.filter!))
        : entries;
      return filtered.reduce((acc, e) => acc + numericField(e, config.field!), 0);
    }

    case 'avg': {
      if (!config.field) return 0;
      const filtered = config.filter
        ? entries.filter(e => matchesFilter(e, config.filter!))
        : entries;
      if (filtered.length === 0) return 0;
      const total = filtered.reduce((acc, e) => acc + numericField(e, config.field!), 0);
      return Math.round((total / filtered.length) * 10) / 10;
    }

    case 'min': {
      if (!config.field) return 0;
      const filtered = config.filter
        ? entries.filter(e => matchesFilter(e, config.filter!))
        : entries;
      if (filtered.length === 0) return 0;
      return Math.min(...filtered.map(e => numericField(e, config.field!)));
    }

    case 'max': {
      if (!config.field) return 0;
      const filtered = config.filter
        ? entries.filter(e => matchesFilter(e, config.filter!))
        : entries;
      if (filtered.length === 0) return 0;
      return Math.max(...filtered.map(e => numericField(e, config.field!)));
    }

    case 'ratio': {
      if (!config.numeratorField || !config.denominatorField) return 0;
      const filtered = config.filter
        ? entries.filter(e => matchesFilter(e, config.filter!))
        : entries;
      const num = filtered.reduce((acc, e) => acc + numericField(e, config.numeratorField!), 0);
      const den = filtered.reduce((acc, e) => acc + numericField(e, config.denominatorField!), 0);
      if (den === 0) return 0;
      return Math.round((num / den) * 100);
    }

    default:
      return 0;
  }
}

/**
 * Compute all metrics (built-in only; custom handled separately via Worker).
 */
export function computeAllMetrics(
  configs: MetricConfig[],
  entries: ImpactEntry[]
): ComputedMetric[] {
  return configs
    .filter(c => c.enabled !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(config => {
      if (config.type === 'custom') {
        // Custom metrics are computed asynchronously via Worker
        return {
          id: config.id,
          label: config.label,
          value: '…',
          icon: config.icon,
          color: config.color,
          suffix: config.suffix,
        };
      }
      return {
        id: config.id,
        label: config.label,
        value: computeBuiltInMetric(config, entries),
        icon: config.icon,
        color: config.color,
        suffix: config.suffix,
      };
    });
}

/**
 * Run a custom reduce function inside a Web Worker.
 * The function receives `entries` as a serializable array.
 * Returns a Promise that resolves with the computed value or rejects on timeout/error.
 */
export function runCustomMetricInWorker(
  fnBody: string,
  entries: ImpactEntry[],
  timeoutMs = 2000
): Promise<number | string> {
  return new Promise((resolve, reject) => {
    const workerCode = `
      self.onmessage = function(e) {
        try {
          const entries = e.data.entries;
          const fn = new Function('entries', ${JSON.stringify(fnBody)});
          const result = fn(entries);
          self.postMessage({ ok: true, value: result });
        } catch (err) {
          self.postMessage({ ok: false, error: String(err) });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    const timer = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error('Custom metric timed out'));
    }, timeoutMs);

    worker.onmessage = (e) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      if (e.data.ok) {
        resolve(e.data.value);
      } else {
        reject(new Error(e.data.error));
      }
    };

    worker.onerror = (err) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error(err.message));
    };

    // Send only serializable data
    worker.postMessage({
      entries: JSON.parse(JSON.stringify(entries)),
    });
  });
}
