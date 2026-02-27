import { User, Users, ClipboardPaste } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EntryMode = 'single' | 'bulk' | 'paste'; // Añadimos 'paste'

interface EntryModeToggleProps {
  mode: EntryMode;
  onModeChange: (mode: EntryMode) => void;
}

export function EntryModeToggle({ mode, onModeChange }: EntryModeToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <button
        onClick={() => onModeChange('bulk')}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
          mode === 'bulk'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Users className="w-4 h-4" />
        Tabla (Manual)
      </button>
      <button
        onClick={() => onModeChange('paste')}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
          mode === 'paste'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <ClipboardPaste className="w-4 h-4" />
        Pegado Excel
      </button>
    </div>
  );
}