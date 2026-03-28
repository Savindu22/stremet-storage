'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ItemDetail } from '@shared/types';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LocationBadge } from '@/components/ui/LocationBadge';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

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
    if (!params.id) {
      return;
    }

    void api
      .getItem(params.id)
      .then((response) => setItem(response.data))
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
      <div className="app-frame-soft flex items-center gap-2 px-3 py-3">
        <LoadingSpinner />
        <span className="text-[13px] text-app-textMuted">Loading item...</span>
      </div>
    );
  }

  if (!item || !item.current_location?.assignment_id) {
    return <EmptyState title="Item is not in storage" description="This item cannot be checked out right now." />;
  }

  return (
    <div className="space-y-2.5">
      <section className="app-frame flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0 space-y-1">
          <h1 className="app-page-title">Check out item</h1>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-app-textMuted">
            <span className="font-data text-app-text">{item.item_code}</span>
            <span>{item.name}</span>
          </div>
        </div>
        <LocationBadge location={item.current_location} />
      </section>

      <section className="app-frame px-3 py-3">
        <div className="app-panel-grid md:grid-cols-2">
          <div className="px-3 py-2.5">
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">Worker name</div>
            <div className="mt-2">
              <Input label="Worker name" value={workerName} onChange={(event) => setWorkerName(event.target.value)} />
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-app-textMuted">Notes</div>
            <textarea className="app-textarea mt-2 w-full" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Shipped to customer, moved to production, quality hold, etc." />
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <Button variant="danger" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? 'Checking out...' : 'Confirm check-out'}
          </Button>
        </div>
      </section>

      {successMessage ? <div className="app-frame-soft px-3 py-2 text-[13px] text-app-success">{successMessage}</div> : null}
    </div>
  );
}
