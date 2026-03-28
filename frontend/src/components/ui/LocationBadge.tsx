import Chip from '@mui/material/Chip';
import PlaceIcon from '@mui/icons-material/PlaceOutlined';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import { locationLabel } from '@/lib/utils';

type LocationBadgeProps = {
  location?: {
    zone_name?: string | null;
    zone_code?: string | null;
    rack_code?: string | null;
    shelf_number?: number | null;
  } | null;
};

type MachineLocationBadgeProps = {
  code: string;
  name?: string;
};

export function LocationBadge({ location }: LocationBadgeProps) {
  const label = locationLabel(location);
  const inStorage = label !== 'Not in storage';

  return (
    <Chip
      icon={<PlaceIcon sx={{ fontSize: 16 }} />}
      label={label}
      size="small"
      variant={inStorage ? 'outlined' : 'filled'}
      color={inStorage ? 'primary' : 'default'}
      sx={{
        alignSelf: 'flex-start',
        width: 'fit-content',
        maxWidth: '100%',
        fontFamily: 'monospace',
        fontSize: '0.75rem',
      }}
    />
  );
}

export function MachineLocationBadge({ code, name }: MachineLocationBadgeProps) {
  return (
    <Chip
      icon={<PrecisionManufacturingIcon sx={{ fontSize: 16 }} />}
      label={name ? `${code} — ${name}` : code}
      size="small"
      variant="outlined"
      color="warning"
      sx={{
        alignSelf: 'flex-start',
        width: 'fit-content',
        maxWidth: '100%',
        fontFamily: 'monospace',
        fontSize: '0.75rem',
      }}
    />
  );
}
