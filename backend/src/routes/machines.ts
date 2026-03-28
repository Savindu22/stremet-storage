import { Router } from 'express';
import pool from '../db/pool';
import { asyncHandler } from '../middleware/asyncHandler';

export const machinesRouter = Router();

// GET /api/machines — list all machines with current item counts
machinesRouter.get('/', asyncHandler(async (_req, res) => {
  const result = await pool.query(`
    SELECT m.*,
      COALESCE(agg.active_items, 0)::int AS active_items,
      COALESCE(agg.total_quantity, 0)::int AS total_quantity
    FROM machines m
    LEFT JOIN (
      SELECT machine_id,
        COUNT(*)::int AS active_items,
        SUM(quantity)::int AS total_quantity
      FROM machine_assignments
      WHERE removed_at IS NULL
      GROUP BY machine_id
    ) agg ON agg.machine_id = m.id
    ORDER BY m.category, m.code
  `);

  res.json({ data: result.rows });
}));

// GET /api/machines/:id — machine detail with current items
machinesRouter.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const machineResult = await pool.query('SELECT * FROM machines WHERE id = $1', [id]);
  if (machineResult.rows.length === 0) {
    res.status(404).json({ error: 'Machine not found' });
    return;
  }

  const machine = machineResult.rows[0];

  const itemsResult = await pool.query(`
    SELECT ma.id AS assignment_id, ma.quantity, ma.assigned_at, ma.assigned_by, ma.notes,
      i.id AS item_id, i.item_code, i.name AS item_name, i.material, i.dimensions, i.weight_kg,
      c.name AS customer_name
    FROM machine_assignments ma
    JOIN items i ON ma.item_id = i.id
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE ma.machine_id = $1 AND ma.removed_at IS NULL
    ORDER BY ma.assigned_at DESC
  `, [id]);

  // Recent activity (moves to/from this machine)
  const activityResult = await pool.query(`
    SELECT al.*, i.item_code, i.name AS item_name
    FROM activity_log al
    JOIN items i ON al.item_id = i.id
    WHERE al.from_location = $1 OR al.to_location = $1
    ORDER BY al.created_at DESC
    LIMIT 30
  `, [`M/${machine.code}`]);

  // Stats
  const statsResult = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE removed_at IS NULL)::int AS active_assignments,
      COALESCE(SUM(quantity) FILTER (WHERE removed_at IS NULL), 0)::int AS total_pieces,
      COUNT(*) FILTER (WHERE removed_at IS NOT NULL)::int AS completed_assignments,
      MIN(assigned_at) FILTER (WHERE removed_at IS NULL) AS oldest_assignment
    FROM machine_assignments
    WHERE machine_id = $1
  `, [id]);

  res.json({
    data: {
      ...machine,
      items: itemsResult.rows,
      activity: activityResult.rows,
      stats: statsResult.rows[0],
    },
  });
}));
