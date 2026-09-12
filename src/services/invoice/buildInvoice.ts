import type { BusinessProfile, Order, Payment } from '../../domain/types/models';
import type { Customer } from '../../domain/types/customer';
import { PAYMENT_METHOD_LABELS } from '../../domain/constants';
import { customerMarkCode } from '../../shared/customerMark';

export type InvoiceData = {
  business: BusinessProfile | null;
  customer: Customer | null;
  order: Order;
  payments: Payment[];
  currency: string;
};

function money(amount: number, currency: string): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const formatted = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return `${currency} ${formatted}`;
}

/** Plain-text invoice suitable for WhatsApp / Share. */
export function buildInvoiceText(data: InvoiceData): string {
  const { business, customer, order, payments, currency } = data;
  const lines: string[] = [];

  const shop = business?.name?.trim() || 'MyDarzi';
  lines.push(`*${shop}*`);
  if (business?.phone) {
    lines.push(business.phone);
  }
  if (business?.address) {
    lines.push(business.address);
  }
  lines.push('');
  lines.push(`Invoice / Order: *${order.orderNumber}*`);
  if (customer) {
    lines.push(`Fabric mark: *#${customerMarkCode(customer.id)}*`);
  }
  if (order.dueDate) {
    lines.push(`Due date: ${order.dueDate}`);
  }
  lines.push('');

  if (customer) {
    lines.push(`Customer: ${customer.name}`);
    const contact = customer.whatsapp || customer.phone;
    if (contact) {
      lines.push(`Phone: ${contact}`);
    }
    if (customer.address) {
      lines.push(`Address: ${customer.address}`);
    }
    lines.push('');
  }

  lines.push('*Items*');
  for (const item of order.items) {
    lines.push(
      `• ${item.garmentName} × ${item.quantity} @ ${money(item.unitPrice, currency)} = ${money(item.lineTotal, currency)}`,
    );
  }
  lines.push('');

  if (order.discount > 0) {
    lines.push(`Subtotal: ${money(order.subtotal, currency)}`);
    lines.push(`Discount: ${money(order.discount, currency)}`);
  }
  lines.push(`*Total: ${money(order.total, currency)}*`);
  lines.push(`Paid: ${money(order.amountPaid ?? 0, currency)}`);
  lines.push(`*Balance: ${money(order.balance ?? 0, currency)}*`);

  if (order.fabricInfo) {
    lines.push('');
    lines.push(`Fabric: ${order.fabricInfo}`);
  }
  if (order.color) {
    lines.push(`Color: ${order.color}`);
  }
  if (order.notes) {
    lines.push(`Notes: ${order.notes}`);
  }

  if (payments.length > 0) {
    lines.push('');
    lines.push('*Payments*');
    for (const p of payments) {
      const method = PAYMENT_METHOD_LABELS[p.method] ?? p.method;
      const date = p.paidAt.slice(0, 10);
      lines.push(`• ${money(p.amount, currency)} — ${method} (${date})`);
    }
  }

  lines.push('');
  lines.push('Thank you for your order.');

  return lines.join('\n');
}

/**
 * Digits-only WhatsApp / phone for wa.me.
 * Pakistani local numbers starting with 0 become 92…
 */
export function normalizeWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  let digits = raw.replace(/\D/g, '');
  if (!digits) {
    return null;
  }
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0') && digits.length >= 10) {
    digits = `92${digits.slice(1)}`;
  }
  if (digits.length < 10) {
    return null;
  }
  return digits;
}
