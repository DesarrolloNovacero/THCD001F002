import { useState } from 'react';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BulkEntryRow } from './BulkEntryGrid';

const API_URL = 'https://thcd001f002-backend.onrender.com';

interface PegadoEntryGridProps {
  onRowsGenerated: (rows: BulkEntryRow[]) => void;
  disabled?: boolean;
}

export function PegadoEntryGrid({ onRowsGenerated, disabled }: PegadoEntryGridProps) {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  const handlePasteProcess = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    
    const rawCedulas = inputText
      .split(/[\n,;\t]+/) 
      .map(s => s.trim())
      .filter(s => s.length >= 3);

    const uniqueCedulas = [...new Set(rawCedulas)];

    if (uniqueCedulas.length === 0) {
        setIsProcessing(false);
        return;
    }

    try {
        const formData = new FormData();
        formData.append('cedulas_json', JSON.stringify(uniqueCedulas));

        const res = await fetch(`${API_URL}/validate-cedula`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('Error validando');
        const results = await res.json();

        const newRows: BulkEntryRow[] = results.map((r: any) => {
            if (r.found) {
                return {
                    id: crypto.randomUUID(),
                    cedula: r.cedula,
                    status: r.source === 'headcount' ? 'found-headcount' : 'found-cesantes',
                    nombres: r.data.nombres,
                    apellidos: r.data.apellidos,
                    cargo: r.data.cargo,
                    genero: r.data.genero,
                    unidad: r.data.unidad,
                    area: r.data.area,
                    seccion: r.data.seccion,
                    centroCosto: r.data.centro_costo,
                    grupoPersonal: r.data.grupo_personal,
                    areaPersonal: r.data.area_personal,
                    jefeArea: r.data.jefe_area,
                    gerenteArea: r.data.gerente_area,
                    localidad: r.data.localidad
                };
            } else {
                return {
                    id: crypto.randomUUID(),
                    cedula: r.cedula,
                    status: 'not-found',
                    nombres: '', apellidos: '', cargo: '', genero: '', unidad: '', area: '', seccion: '', centroCosto: '', grupoPersonal: '', areaPersonal: '', jefeArea: '', gerenteArea: '', localidad: ''
                };
            }
        });

        setProcessedCount(newRows.length);
        onRowsGenerated(newRows);

    } catch (error) {
        console.error("Error procesando pegado:", error);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
      <div className="flex flex-col gap-2 h-full">
        <label className="text-sm font-medium text-slate-700">
            1. Pega aquí la columna de cédulas (Ctrl+V)
        </label>
        <Textarea 
            placeholder="Ejemplo:&#10;0923456789&#10;1204567890&#10;..."
            className="flex-1 font-mono text-sm resize-none bg-slate-50 focus:bg-white"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={disabled || isProcessing}
        />
        <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Se detectarán saltos de línea automáticamente.</span>
            <Button 
                size="sm" 
                onClick={handlePasteProcess} 
                disabled={!inputText.trim() || isProcessing || disabled}
            >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <ArrowRight className="w-4 h-4 mr-2"/>}
                Procesar y Validar
            </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 h-full bg-slate-50 rounded-lg border p-4">
         <label className="text-sm font-medium text-slate-700">
            2. Resultado
        </label>
        {processedCount > 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-green-500" />
                <div>
                    <p className="text-lg font-bold text-slate-800">{processedCount} Registros Procesados</p>
                    <p className="text-sm text-slate-500">Se han añadido a la tabla principal.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => {setInputText(''); setProcessedCount(0);}}>
                    Limpiar y Pegar Más
                </Button>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                    <span className="text-xl font-bold">?</span>
                </div>
                <p className="text-sm">Pega las cédulas y presiona procesar.</p>
            </div>
        )}
      </div>
    </div>
  );
}