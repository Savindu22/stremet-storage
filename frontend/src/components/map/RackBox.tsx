'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { MapRack } from './types';
import { OccupancyBar } from './OccupancyBar';
import { rackHasSearchMatch } from './utils';

interface RackBoxProps {
  rack: MapRack;
  searchQuery?: string;
  onSelect?: (rack: MapRack) => void;
}

export function RackBox({ rack, searchQuery = '', onSelect }: RackBoxProps) {
  const highlight = rackHasSearchMatch(rack, searchQuery);

  return (
    <Paper
      variant="outlined"
      onClick={() => onSelect?.(rack)}
      sx={{
        p: 1.5,
        cursor: onSelect ? 'pointer' : 'default',
        borderColor: highlight ? 'primary.main' : 'divider',
        bgcolor: highlight ? 'primary.50' : 'background.paper',
        '&:hover': onSelect ? { bgcolor: 'grey.50' } : undefined,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" fontWeight={600}>{rack.code}</Typography>
        <Typography variant="caption" color="text.secondary">{rack.label}</Typography>
      </Stack>
      <Stack spacing={0.5} mb={1}>
        {[...rack.shelves].sort((a, b) => b.shelf_number - a.shelf_number).map((shelf) => (
          <Box key={shelf.id} sx={{ display: 'flex', justifyContent: 'space-between', px: 1, py: 0.25, bgcolor: 'grey.100', borderRadius: 0.5, fontSize: 12 }}>
            <span>S{shelf.shelf_number}</span>
            <span>{shelf.current_count}/{shelf.capacity}</span>
          </Box>
        ))}
      </Stack>
      <OccupancyBar used={rack.occupancy_used} total={rack.occupancy_total} compact />
    </Paper>
  );
}
