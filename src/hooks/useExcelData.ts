import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

export interface EmployeeRecord {
  cedula: string;
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
  source: 'headcount' | 'cesantes';
}

export interface ParsedExcelData {
  headcount: Map<string, EmployeeRecord>;
  cesantes: Map<string, EmployeeRecord>;
}

const normalizeColumnName = (name: string): string => {
  return name.toUpperCase().trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const mapColumnToField = (columnName: string): keyof EmployeeRecord | null => {
  const normalized = normalizeColumnName(columnName);
  
  const mappings: Record<string, keyof EmployeeRecord> = {
    'CEDULA': 'cedula',
    'APELLIDOS Y NOMBRE DEL COLABORADOR': 'apellidos',
    'CARGO': 'cargo',
    'GENERO': 'genero',
    'UNIDAD': 'unidad',
    'AREA': 'area',
    'SECCION': 'seccion',
    'CENTRO DE COSTO': 'centroCosto',
    'GRUPO DE PERSONAL': 'grupoPersonal',
    'AREA DE PERSONAL': 'areaPersonal',
    'JEFE DE AREA': 'jefeArea',
    'GERENTE DE AREA': 'gerenteArea',
  };

  for (const [key, value] of Object.entries(mappings)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return null;
};

const parseEmployeeName = (fullName: string): { apellidos: string; nombres: string } => {
  // Formato esperado: "APELLIDO1 APELLIDO2 NOMBRE1 NOMBRE2"
  const parts = fullName.trim().split(' ');
  if (parts.length >= 3) {
    // Asumimos 2 apellidos y el resto son nombres
    return {
      apellidos: `${parts[0]} ${parts[1]}`,
      nombres: parts.slice(2).join(' ')
    };
  }
  return { apellidos: fullName, nombres: '' };
};

export function useExcelData() {
  const [data, setData] = useState<ParsedExcelData>({
    headcount: new Map(),
    cesantes: new Map()
  });
  const [isLoading, setIsLoading] = useState(false);

  const parseExcelFile = useCallback(async (
    file: File,
    source: 'headcount' | 'cesantes'
  ): Promise<Map<string, EmployeeRecord>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet);
          
          const employeeMap = new Map<string, EmployeeRecord>();
          
          for (const row of jsonData) {
            const record: Partial<EmployeeRecord> = { source };
            let cedulaValue = '';
            
            for (const [column, value] of Object.entries(row)) {
              const field = mapColumnToField(column);
              if (field && value) {
                if (field === 'cedula') {
                  cedulaValue = String(value).trim();
                  record.cedula = cedulaValue;
                } else if (field === 'apellidos') {
                  // El campo contiene "APELLIDOS Y NOMBRE"
                  const parsed = parseEmployeeName(String(value));
                  record.apellidos = parsed.apellidos;
                  record.nombres = parsed.nombres;
                } else {
                  (record as any)[field] = String(value).trim();
                }
              }
            }
            
            if (cedulaValue) {
              employeeMap.set(cedulaValue, {
                cedula: cedulaValue,
                apellidos: record.apellidos || '',
                nombres: record.nombres || '',
                cargo: record.cargo || '',
                genero: record.genero || '',
                unidad: record.unidad || '',
                area: record.area || '',
                seccion: record.seccion || '',
                centroCosto: record.centroCosto || '',
                grupoPersonal: record.grupoPersonal || '',
                areaPersonal: record.areaPersonal || '',
                jefeArea: record.jefeArea || '',
                gerenteArea: record.gerenteArea || '',
                localidad: '',
                source
              });
            }
          }
          
          resolve(employeeMap);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const loadHeadcountFile = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const headcountData = await parseExcelFile(file, 'headcount');
      setData(prev => ({ ...prev, headcount: headcountData }));
      return headcountData.size;
    } finally {
      setIsLoading(false);
    }
  }, [parseExcelFile]);

  const loadCesantesFile = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const cesantesData = await parseExcelFile(file, 'cesantes');
      setData(prev => ({ ...prev, cesantes: cesantesData }));
      return cesantesData.size;
    } finally {
      setIsLoading(false);
    }
  }, [parseExcelFile]);

  const findEmployee = useCallback((cedula: string): { employee: EmployeeRecord | null; source: 'headcount' | 'cesantes' | null } => {
    const headcountEmployee = data.headcount.get(cedula);
    if (headcountEmployee) {
      return { employee: headcountEmployee, source: 'headcount' };
    }
    
    const cesantesEmployee = data.cesantes.get(cedula);
    if (cesantesEmployee) {
      return { employee: cesantesEmployee, source: 'cesantes' };
    }
    
    return { employee: null, source: null };
  }, [data]);

  const getAllSuggestions = useCallback((): Array<{ cedula: string; nombre: string; source: 'headcount' | 'cesantes' }> => {
    const suggestions: Array<{ cedula: string; nombre: string; source: 'headcount' | 'cesantes' }> = [];
    
    data.headcount.forEach((emp) => {
      suggestions.push({
        cedula: emp.cedula,
        nombre: `${emp.nombres} ${emp.apellidos}`,
        source: 'headcount'
      });
    });
    
    data.cesantes.forEach((emp) => {
      if (!data.headcount.has(emp.cedula)) {
        suggestions.push({
          cedula: emp.cedula,
          nombre: `${emp.nombres} ${emp.apellidos}`,
          source: 'cesantes'
        });
      }
    });
    
    return suggestions;
  }, [data]);

  const clearData = useCallback(() => {
    setData({ headcount: new Map(), cesantes: new Map() });
  }, []);

  return {
    data,
    isLoading,
    loadHeadcountFile,
    loadCesantesFile,
    findEmployee,
    getAllSuggestions,
    clearData,
    totalRecords: data.headcount.size + data.cesantes.size
  };
}
