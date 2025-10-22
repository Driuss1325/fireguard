import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

const LS_MODE = 'fg_theme_mode';
const ThemeCtx = createContext(null);
export const useThemeMode = () => useContext(ThemeCtx);

export function AppThemeProvider({ children }){
  const [mode, setMode] = useState('dark');
  useEffect(()=>{
    const saved = localStorage.getItem(LS_MODE);
    if (saved === 'light' || saved === 'dark') setMode(saved);
  }, []);
  const toggle = () => {
    setMode(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(LS_MODE, next);
      return next;
    });
  };
  const theme = useMemo(()=>createTheme({
    palette: {
      mode,
      primary: { main: '#22c55e' },
      secondary: { main: '#38bdf8' },
      background: { default: mode==='dark' ? '#0b1220' : '#f7fafc', paper: mode==='dark' ? '#101827' : '#ffffff' }
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: 12 } } },
      MuiPaper: { styleOverrides: { root: { borderRadius: 14 } } }
    }
  }), [mode]);

  const value = useMemo(()=>({ mode, toggle }), [mode]);
  return (
    <ThemeCtx.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeCtx.Provider>
  );
}
