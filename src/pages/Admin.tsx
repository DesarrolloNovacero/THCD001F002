import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle, XCircle, Download, Clock, MessageSquareX } from 'lucide-react';

interface EventoAdmin {
  id: string;
  codigo: string;
  nombre: string;
  estado: string;
  creador: string;
  fecha: string;
}

export default function Admin() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [eventos, setEventos] = useState<EventoAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rechazoId, setRechazoId] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');

  const fetchEventos = async () => {
    try {
      const res = await fetch('https://thcd001f002-backend.onrender.com/admin/eventos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setEventos(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchEventos();
  }, [token]);

  const handleAprobar = async (id: string) => {
    if (!confirm('¿Estás seguro de aprobar este curso?')) return;
    try {
      const res = await fetch(`https://thcd001f002-backend.onrender.com/admin/eventos/${id}/aprobar`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: 'Curso aprobado exitosamente' });
        fetchEventos();
      }
    } catch (e) {
      toast({ title: 'Error al aprobar', variant: 'destructive' });
    }
  };

  const handleRechazar = async () => {
    if (!comentario.trim()) return;
    try {
      const res = await fetch(`https://thcd001f002-backend.onrender.com/admin/eventos/${rechazoId}/rechazar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ comentario })
      });
      if (res.ok) {
        toast({ title: 'Curso rechazado' });
        setRechazoId(null);
        setComentario('');
        fetchEventos();
      }
    } catch (e) {
      toast({ title: 'Error al rechazar', variant: 'destructive' });
    }
  };

  const handleExportar = async (id: string, codigo: string) => {
    try {
      const res = await fetch(`https://thcd001f002-backend.onrender.com/admin/eventos/${id}/exportar`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria_${codigo}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: 'Error al descargar Excel', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            Auditoría de Cursos Pendientes
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Curso</th>
                    <th className="py-3 px-4">Creador por</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {eventos.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{e.codigo}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{e.nombre}</td>
                      <td className="py-3 px-4 text-slate-600">{e.creador}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(e.fecha).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        {e.estado === 'PENDIENTE' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold"><Clock className="w-3 h-3"/> Pendiente</span>}
                        {e.estado === 'APROBADO' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold"><CheckCircle className="w-3 h-3"/> Aprobado</span>}
                        {e.estado === 'RECHAZADO' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold"><XCircle className="w-3 h-3"/> Rechazado</span>}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleExportar(e.id, e.codigo)} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                          <Download className="w-4 h-4" />
                        </Button>
                        {e.estado === 'PENDIENTE' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleAprobar(e.id)} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setRechazoId(e.id)} className="text-red-600 border-red-200 hover:bg-red-50">
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {rechazoId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><MessageSquareX className="w-5 h-5 text-red-600"/> Motivo de Rechazo</h3>
            <textarea 
              className="w-full border rounded-lg p-3 text-sm min-h-[100px] mb-4" 
              placeholder="Explica detalladamente qué debe corregir el usuario..."
              value={comentario}
              onChange={e => setComentario(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setRechazoId(null); setComentario(''); }}>Cancelar</Button>
              <Button onClick={handleRechazar} className="bg-red-600 hover:bg-red-700 text-white" disabled={!comentario.trim()}>Rechazar Curso</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}