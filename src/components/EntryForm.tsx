import { useState, useEffect } from 'react';
import { ImpactEntry, RACIRole } from '@/types/entry';
import { Checkbox } from '@/components/ui/checkbox';
import { createBlankEntry } from '@/lib/entries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface EntryFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: Omit<ImpactEntry, 'id' | 'createdAt'>) => void;
  initial?: ImpactEntry;
}

export function EntryForm({ open, onClose, onSave, initial }: EntryFormProps) {
  const [form, setForm] = useState<Partial<ImpactEntry>>(initial || createBlankEntry());
  const [techInput, setTechInput] = useState('');

  useEffect(() => {
    if (open) {
      setForm(initial || createBlankEntry());
      setTechInput('');
    }
  }, [open, initial]);

  const set = (key: keyof ImpactEntry, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const addTech = () => {
    if (techInput.trim()) {
      set('technologies', [...(form.technologies || []), techInput.trim()]);
      setTechInput('');
    }
  };

  const removeTech = (t: string) => {
    set('technologies', (form.technologies || []).filter((x: string) => x !== t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    onSave(form as Omit<ImpactEntry, 'id' | 'createdAt'>);
    setForm(createBlankEntry());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{initial ? 'Edit Entry' : 'New Impact Entry'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>Title *</Label>
            <Input value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="e.g., Led migration to microservices" className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Impact Level</Label>
              <Select value={form.impactLevel} onValueChange={v => set('impactLevel', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={form.startDate || ''} onChange={e => set('startDate', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={form.endDate || ''} onChange={e => set('endDate', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Est. (days)</Label>
              <Input type="number" min={0} value={form.originalEstimateDays || ''} onChange={e => set('originalEstimateDays', +e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Actual (days)</Label>
              <Input type="number" min={0} value={form.actualDays || ''} onChange={e => set('actualDays', +e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label>RACI Role(s)</Label>
            <div className="flex gap-4 mt-2">
              {(['responsible', 'accountable', 'consulted', 'informed'] as RACIRole[]).map(role => (
                <label key={role} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={(form.raci || []).includes(role)}
                    onCheckedChange={(checked) => {
                      const current = form.raci || [];
                      set('raci', checked ? [...current, role] : current.filter(r => r !== role));
                    }}
                  />
                  <span className="text-sm capitalize text-foreground">{role}</span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary pt-2">STAR Framework</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Situation</Label>
              <Textarea value={form.situation || ''} onChange={e => set('situation', e.target.value)} placeholder="Context and background..." className="mt-1 min-h-[80px]" />
            </div>
            <div>
              <Label>Task</Label>
              <Textarea value={form.task || ''} onChange={e => set('task', e.target.value)} placeholder="What needed to be done..." className="mt-1 min-h-[80px]" />
            </div>
            <div>
              <Label>Action</Label>
              <Textarea value={form.action || ''} onChange={e => set('action', e.target.value)} placeholder="What you did..." className="mt-1 min-h-[80px]" />
            </div>
            <div>
              <Label>Result</Label>
              <Textarea value={form.result || ''} onChange={e => set('result', e.target.value)} placeholder="Outcome and metrics..." className="mt-1 min-h-[80px]" />
            </div>
          </div>

          <div>
            <Label>Complicating / Confounding Factors</Label>
            <Textarea value={form.complicatingFactors || ''} onChange={e => set('complicatingFactors', e.target.value)} placeholder="Unexpected challenges..." className="mt-1 min-h-[60px]" />
          </div>

          <div>
            <Label>Growth & Wins</Label>
            <Textarea value={form.growthWins || ''} onChange={e => set('growthWins', e.target.value)} placeholder="Skills gained, recognition, personal growth..." className="mt-1 min-h-[60px]" />
          </div>

          <div>
            <Label>Technologies</Label>
            <div className="flex gap-2 mt-1">
              <Input value={techInput} onChange={e => setTechInput(e.target.value)} placeholder="Add a technology..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech())} />
              <Button type="button" variant="outline" onClick={addTech}>Add</Button>
            </div>
            {(form.technologies || []).length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {(form.technologies || []).map((t: string) => (
                  <span key={t} className="text-xs font-mono bg-muted px-2 py-1 rounded flex items-center gap-1 text-muted-foreground">
                    {t}
                    <button type="button" onClick={() => removeTech(t)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">{initial ? 'Update' : 'Add Entry'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
