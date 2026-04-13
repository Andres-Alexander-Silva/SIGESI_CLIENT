import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from '@/styles/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeModeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextType>({
  mode: 'light',
  toggleMode: () => {},
});

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode');
    // Solo usar el valor guardado si el usuario lo cambió explícitamente
    if (saved === 'dark' || saved === 'light') return saved;
    // Por defecto: modo claro
    return 'light';
  });

  // Sincronizar atributo data-theme en <html> para que las CSS vars
  // del index.css puedan reaccionar al modo
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', next);
      return next;
    });
  };

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
