import { useState, useRef, useEffect } from 'react';
import { Search, CheckCircle, AlertCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Actualizamos el tipo para incluir 'duplicate'
export type ValidationStatus = 'idle' | 'found-headcount' | 'found-cesantes' | 'not-found' | 'duplicate';

interface CedulaValidatorProps {
  cedula: string;
  onCedulaChange: (cedula: string) => void;
  onValidate: () => void;
  validationStatus: ValidationStatus;
  disabled?: boolean;
  suggestions?: Array<{ cedula: string; nombre: string; source?: 'headcount' | 'cesantes' }>;
}

export function CedulaValidator({
  cedula,
  onCedulaChange,
  onValidate,
  validationStatus,
  disabled,
  suggestions = []
}: CedulaValidatorProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = suggestions.filter(s => 
    s.cedula.includes(cedula) && cedula.length >= 2
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    onCedulaChange(value);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
  };

  const handleSelectSuggestion = (selectedCedula: string) => {
    onCedulaChange(selectedCedula);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(filteredSuggestions[highlightedIndex].cedula);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const getStatusBadge = () => {
    switch (validationStatus) {
      case 'found-headcount':
        return (
          <div className="validation-badge validation-found-headcount animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            Encontrado en Headcount
          </div>
        );
      case 'found-cesantes':
        return (
          <div className="validation-badge validation-found-cesantes animate-fade-in">
            <AlertCircle className="w-4 h-4" />
            Encontrado en Cesantes
          </div>
        );
      case 'not-found':
        return (
          <div className="validation-badge validation-not-found animate-fade-in">
            <XCircle className="w-4 h-4" />
            No encontrado
          </div>
        );
      // NUEVO CASO: DUPLICADO
      case 'duplicate':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200 animate-fade-in">
            <AlertTriangle className="w-4 h-4" />
            Cédula ya registrada (Duplicada)
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 relative" ref={wrapperRef}>
          <label className="field-label field-required">Cédula</label>
          <Input
            type="text"
            placeholder="Ingrese número de cédula"
            value={cedula}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={cn(
                "h-11",
                // Si es duplicado, ponemos el borde amarillo para llamar la atención
                validationStatus === 'duplicate' && "border-yellow-500 focus-visible:ring-yellow-500"
            )}
            autoComplete="off"
          />
          
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion.cedula}
                  className={cn(
                    "px-3 py-2 cursor-pointer hover:bg-accent transition-colors",
                    highlightedIndex === index && "bg-accent"
                  )}
                  onClick={() => handleSelectSuggestion(suggestion.cedula)}
                >
                  <div className="font-medium text-foreground">{suggestion.cedula}</div>
                  <div className="text-sm text-muted-foreground">{suggestion.nombre}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-end">
          <Button
            onClick={onValidate}
            disabled={!cedula.trim() || disabled}
            className="h-11 px-6"
          >
            <Search className="w-4 h-4 mr-2" />
            Validar cédula
          </Button>
        </div>
      </div>
      
      {validationStatus !== 'idle' && (
        <div className="flex items-center">
          {getStatusBadge()}
        </div>
      )}
    </div>
  );
}