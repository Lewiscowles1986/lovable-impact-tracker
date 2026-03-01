import { useState } from 'react';
import { useEntries, ImportResult } from '@/hooks/useEntries';
import { ImpactEntry, RACIRole } from '@/types/entry';
import { StatsBar } from '@/components/StatsBar';
import { EntryCard } from '@/components/EntryCard';
import { EntryForm } from '@/components/EntryForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Zap, Settings, Database, Trash2, Download, Upload, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { createSampleEntries } from '@/lib/sampleData';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';

const Index = () => {
  const { entries, addEntry, updateEntry, deleteEntry, loadSampleData, clearAllEntries, exportEntries, parseImportFile, applyImport } = useEntries();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ImpactEntry | undefined>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [statusMode, setStatusMode] = useState<'or' | 'and'>('or');
  const [raciFilter, setRaciFilter] = useState<RACIRole[]>([]);
  const [raciMode, setRaciMode] = useState<'or' | 'and'>('or');
  const [pendingImport, setPendingImport] = useState<ImportResult | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadSample = () => {
    const samples = createSampleEntries();
    loadSampleData(samples);
    toast({ title: 'Sample data loaded', description: `${samples.length} entries added.` });
  };

  const handleClearAll = () => {
    clearAllEntries();
    toast({ title: 'All entries cleared' });
  };

  const handleExport = () => {
    exportEntries();
    toast({ title: 'Backup downloaded' });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await parseImportFile(file);
      if (result.checksumMismatch) {
        setPendingImport(result);
      } else {
        applyImport(result.entries);
        toast({ title: 'Backup restored', description: `${result.entries.length} entries loaded.` });
      }
    } catch {
      toast({ title: 'Import failed', description: 'Invalid backup file.', variant: 'destructive' });
    }
    e.target.value = '';
  };

  const handleConfirmCorruptImport = () => {
    if (pendingImport) {
      applyImport(pendingImport.entries);
      toast({ title: 'Backup restored', description: `${pendingImport.entries.length} entries loaded (checksum warning overridden).` });
      setPendingImport(null);
    }
  };

  const handleExportBeforeImport = () => {
    exportEntries();
    toast({ title: 'Current data exported' });
  };

  const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: 'planned', label: 'Planned' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  const RACI_OPTIONS: { value: RACIRole; label: string }[] = [
    { value: 'responsible', label: 'Responsible' },
    { value: 'accountable', label: 'Accountable' },
    { value: 'consulted', label: 'Consulted' },
    { value: 'informed', label: 'Informed' },
  ];

  const toggleStatus = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleRaci = (role: RACIRole) => {
    setRaciFilter(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const filtered = entries.filter(e => {
    const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.technologies.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter.length === 0 ||
      (statusMode === 'or'
        ? statusFilter.some(s => e.status === s)
        : statusFilter.every(s => e.status === s));
    const matchesRaci = raciFilter.length === 0 ||
      (raciMode === 'or'
        ? raciFilter.some(r => e.raci.includes(r))
        : raciFilter.every(r => e.raci.includes(r)));
    return matchesSearch && matchesStatus && matchesRaci;
  });

  const handleEdit = (entry: ImpactEntry) => {
    setEditing(entry);
    setFormOpen(true);
  };

  const handleSave = (data: Omit<ImpactEntry, 'id' | 'createdAt'>) => {
    if (editing) {
      updateEntry(editing.id, data);
      setEditing(undefined);
    } else {
      addEntry(data);
    }
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditing(undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Impact Tracker</h1>
              <p className="text-[11px] text-muted-foreground">Staff Engineer Performance Log</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-1.5" /> Settings
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" /> Export Backup
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Import Backup
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLoadSample}>
                  <Database className="w-4 h-4 mr-2" /> Load Sample Data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleClearAll} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Clear All Entries
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <Button onClick={() => setFormOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> New Entry
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <StatsBar entries={entries} />

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search entries or technologies..."
              className="pl-9"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="w-4 h-4" />
                Status
                {statusFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] leading-4">
                    {statusFilter.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-2" align="start">
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Mode</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-medium ${statusMode === 'or' ? 'text-foreground' : 'text-muted-foreground'}`}>OR</span>
                  <Switch checked={statusMode === 'and'} onCheckedChange={v => setStatusMode(v ? 'and' : 'or')} className="scale-75" />
                  <span className={`text-[11px] font-medium ${statusMode === 'and' ? 'text-foreground' : 'text-muted-foreground'}`}>AND</span>
                </div>
              </div>
              {STATUS_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent text-sm"
                >
                  <Checkbox
                    checked={statusFilter.includes(value)}
                    onCheckedChange={() => toggleStatus(value)}
                  />
                  {label}
                </label>
              ))}
              {statusFilter.length > 0 && (
                <Button variant="ghost" size="sm" className="w-full mt-1 text-xs" onClick={() => setStatusFilter([])}>
                  Clear
                </Button>
              )}
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="w-4 h-4" />
                RACI
                {raciFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] leading-4">
                    {raciFilter.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-2" align="start">
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Mode</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-medium ${raciMode === 'or' ? 'text-foreground' : 'text-muted-foreground'}`}>OR</span>
                  <Switch checked={raciMode === 'and'} onCheckedChange={v => setRaciMode(v ? 'and' : 'or')} className="scale-75" />
                  <span className={`text-[11px] font-medium ${raciMode === 'and' ? 'text-foreground' : 'text-muted-foreground'}`}>AND</span>
                </div>
              </div>
              {RACI_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent text-sm"
                >
                  <Checkbox
                    checked={raciFilter.includes(value)}
                    onCheckedChange={() => toggleRaci(value)}
                  />
                  {label}
                </label>
              ))}
              {raciFilter.length > 0 && (
                <Button variant="ghost" size="sm" className="w-full mt-1 text-xs" onClick={() => setRaciFilter([])}>
                  Clear
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Entry List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              filtered.map(entry => (
                <EntryCard key={entry.id} entry={entry} onEdit={handleEdit} onDelete={deleteEntry} />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No entries yet</h3>
                <p className="text-sm text-muted-foreground mb-6">Start tracking your impact by adding your first entry.</p>
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-1.5" /> Add Your First Entry
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Form Dialog */}
      <EntryForm
        open={formOpen}
        onClose={handleClose}
        onSave={handleSave}
        initial={editing}
      />

      {/* Checksum Mismatch Dialog */}
      <AlertDialog open={!!pendingImport} onOpenChange={(open) => { if (!open) setPendingImport(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Errors detected — possible corruption</AlertDialogTitle>
            <AlertDialogDescription>
              Checksum mismatch on the imported file. The data may have been corrupted or tampered with. Would you like to proceed anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" onClick={handleExportBeforeImport}>
              <Download className="w-4 h-4 mr-1.5" /> Export current data first
            </Button>
            <div className="flex gap-2 ml-auto">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmCorruptImport}>
                Proceed anyway
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
