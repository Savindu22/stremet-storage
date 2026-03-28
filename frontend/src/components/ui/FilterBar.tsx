'use client';

import type { ReactNode } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import MuiButton from '@mui/material/Button';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';

type FilterBarProps = {
  children: ReactNode;
  onClear: () => void;
};

export function FilterBar({ children, onClear }: FilterBarProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'flex-end' }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap flex={1} sx={{ '& > *': { minWidth: 160, flex: '1 1 180px' } }}>
          {children}
        </Stack>
        <MuiButton variant="text" size="small" startIcon={<FilterListOffIcon />} onClick={onClear} sx={{ flexShrink: 0 }}>
          Clear filters
        </MuiButton>
      </Stack>
    </Paper>
  );
}
