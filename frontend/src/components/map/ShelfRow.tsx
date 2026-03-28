import Link from 'next/link';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import MuiButton from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { MapShelf } from './types';
import { OccupancyBar } from './OccupancyBar';
import { shelfHasSearchMatch } from './utils';

interface ShelfRowProps {
  shelf: MapShelf;
  searchQuery?: string;
}

export function ShelfRow({ shelf, searchQuery = '' }: ShelfRowProps) {
  const highlight = shelfHasSearchMatch(shelf, searchQuery);
  const hasSpace = shelf.current_count < shelf.capacity;

  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: highlight ? 'primary.main' : 'divider', bgcolor: highlight ? 'primary.50' : 'background.paper' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle2">Shelf {shelf.shelf_number}</Typography>
        {hasSpace ? (
          <MuiButton component={Link} href={shelf.checkin_href} size="small" variant="outlined">
            Check in here
          </MuiButton>
        ) : (
          <Chip label="FULL" size="small" color="error" />
        )}
      </Stack>

      <OccupancyBar used={shelf.current_count} total={shelf.capacity} compact />
      <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
        Capacity {shelf.current_count}/{shelf.capacity}
      </Typography>

      {shelf.items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" mt={1}>No active items on this shelf.</Typography>
      ) : (
        <Stack spacing={1} mt={1.5} divider={<Divider />}>
          {shelf.items.map((item) => (
            <Box key={item.id}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Link href={item.item_href} style={{ fontWeight: 500, color: '#1565C0', fontSize: 14 }}>
                  {item.item_code}
                </Link>
                <Typography variant="caption">{item.quantity} pcs</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{item.unit_code}</Typography>
              <Typography variant="body2">{item.name}</Typography>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">{item.customer_name ?? 'General stock'}</Typography>
                <MuiButton component={Link} href={item.checkout_href} size="small" color="error">Check out</MuiButton>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
