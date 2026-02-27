import { GraduationCap } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Sistema de Capacitación</h1>
            <p className="text-sm text-muted-foreground">TH.CD.001.F002 - Información de Capacitación</p>
          </div>
        </div>
      </div>
    </header>
  );
}
