import type { PaymentMethod, ProductionStatus } from '../domain/constants';
import type { EnKey } from './en';

export function statusKey(status: ProductionStatus): EnKey {
  return `status.${status}` as EnKey;
}

export function paymentKey(method: PaymentMethod): EnKey {
  return `payment.${method}` as EnKey;
}
