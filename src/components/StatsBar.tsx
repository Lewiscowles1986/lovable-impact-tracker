import { ComputedMetric } from '@/types/metric';
import { TrendingUp, Clock, Zap, Target, Hash, BarChart3, Minus, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Target,
  Clock,
  TrendingUp,
  Zap,
  Hash,
  BarChart3,
  Minus,
  ArrowUpDown,
};

interface StatsBarProps {
  metrics: ComputedMetric[];
}

export function StatsBar({ metrics }: StatsBarProps) {
  if (metrics.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, i) => {
        const Icon = (metric.icon && ICON_MAP[metric.icon]) || Target;
        const colorClass = metric.color || 'text-primary';

        return (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card border border-border rounded-lg p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <Icon className={`w-4 h-4 ${colorClass}`} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{metric.label}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {metric.value}{metric.suffix || ''}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
