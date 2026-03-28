BEGIN;

UPDATE racks
SET rack_type = CASE
  WHEN LEFT(code, 1) = 'A' THEN 'raw_materials'
  WHEN LEFT(code, 1) = 'B' THEN 'work_in_progress'
  WHEN LEFT(code, 1) = 'C' THEN 'finished_goods'
  WHEN LEFT(code, 1) = 'D' THEN 'customer_orders'
  WHEN LEFT(code, 1) = 'E' THEN 'general_stock'
  ELSE rack_type
END;

COMMIT;
