'use client';

import type { InputHTMLAttributes } from 'react';
import TextField from '@mui/material/TextField';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
};

export function Input({ label, error, id, value, onChange, type, placeholder, min, max, disabled }: InputProps) {
  return (
    <TextField
      id={id}
      label={label}
      value={value}
      onChange={onChange as any}
      type={type}
      placeholder={placeholder}
      error={Boolean(error)}
      helperText={error || undefined}
      disabled={disabled}
      fullWidth
      slotProps={{ htmlInput: { min, max }, inputLabel: (type === 'date' || type === 'datetime-local') ? { shrink: true } : undefined }}
    />
  );
}
