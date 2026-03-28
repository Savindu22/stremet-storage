import { describe, expect, it } from 'vitest';
import {
  buildRackCellLabel,
  buildRackLocationCode,
  buildRackTypeFromZone,
  getLegacyRackCellCoordinates,
} from './rackCells';

describe('buildRackTypeFromZone', () => {
  it('maps old zone codes to rack types', () => {
    expect(buildRackTypeFromZone('A', 'Raw materials')).toBe('raw_materials');
    expect(buildRackTypeFromZone('B', 'Work-in-progress')).toBe('work_in_progress');
    expect(buildRackTypeFromZone('C', 'Finished goods')).toBe('finished_goods');
    expect(buildRackTypeFromZone('D', 'Customer orders')).toBe('customer_orders');
    expect(buildRackTypeFromZone('E', 'General stock')).toBe('general_stock');
  });

  it('falls back by zone name when code is unknown', () => {
    expect(buildRackTypeFromZone('X', 'Finished goods area')).toBe('finished_goods');
  });

  it('defaults to general_stock when no match exists', () => {
    expect(buildRackTypeFromZone('X', 'Miscellaneous')).toBe('general_stock');
  });
});

describe('getLegacyRackCellCoordinates', () => {
  it('maps shelf numbers to row/column coordinates for migration', () => {
    expect(getLegacyRackCellCoordinates(1)).toEqual({ row_number: 1, column_number: 1 });
    expect(getLegacyRackCellCoordinates(4)).toEqual({ row_number: 4, column_number: 1 });
  });
});

describe('rack cell labels', () => {
  it('builds readable rack cell labels', () => {
    expect(buildRackCellLabel('A-R1', 2, 3)).toBe('A-R1 / R2 / C3');
  });

  it('builds compact machine/location codes for logs', () => {
    expect(buildRackLocationCode('A-R1', 2, 3)).toBe('A-R1/R2C3');
  });
});
