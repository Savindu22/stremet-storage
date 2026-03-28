-- Tracking unit identity for physical storage and machine-handled units

ALTER TABLE storage_assignments
  ADD COLUMN unit_code VARCHAR(64),
  ADD COLUMN parent_unit_code VARCHAR(64);

ALTER TABLE machine_assignments
  ADD COLUMN unit_code VARCHAR(64),
  ADD COLUMN parent_unit_code VARCHAR(64);

WITH combined_assignments AS (
  SELECT
    'storage'::text AS source,
    sa.id AS assignment_id,
    sa.item_id,
    COALESCE(sa.checked_in_at, sa.created_at) AS assigned_at,
    COALESCE(NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(UPPER(i.item_code), '[^A-Z0-9]+', '-', 'g')), ''), 'UNIT') AS prefix
  FROM storage_assignments sa
  JOIN items i ON i.id = sa.item_id

  UNION ALL

  SELECT
    'machine'::text AS source,
    ma.id AS assignment_id,
    ma.item_id,
    COALESCE(ma.assigned_at, ma.created_at) AS assigned_at,
    COALESCE(NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(UPPER(i.item_code), '[^A-Z0-9]+', '-', 'g')), ''), 'UNIT') AS prefix
  FROM machine_assignments ma
  JOIN items i ON i.id = ma.item_id
),
numbered_assignments AS (
  SELECT
    source,
    assignment_id,
    CONCAT(RTRIM(LEFT(prefix, 16), '-'), '-U', LPAD(ROW_NUMBER() OVER (PARTITION BY item_id ORDER BY assigned_at, source, assignment_id)::text, 3, '0')) AS unit_code
  FROM combined_assignments
)
UPDATE storage_assignments sa
SET unit_code = numbered_assignments.unit_code
FROM numbered_assignments
WHERE numbered_assignments.source = 'storage'
  AND numbered_assignments.assignment_id = sa.id;

WITH combined_assignments AS (
  SELECT
    'storage'::text AS source,
    sa.id AS assignment_id,
    sa.item_id,
    COALESCE(sa.checked_in_at, sa.created_at) AS assigned_at,
    COALESCE(NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(UPPER(i.item_code), '[^A-Z0-9]+', '-', 'g')), ''), 'UNIT') AS prefix
  FROM storage_assignments sa
  JOIN items i ON i.id = sa.item_id

  UNION ALL

  SELECT
    'machine'::text AS source,
    ma.id AS assignment_id,
    ma.item_id,
    COALESCE(ma.assigned_at, ma.created_at) AS assigned_at,
    COALESCE(NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(UPPER(i.item_code), '[^A-Z0-9]+', '-', 'g')), ''), 'UNIT') AS prefix
  FROM machine_assignments ma
  JOIN items i ON i.id = ma.item_id
),
numbered_assignments AS (
  SELECT
    source,
    assignment_id,
    CONCAT(RTRIM(LEFT(prefix, 16), '-'), '-U', LPAD(ROW_NUMBER() OVER (PARTITION BY item_id ORDER BY assigned_at, source, assignment_id)::text, 3, '0')) AS unit_code
  FROM combined_assignments
)
UPDATE machine_assignments ma
SET unit_code = numbered_assignments.unit_code
FROM numbered_assignments
WHERE numbered_assignments.source = 'machine'
  AND numbered_assignments.assignment_id = ma.id;

ALTER TABLE storage_assignments
  ALTER COLUMN unit_code SET NOT NULL;

ALTER TABLE machine_assignments
  ALTER COLUMN unit_code SET NOT NULL;

CREATE INDEX idx_storage_assignments_unit_code ON storage_assignments(unit_code);
CREATE INDEX idx_machine_assignments_unit_code ON machine_assignments(unit_code);
