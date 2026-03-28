'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import MuiButton from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getRackMapData } from './api';
import type { MapRack } from './types';
import { ShelfRow } from './ShelfRow';

interface RackDetailPanelProps {
  rack: MapRack | null;
  searchQuery?: string;
  onClose: () => void;
}

export function RackDetailPanel({ rack, searchQuery = '', onClose }: RackDetailPanelProps) {
  const [rackDetail, setRackDetail] = useState<MapRack | null>(rack);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!rack) { setRackDetail(null); return; }
    let active = true;
    setRackDetail(rack);
    setLoading(true);
    void getRackMapData(rack.id)
      .then((r) => { if (active) setRackDetail(r); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [rack]);

  if (!rack) return null;

  return (
    <Box sx={{ p: 2.5, borderTop: { xs: 1, lg: 0 }, borderLeft: { lg: 1 }, borderColor: 'divider', height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="h3">{rack.code}</Typography>
          <Typography variant="body2" color="text.secondary">{rack.zone_name}</Typography>
        </Box>
        <MuiButton size="small" variant="outlined" onClick={onClose}>Close</MuiButton>
      </Stack>
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Typography variant="body2" color="text.secondary">{rack.shelves.length} shelves</Typography>
        <MuiButton component={Link} href={`/check-in?rack=${encodeURIComponent(rack.id)}`} size="small">Check in to this rack</MuiButton>
      </Stack>
      {loading ? (
        <Paper variant="outlined" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <LoadingSpinner />
          <Typography variant="body2" color="text.secondary">Loading rack details</Typography>
        </Paper>
      ) : !rackDetail ? (
        <EmptyState title="Unable to load rack" description="Rack details are not available right now." />
      ) : (
        <Stack spacing={1.5}>
          {[...rackDetail.shelves].sort((a, b) => b.shelf_number - a.shelf_number).map((shelf) => (
            <ShelfRow key={shelf.id} shelf={shelf} searchQuery={searchQuery} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
