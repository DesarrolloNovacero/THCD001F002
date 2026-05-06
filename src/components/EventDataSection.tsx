import { useState, useEffect } from 'react';
import { BookOpen, Calendar as CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Combobox } from '@/components/ui/combobox';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '../contexts/AuthContext';

const OBJETIVOS = [
  'Capacitar', 
  'Difundir', 
  'Socializar', 
  'Desarrollo de competencias', 
  'Actualización técnica', 
  'Inducción', 
  'Certificación', 
  'Seguridad y salud'
];

const DIMENSIONES = [
  'Seguridad y Salud Ocupacional', 
  'Calidad', 
  'Ambiente', 
  'Energia', 
  'Estrategica', 
  'Tecnica', 
  'Desarrollo', 
  'Liderazgo', 
  'Otros'
];

const TIPOS_EVENTO = [
  'Charla', 
  'Curso/Taller', 
  'Entrenamiento Formativo', 
  'Induccion', 
  'Informacion (Reunion)'
];

const FACILITADORES = ['Otro Facilitador'];

export interface EventData {
  nombreCurso: string;
  objetivo: string;
  empresa: string;
  facilitador: string;
  dimensionEvento: string;
  lugar: string;
  modalidad: string;
  fechaHoraInicio: any; 
  fechaHoraCierre: any;
  totalHoras: string;
  tipoEvento: string;
  mesAnio: string;
  localidadCurso: string;
}

interface EventDataSectionProps {
  data: EventData;
  onChange: (field: keyof EventData, value: any) => void;
  disabled?: boolean;
}

export function EventDataSection({ data, onChange, disabled }: EventDataSectionProps) {
  const { token } = useAuth();
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [nombresCursos, setNombresCursos] = useState<string[]>([]);

  useEffect(() => {
    if (token) {
      fetch('https://thcd001f002-backend.onrender.com/empresas', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      })
        .then(res => res.json())
        .then(data => setEmpresas(data.map((e: any) => e.nombre)))
        .catch(() => {});

      fetch('https://thcd001f002-backend.onrender.com/nombres-cursos', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      })
        .then(res => res.json())
        .then(data => setNombresCursos(data.map((n: any) => n.nombre)))
        .catch(() => {});
    }
  }, [token]);

  const getValidDate = (val: any) => {
      if (!val) return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
  };

  const dateInicio = getValidDate(data.fechaHoraInicio);
  const dateCierre = getValidDate(data.fechaHoraCierre);

  const handleDateTimeChange = (field: 'fechaHoraInicio' | 'fechaHoraCierre', date: Date | undefined) => {
    if (!date) {
      onChange(field, undefined);
      return;
    }
    const currentObj = field === 'fechaHoraInicio' ? dateInicio : dateCierre;
    const hours = currentObj ? currentObj.getHours() : 0;
    const minutes = currentObj ? currentObj.getMinutes() : 0;
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    onChange(field, newDate.toISOString()); 
  };

  return (
    <div className="section-card">
      <div className="section-header rounded-t-xl">
        <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Datos del Evento de Capacitación</div>
      </div>
      
      <div className="p-6 space-y-6">
        <div>
           <Label className="field-label field-required px-1">Tema o Nombre del Curso</Label>
           <Combobox 
             options={nombresCursos} 
             value={data.nombreCurso} 
             onChange={(value) => onChange('nombreCurso', value)} 
             placeholder="Seleccionar o buscar curso" 
             disabled={disabled} 
           />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={cn(!data.objetivo && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
            <Label className="field-label field-required px-1">Objetivo</Label>
            <Combobox options={OBJETIVOS} value={data.objetivo} onChange={(value) => onChange('objetivo', value)} placeholder="Seleccionar objetivo" disabled={disabled} />
          </div>
          <div className={cn(!data.empresa && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
            <Label className="field-label field-required px-1">Empresa Capacitadora</Label>
            <Combobox options={empresas} value={data.empresa} onChange={(value) => onChange('empresa', value)} placeholder="Seleccionar empresa" disabled={disabled} />
          </div>
          <div className={cn(!data.facilitador && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
            <Label className="field-label field-required px-1">Facilitador</Label>
            <Combobox options={FACILITADORES} value={data.facilitador} onChange={(value) => onChange('facilitador', value)} placeholder="Seleccionar facilitador" disabled={disabled} />
          </div>
          <div className={cn(!data.dimensionEvento && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
            <Label className="field-label field-required px-1">Dimensión de Evento</Label>
            <Combobox options={DIMENSIONES} value={data.dimensionEvento} onChange={(value) => onChange('dimensionEvento', value)} placeholder="Seleccionar dimensión" disabled={disabled} />
          </div>
        </div>
        
        <div className={cn("p-2", !data.modalidad && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
          <Label className="field-label field-required">Modalidad</Label>
          <RadioGroup value={data.modalidad} onValueChange={(value) => onChange('modalidad', value)} disabled={disabled} className="flex gap-6 mt-2">
            <div className="flex items-center space-x-2"><RadioGroupItem value="Interna" id="Interna" /><Label htmlFor="Interna" className="font-normal cursor-pointer">Interna</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="Externa" id="Externa" /><Label htmlFor="Externa" className="font-normal cursor-pointer">Externa</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="In House" id="In House" /><Label htmlFor="In House" className="font-normal cursor-pointer">In House</Label></div>
          </RadioGroup>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="field-label field-required">Fecha Inicio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" disabled={disabled} className={cn("w-full h-10 justify-start text-left font-normal", !dateInicio && "border-red-500 shadow-sm shadow-red-200")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateInicio ? format(dateInicio, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <Calendar mode="single" selected={dateInicio} onSelect={(date) => handleDateTimeChange('fechaHoraInicio', date)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="field-label field-required">Fecha Cierre</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" disabled={disabled} className={cn("w-full h-10 justify-start text-left font-normal", !dateCierre && "border-red-500 shadow-sm shadow-red-200")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateCierre ? format(dateCierre, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <Calendar mode="single" selected={dateCierre} onSelect={(date) => handleDateTimeChange('fechaHoraCierre', date)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="field-label field-required">Duración Total (Horas)</Label>
            <Input type="number" step="0.5" placeholder="Ej: 8" value={data.totalHoras} onChange={(e) => onChange('totalHoras', e.target.value)} disabled={disabled} className={cn("h-10", !data.totalHoras && "border-red-500 shadow-sm shadow-red-200")}/>
          </div>
          <div className={cn(!data.tipoEvento && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
            <Label className="field-label field-required px-1">Tipo Evento</Label>
            <Combobox options={TIPOS_EVENTO} value={data.tipoEvento} onChange={(value) => onChange('tipoEvento', value)} placeholder="Seleccionar tipo" disabled={disabled} />
          </div>
          <div>
            <Label className="field-label field-required">Mes-Año de Cierre</Label>
            <Input type="month" value={data.mesAnio} onChange={(e) => onChange('mesAnio', e.target.value)} disabled={disabled} className={cn("h-10", !data.mesAnio && "border-red-500 shadow-sm shadow-red-200")}/>
          </div>
        </div>
      </div>
    </div>
  );
}