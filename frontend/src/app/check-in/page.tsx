'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CreateItemRequest, Customer, DuplicateWarning, ItemWithLocation, LocationSuggestion, ZoneWithStats } from '@shared/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LocationBadge } from '@/components/ui/LocationBadge';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { api, type ZoneDetail } from '@/lib/api';

type FlowState = 'lookup' | 'duplicate' | 'details' | 'location' | 'confirm' | 'success';

const blankNewItem: CreateItemRequest = {
  item_code: '',
  name: '',
  material: '',
  type: 'customer_order',
  quantity: 1,
};

const stepLabels = ['Look up', 'Duplicate', 'Details', 'Location', 'Confirm', 'Done'] as const;

function getCurrentStep(flow: FlowState) {
  return { lookup: 0, duplicate: 1, details: 2, location: 3, confirm: 4, success: 5 }[flow];
}

export default function CheckInPage() {
  const { showToast } = useToast();
  const [flow, setFlow] = useState<FlowState>('lookup');
  const [lookupCode, setLookupCode] = useState('');
  const [existingItem, setExistingItem] = useState<ItemWithLocation | null>(null);
  const [newItem, setNewItem] = useState<CreateItemRequest>(blankNewItem);
  const [duplicate, setDuplicate] = useState<DuplicateWarning | null>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [zones, setZones] = useState<ZoneWithStats[]>([]);
  const [zoneDetail, setZoneDetail] = useState<ZoneDetail | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedShelfSlotId, setSelectedShelfSlotId] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [notes, setNotes] = useState('');
  const [resultLocation, setResultLocation] = useState('');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [preselectedZoneId, setPreselectedZoneId] = useState('');
  const [preselectedRackId, setPreselectedRackId] = useState('');
  const [preselectedShelfSlotId, setPreselectedShelfSlotId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPreselectedZoneId(params.get('zone') || '');
    setPreselectedRackId(params.get('rack') || '');
    setPreselectedShelfSlotId(params.get('shelf') || '');
  }, []);

  useEffect(() => {
    void Promise.all([api.getCustomers(), api.getZones()]).then(([customerResponse, zoneResponse]) => {
      setCustomers(customerResponse.data);
      setZones(zoneResponse.data);
    });
  }, []);

  useEffect(() => {
    if (!selectedZoneId) {
      setZoneDetail(null);
      return;
    }

    void api.getZone(selectedZoneId).then((response) => setZoneDetail(response.data));
  }, [selectedZoneId]);

  useEffect(() => {
    if (preselectedZoneId) {
      setSelectedZoneId(preselectedZoneId);
    }
    if (preselectedShelfSlotId) {
      setSelectedShelfSlotId(preselectedShelfSlotId);
    }
  }, [preselectedShelfSlotId, preselectedZoneId]);

  useEffect(() => {
    if (preselectedZoneId || !preselectedRackId) {
      return;
    }

    void api.getRack(preselectedRackId).then((response) => {
      setSelectedZoneId(response.data.zone_id);
    });
  }, [preselectedRackId, preselectedZoneId]);

  const manualShelfOptions = useMemo(
    () =>
      zoneDetail?.racks.flatMap((rack) =>
        rack.shelves
          .filter(() => (preselectedRackId ? rack.id === preselectedRackId : true))
          .filter((shelf) => shelf.current_count < shelf.capacity)
          .map((shelf) => ({ value: shelf.id, label: `${rack.code} > Shelf ${shelf.shelf_number} (${shelf.capacity - shelf.current_count} free)` })),
      ) || [],
    [preselectedRackId, zoneDetail],
  );

  const selectedLocationLabel = useMemo(() => {
    const suggested = suggestions.find((suggestion) => suggestion.shelf_slot_id === selectedShelfSlotId);
    if (suggested) {
      return `${suggested.zone_code} > ${suggested.rack_code} > Shelf ${suggested.shelf_number}`;
    }

    return manualShelfOptions.find((option) => option.value === selectedShelfSlotId)?.label || 'Select a shelf';
  }, [manualShelfOptions, selectedShelfSlotId, suggestions]);

  async function handleLookup() {
    if (!lookupCode.trim()) {
      showToast('Enter an item code', 'error');
      return;
    }

    setLoading(true);
    setWarning('');
    try {
      const [itemsResponse, duplicatesResponse] = await Promise.all([
        api.getItems({ search: lookupCode.trim(), per_page: 100, page: 1 }),
        api.getDuplicateWarnings(),
      ]);

      const exactMatch = itemsResponse.data.find((item) => item.item_code.toLowerCase() === lookupCode.trim().toLowerCase()) || null;
      const duplicateMatch = duplicatesResponse.data.find((entry) => entry.item_code.toLowerCase() === lookupCode.trim().toLowerCase()) || null;

      setExistingItem(exactMatch);
      setNewItem((current) => ({ ...current, item_code: lookupCode.trim() }));
      setDuplicate(duplicateMatch);

      if (duplicateMatch) {
        setFlow('duplicate');
        return;
      }

      if (exactMatch) {
        const suggestionResponse = await api.getSuggestedLocations(exactMatch.id);
        setSuggestions(suggestionResponse.data);
      }

      setFlow('details');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lookup failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function continueFromDetails() {
    if (existingItem) {
      if (suggestions.length === 0) {
        const suggestionResponse = await api.getSuggestedLocations(existingItem.id);
        setSuggestions(suggestionResponse.data);
      }
      setFlow('location');
      return;
    }

    if (!newItem.name || !newItem.type) {
      showToast('Complete the new item form first', 'error');
      return;
    }

    try {
      const created = await api.createItem(newItem);
      const fullItem = await api.getItem(created.data.id);
      setExistingItem(fullItem.data);
      const suggestionResponse = await api.getSuggestedLocations(created.data.id);
      setSuggestions(suggestionResponse.data);
      setFlow('location');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to create item', 'error');
    }
  }

  async function confirmCheckIn() {
    if (!existingItem?.id || !selectedShelfSlotId || !workerName) {
      showToast('Worker name and storage location are required', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.checkInItem({
        item_id: existingItem.id,
        shelf_slot_id: selectedShelfSlotId,
        quantity: existingItem.quantity,
        checked_in_by: workerName,
        notes: notes || undefined,
      });
      setResultLocation(response.data.location);
      setWarning(response.warning || '');
      setFlow('success');
      showToast('Item checked in successfully');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Check-in failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2.5">
      <section className="app-frame px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="app-page-title">Check in item</h1>
            <span className="text-[11px] uppercase tracking-[0.06em] text-app-textMuted">Receiving flow</span>
          </div>
          <div className="text-[11px] font-medium text-app-textMuted">Step {getCurrentStep(flow) + 1} of {stepLabels.length}</div>
        </div>
        <div className="mt-2 grid gap-1 sm:grid-cols-3 xl:grid-cols-6">
          {stepLabels.map((label, index) => {
            const active = index === getCurrentStep(flow);
            const completed = index < getCurrentStep(flow);

            return (
              <div
                key={label}
                className={`border px-2.5 py-1.5 text-[12px] ${active ? 'border-app-primary bg-[#eaf1f7] text-app-text' : completed ? 'border-[#b7cfc0] bg-[#edf4ef] text-app-text' : 'border-app-borderLight bg-app-panelMuted text-app-textMuted'}`}
              >
                {label}
              </div>
            );
          })}
        </div>
      </section>

      <section className="app-frame px-3 py-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[280px] flex-1">
            <Input label="Item code" value={lookupCode} onChange={(event) => setLookupCode(event.target.value)} placeholder="KONE-001-PANEL-A" />
          </div>
          <Button onClick={handleLookup} disabled={loading}>{loading ? 'Looking up...' : 'Look up'}</Button>
        </div>
        {preselectedZoneId || preselectedRackId || preselectedShelfSlotId ? (
          <div className="mt-2 text-[12px] text-app-textMuted">Map context is active. The zone or rack selection was prefilled from the storage grid.</div>
        ) : null}
      </section>

      {flow === 'duplicate' && duplicate ? (
        <section className="app-frame px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">Duplicate</Badge>
            <h2 className="app-section-title">This item code already exists in storage</h2>
          </div>
          <div className="app-panel-grid mt-2 md:grid-cols-2">
            {duplicate.existing_locations.map((location, index) => (
              <div key={`${location.rack_code}-${index}`} className="px-3 py-2.5">
                <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">Stored copy {index + 1}</div>
                <div className="mt-1 text-[13px] text-app-text">{`${location.zone_name} > ${location.rack_code} > Shelf ${location.shelf_number}`}</div>
                <div className="mt-1 text-[12px] text-app-textMuted">{location.quantity} units</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => setFlow('details')}>Continue anyway</Button>
            <Button variant="secondary" onClick={() => setFlow('lookup')}>Cancel</Button>
          </div>
        </section>
      ) : null}

      {(flow === 'details' || flow === 'location' || flow === 'confirm' || flow === 'success') && (
        <section className="app-frame px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="app-section-title">Item details</h2>
            {existingItem ? <span className="font-data text-[12px] text-app-text">{existingItem.item_code}</span> : null}
          </div>

          {existingItem ? (
            <div className="app-panel-grid md:grid-cols-2">
              <div className="px-3 py-2.5">
                <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">Name</div>
                <div className="mt-1 text-[13px] text-app-text">{existingItem.name}</div>
              </div>
              <div className="px-3 py-2.5">
                <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">Customer</div>
                <div className="mt-1 text-[13px] text-app-text">{existingItem.customer_name || '-'}</div>
              </div>
              <div className="px-3 py-2.5">
                <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">Material</div>
                <div className="mt-1 text-[13px] text-app-text">{existingItem.material || '-'}</div>
              </div>
              <div className="px-3 py-2.5">
                <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">Current location</div>
                <div className="mt-1.5"><LocationBadge location={existingItem.current_location} /></div>
              </div>
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <Input label="Name" value={newItem.name} onChange={(event) => setNewItem((current) => ({ ...current, name: event.target.value }))} />
              <Select
                label="Customer"
                value={newItem.customer_id || ''}
                onChange={(event) => setNewItem((current) => ({ ...current, customer_id: event.target.value || undefined }))}
                options={[{ label: 'No customer', value: '' }, ...customers.map((customer) => ({ label: customer.name, value: customer.id }))]}
              />
              <Input label="Material" value={newItem.material} onChange={(event) => setNewItem((current) => ({ ...current, material: event.target.value }))} />
              <Select
                label="Type"
                value={newItem.type}
                onChange={(event) => setNewItem((current) => ({ ...current, type: event.target.value as CreateItemRequest['type'] }))}
                options={[
                  { label: 'Customer order', value: 'customer_order' },
                  { label: 'General stock', value: 'general_stock' },
                ]}
              />
              <Input label="Dimensions" value={newItem.dimensions || ''} onChange={(event) => setNewItem((current) => ({ ...current, dimensions: event.target.value }))} />
              <Input label="Weight (kg)" type="number" value={newItem.weight_kg || ''} onChange={(event) => setNewItem((current) => ({ ...current, weight_kg: Number(event.target.value) || 0 }))} />
              <Input label="Order number" value={newItem.order_number || ''} onChange={(event) => setNewItem((current) => ({ ...current, order_number: event.target.value }))} />
              <Input label="Quantity" type="number" min="1" value={String(newItem.quantity)} onChange={(event) => setNewItem((current) => ({ ...current, quantity: Number(event.target.value) || 1 }))} />
            </div>
          )}

          {flow === 'details' ? (
            <div className="mt-3 flex justify-end">
              <Button onClick={() => void continueFromDetails()}>Continue to location</Button>
            </div>
          ) : null}
        </section>
      )}

      {(flow === 'location' || flow === 'confirm' || flow === 'success') && existingItem ? (
        <section className="app-frame px-3 py-3">
          <h2 className="app-section-title">Location</h2>
          <div className="mt-2 grid gap-2 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-2">
              {suggestions.length > 0 ? (
                suggestions.map((suggestion) => {
                  const selected = selectedShelfSlotId === suggestion.shelf_slot_id;

                  return (
                    <button
                      key={suggestion.shelf_slot_id}
                      type="button"
                      className={`block w-full border px-3 py-2.5 text-left ${selected ? 'border-app-primary bg-[#eaf1f7]' : 'border-app-borderLight bg-app-panel hover:bg-app-panelMuted'}`}
                      onClick={() => {
                        setSelectedShelfSlotId(suggestion.shelf_slot_id);
                        setFlow('confirm');
                      }}
                    >
                      <div className="font-data text-[12px] text-app-text">{`${suggestion.zone_code} > ${suggestion.rack_code} > Shelf ${suggestion.shelf_number}`}</div>
                      <div className="mt-1 text-[12px] text-app-textMuted">{suggestion.reason}</div>
                    </button>
                  );
                })
              ) : (
                <EmptyState title="No smart suggestions available" description="Pick a shelf manually." />
              )}
            </div>

            <div className="app-frame-soft px-3 py-3">
              <div className="grid gap-2">
                <Select
                  label="Zone"
                  value={selectedZoneId}
                  onChange={(event) => setSelectedZoneId(event.target.value)}
                  options={[{ label: 'Select zone', value: '' }, ...zones.map((zone) => ({ label: `${zone.code} - ${zone.name}`, value: zone.id }))]}
                />
                <Select
                  label="Shelf"
                  value={selectedShelfSlotId}
                  onChange={(event) => {
                    setSelectedShelfSlotId(event.target.value);
                    if (event.target.value) {
                      setFlow('confirm');
                    }
                  }}
                  options={[{ label: 'Select shelf', value: '' }, ...manualShelfOptions]}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {(flow === 'confirm' || flow === 'success') && existingItem ? (
        <section className="app-frame px-3 py-3">
          <h2 className="app-section-title">Confirm</h2>
          <div className="app-panel-grid mt-2 md:grid-cols-2">
            <div className="px-3 py-2.5">
              <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">Item</div>
              <div className="mt-1 text-[13px] text-app-text">{existingItem.name}</div>
              <div className="font-data mt-1 text-[12px] text-app-text">{existingItem.item_code}</div>
            </div>
            <div className="px-3 py-2.5">
              <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">Selected location</div>
              <div className="mt-1 text-[13px] text-app-text">{selectedLocationLabel}</div>
            </div>
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <Input label="Worker name" value={workerName} onChange={(event) => setWorkerName(event.target.value)} />
            <label className="flex flex-col gap-1 text-sm text-app-textMuted">
              <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">Notes</span>
              <textarea className="app-textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
          </div>
          {flow !== 'success' ? (
            <div className="mt-3 flex justify-end">
              <Button onClick={() => void confirmCheckIn()} disabled={loading}>
                {loading ? 'Confirming...' : 'Confirm check-in'}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {flow === 'success' ? (
        <section className="app-frame-soft px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">Stored</Badge>
            <h2 className="app-section-title">Check-in complete</h2>
          </div>
          <div className="mt-1 text-[13px] text-app-text">Stored at {resultLocation}</div>
          {warning ? <div className="mt-1 text-[12px] text-app-warning">{warning}</div> : null}
          <div className="mt-3 flex justify-end">
            <Button onClick={() => window.location.reload()}>Check in another item</Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
