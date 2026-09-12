import type { SyncableEntity } from './entity';

export type Customer = SyncableEntity & {
  name: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  notes: string | null;
  photoKey: string | null;
};

export type CreateCustomerInput = {
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  notes?: string | null;
  photoKey?: string | null;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;
