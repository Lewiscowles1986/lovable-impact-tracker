import { ImpactEntry } from '@/types/entry';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, Clock, Layers, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface EntryCardProps {
  entry: ImpactEntry;
  onEdit: (entry: ImpactEntry) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  planned: 'bg-muted text-muted-foreground',
  'in-progress': 'bg-info/15 text-info',
  completed: 'bg-success/15 text-success',
};

const impactColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-primary/10 text-primary',
  high: 'bg-primary/20 text-primary',
  critical: 'bg-destructive/15 text-destructive',
};

export function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const estimateDiff = entry.actualDays - entry.originalEstimateDays;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-card border border-border rounded-lg overflow-hidden group"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-start gap-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="font-semibold text-foreground truncate">{entry.title}</h3>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[entry.status]}`}>
              {entry.status}
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${impactColors[entry.impactLevel]}`}>
              {entry.impactLevel} impact
            </span>
            {entry.raci?.length > 0 && entry.raci.map(r => (
              <span
                key={r}
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-accent-foreground"
                title={r}
                aria-label={r}
              >
                {r.charAt(0)}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{entry.startDate}{entry.endDate && ` → ${entry.endDate}`}</span>
            {entry.originalEstimateDays > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Est: {entry.originalEstimateDays}d
                {entry.actualDays > 0 && <> / Actual: {entry.actualDays}d</>}
                {estimateDiff > 0 && entry.actualDays > 0 && (
                  <span className="text-destructive">(+{estimateDiff}d)</span>
                )}
              </span>
            )}
          </div>
          {entry.technologies.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {entry.technologies.map(t => (
                <span key={t} className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Situation', value: entry.situation },
                  { label: 'Task', value: entry.task },
                  { label: 'Action', value: entry.action },
                  { label: 'Result', value: entry.result },
                ].map(f => f.value && (
                  <div key={f.label}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">{f.label}</p>
                    <p className="text-sm text-foreground leading-relaxed">{f.value}</p>
                  </div>
                ))}
              </div>

              {entry.complicatingFactors && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive mb-1">Complicating Factors</p>
                  <p className="text-sm text-foreground leading-relaxed">{entry.complicatingFactors}</p>
                </div>
              )}

              {entry.growthWins && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-success mb-1">Growth & Wins</p>
                  <p className="text-sm text-foreground leading-relaxed">{entry.growthWins}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(entry)}>
                  <Edit2 className="w-3 h-3 mr-1.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(entry.id)}>
                  <Trash2 className="w-3 h-3 mr-1.5" /> Delete
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
