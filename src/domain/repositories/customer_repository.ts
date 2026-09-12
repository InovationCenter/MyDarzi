import type {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from '../types/customer';

export interface CustomerRepository {
  create(input: CreateCustomerInput): Promise<Customer>;
  update(id: string, input: UpdateCustomerInput): Promise<Customer>;
  getById(id: string): Promise<Customer | null>;
  list(options?: { includeArchived?: boolean; query?: string }): Promise<Customer[]>;
  archive(id: string): Promise<void>;
}
