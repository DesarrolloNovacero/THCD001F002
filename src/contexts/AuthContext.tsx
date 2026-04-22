import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  userName: string | null;
  userRole: string | null;
  login: (token: string, name: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('userName'));
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('userRole'));

  const login = (newToken: string, name: string, role: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userName', name);
    localStorage.setItem('userRole', role);
    setToken(newToken);
    setUserName(name);
    setUserRole(role);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    setToken(null);
    setUserName(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, userName, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};