import type { Database } from '../database/client';
import type {
  Alteration,
  BusinessProfile,
  DashboardSnapshot,
  DesignReference,
  Garment,
  InventoryItem,
  MeasurementProfile,
  MeasurementTemplate,
  MeasurementTemplateField,
  MeasurementValue,
  Order,
  OrderItem,
  Payment,
  ProductionEvent,
  SearchResult,
  StaffMember,
} from '../../domain/types/models';
import type {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from '../../domain/types/customer';
import type { CustomerRepository } from '../../domain/repositories/customer_repository';
import {
  GARMENT_SEEDS,
  nextProductionStatus,
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
  if (v === null || v === undefined || v === '') {
    return null;
  }
  return String(v);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown): boolean {
  return Number(v) === 1 || v === true;
}

export class SqliteCustomerRepository implements CustomerRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateCustomerInput): Promise<Customer> {
    const name = input.name?.trim();
    if (!name) {
      throw new ValidationError('Customer name is required.');
    }
    const now = nowIso();
    const customer: Customer = {
      id: createId(),
      name,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      address: input.address ?? null,
      notes: input.notes ?? null,
      photoKey: input.photoKey ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending',
    };
    await this.db.execute(
      `INSERT INTO customers (
        id, name, phone, whatsapp, address, notes, photo_key,
        created_at, updated_at, deleted_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        customer.id,
        customer.name,
        customer.phone,
        customer.whatsapp,
        customer.address,
        customer.notes,
        customer.photoKey,
        customer.createdAt,
        customer.updatedAt,
        customer.deletedAt,
        customer.syncStatus,
      ],
    );
    return customer;
  }

  async update(id: string, input: UpdateCustomerInput): Promise<Customer> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Customer not found.');
    }
    const nextName = input.name !== undefined ? input.name.trim() : existing.name;
    if (!nextName) {
      throw new ValidationError('Customer name is required.');
    }
    const updated: Customer = {
      ...existing,
      name: nextName,
      phone: input.phone !== undefined ? input.phone : existing.phone,
      whatsapp: input.whatsapp !== undefined ? input.whatsapp : existing.whatsapp,
      address: input.address !== undefined ? input.address : existing.address,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      photoKey: input.photoKey !== undefined ? input.photoKey : existing.photoKey,
      updatedAt: nowIso(),
      syncStatus: 'pending',
    };
    await this.db.execute(
      `UPDATE customers SET
        name = ?, phone = ?, whatsapp = ?, address = ?, notes = ?, photo_key = ?,
        updated_at = ?, sync_status = ?
      WHERE id = ? AND deleted_at IS NULL;`,
      [
        updated.name,
        updated.phone,
        updated.whatsapp,
        updated.address,
        updated.notes,
        updated.photoKey,
        updated.updatedAt,
        updated.syncStatus,
        id,
      ],
    );
    return updated;
  }

  async getById(id: string): Promise<Customer | null> {
    const result = await this.db.execute(
      `SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL LIMIT 1;`,
      [id],
    );
    const row = asRows(result)[0];
    return row ? mapCustomer(row) : null;
  }

  async list(options?: { includeArchived?: boolean; query?: string }): Promise<Customer[]> {
    const includeArchived = options?.includeArchived ?? false;
    const query = options?.query?.trim();
    let sql = `SELECT * FROM customers`;
    const params: string[] = [];
    const where: string[] = [];
    if (!includeArchived) {
      where.push('deleted_at IS NULL');
    }
    if (query) {
      where.push('(name LIKE ? OR phone LIKE ? OR whatsapp LIKE ? OR notes LIKE ?)');
      const like = `%${query}%`;
      params.push(like, like, like, like);
    }
    if (where.length) {
      sql += ` WHERE ${where.join(' AND ')}`;
    }
    sql += ' ORDER BY name COLLATE NOCASE ASC;';
    const result = await this.db.execute(sql, params);
    return asRows(result).map(mapCustomer);
  }

  async archive(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Customer not found.');
    }
    await this.db.execute(
      `UPDATE customers SET deleted_at = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?;`,
      [nowIso(), nowIso(), id],
    );
  }
}

function mapCustomer(row: Row): Customer {
  return {
    id: str(row.id),
    name: str(row.name),
    phone: strOrNull(row.phone),
    whatsapp: strOrNull(row.whatsapp),
    address: strOrNull(row.address),
    notes: strOrNull(row.notes),
    photoKey: strOrNull(row.photo_key),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    deletedAt: strOrNull(row.deleted_at),
    syncStatus: str(row.sync_status) as Customer['syncStatus'],
  };
}

export class SqliteBusinessRepository {
  constructor(private readonly db: Database) {}

  async get(): Promise<BusinessProfile | null> {
    const result = await this.db.execute(
      `SELECT * FROM business_profile WHERE deleted_at IS NULL ORDER BY created_at ASC LIMIT 1;`,
    );
    const row = asRows(result)[0];
    return row ? mapBusiness(row) : null;
  }

  async upsert(input: {
    name: string;
    ownerName?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    address?: string | null;
    logoKey?: string | null;
    currency?: string;
    defaultMeasurementUnit?: MeasurementUnit;
  }): Promise<BusinessProfile> {
    const name = input.name.trim();
    if (!name) {
      throw new ValidationError('Business name is required.');
    }
    const existing = await this.get();
    const now = nowIso();
    if (!existing) {
      const profile: BusinessProfile = {
        id: createId(),
        name,
        ownerName: input.ownerName ?? null,
        phone: input.phone ?? null,
        whatsapp: input.whatsapp ?? null,
        address: input.address ?? null,
        logoKey: input.logoKey ?? null,
        currency: input.currency ?? 'PKR',
        defaultMeasurementUnit: input.defaultMeasurementUnit ?? 'in',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'pending',
      };
      await this.db.execute(
        `INSERT INTO business_profile (
          id, name, owner_name, phone, whatsapp, address, logo_key, currency,
          default_measurement_unit, created_at, updated_at, deleted_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          profile.id,
          profile.name,
          profile.ownerName,
          profile.phone,
          profile.whatsapp,
          profile.address,
          profile.logoKey,
          profile.currency,
          profile.defaultMeasurementUnit,
          profile.createdAt,
          profile.updatedAt,
          profile.deletedAt,
          profile.syncStatus,
        ],
      );
      return profile;
    }

    const updated: BusinessProfile = {
      ...existing,
      name,
      ownerName: input.ownerName !== undefined ? input.ownerName : existing.ownerName,
      phone: input.phone !== undefined ? input.phone : existing.phone,
      whatsapp: input.whatsapp !== undefined ? input.whatsapp : existing.whatsapp,
      address: input.address !== undefined ? input.address : existing.address,
      logoKey: input.logoKey !== undefined ? input.logoKey : existing.logoKey,
      currency: input.currency ?? existing.currency,
      defaultMeasurementUnit:
        input.defaultMeasurementUnit ?? existing.defaultMeasurementUnit,
      updatedAt: now,
      syncStatus: 'pending',
    };
    await this.db.execute(
      `UPDATE business_profile SET
        name = ?, owner_name = ?, phone = ?, whatsapp = ?, address = ?, logo_key = ?,
        currency = ?, default_measurement_unit = ?, updated_at = ?, sync_status = ?
      WHERE id = ?;`,
      [
        updated.name,
        updated.ownerName,
        updated.phone,
        updated.whatsapp,
        updated.address,
        updated.logoKey,
        updated.currency,
        updated.defaultMeasurementUnit,
        updated.updatedAt,
        updated.syncStatus,
        updated.id,
      ],
    );
    return updated;
  }
}

function mapBusiness(row: Row): BusinessProfile {
  return {
    id: str(row.id),
    name: str(row.name),
    ownerName: strOrNull(row.owner_name),
    phone: strOrNull(row.phone),
    whatsapp: strOrNull(row.whatsapp),
    address: strOrNull(row.address),
    logoKey: strOrNull(row.logo_key),
    currency: str(row.currency) || 'PKR',
    defaultMeasurementUnit: (str(row.default_measurement_unit) || 'in') as MeasurementUnit,
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    deletedAt: strOrNull(row.deleted_at),
    syncStatus: str(row.sync_status) as BusinessProfile['syncStatus'],
  };
}

export class SqliteCatalogRepository {
  constructor(private readonly db: Database) {}

  async listGarments(): Promise<Garment[]> {
    const result = await this.db.execute(
      `SELECT * FROM garments WHERE deleted_at IS NULL AND is_active = 1 ORDER BY sort_order ASC, name ASC;`,
    );
    return asRows(result).map(mapGarment);
  }

  async ensureSeeded(): Promise<void> {
    const existing = await this.db.execute(
      `SELECT COUNT(*) AS c FROM garments WHERE deleted_at IS NULL;`,
    );
    if (num(asRows(existing)[0]?.c) > 0) {
      await this.ensureTemplates();
      return;
    }
    const now = nowIso();
    await this.db.transaction(async tx => {
      for (const g of GARMENT_SEEDS) {
        await tx.execute(
          `INSERT INTO garments (
            id, name, code, is_custom, is_active, sort_order, default_price,
            created_at, updated_at, deleted_at, sync_status
          ) VALUES (?, ?, ?, ?, 1, ?, 0, ?, ?, NULL, 'pending');`,
          [
            createId(),
            g.name,
            g.code,
            'isCustom' in g && g.isCustom ? 1 : 0,
            g.sortOrder,
            now,
            now,
          ],
        );
      }
    });
    await this.ensureTemplates();
  }

  private async ensureTemplates(): Promise<void> {
    const existing = await this.db.execute(
      `SELECT COUNT(*) AS c FROM measurement_templates WHERE deleted_at IS NULL;`,
    );
    if (num(asRows(existing)[0]?.c) > 0) {
      return;
    }

    const garments = await this.listGarments();
    const byCode = Object.fromEntries(garments.map(g => [g.code, g]));
    const now = nowIso();

    const templates: {
      name: string;
      garmentCode: string;
      fields: { key: string; label: string }[];
    }[] = [
      {
        name: "Men's Shalwar Kameez",
        garmentCode: 'shalwar_kameez',
        fields: [
          { key: 'kameez_length', label: 'Kameez Length' },
          { key: 'shoulder', label: 'Shoulder' },
          { key: 'chest', label: 'Chest' },
          { key: 'waist', label: 'Waist' },
          { key: 'hip', label: 'Hip' },
          { key: 'sleeve', label: 'Sleeve' },
          { key: 'armhole', label: 'Armhole' },
          { key: 'neck', label: 'Neck' },
          { key: 'cuff', label: 'Cuff' },
          { key: 'shalwar_length', label: 'Shalwar Length' },
          { key: 'shalwar_bottom', label: 'Shalwar Bottom' },
        ],
      },
      {
        name: 'Shirt',
        garmentCode: 'shirt',
        fields: [
          { key: 'length', label: 'Length' },
          { key: 'shoulder', label: 'Shoulder' },
          { key: 'chest', label: 'Chest' },
          { key: 'waist', label: 'Waist' },
          { key: 'sleeve', label: 'Sleeve' },
          { key: 'neck', label: 'Neck' },
          { key: 'cuff', label: 'Cuff' },
        ],
      },
      {
        name: 'Trouser',
        garmentCode: 'trouser',
        fields: [
          { key: 'length', label: 'Length' },
          { key: 'waist', label: 'Waist' },
          { key: 'hip', label: 'Hip' },
          { key: 'thigh', label: 'Thigh' },
          { key: 'knee', label: 'Knee' },
          { key: 'bottom', label: 'Bottom' },
        ],
      },
    ];

    await this.db.transaction(async tx => {
      for (const t of templates) {
        const templateId = createId();
        const garment = byCode[t.garmentCode];
        await tx.execute(
          `INSERT INTO measurement_templates (
            id, name, garment_id, unit_default, is_system,
            created_at, updated_at, deleted_at, sync_status
          ) VALUES (?, ?, ?, 'in', 1, ?, ?, NULL, 'pending');`,
          [templateId, t.name, garment?.id ?? null, now, now],
        );
        let order = 0;
        for (const f of t.fields) {
          await tx.execute(
            `INSERT INTO measurement_template_fields (
              id, template_id, key, label, unit, sort_order, is_required,
              created_at, updated_at, deleted_at, sync_status
            ) VALUES (?, ?, ?, ?, 'in', ?, 0, ?, ?, NULL, 'pending');`,
            [createId(), templateId, f.key, f.label, order++, now, now],
          );
        }
      }
    });
  }

  async listTemplates(): Promise<MeasurementTemplate[]> {
    const templates = asRows(
      await this.db.execute(
        `SELECT * FROM measurement_templates WHERE deleted_at IS NULL ORDER BY name ASC;`,
      ),
    );
    const fields = asRows(
      await this.db.execute(
        `SELECT * FROM measurement_template_fields WHERE deleted_at IS NULL ORDER BY sort_order ASC;`,
      ),
    );
    return templates.map(t => {
      const id = str(t.id);
      return {
        ...mapTemplate(t),
        fields: fields.filter(f => str(f.template_id) === id).map(mapTemplateField),
      };
    });
  }

  async getTemplate(id: string): Promise<MeasurementTemplate | null> {
    const all = await this.listTemplates();
    return all.find(t => t.id === id) ?? null;
  }

  async updateDefaultPrices(
    prices: { id: string; defaultPrice: number }[],
  ): Promise<void> {
    const now = nowIso();
    await this.db.transaction(async tx => {
      for (const row of prices) {
        const price = Math.max(0, Number(row.defaultPrice) || 0);
        await tx.execute(
          `UPDATE garments SET
            default_price = ?, updated_at = ?, sync_status = 'pending'
           WHERE id = ? AND deleted_at IS NULL;`,
          [price, now, row.id],
        );
      }
    });
  }

  /**
   * Adds a shop-defined garment (e.g. "Bridal Lehenga") with a default price.
   * Appears in Garment prices and New Order selection.
   */
  async createCustomGarment(input: {
    name: string;
    defaultPrice?: number;
  }): Promise<Garment> {
    const name = input.name.trim();
    if (!name) {
      throw new ValidationError('Garment name is required.');
    }
    const now = nowIso();
    const id = createId();
    const code = customGarmentCode(name);
    const defaultPrice = Math.max(0, Number(input.defaultPrice) || 0);
    const maxSort = asRows(
      await this.db.execute(
        `SELECT MAX(sort_order) AS m FROM garments WHERE deleted_at IS NULL;`,
      ),
    )[0];
    const sortOrder = num(maxSort?.m) + 1;

    await this.db.execute(
      `INSERT INTO garments (
        id, name, code, is_custom, is_active, sort_order, default_price,
        created_at, updated_at, deleted_at, sync_status
      ) VALUES (?, ?, ?, 1, 1, ?, ?, ?, ?, NULL, 'pending');`,
      [id, name, code, sortOrder, defaultPrice, now, now],
    );

    const created = await this.db.execute(`SELECT * FROM garments WHERE id = ?;`, [id]);
    const row = asRows(created)[0];
    if (!row) {
      throw new NotFoundError('Garment was not created.');
    }
    return mapGarment(row);
  }
}

function customGarmentCode(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
  return `${slug || 'custom'}_${createId().slice(0, 8)}`;
}

function mapGarment(row: Row): Garment {
  return {
    id: str(row.id),
    name: str(row.name),
    code: str(row.code),
    isCustom: bool(row.is_custom),
    isActive: bool(row.is_active),
    sortOrder: num(row.sort_order),
    defaultPrice: num(row.default_price),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    deletedAt: strOrNull(row.deleted_at),
    syncStatus: str(row.sync_status) as Garment['syncStatus'],
  };
}

function mapTemplate(row: Row): Omit<MeasurementTemplate, 'fields'> {
  return {
    id: str(row.id),
    name: str(row.name),
    garmentId: strOrNull(row.garment_id),
    unitDefault: (str(row.unit_default) || 'in') as MeasurementUnit,
    isSystem: bool(row.is_system),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    deletedAt: strOrNull(row.deleted_at),
    syncStatus: str(row.sync_status) as MeasurementTemplate['syncStatus'],
  };
}

function mapTemplateField(row: Row): MeasurementTemplateField {
  return {
    id: str(row.id),
    templateId: str(row.template_id),
    key: str(row.key),
    label: str(row.label),
    unit: (strOrNull(row.unit) as MeasurementUnit | null) ?? null,
    sortOrder: num(row.sort_order),
    isRequired: bool(row.is_required),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    deletedAt: strOrNull(row.deleted_at),
    syncStatus: str(row.sync_status) as MeasurementTemplateField['syncStatus'],
  };
}
