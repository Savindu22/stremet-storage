ALTER TABLE racks
  ADD COLUMN rack_type VARCHAR(32) NOT NULL DEFAULT 'general_stock'
    CHECK (rack_type IN ('raw_materials', 'work_in_progress', 'finished_goods', 'customer_orders', 'general_stock')),
  ADD COLUMN row_count INTEGER NOT NULL DEFAULT 4,
  ADD COLUMN column_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN description TEXT NOT NULL DEFAULT '';

ALTER TABLE shelf_slots
  ADD COLUMN row_number INTEGER,
  ADD COLUMN column_number INTEGER;

UPDATE racks
SET rack_type = CASE z.code
  WHEN 'A' THEN 'raw_materials'
  WHEN 'B' THEN 'work_in_progress'
  WHEN 'C' THEN 'finished_goods'
  WHEN 'D' THEN 'customer_orders'
  ELSE 'general_stock'
END,
row_count = total_shelves,
column_count = 1,
display_order = position_in_zone,
description = z.description
FROM zones z
WHERE racks.zone_id = z.id;

UPDATE shelf_slots
SET row_number = shelf_number,
    column_number = 1;

ALTER TABLE shelf_slots
  ALTER COLUMN row_number SET NOT NULL,
  ALTER COLUMN column_number SET NOT NULL;

CREATE UNIQUE INDEX idx_shelf_slots_rack_row_column ON shelf_slots(rack_id, row_number, column_number);
