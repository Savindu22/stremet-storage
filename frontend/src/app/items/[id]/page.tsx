'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import type { ItemDetail, ZoneWithStats } from '@shared/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LocationBadge } from '@/components/ui/LocationBadge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { api, type ZoneDetail } from '@/lib/api';
import { formatDateTime, formatNumber, locationLabel } from '@/lib/utils';

const infoRows = (item: ItemDetail) => [
  ['Material', item.material || '-'],
  ['Dimensions', item.dimensions || '-'],
  ['Weight', formatNumber(item.weight_kg, ' kg')],
  ['Quantity', String(item.quantity)],
  ['Order number', item.order_number || '-'],
  ['Customer', item.customer_name || '-'],
];

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [zones, setZones] = useState<ZoneWithStats[]>([]);
  const [zoneDetail, setZoneDetail] = useState<ZoneDetail | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [moveNotes, setMoveNotes] = useState('');
  const [moveQuantity, setMoveQuantity] = useState(1);
  const [moveOpen, setMoveOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentZoneId = useMemo(() => {
    if (!item?.current_location?.zone_code) {
      return '';
    }

    return zones.find((zone) => zone.code === item.current_location?.zone_code)?.id || '';
  }, [item?.current_location?.zone_code, zones]);

  useEffect(() => {
    if (!params.id) {
      return;
    }

    setLoading(true);
    void Promise.all([api.getItem(params.id), api.getZones()])
      .then(([itemResponse, zoneResponse]) => {
        setItem(itemResponse.data);
        setZones(zoneResponse.data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!selectedZoneId) {
      setZoneDetail(null);
      return;
    }

    void api.getZone(selectedZoneId).then((response) => setZoneDetail(response.data));
  }, [selectedZoneId]);

  const availableSlots = useMemo(
    () =>
      zoneDetail?.racks.flatMap((rack) =>
        rack.shelves
          .filter((shelf) => shelf.current_count < shelf.capacity)
          .map((shelf) => ({ id: shelf.id, label: `${rack.code} > Shelf ${shelf.shelf_number} (${shelf.capacity - shelf.current_count} free)` })),
      ) || [],
    [zoneDetail],
  );

  async function handleMove() {
    if (!item?.current_location?.assignment_id || !selectedSlotId || !workerName) {
      showToast('Worker name and destination are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const totalQty = item.current_location.quantity ?? 1;
      const response = await api.moveItem({
        assignment_id: item.current_location.assignment_id,
        to_shelf_slot_id: selectedSlotId,
        performed_by: workerName,
        notes: moveNotes || undefined,
        quantity: moveQuantity,
      });
      const refreshed = await api.getItem(params.id);
      setItem(refreshed.data);
      setMoveOpen(false);
      setSelectedSlotId('');
      setMoveNotes('');
      setMoveQuantity(refreshed.data.current_location?.quantity ?? 1);
      const label = moveQuantity < totalQty ? `${moveQuantity} of ${totalQty} moved to ${response.data.to}` : `Item moved to ${response.data.to}`;
      showToast(label);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Move failed', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="app-frame-soft flex items-center gap-2 px-3 py-3">
        <LoadingSpinner />
        <span className="text-[13px] text-app-textMuted">Loading item...</span>
      </div>
    );
  }

  if (error || !item) {
    return <EmptyState title="Unable to load item" description={error || 'Item not found'} />;
  }

  return (
    <div className="space-y-2.5">
      <section className="app-frame px-3 py-2.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="app-page-title">{item.name}</h1>
              <Badge variant="primary">{item.type}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-app-textMuted">
              <span className="font-data text-app-text">{item.item_code}</span>
              <span>{item.customer_name || 'No customer assigned'}</span>
              {item.order_number ? <span>Order {item.order_number}</span> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.current_location?.assignment_id ? (
              <Link href={`/check-out/${item.id}`}>
                <Button variant="danger">Check out</Button>
              </Link>
            ) : null}
            {item.current_location?.assignment_id ? (
              <Button variant="secondary" onClick={() => { setMoveQuantity(item.current_location?.quantity ?? 1); setMoveOpen(true); }}>
                Move
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)]">
        <section className="app-frame px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="app-section-title">Current record</h2>
            {currentZoneId ? (
              <Link className="text-[12px] font-medium text-app-primary hover:underline" href={`/zones/${currentZoneId}`}>
                Open zone
              </Link>
            ) : null}
          </div>

          <div className="app-panel-grid sm:grid-cols-2 xl:grid-cols-3">
            <div className="px-3 py-2.5 sm:col-span-2 xl:col-span-3">
              <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">Current location</div>
              <div className="mt-1.5">{item.current_location ? <LocationBadge location={item.current_location} /> : <span className="text-[13px] text-app-textMuted">Not in storage</span>}</div>
            </div>
            {infoRows(item).map(([label, value]) => (
              <div key={label} className="px-3 py-2.5">
                <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">{label}</dt>
                <dd className="mt-1 text-[13px] text-app-text">{value}</dd>
              </div>
            ))}
          </div>
        </section>

        <section className="app-frame px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="app-section-title">Activity</h2>
            <span className="text-[11px] text-app-textMuted">{item.activity_history.length} entries</span>
          </div>

          <div className="max-h-[560px] overflow-y-auto border border-app-borderLight bg-app-panelMuted">
            {item.activity_history.length === 0 ? (
              <div className="p-3">
                <EmptyState title="No activity yet" description="This item has no recorded moves, check-ins, or check-outs yet." />
              </div>
            ) : (
              item.activity_history.map((entry) => (
                <div key={entry.id} className="border-b border-app-borderLight px-3 py-2.5 last:border-b-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={entry.action === 'check_out' ? 'danger' : entry.action === 'check_in' ? 'success' : 'default'}>{entry.action}</Badge>
                    <span className="font-data text-[11px] text-app-textMuted">{formatDateTime(entry.created_at)}</span>
                  </div>
                  <p className="mt-1 text-[13px] font-medium text-app-text">{entry.performed_by}</p>
                  <p className="mt-0.5 text-[12px] text-app-textMuted">
                    {entry.action === 'move' ? `${entry.from_location || '-'} \u2192 ${entry.to_location || '-'}` : entry.to_location || entry.from_location || '-'}
                  </p>
                  {entry.notes ? <p className="mt-1 text-[13px] text-app-text">{entry.notes}</p> : null}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <Modal open={moveOpen} title="Move item" confirmLabel={submitting ? 'Moving...' : 'Confirm move'} onConfirm={handleMove} onClose={() => setMoveOpen(false)}>
        <div className="space-y-3">
          <div className="app-inset px-3 py-2 text-[13px] text-app-text">
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">Current location</div>
            <div className="mt-1">{locationLabel(item.current_location)} — {item.current_location?.quantity ?? 1} in storage</div>
          </div>
          {(item.current_location?.quantity ?? 1) > 1 ? (
            <Input
              label={`Quantity to move (max ${item.current_location?.quantity ?? 1} at this shelf)`}
              type="number"
              value={String(moveQuantity)}
              onChange={(event) => setMoveQuantity(Math.max(1, Math.min(item.current_location?.quantity ?? 1, Number(event.target.value) || 1)))}
            />
          ) : null}
          <Select
            label="Destination zone"
            value={selectedZoneId}
            onChange={(event) => {
              setSelectedZoneId(event.target.value);
              setSelectedSlotId('');
            }}
            options={[{ label: 'Select zone', value: '' }, ...zones.map((zone) => ({ label: `${zone.code} - ${zone.name}`, value: zone.id }))]}
          />
          <Select
            label="Destination shelf"
            value={selectedSlotId}
            onChange={(event) => setSelectedSlotId(event.target.value)}
            options={[{ label: 'Select shelf', value: '' }, ...availableSlots.map((slot) => ({ label: slot.label, value: slot.id }))]}
          />
          <Input label="Worker name" value={workerName} onChange={(event) => setWorkerName(event.target.value)} />
          <label className="flex flex-col gap-1 text-sm text-app-textMuted">
            <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">Move notes</span>
            <textarea className="app-textarea" value={moveNotes} onChange={(event) => setMoveNotes(event.target.value)} />
          </label>
        </div>
      </Modal>
    </div>
  );
}
