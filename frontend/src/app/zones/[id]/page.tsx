'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import MuiButton from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getZoneMapData } from '../../../components/map/api';
import { OccupancyBar } from '../../../components/map/OccupancyBar';
import { RackBox } from '../../../components/map/RackBox';
import { ShelfRow } from '../../../components/map/ShelfRow';
import type { MapRack, MapZone } from '../../../components/map/types';

export default function ZoneDetailPage() {
  const params = useParams<{ id: string }>();
  const [zone, setZone] = useState<MapZone | null>(null);
  const [selectedRack, setSelectedRack] = useState<MapRack | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    let active = true;
    setLoaded(false);
    setError(null);
    void getZoneMapData(params.id)
      .then((result) => { if (!active) return; setZone(result); setSelectedRack(result.racks[0] ?? null); setLoaded(true); })
      .catch((err: Error) => { if (active) { setError(err.message); setZone(null); setLoaded(true); } });
    return () => { active = false; };
  }, [params.id]);

  if (!loaded) {
    return (
      <Paper variant="outlined" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <LoadingSpinner />
        <Typography variant="body2" color="text.secondary">Loading zone</Typography>
      </Paper>
    );
  }

  if (!zone) return <EmptyState title="Unable to load zone" description={error || 'Zone not found.'} />;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'flex-start' }} spacing={2}>
        <div>
          <Typography variant="h2">{zone.name}</Typography>
          <Typography variant="body2" color="text.secondary" maxWidth={600} mt={0.5}>{zone.description}</Typography>
        </div>
        <MuiButton component={Link} href={`/check-in?zone=${encodeURIComponent(zone.id)}`} variant="contained">
          Check in to this zone
        </MuiButton>
      </Stack>

      <Card>
        <CardContent>
          <Stack direction="row" spacing={3} flexWrap="wrap" mb={1.5}>
            <Typography variant="body2">{zone.rack_count} racks</Typography>
            <Typography variant="body2">{zone.total_items} items stored</Typography>
            <Typography variant="body2">{zone.occupied_slots}/{zone.total_slots} slots occupied</Typography>
          </Stack>
          <OccupancyBar used={zone.occupied_slots} total={zone.total_slots} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" mb={0.5}>Rack layout</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>Select a rack to inspect shelves and items.</Typography>
          <Grid container spacing={2}>
            {zone.racks.map((rack) => (
              <Grid size={{ xs: 6, md: 4, xl: 2.4 }} key={rack.id}>
                <RackBox rack={rack} onSelect={setSelectedRack} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {selectedRack ? (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1">{selectedRack.code}</Typography>
              <MuiButton component={Link} href={`/check-in?rack=${encodeURIComponent(selectedRack.id)}`} size="small">
                Check in to this rack
              </MuiButton>
            </Stack>
            <Stack spacing={1.5}>
              {[...selectedRack.shelves].sort((a, b) => b.shelf_number - a.shelf_number).map((shelf) => (
                <ShelfRow key={shelf.id} shelf={shelf} />
              ))}
            </Stack>
          </CardContent>
        </Card>
      ) : null}
    </Stack>
  );
}
