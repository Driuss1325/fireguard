import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { api, setToken } from '../services/api';
import { useSnackbar } from 'notistack';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const token = localStorage.getItem('fg_token');
    if (!token) return;
    try { setUser({ ...jwtDecode(token), token }); } catch {}
  }, []);

  const value = useMemo(() => ({
    user,
    async login(email, password) {
      try {
        const { data } = await api.post('/api/auth/login', { email, password });
        setToken(data?.token);
        setUser({ ...jwtDecode(data?.token), token: data?.token });
        enqueueSnackbar('Bienvenido', { variant: 'success' });
      } catch (e) {
        enqueueSnackbar(e?.response?.data?.message || e.message, { variant: 'error' });
        throw e;
      }
    },
    logout() {
      setToken(null);
      setUser(null);
      enqueueSnackbar('Sesión cerrada', { variant: 'info' });
    }
  }), [user, enqueueSnackbar]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
