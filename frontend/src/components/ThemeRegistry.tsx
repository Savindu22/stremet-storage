'use client';

import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { ReactNode } from 'react';

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: { main: '#1565C0', light: '#42A5F5', dark: '#0D47A1' },
    secondary: { main: '#455A64' },
    error: { main: '#C62828' },
    warning: { main: '#E65100' },
    success: { main: '#2E7D32' },
    background: { default: '#ECEFF1', paper: '#FFFFFF' },
    text: { primary: '#212121', secondary: '#546E7A' },
    divider: '#B0BEC5',
  },
  typography: {
    fontFamily: '"Noto Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
    h1: { fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h2: { fontSize: '1.1rem', fontWeight: 700 },
    h3: { fontSize: '0.95rem', fontWeight: 700 },
    subtitle1: { fontSize: '0.8125rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.02em' },
    body1: { fontSize: '0.8125rem' },
    body2: { fontSize: '0.8125rem' },
    caption: { fontSize: '0.75rem' },
  },
  shape: { borderRadius: 4 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: true },
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 3, paddingInline: 16, minHeight: 34, fontSize: '0.8125rem' },
        sizeSmall: { minHeight: 28, paddingInline: 10, fontSize: '0.75rem' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none', borderRadius: 3 },
        outlined: { borderColor: '#B0BEC5' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 3, height: 22, fontSize: '0.6875rem', letterSpacing: '0.02em' },
        sizeSmall: { height: 20, fontSize: '0.6875rem' },
        icon: { fontSize: 14 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#CFD8DC', fontSize: '0.8125rem', padding: '6px 12px' },
        head: { fontWeight: 700, fontSize: '0.6875rem', color: '#546E7A', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '8px 12px', backgroundColor: '#ECEFF1' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': { borderBottom: 0 },
          '&:nth-of-type(even)': { backgroundColor: '#FAFAFA' },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 3, fontSize: '0.8125rem' },
      },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 6 },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: { borderRadius: 3, borderColor: '#B0BEC5' },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: { padding: 16, '&:last-child': { paddingBottom: 16 } },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: { fontSize: '0.8125rem' },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: { borderRadius: 3, textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: { borderRadius: 3 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 1, height: 5 },
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: { '& .MuiPaginationItem-root': { borderRadius: 3, minWidth: 28, height: 28 } },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 3 },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: { '& .MuiStepIcon-root': { fontSize: 20 } },
      },
    },
  },
});

export default function ThemeRegistry({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
