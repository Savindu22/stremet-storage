'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ActionType, ActivityFilters, ActivityLogWithItem } from '@shared/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Table, type TableColumn } from '@/components/ui/Table';
import { api } from '@/lib/api';
import { formatDateTime, toTitleCase } from '@/lib/utils';

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
      .then((response) => {
        setEntries(response.data);
        setTotal(response.total);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  const columns = useMemo<TableColumn<ActivityLogWithItem>[]>(
    () => [
      { key: 'created_at', header: 'Timestamp', sortable: true, render: (entry) => <span className="font-data text-[11px]">{formatDateTime(entry.created_at)}</span> },
      { key: 'action', header: 'Action', render: (entry) => toTitleCase(entry.action) },
      {
        key: 'item_code',
        header: 'Item code',
        render: (entry) => (
          <Link className="font-data text-app-primary hover:underline" href={`/items/${entry.item_id}`} onClick={(event) => event.stopPropagation()}>
            {entry.item_code}
          </Link>
        ),
      },
      { key: 'from_location', header: 'From', render: (entry) => <span className="text-[12px]">{entry.from_location || '-'}</span> },
      { key: 'to_location', header: 'To', render: (entry) => <span className="text-[12px]">{entry.to_location || '-'}</span> },
      { key: 'performed_by', header: 'By', render: (entry) => entry.performed_by },
      { key: 'notes', header: 'Notes', render: (entry) => <span className="text-[12px]">{entry.notes || '-'}</span> },
    ],
    [],
  );

  const activeFilterCount = useMemo(
    () => [filters.action, filters.performed_by, filters.date_from, filters.date_to].filter(Boolean).length,
    [filters.action, filters.date_from, filters.date_to, filters.performed_by],
  );

  function updateFilter(next: Partial<ActivityFilters>) {
    setFilters((current) => ({ ...current, ...next, page: next.page ?? 1 }));
  }

  return (
    <div className="space-y-2.5">
      <section className="app-frame flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="app-page-title">Activity</h1>
          <span className="text-[11px] uppercase tracking-[0.06em] text-app-textMuted">Audit trail</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-app-textMuted">
          <span>{total} rows</span>
          <span>{activeFilterCount} filters</span>
          <span>newest first</span>
        </div>
      </section>

      <FilterBar onClear={() => setFilters({ page: 1, per_page: PAGE_SIZE, sort_order: 'desc' })}>
        <Select
          label="Action"
          value={filters.action || ''}
          onChange={(event) => updateFilter({ action: (event.target.value || undefined) as ActionType | undefined })}
          options={[
            { label: 'All actions', value: '' },
            { label: 'Check in', value: 'check_in' },
            { label: 'Check out', value: 'check_out' },
            { label: 'Move', value: 'move' },
            { label: 'Note added', value: 'note_added' },
          ]}
        />
        <Input label="Worker" value={filters.performed_by || ''} onChange={(event) => updateFilter({ performed_by: event.target.value || undefined })} />
        <Input label="From date" type="date" value={filters.date_from || ''} onChange={(event) => updateFilter({ date_from: event.target.value || undefined })} />
        <Input label="To date" type="date" value={filters.date_to || ''} onChange={(event) => updateFilter({ date_to: event.target.value || undefined })} />
      </FilterBar>

      {loading ? (
        <div className="app-frame-soft flex items-center gap-2 px-3 py-3">
          <LoadingSpinner />
          <span className="text-[13px] text-app-textMuted">Loading activity...</span>
        </div>
      ) : error ? (
        <EmptyState title="Unable to load activity" description={error} />
      ) : entries.length === 0 ? (
        <EmptyState title="No activity matched this view" description="Widen the date range or clear the worker and action filters." />
      ) : (
        <>
          <Table columns={columns} data={entries} rowKey={(entry) => entry.id} />
          <Pagination currentPage={filters.page || 1} perPage={PAGE_SIZE} total={total} onPageChange={(page) => updateFilter({ page })} />
        </>
      )}
    </div>
  );
}
