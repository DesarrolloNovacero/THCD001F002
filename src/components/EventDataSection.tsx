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

export interface EventData {
  nombreCurso: string;
  objetivo: string;
  empresa: string;
  facilitador: string;
  dimensionEvento: string;
  lugar: string;
  modalidad: string;
  fechaHoraInicio: Date | undefined;
  fechaHoraCierre: Date | undefined;
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

const OBJETIVOS = ['Capacitar', 'Difundir', 'Socializar', 'Desarrollo de competencias', 'Actualización técnica', 'Inducción', 'Certificación', 'Seguridad y salud'];
const DIMENSIONES = ['Seguridad y Salud Ocupacional', 'Calidad', 'Ambiente', 'Energia', 'Estrategica', 'Tecnica', 'Desarrollo', 'Liderazgo', 'Otros'];
const TIPOS_EVENTO = ['Charla', 'Curso/Taller', 'Entrenamiento Formativo', 'Induccion', 'Informacion (Reunion)'];
const LUGAR = ['Novacero Guayaquil', 'Novacero Quito', 'Novacero Lasso', 'Novacero Austro', 'Virtual', 'Externa'];
const FACILITADORES = ['Otro Facilitador'];

export function EventDataSection({ data, onChange, disabled }: EventDataSectionProps) {
  const { userLocation, token } = useAuth();
  const [empresas, setEmpresas] = useState<string[]>([]);

  useEffect(() => {
    if (token) {
      fetch('https://thcd001f002-backend.onrender.com/empresas', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setEmpresas(data.map((e: any) => e.nombre)))
        .catch(() => {});
    }
  }, [token]);

  const handleDateTimeChange = (field: 'fechaHoraInicio' | 'fechaHoraCierre', date: Date | undefined) => {
    if (!date) {
      onChange(field, undefined);
      return;
    }
    const currentValue = data[field];
    const hours = currentValue ? currentValue.getHours() : 0;
    const minutes = currentValue ? currentValue.getMinutes() : 0;
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    onChange(field, newDate);
  };

  return (
    <div className="section-card">
      <div className="section-header rounded-t-xl flex justify-between items-center">
        <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Datos del Evento de Capacitación</div>
      </div>
      
      <div className="p-6 space-y-6">

        {userLocation === 'Guayaquil' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Label className="field-label text-blue-800 mb-2">Asignación Especial de Sede (Exclusivo Guayaquil)</Label>
            <RadioGroup
              value={data.localidadCurso}
              onValueChange={(value) => onChange('localidadCurso', value)}
              disabled={disabled}
              className="flex gap-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Guayaquil" id="sede-gye" />
                <Label htmlFor="sede-gye" className="font-normal cursor-pointer">Registrar para Guayaquil</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Austro" id="sede-austro" />
                <Label htmlFor="sede-austro" className="font-normal cursor-pointer font-bold text-blue-700">Registrar para Austro</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <div>
           <Label className="field-label field-required">Tema</Label>
           <Input
             type="text"
             placeholder="Ingrese el tema o nombre del curso"
             value={data.nombreCurso}
             onChange={(e) => onChange('nombreCurso', e.target.value)}
             disabled={disabled}
             className={cn("h-10", !data.nombreCurso && "border-red-500 shadow-sm shadow-red-200")}
           />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          <div className={cn(!data.objetivo && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
            <Label className="field-label field-required px-1">Objetivo</Label>
            <Combobox options={OBJETIVOS} value={data.objetivo} onChange={(value) => { if (OBJETIVOS.includes(value) || value === '') onChange('objetivo', value); }} placeholder="Seleccionar objetivo" searchPlaceholder="Buscar..." disabled={disabled} />
          </div>
          
          <div className={cn(!data.empresa && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
            <Label className="field-label field-required px-1">Empresa Capacitadora</Label>
            <Combobox options={empresas} value={data.empresa} onChange={(value) => onChange('empresa', value)} placeholder="Seleccionar empresa" searchPlaceholder="Buscar empresa..." disabled={disabled} />
          </div>
          
          <div className={cn(!data.facilitador && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
            <Label className="field-label field-required px-1">Facilitador</Label>
            <Combobox options={FACILITADORES} value={data.facilitador} onChange={(value) => onChange('facilitador', value)} placeholder="Seleccionar facilitador" searchPlaceholder="Buscar facilitador..." disabled={disabled} />
          </div>
          
          <div className={cn(!data.dimensionEvento && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
            <Label className="field-label field-required px-1">Dimensión de Evento</Label>
            <Combobox options={DIMENSIONES} value={data.dimensionEvento} onChange={(value) => { if (DIMENSIONES.includes(value) || value === '') onChange('dimensionEvento', value); }} placeholder="Seleccionar dimensión" searchPlaceholder="Buscar dimensión..." disabled={disabled} />
          </div>
        </div>

        <div className={cn(!data.lugar && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
          <Label className="field-label field-required px-1">Lugar donde se dio la capacitación</Label>
          <Combobox options={LUGAR} value={data.lugar} onChange={(value) => { if (LUGAR.includes(value) || value === '') onChange('lugar', value); }} placeholder="Seleccionar lugar" searchPlaceholder="Buscar lugar..." disabled={disabled} />
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
                <Button variant="outline" disabled={disabled} className={cn("w-full h-10 justify-start text-left font-normal", !data.fechaHoraInicio && "text-muted-foreground border-red-500 shadow-sm shadow-red-200")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.fechaHoraInicio ? format(data.fechaHoraInicio, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <Calendar mode="single" selected={data.fechaHoraInicio} onSelect={(date) => handleDateTimeChange('fechaHoraInicio', date)} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Label className="field-label field-required">Fecha Cierre</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" disabled={disabled} className={cn("w-full h-10 justify-start text-left font-normal", !data.fechaHoraCierre && "text-muted-foreground border-red-500 shadow-sm shadow-red-200")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.fechaHoraCierre ? format(data.fechaHoraCierre, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <Calendar mode="single" selected={data.fechaHoraCierre} onSelect={(date) => handleDateTimeChange('fechaHoraCierre', date)} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="field-label field-required">Duración Total (Horas)</Label>
            <Input type="number" min="0" step="0.5" placeholder="Ej: 120" value={data.totalHoras} onChange={(e) => onChange('totalHoras', e.target.value)} disabled={disabled} className={cn("h-10", !data.totalHoras && "border-red-500 shadow-sm shadow-red-200")}/>
          </div>
          
          <div className={cn(!data.tipoEvento && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
            <Label className="field-label field-required px-1">Tipo Evento</Label>
            <Combobox options={TIPOS_EVENTO} value={data.tipoEvento} onChange={(value) => onChange('tipoEvento', value)} placeholder="Seleccionar tipo" searchPlaceholder="Buscar tipo..." disabled={disabled} />
          </div>
          
          <div>
            <Label className="field-label field-required">Mes-Año (Que termino la capacitacion)</Label>
            <Input type="month" value={data.mesAnio} onChange={(e) => onChange('mesAnio', e.target.value)} disabled={disabled} className={cn("h-10", !data.mesAnio && "border-red-500 shadow-sm shadow-red-200")}/>
          </div>
        </div>

      </div>
    </div>
  );
}