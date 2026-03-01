import { useState, useEffect, useMemo } from 'react';
import { useEntries, ImportResult } from '@/hooks/useEntries';
import { useMetrics } from '@/hooks/useMetrics';
import { useViews } from '@/hooks/useViews';
import { ImpactEntry, RACIRole } from '@/types/entry';
import { getStatusOptions, getRaciOptions } from '@/lib/filterOptions';
import { StatsBar } from '@/components/StatsBar';
import { EntryCard } from '@/components/EntryCard';
import { EntryForm } from '@/components/EntryForm';
import { SaveViewDialog } from '@/components/SaveViewDialog';
import { MetricsEditor } from '@/components/MetricsEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Zap, Settings, Database, Trash2, Download, Upload, Filter, Save, RefreshCw, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { createSampleEntries } from '@/lib/sampleData';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';

const STATUS_OPTIONS = getStatusOptions();
const RACI_OPTIONS = getRaciOptions();

const Index = () => {
  const { entries, addEntry, updateEntry, deleteEntry, loadSampleData, clearAllEntries, exportEntries, exportEntriesOnly, exportViewsOnly, exportMetricsOnly, parseImportFile, applyImport } = useEntries();
  const { views, activeViewId, selectView, updateView, saveNewView, overwriteView, getView, importViews, clearAllViews } = useViews();
  const { computed: metricsData, configs: metricsConfigs, updateConfigs: updateMetricsConfigs, resetToDefaults: resetMetrics, importMetrics } = useMetrics(entries);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ImpactEntry | undefined>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [statusMode, setStatusMode] = useState<'or' | 'and'>('or');
  const [raciFilter, setRaciFilter] = useState<RACIRole[]>([]);
  const [raciMode, setRaciMode] = useState<'or' | 'and'>('or');
  const [pendingImport, setPendingImport] = useState<ImportResult | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [metricsEditorOpen, setMetricsEditorOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply active view's filters on view change
  useEffect(() => {
    const view = getView(activeViewId);
    if (view) {
      setSearch(view.search);
      setStatusFilter(view.filters.status.values);
      setStatusMode(view.filters.status.mode);
      setRaciFilter(view.filters.raci.values as RACIRole[]);
      setRaciMode(view.filters.raci.mode);
    }
  }, [activeViewId, getView]);

  // Check if current filters differ from saved view
  const activeView = getView(activeViewId);
  const hasChanges = useMemo(() => {
    if (!activeView) return false;
    const { filters, search: savedSearch } = activeView;
    if (search !== savedSearch) return true;
    if (statusMode !== filters.status.mode) return true;
    if (raciMode !== filters.raci.mode) return true;
    if (statusFilter.length !== filters.status.values.length || !statusFilter.every(v => filters.status.values.includes(v))) return true;
    if (raciFilter.length !== filters.raci.values.length || !raciFilter.every(v => filters.raci.values.includes(v))) return true;
    return false;
  }, [activeView, search, statusFilter, statusMode, raciFilter, raciMode]);

  const currentFilters = () => ({
    status: { values: statusFilter, mode: statusMode },
    raci: { values: raciFilter, mode: raciMode },
  });

  const handleUpdateView = () => {
    updateView(activeViewId, currentFilters(), search);
    toast({ title: 'View updated' });
  };

  const handleSaveNew = (name: string) => {
    return saveNewView(name, currentFilters(), search);
  };

  const handleOverwrite = (id: string, name: string) => {
    overwriteView(id, name, currentFilters(), search);
    toast({ title: 'View overwritten' });
  };

  const handleLoadSample = () => {
    const samples = createSampleEntries();
    loadSampleData(samples);
    toast({ title: 'Sample data loaded', description: `${samples.length} entries added.` });
  };

  const handleClearAll = () => {
    clearAllEntries();
    toast({ title: 'All entries cleared' });
  };

  const handleExportAll = () => {
    exportEntries(views, metricsConfigs);
    toast({ title: 'Full backup downloaded' });
  };

  const handleExportEntries = () => {
    exportEntriesOnly();
    toast({ title: 'Entries exported' });
  };

  const handleExportViews = () => {
    exportViewsOnly(views);
    toast({ title: 'Views exported' });
  };

  const handleExportMetrics = () => {
    exportMetricsOnly(metricsConfigs);
    toast({ title: 'Metrics exported' });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await parseImportFile(file);
      if (result.checksumMismatch) {
        setPendingImport(result);
      } else {
        const parts: string[] = [];
        if (result.entries.length > 0) {
          applyImport(result.entries);
          parts.push(`${result.entries.length} entries`);
        }
        if (result.views && result.views.length > 0) {
          importViews(result.views);
          parts.push(`${result.views.length} views`);
        }
        if (result.metrics && result.metrics.length > 0) {
          importMetrics(result.metrics);
          parts.push(`${result.metrics.length} metrics`);
        }
        toast({ title: 'Import complete', description: parts.length > 0 ? `Loaded ${parts.join(', ')}.` : 'No data found in file.' });
      }
    } catch {
      toast({ title: 'Import failed', description: 'Invalid backup file.', variant: 'destructive' });
    }
    e.target.value = '';
  };

  const handleConfirmCorruptImport = () => {
    if (pendingImport) {
      applyImport(pendingImport.entries);
      if (pendingImport.views) importViews(pendingImport.views);
      if (pendingImport.metrics) importMetrics(pendingImport.metrics);
      toast({ title: 'Backup restored', description: `${pendingImport.entries.length} entries loaded (checksum warning overridden).` });
      setPendingImport(null);
    }
  };

  const handleExportBeforeImport = () => {
    exportEntries(views, metricsConfigs);
    toast({ title: 'Current data exported' });
  };

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
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Download className="w-4 h-4 mr-2" /> Export
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={handleExportAll}>
                      Everything
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportEntries}>
                      Entries Only
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportViews}>
                      Views Only
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportMetrics}>
                      Metrics Only
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Import
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setMetricsEditorOpen(true)}>
                  <BarChart3 className="w-4 h-4 mr-2" /> Configure Metrics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLoadSample}>
                  <Database className="w-4 h-4 mr-2" /> Load Sample Data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleClearAll} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Clear All Entries
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { clearAllViews(); toast({ title: 'All views cleared' }); }} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Clear All Views
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Clear All State
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
        <StatsBar metrics={metricsData} />

        {/* Filters */}
        <div className="space-y-3">
          {/* Search + Status/RACI */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search entries or technologies..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
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
                        checked={raciFilter.includes(value as RACIRole)}
                        onCheckedChange={() => toggleRaci(value as RACIRole)}
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
          </div>

          {/* Row 2: View selector + Update + Save */}
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={activeViewId} onValueChange={selectView}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {views.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              disabled={!hasChanges}
              onClick={handleUpdateView}
              className="gap-1.5"
            >
            <RefreshCw className="w-3.5 h-3.5" />
            Update
          </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
              className="gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </Button>
          </div>
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

      {/* Save View Dialog */}
      <SaveViewDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSaveNew}
        onOverwrite={handleOverwrite}
      />

      {/* Metrics Editor */}
      <MetricsEditor
        open={metricsEditorOpen}
        onOpenChange={setMetricsEditorOpen}
        configs={metricsConfigs}
        onUpdate={updateMetricsConfigs}
        onReset={resetMetrics}
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
