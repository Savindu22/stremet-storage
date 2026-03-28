import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/pool';
import { asyncHandler } from '../middleware/asyncHandler';
import { OptimizerService } from '../services/optimizerService';
import { getNextTrackingUnitCode } from '../lib/trackingUnits';

export const itemsRouter = Router();

// 1. Suggest Location (The Brain)
itemsRouter.get('/:id/suggest-location', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const itemResult = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
  if (itemResult.rows.length === 0) { res.status(404).json({ error: 'Item not found' }); return; }
  const item = itemResult.rows[0];

  const slotsResult = await pool.query(`
    SELECT ss.*, r.code as rack_code, r.display_order, r.position_x, r.position_y
    FROM shelf_slots ss JOIN racks r ON ss.rack_id = r.id
    WHERE (ss.max_volume_m3 - ss.current_volume_m3) >= ($1 * $2)
  `, [item.quantity, item.volume_m3 || 0.1]);

  const suggestions = slotsResult.rows
    .map(slot => ({
      ...slot,
      score: OptimizerService.scoreSlot(
        {
          cell_id: slot.id,
          rack_id: slot.rack_id,
          row_number: slot.row_number,
          column_number: slot.column_number,
          max_volume_m3: Number(slot.max_volume_m3),
          current_volume_m3: Number(slot.current_volume_m3),
          current_weight_kg: Number(slot.current_weight_kg),
          max_weight_kg: Number(slot.max_weight_kg),
          max_height: Number(slot.max_height),
          rack_code: slot.rack_code,
          display_order: Number(slot.display_order),
          position_x: Number(slot.position_x),
          position_y: Number(slot.position_y)
        },
        {
          type: item.type,
          weight_kg: Number(item.weight_kg),
          volume_m3: Number(item.volume_m3 || 0.1),
          turnover_class: item.turnover_class as 'A'|'B'|'C',
          quantity: Number(item.quantity),
          is_stackable: item.is_stackable,
          delivery_date: item.delivery_date
        }
      )
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(s => ({
      shelf_slot_id: s.id,
      location: `${s.rack_code}/R${s.row_number}C${s.column_number}`,
      reason: `Optimized for ${item.type.replace('_', ' ')} flow. ${(s.max_volume_m3 - s.current_volume_m3).toFixed(2)} m³ free.`,
      score: Math.round(100 - (s.score / 10000))
    }));

  res.json({ data: suggestions });
}));

// 2. Volumetric Check-in
itemsRouter.post('/check-in', asyncHandler(async (req, res) => {
  const { item_id, shelf_slot_id, quantity, checked_in_by, notes } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const item = (await client.query('SELECT * FROM items WHERE id = $1', [item_id])).rows[0];
    const slot = (await client.query('SELECT * FROM shelf_slots WHERE id = $1 FOR UPDATE', [shelf_slot_id])).rows[0];
    
    const incomingVolume = (Number(item.volume_m3) || 0.1) * quantity;
    if ((Number(slot.current_volume_m3) + incomingVolume) > Number(slot.max_volume_m3)) {
        throw new Error('Insufficient volumetric capacity');
    }

    const unitCode = getNextTrackingUnitCode(item.item_code, []); // Simplified for demo
    const assignmentId = uuidv4();
    
    await client.query(
      `INSERT INTO storage_assignments (id, item_id, shelf_slot_id, unit_code, quantity, checked_in_at, checked_in_by, notes)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)`,
      [assignmentId, item_id, shelf_slot_id, unitCode, quantity, checked_in_by, notes]
    );

    const weightToAdd = (Number(item.weight_kg) || 0) * quantity;
    await client.query(
      `UPDATE shelf_slots 
       SET current_count = current_count + 1, 
           current_weight_kg = current_weight_kg + $1, 
           current_volume_m3 = current_volume_m3 + $2,
           updated_at = NOW() 
       WHERE id = $3`,
      [weightToAdd, incomingVolume, shelf_slot_id]
    );

    await client.query('COMMIT');
    res.json({ data: { unit_code: unitCode, location: 'Stored' } });
  } catch (e: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
}));

// Placeholder for other endpoints - restoring full file structure
itemsRouter.get('/', asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM items ORDER BY item_code');
    res.json({ data: result.rows });
}));
