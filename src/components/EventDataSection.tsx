import { BookOpen, Calendar as CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Combobox } from '@/components/ui/combobox';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
}

interface EventDataSectionProps {
  data: EventData;
  onChange: (field: keyof EventData, value: any) => void;
  disabled?: boolean;
}

const OBJETIVOS = [
  'Capacitar', 'Difundir', 'Socializar', 'Desarrollo de competencias',
  'Actualización técnica', 'Inducción', 'Certificación', 'Seguridad y salud',
];

const DIMENSIONES = [
  'Seguridad y Salud Ocupacional', 'Calidad', 'Ambiente', 'Energia',
  'Estrategica', 'Tecnica', 'Desarrollo', 'Liderazgo', 'Otros',
];

const TIPOS_EVENTO = [
  'Charla', 'Curso/Taller', 'Entrenamiento Formativo', 'Induccion', 'Informacion (Reunion)',
];

const LUGAR = [
  'Novacero Guayaquil', 'Novacero Quito', 'Novacero Lasso', 'Novacero Austro', 'Virtual', 'Externa',
];

const EMPRESAS = [
    'ACADEMICOS CAPACITACIONES INTEGRALES', 'ADGHE', 'AM TEAM', 'AMI', 'ASOCIACION CRISTIANA DE EMPRESARIOS',
    'ASOCIACION DE GESTIÓN HUMANA DEL ECUADOR', 'AXIGMA', 'BANCO BOLIVARIANO', 'BKB', 'BOLSA DE VALORES DE QUITO',
    'BOMBEROS LATACUNGA', 'CAMARA DE COMERCIO DE GUAYAQUIL', 'CASA DE RULIMAN', 'COMAST', 'CONDUESPOL',
    'CONSULT LATIN AMERICAN', 'COPROSUPER', 'CUERPO DE BOMBEROS DE QUITO', 'ECOTEC', 'EKOS', 'ELSA',
    'ESCUELA DE DIRECTORES', 'ESMADI', 'ESPOL', 'FABRICA HARRIS', 'FAINCA', 'FEDESOMEC', 'FEDIMETAL',
    'GALA ACADEMY', 'GEINSOTEC', 'GREEN LIGHT', 'GRUPO CRG', 'HERRAIND', 'HIVIMAR - SKF', 'IDE', 'IESS',
    'ILUM', 'INEN', 'JAB BOXING', 'JUNTA DE BENEFICIENCIA', 'KUDERT', 'LARCOTRONIC', 'LATIN AMERICAN SAFETY INSTITUTE',
    'LEON CABLES', 'LIDERAZGO, CAPACITACION Y CONSULTORIA', 'LINDE', 'MEDEXPERT', 'METALLON', 'METRORED',
    'MFDS INDUSTRIAL', 'MINISTERIO DE EDUCACION', 'MINISTERIO DE ENERGIA Y MINAS', 'MULTIAPOYO', 'NEUMAC',
    'NOVACERO', 'PECS', 'POLICIA ANTINARCOTICOS', 'POMPIER', 'PRECISION', 'PRESTO', 'SAE', 'SAP',
    'SEALCO-COLOMBIA', 'SERVICA', 'SGS', 'TBL', 'TECOI', 'THE BOTTOM LINE', 'TIMKEN', 'TRAINING & CONSULTING',
    'TRIBU', 'UNASE', 'YPSILOM'
];

const FACILITADORES = ['Otro Facilitador'];

export function EventDataSection({ data, onChange, disabled }: EventDataSectionProps) {
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
      <div className="section-header rounded-t-xl">
        <BookOpen className="w-5 h-5 text-primary" />
        Datos del Evento de Capacitación
      </div>
      
      <div className="p-6 space-y-6">
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
            <Combobox
              options={OBJETIVOS}
              value={data.objetivo}
              onChange={(value) => { if (OBJETIVOS.includes(value) || value === '') onChange('objetivo', value); }}
              placeholder="Seleccionar objetivo"
              searchPlaceholder="Buscar objetivo..."
              disabled={disabled}
            />
          </div>
          
          <div className={cn(!data.empresa && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
            <Label className="field-label field-required px-1">Empresa Capacitadora</Label>
            <Combobox
              options={EMPRESAS}
              value={data.empresa}
              onChange={(value) => onChange('empresa', value)}
              placeholder="Seleccionar empresa"
              searchPlaceholder="Buscar empresa..."
              disabled={disabled}
            />
          </div>
          
          <div className={cn(!data.facilitador && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
            <Label className="field-label field-required px-1">Facilitador</Label>
            <Combobox
              options={FACILITADORES}
              value={data.facilitador}
              onChange={(value) => onChange('facilitador', value)}
              placeholder="Seleccionar facilitador"
              searchPlaceholder="Buscar facilitador..."
              disabled={disabled}
            />
          </div>
          
          <div className={cn(!data.dimensionEvento && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
            <Label className="field-label field-required px-1">Dimensión de Evento</Label>
            <Combobox
              options={DIMENSIONES}
              value={data.dimensionEvento}
              onChange={(value) => { if (DIMENSIONES.includes(value) || value === '') onChange('dimensionEvento', value); }}
              placeholder="Seleccionar dimensión"
              searchPlaceholder="Buscar dimensión..."
              disabled={disabled}
            />
          </div>
        </div>

        <div className={cn(!data.lugar && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
          <Label className="field-label field-required px-1">Lugar donde se dio la capacitación</Label>
          <Combobox
              options={LUGAR}
              value={data.lugar}
              onChange={(value) => { if (LUGAR.includes(value) || value === '') onChange('lugar', value); }}
              placeholder="Seleccionar lugar"
              searchPlaceholder="Buscar lugar..."
              disabled={disabled}
            />
        </div>
        
        <div className={cn("p-2", !data.modalidad && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
          <Label className="field-label field-required">Modalidad</Label>
          <RadioGroup
            value={data.modalidad}
            onValueChange={(value) => onChange('modalidad', value)}
            disabled={disabled}
            className="flex gap-6 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Interna" id="Interna" />
              <Label htmlFor="Interna" className="font-normal cursor-pointer">Interna</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Externa" id="Externa" />
              <Label htmlFor="Externa" className="font-normal cursor-pointer">Externa</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="In House" id="In House" />
              <Label htmlFor="In House" className="font-normal cursor-pointer">In House</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="field-label field-required">Fecha Inicio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={disabled}
                  className={cn("w-full h-10 justify-start text-left font-normal", !data.fechaHoraInicio && "text-muted-foreground border-red-500 shadow-sm shadow-red-200")}
                >
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
                <Button
                  variant="outline"
                  disabled={disabled}
                  className={cn("w-full h-10 justify-start text-left font-normal", !data.fechaHoraCierre && "text-muted-foreground border-red-500 shadow-sm shadow-red-200")}
                >
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
            <Input
              type="number"
              min="0"
              step="0.5"
              placeholder="Ej: 120"
              value={data.totalHoras}
              onChange={(e) => onChange('totalHoras', e.target.value)}
              disabled={disabled}
              className={cn("h-10", !data.totalHoras && "border-red-500 shadow-sm shadow-red-200")}
            />
          </div>
          
          <div className={cn(!data.tipoEvento && "rounded-md border border-red-500 shadow-sm shadow-red-200")}>
            <Label className="field-label field-required px-1">Tipo Evento</Label>
            <Combobox
              options={TIPOS_EVENTO}
              value={data.tipoEvento}
              onChange={(value) => onChange('tipoEvento', value)}
              placeholder="Seleccionar tipo"
              searchPlaceholder="Buscar tipo..."
              disabled={disabled}
            />
          </div>
          
          <div>
            <Label className="field-label field-required">Mes-Año (Que termino la capacitacion)</Label>
            <Input
              type="month"
              value={data.mesAnio}
              onChange={(e) => onChange('mesAnio', e.target.value)}
              disabled={disabled}
              className={cn("h-10", !data.mesAnio && "border-red-500 shadow-sm shadow-red-200")}
            />
          </div>
        </div>

      </div>
    </div>
  );
}