'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

type ToastItem = { id: number; message: string; variant: 'success' | 'error' };
type ToastContextValue = { showToast: (message: string, variant?: 'success' | 'error') => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);
  const current = toasts[0];

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar open={Boolean(current)} autoHideDuration={4000} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {current ? (
          <Alert severity={current.variant} variant="filled" sx={{ width: '100%' }} onClose={() => setToasts((c) => c.slice(1))}>
            {current.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
