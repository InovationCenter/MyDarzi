export type Migration = {
  version: number;
  statements: string[];
};

const syncCols = `
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending'
`;

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS business_profile (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        owner_name TEXT,
        phone TEXT,
        whatsapp TEXT,
        address TEXT,
        logo_key TEXT,
        currency TEXT NOT NULL DEFAULT 'PKR',
        default_measurement_unit TEXT NOT NULL DEFAULT 'in',
        ${syncCols}
      );`,
      `CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        whatsapp TEXT,
        address TEXT,
        notes TEXT,
        photo_key TEXT,
        ${syncCols}
      );`,
      `CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);`,
      `CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);`,
      `CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at);`,
    ],
  },
  {
    version: 2,
    statements: [
      `CREATE TABLE IF NOT EXISTS garments (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        is_custom INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        ${syncCols}
      );`,
      `CREATE TABLE IF NOT EXISTS measurement_templates (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        garment_id TEXT,
        unit_default TEXT NOT NULL DEFAULT 'in',
        is_system INTEGER NOT NULL DEFAULT 0,
        ${syncCols},
        FOREIGN KEY (garment_id) REFERENCES garments(id)
      );`,
      `CREATE TABLE IF NOT EXISTS measurement_template_fields (
        id TEXT PRIMARY KEY NOT NULL,
        template_id TEXT NOT NULL,
        key TEXT NOT NULL,
        label TEXT NOT NULL,
        unit TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_required INTEGER NOT NULL DEFAULT 0,
        ${syncCols},
        FOREIGN KEY (template_id) REFERENCES measurement_templates(id)
      );`,
      `CREATE TABLE IF NOT EXISTS measurement_profiles (
        id TEXT PRIMARY KEY NOT NULL,
        customer_id TEXT NOT NULL,
        template_id TEXT NOT NULL,
        name TEXT NOT NULL,
        unit TEXT NOT NULL DEFAULT 'in',
        notes TEXT,
        ${syncCols},
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (template_id) REFERENCES measurement_templates(id)
      );`,
      `CREATE TABLE IF NOT EXISTS measurement_values (
        id TEXT PRIMARY KEY NOT NULL,
        profile_id TEXT NOT NULL,
        field_key TEXT NOT NULL,
        field_label TEXT NOT NULL,
        value REAL,
        unit TEXT NOT NULL DEFAULT 'in',
        ${syncCols},
        FOREIGN KEY (profile_id) REFERENCES measurement_profiles(id)
      );`,
      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY NOT NULL,
        order_number TEXT NOT NULL UNIQUE,
        customer_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        due_date TEXT,
        fabric_info TEXT,
        color TEXT,
        instructions TEXT,
        notes TEXT,
        subtotal REAL NOT NULL DEFAULT 0,
        discount REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        measurement_profile_id TEXT,
        ${syncCols},
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (measurement_profile_id) REFERENCES measurement_profiles(id)
      );`,
      `CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY NOT NULL,
        order_id TEXT NOT NULL,
        garment_id TEXT NOT NULL,
        garment_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL DEFAULT 0,
        line_total REAL NOT NULL DEFAULT 0,
        notes TEXT,
        ${syncCols},
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (garment_id) REFERENCES garments(id)
      );`,
      `CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY NOT NULL,
        order_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        amount REAL NOT NULL,
        method TEXT NOT NULL DEFAULT 'cash',
        kind TEXT NOT NULL DEFAULT 'payment',
        note TEXT,
        paid_at TEXT NOT NULL,
        ${syncCols},
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );`,
      `CREATE TABLE IF NOT EXISTS production_events (
        id TEXT PRIMARY KEY NOT NULL,
        order_id TEXT NOT NULL,
        from_status TEXT,
        to_status TEXT NOT NULL,
        note TEXT,
        changed_at TEXT NOT NULL,
        ${syncCols},
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );`,
      `CREATE TABLE IF NOT EXISTS design_references (
        id TEXT PRIMARY KEY NOT NULL,
        order_id TEXT NOT NULL,
        media_key TEXT NOT NULL,
        caption TEXT,
        kind TEXT NOT NULL DEFAULT 'reference',
        ${syncCols},
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );`,
      `CREATE TABLE IF NOT EXISTS alterations (
        id TEXT PRIMARY KEY NOT NULL,
        order_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        problem TEXT NOT NULL,
        requested_change TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        cost REAL,
        ${syncCols},
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );`,
      `CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        quantity REAL NOT NULL DEFAULT 0,
        unit TEXT NOT NULL DEFAULT 'pcs',
        notes TEXT,
        ${syncCols}
      );`,
      `CREATE TABLE IF NOT EXISTS inventory_transactions (
        id TEXT PRIMARY KEY NOT NULL,
        item_id TEXT NOT NULL,
        delta REAL NOT NULL,
        reason TEXT,
        notes TEXT,
        ${syncCols},
        FOREIGN KEY (item_id) REFERENCES inventory_items(id)
      );`,
      `CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'stitcher',
        phone TEXT,
        notes TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        ${syncCols}
      );`,
      `CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_due_date ON orders(due_date);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);`,
      `CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);`,
      `CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);`,
      `CREATE INDEX IF NOT EXISTS idx_measurement_profiles_customer ON measurement_profiles(customer_id);`,
      `CREATE INDEX IF NOT EXISTS idx_design_refs_order ON design_references(order_id);`,
      `CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory_items(name);`,
      `CREATE INDEX IF NOT EXISTS idx_staff_name ON staff(name);`,
    ],
  },
  {
    version: 3,
    statements: [
      `ALTER TABLE garments ADD COLUMN default_price REAL NOT NULL DEFAULT 0;`,
    ],
  },
  {
    version: 4,
    statements: [
      `CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        amount REAL NOT NULL,
        spent_at TEXT NOT NULL,
        notes TEXT,
        ${syncCols}
      );`,
      `CREATE INDEX IF NOT EXISTS idx_expenses_spent_at ON expenses(spent_at);`,
      `CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);`,
    ],
  },
];
