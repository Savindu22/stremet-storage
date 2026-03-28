-- Restore compatibility between the current API layer and the latest schema
BEGIN;

ALTER TABLE shelf_slots
ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 10;

ALTER TABLE shelf_slots DROP CONSTRAINT IF EXISTS shelf_slots_capacity_check;
ALTER TABLE shelf_slots ADD CONSTRAINT shelf_slots_capacity_check CHECK (capacity >= 1);

UPDATE shelf_slots
SET capacity = GREATEST(capacity, current_count, 1);

ALTER TABLE machine_assignments
ADD COLUMN IF NOT EXISTS status VARCHAR(32);

UPDATE machine_assignments
SET status = CASE
  WHEN removed_at IS NOT NULL THEN COALESCE(status, 'ready_for_storage')
  WHEN notes ILIKE '%attention%' OR notes ILIKE '%fault%' OR notes ILIKE '%issue%' THEN 'needs_attention'
  WHEN notes ILIKE '%ready%' THEN 'ready_for_storage'
  WHEN notes ILIKE '%processing%' OR notes ILIKE '%started%' THEN 'processing'
  ELSE COALESCE(status, 'queued')
END
WHERE status IS NULL;

ALTER TABLE machine_assignments
ALTER COLUMN status SET DEFAULT 'queued';

ALTER TABLE machine_assignments
ALTER COLUMN status SET NOT NULL;

ALTER TABLE machine_assignments DROP CONSTRAINT IF EXISTS machine_assignments_status_check;
ALTER TABLE machine_assignments ADD CONSTRAINT machine_assignments_status_check
CHECK (status IN ('queued', 'processing', 'needs_attention', 'ready_for_storage'));

ALTER TABLE racks DROP CONSTRAINT IF EXISTS racks_rack_type_check;
ALTER TABLE racks ADD CONSTRAINT racks_rack_type_check
CHECK (rack_type IN ('raw_materials', 'work_in_progress', 'finished_goods', 'customer_orders', 'general_stock'));

UPDATE racks
SET rack_type = CASE
  WHEN display_order BETWEEN 1 AND 2 THEN 'raw_materials'
  WHEN display_order BETWEEN 3 AND 5 THEN 'work_in_progress'
  WHEN display_order BETWEEN 6 AND 7 THEN 'finished_goods'
  WHEN display_order BETWEEN 8 AND 10 THEN 'customer_orders'
  ELSE 'general_stock'
END
WHERE rack_type = 'general_stock' OR rack_type IS NULL;

COMMIT;
