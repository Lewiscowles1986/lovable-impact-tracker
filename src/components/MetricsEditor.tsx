import { useState } from 'react';
import { MetricConfig, BuiltInMetricType } from '@/types/metric';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical, RotateCcw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const METRIC_TYPES: { value: BuiltInMetricType; label: string }[] = [
  { value: 'count', label: 'Count' },
  { value: 'filter-count', label: 'Filter Count' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
  { value: 'ratio', label: 'Ratio (%)' },
  { value: 'custom', label: 'Custom (JS)' },
];

const ICON_OPTIONS = ['Target', 'Clock', 'TrendingUp', 'Zap', 'Hash', 'BarChart3', 'Minus', 'ArrowUpDown'];
const COLOR_OPTIONS = [
  { value: 'text-primary', label: 'Primary' },
  { value: 'text-success', label: 'Success' },
  { value: 'text-info', label: 'Info' },
  { value: 'text-destructive', label: 'Destructive' },
  { value: 'text-muted-foreground', label: 'Muted' },
];

const NUMERIC_FIELDS = [
  'originalEstimateDays',
  'actualDays',
];

const FILTER_FIELDS = [
  'status',
  'impactLevel',
];

interface MetricsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configs: MetricConfig[];
  onUpdate: (configs: MetricConfig[]) => void;
  onReset: () => void;
}

function generateId() {
  return 'metric-' + Math.random().toString(36).slice(2, 8);
}

function createEmptyMetric(order: number): MetricConfig {
  return {
    id: generateId(),
    label: 'New Metric',
    type: 'count',
    icon: 'Target',
    color: 'text-primary',
    order,
    enabled: true,
  };
}

export function MetricsEditor({ open, onOpenChange, configs, onUpdate, onReset }: MetricsEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    const newMetric = createEmptyMetric(configs.length);
    onUpdate([...configs, newMetric]);
    setEditingId(newMetric.id);
  };

  const handleRemove = (id: string) => {
    onUpdate(configs.filter(c => c.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleUpdate = (id: string, updates: Partial<MetricConfig>) => {
    onUpdate(configs.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...configs];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onUpdate(next.map((c, i) => ({ ...c, order: i })));
  };

  const handleMoveDown = (index: number) => {
    if (index === configs.length - 1) return;
    const next = [...configs];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onUpdate(next.map((c, i) => ({ ...c, order: i })));
  };

  const sorted = [...configs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const editing = editingId ? configs.find(c => c.id === editingId) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configure Metrics</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* List */}
          <div className="w-1/2 flex flex-col gap-2">
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-1">
                {sorted.map((config, i) => (
                  <div
                    key={config.id}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm border transition-colors ${
                      editingId === config.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-accent'
                    }`}
                    onClick={() => setEditingId(config.id)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <button
                        className="text-muted-foreground hover:text-foreground p-0 h-3"
                        onClick={(e) => { e.stopPropagation(); handleMoveUp(i); }}
                      >
                        <GripVertical className="w-3 h-3 rotate-180" />
                      </button>
                      <button
                        className="text-muted-foreground hover:text-foreground p-0 h-3"
                        onClick={(e) => { e.stopPropagation(); handleMoveDown(i); }}
                      >
                        <GripVertical className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="truncate block">{config.label}</span>
                      <span className="text-[10px] text-muted-foreground">{config.type}</span>
                    </div>
                    <Switch
                      checked={config.enabled !== false}
                      onCheckedChange={(v) => { handleUpdate(config.id, { enabled: v }); }}
                      onClick={(e) => e.stopPropagation()}
                      className="scale-75"
                    />
                    <button
                      className="text-muted-foreground hover:text-destructive p-1"
                      onClick={(e) => { e.stopPropagation(); handleRemove(config.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button size="sm" variant="outline" onClick={handleAdd} className="flex-1 gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Metric
              </Button>
              <Button size="sm" variant="ghost" onClick={onReset} className="gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
            </div>
          </div>

          {/* Editor */}
          <div className="w-1/2 border-l border-border pl-4">
            {editing ? (
              <MetricForm config={editing} onUpdate={(updates) => handleUpdate(editing.id, updates)} />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Select a metric to edit
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricForm({ config, onUpdate }: { config: MetricConfig; onUpdate: (u: Partial<MetricConfig>) => void }) {
  return (
    <ScrollArea className="h-full pr-2">
      <div className="space-y-4">
        <div>
          <Label className="text-xs">Label</Label>
          <Input value={config.label} onChange={e => onUpdate({ label: e.target.value })} className="mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={config.type} onValueChange={v => onUpdate({ type: v as BuiltInMetricType })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {METRIC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Icon</Label>
            <Select value={config.icon || 'Target'} onValueChange={v => onUpdate({ icon: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs">Color</Label>
          <Select value={config.color || 'text-primary'} onValueChange={v => onUpdate({ color: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COLOR_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Filter config for filter-count */}
        {(config.type === 'filter-count' || config.type === 'count') && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-md">
            <Label className="text-xs font-medium">Filter</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Field</Label>
                <Select
                  value={config.filter?.field || ''}
                  onValueChange={v => onUpdate({ filter: { ...config.filter!, field: v, operator: config.filter?.operator || 'eq', value: config.filter?.value || '' } })}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Field" /></SelectTrigger>
                  <SelectContent>
                    {FILTER_FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">Operator</Label>
                <Select
                  value={config.filter?.operator || 'eq'}
                  onValueChange={v => onUpdate({ filter: { ...config.filter!, operator: v as 'eq' | 'neq' | 'in' | 'includes' } })}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eq">equals</SelectItem>
                    <SelectItem value="neq">not equals</SelectItem>
                    <SelectItem value="in">in (comma-sep)</SelectItem>
                    <SelectItem value="includes">includes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[10px]">Value</Label>
              <Input
                className="mt-1 h-8 text-xs"
                value={Array.isArray(config.filter?.value) ? config.filter.value.join(', ') : config.filter?.value || ''}
                onChange={e => {
                  const raw = e.target.value;
                  const val = config.filter?.operator === 'in'
                    ? raw.split(',').map(s => s.trim()).filter(Boolean)
                    : raw;
                  onUpdate({ filter: { ...config.filter!, value: val } });
                }}
                placeholder={config.filter?.operator === 'in' ? 'val1, val2' : 'value'}
              />
            </div>
          </div>
        )}

        {/* Numeric field for sum/avg/min/max */}
        {['sum', 'avg', 'min', 'max'].includes(config.type) && (
          <div>
            <Label className="text-xs">Numeric Field</Label>
            <Select value={config.field || ''} onValueChange={v => onUpdate({ field: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select field" /></SelectTrigger>
              <SelectContent>
                {NUMERIC_FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Ratio fields */}
        {config.type === 'ratio' && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-md">
            <Label className="text-xs font-medium">Ratio: numerator / denominator × 100</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Numerator</Label>
                <Select value={config.numeratorField || ''} onValueChange={v => onUpdate({ numeratorField: v })}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Field" /></SelectTrigger>
                  <SelectContent>
                    {NUMERIC_FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">Denominator</Label>
                <Select value={config.denominatorField || ''} onValueChange={v => onUpdate({ denominatorField: v })}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Field" /></SelectTrigger>
                  <SelectContent>
                    {NUMERIC_FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[10px]">Suffix</Label>
              <Input className="mt-1 h-8 text-xs" value={config.suffix || '%'} onChange={e => onUpdate({ suffix: e.target.value })} />
            </div>
          </div>
        )}

        {/* Custom function */}
        {config.type === 'custom' && (
          <div>
            <Label className="text-xs">Custom Function Body</Label>
            <p className="text-[10px] text-muted-foreground mb-1">
              Receives <code>entries</code> array. Must return a number or string. Runs in a Web Worker (2s timeout).
            </p>
            <Textarea
              className="mt-1 font-mono text-xs"
              rows={5}
              value={config.customFn || ''}
              onChange={e => onUpdate({ customFn: e.target.value })}
              placeholder={'return entries.filter(e => e.status === "completed").length;'}
            />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
