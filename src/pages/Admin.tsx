import { useState, useEffect, useMemo } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { 
  Loader2, CheckCircle, XCircle, Download, Clock, MessageSquareX, 
  LayoutDashboard, ClipboardCheck, FileSpreadsheet, 
  TrendingUp, TrendingDown, Minus, Calendar, ChevronLeft, ChevronRight,
  Undo2, ListFilter
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LabelList 
} from 'recharts';

interface EventoAdmin { id: string; codigo: string; nombre: string; estado: string; creador: string; fecha: string; }

const BLUE_MAIN = '#004D7C';
const YELLOW_MAIN = '#FDD900';
const GRAY_MAIN = '#4E4B4A';
const COLORS_STACK = [BLUE_MAIN, YELLOW_MAIN, '#0092C0', GRAY_MAIN, '#F2A900', '#8F939C'];

const formatNum = (val: number | string) => {
  const n = Number(val);
  if (isNaN(n)) return val;
  if (n % 1 !== 0) return new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
  return new Intl.NumberFormat('en-US').format(n);
};

const WrappedTick = (props: any) => {
  const { x, y, payload } = props;
  const words = payload.value.split(' ');
  const firstLine = words.slice(0, Math.ceil(words.length / 2)).join(' ');
  const secondLine = words.slice(Math.ceil(words.length / 2)).join(' ');

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill="#475569" fontSize={9} fontWeight={600}>
        <tspan x={0} dy="0">{firstLine}</tspan>
        {secondLine && <tspan x={0} dy="12">{secondLine}</tspan>}
      </text>
    </g>
  );
};

const KpiCard = ({ title, value, trend, isPercent = false, isTrendPercent = true }: { title: string, value: number, trend?: number, isPercent?: boolean, isTrendPercent?: boolean }) => {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-full">
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{title}</div>
      <div className="text-3xl font-black text-[#004D7C] tracking-tight">
        {formatNum(value)}{isPercent ? '%' : ''}
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          <div className={`flex items-center justify-center p-1 rounded-full ${isPositive ? 'bg-emerald-100' : isNegative ? 'bg-red-100' : 'bg-slate-100'}`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : isNegative ? <TrendingDown className="w-3.5 h-3.5 text-red-600" /> : <Minus className="w-3.5 h-3.5 text-slate-400" />}
          </div>
          <span className={`text-[11px] font-bold ${isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-500'}`}>
            {isPositive ? '+' : ''}{formatNum(trend)}{isTrendPercent ? '%' : ''} vs anterior
          </span>
        </div>
      )}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700">
        <p className="font-bold mb-2 border-b border-slate-700 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 py-0.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="font-medium">{entry.name}:</span>
            <span className="font-bold ml-auto">{formatNum(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.65;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  const pctText = `${(percent * 100).toFixed(0)}%`;
  const valText = String(formatNum(value));
  const maxChars = Math.max(pctText.length, valText.length);
  const rectWidth = maxChars * 6 + 16;
  const rectHeight = 28;

  return (
    <g>
      <rect x={x - rectWidth / 2} y={y - rectHeight / 2} width={rectWidth} height={rectHeight} fill="rgba(255,255,255,0.9)" rx="4" stroke="#e2e8f0" strokeWidth="1" />
      <text x={x} y={y - 4} fill="#0f172a" fontSize="10" fontWeight="bold" textAnchor="middle" dominantBaseline="central">
        {pctText}
        <tspan x={x} y={y + 8} fontSize="9" fill="#475569">{valText}</tspan>
      </text>
    </g>
  );
};

const CustomLabelWithBg = (props: any) => {
  const { x, y, width, height, value, position, isPercent } = props;
  if (!value || value === 0) return null;
  
  const formattedValue = isPercent ? `${Number(value).toFixed(0)}%` : formatNum(value);
  if (isPercent && Number(value) <= 5) return null;

  const charCount = String(formattedValue).length;
  const rectWidth = charCount * 6 + 12;
  const rectHeight = 18;
  
  let cx = 0, cy = 0;
  
  if (position === 'top') {
    cx = x + width / 2;
    cy = y - rectHeight / 2 - 2;
  } else if (position === 'right') {
    cx = x + width + rectWidth / 2 + 4;
    cy = y + height / 2;
  } else if (position === 'inside') {
    cx = x + width / 2;
    cy = y + height / 2;
  }

  return (
    <g>
      <rect x={cx - rectWidth / 2} y={cy - rectHeight / 2} width={rectWidth} height={rectHeight} fill="rgba(255,255,255,0.95)" rx="4" stroke="#e2e8f0" strokeWidth="1" />
      <text x={cx} y={cy + 1} fill="#0f172a" fontSize="9" fontWeight="bold" textAnchor="middle" dominantBaseline="central">
        {formattedValue}
      </text>
    </g>
  );
};

export default function Admin() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'auditoria' | 'dashboard'>('dashboard');
  const [eventos, setEventos] = useState<EventoAdmin[]>([]);
  const [rechazoId, setRechazoId] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');
  
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>(new Date().toISOString().slice(0, 7));
  const [vistaDashboard, setVistaDashboard] = useState<'MENSUAL' | 'ANUAL'>('MENSUAL');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('TODOS');
  
  // NUEVO ESTADO: Filtro para la tabla de Auditoría
  const [filtroEstadoAuditoria, setFiltroEstadoAuditoria] = useState<string>('TODOS');
  
  const [openCalendar, setOpenCalendar] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  useEffect(() => {
    const parts = periodoSeleccionado.split('-');
    if (parts.length === 2) setCurrentDate(new Date(Number(parts[0]), Number(parts[1]) - 1));
    else setCurrentDate(new Date(Number(parts[0]), 0));
  }, [periodoSeleccionado]);

  const changeMonth = (dir: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const changeYear = (dir: number) => {
    const d = new Date(currentDate);
    d.setFullYear(d.getFullYear() + dir);
    setCurrentDate(d);
  };

  const selectMonth = (m: number) => {
    const y = currentDate.getFullYear();
    setPeriodoSeleccionado(`${y}-${String(m+1).padStart(2,'0')}`);
    setOpenCalendar(false);
  };

  const selectYear = (y: number) => {
    setPeriodoSeleccionado(String(y));
    setOpenCalendar(false);
  };

  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  const fetchDashboard = async () => {
    setIsLoadingDashboard(true);
    try {
      const res = await fetch(`https://thcd001f002-backend.onrender.com/dashboard/metricas?mes=${periodoSeleccionado}&vista=${vistaDashboard}&estado=${estadoFiltro}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setDashboardData(await res.json());
    } finally { setIsLoadingDashboard(false); }
  };

  const fetchEventos = async () => {
    try {
      const res = await fetch('https://thcd001f002-backend.onrender.com/admin/eventos', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setEventos(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    if (token && activeTab === 'dashboard') fetchDashboard();
    if (token && activeTab === 'auditoria') fetchEventos();
  }, [token, activeTab, periodoSeleccionado, vistaDashboard, estadoFiltro]);

  const handleDescargarExcel = async () => {
    try {
      const res = await fetch(`https://thcd001f002-backend.onrender.com/dashboard/exportar?mes=${periodoSeleccionado}&vista=${vistaDashboard}&estado=${estadoFiltro}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Reporte_${vistaDashboard}_${periodoSeleccionado}.xlsx`; a.click();
    } catch (e) { toast({ title: 'Error al exportar Excel', variant: 'destructive' }); }
  };

  const handleAprobar = async (id: string) => {
    if (!confirm('¿Aprobar curso?')) return;
    try {
      const res = await fetch(`https://thcd001f002-backend.onrender.com/admin/eventos/${id}/aprobar`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { toast({ title: 'Aprobado' }); fetchEventos(); }
    } catch (e) {}
  };

  const handleRechazar = async () => {
    if (!comentario.trim()) return;
    try {
      const res = await fetch(`https://thcd001f002-backend.onrender.com/admin/eventos/${rechazoId}/rechazar`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ comentario }) });
      if (res.ok) { toast({ title: 'Rechazado' }); setRechazoId(null); setComentario(''); fetchEventos(); }
    } catch (e) {}
  };

  const handleRevertir = async (id: string) => {
    if (!confirm('¿Seguro que deseas revertir la aprobación? El curso volverá a estar pendiente.')) return;
    try {
      const res = await fetch(`https://thcd001f002-backend.onrender.com/admin/eventos/${id}/revertir`, { 
        method: 'PUT', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        toast({ title: 'Aprobación revertida', description: 'El curso ahora aparece como Pendiente.' });
        fetchEventos();
      }
    } catch (e) {
      toast({ title: 'Error al revertir', variant: 'destructive' });
    }
  };

  const handleExportarAuditoria = async (id: string, codigo: string) => {
    try {
      const res = await fetch(`https://thcd001f002-backend.onrender.com/admin/eventos/${id}/exportar`, { headers: { 'Authorization': `Bearer ${token}` } });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `auditoria_${codigo}.xlsx`; a.click();
    } catch (e) {}
  };

  const procesarDatosOrdenados = (datos: any[]) => {
    if (!datos) return [];
    return [...datos].sort((a, b) => b.value - a.value);
  };

  const cleanLabel = (name: string) => {
    return name.replace(/(planta|oficina)\s+/gi, '').trim().toUpperCase();
  };

  const fusionarYLimpiarDatos = (datos: any[]) => {
    if (!datos) return [];
    const merged: Record<string, number> = {};
    datos.forEach(item => {
      const cleanName = cleanLabel(item.name);
      merged[cleanName] = (merged[cleanName] || 0) + item.value;
    });
    return Object.entries(merged).map(([name, value]) => ({ name, value }));
  };

  const procesarDimension100 = useMemo(() => {
    if (!dashboardData?.graficos?.dimension_grupo) return { data: [], llaves: [] };
    const datos = dashboardData.graficos.dimension_grupo;
    const llavesUnicas = new Set<string>();
    datos.forEach((item: any) => {
      Object.keys(item).forEach(k => { if (k !== 'dimension') llavesUnicas.add(k); });
    });
    const datos100 = datos.map((item: any) => {
      let total = 0;
      Array.from(llavesUnicas).forEach(k => { total += (item[k] || 0); });
      const nuevoItem: any = { dimension: item.dimension };
      Array.from(llavesUnicas).forEach(k => {
        nuevoItem[k] = total > 0 ? Number(((item[k] || 0) / total * 100).toFixed(1)) : 0;
      });
      return nuevoItem;
    });
    return { data: datos100, llaves: Array.from(llavesUnicas) };
  }, [dashboardData]);

  // LÓGICA DE FILTRADO PARA LA TABLA DE AUDITORÍA
  const eventosFiltrados = useMemo(() => {
    if (filtroEstadoAuditoria === 'TODOS') return eventos;
    return eventos.filter(e => e.estado === filtroEstadoAuditoria);
  }, [eventos, filtroEstadoAuditoria]);

  const datosModalidad = procesarDatosOrdenados(fusionarYLimpiarDatos(dashboardData?.graficos?.modalidad));
  const datosGenero = procesarDatosOrdenados(fusionarYLimpiarDatos(dashboardData?.graficos?.genero));
  const datosUnidad = procesarDatosOrdenados(fusionarYLimpiarDatos(dashboardData?.graficos?.unidad_negocio));
  const datosLocalidad = procesarDatosOrdenados(fusionarYLimpiarDatos(dashboardData?.graficos?.localidad));

  const renderCalendar = () => (
    <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl p-4 z-50 w-64">
      <div className="flex justify-between items-center mb-3 text-slate-800">
        <button onClick={() => vistaDashboard === 'MENSUAL' ? changeMonth(-1) : changeYear(-1)} className="p-1 hover:bg-slate-100 rounded transition-colors">
          <ChevronLeft className="w-4 h-4"/>
        </button>
        <span className="font-bold text-sm">
          {vistaDashboard === 'MENSUAL' ? `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}` : currentDate.getFullYear()}
        </span>
        <button onClick={() => vistaDashboard === 'MENSUAL' ? changeMonth(1) : changeYear(1)} className="p-1 hover:bg-slate-100 rounded transition-colors">
          <ChevronRight className="w-4 h-4"/>
        </button>
      </div>
      {vistaDashboard === 'MENSUAL' ? (
        <div className="grid grid-cols-4 gap-2">
          {months.map((m, i) => (
            <button key={i} onClick={() => selectMonth(i)} className="text-xs p-2 rounded hover:bg-[#004D7C] hover:text-white font-bold text-slate-600 transition-colors">{m}</button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({length:9}).map((_,i)=>{
            const y = currentDate.getFullYear() - 4 + i;
            return (
              <button key={y} onClick={()=>selectYear(y)} className="text-xs p-2 rounded hover:bg-[#004D7C] hover:text-white font-bold text-slate-600 transition-colors">{y}</button>
            )
          })}
        </div>
      )}
    </div>
  );

  const renderFiltros = () => (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
          <button onClick={() => setVistaDashboard('MENSUAL')} className={`px-4 py-1.5 text-xs font-bold rounded shadow-sm transition-all ${vistaDashboard === 'MENSUAL' ? 'bg-white text-[#004D7C]' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}>Mensual</button>
          <button onClick={() => setVistaDashboard('ANUAL')} className={`px-4 py-1.5 text-xs font-bold rounded shadow-sm transition-all ${vistaDashboard === 'ANUAL' ? 'bg-white text-[#004D7C]' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}>Anual</button>
        </div>
        <div className="relative">
          <div onClick={() => setOpenCalendar(!openCalendar)} className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-4 h-[36px] shadow-sm hover:bg-slate-50 transition-colors cursor-pointer group">
            <Calendar className="w-4 h-4 text-slate-500 group-hover:text-[#004D7C] transition-colors" />
            <span className="text-sm font-bold text-[#004D7C] tracking-wide">
              {vistaDashboard === 'MENSUAL' ? periodoSeleccionado : periodoSeleccionado.slice(0,4)}
            </span>
          </div>
          {openCalendar && renderCalendar()}
        </div>
        <div className="flex border border-slate-200 rounded-md overflow-hidden h-[36px]">
          {['ACTIVO', 'CESADO', 'TODOS'].map(estado => (
            <button key={estado} onClick={() => setEstadoFiltro(estado)} className={`px-4 py-1 text-[11px] font-bold border-r border-slate-200 last:border-0 transition-colors ${estadoFiltro === estado ? 'bg-[#004D7C] text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>{estado}</button>
          ))}
        </div>
      </div>
      <Button onClick={handleDescargarExcel} variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-bold gap-2 h-9 px-4">
        <FileSpreadsheet className="w-4 h-4" /> Exportar Data
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <AppHeader />
      <main className="flex-1 w-full px-4 lg:px-8 py-6 max-w-[1600px] mx-auto">
        <div className="flex gap-2 mb-6">
          <Button variant={activeTab === 'dashboard' ? 'default' : 'outline'} onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'bg-[#004D7C] text-white hover:bg-[#004D7C]/90' : 'bg-white text-slate-600'}><LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard Analítico</Button>
          <Button variant={activeTab === 'auditoria' ? 'default' : 'outline'} onClick={() => setActiveTab('auditoria')} className={activeTab === 'auditoria' ? 'bg-[#004D7C] text-white hover:bg-[#004D7C]/90' : 'bg-white text-slate-600'}><ClipboardCheck className="w-4 h-4 mr-2" /> Auditoría Operativa</Button>
        </div>

        {activeTab === 'dashboard' && (
          <>
            {renderFiltros()}
            {isLoadingDashboard ? ( 
              <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-10 h-10 animate-spin text-[#004D7C]" /></div> 
            ) : !dashboardData || dashboardData.kpis.total_cursos === 0 ? (
              <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center"><LayoutDashboard className="w-16 h-16 text-slate-200 mx-auto mb-4" /><h3 className="text-lg font-bold text-slate-700">Sin datos registrados</h3><p className="text-slate-500 text-sm">No hay métricas disponibles para la combinación de filtros seleccionada.</p></div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <KpiCard title="Total Colaboradores" value={dashboardData.kpis.total_colaboradores} />
                  <KpiCard title="Horas Totales" value={dashboardData.kpis.total_horas} trend={dashboardData.tendencias.diferencia_horas} isTrendPercent={false} />
                  <KpiCard title="Horas Promedio" value={dashboardData.kpis.horas_promedio} />
                  <KpiCard title="Cursos Realizados" value={dashboardData.kpis.total_cursos} />
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center relative h-full">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider absolute top-5 left-5">Personal Capacitado</p>
                    <div className="w-[160px] h-[80px] relative mt-4">
                      <ResponsiveContainer width="100%" height="200%">
                        <PieChart>
                          <Pie data={[{value: dashboardData.kpis.personal_capacitado_pct}, {value: 100 - dashboardData.kpis.personal_capacitado_pct}]} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                            <Cell fill="#004D7C" /><Cell fill="#E2E8F0" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute top-[45px] left-1/2 -translate-x-1/2 text-center">
                        <p className="text-3xl font-black text-[#004D7C] leading-none">{dashboardData.kpis.personal_capacitado_pct.toFixed(1)}%</p>
                      </div>
                    </div>
                    {dashboardData.tendencias.diferencia_pct !== undefined && (
                      <div className="flex items-center gap-1 mt-2">
                        {dashboardData.tendencias.diferencia_pct > 0 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : dashboardData.tendencias.diferencia_pct < 0 ? <TrendingDown className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3 text-slate-300" />}
                        <span className={`text-[10px] font-bold ${dashboardData.tendencias.diferencia_pct > 0 ? 'text-emerald-600' : dashboardData.tendencias.diferencia_pct < 0 ? 'text-red-600' : 'text-slate-400'}`}>{dashboardData.tendencias.diferencia_pct > 0 ? '+' : ''}{dashboardData.tendencias.diferencia_pct.toFixed(1)}% vs anterior</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 lg:col-span-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-[380px] flex flex-col">
                    <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide mb-4 border-b border-slate-100 pb-2">Modalidad de los Cursos por Horas</h3>
                    <div className="flex-1 min-h-0 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={datosModalidad} innerRadius="45%" outerRadius="75%" paddingAngle={2} dataKey="value" labelLine={false} label={CustomPieLabel}>
                            {datosModalidad.map((_: any, idx: number) => <Cell key={idx} fill={COLORS_STACK[idx % COLORS_STACK.length]} />)}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-[380px] flex flex-col">
                    <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide mb-4 border-b border-slate-100 pb-2">Horas por Género</h3>
                    <div className="flex-1 min-h-0 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={datosGenero} innerRadius="45%" outerRadius="75%" paddingAngle={2} dataKey="value" labelLine={false} label={CustomPieLabel}>
                            {datosGenero.map((e: any) => <Cell key={e.name} fill={e.name.includes('FEMENINO') ? YELLOW_MAIN : BLUE_MAIN} />)}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-[380px] flex flex-col">
                    <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide mb-4 border-b border-slate-100 pb-2">Horas por Localidad</h3>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosLocalidad} layout="vertical" margin={{ top: 0, right: 45, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                          <YAxis dataKey="name" type="category" tick={{fontSize: 9, fill: '#475569', fontWeight: 600}} width={80} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                            {datosLocalidad.map((_: any, idx: number) => <Cell key={idx} fill={COLORS_STACK[(idx+1) % COLORS_STACK.length]} />)}
                            <LabelList dataKey="value" content={(props: any) => <CustomLabelWithBg {...props} position="right" />} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 lg:col-span-7 bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
                    <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide mb-4 border-b border-slate-100 pb-2">Horas por Unidad de Negocio</h3>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosUnidad} margin={{ top: 20, right: 0, left: -20, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" interval={0} tick={<WrappedTick />} axisLine={false} tickLine={false} height={50} />
                          <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                            {datosUnidad.map((_: any, idx: number) => <Cell key={idx} fill={COLORS_STACK[idx % COLORS_STACK.length]} />)}
                            <LabelList dataKey="value" content={(props: any) => <CustomLabelWithBg {...props} position="top" />} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-5 bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
                    <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide mb-4 border-b border-slate-100 pb-2">Dimension de Evento por Grupo de Personal</h3>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={procesarDimension100.data} margin={{ top: 20, right: 0, left: -20, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="dimension" interval={0} tick={<WrappedTick />} axisLine={false} tickLine={false} height={50} />
                          <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                          <Legend wrapperStyle={{fontSize: '10px', paddingTop: '20px'}} />
                          {procesarDimension100.llaves.map((llave, idx) => (
                            <Bar key={llave} dataKey={llave} stackId="1" fill={COLORS_STACK[idx % COLORS_STACK.length]}>
                              <LabelList dataKey={llave} content={(props: any) => <CustomLabelWithBg {...props} position="inside" isPercent={true} />} />
                            </Bar>
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'auditoria' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-[#004D7C] uppercase tracking-wide flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" /> Auditoría Operativa
              </h2>
              
              {/* FILTROS DE ESTADO PARA AUDITORÍA */}
              <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 px-2 border-r border-slate-200 mr-1">
                  <ListFilter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Filtrar Estado:</span>
                </div>
                <div className="flex gap-1">
                  {['TODOS', 'PENDIENTE', 'APROBADO', 'RECHAZADO'].map(estado => (
                    <button 
                      key={estado} 
                      onClick={() => setFiltroEstadoAuditoria(estado)} 
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        filtroEstadoAuditoria === estado 
                        ? 'bg-[#004D7C] text-white shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {estado}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                  <tr><th className="py-4 px-4">Código</th><th className="py-4 px-4">Curso</th><th className="py-4 px-4">Creador por</th><th className="py-4 px-4">Fecha</th><th className="py-4 px-4">Estado</th><th className="py-4 px-4 text-right">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {eventosFiltrados.length > 0 ? eventosFiltrados.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-500">{e.codigo}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{e.nombre}</td>
                      <td className="py-3 px-4 text-slate-600">{e.creador}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(e.fecha).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        {e.estado === 'PENDIENTE' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold"><Clock className="w-3 h-3"/> PENDIENTE</span>}
                        {e.estado === 'APROBADO' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold"><CheckCircle className="w-3 h-3"/> APROBADO</span>}
                        {e.estado === 'RECHAZADO' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 text-red-800 text-[11px] font-bold"><XCircle className="w-3 h-3"/> RECHAZADO</span>}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleExportarAuditoria(e.id, e.codigo)} className="text-slate-600 hover:text-[#004D7C] hover:bg-slate-100 h-8 w-8 p-0"><Download className="w-4 h-4" /></Button>
                        
                        {e.estado === 'APROBADO' && (
                          <button onClick={() => handleRevertir(e.id)} className="inline-flex items-center justify-center border border-amber-200 bg-white text-amber-600 hover:bg-amber-50 rounded-md h-8 w-8 transition-colors" title="Revertir a Pendiente">
                            <Undo2 className="w-4 h-4" />
                          </button>
                        )}

                        {e.estado === 'PENDIENTE' && ( 
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleAprobar(e.id)} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-8 w-8 p-0"><CheckCircle className="w-4 h-4" /></Button>
                            <Button variant="outline" size="sm" onClick={() => setRechazoId(e.id)} className="text-red-600 border-red-200 hover:bg-red-50 h-8 w-8 p-0"><XCircle className="w-4 h-4" /></Button>
                          </> 
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium bg-slate-50/50">
                        No hay cursos con el estado "{filtroEstadoAuditoria}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {rechazoId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-slate-200">
            <h3 className="font-black text-lg mb-4 flex items-center gap-2 text-slate-800"><MessageSquareX className="w-5 h-5 text-red-600"/> Motivo de Rechazo</h3>
            <textarea className="w-full border border-slate-300 rounded-lg p-3 text-sm min-h-[120px] mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" placeholder="Detalla las razones del rechazo..." value={comentario} onChange={e => setComentario(e.target.value)} />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setRechazoId(null); setComentario(''); }} className="font-bold">Cancelar</Button>
              <Button onClick={handleRechazar} className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-200" disabled={!comentario.trim()}>Rechazar Evento</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}