'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LocationBadge } from '@/components/ui/LocationBadge';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import type { ItemDetail } from '@shared/types';

export default function CheckOutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [workerName, setWorkerName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!params.id) return;
    void api
      .getItem(params.id)
      .then((r) => setItem(r.data))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleSubmit() {
    if (!item?.current_location?.assignment_id || !workerName) {
      showToast('Worker name is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.checkOutItem({
        assignment_id: item.current_location.assignment_id,
        checked_out_by: workerName,
        notes: notes || undefined,
      });
      setSuccessMessage(`Checked out ${response.data.item_code} from ${response.data.location}`);
      showToast('Item checked out successfully');
      window.setTimeout(() => router.push(`/items/${item.id}`), 1200);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Check-out failed', 'error');
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

  if (!item || !item.current_location?.assignment_id) {
    return <EmptyState title="Item is not in storage" description="This item cannot be checked out right now." />;
  }

  return (
    <Stack spacing={2.5}>
      <Typography variant="h3">Check out</Typography>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Item</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" color="text.secondary">Item</Typography>
              <Typography variant="body2" fontFamily="monospace" mt={0.25}>{item.item_code} - {item.name}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" color="text.secondary">Current location</Typography>
              <div style={{ marginTop: 4 }}><LocationBadge location={item.current_location} /></div>
            </Grid>
          </Grid>

          <Grid container spacing={2} mt={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Input label="Worker name" value={workerName} onChange={(e: any) => setWorkerName(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                minRows={2}
                fullWidth
                placeholder="Shipped to customer, moved to production, etc."
              />
            </Grid>
          </Grid>

          <Stack direction="row" justifyContent="flex-end" mt={3}>
            <Button variant="danger" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? 'Checking out...' : 'Confirm check-out'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {successMessage ? (
        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#e8f5e9', borderColor: '#4caf50' }}>
          <Typography variant="body2" fontFamily="monospace" color="success.main">{successMessage}</Typography>
        </Paper>
      ) : null}
    </Stack>
  );
}
