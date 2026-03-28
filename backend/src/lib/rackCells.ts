type RackType = 'raw_materials' | 'work_in_progress' | 'finished_goods' | 'customer_orders' | 'general_stock';

export function buildRackTypeFromZone(zoneCode: string, zoneName: string): RackType {
  const normalizedCode = zoneCode.trim().toUpperCase();
  const normalizedName = zoneName.trim().toLowerCase();

  if (normalizedCode === 'A' || normalizedName.includes('raw')) return 'raw_materials';
  if (normalizedCode === 'B' || normalizedName.includes('progress')) return 'work_in_progress';
  if (normalizedCode === 'C' || normalizedName.includes('finished')) return 'finished_goods';
  if (normalizedCode === 'D' || normalizedName.includes('customer')) return 'customer_orders';
  return 'general_stock';
}

export function getLegacyRackCellCoordinates(shelfNumber: number) {
  return {
    row_number: shelfNumber,
    column_number: 1,
  };
}

export function buildRackCellLabel(rackCode: string, rowNumber: number, columnNumber: number) {
  return `${rackCode} / R${rowNumber} / C${columnNumber}`;
}

export function buildRackLocationCode(rackCode: string, rowNumber: number, columnNumber: number) {
  return `${rackCode}/R${rowNumber}C${columnNumber}`;
}

export type { RackType };
