import { createContext, useContext, useState, useCallback } from 'react';
import { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

// Hook to access auth state anywhere in the app
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Auth provider — starts LOGGED OUT. Login page is the real entry point.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const isAuthenticated = user !== null;

  const login = useCallback((userData, token) => {
    // Set token in the API client for subsequent requests
    if (token) {
      setAuthToken(token);
    }
    
    // Store user data in memory
    setUser({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      departmentId: userData.departmentId,
    });
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  // Checks if the current user has a specific role
  const hasRole = useCallback(
    (roles) => {
      if (!user) return false;
      if (Array.isArray(roles)) return roles.includes(user.role);
      return user.role === roles;
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}
