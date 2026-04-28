import { useState, useEffect } from 'react';
import { FileUp, RotateCcw, LibraryBig, FolderOpen, Loader2, Send, CheckCircle, Clock, XCircle, CalendarDays } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { FileDropZone } from '@/components/FileDropZone';
import { EventDataSection, EventData } from '@/components/EventDataSection';
import { BulkEntryGrid, BulkEntryRow } from '@/components/BulkEntryGrid';
import { PegadoEntryGrid } from '@/components/PegadoEntryGrid';
import { EntryModeToggle, EntryMode } from '@/components/EntryModeToggle';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { CourseDraftsSidebar, CourseDraft } from '@/components/CourseDraftsSidebar';
import { SessionsSidebar, Session } from '@/components/SessionsSidebar';
import { useAuth } from '../contexts/AuthContext';

const createEmptyBulkRow = (): BulkEntryRow => ({ id: crypto.randomUUID(), cedula: '', status: 'idle', nombres: '', apellidos: '', cargo: '', genero: '', unidad: '', area: '', seccion: '', centroCosto: '', grupoPersonal: '', areaPersonal: '', jefeArea: '', gerenteArea: '', localidad: '' });
const API_URL = 'https://thcd001f002-backend.onrender.com';

export default function Index() {
  const { toast } = useToast();
  const { token, userRole, userLocation } = useAuth();
  
  const INITIAL_EVENT_DATA: EventData = { nombreCurso: '', objetivo: '', empresa: '', facilitador: '', dimensionEvento: '', lugar: '', modalidad: '', fechaHoraInicio: undefined, fechaHoraCierre: undefined, totalHoras: '', tipoEvento: '', mesAnio: '', localidadCurso: userLocation || 'Quito' };

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
  const [mesCorte, setMesCorte] = useState<string>('');
  const [dbReady, setDbReady] = useState(false);
  const [dbCount, setDbCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchSync = async () => {
      if (!token) return;
      try {
          const res = await fetch(`${API_URL}/mis-eventos`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) {
              const dbEvents = await res.json();
              setDrafts(prev => prev.map(d => {
                  if (d.eventoId) {
                      const match = dbEvents.find((e: any) => e.id === d.eventoId);
                      if (match && (d.estado !== match.estado || d.comentario !== match.comentario)) return { ...d, estado: match.estado, comentario: match.comentario };
                  }
                  return d;
              }));
              setSessions(prev => prev.map(s => ({
                  ...s, drafts: s.drafts.map(d => {
                      if (d.eventoId) {
                          const match = dbEvents.find((e: any) => e.id === d.eventoId);
                          if (match && (d.estado !== match.estado || d.comentario !== match.comentario)) return { ...d, estado: match.estado, comentario: match.comentario };
                      }
                      return d;
                  })
              })));
          }
      } catch(e) {}
  };

  useEffect(() => {
    const initApp = async () => {
        if (!token) return;
        try {
            const dbRes = await fetch(`${API_URL}/check-db-status`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (dbRes.ok) {
                const dbData = await dbRes.json();
                setDbReady(dbData.ready);
                setDbCount(dbData.count);
            }
            const stateRes = await fetch(`${API_URL}/load-state`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (stateRes.ok) {
                const data = await stateRes.json();
                if (data) {
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
                    if (data.currentSessionId) setCurrentSessionId(data.currentSessionId);
                }
            }
        } catch (e) { } finally { setIsInitialized(true); }
    };
    initApp();
  }, [token]);

  useEffect(() => {
      if (isInitialized && token) {
          fetchSync();
          const interval = setInterval(fetchSync, 10000);
          return () => clearInterval(interval);
      }
  }, [isInitialized, token]);

  useEffect(() => {
    if (currentSessionId && isInitialized) {
        setSessions(prevSessions => prevSessions.map(session => {
            if (session.id === currentSessionId) return { ...session, drafts: [...drafts], fechaModificacion: new Date() };
            return session;
        }));
    }
  }, [drafts, currentSessionId, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !token) return;
    const timer = setTimeout(async () => {
        const currentState = { entryMode, cedula: '', validationStatus: 'idle', employeeData: {}, eventData, bulkRows, drafts, sessions, currentSessionId };
        try { await fetch(`${API_URL}/save-state`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(currentState) }); } catch (e) {}
    }, 2000);
    return () => clearTimeout(timer);
  }, [eventData, bulkRows, drafts, sessions, currentSessionId, entryMode, isInitialized, token]);

  const currentDraft = drafts.find(d => d.id === selectedDraftId);
  const isLocked = currentDraft?.estado === 'PENDIENTE' || currentDraft?.estado === 'APROBADO';
  const isFormDisabled = isLoading || isLocked;

  const handleValidateBulk = async () => {
    if (!dbReady) return toast({ title: 'Base de datos vacía', description: 'Contacte al administrador.', variant: 'destructive' });
    const validRows = bulkRows.filter(r => r.cedula.trim().length > 0);
    if (validRows.length === 0) return;
    
    setIsLoading(true);
    try {
        const formData = new FormData();
        formData.append('cedulas_json', JSON.stringify(validRows.map(r => r.cedula)));
        const res = await fetch(`${API_URL}/validate-cedula`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
        if (!res.ok) throw new Error();
        
        const results = await res.json();
        const resultMap = new Map(results.map((r: any) => [r.cedula, r]));
        setBulkRows(prev => prev.map(row => {
            const res = resultMap.get(row.cedula);
            if (!res) return row;
            return res.found ? { ...row, status: (res.source === 'headcount' ? 'found-headcount' : 'found-cesantes'), ...res.data, centroCosto: res.data.centro_costo, grupoPersonal: res.data.grupo_personal, areaPersonal: res.data.area_personal, jefeArea: res.data.jefe_area, gerenteArea: res.data.gerente_area } : { ...row, status: 'not-found', nombres: '', apellidos: '', cargo: '' };
        }));
        toast({ title: 'Validación completada' });
    } catch { toast({ title: 'Error', description: 'No se pudo validar.', variant: 'destructive' }); } finally { setIsLoading(false); }
  };

  const handlePastedRows = (newRows: BulkEntryRow[]) => {
      setBulkRows(prev => {
          if (prev.length === 1 && !prev[0].cedula) return [...newRows, createEmptyBulkRow()];
          return [...prev, ...newRows, createEmptyBulkRow()];
      });
      setEntryMode('bulk'); toast({ title: 'Datos importados', description: `Se añadieron ${newRows.length} registros a la tabla.` });
  };

  const handleFileUpload = async (file: File) => {
      if(!mesCorte) return toast({ title: 'Falta el Mes de Corte', description: 'Selecciona un mes para crear el Snapshot de métricas antes de subir el archivo.', variant: 'destructive' });
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('source', 'maestro');
      formData.append('mes_corte', mesCorte);
      try {
          const res = await fetch(`${API_URL}/upload-masters`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
          if (!res.ok) throw new Error();
          const dbRes = await fetch(`${API_URL}/check-db-status`, { headers: { 'Authorization': `Bearer ${token}` } });
          const dbData = await dbRes.json();
          setDbReady(dbData.ready);
          setDbCount(dbData.count);
          toast({ title: 'Archivo procesado', description: `Base de datos unificada y métricas de ${mesCorte} guardadas.` });
      } catch (e) { toast({ title: 'Error al procesar', description: 'Verifique el formato del archivo.', variant: 'destructive' }); } finally { setIsUploading(false); }
  };

  const handleNewCourse = () => {
    setIsLoading(false);
    setEventData(INITIAL_EVENT_DATA); 
    setBulkRows([createEmptyBulkRow()]); 
    setSelectedDraftId(null);
  };

  const handlePreSave = () => {
    const validRows = bulkRows.filter(r => r.status.includes('found'));
    if (validRows.length === 0 || !eventData.nombreCurso) return toast({ title: 'Datos incompletos', description: 'Ingrese un tema y valide al menos un participante.', variant: 'destructive' });
    const newDraft: CourseDraft = { id: selectedDraftId || crypto.randomUUID(), nombreCurso: eventData.nombreCurso, fechaCreacion: new Date(), participantes: validRows.length, eventData: { ...eventData }, entryMode: 'bulk', bulkRows: [...bulkRows], estado: currentDraft?.estado === 'RECHAZADO' ? 'BORRADOR' : currentDraft?.estado, eventoId: currentDraft?.eventoId };
    setDrafts(prev => { const idx = prev.findIndex(d => d.id === newDraft.id); return idx >= 0 ? prev.map((d, i) => i === idx ? newDraft : d) : [...prev, newDraft]; });
    toast({ title: selectedDraftId ? 'Curso Actualizado' : 'Curso Pre-guardado' });
    if (!selectedDraftId) handleNewCourse();
  };

  const handleSelectDraft = (id: string) => {
    const d = drafts.find(x => x.id === id);
    if(d) { setSelectedDraftId(id); setEventData(d.eventData); setBulkRows(d.bulkRows || [createEmptyBulkRow()]); }
  };

  const handleDuplicateDraft = (id: string) => {
    const draft = drafts.find(d => d.id === id);
    if (!draft) return;
    const newDraft = { ...draft, id: crypto.randomUUID(), nombreCurso: `${draft.nombreCurso} (Copia)`, fechaCreacion: new Date(), estado: 'BORRADOR' as any, eventoId: undefined, comentario: '' };
    setDrafts(prev => [...prev, newDraft]);
    toast({ title: 'Curso duplicado' });
  };

  const handleSaveNewSession = (nombre: string) => {
      try {
          const newSession: Session = { id: crypto.randomUUID(), nombre, fechaCreacion: new Date(), fechaModificacion: new Date(), drafts: [...drafts] };
          setSessions(prev => [...prev, newSession]);
          setCurrentSessionId(newSession.id);
          toast({ title: 'Bitácora creada', description: `Trabajando en: ${nombre}` });
      } finally { setIsLoading(false); }
  };

  const handleLoadSession = (session: Session) => {
      setIsLoading(true);
      try {
          setDrafts(session.drafts);
          setCurrentSessionId(session.id);
          setSidebarView('drafts');
          handleNewCourse(); 
          toast({ title: 'Bitácora cargada' });
      } finally { setIsLoading(false); }
  };

  const handleDeleteSession = (id: string) => {
      if (!confirm("¿Eliminar bitácora permanentemente?")) return;
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) setCurrentSessionId(null);
      toast({ title: 'Bitácora eliminada' });
  };

  const handleManualSessionUpdate = () => { setIsLoading(false); toast({ title: 'Bitácora actualizada' }); };

  const handleEnviarRevision = async () => {
      let allRegistros: any[] = [];
      const formatRow = (row: any, cedula: string) => ({ "CÉDULA": cedula, "APELLIDOS Y NOMBRE DEL COLABORADOR": `${row.apellidos} ${row.nombres}`.trim() });
      bulkRows.filter(r => r.status.includes('found')).forEach(row => { allRegistros.push(formatRow(row, row.cedula)); });

      if (allRegistros.length === 0) return toast({ title: 'Datos incompletos', description: 'Valide al menos un colaborador antes de enviar.', variant: 'destructive' });

      let draftIdToUpdate = selectedDraftId;
      let targetDraft = drafts.find(d => d.id === selectedDraftId);
      
      if (!draftIdToUpdate || !targetDraft) {
          draftIdToUpdate = crypto.randomUUID();
          targetDraft = { id: draftIdToUpdate, nombreCurso: eventData.nombreCurso, fechaCreacion: new Date(), participantes: allRegistros.length, eventData: { ...eventData }, entryMode: 'bulk', bulkRows: [...bulkRows] };
          setDrafts(prev => [...prev, targetDraft!]);
          setSelectedDraftId(draftIdToUpdate);
      }

      setIsLoading(true);
      try {
        const payload = { eventData: eventData, registros: allRegistros, eventoId: targetDraft.eventoId || null };
        const response = await fetch(`${API_URL}/enviar-revision`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error();
        const resData = await response.json();
        setDrafts(prev => prev.map(d => d.id === draftIdToUpdate ? { ...d, eventoId: resData.evento_id, estado: 'PENDIENTE', comentario: '' } : d));
        toast({ title: '¡Enviado a Revisión!', description: 'El administrador auditará los datos pronto.' });
      } catch (error) { toast({ title: 'Error', description: 'No se pudo enviar al servidor.', variant: 'destructive' }); } finally { setIsLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <div className="flex flex-col bg-white border-r h-screen shadow-lg z-20">
         <div className="p-2 border-b bg-slate-100">
            <div className="flex bg-slate-200/50 p-1 rounded-lg">
                <button onClick={() => { setSidebarView('drafts'); setIsLoading(false); }} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${sidebarView === 'drafts' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'}`}> <LibraryBig className="w-3.5 h-3.5" /> Borradores </button>
                <button onClick={() => { setSidebarView('sessions'); setIsLoading(false); }} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${sidebarView === 'sessions' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}> <FolderOpen className="w-3.5 h-3.5" /> Bitácoras </button>
            </div>
        </div>
        <div className="flex-1 overflow-hidden">
            {sidebarView === 'drafts' ? ( <CourseDraftsSidebar drafts={drafts} selectedDraftId={selectedDraftId} onSelectDraft={handleSelectDraft} onDeleteDraft={(id) => setDrafts(p => p.filter(x => x.id !== id))} onDuplicateDraft={handleDuplicateDraft} onNewCourse={handleNewCourse} /> ) : ( <SessionsSidebar sessions={sessions} currentSessionId={currentSessionId} currentDrafts={drafts} onSaveSession={handleSaveNewSession} onLoadSession={handleLoadSession} onDeleteSession={handleDeleteSession} onUpdateSession={handleManualSessionUpdate} /> )}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {isLocked && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${currentDraft.estado === 'APROBADO' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
                {currentDraft.estado === 'APROBADO' ? <CheckCircle className="w-6 h-6"/> : <Clock className="w-6 h-6"/>}
                <div><p className="font-bold">Este curso está {currentDraft.estado}</p><p className="text-sm">No puedes editar los datos mientras se encuentre en este estado.</p></div>
            </div>
          )}

          {currentDraft?.estado === 'RECHAZADO' && (
            <div className="p-4 rounded-lg flex items-start gap-3 bg-red-50 border border-red-200 text-red-800">
                <XCircle className="w-6 h-6 shrink-0"/>
                <div><p className="font-bold">Curso Rechazado</p><p className="text-sm font-medium italic">"{currentDraft.comentario}"</p><p className="text-xs mt-2">Corrige los datos y vuelve a enviarlo a revisión.</p></div>
            </div>
          )}

          {userRole === 'ADMIN' && (
            <div className="section-card">
               <div className="section-header rounded-t-xl flex justify-between">
                   <div className="flex gap-2 items-center"><FileUp className="w-5 h-5"/> Carga de Datos Maestros (Solo Admin)</div>
                   {dbReady && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">{dbCount} registros activos</span>}
               </div>
               <div className="p-6 relative">
                 {isUploading && (
                     <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center flex-col"><Loader2 className="w-8 h-8 animate-spin text-blue-600"/><p className="text-sm font-semibold mt-2 text-blue-700">Procesando archivo y calculando métricas...</p></div>
                 )}
                 <div className="mb-4">
                     <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><CalendarDays className="w-4 h-4"/> 1. Selecciona el Mes de Corte (Snapshot de Activos)</label>
                     <Input type="month" value={mesCorte} onChange={e => setMesCorte(e.target.value)} className="w-64" disabled={isFormDisabled || isUploading} />
                     <p className="text-xs text-slate-500 mt-1">Este mes se usará como denominador para calcular el KPI de Personal Capacitado.</p>
                 </div>
                 <div className="mt-6 border-t pt-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2">2. Arrastra el Maestro de Empleados</label>
                    <FileDropZone label="Maestro Único (Activos y Cesantes)" fileName={null} onFileSelect={(f) => handleFileUpload(f)} disabled={isFormDisabled || isUploading || !mesCorte}/>
                 </div>
               </div>
            </div>
          )}

          <div className="section-card">
             <div className="section-header rounded-t-xl justify-between"><div className="flex gap-2 items-center">Validación de Asistentes</div><EntryModeToggle mode={entryMode} onModeChange={(m) => setEntryMode(m as any)}/></div>
             <div className="p-6">
                {entryMode === 'paste' ? ( <PegadoEntryGrid onRowsGenerated={handlePastedRows} disabled={!dbReady || isFormDisabled} /> ) : ( <BulkEntryGrid rows={bulkRows} onRowsChange={setBulkRows} onValidateAll={handleValidateBulk} disabled={!dbReady || isFormDisabled} /> )}
                {!dbReady && ( <p className="text-xs text-red-500 mt-2 font-medium bg-red-50 p-2 rounded border border-red-100">La base de datos está vacía. Contacte al administrador.</p> )}
             </div>
          </div>

          <EventDataSection data={eventData} onChange={(f, v) => setEventData(p => ({...p, [f]: v}))} disabled={isFormDisabled} />

          <div className="flex justify-end gap-3 pb-10 pt-4">
             <Button variant="outline" onClick={handleNewCourse} disabled={isLoading}><RotateCcw className="w-4 h-4 mr-2"/> Limpiar</Button>
             <Button variant="default" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handlePreSave} disabled={isFormDisabled}><LibraryBig className="w-4 h-4 mr-2"/> {selectedDraftId ? "Actualizar Local" : "Pre-guardar"}</Button>
             <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20" onClick={handleEnviarRevision} disabled={isFormDisabled}><Send className="w-4 h-4 mr-2"/> Enviar a Revisión</Button>
          </div>
        </main>
      </div>
    </div>
  );
}