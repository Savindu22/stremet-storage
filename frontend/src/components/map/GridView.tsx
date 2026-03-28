'use client';

import { useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import MuiTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { EmptyState } from '@/components/ui/EmptyState';
import type { MapShelf, MapZone } from './types';
import { OccupancyBar } from './OccupancyBar';
import { getOccupancyPalette, shelfHasSearchMatch } from './utils';

interface GridViewProps {
  zones: MapZone[];
  searchQuery?: string;
}

export function GridView({ zones, searchQuery = '' }: GridViewProps) {
  const [expandedZoneIds, setExpandedZoneIds] = useState<string[]>(zones.map((z) => z.id));
  const [expandedShelfId, setExpandedShelfId] = useState<string | null>(null);

  function toggleZone(zoneId: string) {
    setExpandedZoneIds((c) => (c.includes(zoneId) ? c.filter((id) => id !== zoneId) : [...c, zoneId]));
  }

  function renderShelfCell(shelf: MapShelf) {
    const palette = getOccupancyPalette(shelf.current_count, shelf.capacity);
    const highlight = shelfHasSearchMatch(shelf, searchQuery);
    const expanded = expandedShelfId === shelf.id;

    return (
      <TableCell key={shelf.id} sx={{ verticalAlign: 'top', bgcolor: highlight ? 'primary.50' : 'background.paper' }}>
        <Box
          onClick={() => setExpandedShelfId((c) => (c === shelf.id ? null : shelf.id))}
          sx={{ cursor: 'pointer', border: 1, p: 1, borderColor: palette.border, bgcolor: palette.fill, borderRadius: 1 }}
        >
          <Typography variant="body2" fontWeight={500}>{shelf.current_count === 0 ? 'Empty' : `${shelf.current_count} items`}</Typography>
          <Typography variant="caption" color="text.secondary">{shelf.current_count}/{shelf.capacity}</Typography>
        </Box>
        <Collapse in={expanded}>
          <Stack spacing={0.5} mt={1}>
            {shelf.items.length === 0 ? (
              <Typography variant="caption" color="text.secondary">No active items.</Typography>
            ) : (
              shelf.items.map((item) => (
                <Link key={item.id} href={item.item_href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 0.5, '&:hover': { bgcolor: 'action.hover' }, borderRadius: 0.5, px: 0.5, mx: -0.5 }}>
                    <Typography variant="body2" fontWeight={500} color="primary">{item.item_code}</Typography>
                    <Typography variant="caption" display="block">{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.customer_name ?? 'General stock'}</Typography>
                  </Box>
                </Link>
              ))
            )}
          </Stack>
        </Collapse>
      </TableCell>
    );
  }

  if (zones.length === 0) return <EmptyState title="No zones available" description="Warehouse zones are not available yet." />;

  return (
    <Stack spacing={2}>
      {zones.map((zone) => {
        const expanded = expandedZoneIds.includes(zone.id);
        return (
          <Paper key={zone.id} variant="outlined">
            <Box onClick={() => toggleZone(zone.id)} sx={{ p: 2, cursor: 'pointer', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton size="small">{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
              <Box flex={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle1">{zone.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{zone.code}</Typography>
                </Stack>
                <OccupancyBar used={zone.occupied_slots} total={zone.total_slots} compact />
              </Box>
            </Box>
            <Collapse in={expanded}>
              <TableContainer>
                <MuiTable size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rack</TableCell>
                      <TableCell>Shelf 1</TableCell>
                      <TableCell>Shelf 2</TableCell>
                      <TableCell>Shelf 3</TableCell>
                      <TableCell>Shelf 4</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {zone.racks.map((rack) => (
                      <TableRow key={rack.id}>
                        <TableCell sx={{ fontWeight: 500 }}>{rack.code}</TableCell>
                        {rack.shelves.sort((a, b) => a.shelf_number - b.shelf_number).map(renderShelfCell)}
                      </TableRow>
                    ))}
                  </TableBody>
                </MuiTable>
              </TableContainer>
            </Collapse>
          </Paper>
        );
      })}
    </Stack>
  );
}
