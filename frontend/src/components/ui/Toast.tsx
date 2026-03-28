'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type ToastItem = {
  id: number;
  message: string;
  variant: 'success' | 'error';
};

type ToastContextValue = {
  showToast: (message: string, variant?: 'success' | 'error') => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const value = useMemo(
    () => ({
      showToast(message: string, variant: 'success' | 'error' = 'success') {
        const id = Date.now();
        setToasts((current) => [...current, { id, message, variant }]);
        window.setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3200);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'border px-3 py-2 text-[13px] font-medium shadow-panel',
              toast.variant === 'success' && 'border-[#8fb39a] bg-[#eef5ef] text-app-success',
              toast.variant === 'error' && 'border-[#d0aaa3] bg-[#f8ece9] text-app-danger',
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
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
