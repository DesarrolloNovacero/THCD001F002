import { useState } from 'react';
import { Save, Trash2, FolderOpen, Clock, BookOpen, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CourseDraft } from './CourseDraftsSidebar';

export interface Session {
  id: string;
  nombre: string;
  fechaCreacion: Date;
  fechaModificacion: Date;
  drafts: CourseDraft[];
}

interface SessionsSidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  currentDrafts: CourseDraft[];
  onSaveSession: (nombre: string) => void;
  onLoadSession: (session: Session) => void;
  onDeleteSession: (id: string) => void;
  onUpdateSession: () => void;
}

export function SessionsSidebar({
  sessions,
  currentSessionId,
  currentDrafts,
  onSaveSession,
  onLoadSession,
  onDeleteSession,
  onUpdateSession,
}: SessionsSidebarProps) {
  const [newSessionName, setNewSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSave = () => {
    if (newSessionName.trim()) {
      onSaveSession(newSessionName.trim());
      setNewSessionName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="w-72 bg-white border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border bg-slate-50">
        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
           <FolderOpen className="w-4 h-4" />
           Sesiones Guardadas
        </h3>
        
        {isCreating ? (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <Input
              placeholder="Nombre de la sesión..."
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              autoFocus
              className="h-9 bg-white"
            />
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!newSessionName.trim()} size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                <Check className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)} size="sm">
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Button onClick={() => setIsCreating(true)} disabled={currentDrafts.length === 0} className="w-full h-9 bg-slate-800 text-white hover:bg-slate-700" size="sm">
              <Save className="w-4 h-4 mr-2" /> Nueva Sesión
            </Button>
            
            {currentSessionId && (
              <Button variant="outline" onClick={onUpdateSession} className="w-full h-9 border-green-600 text-green-700 hover:bg-green-50" size="sm">
                <Save className="w-4 h-4 mr-2" /> Actualizar Actual
              </Button>
            )}
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1 bg-slate-50/30">
        <div className="p-3 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-400">
              <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay sesiones</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group relative p-3 rounded-lg cursor-pointer transition-all border",
                  currentSessionId === session.id
                    ? "bg-blue-50 border-blue-200 ring-1 ring-blue-300"
                    : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
                )}
                onClick={() => onLoadSession(session)}
              >
                <div className="pr-8">
                  <h4 className="text-sm font-bold text-slate-800 truncate">{session.nombre}</h4>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {session.drafts.length}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(session.fechaModificacion), "HH:mm", { locale: es })}</span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}