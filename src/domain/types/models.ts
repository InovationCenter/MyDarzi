import type { SyncableEntity } from './entity';
import type {
  ExpenseCategory,
  InventoryCategory,
  MeasurementUnit,
  PaymentMethod,
  ProductionStatus,
  StaffRole,
} from '../constants';

export type BusinessProfile = SyncableEntity & {
  name: string;
  ownerName: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  logoKey: string | null;
  currency: string;
  defaultMeasurementUnit: MeasurementUnit;
};

export type Garment = SyncableEntity & {
  name: string;
  code: string;
  isCustom: boolean;
  isActive: boolean;
  sortOrder: number;
  /** Default unit price used to prefill new orders. */
  defaultPrice: number;
};

export type MeasurementTemplateField = SyncableEntity & {
  templateId: string;
  key: string;
  label: string;
  unit: MeasurementUnit | null;
  sortOrder: number;
  isRequired: boolean;
};

export type MeasurementTemplate = SyncableEntity & {
  name: string;
  garmentId: string | null;
  unitDefault: MeasurementUnit;
  isSystem: boolean;
  fields: MeasurementTemplateField[];
};

export type MeasurementValue = SyncableEntity & {
  profileId: string;
  fieldKey: string;
  fieldLabel: string;
  value: number | null;
  unit: MeasurementUnit;
};

export type MeasurementProfile = SyncableEntity & {
  customerId: string;
  templateId: string;
  name: string;
  unit: MeasurementUnit;
  notes: string | null;
  values: MeasurementValue[];
};

export type OrderItem = SyncableEntity & {
  orderId: string;
  garmentId: string;
  garmentName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes: string | null;
};

export type Order = SyncableEntity & {
  orderNumber: string;
  customerId: string;
  status: ProductionStatus;
  dueDate: string | null;
  fabricInfo: string | null;
  color: string | null;
  instructions: string | null;
  notes: string | null;
  subtotal: number;
  discount: number;
  total: number;
  measurementProfileId: string | null;
  items: OrderItem[];
  amountPaid?: number;
  balance?: number;
};

export type Payment = SyncableEntity & {
  orderId: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  kind: 'payment' | 'adjustment' | 'reversal';
  note: string | null;
  paidAt: string;
};

export type ProductionEvent = SyncableEntity & {
  orderId: string;
  fromStatus: ProductionStatus | null;
  toStatus: ProductionStatus;
  note: string | null;
  changedAt: string;
};

export type DesignReference = SyncableEntity & {
  orderId: string;
  mediaKey: string;
  caption: string | null;
  kind: string;
};

export type Alteration = SyncableEntity & {
  orderId: string;
  customerId: string;
  problem: string;
  requestedChange: string | null;
  notes: string | null;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  cost: number | null;
};

export type InventoryItem = SyncableEntity & {
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  notes: string | null;
};

export type InventoryTransaction = SyncableEntity & {
  itemId: string;
  delta: number;
  reason: string | null;
  notes: string | null;
};

export type StaffMember = SyncableEntity & {
  name: string;
  role: StaffRole;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
};

export type Expense = SyncableEntity & {
  title: string;
  category: ExpenseCategory;
  amount: number;
  spentAt: string;
  notes: string | null;
};

export type ProfitReport = {
  income: number;
  expenses: number;
  profit: number;
};

export type SearchResult =
  | { type: 'customer'; id: string; title: string; subtitle: string | null }
  | { type: 'order'; id: string; title: string; subtitle: string | null }
  | { type: 'inventory'; id: string; title: string; subtitle: string | null }
  | { type: 'staff'; id: string; title: string; subtitle: string | null };

export type DashboardSnapshot = {
  ordersToday: number;
  dueToday: number;
  overdue: number;
  ready: number;
  outstandingBalance: number;
  recentCustomers: { id: string; name: string; phone: string | null }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    status: ProductionStatus;
    dueDate: string | null;
    balance: number;
  }[];
  actionableOrders: {
    id: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    status: ProductionStatus;
    dueDate: string | null;
  }[];
};
