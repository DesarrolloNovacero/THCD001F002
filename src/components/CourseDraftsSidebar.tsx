import { Plus, Trash2, BookOpen, Users, Copy, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BulkEntryRow } from './BulkEntryGrid'; 
import { EventData } from './EventDataSection';

export interface CourseDraft {
  id: string;
  nombreCurso: string;
  fechaCreacion: Date;
  participantes: number;
  eventData: EventData;
  employeeData?: any; 
  bulkRows?: BulkEntryRow[]; 
  entryMode: 'single' | 'bulk';
  cedula?: string; 
  validationStatus?: string;
  eventoId?: string;
  estado?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'BORRADOR';
  codigo?: string;
  comentario?: string;
}

interface CourseDraftsSidebarProps {
  drafts: CourseDraft[];
  selectedDraftId: string | null;
  onSelectDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
  onDuplicateDraft: (id: string) => void;
  onNewCourse: () => void;
}

export function CourseDraftsSidebar({
  drafts,
  selectedDraftId,
  onSelectDraft,
  onDeleteDraft,
  onDuplicateDraft,
  onNewCourse,
}: CourseDraftsSidebarProps) {
  return (
    <div className="w-72 bg-white border-r border-border flex flex-col h-full sticky top-0 shadow-sm z-20">
      <div className="p-4 border-b border-border bg-slate-50">
        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Cursos Pre-guardados
        </h3>
        <Button
          onClick={onNewCourse}
          className="w-full h-9 bg-slate-800 hover:bg-slate-700 text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Curso (Limpiar)
        </Button>
      </div>
      
      <ScrollArea className="flex-1 bg-slate-50/50">
        <div className="p-3 space-y-2">
          {drafts.length === 0 ? (
            <div className="text-center py-10 px-4">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">
                Lista vacía
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Llena un curso y presiona "Pre-guardar" para añadirlo aquí.
              </p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.id}
                className={cn(
                  "group relative p-3 rounded-lg cursor-pointer transition-all border shadow-sm",
                  selectedDraftId === draft.id
                    ? "bg-white border-primary ring-1 ring-primary"
                    : "bg-white border-slate-200 hover:border-primary/50 hover:shadow-md",
                  draft.estado === 'RECHAZADO' && "border-red-300 bg-red-50/30"
                )}
                onClick={() => onSelectDraft(draft.id)}
              >
                <div className="pr-12">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight">
                      {draft.nombreCurso || 'Curso sin nombre'}
                    </h4>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(!draft.estado || draft.estado === 'BORRADOR') && <span className="text-slate-500 font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">Borrador</span>}
                    {draft.estado === 'PENDIENTE' && <span className="flex items-center text-amber-600 font-bold text-[10px] bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200"><Clock className="w-3 h-3 mr-1"/>Pendiente</span>}
                    {draft.estado === 'APROBADO' && <span className="flex items-center text-emerald-600 font-bold text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1"/>Aprobado</span>}
                    {draft.estado === 'RECHAZADO' && <span className="flex items-center text-red-600 font-bold text-[10px] bg-red-100 px-1.5 py-0.5 rounded border border-red-200"><AlertCircle className="w-3 h-3 mr-1"/>Rechazado</span>}
                  </div>
  
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    <span className="font-medium">
                      {draft.participantes} participante{draft.participantes !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="text-xs text-slate-500 mt-1">
                    Código: {draft.eventoId}
                  </div>


                  {draft.codigo && (
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                      {draft.codigo}
                    </span>
                  )}

                </div>
                  
                  <p className="text-[10px] text-slate-400 mt-1">
                    {format(new Date(draft.fechaCreacion), "dd MMM, HH:mm", { locale: es })}
                  </p>

                  {draft.estado === 'RECHAZADO' && draft.comentario && (
                    <div className="mt-2 text-[10px] bg-red-100 text-red-800 p-1.5 rounded border border-red-200 leading-tight">
                      <strong>Motivo:</strong> {draft.comentario}
                    </div>
                  )}
                </div>
                
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateDraft(draft.id);
                    }}
                    title="Duplicar curso"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDraft(draft.id);
                    }}
                    title="Eliminar curso"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      {drafts.length > 0 && (
        <div className="p-4 border-t border-border bg-white">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
            <span>Total Cursos:</span>
            <span className="font-bold">{drafts.length}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500">
             <span>Total Personas:</span>
             <span className="font-bold">
                {drafts.reduce((acc, curr) => acc + curr.participantes, 0)}
             </span>
          </div>
        </div>
      )}
    </div>
  );
}