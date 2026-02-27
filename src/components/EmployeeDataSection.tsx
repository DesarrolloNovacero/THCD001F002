import { User } from 'lucide-react';
import { ReadOnlyField } from './ReadOnlyField';

interface EmployeeData {
  apellidos: string;
  nombres: string;
  cargo: string;
  genero: string;
  unidad: string;
  area: string;
  seccion: string;
  centroCosto: string;
  grupoPersonal: string;
  areaPersonal: string;
  jefeArea: string;
  gerenteArea: string;
  localidad: string;
}

interface EmployeeDataSectionProps {
  data: EmployeeData;
}

export function EmployeeDataSection({ data }: EmployeeDataSectionProps) {
  return (
    <div className="section-card">
      <div className="section-header rounded-t-xl">
        <User className="w-5 h-5 text-primary" />
        Datos del Colaborador
        <span className="text-xs font-normal text-muted-foreground ml-2">(Solo lectura)</span>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ReadOnlyField label="Apellidos" value={data.apellidos} />
          <ReadOnlyField label="Nombres" value={data.nombres} />
          <ReadOnlyField label="Cargo" value={data.cargo} />
          <ReadOnlyField label="Género" value={data.genero} />
          <ReadOnlyField label="Unidad" value={data.unidad} />
          <ReadOnlyField label="Área" value={data.area} />
          <ReadOnlyField label="Sección" value={data.seccion} />
          <ReadOnlyField label="Centro de Costo" value={data.centroCosto} />
          <ReadOnlyField label="Grupo de Personal" value={data.grupoPersonal} />
          <ReadOnlyField label="Área de Personal" value={data.areaPersonal} />
          <ReadOnlyField label="Jefe de Área" value={data.jefeArea} />
          <ReadOnlyField label="Gerente de Área" value={data.gerenteArea} />
          <ReadOnlyField label="Localidad" value={data.localidad} />
        </div>
      </div>
    </div>
  );
}
