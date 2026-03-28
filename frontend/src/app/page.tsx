'use client';

import { useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getWarehouseMapData } from '../components/map/api';
import { GridView } from '../components/map/GridView';
import { MapStats } from '../components/map/MapStats';
import type { WarehouseMapData } from '../components/map/types';

export default function HomePage() {
  const [data, setData] = useState<WarehouseMapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getWarehouseMapData()
      .then((result) => { if (active) setData(result); })
      .catch((err: Error) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  if (!data) {
    if (error) return <EmptyState title="Unable to load storage grid" description={error} />;
    return (
      <Paper variant="outlined" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <LoadingSpinner />
        <Typography variant="body2" color="text.secondary">Loading rack data...</Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Typography variant="h3">Storage grid</Typography>
        <MapStats stats={data.stats} />
      </Stack>
      <GridView racks={data.racks} />
    </Stack>
  );
}
