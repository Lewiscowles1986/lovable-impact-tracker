import { ImpactEntry } from '@/types/entry';
import { TrendingUp, Clock, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsBarProps {
  entries: ImpactEntry[];
}

export function StatsBar({ entries }: StatsBarProps) {
  const completed = entries.filter(e => e.status === 'completed');
  const inProgress = entries.filter(e => e.status === 'in-progress');
  const totalEstimated = completed.reduce((s, e) => s + e.originalEstimateDays, 0);
  const totalActual = completed.reduce((s, e) => s + e.actualDays, 0);
  const efficiency = totalEstimated > 0 ? Math.round((totalEstimated / totalActual) * 100) : 0;
  const highImpact = entries.filter(e => e.impactLevel === 'high' || e.impactLevel === 'critical').length;

  const stats = [
    { label: 'Total Entries', value: entries.length, icon: Target, color: 'text-primary' },
    { label: 'In Progress', value: inProgress.length, icon: Clock, color: 'text-info' },
    { label: 'Completed', value: completed.length, icon: TrendingUp, color: 'text-success' },
    { label: 'High Impact', value: highImpact, icon: Zap, color: 'text-primary' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="bg-card border border-border rounded-lg p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
