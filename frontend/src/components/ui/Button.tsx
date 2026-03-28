'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
  children: ReactNode;
};

export function Button({
  className,
  variant = 'primary',
  fullWidth,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-9 items-center justify-center border px-3 py-1.5 text-[13px] font-semibold shadow-panel transition-[background-color,box-shadow,transform] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'border-app-primaryHover bg-app-primary text-white hover:bg-app-primaryHover',
        variant === 'secondary' && 'border-app-border bg-app-panel text-app-text hover:bg-app-panelMuted',
        variant === 'danger' && 'border-[#7d2f24] bg-app-danger text-white hover:bg-[#7f3025]',
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
