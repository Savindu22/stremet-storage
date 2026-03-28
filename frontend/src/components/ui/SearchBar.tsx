'use client';

import { useEffect, useState } from 'react';
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
    if (debouncedValue === value) {
      return;
    }

    onChange(debouncedValue);
  }, [debouncedValue, onChange, value]);

  return (
    <label className="app-frame-soft flex min-h-9 items-center gap-2 px-3 py-1.5 focus-within:border-app-primary">
      <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">Search</span>
      <input
        className="w-full border-0 bg-transparent text-[13px] text-app-text outline-none placeholder:text-slate-400"
        placeholder={placeholder}
        value={localValue}
        onChange={(event) => setLocalValue(event.target.value)}
      />
    </label>
  );
}
