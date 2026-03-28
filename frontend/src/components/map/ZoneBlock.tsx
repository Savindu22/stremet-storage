'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { MapRack, MapZone } from './types';
import { OccupancyBar } from './OccupancyBar';
import { RackBox } from './RackBox';
import { getOccupancyPalette, getZoneOccupancyPercent, zoneHasSearchMatch } from './utils';

interface ZoneBlockProps {
  zone: MapZone;
  expanded: boolean;
  searchQuery?: string;
  onToggle: (zoneId: string) => void;
  onRackSelect: (rack: MapRack) => void;
}

export function ZoneBlock({ zone, expanded, searchQuery = '', onToggle, onRackSelect }: ZoneBlockProps) {
  const palette = getOccupancyPalette(zone.occupied_slots, zone.total_slots);
  const highlight = zoneHasSearchMatch(zone, searchQuery);

  return (
    <Box
      title={`${zone.name} | ${zone.rack_count} racks | ${zone.total_items} items | ${getZoneOccupancyPercent(zone)}% occupied`}
      sx={{
        position: 'absolute',
        left: `${zone.position_x}%`,
        top: `${zone.position_y}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
        border: 2,
        borderColor: highlight ? 'primary.main' : palette.border,
        bgcolor: highlight ? '#DBEAFE' : palette.fill,
        borderRadius: 1,
        p: 1.5,
        display: 'grid',
        alignContent: 'start',
        gap: 1,
        overflow: 'auto',
      }}
    >
      <Box onClick={() => onToggle(zone.id)} sx={{ cursor: 'pointer' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>{zone.name}</Typography>
            <Typography variant="caption" color="text.secondary">{zone.code}</Typography>
          </Box>
          <Typography variant="caption" fontWeight={500} sx={{ color: palette.accent }}>{zone.occupied_slots}/{zone.total_slots} slots</Typography>
        </Stack>
        <OccupancyBar used={zone.occupied_slots} total={zone.total_slots} compact />
      </Box>
      <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Typography variant="caption" color="text.secondary">{zone.rack_count} racks · {zone.total_items} items</Typography>
        <Link href={`/zones/${zone.id}`} style={{ fontSize: 12, color: '#1565C0' }}>Open zone</Link>
      </Stack>
      {expanded ? (
        <Grid container spacing={1}>
          {zone.racks.map((rack) => (
            <Grid size={{ xs: 12, xl: zone.racks.length > 2 ? 6 : 12 }} key={rack.id}>
              <RackBox rack={rack} searchQuery={searchQuery} onSelect={onRackSelect} />
            </Grid>
          ))}
        </Grid>
      ) : null}
    </Box>
  );
}
