'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Customer, ItemFilters, ItemType, ItemWithLocation, ZoneWithStats } from '@shared/types';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LocationBadge } from '@/components/ui/LocationBadge';
import { Pagination } from '@/components/ui/Pagination';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { Table, type TableColumn } from '@/components/ui/Table';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

const PAGE_SIZE = 25;

export default function ItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ItemWithLocation[]>([]);
  const [total, setTotal] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [zones, setZones] = useState<ZoneWithStats[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ItemFilters>({ page: 1, per_page: PAGE_SIZE, sort_by: 'created_at', sort_order: 'desc' });

  useEffect(() => {
    void Promise.all([api.getCustomers(), api.getZones(), api.getItems({ per_page: 100, page: 1 })])
      .then(([customerResponse, zoneResponse, itemResponse]) => {
        setCustomers(customerResponse.data);
        setZones(zoneResponse.data);
        setMaterials(Array.from(new Set(itemResponse.data.map((item) => item.material).filter((material): material is string => Boolean(material)))).sort());
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    void api
      .getItems(filters)
      .then((response) => {
        setItems(response.data);
        setTotal(response.total);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  const columns = useMemo<TableColumn<ItemWithLocation>[]>(
    () => [
      { key: 'item_code', header: 'Item code', sortable: true, render: (item) => <span className="font-data font-medium">{item.item_code}</span> },
      { key: 'name', header: 'Name', sortable: true, render: (item) => item.name },
      { key: 'customer', header: 'Customer', sortable: true, render: (item) => item.customer_name || '-' },
      { key: 'material', header: 'Material', render: (item) => item.material || '-' },
      { key: 'type', header: 'Type', render: (item) => <Badge variant="primary">{item.type}</Badge> },
      { key: 'location', header: 'Location', sortable: true, render: (item) => <LocationBadge location={item.current_location} /> },
      {
        key: 'checked_in_at',
        header: 'Checked in',
        sortable: true,
        render: (item) => <span className="font-data text-[11px]">{formatDateTime(item.current_location?.checked_in_at || item.created_at)}</span>,
      },
    ],
    [],
  );

  const activeFilterCount = useMemo(
    () => [filters.search, filters.type, filters.customer_id, filters.zone_id, filters.material].filter(Boolean).length,
    [filters.customer_id, filters.material, filters.search, filters.type, filters.zone_id],
  );

  function updateFilter(next: Partial<ItemFilters>) {
    setFilters((current) => ({ ...current, ...next, page: next.page ?? 1 }));
  }

  function handleSort(key: string) {
    setFilters((current) => ({
      ...current,
      sort_by: key as ItemFilters['sort_by'],
      sort_order: current.sort_by === key && current.sort_order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }

  return (
    <div className="space-y-2.5">
      <section className="app-frame flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="app-page-title">Items</h1>
          <span className="text-[11px] uppercase tracking-[0.06em] text-app-textMuted">Inventory index</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-app-textMuted">
          <span>{total} rows</span>
          <span>{activeFilterCount} filters</span>
          <span>{filters.sort_order === 'asc' ? 'oldest first' : 'newest first'}</span>
        </div>
      </section>

      <SearchBar placeholder="Item code, item name, customer, or order number" value={filters.search || ''} onChange={(search) => updateFilter({ search })} />

      <FilterBar
        onClear={() =>
          setFilters({
            page: 1,
            per_page: PAGE_SIZE,
            sort_by: 'created_at',
            sort_order: 'desc',
          })
        }
      >
        <Select
          label="Type"
          value={filters.type || ''}
          onChange={(event) => updateFilter({ type: (event.target.value || undefined) as ItemType | undefined })}
          options={[
            { label: 'All types', value: '' },
            { label: 'Customer order', value: 'customer_order' },
            { label: 'General stock', value: 'general_stock' },
          ]}
        />
        <Select
          label="Customer"
          value={filters.customer_id || ''}
          onChange={(event) => updateFilter({ customer_id: event.target.value || undefined })}
          options={[{ label: 'All customers', value: '' }, ...customers.map((customer) => ({ label: customer.name, value: customer.id }))]}
        />
        <Select
          label="Zone"
          value={filters.zone_id || ''}
          onChange={(event) => updateFilter({ zone_id: event.target.value || undefined })}
          options={[{ label: 'All zones', value: '' }, ...zones.map((zone) => ({ label: `${zone.code} - ${zone.name}`, value: zone.id }))]}
        />
        <Select
          label="Material"
          value={filters.material || ''}
          onChange={(event) => updateFilter({ material: event.target.value || undefined })}
          options={[{ label: 'All materials', value: '' }, ...materials.map((material) => ({ label: material, value: material }))]}
        />
      </FilterBar>

      {loading ? (
        <div className="app-frame-soft flex items-center gap-2 px-3 py-3">
          <LoadingSpinner />
          <span className="text-[13px] text-app-textMuted">Loading items...</span>
        </div>
      ) : error ? (
        <EmptyState title="Unable to load items" description={error} />
      ) : items.length === 0 ? (
        <EmptyState title="No items matched this view" description="Try clearing the filters or shortening the search text." />
      ) : (
        <>
          <Table
            columns={columns}
            data={items}
            sortBy={filters.sort_by}
            sortOrder={filters.sort_order}
            onSort={handleSort}
            rowKey={(item) => item.id}
            onRowClick={(item) => router.push(`/items/${item.id}`)}
          />
          <Pagination currentPage={filters.page || 1} perPage={PAGE_SIZE} total={total} onPageChange={(page) => updateFilter({ page })} />
        </>
      )}
    </div>
  );
}
