import { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react';
import { Plus, Trash2, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = 'https://thcd001f002-backend.onrender.com';

export type RowValidationStatus = 'idle' | 'loading' | 'found-headcount' | 'found-cesantes' | 'not-found' | 'error' | 'duplicate';

export interface BulkEntryRow {
  id: string; cedula: string; status: RowValidationStatus; nombres: string; apellidos: string; cargo: string;
  genero: string; unidad: string; area: string; seccion: string; centroCosto: string; grupoPersonal: string;
  areaPersonal: string; jefeArea: string; gerenteArea: string; localidad: string;
}

interface Suggestion { cedula: string; nombre: string; source: string; }

function CedulaAutocomplete({ value, onChange, onEnter, disabled, inputRef }: {
  value: string; onChange: (v: string) => void; onEnter: (finalValue: string) => void;
  disabled?: boolean; inputRef?: (el: HTMLInputElement | null) => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isSelecting = useRef(false);

  useEffect(() => {
    let isActive = true;
    
    if (!value || value.length < 2) { 
      setSuggestions([]); 
      setShowSuggestions(false); 
      return; 
    }
    
    const timer = setTimeout(async () => {
      if (isSelecting.current) return;
      
      try {
        const formData = new FormData();
        formData.append('search_term', value);
        const res = await fetch(`${API_URL}/suggest-cedulas`, { method: 'POST', body: formData });
        
        if (res.ok && isActive) {
          const data = await res.json();
          if (isActive && !isSelecting.current) {
            setSuggestions(data);
            if (data.length > 0) setShowSuggestions(true);
          }
        }
      } catch (error) { 
        console.error(error); 
      }
    }, 200);
    
    return () => { 
      isActive = false; 
      clearTimeout(timer); 
    };
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (cedula: string) => {
    isSelecting.current = true;
    onChange(cedula);
    setShowSuggestions(false);
    setSuggestions([]);
    onEnter(cedula);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Input
        ref={inputRef} 
        value={value}
        onChange={e => { 
          isSelecting.current = false;
          onChange(e.target.value); 
          if (e.target.value.length >= 2) setShowSuggestions(true); 
        }}
        onKeyDown={e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                isSelecting.current = true;
                let final = value;
                if(showSuggestions && suggestions.length > 0) { 
                  final = suggestions[0].cedula; 
                  onChange(final); 
                }
                setShowSuggestions(false);
                setSuggestions([]);
                onEnter(final);
            }
        }}
        disabled={disabled} 
        placeholder="Cédula o Nombre..." 
        autoComplete="off"
        className="h-8 text-sm font-mono border-0 bg-transparent focus:bg-background focus:border focus:ring-1 shadow-none w-full"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full min-w-[350px] mt-1 bg-white border rounded-md shadow-xl max-h-[300px] overflow-auto">
          {suggestions.map((s, index) => (
            <div key={`${s.cedula}-${index}`} className={`px-3 py-2 text-xs cursor-pointer hover:bg-slate-100 flex flex-col border-b last:border-0 ${index===0?'bg-slate-50':''}`} onClick={() => handleSelect(s.cedula)}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">{s.cedula}</span>
                {index === 0 && <span className="text-[10px] text-blue-500 font-medium">Enter para seleccionar</span>}
              </div>
              <span className="text-slate-600 truncate text-xs font-medium">{s.nombre}</span>
              <span className="text-[10px] text-slate-400 capitalize">{s.source}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BulkEntryGrid({ rows, onRowsChange, disabled }: {
  rows: BulkEntryRow[]; onRowsChange: Dispatch<SetStateAction<BulkEntryRow[]>>; disabled?: boolean;
}) {
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const addRow = () => {
    const newId = crypto.randomUUID();
    const row: BulkEntryRow = { id: newId, cedula: '', status: 'idle', nombres: '', apellidos: '', cargo: '', genero: '', unidad: '', area: '', seccion: '', centroCosto: '', grupoPersonal: '', areaPersonal: '', jefeArea: '', gerenteArea: '', localidad: '' };
    onRowsChange(prev => [...prev, row]);
    setTimeout(() => { inputRefs.current.get(newId)?.focus(); }, 50);
  };

  const updateRow = (id: string, data: Partial<BulkEntryRow>) => onRowsChange(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  const removeRow = (id: string) => onRowsChange(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);

  const validateRow = async (row: BulkEntryRow, overrideCedula?: string) => {
    const cedulaToValidate = overrideCedula || row.cedula;
    if (!cedulaToValidate) return;
    
    if (rows.some(r => r.cedula === cedulaToValidate && r.id !== row.id)) {
        updateRow(row.id, { status: 'duplicate', cedula: cedulaToValidate, nombres: 'DUPLICADO', apellidos: '', cargo: 'Esta cédula ya está en la lista' });
        const nextRow = rows[rows.indexOf(row) + 1];
        if (!nextRow) addRow(); else setTimeout(() => inputRefs.current.get(nextRow.id)?.focus(), 50);
        return;
    }

    if (!cedulaToValidate.trim()) return;
    updateRow(row.id, { status: 'loading', cedula: cedulaToValidate });
    
    if (rows[rows.length - 1].id === row.id) addRow();
    else setTimeout(() => inputRefs.current.get(rows[rows.indexOf(row) + 1].id)?.focus(), 50);

    try {
      const formData = new FormData();
      formData.append('cedulas_json', JSON.stringify([cedulaToValidate]));
      const res = await fetch(`${API_URL}/validate-cedula`, { method: 'POST', body: formData });
      const [result] = await res.json();

      if (result?.found) {
        onRowsChange(prev => prev.map(r => r.id === row.id ? { 
            ...r, 
            cedula: cedulaToValidate, 
            status: result.source === 'headcount' ? 'found-headcount' : 'found-cesantes',
            ...result.data,
            centroCosto: result.data.centro_costo,
            grupoPersonal: result.data.grupo_personal,
            areaPersonal: result.data.area_personal,
            jefeArea: result.data.jefe_area,
            gerenteArea: result.data.gerente_area
        } : r));
      } else {
        onRowsChange(prev => prev.map(r => r.id === row.id ? { ...r, cedula: cedulaToValidate, status: 'not-found', nombres: '', apellidos: '', cargo: '' } : r));
      }
    } catch {
       onRowsChange(prev => prev.map(r => r.id === row.id ? { ...r, status: 'error' } : r));
    }
  };

  const statusIcon = (status: RowValidationStatus) => {
    if (status === 'loading') return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    if (status === 'found-headcount') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'found-cesantes') return <CheckCircle className="w-4 h-4 text-orange-500" />;
    if (status === 'not-found') return <XCircle className="w-4 h-4 text-red-500" />;
    if (status === 'error') return <XCircle className="w-4 h-4 text-red-500" />;
    if (status === 'duplicate') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <div className="w-4 h-4 rounded-full border-2 border-gray-200"></div>;
  };

  return (
    <div className="space-y-3 flex flex-col h-auto">
      <div className="flex justify-between items-center"><Button size="sm" onClick={addRow} disabled={disabled} variant="outline"><Plus className="w-4 h-4 mr-1" /> Agregar fila</Button></div>
      <div className="border rounded-lg bg-white shadow-sm min-h-[300px]">
        <div className="overflow-x-auto w-full pb-64">
            <table className="w-full relative">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                <tr className="border-b">
                <th className="px-3 py-3 text-xs font-medium text-slate-500 w-10 bg-slate-50">#</th>
                <th className="px-3 py-3 text-xs font-medium text-slate-500 w-16 text-center bg-slate-50">Estado</th>
                <th className="px-3 py-3 text-xs font-medium text-slate-500 w-40 text-left bg-slate-50">Cédula / Nombre</th>
                <th className="px-3 py-3 text-xs font-medium text-slate-500 text-left bg-slate-50">Nombres</th>
                <th className="px-3 py-3 text-xs font-medium text-slate-500 text-left bg-slate-50">Cargo</th>
                <th className="px-3 py-3 w-10 bg-slate-50" />
                </tr>
            </thead>
            <tbody>
                {rows.map((row, i) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-2 text-xs text-slate-400 text-center">{i + 1}</td>
                    <td className="px-3 py-2 text-center flex justify-center items-center">{statusIcon(row.status)}</td>
                    <td className="px-3 py-1 align-top relative">
                        <CedulaAutocomplete value={row.cedula} onChange={v => updateRow(row.id, { cedula: v, status: 'idle' })} onEnter={(val) => validateRow(row, val)} disabled={disabled} inputRef={el => { if (el) inputRefs.current.set(row.id, el); else inputRefs.current.delete(row.id); }} />
                    </td>
                    <td className="px-3 py-1"><Input readOnly value={row.status === 'duplicate' ? 'DUPLICADO' : (row.apellidos || row.nombres ? `${row.apellidos} ${row.nombres}` : '')} className={`h-8 border-0 bg-transparent text-xs ${row.status === 'duplicate' ? 'text-yellow-600 font-bold' : ''}`} tabIndex={-1}/></td>
                    <td className="px-3 py-1"><Input readOnly value={row.cargo || ''} className="h-8 border-0 bg-transparent text-xs" tabIndex={-1}/></td>
                    <td className="px-2 py-1 text-center"><Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => removeRow(row.id)} disabled={rows.length === 1 || disabled} tabIndex={-1}><Trash2 className="w-4 h-4" /></Button></td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}