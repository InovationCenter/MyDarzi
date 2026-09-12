export const PRODUCTION_STATUSES = [
  'new',
  'measurement',
  'cutting',
  'stitching',
  'finishing',
  'quality_check',
  'ready',
  'delivered',
] as const;

export type ProductionStatus = (typeof PRODUCTION_STATUSES)[number];

export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  new: 'New',
  measurement: 'Measurement',
  cutting: 'Cutting',
  stitching: 'Stitching',
  finishing: 'Finishing',
  quality_check: 'Quality Check',
  ready: 'Ready',
  delivered: 'Delivered',
};

export function nextProductionStatus(
  current: ProductionStatus,
): ProductionStatus | null {
  const idx = PRODUCTION_STATUSES.indexOf(current);
  if (idx < 0 || idx >= PRODUCTION_STATUSES.length - 1) {
    return null;
  }
  return PRODUCTION_STATUSES[idx + 1];
}

export const PAYMENT_METHODS = [
  'cash',
  'bank',
  'card',
  'mobile_wallet',
  'other',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank: 'Bank',
  card: 'Card',
  mobile_wallet: 'Mobile Wallet',
  other: 'Other',
};

export const GARMENT_SEEDS = [
  { code: 'shalwar_kameez', name: 'Shalwar Kameez', sortOrder: 1 },
  { code: 'kurta', name: 'Kurta', sortOrder: 2 },
  { code: 'shirt', name: 'Shirt', sortOrder: 3 },
  { code: 'trouser', name: 'Trouser', sortOrder: 4 },
  { code: 'suit', name: 'Suit', sortOrder: 5 },
  { code: 'waistcoat', name: 'Waistcoat', sortOrder: 6 },
  { code: 'dress', name: 'Dress', sortOrder: 7 },
  { code: 'custom', name: 'Custom', sortOrder: 8, isCustom: true },
] as const;

export const INVENTORY_CATEGORIES = [
  'fabric',
  'thread',
  'buttons',
  'zippers',
  'lining',
  'other',
] as const;

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export const STAFF_ROLES = [
  'owner',
  'cutter',
  'stitcher',
  'finisher',
  'cashier',
  'delivery',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export type MeasurementUnit = 'in' | 'cm';

export const EXPENSE_CATEGORIES = [
  'rent',
  'utilities',
  'supplies',
  'salary',
  'transport',
  'other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
