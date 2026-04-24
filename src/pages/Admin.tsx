import { useState, useEffect, useMemo } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle, XCircle, Download, Clock, MessageSquareX, LayoutDashboard, ClipboardCheck, Users, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface EventoAdmin {
  id: string;
  codigo: string;
  nombre: string;
  estado: string;
  creador: string;
  fecha: string;
}

const COLORS = ['#003f5c', '#ffc107', '#4b4b4b', '#009688', '#2196f3', '#f44336', '#9c27b0'];

export default function Admin() {
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'auditoria' | 'dashboard'>('dashboard');
  
  const [eventos, setEventos] = useState<EventoAdmin[]>([]);
  const [isLoadingEventos, setIsLoadingEventos] = useState(false);
  const [rechazoId, setRechazoId] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');

  const [mesDashboard, setMesDashboard] = useState<string>(new Date().toISOString().slice(0, 7));
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const fetchEventos = async () => {
    setIsLoadingEventos(true);
    try {
      const res = await fetch('https://thcd001f002-backend.onrender.com/admin/eventos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setEventos(await res.json());
    } finally {
      setIsLoadingEventos(false);
    }
  };

  const fetchDashboard = async () => {
    if (!mesDashboard) return;
    setIsLoadingDashboard(true);
    try {
      const res = await fetch(`https://thcd001f002-backend.onrender.com/dashboard/metricas?mes=${mesDashboard}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setDashboardData(await res.json());
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (token && activeTab === 'auditoria') fetchEventos();
    if (token && activeTab === 'dashboard') fetchDashboard();
  }, [token, activeTab, mesDashboard]);

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

  const gruposUnicos = useMemo(() => {
    if (!dashboardData?.graficos?.dimension_grupo) return [];
    const grupos = new Set<string>();
    dashboardData.graficos.dimension_grupo.forEach((item: any) => {
      Object.keys(item).forEach(k => {
        if (k !== 'dimension') grupos.add(k);
      });
    });
    return Array.from(grupos);
  }, [dashboardData]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-6">
        
        <div className="flex gap-2 mb-6">
          <Button 
            variant={activeTab === 'dashboard' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('dashboard')}
            className={activeTab === 'dashboard' ? 'bg-slate-800' : 'bg-white text-slate-600'}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard de Métricas
          </Button>
          <Button 
            variant={activeTab === 'auditoria' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('auditoria')}
            className={activeTab === 'auditoria' ? 'bg-slate-800' : 'bg-white text-slate-600'}
          >
            <ClipboardCheck className="w-4 h-4 mr-2" /> Auditoría de Cursos
          </Button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div className="font-bold text-slate-700">Filtro de Análisis:</div>
              <Input 
                type="month" 
                value={mesDashboard} 
                onChange={(e) => setMesDashboard(e.target.value)} 
                className="w-48 font-bold"
              />
              <span className="text-xs text-slate-400 ml-auto">Los datos se calculan en base a los cursos Aprobados del mes seleccionado.</span>
            </div>

            {isLoadingDashboard ? (
              <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
            ) : !dashboardData || dashboardData.kpis.total_cursos === 0 ? (
              <div className="bg-white p-10 rounded-xl shadow-sm border text-center">
                <LayoutDashboard className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No hay datos aprobados para el mes seleccionado.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                    <p className="text-4xl font-black text-slate-800">{dashboardData.kpis.total_colaboradores}</p>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Colaboradores</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                    <p className="text-4xl font-black text-slate-800">{dashboardData.kpis.total_horas}</p>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Horas</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                    <p className="text-4xl font-black text-slate-800">{dashboardData.kpis.horas_promedio}</p>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Horas Promedio</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                    <p className="text-4xl font-black text-slate-800">{dashboardData.kpis.total_cursos}</p>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Cursos</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
                    <h3 className="font-bold text-slate-700 mb-4">Modalidad de los Cursos por Horas</h3>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={dashboardData.graficos.modalidad} innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                            {dashboardData.graficos.modalidad.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value} Horas`} />
                          <Legend verticalAlign="middle" align="right" layout="vertical" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4">Horas Por Género</h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={dashboardData.graficos.genero} innerRadius={50} outerRadius={80} dataKey="value">
                            {dashboardData.graficos.genero.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.name.includes('FEMENINO') ? '#ffc107' : '#003f5c'} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value} Horas`} />
                          <Legend verticalAlign="middle" align="right" layout="vertical" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4">Dimensión de Evento por Grupo de Personal (Horas)</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashboardData.graficos.dimension_grupo} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="dimension" tick={{fontSize: 10}} interval={0} />
                          <YAxis tick={{fontSize: 10}} />
                          <Tooltip />
                          <Legend wrapperStyle={{fontSize: '10px'}} />
                          {gruposUnicos.map((grp, idx) => (
                            <Bar key={grp} dataKey={grp} stackId="a" fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-[300px] flex flex-col">
                      <h3 className="font-bold text-slate-700 mb-4">Horas por Unidad de Negocio</h3>
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardData.graficos.unidad_negocio} margin={{ top: 20, right: 0, left: -20, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{fontSize: 8}} angle={-45} textAnchor="end" interval={0} />
                            <YAxis tick={{fontSize: 10}} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#003f5c" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-[250px]">
                    <h3 className="font-bold text-slate-700 mb-4">Horas por Localidad</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.graficos.localidad} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{fontSize: 10}} />
                        <YAxis dataKey="name" type="category" tick={{fontSize: 10}} width={80} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#ffc107" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
                    <h3 className="font-bold text-slate-700 mb-4 absolute top-4 left-4">Personal Capacitado</h3>
                    <div className="w-48 h-24 relative mt-8">
                      <div className="absolute inset-0 border-[24px] border-slate-100 rounded-t-full border-b-0"></div>
                      <div 
                        className="absolute inset-0 border-[24px] border-[#ffc107] rounded-t-full border-b-0 origin-bottom transition-transform duration-1000 ease-out"
                        style={{ transform: `rotate(${((dashboardData.kpis.personal_capacitado_pct / 100) * 180) - 180}deg)` }}
                      ></div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 bg-white px-4">
                        <p className="text-3xl font-black text-slate-800">{dashboardData.kpis.personal_capacitado_pct}%</p>
                      </div>
                    </div>
                    <div className="flex justify-between w-full mt-8 px-12 text-xs font-bold text-slate-400">
                      <span>0.00%</span>
                      <span>100.00%</span>
                    </div>
                  </div>
                </div>

              </>
            )}
          </div>
        )}

        {activeTab === 'auditoria' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-emerald-600" />
              Auditoría de Cursos
            </h2>
            
            {isLoadingEventos ? (
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
        )}

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