import { Router } from 'express';
import pool from '../db/pool';
import { asyncHandler } from '../middleware/asyncHandler';

export const searchRouter = Router();

// GET /api/search?q= — global search across items, customers, locations
searchRouter.get('/', asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    res.json({ data: { items: [], customers: [], locations: [] } });
    return;
  }

  const term = `%${q.trim()}%`;

  // Search items
  const itemsResult = await pool.query(`
    SELECT i.id, i.item_code, i.name, i.type, c.name AS customer_name,
      CASE WHEN latest_sa.id IS NOT NULL THEN
        json_build_object(
          'unit_code', latest_sa.unit_code,
          'zone_code', z.code,
          'zone_name', z.name,
          'rack_code', r.code,
          'shelf_number', ss.shelf_number
        )
      ELSE NULL END AS current_location
    FROM items i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN LATERAL (
      SELECT sa.id, sa.shelf_slot_id, sa.unit_code, sa.checked_in_at
      FROM storage_assignments sa
      WHERE sa.item_id = i.id AND sa.checked_out_at IS NULL
      ORDER BY sa.checked_in_at DESC
      LIMIT 1
    ) latest_sa ON true
    LEFT JOIN shelf_slots ss ON latest_sa.shelf_slot_id = ss.id
    LEFT JOIN racks r ON ss.rack_id = r.id
    LEFT JOIN zones z ON r.zone_id = z.id
    WHERE i.item_code ILIKE $1
      OR i.name ILIKE $1
      OR i.order_number ILIKE $1
      OR i.material ILIKE $1
      OR EXISTS (
        SELECT 1 FROM storage_assignments sa2
        WHERE sa2.item_id = i.id AND sa2.checked_out_at IS NULL AND sa2.unit_code ILIKE $1
      )
      OR EXISTS (
        SELECT 1 FROM machine_assignments ma2
        WHERE ma2.item_id = i.id AND ma2.removed_at IS NULL AND ma2.unit_code ILIKE $1
      )
    ORDER BY i.item_code
    LIMIT 20
  `, [term]);

  // Search customers
  const customersResult = await pool.query(`
    SELECT c.id, c.name, c.code,
      COUNT(DISTINCT sa.id) FILTER (WHERE sa.checked_out_at IS NULL)::int AS items_in_storage
    FROM customers c
    LEFT JOIN items i ON i.customer_id = c.id
    LEFT JOIN storage_assignments sa ON sa.item_id = i.id
    WHERE c.name ILIKE $1 OR c.code ILIKE $1
    GROUP BY c.id
    ORDER BY c.name
    LIMIT 10
  `, [term]);

  // Search locations (zones and racks)
  const locationsResult = await pool.query(`
    SELECT z.id AS zone_id, z.name AS zone_name, z.code AS zone_code,
      r.id AS rack_id, r.code AS rack_code,
      COALESCE(SUM(ss.current_count), 0)::int AS items_stored
    FROM zones z
    LEFT JOIN racks r ON r.zone_id = z.id
    LEFT JOIN shelf_slots ss ON ss.rack_id = r.id
    WHERE z.name ILIKE $1 OR z.code ILIKE $1 OR r.code ILIKE $1
    GROUP BY z.id, z.name, z.code, r.id, r.code
    ORDER BY z.code, r.code
    LIMIT 20
  `, [term]);

  // Search machines
  const machinesResult = await pool.query(`
    SELECT m.id, m.name, m.code, m.category,
      COUNT(ma.id) FILTER (WHERE ma.removed_at IS NULL)::int AS active_items
    FROM machines m
    LEFT JOIN machine_assignments ma ON ma.machine_id = m.id
    WHERE m.name ILIKE $1 OR m.code ILIKE $1 OR m.category ILIKE $1
    GROUP BY m.id
    ORDER BY m.code
    LIMIT 10
  `, [term]);

  res.json({
    data: {
      items: itemsResult.rows,
      customers: customersResult.rows,
      locations: locationsResult.rows,
      machines: machinesResult.rows,
    },
  });
}));
