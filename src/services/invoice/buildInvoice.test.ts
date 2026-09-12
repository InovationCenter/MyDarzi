import { buildInvoiceText, normalizeWhatsAppNumber } from './buildInvoice';
import type { Order, Payment } from '../../domain/types/models';
import type { Customer } from '../../domain/types/customer';

function sampleOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1',
    orderNumber: 'ORD-1001',
    customerId: 'c1',
    status: 'new',
    dueDate: '2026-09-01',
    fabricInfo: 'Cotton',
    color: 'Blue',
    instructions: null,
    notes: null,
    subtotal: 5000,
    discount: 0,
    total: 5000,
    measurementProfileId: null,
    items: [
      {
        id: 'i1',
        orderId: 'o1',
        garmentId: 'g1',
        garmentName: 'Shalwar Kameez',
        quantity: 1,
        unitPrice: 5000,
        lineTotal: 5000,
        notes: null,
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
        syncStatus: 'pending',
      },
    ],
    amountPaid: 1000,
    balance: 4000,
    createdAt: '',
    updatedAt: '',
    deletedAt: null,
    syncStatus: 'pending',
    ...overrides,
  };
}

describe('normalizeWhatsAppNumber', () => {
  it('converts PK local numbers to country code', () => {
    expect(normalizeWhatsAppNumber('03001234567')).toBe('923001234567');
  });

  it('keeps numbers that already have country code', () => {
    expect(normalizeWhatsAppNumber('+92 300 1234567')).toBe('923001234567');
  });

  it('returns null for empty', () => {
    expect(normalizeWhatsAppNumber('')).toBeNull();
    expect(normalizeWhatsAppNumber(null)).toBeNull();
  });
});

describe('buildInvoiceText', () => {
  it('includes shop, order, items, and balance', () => {
    const customer: Customer = {
      id: 'c1',
      name: 'Ali Khan',
      phone: '03001112222',
      whatsapp: null,
      address: null,
      notes: null,
      photoKey: null,
      createdAt: '',
      updatedAt: '',
      deletedAt: null,
      syncStatus: 'pending',
    };
    const payments: Payment[] = [
      {
        id: 'p1',
        orderId: 'o1',
        customerId: 'c1',
        amount: 1000,
        method: 'cash',
        kind: 'payment',
        note: null,
        paidAt: '2026-08-23T10:00:00.000Z',
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
        syncStatus: 'pending',
      },
    ];
    const text = buildInvoiceText({
      business: {
        id: 'b1',
        name: 'City Tailors',
        ownerName: null,
        phone: '042111',
        whatsapp: null,
        address: 'Lahore',
        logoKey: null,
        currency: 'PKR',
        defaultMeasurementUnit: 'in',
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
        syncStatus: 'pending',
      },
      customer,
      order: sampleOrder(),
      payments,
      currency: 'PKR',
    });

    expect(text).toContain('City Tailors');
    expect(text).toContain('ORD-1001');
    expect(text).toContain('Ali Khan');
    expect(text).toContain('Shalwar Kameez');
    expect(text).toContain('*Balance: PKR 4000*');
    expect(text).toContain('Cash');
  });
});
