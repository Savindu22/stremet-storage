'use client';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import GridViewIcon from '@mui/icons-material/GridView';
import MapIcon from '@mui/icons-material/Map';

interface MapToggleProps {
  value: 'floor' | 'grid';
  onChange: (value: 'floor' | 'grid') => void;
}

export function MapToggle({ value, onChange }: MapToggleProps) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v) => { if (v) onChange(v); }}
      size="small"
    >
      <ToggleButton value="floor"><MapIcon sx={{ mr: 0.5, fontSize: 18 }} /> Floor plan</ToggleButton>
      <ToggleButton value="grid"><GridViewIcon sx={{ mr: 0.5, fontSize: 18 }} /> Grid view</ToggleButton>
    </ToggleButtonGroup>
  );
}
