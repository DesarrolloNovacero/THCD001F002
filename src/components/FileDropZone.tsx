import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
  label: string;
  description: string;
  fileName?: string;
  onFileSelect: (file: File | null) => void;
}

export function FileDropZone({ label, description, fileName, onFileSelect }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const hasFile = !!fileName;

  return (
    <div
      className={cn(
        'dropzone relative',
        isDragging && 'dropzone-active',
        hasFile && 'dropzone-success'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileInput}
      />
      
      <div className="flex flex-col items-center gap-3">
        {hasFile ? (
          <>
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">{label}</p>
              <div className="flex items-center gap-2 text-sm text-success">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{fileName}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
              isDragging ? 'bg-primary/10' : 'bg-muted'
            )}>
              <Upload className={cn(
                'w-6 h-6 transition-colors',
                isDragging ? 'text-primary' : 'text-muted-foreground'
              )} />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">{label}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Arrastra y suelta o haz clic para seleccionar
            </p>
          </>
        )}
      </div>
    </div>
  );
}
