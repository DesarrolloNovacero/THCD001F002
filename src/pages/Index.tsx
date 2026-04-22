import { useState, useEffect } from 'react';
import { FileUp, Save, RotateCcw, History, LibraryBig, FolderOpen, Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { FileDropZone } from '@/components/FileDropZone';
import { EventDataSection, EventData } from '@/components/EventDataSection';
import { BulkEntryGrid, BulkEntryRow } from '@/components/BulkEntryGrid';
import { PegadoEntryGrid } from '@/components/PegadoEntryGrid';
import { EntryModeToggle, EntryMode } from '@/components/EntryModeToggle';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CourseDraftsSidebar, CourseDraft } from '@/components/CourseDraftsSidebar';
import { SessionsSidebar, Session } from '@/components/SessionsSidebar';
import { useAuth } from '../contexts/AuthContext';

const INITIAL_EVENT_DATA: EventData = { 
  nombreCurso: '', 
  objetivo: '', 
  empresa: '', 
  facilitador: '', 
  dimensionEvento: '', 
  lugar: '', 
  modalidad: '', 
  fechaHoraInicio: undefined, 
  fechaHoraCierre: undefined, 
  totalHoras: '', 
  tipoEvento: '', 
  mesAnio: '' 
};

const createEmptyBulkRow = (): BulkEntryRow => ({ 
  id: crypto.randomUUID(), 
  cedula: '', 
  status: 'idle', 
  nombres: '', 
  apellidos: '', 
  cargo: '', 
  genero: '', 
  unidad: '', 
  area: '', 
  seccion: '', 
  centroCosto: '', 
  grupoPersonal: '', 
  areaPersonal: '', 
  jefeArea: '', 
  gerenteArea: '', 
  localidad: '' 
});

const API_URL = 'https://thcd001f002-backend.onrender.com';

export default function Index() {
  const { toast } = useToast();
  const { token, userRole } = useAuth();
  
  const [bulkRows, setBulkRows] = useState<BulkEntryRow[]>([createEmptyBulkRow()]);
  const [eventData, setEventData] = useState<EventData>(INITIAL_EVENT_DATA);
  const [drafts, setDrafts] = useState<CourseDraft[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  const [entryMode, setEntryMode] = useState<EntryMode>('bulk');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [sidebarView, setSidebarView] = useState<'drafts' | 'sessions'>('drafts');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const [dbReady, setDbReady] = useState(false);
  const [dbCount, setDbCount] = useState(0);
  const [savedSessionExists, setSavedSessionExists] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initApp = async () => {
        if (!token) return;
        try {
            const dbRes = await fetch(`${API_URL}/check-db-status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (dbRes.ok) {
                const dbData = await dbRes.json();
                setDbReady(dbData.ready);
                setDbCount(dbData.count);
            }

            const stateRes = await fetch(`${API_URL}/load-state`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (stateRes.ok) {
                const stateData = await stateRes.json();
                if (stateData) {
                    setSavedSessionExists(true);
                    localStorage.setItem('temp-restore-point', JSON.stringify(stateData));
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsInitialized(true);
        }
    };
    initApp();
  }, [token]);

  useEffect(() => {
    if (currentSessionId && isInitialized) {
        setSessions(prevSessions => prevSessions.map(session => {
            if (session.id === currentSessionId) {
                return {
                    ...session,
                    drafts: [...drafts],
                    fechaModificacion: new Date()
                };
            }
            return session;
        }));
    }
  }, [drafts, currentSessionId, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !token) return;

    const timer = setTimeout(async () => {
        const currentState = {
            entryMode, 
            cedula: '',
            validationStatus: 'idle',
            employeeData: {}, 
            eventData, 
            bulkRows, 
            drafts, 
            sessions, 
            currentSessionId
        };
        try {
            await fetch(`${API_URL}/save-state`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(currentState)
            });
        } catch (e) { console.error(e); }
    }, 2000);

    return () => clearTimeout(timer);
  }, [eventData, bulkRows, drafts, sessions, currentSessionId, entryMode, isInitialized, token]);

  const handleValidateBulk = async () => {
    if (!dbReady) return toast({ title: 'Base de datos vacía', description: 'Cargue los archivos maestros primero.', variant: 'destructive' });
    
    const validRows = bulkRows.filter(r => r.cedula.trim().length > 0);
    if (validRows.length === 0) return;
    
    setIsLoading(true);
    try {
        const formData = new FormData();
        formData.append('cedulas_json', JSON.stringify(validRows.map(r => r.cedula)));
        
        const res = await fetch(`${API_URL}/validate-cedula`, { 
            method: 'POST', 
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData 
        });
        if (!res.ok) throw new Error();
        
        const results = await res.json();
        const resultMap = new Map(results.map((r: any) => [r.cedula, r]));
        
        setBulkRows(prev => prev.map(row => {
            const res = resultMap.get(row.cedula);
            if (!res) return row;
            
            return res.found 
                ? { 
                    ...row, 
                    status: (res.source === 'headcount' ? 'found-headcount' : 'found-cesantes'), 
                    ...res.data,
                    centroCosto: res.data.centro_costo,
                    grupoPersonal: res.data.grupo_personal,
                    areaPersonal: res.data.area_personal,
                    jefeArea: res.data.jefe_area,
                    gerenteArea: res.data.gerente_area
                }
                : { ...row, status: 'not-found', nombres: '', apellidos: '', cargo: '' };
        }));
        toast({ title: 'Validación completada' });
    } catch { 
        toast({ title: 'Error', description: 'No se pudo validar.', variant: 'destructive' }); 
    } finally { 
        setIsLoading(false); 
    }
  };

  const handlePastedRows = (newRows: BulkEntryRow[]) => {
      setBulkRows(prev => {
          if (prev.length === 1 && !prev[0].cedula) {
              return [...newRows, createEmptyBulkRow()];
          }
          return [...prev, ...newRows, createEmptyBulkRow()];
      });
      setEntryMode('bulk'); 
      toast({ title: 'Datos importados', description: `Se añadieron ${newRows.length} registros a la tabla.` });
  };

  const handleFileUpload = async (file: File, source: 'headcount' | 'cesantes') => {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('source', source);
      
      try {
          const res = await fetch(`${API_URL}/upload-masters`, { 
              method: 'POST', 
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData 
          });
          if (!res.ok) throw new Error();
          
          const dbRes = await fetch(`${API_URL}/check-db-status`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          const dbData = await dbRes.json();
          setDbReady(dbData.ready);
          setDbCount(dbData.count);
          
          toast({ title: 'Archivo procesado', description: `Base de datos actualizada con ${source}.` });
      } catch (e) {
          toast({ title: 'Error al procesar', description: 'Verifique el formato del archivo o sus permisos.', variant: 'destructive' });
      } finally {
          setIsUploading(false);
      }
  };

  const handleRestore = () => {
      const saved = localStorage.getItem('temp-restore-point');
      if (saved) {
          try {
            const data = JSON.parse(saved);
            if (data.drafts) setDrafts(data.drafts);
            if (data.sessions) setSessions(data.sessions);
            
            if (data.eventData) {
                setEventData({
                    ...data.eventData,
                    fechaHoraInicio: data.eventData.fechaHoraInicio ? new Date(data.eventData.fechaHoraInicio) : undefined,
                    fechaHoraCierre: data.eventData.fechaHoraCierre ? new Date(data.eventData.fechaHoraCierre) : undefined
                });
            }
            if (data.bulkRows) setBulkRows(data.bulkRows);
            
            setSavedSessionExists(false);
            toast({ title: 'Datos restaurados exitosamente' });
          } catch(e) {
              toast({ title: 'Error', description: 'No se pudieron restaurar los datos.', variant: 'destructive' });
          }
      }
  };

  const handleNewCourse = () => {
    setIsLoading(false);
    setEventData(INITIAL_EVENT_DATA); 
    setBulkRows([createEmptyBulkRow()]); 
    setSelectedDraftId(null);
    toast({ title: 'Formulario limpiado' });
  };

  const handlePreSave = () => {
    const validRows = bulkRows.filter(r => r.status.includes('found'));
    
    if (validRows.length === 0 || !eventData.nombreCurso) {
        toast({ title: 'Datos incompletos', description: 'Ingrese un tema y valide al menos un participante.', variant: 'destructive' });
        return;
    }

    const newDraft: CourseDraft = {
        id: selectedDraftId || crypto.randomUUID(), 
        nombreCurso: eventData.nombreCurso,
        fechaCreacion: new Date(), 
        participantes: validRows.length,
        eventData: { ...eventData }, 
        entryMode: 'bulk', 
        bulkRows: [...bulkRows] 
    };

    setDrafts(prev => { 
        const idx = prev.findIndex(d => d.id === newDraft.id); 
        return idx >= 0 ? prev.map((d, i) => i === idx ? newDraft : d) : [...prev, newDraft]; 
    });
    
    toast({ title: selectedDraftId ? 'Curso Actualizado' : 'Curso Pre-guardado' });
    if (!selectedDraftId) handleNewCourse();
  };

  const handleSelectDraft = (id: string) => {
    const d = drafts.find(x => x.id === id);
    if(d) { 
        setSelectedDraftId(id); 
        setEventData(d.eventData); 
        if (d.entryMode === 'single' && d.cedula) {
             const newRow = createEmptyBulkRow();
             newRow.cedula = d.cedula;
             setBulkRows([newRow]);
        } else {
             setBulkRows(d.bulkRows || [createEmptyBulkRow()]); 
        }
    }
  };

  const handleDuplicateDraft = (id: string) => {
    const draft = drafts.find(d => d.id === id);
    if (!draft) return;
    
    const newDraft = {
        ...draft,
        id: crypto.randomUUID(),
        nombreCurso: `${draft.nombreCurso} (Copia)`,
        fechaCreacion: new Date()
    };
    
    setDrafts(prev => [...prev, newDraft]);
    toast({ title: 'Curso duplicado' });
  };

  const handleSaveNewSession = (nombre: string) => {
      try {
          const newSession: Session = {
              id: crypto.randomUUID(),
              nombre,
              fechaCreacion: new Date(),
              fechaModificacion: new Date(),
              drafts: [...drafts]
          };
          setSessions(prev => [...prev, newSession]);
          setCurrentSessionId(newSession.id);
          toast({ title: 'Sesión creada', description: `Trabajando en: ${nombre}` });
      } finally {
          setIsLoading(false);
      }
  };

  const handleLoadSession = (session: Session) => {
      if (drafts.length > 0 && !confirm("¿Cargar esta sesión reemplazará tu trabajo actual no guardado. Continuar?")) return;
      setIsLoading(true);
      try {
          setDrafts(session.drafts);
          setCurrentSessionId(session.id);
          setSidebarView('drafts');
          handleNewCourse(); 
          toast({ title: 'Sesión cargada' });
      } finally {
          setIsLoading(false);
      }
  };

  const handleDeleteSession = (id: string) => {
      if (!confirm("¿Eliminar sesión permanentemente?")) return;
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) setCurrentSessionId(null);
      toast({ title: 'Sesión eliminada' });
  };

  const handleManualSessionUpdate = () => {
      setIsLoading(false);
      toast({ title: 'Sesión guardada y actualizada' });
  };

  const handleSaveFinal = async () => {
      let allRegistros: any[] = [];
      
      const formatRow = (row: any, cedula: string, evtData: EventData) => ({
        "NOMBRE DEL CURSO": evtData.nombreCurso,
        "OBJETIVO": evtData.objetivo,
        "EMPRESA CAPACITADORA": evtData.empresa,
        "FACILITADOR": evtData.facilitador,
        "DIMENSIÓN DE EVENTO": evtData.dimensionEvento,
        "LUGAR DONDE SE DIO LA CAPACITACION": evtData.lugar,
        "MODALIDAD": evtData.modalidad,
        "FECHA INICIO": evtData.fechaHoraInicio ? format(new Date(evtData.fechaHoraInicio), 'dd/MM/yyyy') : '',
        "FECHA CIERRE": evtData.fechaHoraCierre ? format(new Date(evtData.fechaHoraCierre), 'dd/MM/yyyy') : '',
        "DURACION DE LA CAPACITACION (HORAS)": evtData.totalHoras,
        "TIPO EVENTO": evtData.tipoEvento,
        "MES-AÑO": evtData.mesAnio,
        "CÉDULA": cedula,
        "APELLIDOS Y NOMBRE DEL COLABORADOR": `${row.apellidos} ${row.nombres}`.trim(),
        "GÉNERO": row.genero,
        "CARGO": row.cargo,
        "UNIDAD": row.unidad,
        "ÁREA": row.area,
        "SECCIÓN": row.seccion,
        "CENTRO DE COSTO": row.centroCosto,
        "GRUPO DE PERSONAL": row.grupoPersonal,
        "ÁREA DE PERSONAL": row.areaPersonal,
        "JEFE DE ÁREA": row.jefeArea,
        "GERENTE DE AREA": row.gerenteArea,
        "LOCALIDAD": row.localidad,
      });

      drafts.forEach(draft => {
          if (draft.bulkRows) {
              draft.bulkRows.filter(r => r.status.includes('found')).forEach(row => {
                  allRegistros.push(formatRow(row, row.cedula, draft.eventData));
              });
          }
      });

      if (selectedDraftId === null) {
           bulkRows.filter(r => r.status.includes('found')).forEach(row => {
               allRegistros.push(formatRow(row, row.cedula, eventData));
           });
      }

      if (allRegistros.length === 0) {
          return toast({ title: 'Nada que exportar', description: 'No hay registros válidos en la lista.', variant: 'destructive' });
      }

      setIsLoading(true);
      try {
        const payload = {
            eventData: eventData,
            registros: allRegistros
        };

        const response = await fetch(`${API_URL}/export-excel`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error();

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `capacitacion_consolidado_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        toast({ title: 'Exportación Exitosa', description: 'Se ha descargado el archivo Excel y registrado la trazabilidad.' });

      } catch (error) { 
          toast({ title: 'Error', description: 'No se pudo descargar el archivo. Verifique el backend.', variant: 'destructive' }); 
      } finally { 
          setIsLoading(false); 
      }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <div className="flex flex-col bg-white border-r h-screen shadow-lg z-20">
         <div className="p-2 border-b bg-slate-100">
            <div className="flex bg-slate-200/50 p-1 rounded-lg">
                <button 
                    onClick={() => { setSidebarView('drafts'); setIsLoading(false); }} 
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${sidebarView === 'drafts' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <LibraryBig className="w-3.5 h-3.5" /> Borradores
                </button>
                <button 
                    onClick={() => { setSidebarView('sessions'); setIsLoading(false); }} 
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${sidebarView === 'sessions' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <FolderOpen className="w-3.5 h-3.5" /> Sesiones
                </button>
            </div>
        </div>
        <div className="flex-1 overflow-hidden">
            {sidebarView === 'drafts' ? (
                <CourseDraftsSidebar 
                    drafts={drafts} 
                    selectedDraftId={selectedDraftId} 
                    onSelectDraft={handleSelectDraft} 
                    onDeleteDraft={(id) => setDrafts(p => p.filter(x => x.id !== id))} 
                    onDuplicateDraft={handleDuplicateDraft} 
                    onNewCourse={handleNewCourse} 
                />
            ) : (
                <SessionsSidebar 
                    sessions={sessions} 
                    currentSessionId={currentSessionId} 
                    currentDrafts={drafts} 
                    onSaveSession={handleSaveNewSession} 
                    onLoadSession={handleLoadSession} 
                    onDeleteSession={handleDeleteSession} 
                    onUpdateSession={handleManualSessionUpdate} 
                />
            )}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {savedSessionExists && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
               <div className="flex gap-3 items-center text-amber-800">
                   <History className="w-5 h-5"/> 
                   <div>
                       <p className="font-bold text-sm">Sesión Anterior Encontrada</p>
                       <p className="text-xs">¿Deseas restaurar tu trabajo previo?</p>
                   </div>
               </div>
               <div className="flex gap-2">
                   <Button variant="ghost" size="sm" onClick={() => setSavedSessionExists(false)} className="text-amber-800">No</Button>
                   <Button variant="outline" size="sm" onClick={handleRestore} className="bg-white border-amber-300 text-amber-900">Sí, Restaurar</Button>
               </div>
            </div>
          )}

          {userRole === 'ADMIN' && (
            <div className="section-card">
               <div className="section-header rounded-t-xl flex justify-between">
                   <div className="flex gap-2 items-center"><FileUp className="w-5 h-5"/> Base de Datos de Empleados (Solo Admin)</div>
                   {dbReady && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">{dbCount} registros activos</span>}
               </div>
               <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                 {isUploading && (
                     <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center flex-col">
                         <Loader2 className="w-8 h-8 animate-spin text-blue-600"/>
                         <p className="text-sm font-semibold mt-2 text-blue-700">Procesando archivo...</p>
                     </div>
                 )}
                 <FileDropZone label="Headcount" fileName={null} onFileSelect={(f) => handleFileUpload(f, 'headcount')} disabled={isLoading || isUploading}/>
                 <FileDropZone label="Cesantes" fileName={null} onFileSelect={(f) => handleFileUpload(f, 'cesantes')} disabled={isLoading || isUploading}/>
               </div>
            </div>
          )}

          <div className="section-card">
             <div className="section-header rounded-t-xl justify-between">
                <div className="flex gap-2 items-center">Validación de Asistentes</div>
                <EntryModeToggle mode={entryMode} onModeChange={(m) => setEntryMode(m as any)}/>
             </div>
             <div className="p-6">
                {entryMode === 'paste' ? (
                    <PegadoEntryGrid onRowsGenerated={handlePastedRows} disabled={!dbReady || isLoading} />
                ) : (
                    <BulkEntryGrid rows={bulkRows} onRowsChange={setBulkRows} onValidateAll={handleValidateBulk} disabled={!dbReady || isLoading} />
                )}
                
                {!dbReady && (
                    <p className="text-xs text-red-500 mt-2 font-medium bg-red-50 p-2 rounded border border-red-100">
                        ⚠️ La base de datos está vacía. Contacte al administrador para cargar los archivos maestros.
                    </p>
                )}
             </div>
          </div>

          <EventDataSection 
            data={eventData} 
            onChange={(f, v) => setEventData(p => ({...p, [f]: v}))} 
            disabled={isLoading}
          />

          <div className="flex justify-end gap-3 pb-10 pt-4">
             <Button variant="outline" onClick={handleNewCourse} disabled={isLoading}>
                 <RotateCcw className="w-4 h-4 mr-2"/> Limpiar
             </Button>
             <Button variant="default" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handlePreSave} disabled={isLoading}>
                 <LibraryBig className="w-4 h-4 mr-2"/> {selectedDraftId ? "Actualizar" : "Pre-guardar"}
             </Button>
             <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSaveFinal} disabled={drafts.length === 0 || isLoading}>
                 <Save className="w-4 h-4 mr-2"/> Exportar Excel
             </Button>
          </div>
        </main>
      </div>
    </div>
  );
}