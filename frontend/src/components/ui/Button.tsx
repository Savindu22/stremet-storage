'use client';

import type { ReactNode } from 'react';
import MuiButton from '@mui/material/Button';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
};

export function Button({ variant = 'primary', fullWidth, children, disabled, type = 'button', onClick }: ButtonProps) {
  const muiVariant = variant === 'secondary' ? 'outlined' : 'contained';
  const color = variant === 'danger' ? 'error' : 'primary';

  return (
    <MuiButton variant={muiVariant} color={color} fullWidth={fullWidth} disabled={disabled} type={type} onClick={onClick}>
      {children}
    </MuiButton>
  );
}
