'use client';

import Box from '@mui/material/Box';
import { Input } from '@/components/ui/Input';

interface MapSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function MapSearch({ value, onChange }: MapSearchProps) {
  return (
    <Box sx={{ minWidth: 280, flex: 1 }}>
      <Input
        id="map-search"
        label="Quick search"
        value={value}
        onChange={(event) => onChange((event.target as HTMLInputElement).value)}
        placeholder="Find item code, item name, or customer"
      />
    </Box>
  );
}
