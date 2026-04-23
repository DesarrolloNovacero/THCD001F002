import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, Shield, Users, UserPlus, X, Loader2, Power, Trash2, CheckCircle2, XCircle, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserItem {
  id: string;
  email: string;
  nombre_completo: string;
  rol: string;
  activo: boolean;
}

export function AppHeader() {
  const { userName, userRole, token, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'lista' | 'nuevo'>('lista');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre_completo: '',
    rol: 'USUARIO'
  });

  const fetchUsers = async () => {
    if (!token) return;
    setIsLoadingList(true);
    try {
      const res = await fetch('https://thcd001f002-backend.onrender.com/usuarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (showAdminModal && activeTab === 'lista') {
      fetchUsers();
    }
  }, [showAdminModal, activeTab]);

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

      toast({ title: 'Éxito', description: 'El usuario ha sido creado.' });
      setFormData({ email: '', password: '', nombre_completo: '', rol: 'USUARIO' });
      setActiveTab('lista');
      
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const res = await fetch(`https://thcd001f002-backend.onrender.com/usuarios/${userId}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail);
      }
      toast({ title: 'Estado actualizado' });
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario permanentemente?')) return;
    try {
      const res = await fetch(`https://thcd001f002-backend.onrender.com/usuarios/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail);
      }
      toast({ title: 'Usuario eliminado' });
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Atención', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
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
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    <ClipboardCheck className="w-4 h-4 mr-2" /> Auditoría
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowAdminModal(true)} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    <Users className="w-4 h-4 mr-2" /> Panel de Usuarios
                  </Button>
                </>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h2 className="font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-600"/> Administración de Accesos</h2>
              <button onClick={() => setShowAdminModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="flex border-b">
              <button 
                onClick={() => setActiveTab('lista')} 
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'lista' ? 'bg-white border-b-2 border-emerald-500 text-emerald-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                <div className="flex items-center justify-center gap-2"><Users className="w-4 h-4"/> Lista de Usuarios</div>
              </button>
              <button 
                onClick={() => setActiveTab('nuevo')} 
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'nuevo' ? 'bg-white border-b-2 border-emerald-500 text-emerald-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                <div className="flex items-center justify-center gap-2"><UserPlus className="w-4 h-4"/> Crear Nuevo</div>
              </button>
            </div>

            <div className="flex-1 overflow-hidden bg-white">
              {activeTab === 'nuevo' ? (
                <form onSubmit={handleCreateUser} className="p-6 space-y-4 max-w-md mx-auto">
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
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : 'Registrar Empleado'}
                    </Button>
                  </div>
                </form>
              ) : (
                <ScrollArea className="h-[400px]">
                  {isLoadingList ? (
                    <div className="flex justify-center items-center h-40"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {usersList.map((u) => (
                        <div key={u.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-slate-50 transition-colors gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-slate-800">{u.nombre_completo}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${u.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {u.rol}
                              </span>
                              {u.activo ? (
                                <span className="flex items-center text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold"><CheckCircle2 className="w-3 h-3 mr-1"/> Activo</span>
                              ) : (
                                <span className="flex items-center text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold"><XCircle className="w-3 h-3 mr-1"/> Suspendido</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleToggleStatus(u.id)}
                              className={u.activo ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                            >
                              <Power className="w-4 h-4 mr-2"/> {u.activo ? 'Suspender' : 'Activar'}
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="w-4 h-4"/>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}