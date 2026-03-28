'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
};

export function Modal({ open, title, children, confirmLabel, cancelLabel = 'Cancel', onConfirm, onClose }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(33,41,49,0.36)] p-3">
      <div className="w-full max-w-2xl border border-app-border bg-app-panel shadow-[0_12px_30px_rgba(31,41,51,0.16)]">
        <div className="border-b border-app-border bg-app-toolbar px-4 py-2.5">
          <h2 className="text-sm font-semibold text-app-text">{title}</h2>
        </div>
        <div className="px-4 py-3">{children}</div>
        <div className="flex justify-end gap-2 border-t border-app-border bg-app-toolbar px-4 py-2.5">
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          {onConfirm ? <Button onClick={onConfirm}>{confirmLabel || 'Confirm'}</Button> : null}
        </div>
      </div>
    </div>
  );
}
