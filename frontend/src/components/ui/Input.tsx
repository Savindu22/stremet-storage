'use client';

import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
};

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <label className="flex w-full flex-col gap-1 text-sm text-app-textMuted" htmlFor={id}>
      {label ? <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">{label}</span> : null}
      <input
        id={id}
        className={cn(
          'min-h-9 border border-app-border bg-[linear-gradient(180deg,#edf2f7_0%,#fafbfd_100%)] px-2.5 py-1.5 text-[13px] text-app-text shadow-inset outline-none placeholder:text-slate-400 focus:border-app-primary',
          error && 'border-app-danger',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-app-danger">{error}</span> : null}
    </label>
  );
}
