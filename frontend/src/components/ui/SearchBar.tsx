'use client';

import { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { useDebouncedValue } from '@/lib/hooks';

type SearchBarProps = {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
};

export function SearchBar({ placeholder = 'Search', value = '', onChange }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebouncedValue(localValue, 250);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (debouncedValue === value) return;
    onChange(debouncedValue);
  }, [debouncedValue, onChange, value]);

  return (
    <TextField
      fullWidth
      placeholder={placeholder}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
