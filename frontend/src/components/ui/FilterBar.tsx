'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

type FilterBarProps = {
  children: ReactNode;
  onClear: () => void;
};

export function FilterBar({ children, onClear }: FilterBarProps) {
  return (
    <div className="app-frame flex flex-col gap-2 p-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid flex-1 gap-2 md:grid-cols-2 xl:grid-cols-4">{children}</div>
      <Button variant="secondary" className="shrink-0 lg:self-end" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}
