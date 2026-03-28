'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { ItemDetail, MachineLocation, MachineWithItemCount, ZoneWithStats } from '@shared/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LocationBadge, MachineLocationBadge } from '@/components/ui/LocationBadge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { api, type ZoneDetail } from '@/lib/api';
import { formatDateTime, formatNumber, locationLabel, machineCategoryLabel } from '@/lib/utils';

type MoveSource = {
  type: 'shelf' | 'machine';
  assignment_id: string;
  quantity: number;
  label: string;
};

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [zones, setZones] = useState<ZoneWithStats[]>([]);
  const [machines, setMachines] = useState<MachineWithItemCount[]>([]);
  const [zoneDetail, setZoneDetail] = useState<ZoneDetail | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [destType, setDestType] = useState<'storage' | 'machine'>('storage');
  const [workerName, setWorkerName] = useState('');
  const [moveNotes, setMoveNotes] = useState('');
  const [moveQuantity, setMoveQuantity] = useState(1);
  const [moveSource, setMoveSource] = useState<MoveSource | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentZoneId = useMemo(() => {
    if (!item?.current_location?.zone_code) return '';
    return zones.find((z) => z.code === item.current_location?.zone_code)?.id || '';
  }, [item?.current_location?.zone_code, zones]);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    void Promise.all([api.getItem(params.id), api.getZones(), api.getMachines()])
      .then(([itemRes, zoneRes, machineRes]) => {
        setItem(itemRes.data);
        setZones(zoneRes.data);
        setMachines(machineRes.data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!selectedZoneId) { setZoneDetail(null); return; }
    void api.getZone(selectedZoneId).then((r) => setZoneDetail(r.data));
  }, [selectedZoneId]);

  const availableSlots = useMemo(
    () => zoneDetail?.racks.flatMap((rack) =>
      rack.shelves
        .filter((s) => s.current_count < s.capacity)
        .map((s) => ({ id: s.id, label: `${rack.code} > Shelf ${s.shelf_number} (${s.capacity - s.current_count} free)` })),
    ) || [],
    [zoneDetail],
  );

  function openMoveDialog(source: MoveSource) {
    setMoveSource(source);
    setMoveQuantity(source.quantity);
    setDestType('storage');
    setSelectedZoneId('');
    setSelectedSlotId('');
    setSelectedMachineId('');
    setMoveNotes('');
    setMoveOpen(true);
  }

  async function handleMove() {
    if (!moveSource || !workerName) {
      showToast('Worker name is required', 'error');
      return;
    }
    if (destType === 'storage' && !selectedSlotId) {
      showToast('Select a destination shelf', 'error');
      return;
    }
    if (destType === 'machine' && !selectedMachineId) {
      showToast('Select a destination machine', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.moveItem({
        assignment_id: moveSource.assignment_id,
        source_type: moveSource.type,
        to_shelf_slot_id: destType === 'storage' ? selectedSlotId : undefined,
        to_machine_id: destType === 'machine' ? selectedMachineId : undefined,
        performed_by: workerName,
        notes: moveNotes || undefined,
        quantity: moveQuantity,
      });
      const refreshed = await api.getItem(params.id);
      setItem(refreshed.data);
      setMoveOpen(false);
      const totalQty = moveSource.quantity;
      const label = moveQuantity < totalQty ? `${moveQuantity} of ${totalQty} moved to ${response.data.to}` : `Moved to ${response.data.to}`;
      showToast(label);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Move failed', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <LoadingSpinner />
        <Typography variant="body2" color="text.secondary">Loading item...</Typography>
      </Paper>
    );
  }

  if (error || !item) {
    return <EmptyState title="Unable to load item" description={error || 'Item not found'} />;
  }

  const hasShelfLocation = Boolean(item.current_location?.assignment_id);
  const machineLocations: MachineLocation[] = item.machine_locations || [];
  const hasAnyLocation = hasShelfLocation || machineLocations.length > 0;

  const infoRows: [string, string][] = [
    ['Material', item.material || '-'],
    ['Dimensions', item.dimensions || '-'],
    ['Weight', formatNumber(item.weight_kg, ' kg')],
    ['In storage', String(item.current_location?.quantity ?? 0)],
    ['Order number', item.order_number || '-'],
    ['Customer', item.customer_name || '-'],
  ];

  return (
    <Stack spacing={2.5}>
      {/* Header */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'flex-start' }} spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
              <Typography variant="h3">{item.name}</Typography>
              <Badge variant="primary">{item.type}</Badge>
            </Stack>
            <Stack direction="row" spacing={2} mt={0.5} flexWrap="wrap">
              <Typography variant="body2" fontFamily="monospace" fontWeight={500}>{item.item_code}</Typography>
              <Typography variant="body2" color="text.secondary">{item.customer_name || 'No customer assigned'}</Typography>
              {item.order_number ? <Typography variant="body2" color="text.secondary">Order {item.order_number}</Typography> : null}
            </Stack>
          </Box>
          <Stack direction="row" spacing={1}>
            {hasShelfLocation ? (
              <Link href={`/check-out/${item.id}`}><Button variant="danger">Check out</Button></Link>
            ) : null}
          </Stack>
        </Stack>
      </Paper>

      {/* Content grid */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">Current record</Typography>
                {currentZoneId ? <Link href={`/zones/${currentZoneId}`} style={{ fontSize: 13, color: '#1565C0' }}>Open zone</Link> : null}
              </Stack>

              {/* Shelf location */}
              <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="text.secondary">Storage location</Typography>
                    <Box mt={0.5}>
                      {item.current_location ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LocationBadge location={item.current_location} />
                          <Typography variant="caption" color="text.secondary">{item.current_location.quantity} pcs</Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Not in storage</Typography>
                      )}
                    </Box>
                  </Box>
                  {hasShelfLocation ? (
                    <Button
                      variant="secondary"
                      onClick={() => openMoveDialog({
                        type: 'shelf',
                        assignment_id: item.current_location!.assignment_id,
                        quantity: item.current_location!.quantity ?? 1,
                        label: locationLabel(item.current_location),
                      })}
                    >
                      Move
                    </Button>
                  ) : null}
                </Stack>
              </Paper>

              {/* Machine locations */}
              {machineLocations.length > 0 ? (
                <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
                  <Typography variant="caption" color="text.secondary" mb={1} display="block">At machines</Typography>
                  <Stack spacing={1}>
                    {machineLocations.map((ml) => (
                      <Stack key={ml.assignment_id} direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <MachineLocationBadge code={ml.machine_code} name={ml.machine_name} />
                          <Typography variant="caption" color="text.secondary">{ml.quantity} pcs</Typography>
                          <Typography variant="caption" color="text.secondary">({machineCategoryLabel(ml.machine_category)})</Typography>
                        </Stack>
                        <Button
                          variant="secondary"
                          onClick={() => openMoveDialog({
                            type: 'machine',
                            assignment_id: ml.assignment_id,
                            quantity: ml.quantity,
                            label: `M/${ml.machine_code}`,
                          })}
                        >
                          Move
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              ) : null}

              <Grid container spacing={2}>
                {infoRows.map(([label, value]) => (
                  <Grid size={{ xs: 6, md: 4 }} key={label}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" mt={0.25}>{value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">Activity</Typography>
                <Typography variant="caption" color="text.secondary">{item.activity_history.length} entries</Typography>
              </Stack>

              <Box sx={{ maxHeight: 520, overflow: 'auto' }}>
                {item.activity_history.length === 0 ? (
                  <EmptyState title="No activity yet" description="No recorded moves, check-ins, or check-outs." />
                ) : (
                  <Stack divider={<Divider />}>
                    {item.activity_history.map((entry) => (
                      <Box key={entry.id} py={1.5}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Badge variant={entry.action === 'check_out' ? 'danger' : entry.action === 'check_in' ? 'success' : 'default'}>{entry.action}</Badge>
                          <Typography variant="caption" fontFamily="monospace" color="text.secondary">{formatDateTime(entry.created_at)}</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={500} mt={0.5}>{entry.performed_by}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.action === 'move' ? `${entry.from_location || '-'} \u2192 ${entry.to_location || '-'}` : entry.to_location || entry.from_location || '-'}
                        </Typography>
                        {entry.notes ? <Typography variant="body2" mt={0.5}>{entry.notes}</Typography> : null}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Move dialog */}
      <Modal open={moveOpen} title="Move item" confirmLabel={submitting ? 'Moving...' : 'Confirm move'} onConfirm={handleMove} onClose={() => setMoveOpen(false)}>
        <Stack spacing={2.5} pt={1}>
          {moveSource ? (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary">Moving from</Typography>
              <Typography variant="body2" mt={0.5} fontFamily="monospace">{moveSource.label} — {moveSource.quantity} pcs</Typography>
            </Paper>
          ) : null}

          {moveSource && moveSource.quantity > 1 ? (
            <Input
              label={`Quantity to move (max ${moveSource.quantity})`}
              type="number"
              value={String(moveQuantity)}
              onChange={(event: any) => setMoveQuantity(Math.max(1, Math.min(moveSource.quantity, Number(event.target.value) || 1)))}
            />
          ) : null}

          <Box>
            <Typography variant="caption" color="text.secondary" mb={0.5} display="block">Destination type</Typography>
            <ToggleButtonGroup
              value={destType}
              exclusive
              onChange={(_e, val) => { if (val) { setDestType(val); setSelectedSlotId(''); setSelectedMachineId(''); } }}
              size="small"
              fullWidth
            >
              <ToggleButton value="storage">Storage</ToggleButton>
              <ToggleButton value="machine">Machine</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {destType === 'storage' ? (
            <>
              <Select
                label="Destination zone"
                value={selectedZoneId}
                onChange={(event: any) => { setSelectedZoneId(event.target.value); setSelectedSlotId(''); }}
                options={[{ label: 'Select zone', value: '' }, ...zones.map((z) => ({ label: `${z.code} - ${z.name}`, value: z.id }))]}
              />
              <Select
                label="Destination shelf"
                value={selectedSlotId}
                onChange={(event: any) => setSelectedSlotId(event.target.value)}
                options={[{ label: 'Select shelf', value: '' }, ...availableSlots.map((s) => ({ label: s.label, value: s.id }))]}
              />
            </>
          ) : (
            <Select
              label="Destination machine"
              value={selectedMachineId}
              onChange={(event: any) => setSelectedMachineId(event.target.value)}
              options={[{ label: 'Select machine', value: '' }, ...machines.map((m) => ({ label: `${m.code} — ${m.name}`, value: m.id }))]}
            />
          )}

          <Input label="Worker name" value={workerName} onChange={(event: any) => setWorkerName(event.target.value)} />
          <Input label="Move notes" value={moveNotes} onChange={(event: any) => setMoveNotes(event.target.value)} />
        </Stack>
      </Modal>
    </Stack>
  );
}
