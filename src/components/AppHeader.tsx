import { useState } from 'react';
import { GraduationCap, LogOut, Shield, Users, UserPlus, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function AppHeader() {
  const { userName, userRole, token, logout } = useAuth();
  const { toast } = useToast();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre_completo: '',
    rol: 'USUARIO'
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('https://thcd001f002-backend.onrender.com/crear-usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al crear usuario');
      }

      toast({ title: 'Éxito', description: 'El usuario ha sido creado y encriptado en la base de datos.' });
      setShowAdminModal(false);
      setFormData({ email: '', password: '', nombre_completo: '', rol: 'USUARIO' });
      
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
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
              
              {userRole === 'ADMIN' && (
                <Button variant="outline" size="sm" onClick={() => setShowAdminModal(true)} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                  <Users className="w-4 h-4 mr-2" /> Usuarios
                </Button>
              )}

              <div className="text-right hidden sm:block border-l pl-4">
                <p className="text-sm font-bold text-slate-800">{userName}</p>
                <div className="flex items-center justify-end gap-1">
                  {userRole === 'ADMIN' && <Shield className="w-3 h-3 text-emerald-600" />}
                  <span className={`text-xs font-bold ${userRole === 'ADMIN' ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {userRole}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ml-2">
                <LogOut className="w-4 h-4 mr-2" /> Salir
              </Button>
            </div>
          )}
        </div>
      </header>

      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h2 className="font-bold flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary"/> Nuevo Usuario</h2>
              <button onClick={() => setShowAdminModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                <input 
                  type="text" required
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
                <input 
                  type="email" required
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contraseña (Temporal)</label>
                <input 
                  type="password" required minLength={6}
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nivel de Acceso</label>
                <select 
                  className="w-full px-3 py-2 border rounded-md bg-white"
                  value={formData.rol}
                  onChange={(e) => setFormData({...formData, rol: e.target.value})}
                >
                  <option value="USUARIO">Usuario Normal (Solo validar y exportar)</option>
                  <option value="ADMIN">Administrador (Control Total)</option>
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAdminModal(false)}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : 'Crear Cuenta'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}