import type { Database } from '../database/client';
import type {
  Alteration,
  DashboardSnapshot,
  DesignReference,
  Expense,
  InventoryItem,
  InventoryTransaction,
  MeasurementProfile,
  MeasurementValue,
  Order,
  OrderItem,
  Payment,
  ProductionEvent,
  ProfitReport,
  SearchResult,
  StaffMember,
} from '../../domain/types/models';
import {
  nextProductionStatus,
  type ExpenseCategory,
  type MeasurementUnit,
  type PaymentMethod,
  type ProductionStatus,
  type InventoryCategory,
  type StaffRole,
} from '../../domain/constants';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { createId, nowIso } from '../../shared/ids';

type Row = Record<string, unknown>;

function asRows(result: { rows: Row[] }): Row[] {
  return result.rows ?? [];
}
function str(v: unknown): string {
  return String(v ?? '');
}
function strOrNull(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  return String(v);
}
function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function bool(v: unknown): boolean {
  return Number(v) === 1 || v === true;
}

export class SqliteMeasurementRepository {
  constructor(private readonly db: Database) {}

  async listProfiles(customerId: string): Promise<MeasurementProfile[]> {
    const result = await this.db.execute(
      `SELECT * FROM measurement_profiles WHERE customer_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC;`,
      [customerId],
    );
    const profiles = asRows(result);
    const out: MeasurementProfile[] = [];
    for (const p of profiles) {
      out.push(await this.hydrateProfile(p));
    }
    return out;
  }

  async getProfile(id: string): Promise<MeasurementProfile | null> {
    const result = await this.db.execute(
      `SELECT * FROM measurement_profiles WHERE id = ? AND deleted_at IS NULL LIMIT 1;`,
      [id],
    );
    const row = asRows(result)[0];
    return row ? this.hydrateProfile(row) : null;
  }

  private async hydrateProfile(row: Row): Promise<MeasurementProfile> {
    const id = str(row.id);
    const values = asRows(
      await this.db.execute(
        `SELECT * FROM measurement_values WHERE profile_id = ? AND deleted_at IS NULL;`,
        [id],
      ),
    ).map(mapValue);
    return {
      id,
      customerId: str(row.customer_id),
      templateId: str(row.template_id),
      name: str(row.name),
      unit: (str(row.unit) || 'in') as MeasurementUnit,
      notes: strOrNull(row.notes),
      values,
      createdAt: str(row.created_at),
      updatedAt: str(row.updated_at),
      deletedAt: strOrNull(row.deleted_at),
      syncStatus: str(row.sync_status) as MeasurementProfile['syncStatus'],
    };
  }

  async createProfile(input: {
    customerId: string;
    templateId: string;
    name: string;
    unit: MeasurementUnit;
    notes?: string | null;
    values: { fieldKey: string; fieldLabel: string; value: number | null; unit: MeasurementUnit }[];
  }): Promise<MeasurementProfile> {
    const name = input.name.trim();
    if (!name) throw new ValidationError('Measurement profile name is required.');
    const now = nowIso();
    const id = createId();
    await this.db.transaction(async tx => {
      await tx.execute(
        `INSERT INTO measurement_profiles (
          id, customer_id, template_id, name, unit, notes,
          created_at, updated_at, deleted_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending');`,
        [id, input.customerId, input.templateId, name, input.unit, input.notes ?? null, now, now],
      );
      for (const v of input.values) {
        await tx.execute(
          `INSERT INTO measurement_values (
            id, profile_id, field_key, field_label, value, unit,
            created_at, updated_at, deleted_at, sync_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending');`,
          [createId(), id, v.fieldKey, v.fieldLabel, v.value, v.unit, now, now],
        );
      }
    });
    const created = await this.getProfile(id);
    if (!created) throw new Error('Failed to load measurement profile');
    return created;
  }

  async copyProfile(profileId: string, name?: string): Promise<MeasurementProfile> {
    const source = await this.getProfile(profileId);
    if (!source) throw new NotFoundError('Measurement profile not found.');
    return this.createProfile({
      customerId: source.customerId,
      templateId: source.templateId,
      name: name?.trim() || `${source.name} (copy)`,
      unit: source.unit,
      notes: source.notes,
      values: source.values.map(v => ({
        fieldKey: v.fieldKey,
        fieldLabel: v.fieldLabel,
        value: v.value,
        unit: v.unit,
      })),
    });
  }
}

function mapValue(row: Row): MeasurementValue {
  return {
    id: str(row.id),
    profileId: str(row.profile_id),
    fieldKey: str(row.field_key),
    fieldLabel: str(row.field_label),
    value: row.value === null || row.value === undefined ? null : num(row.value),
    unit: (str(row.unit) || 'in') as MeasurementUnit,
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    deletedAt: strOrNull(row.deleted_at),
    syncStatus: str(row.sync_status) as MeasurementValue['syncStatus'],
  };
}

export type CreateOrderInput = {
  customerId: string;
  dueDate?: string | null;
  fabricInfo?: string | null;
  color?: string | null;
  instructions?: string | null;
  notes?: string | null;
  discount?: number;
  measurementProfileId?: string | null;
  items: { garmentId: string; garmentName: string; quantity: number; unitPrice: number; notes?: string | null }[];
  advancePayment?: { amount: number; method: PaymentMethod; note?: string | null } | null;
};

export class SqliteOrderRepository {
  constructor(private readonly db: Database) {}

  private async nextOrderNumber(): Promise<string> {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const result = await this.db.execute(
      `SELECT COUNT(*) AS c FROM orders WHERE order_number LIKE ?;`,
      [`ORD-${day}-%`],
    );
    const seq = num(asRows(result)[0]?.c) + 1;
    return `ORD-${day}-${String(seq).padStart(4, '0')}`;
  }

  async create(input: CreateOrderInput): Promise<Order> {
    if (!input.customerId) throw new ValidationError('Customer is required.');
    if (!input.items.length) throw new ValidationError('Add at least one garment.');
    const now = nowIso();
    const id = createId();
    const orderNumber = await this.nextOrderNumber();
    const subtotal = input.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const discount = Math.max(0, input.discount ?? 0);
    const total = Math.max(0, subtotal - discount);

    await this.db.transaction(async tx => {
      await tx.execute(
        `INSERT INTO orders (
          id, order_number, customer_id, status, due_date, fabric_info, color,
          instructions, notes, subtotal, discount, total, measurement_profile_id,
          created_at, updated_at, deleted_at, sync_status
        ) VALUES (?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending');`,
        [
          id,
          orderNumber,
          input.customerId,
          input.dueDate ?? null,
          input.fabricInfo ?? null,
          input.color ?? null,
          input.instructions ?? null,
          input.notes ?? null,
          subtotal,
          discount,
          total,
          input.measurementProfileId ?? null,
          now,
          now,
        ],
      );
      for (const item of input.items) {
        const lineTotal = item.quantity * item.unitPrice;
        await tx.execute(
          `INSERT INTO order_items (
            id, order_id, garment_id, garment_name, quantity, unit_price, line_total, notes,
            created_at, updated_at, deleted_at, sync_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending');`,
          [
            createId(),
            id,
            item.garmentId,
            item.garmentName,
            item.quantity,
            item.unitPrice,
            lineTotal,
            item.notes ?? null,
            now,
            now,
          ],
        );
      }
      await tx.execute(
        `INSERT INTO production_events (
          id, order_id, from_status, to_status, note, changed_at,
          created_at, updated_at, deleted_at, sync_status
        ) VALUES (?, ?, NULL, 'new', 'Order created', ?, ?, ?, NULL, 'pending');`,
        [createId(), id, now, now, now],
      );
      if (input.advancePayment && input.advancePayment.amount > 0) {
        await tx.execute(
          `INSERT INTO payments (
            id, order_id, customer_id, amount, method, kind, note, paid_at,
            created_at, updated_at, deleted_at, sync_status
          ) VALUES (?, ?, ?, ?, ?, 'payment', ?, ?, ?, ?, NULL, 'pending');`,
          [
            createId(),
            id,
            input.customerId,
            input.advancePayment.amount,
            input.advancePayment.method,
            input.advancePayment.note ?? 'Advance',
            now,
            now,
            now,
          ],
        );
      }
    });

    const order = await this.getById(id);
    if (!order) throw new Error('Failed to load order');
    return order;
  }

  async list(options?: {
    status?: ProductionStatus | 'active' | 'all';
    customerId?: string;
    query?: string;
  }): Promise<Order[]> {
    const where: string[] = ['o.deleted_at IS NULL'];
    const params: string[] = [];
    if (options?.customerId) {
      where.push('o.customer_id = ?');
      params.push(options.customerId);
    }
    if (options?.status === 'active') {
      where.push(`o.status NOT IN ('delivered')`);
    } else if (options?.status && options.status !== 'all') {
      where.push('o.status = ?');
      params.push(options.status);
    }
    if (options?.query?.trim()) {
      where.push('(o.order_number LIKE ? OR o.notes LIKE ? OR o.fabric_info LIKE ? OR c.name LIKE ?)');
      const like = `%${options.query.trim()}%`;
      params.push(like, like, like, like);
    }
    const result = await this.db.execute(
      `SELECT o.* FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       WHERE ${where.join(' AND ')}
       ORDER BY o.created_at DESC;`,
      params,
    );
    const orders: Order[] = [];
    for (const row of asRows(result)) {
      orders.push(await this.hydrateOrder(row));
    }
    return orders;
  }

  async getById(id: string): Promise<Order | null> {
    const result = await this.db.execute(
      `SELECT * FROM orders WHERE id = ? AND deleted_at IS NULL LIMIT 1;`,
      [id],
    );
    const row = asRows(result)[0];
    return row ? this.hydrateOrder(row) : null;
  }

  private async hydrateOrder(row: Row): Promise<Order> {
    const id = str(row.id);
    const items = asRows(
      await this.db.execute(
        `SELECT * FROM order_items WHERE order_id = ? AND deleted_at IS NULL;`,
        [id],
      ),
    ).map(mapItem);
    const paid = asRows(
      await this.db.execute(
        `SELECT COALESCE(SUM(amount), 0) AS paid FROM payments WHERE order_id = ? AND deleted_at IS NULL;`,
        [id],
      ),
    )[0];
    const amountPaid = num(paid?.paid);
    const total = num(row.total);
    return {
      id,
      orderNumber: str(row.order_number),
      customerId: str(row.customer_id),
      status: str(row.status) as ProductionStatus,
      dueDate: strOrNull(row.due_date),
      fabricInfo: strOrNull(row.fabric_info),
      color: strOrNull(row.color),
      instructions: strOrNull(row.instructions),
      notes: strOrNull(row.notes),
      subtotal: num(row.subtotal),
      discount: num(row.discount),
      total,
      measurementProfileId: strOrNull(row.measurement_profile_id),
      items,
      amountPaid,
      balance: Math.max(0, total - amountPaid),
      createdAt: str(row.created_at),
      updatedAt: str(row.updated_at),
      deletedAt: strOrNull(row.deleted_at),
      syncStatus: str(row.sync_status) as Order['syncStatus'],
    };
  }

  async advanceStatus(orderId: string, note?: string | null): Promise<Order> {
    const order = await this.getById(orderId);
    if (!order) throw new NotFoundError('Order not found.');
    const next = nextProductionStatus(order.status);
    if (!next) throw new ValidationError('Order is already delivered.');
    return this.setStatus(orderId, next, note);
  }

  async setStatus(
    orderId: string,
    toStatus: ProductionStatus,
    note?: string | null,
  ): Promise<Order> {
    const order = await this.getById(orderId);
    if (!order) throw new NotFoundError('Order not found.');
    const now = nowIso();
    await this.db.transaction(async tx => {
      await tx.execute(
        `UPDATE orders SET status = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?;`,
        [toStatus, now, orderId],
      );
      await tx.execute(
        `INSERT INTO production_events (
          id, order_id, from_status, to_status, note, changed_at,
          created_at, updated_at, deleted_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending');`,
        [createId(), orderId, order.status, toStatus, note ?? null, now, now, now],
      );
    });
    const updated = await this.getById(orderId);
    if (!updated) throw new Error('Failed to load order');
    return updated;
  }

  async listProductionEvents(orderId: string): Promise<ProductionEvent[]> {
    const result = await this.db.execute(
      `SELECT * FROM production_events WHERE order_id = ? AND deleted_at IS NULL ORDER BY changed_at ASC;`,
      [orderId],
    );
    return asRows(result).map(row => ({
      id: str(row.id),
      orderId: str(row.order_id),
      fromStatus: strOrNull(row.from_status) as ProductionStatus | null,
      toStatus: str(row.to_status) as ProductionStatus,
      note: strOrNull(row.note),
      changedAt: str(row.changed_at),
      createdAt: str(row.created_at),
      updatedAt: str(row.updated_at),
      deletedAt: strOrNull(row.deleted_at),
      syncStatus: str(row.sync_status) as ProductionEvent['syncStatus'],
    }));
  }
}

function mapItem(row: Row): OrderItem {
  return {
    id: str(row.id),
    orderId: str(row.order_id),
    garmentId: str(row.garment_id),
    garmentName: str(row.garment_name),
    quantity: num(row.quantity, 1),
    unitPrice: num(row.unit_price),
    lineTotal: num(row.line_total),
    notes: strOrNull(row.notes),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    deletedAt: strOrNull(row.deleted_at),
    syncStatus: str(row.sync_status) as OrderItem['syncStatus'],
  };
}

export class SqlitePaymentRepository {
  constructor(private readonly db: Database) {}

  async listForOrder(orderId: string): Promise<Payment[]> {
    const result = await this.db.execute(
      `SELECT * FROM payments WHERE order_id = ? AND deleted_at IS NULL ORDER BY paid_at ASC;`,
      [orderId],
    );
    return asRows(result).map(mapPayment);
  }

  async listForCustomer(customerId: string): Promise<Payment[]> {
    const result = await this.db.execute(
      `SELECT * FROM payments WHERE customer_id = ? AND deleted_at IS NULL ORDER BY paid_at DESC;`,
      [customerId],
    );
    return asRows(result).map(mapPayment);
  }

  async add(input: {
    orderId: string;
    customerId: string;
    amount: number;
    method: PaymentMethod;
    kind?: Payment['kind'];
    note?: string | null;
  }): Promise<Payment> {
    if (!(input.amount > 0) && input.kind !== 'adjustment' && input.kind !== 'reversal') {
      throw new ValidationError('Payment amount must be greater than zero.');
    }
    const now = nowIso();
    const payment: Payment = {
      id: createId(),
      orderId: input.orderId,
      customerId: input.customerId,
      amount: input.amount,
      method: input.method,
      kind: input.kind ?? 'payment',
      note: input.note ?? null,
      paidAt: now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending',
    };
    await this.db.execute(
      `INSERT INTO payments (
        id, order_id, customer_id, amount, method, kind, note, paid_at,
        created_at, updated_at, deleted_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending');`,
      [
        payment.id,
        payment.orderId,
        payment.customerId,
        payment.amount,
        payment.method,
        payment.kind,
        payment.note,
        payment.paidAt,
        payment.createdAt,
        payment.updatedAt,
      ],
    );
    return payment;
  }
}

function mapPayment(row: Row): Payment {
  return {
    id: str(row.id),
    orderId: str(row.order_id),
    customerId: str(row.customer_id),
    amount: num(row.amount),
    method: str(row.method) as PaymentMethod,
    kind: str(row.kind) as Payment['kind'],
    note: strOrNull(row.note),
    paidAt: str(row.paid_at),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    deletedAt: strOrNull(row.deleted_at),
    syncStatus: str(row.sync_status) as Payment['syncStatus'],
  };
}

export class SqliteDesignRepository {
  constructor(private readonly db: Database) {}

  async listForOrder(orderId: string): Promise<DesignReference[]> {
    const result = await this.db.execute(
      `SELECT * FROM design_references WHERE order_id = ? AND deleted_at IS NULL ORDER BY created_at DESC;`,
      [orderId],
    );
    return asRows(result).map(row => ({
      id: str(row.id),
      orderId: str(row.order_id),
      mediaKey: str(row.media_key),
      caption: strOrNull(row.caption),
      kind: str(row.kind),
      createdAt: str(row.created_at),
      updatedAt: str(row.updated_at),
      deletedAt: strOrNull(row.deleted_at),
      syncStatus: str(row.sync_status) as DesignReference['syncStatus'],
    }));
  }

  async add(input: {
    orderId: string;
    mediaKey: string;
    caption?: string | null;
    kind?: string;
  }): Promise<DesignReference> {
    if (!input.mediaKey.trim()) throw new ValidationError('Image is required.');
    const now = nowIso();
    const ref: DesignReference = {
      id: createId(),
      orderId: input.orderId,
      mediaKey: input.mediaKey,
      caption: input.caption ?? null,
      kind: input.kind ?? 'reference',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending',
    };
    await this.db.execute(
      `INSERT INTO design_references (
        id, order_id, media_key, caption, kind,
        created_at, updated_at, deleted_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'pending');`,
      [ref.id, ref.orderId, ref.mediaKey, ref.caption, ref.kind, ref.createdAt, ref.updatedAt],
    );
    return ref;
  }

  async archive(id: string): Promise<void> {
    await this.db.execute(
      `UPDATE design_references SET deleted_at = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?;`,
      [nowIso(), nowIso(), id],
    );
  }
}

export class SqliteAlterationRepository {
  constructor(private readonly db: Database) {}

  async listForCustomer(customerId: string): Promise<Alteration[]> {
    const result = await this.db.execute(
      `SELECT * FROM alterations WHERE customer_id = ? AND deleted_at IS NULL ORDER BY created_at DESC;`,
      [customerId],
    );
    return asRows(result).map(mapAlteration);
  }

  async listForOrder(orderId: string): Promise<Alteration[]> {
    const result = await this.db.execute(
      `SELECT * FROM alterations WHERE order_id = ? AND deleted_at IS NULL ORDER BY created_at DESC;`,
      [orderId],
    );
    return asRows(result).map(mapAlteration);
  }

  async create(input: {
    orderId: string;
    customerId: string;
    problem: string;
    requestedChange?: string | null;
    notes?: string | null;
    cost?: number | null;
  }): Promise<Alteration> {
    if (!input.problem.trim()) throw new ValidationError('Describe the alteration problem.');
    const now = nowIso();
    const row: Alteration = {
      id: createId(),
      orderId: input.orderId,
      customerId: input.customerId,
      problem: input.problem.trim(),
      requestedChange: input.requestedChange ?? null,
      notes: input.notes ?? null,
      status: 'open',
      cost: input.cost ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending',
    };
    await this.db.execute(
      `INSERT INTO alterations (
        id, order_id, customer_id, problem, requested_change, notes, status, cost,
        created_at, updated_at, deleted_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending');`,
      [
        row.id,
        row.orderId,
        row.customerId,
        row.problem,
        row.requestedChange,
        row.notes,
        row.status,
        row.cost,
        row.createdAt,
        row.updatedAt,
      ],
    );
    return row;
  }
}

function mapAlteration(row: Row): Alteration {
  return {
    id: str(row.id),
    orderId: str(row.order_id),
    customerId: str(row.customer_id),
    problem: str(row.problem),
    requestedChange: strOrNull(row.requested_change),
    notes: strOrNull(row.notes),
    status: str(row.status) as Alteration['status'],
    cost: row.cost === null || row.cost === undefined ? null : num(row.cost),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    deletedAt: strOrNull(row.deleted_at),
    syncStatus: str(row.sync_status) as Alteration['syncStatus'],
  };
}

export class SqliteInventoryRepository {
  constructor(private readonly db: Database) {}

  async list(query?: string): Promise<InventoryItem[]> {
    const params: string[] = [];
    let sql = `SELECT * FROM inventory_items WHERE deleted_at IS NULL`;
    if (query?.trim()) {
      sql += ` AND (name LIKE ? OR notes LIKE ? OR category LIKE ?)`;
      const like = `%${query.trim()}%`;
      params.push(like, like, like);
    }
    sql += ' ORDER BY name COLLATE NOCASE ASC;';
    return asRows(await this.db.execute(sql, params)).map(mapInventory);
  }

  async create(input: {
    name: string;
    category: InventoryCategory;
    quantity: number;
    unit: string;
    notes?: string | null;
  }): Promise<InventoryItem> {
    if (!input.name.trim()) throw new ValidationError('Item name is required.');
    const now = nowIso();
    const item: InventoryItem = {
      id: createId(),
      name: input.name.trim(),
      category: input.category,
      quantity: input.quantity,
      unit: input.unit || 'pcs',
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending',
    };
    await this.db.execute(
      `INSERT INTO inventory_items (
        id, name, category, quantity, unit, notes,
        created_at, updated_at, deleted_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending');`,
      [item.id, item.name, item.category, item.quantity, item.unit, item.notes, item.createdAt, item.updatedAt],
    );
    return item;
  }

  async adjust(itemId: string, delta: number, reason?: string | null): Promise<InventoryItem> {
    const result = await this.db.execute(
      `SELECT * FROM inventory_items WHERE id = ? AND deleted_at IS NULL LIMIT 1;`,
      [itemId],
    );
    const row = asRows(result)[0];
    if (!row) throw new NotFoundError('Inventory item not found.');
    const now = nowIso();
    const nextQty = num(row.quantity) + delta;
    await this.db.transaction(async tx => {
      await tx.execute(
        `UPDATE inventory_items SET quantity = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?;`,
        [nextQty, now, itemId],
      );
      await tx.execute(
        `INSERT INTO inventory_transactions (
          id, item_id, delta, reason, notes,
          created_at, updated_at, deleted_at, sync_status
        ) VALUES (?, ?, ?, ?, NULL, ?, ?, NULL, 'pending');`,
        [createId(), itemId, delta, reason ?? null, now, now],
      );
    });
    const updated = asRows(
      await this.db.execute(`SELECT * FROM inventory_items WHERE id = ?;`, [itemId]),
    )[0];
    return mapInventory(updated);
  }
}

function mapInventory(row: Row): InventoryItem {
  return {
    id: str(row.id),
    name: str(row.name),
    category: str(row.category) as InventoryCategory,
    quantity: num(row.quantity),
    unit: str(row.unit) || 'pcs',
    notes: strOrNull(row.notes),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    deletedAt: strOrNull(row.deleted_at),
    syncStatus: str(row.sync_status) as InventoryItem['syncStatus'],
  };
}

export class SqliteStaffRepository {
  constructor(private readonly db: Database) {}

  async list(query?: string): Promise<StaffMember[]> {
    const params: string[] = [];
    let sql = `SELECT * FROM staff WHERE deleted_at IS NULL`;
    if (query?.trim()) {
      sql += ` AND (name LIKE ? OR role LIKE ? OR phone LIKE ?)`;
      const like = `%${query.trim()}%`;
      params.push(like, like, like);
    }
    sql += ' ORDER BY name COLLATE NOCASE ASC;';
    return asRows(await this.db.execute(sql, params)).map(mapStaff);
  }

  async create(input: {
    name: string;
    role: StaffRole;
    phone?: string | null;
    notes?: string | null;
  }): Promise<StaffMember> {
    if (!input.name.trim()) throw new ValidationError('Staff name is required.');
    const now = nowIso();
    const member: StaffMember = {
      id: createId(),
      name: input.name.trim(),
      role: input.role,
      phone: input.phone ?? null,
      notes: input.notes ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending',
    };
    await this.db.execute(
      `INSERT INTO staff (
        id, name, role, phone, notes, is_active,
        created_at, updated_at, deleted_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, NULL, 'pending');`,
      [member.id, member.name, member.role, member.phone, member.notes, member.createdAt, member.updatedAt],
    );
    return member;
  }

  async archive(id: string): Promise<void> {
    await this.db.execute(
      `UPDATE staff SET deleted_at = ?, is_active = 0, updated_at = ?, sync_status = 'pending' WHERE id = ?;`,
      [nowIso(), nowIso(), id],
    );
  }
}

function mapStaff(row: Row): StaffMember {
  return {
    id: str(row.id),
    name: str(row.name),
    role: str(row.role) as StaffRole,
    phone: strOrNull(row.phone),
    notes: strOrNull(row.notes),
    isActive: bool(row.is_active),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    deletedAt: strOrNull(row.deleted_at),
    syncStatus: str(row.sync_status) as StaffMember['syncStatus'],
  };
}

export class SqliteSearchRepository {
  constructor(private readonly db: Database) {}

  async search(query: string): Promise<SearchResult[]> {
    const q = query.trim();
    if (!q) return [];
    const like = `%${q}%`;
    const results: SearchResult[] = [];

    const customers = asRows(
      await this.db.execute(
        `SELECT id, name, phone FROM customers WHERE deleted_at IS NULL AND (name LIKE ? OR phone LIKE ? OR whatsapp LIKE ? OR notes LIKE ?) LIMIT 20;`,
        [like, like, like, like],
      ),
    );
    for (const c of customers) {
      results.push({
        type: 'customer',
        id: str(c.id),
        title: str(c.name),
        subtitle: strOrNull(c.phone),
      });
    }

    const orders = asRows(
      await this.db.execute(
        `SELECT o.id, o.order_number, o.status, c.name AS customer_name
         FROM orders o LEFT JOIN customers c ON c.id = o.customer_id
         WHERE o.deleted_at IS NULL AND (o.order_number LIKE ? OR o.notes LIKE ? OR o.fabric_info LIKE ? OR c.name LIKE ?)
         LIMIT 20;`,
        [like, like, like, like],
      ),
    );
    for (const o of orders) {
      results.push({
        type: 'order',
        id: str(o.id),
        title: str(o.order_number),
        subtitle: `${str(o.customer_name)} · ${str(o.status)}`,
      });
    }

    const inventory = asRows(
      await this.db.execute(
        `SELECT id, name, category FROM inventory_items WHERE deleted_at IS NULL AND (name LIKE ? OR notes LIKE ?) LIMIT 10;`,
        [like, like],
      ),
    );
    for (const i of inventory) {
      results.push({
        type: 'inventory',
        id: str(i.id),
        title: str(i.name),
        subtitle: str(i.category),
      });
    }

    return results;
  }
}

export class SqliteDashboardRepository {
  constructor(private readonly db: Database) {}

  async getSnapshot(): Promise<DashboardSnapshot> {
    const today = new Date().toISOString().slice(0, 10);
    const start = `${today}T00:00:00.000Z`;
    const end = `${today}T23:59:59.999Z`;

    const ordersToday = num(
      asRows(
        await this.db.execute(
          `SELECT COUNT(*) AS c FROM orders WHERE deleted_at IS NULL AND created_at >= ? AND created_at <= ?;`,
          [start, end],
        ),
      )[0]?.c,
    );
    const dueToday = num(
      asRows(
        await this.db.execute(
          `SELECT COUNT(*) AS c FROM orders WHERE deleted_at IS NULL AND due_date = ? AND status != 'delivered';`,
          [today],
        ),
      )[0]?.c,
    );
    const overdue = num(
      asRows(
        await this.db.execute(
          `SELECT COUNT(*) AS c FROM orders WHERE deleted_at IS NULL AND due_date IS NOT NULL AND due_date < ? AND status NOT IN ('ready','delivered');`,
          [today],
        ),
      )[0]?.c,
    );
    const ready = num(
      asRows(
        await this.db.execute(
          `SELECT COUNT(*) AS c FROM orders WHERE deleted_at IS NULL AND status = 'ready';`,
        ),
      )[0]?.c,
    );

    const balanceRows = asRows(
      await this.db.execute(
        `SELECT o.total AS total,
          COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.order_id = o.id AND p.deleted_at IS NULL), 0) AS paid
         FROM orders o WHERE o.deleted_at IS NULL AND o.status != 'delivered';`,
      ),
    );
    const outstandingBalance = balanceRows.reduce(
      (sum, r) => sum + Math.max(0, num(r.total) - num(r.paid)),
      0,
    );

    const recentCustomers = asRows(
      await this.db.execute(
        `SELECT id, name, phone FROM customers WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5;`,
      ),
    ).map(r => ({ id: str(r.id), name: str(r.name), phone: strOrNull(r.phone) }));

    const recentOrders = asRows(
      await this.db.execute(
        `SELECT o.id, o.order_number, o.customer_id, o.status, o.due_date, o.total, c.name AS customer_name,
          COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.order_id = o.id AND p.deleted_at IS NULL), 0) AS paid
         FROM orders o LEFT JOIN customers c ON c.id = o.customer_id
         WHERE o.deleted_at IS NULL
         ORDER BY o.created_at DESC LIMIT 8;`,
      ),
    ).map(r => ({
      id: str(r.id),
      orderNumber: str(r.order_number),
      customerId: str(r.customer_id),
      customerName: str(r.customer_name) || 'Customer',
      status: str(r.status) as ProductionStatus,
      dueDate: strOrNull(r.due_date),
      balance: Math.max(0, num(r.total) - num(r.paid)),
    }));

    const actionableOrders = asRows(
      await this.db.execute(
        `SELECT o.id, o.order_number, o.customer_id, o.status, o.due_date, c.name AS customer_name
         FROM orders o LEFT JOIN customers c ON c.id = o.customer_id
         WHERE o.deleted_at IS NULL AND o.status IN ('new','measurement','cutting','stitching','finishing','quality_check','ready')
         ORDER BY CASE WHEN o.due_date IS NULL THEN 1 ELSE 0 END, o.due_date ASC
         LIMIT 10;`,
      ),
    ).map(r => ({
      id: str(r.id),
      orderNumber: str(r.order_number),
      customerId: str(r.customer_id),
      customerName: str(r.customer_name) || 'Customer',
      status: str(r.status) as ProductionStatus,
      dueDate: strOrNull(r.due_date),
    }));

    return {
      ordersToday,
      dueToday,
      overdue,
      ready,
      outstandingBalance,
      recentCustomers,
      recentOrders,
      actionableOrders,
    };
  }
}

function localDayBounds(date = new Date()): { start: string; end: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function localMonthBounds(date = new Date()): { start: string; end: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export class SqliteExpenseRepository {
  constructor(private readonly db: Database) {}

  async list(limit = 50): Promise<Expense[]> {
    const result = await this.db.execute(
      `SELECT * FROM expenses WHERE deleted_at IS NULL ORDER BY spent_at DESC LIMIT ?;`,
      [limit],
    );
    return asRows(result).map(mapExpense);
  }

  async listBetween(startIso: string, endIso: string): Promise<Expense[]> {
    const result = await this.db.execute(
      `SELECT * FROM expenses
       WHERE deleted_at IS NULL AND spent_at >= ? AND spent_at <= ?
       ORDER BY spent_at DESC;`,
      [startIso, endIso],
    );
    return asRows(result).map(mapExpense);
  }

  async create(input: {
    title: string;
    category: ExpenseCategory;
    amount: number;
    spentAt?: string | null;
    notes?: string | null;
  }): Promise<Expense> {
    const title = input.title.trim();
    if (!title) throw new ValidationError('Expense title is required.');
    const amount = Number(input.amount);
    if (!(amount > 0)) throw new ValidationError('Expense amount must be greater than zero.');
    const now = nowIso();
    const expense: Expense = {
      id: createId(),
      title,
      category: input.category,
      amount,
      spentAt: input.spentAt?.trim() || now,
      notes: input.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending',
    };
    await this.db.execute(
      `INSERT INTO expenses (
        id, title, category, amount, spent_at, notes,
        created_at, updated_at, deleted_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending');`,
      [
        expense.id,
        expense.title,
        expense.category,
        expense.amount,
        expense.spentAt,
        expense.notes,
        expense.createdAt,
        expense.updatedAt,
      ],
    );
    return expense;
  }

  async remove(id: string): Promise<void> {
    const now = nowIso();
    await this.db.execute(
      `UPDATE expenses SET deleted_at = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?;`,
      [now, now, id],
    );
  }

  async sumBetween(startIso: string, endIso: string): Promise<number> {
    const row = asRows(
      await this.db.execute(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM expenses
         WHERE deleted_at IS NULL AND spent_at >= ? AND spent_at <= ?;`,
        [startIso, endIso],
      ),
    )[0];
    return num(row?.total);
  }
}

export class SqliteReportRepository {
  constructor(
    private readonly db: Database,
    private readonly expenseRepository: SqliteExpenseRepository,
  ) {}

  private async incomeBetween(startIso: string, endIso: string): Promise<number> {
    const row = asRows(
      await this.db.execute(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM payments
         WHERE deleted_at IS NULL
           AND kind = 'payment'
           AND paid_at >= ?
           AND paid_at <= ?;`,
        [startIso, endIso],
      ),
    )[0];
    return num(row?.total);
  }

  private async profitBetween(startIso: string, endIso: string): Promise<ProfitReport> {
    const [income, expenses] = await Promise.all([
      this.incomeBetween(startIso, endIso),
      this.expenseRepository.sumBetween(startIso, endIso),
    ]);
    return { income, expenses, profit: income - expenses };
  }

  async todayProfit(): Promise<ProfitReport> {
    const { start, end } = localDayBounds();
    return this.profitBetween(start, end);
  }

  async monthProfit(): Promise<ProfitReport> {
    const { start, end } = localMonthBounds();
    return this.profitBetween(start, end);
  }

  async listTodayExpenses(): Promise<Expense[]> {
    const { start, end } = localDayBounds();
    return this.expenseRepository.listBetween(start, end);
  }

  async listMonthExpenses(): Promise<Expense[]> {
    const { start, end } = localMonthBounds();
    return this.expenseRepository.listBetween(start, end);
  }
}

function mapExpense(row: Row): Expense {
  return {
    id: str(row.id),
    title: str(row.title),
    category: str(row.category) as ExpenseCategory,
    amount: num(row.amount),
    spentAt: str(row.spent_at),
    notes: strOrNull(row.notes),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    deletedAt: strOrNull(row.deleted_at),
    syncStatus: str(row.sync_status) as Expense['syncStatus'],
  };
}
