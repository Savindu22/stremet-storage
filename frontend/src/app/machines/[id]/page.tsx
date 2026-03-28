'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import ScheduleIcon from '@mui/icons-material/ScheduleOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningIcon from '@mui/icons-material/WarningAmberOutlined';
import type { ActivityLog } from '@shared/types';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { formatDateTime, machineCategoryLabel } from '@/lib/utils';

interface MachineItem {
  assignment_id: string;
  item_id: string;
  item_code: string;
  item_name: string;
  customer_name: string | null;
  material: string;
  dimensions: string;
  weight_kg: number;
  quantity: number;
  assigned_at: string;
  assigned_by: string;
  notes: string | null;
}

interface MachineActivity extends ActivityLog {
  item_code: string;
  item_name: string;
}

interface MachineStats {
  active_assignments: number;
  total_pieces: number;
  completed_assignments: number;
  oldest_assignment: string | null;
}

interface MachineDetail {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  created_at: string;
  updated_at: string;
  items: MachineItem[];
  activity: MachineActivity[];
  stats: MachineStats;
}

const categoryColors: Record<string, 'primary' | 'secondary' | 'warning' | 'error' | 'success'> = {
  sheet_metal: 'secondary',
  cutting: 'error',
  laser: 'primary',
  robot_bending: 'warning',
  bending: 'success',
};

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function MachineDetailPage() {
  const params = useParams<{ id: string }>();
  const [machine, setMachine] = useState<MachineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    void api.getMachine(params.id)
      .then((r) => setMachine(r.data as unknown as MachineDetail))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <LoadingSpinner />
        <Typography variant="body2" color="text.secondary">Loading machine...</Typography>
      </Paper>
    );
  }

  if (error || !machine) {
    return <EmptyState title="Unable to load machine" description={error || 'Machine not found'} />;
  }

  const oldestDays = daysSince(machine.stats.oldest_assignment);

  return (
    <Stack spacing={2.5}>
      {/* Header */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <PrecisionManufacturingIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
            <Box>
              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                <Typography variant="h3">{machine.name}</Typography>
                <Chip
                  label={machineCategoryLabel(machine.category)}
                  size="small"
                  color={categoryColors[machine.category] || 'default'}
                  variant="outlined"
                />
              </Stack>
              <Stack direction="row" spacing={2} mt={0.5} flexWrap="wrap">
                <Typography variant="body2" fontFamily="monospace" fontWeight={500}>{machine.code}</Typography>
                <Typography variant="body2" color="text.secondary">{machine.description}</Typography>
              </Stack>
            </Box>
          </Stack>
          <Link href="/machines" style={{ fontSize: 13, color: '#1565C0', textDecoration: 'none' }}>All machines</Link>
        </Stack>
      </Paper>

      {/* Stats cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <InventoryIcon sx={{ color: 'primary.main', mb: 0.5 }} />
            <Typography variant="h2">{machine.stats.active_assignments}</Typography>
            <Typography variant="caption" color="text.secondary">Items at machine</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <PrecisionManufacturingIcon sx={{ color: 'secondary.main', mb: 0.5 }} />
            <Typography variant="h2">{machine.stats.total_pieces}</Typography>
            <Typography variant="caption" color="text.secondary">Total pieces</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ color: 'success.main', mb: 0.5 }} />
            <Typography variant="h2">{machine.stats.completed_assignments}</Typography>
            <Typography variant="caption" color="text.secondary">Completed jobs</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            {oldestDays !== null && oldestDays > 7 ? (
              <WarningIcon sx={{ color: 'warning.main', mb: 0.5 }} />
            ) : (
              <ScheduleIcon sx={{ color: 'text.secondary', mb: 0.5 }} />
            )}
            <Typography variant="h2">{oldestDays !== null ? `${oldestDays}d` : '-'}</Typography>
            <Typography variant="caption" color="text.secondary">Oldest item age</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Content grid */}
      <Grid container spacing={2.5}>
        {/* Items at machine */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">Items being processed</Typography>
                <Typography variant="caption" color="text.secondary">{machine.items.length} items</Typography>
              </Stack>

              {machine.items.length === 0 ? (
                <EmptyState title="No items" description="This machine has no items assigned to it." />
              ) : (
                <Stack divider={<Divider />}>
                  {machine.items.map((item) => {
                    const days = daysSince(item.assigned_at);
                    return (
                      <Box key={item.assignment_id} py={1.5}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Link href={`/items/${item.item_id}`} style={{ textDecoration: 'none' }}>
                              <Typography variant="body2" fontFamily="monospace" fontWeight={600} color="primary" sx={{ '&:hover': { textDecoration: 'underline' } }}>
                                {item.item_code}
                              </Typography>
                            </Link>
                            <Typography variant="body2" mt={0.25}>{item.item_name}</Typography>
                            <Stack direction="row" spacing={1.5} mt={0.5} flexWrap="wrap">
                              <Typography variant="caption" color="text.secondary">{item.customer_name || 'General stock'}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.material}</Typography>
                              {item.dimensions ? <Typography variant="caption" color="text.secondary">{item.dimensions}</Typography> : null}
                            </Stack>
                          </Box>
                          <Stack alignItems="flex-end" spacing={0.5}>
                            <Chip label={`${item.quantity} pcs`} size="small" variant="outlined" />
                            {days !== null && days > 7 ? (
                              <Typography variant="caption" color="warning.main" fontWeight={600}>{days} days</Typography>
                            ) : days !== null ? (
                              <Typography variant="caption" color="text.secondary">{days} days</Typography>
                            ) : null}
                          </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1.5} mt={0.5}>
                          <Typography variant="caption" color="text.secondary">Assigned by {item.assigned_by} on {formatDateTime(item.assigned_at)}</Typography>
                        </Stack>
                        {item.notes ? <Typography variant="caption" color="text.secondary" mt={0.5} display="block">Note: {item.notes}</Typography> : null}
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Activity */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">Recent activity</Typography>
                <Typography variant="caption" color="text.secondary">{machine.activity.length} entries</Typography>
              </Stack>

              <Box sx={{ maxHeight: 520, overflow: 'auto' }}>
                {machine.activity.length === 0 ? (
                  <EmptyState title="No activity" description="No recorded moves to or from this machine." />
                ) : (
                  <Stack divider={<Divider />}>
                    {machine.activity.map((entry) => (
                      <Box key={entry.id} py={1.5}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Badge variant={entry.to_location?.startsWith('M/') ? 'warning' : 'success'}>
                            {entry.to_location === `M/${machine.code}` ? 'received' : 'sent out'}
                          </Badge>
                          <Typography variant="caption" fontFamily="monospace" color="text.secondary">{formatDateTime(entry.created_at)}</Typography>
                        </Stack>
                        <Link href={`/items/${entry.item_id}`} style={{ textDecoration: 'none' }}>
                          <Typography variant="body2" fontWeight={500} mt={0.5} color="primary" sx={{ '&:hover': { textDecoration: 'underline' } }}>
                            {entry.item_code} — {entry.item_name}
                          </Typography>
                        </Link>
                        <Typography variant="caption" color="text.secondary">
                          {entry.from_location || '-'} → {entry.to_location || '-'}
                        </Typography>
                        {entry.notes ? <Typography variant="body2" mt={0.5}>{entry.notes}</Typography> : null}
                        <Typography variant="caption" color="text.secondary" display="block">{entry.performed_by}</Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
