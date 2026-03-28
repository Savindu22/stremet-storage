import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getOccupancyRatio } from './utils';

interface OccupancyBarProps {
  used: number;
  total: number;
  label?: string;
  compact?: boolean;
}

export function OccupancyBar({ used, total, label, compact = false }: OccupancyBarProps) {
  const ratio = getOccupancyRatio(used, total);
  const pct = Math.min(100, Math.round(ratio * 100));
  const color = pct >= 90 ? 'error' : pct >= 60 ? 'warning' : 'success';

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={0.25}>
        <Typography variant="caption" color="text.secondary">{label ?? 'Occupancy'}</Typography>
        <Typography variant="caption" color="text.secondary">{used}/{total}</Typography>
      </Stack>
      <LinearProgress variant="determinate" value={pct} color={color} sx={{ height: compact ? 4 : 6, borderRadius: 2 }} />
    </Box>
  );
}
