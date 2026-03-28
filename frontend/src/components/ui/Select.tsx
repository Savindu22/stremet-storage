'use client';

import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Option = {
  label: string;
  value: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: Option[];
};

export function Select({ label, className, id, options, ...props }: SelectProps) {
  return (
    <label className="flex w-full flex-col gap-1 text-sm text-app-textMuted" htmlFor={id}>
      {label ? <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">{label}</span> : null}
      <select
        id={id}
        className={cn(
          'min-h-9 border border-app-border bg-[linear-gradient(180deg,#edf2f7_0%,#fafbfd_100%)] px-2.5 py-1.5 text-[13px] text-app-text shadow-inset outline-none focus:border-app-primary',
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
