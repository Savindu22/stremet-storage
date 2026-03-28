'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ActionType, ActivityFilters, ActivityLogWithItem } from '@shared/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Table, type TableColumn } from '@/components/ui/Table';
import { api } from '@/lib/api';
import { actionLabel, formatDateTime } from '@/lib/utils';

const PAGE_SIZE = 50;

export default function ActivityPage() {
  const [entries, setEntries] = useState<ActivityLogWithItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>({ page: 1, per_page: PAGE_SIZE, sort_order: 'desc' });

  useEffect(() => {
    setLoading(true);
    setError(null);
    void api
      .getActivity(filters)
      .then((response) => { setEntries(response.data); setTotal(response.total); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  const columns = useMemo<TableColumn<ActivityLogWithItem>[]>(
    () => [
      { key: 'created_at', header: 'Timestamp', sortable: true, render: (entry) => <Typography variant="caption">{formatDateTime(entry.created_at)}</Typography> },
      { key: 'action', header: 'Action', render: (entry) => actionLabel(entry.action) },
      {
        key: 'item_code',
        header: 'Item code',
        render: (entry) => (
          <Link href={`/items/${entry.item_id}`} style={{ color: '#1565C0' }} onClick={(e) => e.stopPropagation()}>
            {entry.item_code}
          </Link>
        ),
      },
      { key: 'from_location', header: 'From', render: (entry) => <Typography variant="caption" fontWeight={entry.from_location ? 700 : 400}>{entry.from_location || '-'}</Typography> },
      { key: 'to_location', header: 'To', render: (entry) => <Typography variant="caption" fontWeight={entry.to_location ? 700 : 400}>{entry.to_location || '-'}</Typography> },
      { key: 'performed_by', header: 'Performed by', render: (entry) => entry.performed_by },
      { key: 'notes', header: 'Notes', render: (entry) => <Typography variant="caption">{entry.notes || '-'}</Typography> },
    ],
    [],
  );

  function updateFilter(next: Partial<ActivityFilters>) {
    setFilters((current) => ({ ...current, ...next, page: next.page ?? 1 }));
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h3">Activity log</Typography>
        <Typography variant="caption" color="text.secondary">{total} entries</Typography>
      </Stack>

      <FilterBar onClear={() => setFilters({ page: 1, per_page: PAGE_SIZE, sort_order: 'desc' })}>
        <Select label="Action" value={filters.action || ''} onChange={(event: any) => updateFilter({ action: (event.target.value || undefined) as ActionType | undefined })} options={[{ label: 'All actions', value: '' }, { label: 'Check in', value: 'check_in' }, { label: 'Check out', value: 'check_out' }, { label: 'Move', value: 'move' }, { label: 'Note added', value: 'note_added' }]} />
        <Input label="Worker name" value={filters.performed_by || ''} onChange={(event: any) => updateFilter({ performed_by: event.target.value || undefined })} />
        <Input label="From date" type="date" value={filters.date_from || ''} onChange={(event: any) => updateFilter({ date_from: event.target.value || undefined })} />
        <Input label="To date" type="date" value={filters.date_to || ''} onChange={(event: any) => updateFilter({ date_to: event.target.value || undefined })} />
      </FilterBar>

      {loading ? (
        <Paper variant="outlined" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <LoadingSpinner />
          <Typography variant="body2" color="text.secondary">Loading activity...</Typography>
        </Paper>
      ) : error ? (
        <EmptyState title="Unable to load activity" description={error} />
      ) : entries.length === 0 ? (
        <EmptyState title="No activity found" description="Try widening the date range or clearing filters." />
      ) : (
        <>
          <Table columns={columns} data={entries} rowKey={(entry) => entry.id} />
          <Pagination currentPage={filters.page || 1} perPage={PAGE_SIZE} total={total} onPageChange={(page) => updateFilter({ page })} />
        </>
      )}
    </Stack>
  );
}
