import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('fintrack_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On first load, if we have a token, re-fetch the profile so a stale
    // localStorage user object never drifts from what the server has.
    const token = localStorage.getItem('fintrack_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/profile')
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('fintrack_user', JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem('fintrack_token');
        localStorage.removeItem('fintrack_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('fintrack_token', data.token);
    localStorage.setItem('fintrack_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('fintrack_token', data.token);
    localStorage.setItem('fintrack_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fintrack_token');
    localStorage.removeItem('fintrack_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
