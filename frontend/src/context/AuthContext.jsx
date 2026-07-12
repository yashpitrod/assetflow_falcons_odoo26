import { createContext, useContext, useState, useCallback } from 'react';
import { setAuthToken } from '../api/client';

const AuthContext = createContext(null);
const TOKEN_KEY = 'assetflow_token';
const USER_KEY = 'assetflow_user';

// Hook to access auth state anywhere in the app
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Auth provider — restores session from localStorage on init
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Restore token into the API client synchronously so it's available
  // before any child component's useFetch fires on first render
  const [tokenRestored] = useState(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) setAuthToken(token);
    return true;
  });

  const isAuthenticated = user !== null;

  const login = useCallback((userData, token) => {
    // Persist token so API client survives reloads
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      setAuthToken(token);
    }

    const safeUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      departmentId: userData.departmentId,
    };

    localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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
