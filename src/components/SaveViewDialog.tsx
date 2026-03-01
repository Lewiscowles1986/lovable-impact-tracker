import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SavedView } from '@/types/view';

interface SaveViewDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => { success: boolean; existingId?: string };
  onOverwrite: (id: string, name: string) => void;
}

export function SaveViewDialog({ open, onClose, onSave, onOverwrite }: SaveViewDialogProps) {
  const [name, setName] = useState('');
  const [collisionId, setCollisionId] = useState<string | null>(null);
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);

  const reset = () => {
    setName('');
    setCollisionId(null);
    setOverwriteConfirmed(false);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      reset();
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (collisionId && overwriteConfirmed) {
      onOverwrite(collisionId, trimmed);
      reset();
      onClose();
      return;
    }

    const result = onSave(trimmed);
    if (result.success) {
      reset();
      onClose();
    } else if (result.existingId) {
      setCollisionId(result.existingId);
      setOverwriteConfirmed(false);
    }
  };

  const canSubmit = name.trim().length > 0 && (!collisionId || overwriteConfirmed);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save View</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="view-name">View name</Label>
            <Input
              id="view-name"
              value={name}
              onChange={e => {
                setName(e.target.value);
                setCollisionId(null);
                setOverwriteConfirmed(false);
              }}
              placeholder="e.g. Q1 Review"
              autoFocus
            />
            {collisionId && (
              <div className="space-y-2">
                <p className="text-sm text-destructive">A view with this name already exists.</p>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={overwriteConfirmed}
                    onCheckedChange={v => setOverwriteConfirmed(!!v)}
                  />
                  Overwrite existing view
                </label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {collisionId && overwriteConfirmed ? 'Overwrite' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
