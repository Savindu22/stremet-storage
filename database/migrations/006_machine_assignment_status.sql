ALTER TABLE machine_assignments
  ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'queued'
  CHECK (status IN ('queued', 'processing', 'needs_attention', 'ready_for_storage'));

UPDATE machine_assignments
SET status = CASE
  WHEN notes ILIKE '%waiting%' THEN 'queued'
  WHEN notes ILIKE '%queue%' THEN 'queued'
  WHEN notes ILIKE '%attention%' OR notes ILIKE '%fault%' OR notes ILIKE '%issue%' THEN 'needs_attention'
  WHEN notes ILIKE '%ready%' THEN 'ready_for_storage'
  ELSE 'processing'
END
WHERE removed_at IS NULL;
