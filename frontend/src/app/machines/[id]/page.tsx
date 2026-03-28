'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import ScheduleIcon from '@mui/icons-material/ScheduleOutlined';
import WarningIcon from '@mui/icons-material/WarningAmberOutlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';
import type {
  ItemWithLocation,
  MachineDetail,
  MachineDetailItem,
  MachineWithItemCount,
  RackWithStats,
  RackWithShelves,
} from '@shared/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useWorkerSession } from '@/components/ui/WorkerSession';
import { formatDateTime } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'success'> = {
  sheet_metal: 'secondary',
  cutting: 'error',
  laser: 'primary',
  robot_bending: 'warning',
  bending: 'success',
};

export default function MachineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const { workerName } = useWorkerSession();

  const [machine, setMachine] = useState<MachineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Import modal state
  const [importOpen, setImportOpen] = useState(false);
  const [importSearch, setImportSearch] = useState('');
  const [importResults, setImportResults] = useState<ItemWithLocation[]>([]);
  const [importSearching, setImportSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemWithLocation | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<{ assignment_id: string; unit_code: string; quantity: number; source_type: string } | null>(null);
  const [importUnits, setImportUnits] = useState<Array<{ assignment_id: string; unit_code: string; quantity: number; source_type: string }>>([]);
  const [importUnitsLoading, setImportUnitsLoading] = useState(false);
  const [importQty, setImportQty] = useState(1);
  const [importNotes, setImportNotes] = useState('');

  // Move modal state
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveItem, setMoveItem] = useState<MachineDetailItem | null>(null);
  const [moveDestType, setMoveDestType] = useState<'storage' | 'machine'>('storage');
  const [moveRacks, setMoveRacks] = useState<RackWithStats[]>([]);
  const [moveSelectedRack, setMoveSelectedRack] = useState('');
  const [moveRackDetail, setMoveRackDetail] = useState<RackWithShelves | null>(null);
  const [moveSelectedSlot, setMoveSelectedSlot] = useState('');
  const [moveMachines, setMoveMachines] = useState<MachineWithItemCount[]>([]);
  const [moveSelectedMachine, setMoveSelectedMachine] = useState('');
  const [moveQty, setMoveQty] = useState(1);
  const [moveNotes, setMoveNotes] = useState('');

  const refreshMachine = async () => {
    try {
      const res = await api.getMachine(id);
      setMachine(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getMachine(id).then(res => {
      if (active) { setMachine(res.data); setLoading(false); }
    }).catch(err => {
      if (active) { setError(err instanceof Error ? err.message : 'Failed to load'); setLoading(false); }
    });
    return () => { active = false; };
  }, [id]);

  // Import search
  useEffect(() => {
    if (!importOpen || importSearch.length < 2) { setImportResults([]); return; }
    let active = true;
    const timer = setTimeout(async () => {
      setImportSearching(true);
      try {
        const res = await api.getItems({ search: importSearch, in_storage: true, per_page: 12 });
        if (active) setImportResults(res.data);
      } catch { /* ignore */ }
      if (active) setImportSearching(false);
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [importSearch, importOpen]);

  // Load units for selected import item
  useEffect(() => {
    if (!selectedItem) { setImportUnits([]); setSelectedUnit(null); return; }
    let active = true;
    setImportUnitsLoading(true);
    api.getItem(selectedItem.id).then(res => {
      if (!active) return;
      const units = res.data.tracking_units
        .filter((u: { source_type: string }) => u.source_type === 'shelf')
        .map((u: { assignment_id: string; unit_code: string; quantity: number; source_type: string }) => ({
          assignment_id: u.assignment_id,
          unit_code: u.unit_code,
          quantity: u.quantity,
          source_type: u.source_type,
        }));
      setImportUnits(units);
      if (units.length === 1) { setSelectedUnit(units[0]); setImportQty(units[0].quantity); }
      else { setSelectedUnit(null); setImportQty(1); }
      setImportUnitsLoading(false);
    }).catch(() => { if (active) setImportUnitsLoading(false); });
    return () => { active = false; };
  }, [selectedItem]);

  // Load racks for move modal
  useEffect(() => {
    if (!moveOpen) return;
    api.getRacks().then(res => setMoveRacks(res.data)).catch(() => {});
    api.getMachines().then(res => setMoveMachines(res.data)).catch(() => {});
  }, [moveOpen]);

  // Load rack detail when selected
  useEffect(() => {
    if (!moveSelectedRack) { setMoveRackDetail(null); return; }
    api.getRack(moveSelectedRack).then(res => setMoveRackDetail(res.data)).catch(() => {});
  }, [moveSelectedRack]);

  const handleImport = async () => {
    if (!selectedUnit || !workerName) return;
    try {
      await api.moveItem({
        assignment_id: selectedUnit.assignment_id,
        source_type: 'shelf',
        to_machine_id: id,
        performed_by: workerName,
        notes: importNotes || undefined,
        quantity: importQty,
      });
      showToast(`Imported ${selectedUnit.unit_code} to machine`, 'success');
      setImportOpen(false);
      resetImportState();
      refreshMachine();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Import failed', 'error');
    }
  };

  const handleMove = async () => {
    if (!moveItem || !workerName) return;
    try {
      await api.moveItem({
        assignment_id: moveItem.assignment_id,
        source_type: 'machine',
        to_shelf_slot_id: moveDestType === 'storage' ? moveSelectedSlot : undefined,
        to_machine_id: moveDestType === 'machine' ? moveSelectedMachine : undefined,
        performed_by: workerName,
        notes: moveNotes || undefined,
        quantity: moveQty,
      });
      showToast(`Moved ${moveItem.unit_code}`, 'success');
      setMoveOpen(false);
      refreshMachine();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Move failed', 'error');
    }
  };

  const resetImportState = () => {
    setImportSearch(''); setImportResults([]); setSelectedItem(null);
    setSelectedUnit(null); setImportUnits([]); setImportQty(1);
    setImportNotes('');
  };

  const openMoveModal = (item: MachineDetailItem) => {
    setMoveItem(item);
    setMoveQty(item.quantity);
    setMoveDestType('storage');
    setMoveSelectedRack(''); setMoveSelectedSlot('');
    setMoveSelectedMachine(''); setMoveNotes('');
    setMoveOpen(true);
  };

  if (loading) return <LoadingSpinner />;
  if (error || !machine) return <EmptyState title="Error" description={error || 'Machine not found'} />;

  const daysOld = machine.stats.oldest_assignment
    ? Math.floor((Date.now() - new Date(machine.stats.oldest_assignment).getTime()) / 86400000)
    : null;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Link href="/machines" style={{ fontSize: 12, color: '#1565C0', textDecoration: 'none' }}>
            &larr; All machines
          </Link>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <PrecisionManufacturingIcon sx={{ fontSize: 20 }} />
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{machine.code}</Typography>
            <Chip label={machine.category.replace('_', ' ')} size="small" color={CATEGORY_COLORS[machine.category] || 'default'} />
          </Box>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{machine.name}</Typography>
          {machine.description && <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.3 }}>{machine.description}</Typography>}
        </Box>
        <Button variant="primary" onClick={() => { resetImportState(); setImportOpen(true); }}>
          Import units
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <InventoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Active items</Typography>
              </Box>
              <Typography sx={{ fontSize: 20, fontWeight: 700 }}>{machine.stats.active_assignments}</Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{machine.stats.total_pieces} pcs</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Oldest item</Typography>
              </Box>
              <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
                {daysOld !== null ? `${daysOld}d` : '—'}
              </Typography>
              {daysOld !== null && daysOld > 7 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                  <WarningIcon sx={{ fontSize: 12, color: 'warning.main' }} />
                  <Typography sx={{ fontSize: 11, color: 'warning.main' }}>Over 7 days</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main content */}
      <Grid container spacing={2}>
        {/* Items at machine */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Items at machine</Typography>
            {machine.items.length === 0 ? (
              <Typography sx={{ fontSize: 12, color: 'text.secondary', py: 2, textAlign: 'center' }}>
                No items at this machine
              </Typography>
            ) : (
              <Stack spacing={1}>
                {machine.items.map(item => {
                  const daysHere = Math.floor((Date.now() - new Date(item.assigned_at).getTime()) / 86400000);
                  return (
                    <Paper key={item.assignment_id} variant="outlined" sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Link href={`/items/${item.item_id}`} style={{ fontSize: 13, fontWeight: 600, color: '#1565C0', textDecoration: 'none' }}>
                            {item.item_code}
                          </Link>
                          <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'Roboto Mono, monospace' }}>
                            {item.unit_code}
                          </Typography>
                          <Typography sx={{ fontSize: 12 }}>{item.item_name}</Typography>
                          {item.customer_name && (
                            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{item.customer_name}</Typography>
                          )}
                          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                            {item.material} &middot; {item.dimensions} &middot; {item.quantity} pcs
                            &middot; {daysHere}d
                            {daysHere > 7 && <WarningIcon sx={{ fontSize: 11, color: 'warning.main', ml: 0.3, verticalAlign: 'middle' }} />}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <Button variant="secondary" onClick={() => openMoveModal(item)}>Move</Button>
                          <Link href={`/check-out/${item.item_id}?assignmentId=${item.assignment_id}&unitCode=${item.unit_code}&sourceType=machine`}>
                            <Button variant="danger">Check out</Button>
                          </Link>
                        </Stack>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Recent activity */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Recent activity</Typography>
            {machine.activity.length === 0 ? (
              <Typography sx={{ fontSize: 12, color: 'text.secondary', py: 2, textAlign: 'center' }}>
                No activity yet
              </Typography>
            ) : (
              <Stack spacing={0.5} sx={{ maxHeight: 500, overflowY: 'auto' }}>
                {machine.activity.map(a => {
                  const isReceived = a.to_location === `M/${machine.code}`;
                  return (
                    <Box key={a.id} sx={{ py: 0.5, borderBottom: '1px solid #f0f0f0' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Badge variant={isReceived ? 'warning' : 'success'}>
                          {isReceived ? 'Received' : 'Sent out'}
                        </Badge>
                        <Link href={`/items/${a.item_id}`} style={{ fontSize: 12, fontWeight: 600, color: '#1565C0', textDecoration: 'none' }}>
                          {a.item_code}
                        </Link>
                      </Box>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                        {a.item_name}
                        {isReceived && a.from_location && ` from ${a.from_location}`}
                        {!isReceived && a.to_location && ` to ${a.to_location}`}
                      </Typography>
                      <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
                        {formatDateTime(a.created_at)} &middot; {a.performed_by}
                        {a.notes && ` — ${a.notes}`}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Import modal */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title={`Import units to ${machine.code}`}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 5 }}>
            <TextField fullWidth size="small" placeholder="Search items..." value={importSearch}
              onChange={e => { setImportSearch(e.target.value); setSelectedItem(null); }}
              sx={{ mb: 1 }}
            />
            {importSearching && <Typography sx={{ fontSize: 11 }}>Searching...</Typography>}
            <Stack spacing={0.5} sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {importResults.map(item => (
                <Paper key={item.id} variant="outlined"
                  onClick={() => setSelectedItem(item)}
                  sx={{
                    p: 1, cursor: 'pointer',
                    borderColor: selectedItem?.id === item.id ? '#1565C0' : undefined,
                    bgcolor: selectedItem?.id === item.id ? '#e3f2fd' : undefined,
                    '&:hover': { bgcolor: '#f5f5f5' },
                  }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{item.item_code}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{item.name}</Typography>
                  {item.customer_name && <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{item.customer_name}</Typography>}
                </Paper>
              ))}
            </Stack>
          </Grid>
          <Grid size={{ xs: 7 }}>
            {!selectedItem ? (
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 4, textAlign: 'center' }}>
                Choose an item from the left
              </Typography>
            ) : importUnitsLoading ? (
              <LoadingSpinner />
            ) : importUnits.length === 0 ? (
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 4, textAlign: 'center' }}>
                No storage units available for import
              </Typography>
            ) : (
              <>
                <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.5 }}>Storage units</Typography>
                <Stack spacing={0.5} sx={{ maxHeight: 200, overflowY: 'auto', mb: 1 }}>
                  {importUnits.map(u => (
                    <Paper key={u.assignment_id} variant="outlined"
                      onClick={() => { setSelectedUnit(u); setImportQty(u.quantity); }}
                      sx={{
                        p: 0.8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
                        borderColor: selectedUnit?.assignment_id === u.assignment_id ? '#1565C0' : undefined,
                        bgcolor: selectedUnit?.assignment_id === u.assignment_id ? '#e3f2fd' : undefined,
                      }}>
                      <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: selectedUnit?.assignment_id === u.assignment_id ? '#1565C0' : '#bbb' }} />
                      <Box>
                        <Typography sx={{ fontSize: 11, fontFamily: 'Roboto Mono, monospace' }}>{u.unit_code}</Typography>
                        <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{u.quantity} pcs</Typography>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
                <TextField fullWidth size="small" type="number" label="Quantity"
                  value={importQty} onChange={e => setImportQty(Math.max(1, Math.min(selectedUnit?.quantity || 1, +e.target.value)))}
                  slotProps={{ htmlInput: { min: 1, max: selectedUnit?.quantity || 1 } }}
                  sx={{ mb: 1 }}
                />
                <TextField fullWidth size="small" label="Notes" value={importNotes}
                  onChange={e => setImportNotes(e.target.value)} multiline rows={2}
                />
              </>
            )}
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
          <Button variant="secondary" onClick={() => setImportOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleImport}
            disabled={!selectedUnit || !workerName}>
            Import unit
          </Button>
        </Box>
      </Modal>

      {/* Move modal */}
      <Modal open={moveOpen} onClose={() => setMoveOpen(false)} title={moveItem ? `Move ${moveItem.unit_code}` : 'Move'}>
        {moveItem && (
          <>
            <Typography sx={{ fontSize: 12, mb: 1 }}>
              {moveItem.item_code} &middot; {moveItem.item_name} &middot; {moveItem.quantity} pcs
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <Button variant={moveDestType === 'storage' ? 'primary' : 'secondary'} onClick={() => setMoveDestType('storage')}>
                Storage cell
              </Button>
              <Button variant={moveDestType === 'machine' ? 'primary' : 'secondary'} onClick={() => setMoveDestType('machine')}>
                Another machine
              </Button>
            </Box>
            {moveDestType === 'storage' ? (
              <>
                <TextField fullWidth size="small" select label="Destination rack" value={moveSelectedRack}
                  onChange={e => { setMoveSelectedRack(e.target.value); setMoveSelectedSlot(''); }}
                  slotProps={{ select: { native: true } }} sx={{ mb: 1 }}>
                  <option value="">Select rack...</option>
                  {moveRacks.map(r => <option key={r.id} value={r.id}>{r.code} - {r.label}</option>)}
                </TextField>
                {moveRackDetail && (
                  <TextField fullWidth size="small" select label="Storage cell" value={moveSelectedSlot}
                    onChange={e => setMoveSelectedSlot(e.target.value)}
                    slotProps={{ select: { native: true } }} sx={{ mb: 1 }}>
                    <option value="">Select cell...</option>
                    {moveRackDetail.shelves
                      .filter(s => s.current_count < s.capacity)
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          R{s.row_number}C{s.column_number} ({s.capacity - s.current_count} free)
                        </option>
                      ))}
                  </TextField>
                )}
              </>
            ) : (
              <TextField fullWidth size="small" select label="Destination machine" value={moveSelectedMachine}
                onChange={e => setMoveSelectedMachine(e.target.value)}
                slotProps={{ select: { native: true } }} sx={{ mb: 1 }}>
                <option value="">Select machine...</option>
                {moveMachines.filter(m => m.id !== id).map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
              </TextField>
            )}
            <TextField fullWidth size="small" type="number" label="Quantity" value={moveQty}
              onChange={e => setMoveQty(Math.max(1, Math.min(moveItem.quantity, +e.target.value)))}
              slotProps={{ htmlInput: { min: 1, max: moveItem.quantity } }}
              sx={{ mb: 1 }}
            />
            <TextField fullWidth size="small" label="Notes" value={moveNotes}
              onChange={e => setMoveNotes(e.target.value)} multiline rows={2}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
              <Button variant="secondary" onClick={() => setMoveOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleMove}
                disabled={!workerName || (moveDestType === 'storage' ? !moveSelectedSlot : !moveSelectedMachine)}>
                Confirm move
              </Button>
            </Box>
          </>
        )}
      </Modal>
    </Box>
  );
}
