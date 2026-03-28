'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import type { MachineWithItemCount } from '@shared/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Table, type TableColumn } from '@/components/ui/Table';
import { api } from '@/lib/api';
import { machineCategoryLabel } from '@/lib/utils';

const categoryColors: Record<string, 'primary' | 'secondary' | 'warning' | 'error' | 'success'> = {
  sheet_metal: 'secondary',
  cutting: 'error',
  laser: 'primary',
  robot_bending: 'warning',
  bending: 'success',
};

const columns: TableColumn<MachineWithItemCount>[] = [
  {
    key: 'code',
    header: 'Code',
    render: (row) => (
      <Typography variant="body2" fontFamily="monospace" fontWeight={600}>{row.code}</Typography>
    ),
  },
  {
    key: 'name',
    header: 'Name',
    render: (row) => row.name,
  },
  {
    key: 'category',
    header: 'Category',
    render: (row) => (
      <Chip
        label={machineCategoryLabel(row.category)}
        size="small"
        color={categoryColors[row.category] || 'default'}
        variant="outlined"
      />
    ),
  },
  {
    key: 'description',
    header: 'Description',
    render: (row) => (
      <Typography variant="body2" color="text.secondary">{row.description || '-'}</Typography>
    ),
  },
  {
    key: 'active_items',
    header: 'Items',
    render: (row) => (
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" fontWeight={600}>{row.active_items}</Typography>
        {row.total_quantity > 0 ? (
          <Typography variant="caption" color="text.secondary">({row.total_quantity} pcs)</Typography>
        ) : null}
      </Stack>
    ),
  },
];

export default function MachinesPage() {
  const router = useRouter();
  const [machines, setMachines] = useState<MachineWithItemCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.getMachines()
      .then((r) => setMachines(r.data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <LoadingSpinner />
        <Typography variant="body2" color="text.secondary">Loading machines...</Typography>
      </Paper>
    );
  }

  if (error) {
    return <EmptyState title="Unable to load machines" description={error} />;
  }

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <PrecisionManufacturingIcon sx={{ color: 'text.secondary' }} />
          <div>
            <Typography variant="h3">Machines</Typography>
            <Typography variant="body2" color="text.secondary">{machines.length} machines across the workshop</Typography>
          </div>
        </Stack>
      </Paper>

      <Paper variant="outlined">
        <Table columns={columns} data={machines} rowKey={(row) => row.id} onRowClick={(row) => router.push(`/machines/${row.id}`)} />
      </Paper>
    </Stack>
  );
}
