// ============================================================
// Stremet Storage Management System — Shared Types
// This file is the contract between backend and frontend.
// ============================================================

// --- Enums ---

export type ItemType = 'customer_order' | 'general_stock' | 'raw_material' | 'work_in_progress';

export type ActionType = 'check_in' | 'check_out' | 'move' | 'note_added';

export type MachineCategory = 'sheet_metal' | 'cutting' | 'laser' | 'robot_bending' | 'bending';

export type MachineAssignmentStatus = 'queued' | 'processing' | 'needs_attention' | 'ready_for_storage';

export type RackType = 'raw_materials' | 'work_in_progress' | 'finished_goods' | 'customer_orders' | 'general_stock';

// --- Database Entities ---

export interface Rack {
  id: string;
  code: string;
  label: string;
  description: string;
  rack_type: RackType;
  row_count: number;
  column_count: number;
  display_order: number;
  total_shelves: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface ShelfSlot {
  id: string;
  rack_id: string;
  shelf_number: number;
  row_number: number;
  column_number: number;
  width_m: number;
  depth_m: number;
  height_m: number;
  max_volume_m3: number;
  current_volume_m3: number;
  current_count: number;
  current_weight_kg: number;
  max_weight_kg: number;
  measured_weight_kg: number;
  weight_discrepancy_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  contact_email: string;
  created_at: string;
}

export interface Item {
  id: string;
  item_code: string;
  customer_id: string | null;
  name: string;
  description: string;
  material: string;
  dimensions: string;
  weight_kg: number;
  volume_m3: number;
  type: ItemType;
  order_number: string | null;
  quantity: number;
  delivery_date: string | null;
  production_priority: number;
  turnover_class: 'A' | 'B' | 'C';
  created_at: string;
  updated_at: string;
}

export interface StorageAssignment {
  id: string;
  item_id: string;
  shelf_slot_id: string;
  unit_code: string;
  parent_unit_code: string | null;
  quantity: number;
  checked_in_at: string;
  checked_out_at: string | null;
  checked_in_by: string;
  checked_out_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  item_id: string;
  action: ActionType;
  from_location: string | null;
  to_location: string | null;
  performed_by: string;
  notes: string | null;
  created_at: string;
}

export interface Machine {
  id: string;
  name: string;
  code: string;
  category: MachineCategory;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface MachineAssignment {
  id: string;
  item_id: string;
  machine_id: string;
  unit_code: string;
  parent_unit_code: string | null;
  status: MachineAssignmentStatus;
  quantity: number;
  assigned_at: string;
  assigned_by: string;
  removed_at: string | null;
  removed_by: string | null;
  notes: string | null;
  created_at: string;
}

// --- API Response Wrappers ---

export interface ApiResponse<T> {
  data: T;
  warning?: string;
}

export interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface ApiError {
  error: string;
  details?: string;
}

// --- Enriched / Joined Types (API responses with related data) ---

export interface RackWithShelves extends Rack {
  total_cells: number;
  occupied_cells: number;
  total_items: number;
  shelves: ShelfSlotWithItems[];
}

export interface ShelfSlotWithItems extends ShelfSlot {
  rack_code: string;
  rack_label: string;
  items: RackCellItem[];
}

export interface RackWithStats extends Rack {
  cell_count: number;
  total_capacity: number; // Max Volume
  items_stored: number; // Current Volume
  cells_in_use: number;
}

export interface RackCellItem {
  assignment_id: string;
  item_id: string;
  item_code: string;
  unit_code: string;
  item_name: string;
  customer_name: string | null;
  material: string;
  quantity: number;
  checked_in_at: string;
  checked_in_by: string;
}

export interface ItemWithLocation extends Item {
  customer_name: string | null;
  customer_code: string | null;
}

export interface TrackingUnit {
  assignment_id: string;
  source_type: 'shelf' | 'machine';
  unit_code: string;
  parent_unit_code: string | null;
  status: MachineAssignmentStatus | null;
  quantity: number;
  assigned_at: string;
  assigned_by: string;
  shelf_slot_id: string | null;
  rack_id: string | null;
  rack_code: string | null;
  rack_label: string | null;
  row_number: number | null;
  column_number: number | null;
  machine_id: string | null;
  machine_code: string | null;
  machine_name: string | null;
  machine_category: MachineCategory | null;
}

export interface ItemDetail extends ItemWithLocation {
  tracking_units: TrackingUnit[];
  activity_history: ActivityLog[];
}

export interface MachineWithItemCount extends Machine {
  active_items: number;
  total_quantity: number;
  active_volume: number;
}

export interface MachineDetailItem {
  assignment_id: string;
  item_id: string;
  item_code: string;
  unit_code: string;
  status: MachineAssignmentStatus;
  quantity: number;
  item_name: string;
  customer_name: string | null;
  material: string;
  assigned_at: string;
  assigned_by: string;
}

export interface MachineDetail extends Machine {
  items: MachineDetailItem[];
  activity: ActivityLogWithItem[];
  stats: {
    active_assignments: number;
    total_pieces: number;
    completed_assignments: number;
    oldest_assignment: string | null;
  };
}

export interface ActivityLogWithItem extends ActivityLog {
  item_code: string;
  item_name: string;
}

export interface LocationSuggestion {
  shelf_slot_id: string;
  rack_id: string;
  rack_code: string;
  rack_label: string;
  row_number: number;
  column_number: number;
  available_capacity: number;
  reason: string;
  score: number;
  location: string;
}

export interface WarehouseStats {
  total_racks: number;
  total_slots: number;
  total_capacity: number;
  volume_stored: number;
  slots_in_use: number;
  occupancy_percent: number;
  racks: RackWithStats[];
}

export interface GlobalSearchLocation {
  rack_id: string;
  rack_code: string;
  rack_label: string;
  rack_type: RackType;
  volume_stored: number;
}

export interface GlobalSearchCustomer {
  id: string;
  name: string;
  code: string;
  volume_in_storage: number;
}

export interface GlobalSearchMachine {
  id: string;
  name: string;
  code: string;
  category: MachineCategory | string;
  active_volume: number;
}

export interface GlobalSearchResponse {
  items: ItemWithLocation[];
  customers: GlobalSearchCustomer[];
  locations: GlobalSearchLocation[];
  machines: GlobalSearchMachine[];
}
