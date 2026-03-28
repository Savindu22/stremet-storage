'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { EmptyState } from '@/components/ui/EmptyState';
import type { MapRack, MapZone } from './types';
import { RackDetailPanel } from './RackDetailPanel';
import { ZoneBlock } from './ZoneBlock';

interface FloorPlanProps {
  zones: MapZone[];
  searchQuery?: string;
}

export function FloorPlan({ zones, searchQuery = '' }: FloorPlanProps) {
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>(zones[0]?.id ?? null);
  const [selectedRack, setSelectedRack] = useState<MapRack | null>(null);

  const activeZoneId = useMemo(() => {
    if (!searchQuery.trim()) return expandedZoneId;
    return zones.find((zone) => zone.racks.some((rack) => rack.shelves.some((shelf) => shelf.items.some((item) => {
      const q = searchQuery.toLowerCase();
      return item.item_code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || (item.customer_name ?? '').toLowerCase().includes(q);
    }))))?.id ?? expandedZoneId;
  }, [expandedZoneId, searchQuery, zones]);

  if (zones.length === 0) return <EmptyState title="No zones available" description="Warehouse zones are not available yet." />;

  return (
    <Paper variant="outlined" sx={{ display: 'grid', gridTemplateColumns: { lg: 'minmax(0,1fr) 360px' } }}>
      <Box p={2.5}>
        <Typography variant="body2" color="text.secondary" mb={1.5}>Factory floor</Typography>
        <Box sx={{ position: 'relative', width: '100%', overflow: 'auto', bgcolor: 'grey.100', border: 1, borderColor: 'divider', borderRadius: 1, aspectRatio: '16 / 9' }}>
          {zones.map((zone) => (
            <ZoneBlock
              key={zone.id}
              zone={zone}
              expanded={activeZoneId === zone.id}
              searchQuery={searchQuery}
              onToggle={(id) => setExpandedZoneId((c) => (c === id ? null : id))}
              onRackSelect={setSelectedRack}
            />
          ))}
          <Typography variant="caption" color="text.secondary" sx={{ position: 'absolute', bottom: '4%', left: '4%' }}>[Loading dock]</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ position: 'absolute', bottom: '4%', right: '4%' }}>[Entrance]</Typography>
        </Box>
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <RackDetailPanel rack={selectedRack} searchQuery={searchQuery} onClose={() => setSelectedRack(null)} />
      </Box>
    </Paper>
  );
}
