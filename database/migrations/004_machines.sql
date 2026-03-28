-- Machines: factory workcentres where items get processed
CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  category VARCHAR(30) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Machine assignments: tracks which item is at which machine
CREATE TABLE machine_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by VARCHAR(100) NOT NULL,
  removed_at TIMESTAMPTZ,
  removed_by VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_machine_assignments_item_id ON machine_assignments(item_id);
CREATE INDEX idx_machine_assignments_machine_id ON machine_assignments(machine_id);
CREATE INDEX idx_machine_assignments_active ON machine_assignments(removed_at) WHERE removed_at IS NULL;
