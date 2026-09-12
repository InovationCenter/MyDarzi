import { buildOrderSpeechScript } from './orderSpeechScript';
import type { Order } from '../../domain/types/models';

const sampleOrder: Order = {
  id: 'o1',
  orderNumber: 'ORD-42',
  customerId: 'c1',
  status: 'stitching',
  dueDate: '2026-09-01',
  fabricInfo: 'Cotton',
  color: 'Blue',
  instructions: 'Slim fit',
  notes: null,
  subtotal: 5000,
  discount: 0,
  total: 5000,
  measurementProfileId: 'm1',
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
};

describe('buildOrderSpeechScript', () => {
  it('includes order, items, totals, and measurements', () => {
    const script = buildOrderSpeechScript(
      {
        order: sampleOrder,
        customerName: 'Ali',
        currency: 'PKR',
        measurementProfile: {
          name: 'SK',
          unit: 'in',
          values: [
            {
              id: 'v1',
              profileId: 'm1',
              fieldKey: 'chest',
              fieldLabel: 'Chest',
              value: 40,
              unit: 'in',
              createdAt: '',
              updatedAt: '',
              deletedAt: null,
              syncStatus: 'pending',
            },
          ],
        },
      },
      'en',
    );

    expect(script).toContain('ORD-42');
    expect(script).toContain('Fabric mark');
    expect(script).toContain('Ali');
    expect(script).toContain('Shalwar Kameez');
    expect(script).toContain('Chest');
    expect(script).toContain('40');
  });
});
