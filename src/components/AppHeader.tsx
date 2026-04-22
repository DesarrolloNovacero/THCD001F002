import { GraduationCap, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const { userName, userRole, logout } = useAuth();

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Sistema de Capacitación</h1>
            <p className="text-sm text-muted-foreground">TH.CD.001.F002 - Información de Capacitación</p>
          </div>
        </div>

        {userName && (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{userName}</p>
              <div className="flex items-center justify-end gap-1">
                {userRole === 'ADMIN' && <Shield className="w-3 h-3 text-emerald-600" />}
                <span className={`text-xs font-bold ${userRole === 'ADMIN' ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {userRole}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
              <LogOut className="w-4 h-4 mr-2" /> Salir
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}