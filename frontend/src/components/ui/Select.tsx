'use client';

import type { SelectHTMLAttributes } from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

type Option = { label: string; value: string };

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: Option[];
};

export function Select({ label, id, options, value, onChange }: SelectProps) {
  return (
    <TextField
      id={id}
      label={label}
      value={value ?? ''}
      onChange={onChange as any}
      select
      fullWidth
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
