import { createTheme, ThemeOptions } from '@mui/material/styles';

// ─────────────────────────────────────────────────────────────────────────────
// Paleta UFPS — fuente única de verdad para todos los colores de la app.
// Si quieres cambiar el color primario, cámbialo aquí y se propaga a todo.
// ─────────────────────────────────────────────────────────────────────────────
export const PALETTE = {
  primary: {
    main:    '#C8102E',
    dark:    '#A00D24',
    darker:  '#7A0A1B',
    light:   '#E8334F',
  },
  secondary: {
    main:  '#2D6E3C',
    dark:  '#1E5A2D',
    light: '#3D8F50',
  },
  warning: {
    main:  '#E87722',
    dark:  '#C56118',
    light: '#F59B4B',
  },
  info: {
    main:  '#3B5BDB',
    dark:  '#2C4BC7',
    light: '#5C7AE8',
  },
  grey: {
    50:  '#F8F9FA',
    100: '#F1F3F5',
    200: '#E9ECEF',
    300: '#DEE2E6',
    400: '#CED4DA',
    500: '#ADB5BD',
    600: '#868E96',
    700: '#495057',
    800: '#343A40',
    900: '#212529',
  },
  dark: {
    bg:       '#0D1117',
    paper:    '#161B22',
    surface:  '#21262D',
    border:   '#30363D',
    border2:  '#21262D',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Función que crea el tema MUI según el modo
// ─────────────────────────────────────────────────────────────────────────────
const buildTheme = (mode: 'light' | 'dark'): ThemeOptions => {
  const isDark = mode === 'dark';

  return {
    palette: {
      mode,
      primary: {
        main:          PALETTE.primary.main,
        dark:          PALETTE.primary.dark,
        light:         PALETTE.primary.light,
        contrastText:  '#FFFFFF',
      },
      secondary: {
        main:          PALETTE.secondary.main,
        dark:          PALETTE.secondary.dark,
        light:         PALETTE.secondary.light,
        contrastText:  '#FFFFFF',
      },
      warning: {
        main:  PALETTE.warning.main,
        dark:  PALETTE.warning.dark,
        light: PALETTE.warning.light,
      },
      info: {
        main:  PALETTE.info.main,
        dark:  PALETTE.info.dark,
        light: PALETTE.info.light,
      },
      grey: PALETTE.grey,
      background: isDark
        ? { default: PALETTE.dark.bg, paper: PALETTE.dark.paper }
        : { default: PALETTE.grey[50],   paper: '#FFFFFF' },
      text: isDark
        ? { primary: PALETTE.grey[100], secondary: PALETTE.grey[500], disabled: PALETTE.grey[700] }
        : { primary: PALETTE.grey[900], secondary: PALETTE.grey[700], disabled: PALETTE.grey[500] },
      divider: isDark ? PALETTE.dark.border : PALETTE.grey[200],
    },

    typography: {
      fontFamily: '"Source Sans 3", sans-serif',
      h1: { fontFamily: '"DM Sans", sans-serif', fontWeight: 700 },
      h2: { fontFamily: '"DM Sans", sans-serif', fontWeight: 700 },
      h3: { fontFamily: '"DM Sans", sans-serif', fontWeight: 600 },
      h4: { fontFamily: '"DM Sans", sans-serif', fontWeight: 600 },
      h5: { fontFamily: '"DM Sans", sans-serif', fontWeight: 600 },
      h6: { fontFamily: '"DM Sans", sans-serif', fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
      button: { textTransform: 'none', fontWeight: 600 },
    },

    shape: { borderRadius: 10 },

    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 20px',
            fontSize: '0.9rem',
          },
          containedPrimary: {
            boxShadow: '0 2px 8px rgba(200, 16, 46, 0.25)',
            '&:hover': { boxShadow: '0 4px 16px rgba(200, 16, 46, 0.35)' },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            boxShadow: isDark
              ? '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
            border: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': { borderRadius: 8 },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { borderRight: 'none' },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderColor: theme.palette.divider,
          }),
        },
      },
    },
  };
};

export const createAppTheme = (mode: 'light' | 'dark') =>
  createTheme(buildTheme(mode));

export default createAppTheme('light');
